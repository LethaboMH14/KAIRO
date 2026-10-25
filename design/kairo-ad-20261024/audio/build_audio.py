"""KAIRO 'When it clicks' — deterministic sound build: dialogue placement, original synthesised score and FX, stems, mix.

Inputs: timeline.json, voice/takes.json (whichever takes are current: temp, Aoede or human).
Outputs (48 kHz): out/stems/*.wav (exactly 20.000 s), out/kairo-when-it-clicks-mix.wav, build/voice-placement.json,
build/mux-audio.wav (trimmed to whole AAC frames so the MP4 stays exactly 20.000 s), build/lipsync/*.json (Rhubarb).

Nothing here is sampled from existing music; every musical/FX sound is generated from numbers below.
"""
from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[1]
TL = json.loads((HERE / 'timeline.json').read_text(encoding='utf-8'))
TAKES = json.loads((HERE / 'voice/takes.json').read_text(encoding='utf-8'))
SR = 48000
N = int(SR * TL['format']['seconds'])
OUT = HERE / 'out'
STEMS = OUT / 'stems'
BUILD = HERE / 'build'
RHUBARB = ROOT / 'tools/character/rhubarb/rhubarb.exe'


def db(x):
    return 10 ** (x / 20)


def sec(t):
    return int(round(t * SR))


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x, axis=0)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x, axis=0)


def env(n, attack, release, shape=2.0):
    e = np.ones(n, np.float64)
    a, r = min(n, sec(attack)), min(n, sec(release))
    if a:
        e[:a] = np.linspace(0, 1, a) ** shape
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** shape
    return e


def add(buf, sig, t, gain=1.0, pan=0.0):
    i = sec(t)
    if i >= len(buf):
        return
    sig = sig[:len(buf) - i]
    if sig.ndim == 1:
        l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
        sig = np.stack([sig * l * math.sqrt(2), sig * r * math.sqrt(2)], axis=1)
    buf[i:i + len(sig)] += sig * gain


# ------------------------------------------------------------------ dialogue
def load_take(line):
    x, rate = sf.read(ROOT / 'design/kairo-ad-20261024' / line['file'], dtype='float64')
    if x.ndim > 1:
        x = x.mean(axis=1)
    if rate != SR:
        g = math.gcd(rate, SR)
        x = resample_poly(x, SR // g, rate // g)
    # trim silence: first/last sample above -42 dBFS (20 ms windows), keep 25 ms lead and 80 ms tail
    win = sec(0.02)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode='same'))
    live = np.where(rms > db(-42))[0]
    a, b = max(0, live[0] - sec(0.025)), min(len(x), live[-1] + sec(0.08))
    x = x[a:b] * env(b - a, 0.008, 0.04, 1.0)
    return x


def loudness_norm(x, target_rms_db):
    rms = math.sqrt(float(np.mean(x ** 2))) + 1e-12
    return x * db(target_rms_db) / rms


def room(x, seconds=0.28, wet=0.12, seed=7):
    rng = np.random.default_rng(seed)
    n = sec(seconds)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    y = np.convolve(x, ir)
    out = np.zeros(len(y))
    out[:len(x)] += x
    return out * (1 - wet) + y * wet


def dialogue():
    kairo = np.zeros((N, 2))
    chorus = np.zeros((N, 2))
    placement = []
    pans = {'c1': -0.28, 'c2': 0.28, 'c3': 0.0}
    by_id = {l['id']: l for l in TAKES['lines']}
    for group in ('chorus', 'kairo'):
        for item in TL['voice'][group]:
            x = load_take(by_id[item['id']])
            start = item['start']
            speech = len(x) / SR  # measured speech, before any reverb tail
            if group == 'chorus':
                x = lp(hp(x, 140), 7200)
                x = loudness_norm(x, -24.0)
                x = room(x)
                add(chorus, x, start, 1.0, pans[item['id']])
            else:
                x = hp(x, 75)
                x = loudness_norm(x, -19.5)
                add(kairo, x, start, 1.0, 0.0)
            dur = speech
            placement.append({'id': item['id'], 'speaker': 'KAIRO' if group == 'kairo' else 'Student thought',
                              'text': item['text'], 'words': len(item['text'].split()), 'start': round(start, 3),
                              'end': round(start + dur, 3), 'measured_seconds': round(dur, 3),
                              'slot': item['slot'], 'take': by_id[item['id']]['file'],
                              'take_kind': TAKES['kind']})
            if group == 'kairo':
                mono = (x / (np.max(np.abs(x)) + 1e-9) * 0.9 * 32767).astype(np.int16)
                lips = BUILD / 'lipsync'
                lips.mkdir(parents=True, exist_ok=True)
                sf.write(lips / f"{item['id']}.wav", mono, SR, subtype='PCM_16')
    # chorus has to be finished before the 3.0 s break; enforce rather than hope
    chorus[sec(2.985):] *= np.linspace(1, 0, N - sec(2.985))[:, None] ** 8
    chorus[sec(3.0):] = 0
    return kairo, chorus, placement


