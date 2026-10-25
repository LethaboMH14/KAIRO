"""TEMP voice for the first cut — NOT KAIRO's approved voice and not a human recording.

Local, offline synthesis with Kokoro-82M (Apache-2.0 weights, hexgrad) via kokoro-onnx in the isolated
venv design/kairo-ad-20261024/.cache/tts-venv. Replace with the app's Aoede voice (generate-voice-aoede.mjs,
needs the user's own gcloud login) or a human/entrant recording; the audio build picks up whichever takes
voice/takes.json points to.

  design/kairo-ad-20261024/.cache/tts-venv/Scripts/python.exe design/kairo-ad-20261024/voice/temp_tts.py
"""
import hashlib
import json
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent
CACHE = PROJECT / '.cache/kokoro'
TL = json.loads((PROJECT / 'timeline.json').read_text(encoding='utf-8'))

VOICES = {'kairo': ('bf_emma', 0.94), 'chorus': ('bm_george', 1.06)}
import sys
ONLY = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None

kokoro = Kokoro(str(CACHE / 'kokoro-v1.0.onnx'), str(CACHE / 'voices-v1.0.bin'))
out_dir = HERE / 'temp'
out_dir.mkdir(exist_ok=True)
previous = json.loads((HERE / 'takes.json').read_text(encoding='utf-8')) if (HERE / 'takes.json').exists() else None
takes = {'kind': 'TEMP synthetic voice (Kokoro-82M, local). Not KAIRO approved voice; not a human or entrant recording.',
         'model': {'name': 'Kokoro-82M v1.0 (ONNX export by kokoro-onnx)', 'licence': 'Apache-2.0',
                   'onnx_sha256': hashlib.sha256((CACHE / 'kokoro-v1.0.onnx').read_bytes()).hexdigest(),
                   'voices_sha256': hashlib.sha256((CACHE / 'voices-v1.0.bin').read_bytes()).hexdigest()},
         'lines': []}
for group in ('kairo', 'chorus'):
    voice, speed = VOICES[group]
    if ONLY and group != ONLY and previous:
        takes['lines'] += [l for l in previous['lines'] if l['group'] == group]
        continue
    for item in TL['voice'][group]:
        text = item.get('tts_text', item['text'])
        samples, rate = kokoro.create(text, voice=voice, speed=speed, lang='en-gb')
        path = out_dir / f"{item['id']}.wav"
        sf.write(path, samples, rate, subtype='PCM_16')
        takes['lines'].append({'id': item['id'], 'group': group, 'text': item['text'], 'tts_text': text,
                               'voice': voice, 'speed': speed, 'file': f'voice/temp/{path.name}', 'rate': rate,
                               'raw_seconds': round(len(samples) / rate, 3),
                               'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        print(item['id'], voice, round(len(samples) / rate, 3), 's')
(HERE / 'takes.json').write_text(json.dumps(takes, indent=1), encoding='utf-8')
print('TAKES_READY')
