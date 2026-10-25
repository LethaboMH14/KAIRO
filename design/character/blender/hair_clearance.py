"""Checks that the locs clear the clothes, body and face in the bind pose (raw, uncompressed GLB; numpy).

  python design/character/blender/hair_clearance.py <kairo-teacher.raw.glb> <report.json>

A hair vertex counts as inside a surface when it lies within 12 mm of it and behind the normals of all three of its
nearest surface vertices (one normal alone misreads thin edges such as the collar fold). Exits 1 if a hanging loc is
inside the shirt or the body, or a face-framing loc is inside the head, the shirt or the body. The bind pose only:
at runtime the hair springs' colliders keep the locs out of the neck, back, shoulders and cheeks.
"""
import json
import struct
import sys

import numpy as np

GATES = {'Teacher_HairBack': ('Teacher_Shirt', 'Teacher_Body'), 'Teacher_HairFrame': ('Teacher_Head', 'Teacher_Shirt', 'Teacher_Body')}
NEAR = 0.012


def load(path):
    data = open(path, 'rb').read()
    length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + length])
    base = 20 + length + 8

    def accessor(i):
        a = gltf['accessors'][i]
        view = gltf['bufferViews'][a['bufferView']]
        n = {'VEC3': 3}[a['type']]
        start = base + view.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = view.get('byteStride', 0) or 4 * n
        rows = np.lib.stride_tricks.as_strided(np.frombuffer(data, np.uint8, stride * (a['count'] - 1) + 4 * n, start),
                                               (a['count'], 4 * n), (stride, 1))
        return rows.copy().view(np.float32).reshape(a['count'], n).astype(np.float64)

    meshes = {}
    for mesh in gltf['meshes']:
        pos, nor = [], []
        for prim in mesh['primitives']:
            pos.append(accessor(prim['attributes']['POSITION']))
            nor.append(accessor(prim['attributes']['NORMAL']))
        meshes[mesh['name']] = (np.concatenate(pos), np.concatenate(nor))
    return meshes


def inside(points, surface, normals):
    hits = np.zeros(len(points), bool)
    for i in range(0, len(points), 400):
        chunk = points[i:i + 400]
        d2 = ((chunk[:, None, :] - surface[None, :, :]) ** 2).sum(-1)
        near = np.argpartition(d2, 3, axis=1)[:, :3]
        close = np.sqrt(d2[np.arange(len(chunk)), near[:, 0]]) < NEAR
        behind = (((chunk[:, None, :] - surface[near]) * normals[near]).sum(-1) < 0).all(1)
        hits[i:i + 400] = close & behind
    return hits


def main():
    meshes = load(sys.argv[1])
    report, failed = {}, False
    for hair, surfaces in GATES.items():
        points = meshes[hair][0]
        for name in surfaces:
            hits = inside(points, *meshes[name])
            heights = points[hits][:, 1]  # glTF is Y-up
            report[f'{hair} in {name}'] = {'vertices': int(len(points)), 'inside': int(hits.sum()),
                                          'heightRangeM': [round(float(heights.min()), 3), round(float(heights.max()), 3)] if hits.any() else None}
            failed |= bool(hits.any())
    with open(sys.argv[2], 'w', encoding='utf8') as f:
        json.dump({'nearM': NEAR, 'pose': 'bind', 'results': report, 'pass': not failed}, f, indent=1)
    for key, value in report.items():
        print(f"{key}: {value['inside']} of {value['vertices']} inside" + (f" at {value['heightRangeM']} m" if value['inside'] else ''))
    print('HAIR_CLEARANCE', 'FAIL' if failed else 'PASS')
    sys.exit(1 if failed else 0)


main()
