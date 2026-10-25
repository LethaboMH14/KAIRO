"""Tiling detail normal maps for the teacher's locs and clothing (system Python + Pillow + numpy).

  python design/character/blender/make_hair_textures.py <output dir>

hair_twist_normal.png (256 x 512, OpenGL/glTF convention): U runs around a loc (one full turn), V along it
(one tile = 4 cm). Two plies twist around the loc three times per tile, with fine fibre noise on top.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(sys.argv[1])
W, H = 256, 512
u = (np.arange(W) + 0.5) / W
v = (np.arange(H) + 0.5) / H
uu, vv = np.meshgrid(u, v)
rng = np.random.default_rng(11)
phase = 2 * np.pi * (2 * uu + 3 * vv)          # two plies, three twists per tile
height = 0.5 + 0.5 * np.cos(phase)
height = height ** 1.6                            # rounder ply crowns, sharper grooves
fibre = np.zeros_like(height)
for k, amp in ((40, 0.05), (90, 0.03)):
    fibre += amp * np.sin(2 * np.pi * (k * (2 * uu + 3 * vv)) + rng.uniform(0, 6.28))
height = height + fibre
du = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5 * W
dv = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5 * H
strength = 0.012
n = np.dstack([-du * strength, dv * strength, np.ones_like(height)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
img = ((n * 0.5 + 0.5) * 255).round().astype(np.uint8)
Image.fromarray(img[::-1]).save(OUT / 'hair_twist_normal.png', optimize=True)

# fabric_weave_normal.png (256 x 256): a soft plain weave; one tile = 8 x 8 threads, tiled ~14x per UV unit.
S = 256
x = (np.arange(S) + 0.5) / S * 8
xx, yy = np.meshgrid(x, x)
warp = np.cos(np.pi * (xx % 1 - 0.5)) ** 2 * (0.6 + 0.4 * np.cos(np.pi * yy) * np.sign(np.cos(np.pi * xx)))
weft = np.cos(np.pi * (yy % 1 - 0.5)) ** 2 * (0.6 - 0.4 * np.cos(np.pi * xx) * np.sign(np.cos(np.pi * yy)))
h = np.maximum(warp, weft) + rng.normal(0, 0.02, (S, S))
gx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5 * S / 8
gy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * 0.5 * S / 8
nf = np.dstack([-gx * 0.25, gy * 0.25, np.ones_like(h)])
nf /= np.linalg.norm(nf, axis=2, keepdims=True)
Image.fromarray(((nf * 0.5 + 0.5) * 255).round().astype(np.uint8)[::-1]).save(OUT / 'fabric_weave_normal.png', optimize=True)
print('HAIR_TEXTURES_DONE', img.shape)
