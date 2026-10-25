"""Writes docs/character/rig-map.json and morph-map.json from the deployed GLB (system Python, no dependencies).

  python design/character/blender/rig_map.py

Everything is read from studio/public/models/character/kairo-teacher.glb, so the maps describe what actually ships:
joint hierarchy (with the Rain DEF bone each joint was copied from), morph targets per mesh, clip names and lengths.
"""
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
GLB = ROOT / 'studio/public/models/character/kairo-teacher.glb'
DOCS = ROOT / 'docs/character'

SOURCE = {
    'pelvis': 'DEF-Pelvis', 'spine_01': 'DEF-Spine1', 'spine_02': 'DEF-Spine2', 'spine_03': 'DEF-Spine3', 'neck_01': 'DEF-Neck', 'head': 'DEF-Head',
    'eye_l': 'DEF-Eye.L', 'eye_r': 'DEF-Eye.R', 'hair_back_01': 'DEF-KAIRO-HairBack1 (authored)', 'hair_back_02': 'DEF-KAIRO-HairBack2 (authored)',
    'hair_back_03': 'DEF-KAIRO-HairBack3 (authored)',
}
for s, S in (('l', 'L'), ('r', 'R')):
    SOURCE.update({f'clavicle_{s}': f'DEF-Clavicle.{S}', f'upperarm_{s}': f'DEF-Upperarm1.{S}', f'upperarm_twist_01_{s}': f'DEF-Upperarm2.{S}',
                   f'lowerarm_{s}': f'DEF-Forearm1.{S}', f'lowerarm_twist_01_{s}': f'DEF-Forearm2.{S}', f'hand_{s}': f'DEF-Hand.{S}',
                   f'thigh_{s}': f'DEF-Thigh1.{S}', f'thigh_twist_01_{s}': f'DEF-Thigh2.{S}', f'calf_{s}': f'DEF-Shin1.{S}',
                   f'calf_twist_01_{s}': f'DEF-Shin2.{S}', f'foot_{s}': f'DEF-Foot.{S}', f'ball_{s}': f'DEF-Toe.{S}',
                   f'hair_side_{s}_01': f'DEF-KAIRO-HairSide.{S}1 (authored)', f'hair_side_{s}_02': f'DEF-KAIRO-HairSide.{S}2 (authored)'})
    for n in range(1, 4):
        SOURCE[f'thumb_0{n}_{s}'] = f'DEF-Thumb{n}.{S}'
    for finger, F in (('index', 'Index'), ('middle', 'Middle'), ('ring', 'Ring'), ('pinky', 'Pinky')):
        SOURCE[f'{finger}_metacarpal_{s}'] = f'DEF-{F}1.{S}'
        for n in range(1, 4):
            SOURCE[f'{finger}_0{n}_{s}'] = f'DEF-{F}{n + 1}.{S}'


def load():
    data = GLB.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + length].decode('utf8'))


def main():
    g = load()
    nodes = g['nodes']
    joints = set(g['skins'][0]['joints'])
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []):
            parent[c] = i
    bones = []
    for j in g['skins'][0]['joints']:
        p = parent.get(j)
        bones.append({'name': nodes[j]['name'], 'parent': nodes[p]['name'] if p in joints else None, 'source': SOURCE.get(nodes[j]['name'], '?')})
    morphs = {m['name']: (m.get('extras') or {}).get('targetNames', []) for m in g['meshes'] if (m.get('extras') or {}).get('targetNames')}
    acc = g['accessors']
    clips = []
    for a in g.get('animations', []):
        length = max(acc[s['input']].get('max', [0])[0] for s in a['samplers'])
        clips.append({'name': a['name'], 'seconds': round(length, 3), 'channels': len(a['channels'])})
    rig = {
        'asset': 'studio/public/models/character/kairo-teacher.glb', 'joints': len(bones), 'skins': len(g['skins']),
        'conventions': 'glTF Y-up; the teacher faces +Z; _l is her left (+X). Joint names follow the Unreal Engine mannequin scheme.',
        'bones': bones, 'clips': clips,
    }
    face = sorted({n for names in morphs.values() for n in names if not n.startswith('cor_')})
    correctives = sorted({n for names in morphs.values() for n in names if n.startswith('cor_')})
    morph_map = {
        'faceShapes': face, 'correctives': correctives, 'meshes': morphs,
        'notes': ('Face shapes were baked from Rain\'s own face controls (design/character/blender/face_shapes.py); names follow ARKit '
                  'blendshape naming. Correctives were Rain\'s driven finger shape keys, re-driven at runtime from exported joint angles.'),
    }
    (DOCS / 'rig-map.json').write_text(json.dumps(rig, indent=1), encoding='utf8')
    (DOCS / 'morph-map.json').write_text(json.dumps(morph_map, indent=1), encoding='utf8')
    print('RIG_MAP_DONE', len(bones), 'joints', len(face), 'face shapes', len(correctives), 'correctives', [c['name'] for c in clips])


main()
