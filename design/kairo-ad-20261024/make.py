"""Rebuild the KAIRO 'When it clicks' advert from its sources, in order. Offline; no browser; no paid calls.

  python design/kairo-ad-20261024/make.py                 # everything except voice generation
  python design/kairo-ad-20261024/make.py --from audio    # after replacing takes (Aoede, entrant, actor)
  python design/kairo-ad-20261024/make.py --only video,qa # recompose after editing timeline.json copy/timing

Steps: prepare -> motor -> audio -> kairo -> video -> qa. 'voice' (temp Kokoro takes) runs only with --temp-voice.
Lip sync depends on the takes, so any voice change must rerun audio and kairo.
"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
BLENDER = ROOT / 'tools/blender/blender-4.5.14-windows-x64/blender.exe'
STEPS = ['prepare', 'voice', 'motor', 'audio', 'kairo', 'video', 'qa']

INPUTS = [
    ('assets/kairo-ad-stills-20261024/01-student-overwhelmed.png', 'Fictional adult student, generated still by Codex AD-STILLS-036 (see its handoff for generator, prompt and rights). Not a real person, not the user, not a testimonial.'),
    ('assets/kairo-ad-stills-20261024/02-student-understanding.png', 'Same fictional student, closing still, AD-STILLS-036.'),
    ('assets/kairo-ad-stills-20261024/03-laptop-composite-plate.png', 'Over-the-shoulder plate with a blank laptop screen for compositing, AD-STILLS-036.'),
    ('studio/public/models/character/kairo-teacher.glb', 'Actual KAIRO teacher. Based on Rain Rig (CC) Blender Foundation | studio.blender.org, CC BY 4.0, with KAIRO modifications (CREDITS.txt).'),
    ('design/video-production-20261023/kairo-render.glb', 'Meshopt-decoded copy of kairo-teacher.glb for Blender import (VIDEO-PRODUCTION-003); same geometry and clips.'),
    ('studio/public/models/engineering/induction-motor.glb', 'Project-owned original motor (design/engineering/blender/build_motor.py); no third-party geometry.'),
    ('studio/src/engineering/motorGeometry.json', 'Section outlines sliced from the same motor meshes; used for the paper diagram and the match line.'),
    ('studio/public/models/engineering/poly_haven_studio_1k.hdr', 'Poly Haven studio HDRI, CC0.'),
    ('studio/public/models/character/studio_small_09_1k.hdr', 'Poly Haven studio_small_09, CC0.'),
    ('studio/src/experience/fonts/Manrope-wght.ttf', 'Manrope variable font, SIL OFL 1.1 (studio/src/experience/fonts/OFL.txt).'),
    ('design/brand-master-20261023/master/kairo-lockup-horizontal.svg', 'KAIRO C pathmark lockup master (BRAND-MASTER-001); rasterised, not redrawn. Not trademark-cleared.'),
    ('design/brand-master-20261023/master/kairo-lockup-horizontal-chalk.svg', 'Chalk lockup master.'),
    ('design/brand-master-20261023/master/kairo-symbol-chalk.svg', 'Chalk pathmark master (laptop sticker cue).'),
    ('studio/src/engineering/motorContent.ts', 'Real product copy: part names/roles, Operate caption, rotor-cage text.'),
    ('studio/src/engineering/teaching.ts', 'Real product copy: operate-mode practice prompt.'),
    ('studio/src/learning-flow/model.ts', 'Real product copy: My material / My lesson / Explore / My working.'),
    ('studio/src/character/rig.ts', 'App VISEMES table reused for KAIRO mouth shapes.'),
    ('tools/character/rhubarb/rhubarb.exe', 'Rhubarb Lip Sync 1.14.0 (MIT), local.'),
]


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def prepare():
    stills = HERE / 'source/stills'
    stills.mkdir(parents=True, exist_ok=True)
    items = []
    for rel, note in INPUTS:
        src = ROOT / rel
        entry = {'path': rel, 'sha256': sha(src) if src.exists() else None, 'bytes': src.stat().st_size if src.exists() else None, 'provenance': note}
        if rel.startswith('assets/kairo-ad-stills-20261024/'):
            dst = stills / src.name
            if src.exists():
                shutil.copy2(src, dst)
            entry['pinned_copy'] = str(dst.relative_to(ROOT)).replace('\\', '/')
        items.append(entry)
    (HERE / 'source/manifest.json').write_text(json.dumps({'inputs': items}, indent=1), encoding='utf-8')
    print('prepared', len(items), 'inputs')


def run(cmd):
    print('>', ' '.join(str(c) for c in cmd), flush=True)
    subprocess.run([str(c) for c in cmd], cwd=ROOT, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--from', dest='start', default='prepare', choices=STEPS)
    ap.add_argument('--only', default='')
    ap.add_argument('--temp-voice', action='store_true')
    a = ap.parse_args()
    steps = a.only.split(',') if a.only else STEPS[STEPS.index(a.start):]
    py = sys.executable
    for step in steps:
        if step == 'prepare':
            prepare()
        elif step == 'voice' and a.temp_voice:
            run([HERE / '.cache/tts-venv/Scripts/python.exe', HERE / 'voice/temp_tts.py'])
        elif step == 'motor':
            run([BLENDER, '-b', '--factory-startup', '--python', HERE / 'blender/render_motor.py'])
        elif step == 'audio':
            run([py, HERE / 'audio/build_audio.py'])
            run([py, HERE / 'audio/captions.py'])
        elif step == 'kairo':
            run([BLENDER, '-b', '--factory-startup', '--python', HERE / 'blender/render_kairo.py'])
        elif step == 'video':
            for variant, audio in (('master', 'mux-audio.wav'), ('silent', 'mux-audio.wav'), ('review', 'mux-audio.wav'), ('entrant', 'mux-audio-entrant.wav'), ('reduced', 'mux-audio.wav')):
                run([py, HERE / 'compose/build.py', '--variant', variant, '--audio', HERE / 'build' / audio])
        elif step == 'qa':
            run([py, HERE / 'qa/validate.py'])


if __name__ == '__main__':
    main()
