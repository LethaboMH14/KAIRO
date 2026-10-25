"""Structural report for a GLB (system Python, no dependencies).

  python glb_inspect.py <file.glb> [report.json]

Checks the container, then reports byte budgets per mesh/morph/image/animation, skins, node names, morph
target names, accessor bounds sanity and NaN/Inf in float accessors. Exit code 1 if a structural problem is found.
"""
import json
import math
import struct
import sys
from pathlib import Path

COMPONENT = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(path):
    data = Path(path).read_bytes()
    magic, version, length = struct.unpack_from('<4sII', data, 0)
    problems = []
    if magic != b'glTF' or version != 2:
        problems.append('not a glTF 2.0 binary')
    if length != len(data):
        problems.append(f'header length {length} != file size {len(data)}')
    off, gltf, binc = 12, None, b''
    while off < len(data):
        clen, ctype = struct.unpack_from('<II', data, off)
        chunk = data[off + 8: off + 8 + clen]
        if ctype == 0x4E4F534A:
            gltf = json.loads(chunk.decode('utf8'))
        elif ctype == 0x004E4942:
            binc = chunk
        off += 8 + clen
    return gltf, binc, problems, len(data)


def accessor_bytes(g, idx):
    a = g['accessors'][idx]
    size = COMPONENT[a['componentType']][1] * NCOMP[a['type']] * a['count']
    if 'sparse' in a:
        s = a['sparse']
        size = s['count'] * (COMPONENT[s['indices']['componentType']][1] + COMPONENT[a['componentType']][1] * NCOMP[a['type']])
    return size


def read_floats(g, binc, idx, limit=200000):
    a = g['accessors'][idx]
    if a['componentType'] != 5126 or 'bufferView' not in a:
        return []
    bv = g['bufferViews'][a['bufferView']]
    n = NCOMP[a['type']]
    stride = bv.get('byteStride', 4 * n)
    base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    out = []
    for i in range(min(a['count'], limit)):
        out.extend(struct.unpack_from('<' + 'f' * n, binc, base + i * stride))
    return out


def main():
    path = sys.argv[1]
    g, binc, problems, total = load(path)
    rep = {'file': str(path), 'bytes': total, 'extensionsUsed': g.get('extensionsUsed', []), 'meshes': [], 'images': [], 'skins': [],
           'animations': [], 'materials': [m.get('name') for m in g.get('materials', [])], 'problems': problems}
    for m in g.get('meshes', []):
        entry = {'name': m.get('name'), 'primitives': len(m['primitives']), 'vertices': 0, 'attributeBytes': 0, 'morphTargets': 0, 'morphBytes': 0,
                 'targetNames': (m.get('extras') or {}).get('targetNames', [])}
        for p in m['primitives']:
            pos = p['attributes'].get('POSITION')
            if pos is not None:
                entry['vertices'] += g['accessors'][pos]['count']
                a = g['accessors'][pos]
                if 'min' not in a or 'max' not in a:
                    problems.append(f"{m.get('name')}: POSITION without min/max")
            for acc in p['attributes'].values():
                entry['attributeBytes'] += accessor_bytes(g, acc)
            if 'indices' in p:
                entry['attributeBytes'] += accessor_bytes(g, p['indices'])
            entry['morphTargets'] = max(entry['morphTargets'], len(p.get('targets', [])))
            for t in p.get('targets', []):
                for acc in t.values():
                    entry['morphBytes'] += accessor_bytes(g, acc)
            mat = g.get('materials', [])[p['material']] if 'material' in p else {}
            for slot in ('baseColorTexture', 'metallicRoughnessTexture'):
                texinfo = mat.get('pbrMetallicRoughness', {}).get(slot)
                if texinfo and f"TEXCOORD_{texinfo.get('texCoord', 0)}" not in p['attributes']:
                    problems.append(f"{m.get('name')}: material {mat.get('name')} samples {slot} but the primitive has no TEXCOORD_{texinfo.get('texCoord', 0)}")
            for slot in ('normalTexture', 'occlusionTexture', 'emissiveTexture'):
                texinfo = mat.get(slot)
                if texinfo and f"TEXCOORD_{texinfo.get('texCoord', 0)}" not in p['attributes']:
                    problems.append(f"{m.get('name')}: material {mat.get('name')} samples {slot} but the primitive has no TEXCOORD_{texinfo.get('texCoord', 0)}")
            for name, acc in p['attributes'].items():
                if name in ('POSITION', 'NORMAL'):
                    vals = read_floats(g, binc, acc)
                    if any(math.isnan(v) or math.isinf(v) for v in vals):
                        problems.append(f"{m.get('name')}: non-finite {name}")
        if entry['targetNames'] and len(entry['targetNames']) != entry['morphTargets']:
            problems.append(f"{m.get('name')}: targetNames {len(entry['targetNames'])} != targets {entry['morphTargets']}")
        rep['meshes'].append(entry)
    for i, img in enumerate(g.get('images', [])):
        size = g['bufferViews'][img['bufferView']]['byteLength'] if 'bufferView' in img else None
        rep['images'].append({'index': i, 'name': img.get('name'), 'mimeType': img.get('mimeType'), 'bytes': size})
    nodes = g.get('nodes', [])
    for s in g.get('skins', []):
        names = [nodes[j].get('name') for j in s['joints']]
        rep['skins'].append({'joints': len(s['joints']), 'names': names, 'inverseBindMatrices': 'inverseBindMatrices' in s})
    for a in g.get('animations', []):
        size = sum(accessor_bytes(g, smp['input']) + accessor_bytes(g, smp['output']) for smp in a['samplers'])
        dur = max((g['accessors'][smp['input']].get('max', [0])[0] for smp in a['samplers']), default=0)
        rep['animations'].append({'name': a.get('name'), 'channels': len(a['channels']), 'bytes': size, 'seconds': round(dur, 3)})
    rep['totals'] = {
        'meshAttributeBytes': sum(m['attributeBytes'] for m in rep['meshes']),
        'morphBytes': sum(m['morphBytes'] for m in rep['meshes']),
        'imageBytes': sum(i['bytes'] or 0 for i in rep['images']),
        'animationBytes': sum(a['bytes'] for a in rep['animations']),
        'vertices': sum(m['vertices'] for m in rep['meshes']),
        'drawPrimitives': sum(m['primitives'] for m in rep['meshes']),
    }
    out = json.dumps(rep, indent=1)
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(out, encoding='utf8')
    print(json.dumps({k: rep[k] for k in ('bytes', 'totals', 'problems', 'extensionsUsed')}, indent=1))
    for m in rep['meshes']:
        print(f"  mesh {m['name']}: v={m['vertices']} prims={m['primitives']} attr={m['attributeBytes']} morphs={m['morphTargets']} morphBytes={m['morphBytes']}")
    for i in rep['images']:
        print(f"  image {i['name']}: {i['mimeType']} {i['bytes']}")
    for s in rep['skins']:
        print(f"  skin joints={s['joints']}")
    for a in rep['animations']:
        print(f"  anim {a['name']}: {a['seconds']}s channels={a['channels']} bytes={a['bytes']}")
    sys.exit(1 if problems else 0)


main()
