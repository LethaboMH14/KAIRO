"""Validate rendered cuts with ffprobe and a full FFmpeg decode; build contact sheets. Writes qa/validation.json.

Checks per file: container/stream metadata (ffprobe), decoded frame count (ffprobe -count_frames, full decode),
FFmpeg null-decode errors, black segments (blackdetect), audio clipping and tail silence (decoded PCM),
EBU R128 loudness/true peak, and how still the final second is (the closing hold must be readable).
"""
import json
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[1]
OUT = HERE / 'out'
QA = HERE / 'qa'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FFPROBE = HERE / '.cache/ffmpeg/ffprobe.exe'
FONT = ROOT / 'studio/src/experience/fonts/Manrope-wght.ttf'


def run(cmd):
    return subprocess.run([str(c) for c in cmd], capture_output=True, text=True)


def probe(path):
    if not FFPROBE.exists():
        return {'error': 'ffprobe not available'}
    r = run([FFPROBE, '-v', 'error', '-count_frames', '-show_entries',
             'format=duration,size,bit_rate,format_name:stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames,nb_read_frames,duration,sample_rate,channels,color_space',
             '-of', 'json', path])
    return json.loads(r.stdout) if r.returncode == 0 else {'error': r.stderr[-500:]}


def decode_errors(path):
    r = run([FFMPEG, '-v', 'error', '-i', path, '-f', 'null', '-'])
    return r.stderr.strip()


def black(path):
    r = run([FFMPEG, '-hide_banner', '-i', path, '-vf', 'blackdetect=d=0.05:pic_th=0.92:pix_th=0.08', '-an', '-f', 'null', '-'])
    return [ln.split('blackdetect')[1].strip() for ln in r.stderr.splitlines() if 'black_start' in ln]


def audio(path):
    r = subprocess.run([FFMPEG, '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'], capture_output=True)
    if not r.stdout:
        return {'present': False}
    x = np.frombuffer(r.stdout, np.float32).reshape(-1, 2)
    tail = x[-int(0.25 * 48000):]
    e = run([FFMPEG, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    s = e[e.rfind('Summary:'):]
    def grab(label):
        i = s.find(label)
        return float(s[i + len(label):].split()[0]) if i >= 0 else None
    return {'present': True, 'seconds': round(len(x) / 48000, 4), 'sample_peak_dbfs': round(20 * np.log10(np.abs(x).max() + 1e-12), 2),
            'clipped_samples': int(np.sum(np.abs(x) >= 0.999)), 'tail_250ms_rms_dbfs': round(20 * np.log10(np.sqrt(np.mean(tail ** 2)) + 1e-12), 1),
            'integrated_lufs': grab('I:'), 'true_peak_dbtp': grab('Peak:')}


def frames_at(path, times, size=(480, 270)):
    out = []
    for t in times:
        r = subprocess.run([FFMPEG, '-v', 'error', '-ss', f'{t:.3f}', '-i', str(path), '-frames:v', '1', '-f', 'rawvideo',
                            '-pix_fmt', 'rgb24', '-s', f'{size[0]}x{size[1]}', '-'], capture_output=True)
        out.append(Image.frombytes('RGB', size, r.stdout) if len(r.stdout) == size[0] * size[1] * 3 else Image.new('RGB', size))
    return out


def final_hold(path):
    r = subprocess.run([FFMPEG, '-v', 'error', '-sseof', '-1.0', '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', '192x108', '-'],
                       capture_output=True)
    f = np.frombuffer(r.stdout, np.uint8).reshape(-1, 108, 192).astype(np.float32)  # small enough that film grain averages out
    d = [float(np.mean(np.abs(a - b))) for a, b in zip(f, f[1:])]
    return {'frames': len(f), 'max_mean_abs_diff': round(max(d), 3) if d else None}


def sheet(path, name):
    times = [0.4 + i for i in range(20)]
    ims = frames_at(path, times)
    font = ImageFont.truetype(str(FONT), 18)
    s = Image.new('RGB', (480 * 5, 270 * 4), (20, 20, 20))
    d = ImageDraw.Draw(s)
    for i, (t, im) in enumerate(zip(times, ims)):
        x, y = (i % 5) * 480, (i // 5) * 270
        s.paste(im, (x, y))
        d.rectangle([x, y, x + 74, y + 26], fill=(0, 0, 0))
        d.text((x + 6, y + 3), f'{t:.1f}s', font=font, fill=(255, 255, 255))
    s.save(QA / f'contact-sheet-{name}.png')


def main():
    prev = QA / 'validation.json'
    results = json.loads(prev.read_text(encoding='utf-8')) if prev.exists() and len(sys.argv) > 1 else {}
    files = [OUT / f for f in sys.argv[1:]] if len(sys.argv) > 1 else sorted(OUT.glob('*.mp4'))
    for p in files:
        name = p.stem.replace('kairo-when-it-clicks-', '').replace('-1080p30', '')
        pr = probe(p)
        v = next((s for s in pr.get('streams', []) if s['codec_type'] == 'video'), {})
        a = next((s for s in pr.get('streams', []) if s['codec_type'] == 'audio'), {})
        res = {'file': str(p.relative_to(ROOT)).replace('\\', '/'), 'bytes': p.stat().st_size, 'ffprobe': pr,
               'decode_errors': decode_errors(p) or 'none', 'black_segments': black(p), 'audio': audio(p),
               'final_hold': final_hold(p)}
        checks = {
            'duration_20s': abs(float(pr.get('format', {}).get('duration', 0)) - 20.0) < 0.0005,
            'video_600_frames_decoded': v.get('nb_read_frames') == '600',
            'size_1920x1080': (v.get('width'), v.get('height')) == (1920, 1080),
            'fps_30': v.get('r_frame_rate') == '30/1' and v.get('avg_frame_rate') == '30/1',
            'h264_yuv420p': v.get('codec_name') == 'h264' and v.get('pix_fmt') == 'yuv420p',
            'aac_48k_stereo': a.get('codec_name') == 'aac' and a.get('sample_rate') == '48000' and a.get('channels') == 2,
            'no_decode_errors': res['decode_errors'] == 'none',
            'no_black_segments': not res['black_segments'],
            'no_clipping': res['audio'].get('clipped_samples', 1) == 0,
            'true_peak_below_minus1': (res['audio'].get('true_peak_dbtp') or 0) <= -1.0,
            'clean_audio_tail': (res['audio'].get('tail_250ms_rms_dbfs') or 0) < -50,
            'final_second_static': (res['final_hold'].get('max_mean_abs_diff') or 99) < 1.0,
        }
        checks = {k: bool(v) for k, v in checks.items()}
        res['checks'] = checks
        res['pass'] = bool(all(checks.values()))
        results[name] = res
        sheet(p, name)
        print(name, 'PASS' if res['pass'] else 'FAIL', {k: v for k, v in checks.items() if not v})
    (QA / 'validation.json').write_text(json.dumps(results, indent=1), encoding='utf-8')
    return 0 if all(results[k]['pass'] for k in results) else 1


if __name__ == '__main__':
    sys.exit(main())