def checks(placement):
    problems = []
    k = sorted([p for p in placement if p['speaker'] == 'KAIRO'], key=lambda p: p['start'])
    c = [p for p in placement if p['speaker'] != 'KAIRO']
    if max(p['end'] for p in c) > 3.0:
        problems.append('chorus speech runs past 3.0 s')
    for a, b in zip(k, k[1:]):
        if a['end'] > b['start']:
            problems.append(f"{a['id']} overlaps {b['id']}")
    for p in k:
        if p['end'] > p['slot'][1] + 0.05 or p['start'] < p['slot'][0]:
            problems.append(f"{p['id']} outside its slot {p['slot']} ({p['start']}-{p['end']})")
    return problems


# ------------------------------------------------------------------ synthesis primitives (deterministic)
def tone(freq, seconds, partials=((1, 1.0),), decay=None, attack=0.01, release=0.2, vibrato=0.0):
    n = sec(seconds)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for mult, amp in partials:
        ph = 2 * np.pi * freq * mult * t
        if vibrato:
            ph += vibrato * np.sin(2 * np.pi * 4.8 * t)
        sig += amp * np.sin(ph) * (np.exp(-t * decay * mult ** 0.5) if decay else 1)
    return sig * env(n, attack, release)


def pluck(freq, seconds=1.6, seed=0, bright=0.5):
    """Karplus-Strong string with a seeded excitation."""
    rng = np.random.default_rng(seed)
    n = sec(seconds)
    period = max(2, int(round(SR / freq)))
    buf = rng.uniform(-1, 1, period)
    buf = lp(buf, 2000 + 6000 * bright)
    out = np.zeros(n)
    for i in range(n):
        j = i % period
        out[i] = buf[j]
        buf[j] = 0.5 * (buf[j] + buf[(j + 1) % period]) * 0.996
    return out * env(n, 0.002, 0.3)


def mix(*sigs):
    """Sum signals of different lengths (zero-padded to the longest)."""
    n = max(len(x) for x in sigs)
    out = np.zeros(n)
    for x in sigs:
        out[:len(x)] += x
    return out


def noise(seconds, seed):
    return np.random.default_rng(seed).standard_normal(sec(seconds))


def bell(freq, seconds=2.4):
    return tone(freq, seconds, partials=((1, 1.0), (2.01, 0.42), (2.76, 0.24), (5.4, 0.08)), decay=1.6, attack=0.004, release=0.4)


def pad(freqs, seconds, attack=0.8, release=1.0, seed=3):
    n = sec(seconds)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    rng = np.random.default_rng(seed)
    for f in freqs:
        for det in (-0.6, 0.0, 0.7):
            ph = rng.uniform(0, 2 * np.pi)
            sig += np.sin(2 * np.pi * (f + det) * t + ph) * 0.33
            sig += 0.12 * np.sin(2 * np.pi * 2 * (f + det) * t + ph)
    sig = lp(sig, 2400)
    return sig / len(freqs) * env(n, attack, release, 1.5)


NOTE = {'D2': 73.42, 'A2': 110.0, 'D3': 146.83, 'F#3': 185.0, 'A3': 220.0, 'B3': 246.94, 'D4': 293.66, 'E4': 329.63,
        'F#4': 369.99, 'G4': 392.0, 'A4': 440.0, 'B4': 493.88, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99, 'A5': 880.0}


