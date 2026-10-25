"""Replace the audio of already-rendered cuts without touching their pictures (video stream copied bit-for-bit).

Use after an audio-only change (mix, music, FX). If a KAIRO voice take changes, re-render instead: lip sync follows
the takes (make.py --from audio).

  python design/kairo-ad-20261024/audio/remux.py
"""
import subprocess
from pathlib import Path

import imageio_ffmpeg

HERE = Path(__file__).resolve().parents[1]
OUT = HERE / 'out'
FF = imageio_ffmpeg.get_ffmpeg_exe()
AUDIO = {'entrant': HERE / 'build/mux-audio-entrant.wav'}
for mp4 in sorted(OUT.glob('kairo-when-it-clicks-*-1080p30.mp4')):
    variant = mp4.stem.replace('kairo-when-it-clicks-', '').replace('-1080p30', '')
    audio = AUDIO.get(variant, HERE / 'build/mux-audio.wav')
    tmp = mp4.with_suffix('.remux.mp4')
    subprocess.run([FF, '-y', '-v', 'error', '-i', str(mp4), '-i', str(audio), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', str(tmp)], check=True)
    tmp.replace(mp4)
    print('remuxed', mp4.name, 'with', audio.name)
