"""Exports UV polygons with geometric attributes so system Python can rasterise UV-space masks.

  run-blender.ps1 -Script uv_masks.py -BlendFile <Rain .blend> -Out <dir>
Writes <Out>/hand_faces.json: every body face on UDIM tile 1002 (the hands) with its 0-1 UV polygon and its
rest-pose world normal. make_textures.py turns faces whose normal points down (-Z, the palm side of Rain's
T-pose hands, verified against the nail positions in docs) into a palm mask.
"""
import json
import sys
from pathlib import Path

import bpy

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0])
OUT.mkdir(parents=True, exist_ok=True)

body = bpy.data.objects['GEO-rain-body']
mesh = body.data
uv = mesh.uv_layers.active.data
rot = body.matrix_world.to_3x3()
faces = []
for poly in mesh.polygons:
    us = [uv[i].uv.x for i in poly.loop_indices]
    if not (1.0 <= sum(us) / len(us) < 2.0):
        continue
    n = (rot @ poly.normal).normalized()
    c = body.matrix_world @ poly.center
    faces.append({'uv': [[round(uv[i].uv.x - 1.0, 5), round(uv[i].uv.y, 5)] for i in poly.loop_indices],
                  'n': [round(n.x, 4), round(n.y, 4), round(n.z, 4)], 'c': [round(c.x, 4), round(c.y, 4), round(c.z, 4)]})
(OUT / 'hand_faces.json').write_text(json.dumps(faces), encoding='utf8')
print('UV_MASKS_DONE', len(faces))