def music():
    m = np.zeros((N, 2))
    # 0-3 s: the controlled rise under the thoughts; hard stop at 3.000 s
    rise = np.zeros(sec(3.0))
    t = np.arange(len(rise)) / SR
    drone = np.sin(2 * np.pi * NOTE['D2'] * t) + 0.6 * np.sin(2 * np.pi * NOTE['A2'] * t) + 0.25 * np.sin(2 * np.pi * NOTE['D3'] * t)
    drone *= (0.25 + 0.75 * (t / 3.0) ** 1.4)
    sweep = noise(3.0, 11)
    sweep = np.concatenate([bp(sweep[i:i + 4800], 300 + 2600 * (i / len(sweep)) ** 1.5, 900 + 4200 * (i / len(sweep)) ** 1.5)
                            for i in range(0, len(sweep), 4800)])[:len(rise)]
    sweep *= (t / 3.0) ** 2.2
    rise = drone * db(-25) + sweep * db(-31)
    # quickening clock pulse (felt more than heard)
    beat_times = []
    bt = 0.15
    while bt < 2.95:
        beat_times.append(bt)
        bt += lerp(0.5, 0.25, bt / 3.0)
    for i, b in enumerate(beat_times):
        click = mix(tone(1900, 0.03, decay=90, attack=0.001, release=0.01), 0.6 * tone(950, 0.04, decay=60, attack=0.001, release=0.02))
        j = sec(b)
        rise[j:j + len(click)] += click[:len(rise) - j] * db(-38 + 6 * b / 3.0)
    rise[-sec(0.006):] *= np.linspace(1, 0, sec(0.006))
    add(m, rise, 0.0, 1.0)
    # 3.38 s: KAIRO arrives — one warm chime, then air
    add(m, mix(bell(NOTE['D5']) * db(-27), bell(NOTE['A5'] * 1.0005, 2.0) * db(-35)), 3.38, 1.0, -0.1)
    add(m, pad([NOTE['D3'], NOTE['A3'], NOTE['F#4']], 12.6, attack=1.6, release=1.4) * db(-30), 3.7, 1.0)
    # 5-16 s: sparse warm pulse, 96 bpm, lifts at Operate
    beat = 60 / 96
    arp = ['D4', 'A4', 'F#4', 'E5', 'D4', 'B4', 'A4', 'F#5']
    k = 0
    tt = 5.0
    while tt < 15.7:
        name = arp[k % len(arp)]
        lift = tt >= 10.55
        g = db(-30 + (3 if lift else 0))
        add(m, pluck(NOTE[name], 1.4, seed=100 + k, bright=0.35 + (0.15 if lift else 0)) * g, tt, 1.0, -0.35 if k % 2 else 0.35)
        k += 1
        tt += beat
    add(m, tone(NOTE['D2'], 5.2, partials=((1, 1.0), (2, 0.35), (3, 0.12)), attack=0.25, release=1.2) * db(-26), 10.55, 1.0)
    add(m, pad([NOTE['A4'], NOTE['D5'], NOTE['F#5']], 5.0, attack=0.5, release=1.2) * db(-33), 10.6, 1.0)
    # 15.85-17.6: thin out back to the learner; 17.6 resolve on the brand
    add(m, pad([NOTE['D3'], NOTE['A3'], NOTE['E4'], NOTE['F#4']], 2.2, attack=0.4, release=0.9) * db(-31), 15.9, 1.0)
    add(m, mix(bell(NOTE['D5'], 2.2) * db(-25), bell(NOTE['F#5'], 2.0) * db(-33)), 17.6, 1.0, 0.1)
    add(m, pad([NOTE['D3'], NOTE['A3'], NOTE['D4'], NOTE['F#4'], NOTE['E5']], 2.15, attack=0.35, release=1.3) * db(-29), 17.62, 1.0)
    m[sec(19.55):] *= np.linspace(1, 0, N - sec(19.55))[:, None] ** 2
    return m


def lerp(a, b, u):
    return a + (b - a) * u


