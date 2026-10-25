"""Write SRT/WebVTT captions and a timed transcript from the measured voice placement (build/voice-placement.json).

Caption times are the placed takes' measured speech spans (silence-trimmed), not planned slots.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[1]
P = json.loads((HERE / 'build/voice-placement.json').read_text(encoding='utf-8'))
OUT = HERE / 'out'
DOCS = ROOT / 'docs/kairo-ad-production-20261024'


def stamp(t, sep=','):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}'


lines = sorted(P['lines'], key=lambda l: l['start'])
srt, vtt = [], ['WEBVTT', '']
for i, l in enumerate(lines, 1):
    end = l['end'] + 0.25
    text = l['text'] if l['speaker'] == 'KAIRO' else f"<i>{l['text']}</i>"
    srt += [str(i), f"{stamp(l['start'])} --> {stamp(end)}", text, '']
    vtt += [f"{stamp(l['start'], '.')} --> {stamp(end, '.')}", (f"<v KAIRO>{l['text']}" if l['speaker'] == 'KAIRO' else f"<v Student><i>{l['text']}</i>"), '']
OUT.mkdir(exist_ok=True)
(OUT / 'kairo-when-it-clicks.en.srt').write_text('\n'.join(srt), encoding='utf-8')
(OUT / 'kairo-when-it-clicks.en.vtt').write_text('\n'.join(vtt), encoding='utf-8')

kind = lines[0]['take_kind']
rows = ['| # | Speaker | Start (s) | End (s) | Measured speech (s) | Words | Slot | Line |', '|---|---|---|---|---|---|---|---|']
for i, l in enumerate(lines, 1):
    rows.append(f"| {i} | {l['speaker']} | {l['start']:.2f} | {l['end']:.2f} | {l['measured_seconds']:.2f} | {l['words']} | {l['slot'][0]:g}–{l['slot'][1]:g} | {l['text']} |")
k = sum(l['words'] for l in lines if l['speaker'] == 'KAIRO')
c = sum(l['words'] for l in lines if l['speaker'] != 'KAIRO')
md = f"""# Transcript — KAIRO “When it clicks” (first cut v0.1)

Generated from `design/kairo-ad-20261024/build/voice-placement.json` by `audio/captions.py`.

**Voice used in this cut:** {kind}

Measured speech is the silence-trimmed take length as placed on the timeline (−42 dBFS gate), not a planned slot or a read-time estimate. The chorus reverb tail is excluded from its measured length and is cut at the 3.0 s break.

{chr(10).join(rows)}

Word count (whitespace tokens, KAIRO counted as one word): KAIRO narration **{k}**, student thoughts **{c}**, total **{k + c}** spoken words. Chorus lines intentionally overlap near the end of 0–3 s; KAIRO never overlaps the chorus.

Captions: `design/kairo-ad-20261024/out/kairo-when-it-clicks.en.srt` and `.vtt` (thoughts in italics). The silent-readable cut burns the same lines in.
"""
DOCS.mkdir(parents=True, exist_ok=True)
(DOCS / 'TRANSCRIPT.md').write_text(md, encoding='utf-8')
print('captions', len(lines), 'words', k, c)
