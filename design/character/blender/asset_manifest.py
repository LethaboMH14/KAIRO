"""Writes docs/character/asset-manifest.json: every shipped and source file with bytes, SHA-256, licence and origin.

  python design/character/blender/asset_manifest.py
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / 'studio/public/models/character'
RAIN = 'Derived from Rain Rig (CC) Blender Foundation | studio.blender.org, CC-BY 4.0; modified for KAIRO (see docs/character/README.md)'


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def entry(path, licence, origin):
    p = ROOT / path
    return {'path': path, 'bytes': p.stat().st_size, 'sha256': sha(p), 'licence': licence, 'origin': origin} if p.exists() else {'path': path, 'missing': True}


shipped = [
    entry('studio/public/models/character/kairo-teacher.glb', RAIN + '; KAIRO-authored hair, clothing, accents and clips',
          'design/character/blender/build_all.ps1 (Blender 4.5.14 export, glTF-Transform 4.5.1 WebP + meshopt)'),
    entry('studio/public/models/character/teacher-portrait.png', RAIN, 'Eevee render of the exported GLB (design/character/blender/glb_review.py)'),
    entry('studio/public/models/character/studio_small_09_1k.hdr', 'CC0 (Poly Haven, https://polyhaven.com/a/studio_small_09)', 'assets/reference/claude-kit/studio_small_09_1k.hdr; hash matches coordination/briefs/AVATAR-AND-PATHWAYS/assets.json'),
    entry('studio/public/models/character/CREDITS.txt', 'Attribution notice', 'docs/character (CC-BY credit shipped beside the assets)'),
]
for mp3 in sorted(PUBLIC.glob('audio/*.mp3')):
    rel = mp3.relative_to(ROOT).as_posix()
    shipped.append(entry(rel, 'Google Cloud Text-to-Speech output generated for KAIRO (synthetic voice)',
                         f'assets/reference/teacher/{mp3.name} (AVATAR-001, authored sentence)'))
for js in sorted(PUBLIC.glob('audio/*.visemes.json')):
    rel = js.relative_to(ROOT).as_posix()
    shipped.append(entry(rel, 'Timing data generated for KAIRO', 'Rhubarb Lip Sync 1.14.0 (MIT) on the decoded WAV with the transcript'))

sources = [
    entry('design/character/blender/kairo_teacher.blend', RAIN + '; contains Blender Studio CloudRig rig UI text (GPL)', 'build_teacher.py + teacher_hair.py + teacher_wardrobe.py'),
    entry('design/character/textures/skin_head.png', RAIN, 'make_textures.py from TEX-rain_body_diffuse.1003.png'),
    entry('design/character/textures/skin_body.png', RAIN, 'make_textures.py from TEX-rain_body_diffuse.1001.png'),
    entry('design/character/textures/skin_hands.png', RAIN, 'make_textures.py from TEX-rain_body_diffuse.1002.png with a geometry-derived palm mask'),
    entry('design/character/textures/eyes.png', RAIN + '; iris painted procedurally for KAIRO', 'make_textures.py from TEX-rain_eyes.png'),
    entry('design/character/textures/hair_twist_normal.png', 'KAIRO-authored', 'make_hair_textures.py (procedural)'),
    entry('design/character/textures/fabric_weave_normal.png', 'KAIRO-authored (currently unused by the shipped materials)', 'make_hair_textures.py (procedural)'),
]
inputs = [
    entry('assets/reference/claude-kit/rain-v3.zip', 'CC-BY 4.0 (Blender Studio)', 'https://studio.blender.org/characters/rain/v3/'),
    entry('tools/character/downloads/Rhubarb-Lip-Sync-1.14.0-Windows.zip', 'MIT (third-party components BSD/Boost/MIT, see tools/character/rhubarb/LICENSE.md)',
          'https://github.com/DanielSWolf/rhubarb-lip-sync/releases/tag/v1.14.0'),
]
tools = {
    'blender': '4.5.14 LTS (tools/blender-install.json)',
    'gltf-transform': '@gltf-transform/cli 4.5.1, MIT (tools/character/node)',
    'gltf-validator': 'gltf-validator 2.0.0-dev.3.10, Apache-2.0 (tools/character/node)',
    'rhubarb': 'Rhubarb Lip Sync 1.14.0, MIT (tools/character/rhubarb)',
    'python': 'system Python 3.11 with Pillow and numpy for texture and sheet scripts',
}
manifest = {
    'credit': 'Teacher based on Rain Rig (CC) Blender Foundation | studio.blender.org, CC-BY 4.0. Show this credit wherever the teacher appears.',
    'shipped': shipped, 'sources': sources, 'inputs': inputs, 'tools': tools,
    'totals': {'shippedBytes': sum(e.get('bytes', 0) for e in shipped)},
}
(ROOT / 'docs/character/asset-manifest.json').write_text(json.dumps(manifest, indent=1), encoding='utf8')
print('MANIFEST_DONE', manifest['totals'])