def fx():
    f = np.zeros((N, 2))
    for at, pan in ((0.16, 0.3), (1.10, -0.35), (1.60, 0.4)):
        tick = bp(noise(0.03, int(at * 100)), 1500, 6000) * env(sec(0.03), 0.001, 0.025) * 0.6
        tick = mix(tick, tone(1250, 0.08, decay=45, attack=0.001, release=0.04) * 0.5)
        add(f, tick, at, db(-31), pan)
    # dive into the laptop / return: soft air movement
    air = bp(noise(1.0, 21), 400, 3500) * (np.linspace(0, 1, sec(1.0)) ** 2.5) * env(sec(1.0), 0.05, 0.12)
    add(f, air, 3.05, db(-40))
    back = bp(noise(0.7, 22), 300, 2500) * (np.linspace(1, 0, sec(0.7)) ** 2) * env(sec(0.7), 0.02, 0.2)
    add(f, back, 15.85, db(-40))
    # interface taps and clicks: short, precise, quiet
    def click(seed, hi=3200, lo=1100):
        return mix(tone(hi, 0.012, decay=400, attack=0.0005, release=0.004),
                   0.7 * tone(lo, 0.03, decay=140, attack=0.0005, release=0.01),
                   bp(noise(0.01, seed), 2000, 9000) * env(sec(0.01), 0.0005, 0.008) * 0.4)
    add(f, click(31), 6.85, db(-27), 0.3)
    add(f, click(32, 3600, 1300), 9.45, db(-24), 0.35)
    add(f, click(33, 2600, 900), 10.55, db(-22), 0.25)
    # pencil/line lift
    line = hp(noise(0.45, 41), 2500) * env(sec(0.45), 0.08, 0.2) * (0.6 + 0.4 * np.sin(np.linspace(0, 14, sec(0.45))))
    add(f, line, 7.22, db(-41), -0.2)
    # rotor whir: harmonics of a rising rotation rate, plus fan air
    dur = 15.85 - 10.6
    n = sec(dur)
    t = np.arange(n) / SR
    rate = np.where(t < 1.1, 0.85 * (3 * (t / 1.1) ** 2 - 2 * (t / 1.1) ** 3), 0.85)
    phase = 2 * np.pi * np.cumsum(rate * 28) / SR  # 28 bars passing
    whir = (np.sin(phase) * 0.6 + np.sin(2 * phase) * 0.25 + np.sin(3 * phase) * 0.1) * np.minimum(1, rate / 0.85)
    hum = np.sin(2 * np.pi * 100 * t) * 0.18 * np.minimum(1, t / 0.4)
    fan = bp(noise(dur, 51), 500, 2200) * 0.35 * np.minimum(1, rate / 0.85) * (1 + 0.2 * np.sin(phase / 28 * 4))
    sig = (whir + hum + fan) * env(n, 0.05, 0.5)
    add(f, sig, 10.6, db(-33))
    # saved confirmation and card arrival
    add(f, tone(NOTE['A5'], 0.18, decay=18, attack=0.002, release=0.08) * 0.6, 13.85, db(-31))
    add(f, tone(NOTE['D5'] * 2, 0.22, decay=16, attack=0.002, release=0.1) * 0.5, 13.93, db(-31))
    sw = bp(noise(0.5, 61), 600, 4000) * np.sin(np.linspace(0, np.pi, sec(0.5))) ** 2
    add(f, sw, 14.25, db(-39), 0.3)
    return f


# ------------------------------------------------------------------ mix and checks
def duck(music_buf, voice_buf, depth_db=-6.0):
    v = np.abs(voice_buf).max(axis=1)
    win = sec(0.12)
    envv = np.convolve(v, np.ones(win) / win, mode='same')
    k = np.clip(envv / 0.02, 0, 1)
    k = np.convolve(k, np.ones(sec(0.15)) / sec(0.15), mode='same')
    return music_buf * (1 - (1 - db(depth_db)) * k)[:, None]


def limit(x, ceiling_db=-1.5, lookahead=0.005, release=0.09):
    """Look-ahead peak limiter on 4x-oversampled peaks: gain never lets a true peak exceed the ceiling."""
    from scipy.ndimage import minimum_filter1d
    from scipy.signal import lfilter
    c = db(ceiling_db)
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up[:len(x) * 4].reshape(-1, 4).max(axis=1)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    g = minimum_filter1d(g, size=2 * sec(lookahead) + 1)
    a = math.exp(-1 / (release * SR))
    smooth = lfilter([1 - a], [1, -a], g, zi=[g[0] * a])[0]
    g = np.minimum(g, smooth)
    y = x * g[:, None]
    peak = np.abs(resample_poly(y, 4, 1, axis=0)).max()
    return y * min(1.0, c / peak)


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(path, x.astype(np.float32), SR, subtype='PCM_24')


