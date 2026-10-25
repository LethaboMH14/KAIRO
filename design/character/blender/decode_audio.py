"""Decodes MP3 speech samples to 16-bit mono WAV for Rhubarb Lip Sync, using Blender's bundled audaspace.

  run-blender.ps1 -Script decode_audio.py -Out <dir of .mp3 files> -Mode wav
Writes <name>.wav next to each <name>.mp3 (no other dependencies; the MP3s are not modified).
"""
import sys
from pathlib import Path

import aud

ARGS = sys.argv[sys.argv.index('--') + 1:]
SRC = Path(ARGS[0])
for mp3 in sorted(SRC.glob('*.mp3')):
    wav = mp3.with_suffix('.wav')
    # Read samples into memory first (cache), then write; writing straight from the MP3 stream can fail on the
    # final partial frame with this ffmpeg build.
    sound = aud.Sound(str(mp3)).resample(16000, False).rechannel(1).cache()
    try:
        sound.write(str(wav), rate=16000, channels=aud.CHANNELS_MONO, format=aud.FORMAT_S16, container=aud.CONTAINER_WAV, codec=aud.CODEC_PCM)
    except aud.error as exc:
        print('WRITE_WARNING', mp3.name, exc, flush=True)
    print('DECODED', mp3.name, wav.stat().st_size if wav.exists() else 0, flush=True)
