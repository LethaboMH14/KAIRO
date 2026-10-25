"""Turn qa/validation.json into docs/kairo-ad-production-20261024/QA.md (measured values only)."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[1]
V = json.loads((HERE / 'qa/validation.json').read_text(encoding='utf-8'))
P = json.loads((HERE / 'build/voice-placement.json').read_text(encoding='utf-8'))

ORDER = ['master', 'master-web', 'silent', 'reduced', 'review', 'entrant']
rows = ['| Cut | Result | Duration (s) | Frames decoded | Video | Audio | Size | LUFS-I | True peak | Clipped | Tail RMS | Final-second change | Black segments |',
        '|---|---|---|---|---|---|---|---|---|---|---|---|---|']
for name in [n for n in ORDER if n in V] + [n for n in V if n not in ORDER]:
    r = V[name]
    f = r['ffprobe']
    v = next(s for s in f['streams'] if s['codec_type'] == 'video')
    a = next((s for s in f['streams'] if s['codec_type'] == 'audio'), {})
    au = r['audio']
    rows.append(f"| {name} | {'PASS' if r['pass'] else 'FAIL'} | {float(f['format']['duration']):.3f} | {v.get('nb_read_frames')} | "
                f"{v['codec_name']} {v.get('profile')} {v['width']}×{v['height']} {v['r_frame_rate']} {v['pix_fmt']} | "
                f"{a.get('codec_name')} {a.get('sample_rate')} Hz ×{a.get('channels')} | {r['bytes'] / 1e6:.1f} MB | {au.get('integrated_lufs')} | "
                f"{au.get('true_peak_dbtp')} dBTP | {au.get('clipped_samples')} | {au.get('tail_250ms_rms_dbfs')} dBFS | "
                f"{r['final_hold']['max_mean_abs_diff']} | {len(r['black_segments'])} |")
fails = {n: [k for k, ok in r['checks'].items() if not ok] for n, r in V.items() if not r['pass']}
lines = '\n'.join(f"| {p['id']} | {p['speaker']} | {p['start']:.2f} | {p['end']:.2f} | {p['measured_seconds']:.2f} | {p['text']} |" for p in P['lines'])
md = f"""# QA — KAIRO “When it clicks” v0.1

Produced by `design/kairo-ad-20261024/qa/validate.py` (raw results: `design/kairo-ad-20261024/qa/validation.json`).
Each file was probed with **ffprobe 9.0.2** (`-count_frames`, i.e. a full decode of the video stream), decoded again
in full by **FFmpeg** to a null sink (errors captured), scanned with `blackdetect` (≥ 92 % of pixels below 8 %
luma for ≥ 0.05 s), decoded to PCM for clipping and tail checks, and measured with `ebur128` (true peak).
“Final-second change” is the largest mean absolute difference between consecutive frames in the last second at
192×108 (film grain averages out at that size); under 1.0 means the end card is holding still.

{chr(10).join(rows)}

{'All cuts pass every automated check.' if not fails else 'Failures: ' + json.dumps(fails)}

Audio stream length is 19.989 s (937 AAC frames of 1024 samples) by design, so audio never extends the 20.000 s
video; the score is silent from 19.85 s. The MP4 container reports exactly 20.000 s.

## Measured voice placement (temp voice)

| Line | Speaker | Start | End | Measured speech (s) | Text |
|---|---|---|---|---|---|
{lines}

Mix (before AAC): integrated {P['loudness_mix'].get('integrated_lufs')} LUFS, true peak {P['loudness_mix'].get('true_peak_dbfs')} dBFS,
LRA {P['loudness_mix'].get('lra_lu')} LU. Placement problems found by the audio build: {P['problems'] or 'none'}.

## Visual inspection done

- Contact sheets (one frame per second) for every cut: `design/kairo-ad-20261024/qa/contact-sheet-*.png`, inspected.
- Before encoding: QA stills at checkpoints across all six beats (`design/kairo-ad-20261024/qa/stills/`), inspected
  and corrected (crash in 5.0–5.75 s, missing ✓ glyph in Manrope, connector crossing text, card/motor overlap,
  caption/super collision, reduced-motion motor match). This stood in for a separate moving proof clip.

## Not checked by machines

Phone-speaker intelligibility, comprehension after one viewing, voice quality and taste, colour on other displays,
and organiser format acceptance. See ACCEPTANCE.md.
"""
(ROOT / 'docs/kairo-ad-production-20261024/QA.md').write_text(md, encoding='utf-8')
print('QA.md written', 'fails' if fails else 'all pass')