def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def ebur128(path):
    r = subprocess.run([ffmpeg(), '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind('Summary:'):]
    out = {}
    for key, label in (('integrated_lufs', 'I:'), ('lra_lu', 'LRA:'), ('true_peak_dbfs', 'Peak:')):
        i = tail.find(label)
        if i >= 0:
            out[key] = float(tail[i + len(label):].split()[0])
    return out


def lipsync(placement):
    if not RHUBARB.exists():
        return 'rhubarb missing'
    for p in placement:
        if p['speaker'] != 'KAIRO':
            continue
        wav = BUILD / 'lipsync' / f"{p['id']}.wav"
        dialog = BUILD / 'lipsync' / f"{p['id']}.txt"
        dialog.write_text(p['text'].replace('KAIRO', 'Cairo'), encoding='utf-8')
        out = BUILD / 'lipsync' / f"{p['id']}.json"
        subprocess.run([str(RHUBARB), '-f', 'json', '-d', str(dialog), '--extendedShapes', 'GHX', '-o', str(out), str(wav)],
                       check=True, capture_output=True)
    cues = []
    for p in placement:
        if p['speaker'] != 'KAIRO':
            continue
        data = json.loads((BUILD / 'lipsync' / f"{p['id']}.json").read_text(encoding='utf-8'))
        for c in data['mouthCues']:
            cues.append({'at': round(p['start'] + c['start'], 3), 'end': round(p['start'] + c['end'], 3), 'shape': c['value'], 'line': p['id']})
    (BUILD / 'kairo-lipsync.json').write_text(json.dumps({'source': 'Rhubarb Lip Sync 1.14.0 on the placed KAIRO takes, with dialog text',
                                                          'cues': cues}, indent=0), encoding='utf-8')
    return f'{len(cues)} cues'


def main():
    kairo, chorus, placement = dialogue()
    problems = checks(placement)
    mus = music()
    fxs = fx()
    voice = kairo + chorus
    mus_d = duck(mus, kairo, -7.0)
    mus_d = duck(mus_d, chorus, -4.0)  # keep the three thoughts intelligible over the rise
    mix = voice * db(0) + mus_d * db(0) + fxs * db(0)
    # loudness: aim near -16 LUFS integrated, then true-peak-safe ceiling
    mix = limit(mix * db(4.5), -1.5)
    for name, buf in (('dialogue-kairo', kairo), ('dialogue-chorus', chorus), ('dialogue', voice), ('music', mus_d), ('fx', fxs)):
        write(STEMS / f'{name}.wav', buf)
    write(OUT / 'kairo-when-it-clicks-mix.wav', mix)
    # mux copy: whole AAC frames only (937 x 1024 samples) so audio never extends the 20.000 s video
    mux = mix[:937 * 1024]
    write(BUILD / 'mux-audio.wav', mux)
    # entrant cut: the entrant's own opening (0-3 s) and close (16-17.6 s) replace the chorus and KAIRO's tag
    ent = kairo.copy()
    ent[:sec(3.0)] = 0
    ent[sec(16.0):] = 0
    ent_mix = limit((ent + mus_d + fxs) * db(4.5), -1.5)
    write(BUILD / 'mux-audio-entrant.wav', ent_mix[:937 * 1024])
    placement.sort(key=lambda p: p['start'])
    lips = lipsync(placement)
    report = {'lines': placement, 'problems': problems, 'loudness_mix': ebur128(OUT / 'kairo-when-it-clicks-mix.wav'),
              'samples': N, 'rate': SR, 'mux_samples': len(mux), 'lipsync': lips,
              'words': {'kairo': sum(p['words'] for p in placement if p['speaker'] == 'KAIRO'),
                        'chorus': sum(p['words'] for p in placement if p['speaker'] != 'KAIRO')}}
    (BUILD / 'voice-placement.json').write_text(json.dumps(report, indent=1), encoding='utf-8')
    print(json.dumps({k: report[k] for k in ('problems', 'loudness_mix', 'words', 'lipsync')}, indent=1))
    for p in placement:
        print(p['id'], p['start'], p['end'], p['measured_seconds'], p['text'])


if __name__ == '__main__':
    main()
