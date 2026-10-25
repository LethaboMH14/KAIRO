"""Builds the KAIRO teacher's texture sources from Rain v3's painted textures (system Python + Pillow + numpy).

  python design/character/blender/make_textures.py <Rain textures dir> <output dir> <hand_faces.json from uv_masks.py>

Outputs (sRGB PNG masters; the exporter writes web-sized copies):
  skin_head.png   4096  Rain head tile 1003, recoloured to a deep warm brown, freckles removed, lips deepened
  skin_body.png   2048  Rain body tile 1001, same mapping
  skin_hands.png  1024  Rain hands tile 1002, same mapping with lighter palms and nail beds kept
  eyes.png        2048  Rain eye texture with a new warm-brown iris (amber collarette, dark limbal ring)
  texture-report.json   measured source/target colours and the filter parameters

The mapping preserves Rain's painted variation as a per-channel ratio to the median skin colour, so blush,
lid tones and lip colour survive as relative changes on the new base tone.
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
HAND_FACES = Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)

# Target albedo (sRGB 0-255). Chosen against the two reference images: rich, warm, deep brown with a golden undertone.
TARGET_SKIN = np.array([122.0, 78.0, 54.0])
PALM_SKIN = np.array([172.0, 120.0, 98.0])
LIP_TINT = np.array([0.86, 0.80, 0.86])  # pulls lips toward a berry-mauve brown relative to the skin mapping
report = {'targetSkinSRGB': TARGET_SKIN.tolist()}


def srgb_to_lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055) * 255.0


def load(name):
    return np.asarray(Image.open(SRC / name).convert('RGB')).astype(np.float64)


def skin_mask(img):
    """Painted skin pixels (excludes the black background and the dark inner-mouth island)."""
    lum = img.mean(axis=2)
    return lum > 25


def median_skin(img, mask):
    return np.median(img[mask], axis=0)


def remove_freckles(img, zones, size):
    """Grey closing (dilate then erode) of each channel, applied only inside elliptical zones (u, v, ru, rv in 0-1)."""
    h, w, _ = img.shape
    pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    closed = np.asarray(pil.filter(ImageFilter.MaxFilter(size)).filter(ImageFilter.MinFilter(size))).astype(np.float64)
    yy, xx = np.mgrid[0:h, 0:w]
    weight = np.zeros((h, w))
    for u, v, ru, rv in zones:
        d = ((xx / w - u) / ru) ** 2 + ((yy / h - v) / rv) ** 2
        weight = np.maximum(weight, np.clip(1.5 - d * 1.5, 0, 1))
    # Only lift pixels that the closing made brighter (dark specks), never darken anything.
    lift = np.maximum(closed - img, 0) * weight[..., None]
    return img + lift


def recolour(img, mask, target, contrast=1.08, sat_boost=1.0):
    base = median_skin(img, mask)
    lin, base_lin, tgt_lin = srgb_to_lin(img), srgb_to_lin(base), srgb_to_lin(target)
    ratio = np.clip(lin / np.maximum(base_lin, 1e-4), 0.0, 6.0)
    lum_ratio = ratio.mean(axis=2, keepdims=True)
    chroma = ratio / np.maximum(lum_ratio, 1e-4)
    out = tgt_lin * np.power(lum_ratio, contrast) * np.power(chroma, sat_boost)
    res = lin_to_srgb(out)
    res[~mask] = img[~mask]
    return res, base


def lips_mask(h, w, cx, cy, rx, ry):
    yy, xx = np.mgrid[0:h, 0:w]
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    return np.clip(1.2 - d, 0, 1)


def save(arr, name, size=None):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if size and im.size[0] != size:
        im = im.resize((size, size), Image.LANCZOS)
    im.save(OUT / name, optimize=True)
    return im.size


# ---- head (tile 1003, 4096) ----
head = load('TEX-rain_body_diffuse.1003.png')
h, w, _ = head.shape
mask = skin_mask(head)
# Freckle zones measured on the 4096 tile: nose bridge and both cheeks.
zones = [(0.512, 0.535, 0.060, 0.050), (0.395, 0.575, 0.095, 0.050), (0.630, 0.575, 0.095, 0.050)]
head = remove_freckles(head, zones, size=13)
head_out, head_base = recolour(head, mask, TARGET_SKIN, contrast=1.10, sat_boost=1.05)
# Deepen the lips toward berry-brown: lips sit around (0.5, 0.627) of the tile.
lm = lips_mask(h, w, cx=0.5 * w, cy=0.627 * h, rx=0.060 * w, ry=0.032 * h)[..., None]
head_out = head_out * (1 - lm * (1 - LIP_TINT))
report['head'] = {'sourceMedianSRGB': head_base.round(1).tolist(), 'freckleZones': zones, 'closingSize': 13, 'size': save(head_out, 'skin_head.png')}

# ---- body (tile 1001, 2048) ----
body = load('TEX-rain_body_diffuse.1001.png')
bmask = skin_mask(body)
body_out, body_base = recolour(body, bmask, TARGET_SKIN, contrast=1.08)
report['body'] = {'sourceMedianSRGB': body_base.round(1).tolist(), 'size': save(body_out, 'skin_body.png')}

# ---- hands (tile 1002, 1024) ----
hands = load('TEX-rain_body_diffuse.1002.png')
hmask = skin_mask(hands)
hands_out, hands_base = recolour(hands, hmask, TARGET_SKIN, contrast=1.08)
# Palms are lighter on deep skin tones. The palm mask comes from geometry: hand faces whose rest-pose normal
# points down (Rain's T-pose palms face -Z; the nails sit on the up-facing side), rasterised in UV space.
hh, hw, _ = hands.shape
mask_img = Image.new('L', (hw, hh), 0)
draw = ImageDraw.Draw(mask_img)
faces = json.loads(HAND_FACES.read_text(encoding='utf8'))
for face in faces:
    down = -face['n'][2]
    weight = min(1.0, max(0.0, (down - 0.15) / 0.45))
    if weight > 0:
        draw.polygon([(u * hw, (1 - v) * hh) for u, v in face['uv']], fill=int(255 * weight))
mask_img = mask_img.filter(ImageFilter.GaussianBlur(3))
mask_img.save(OUT / 'palm_mask.png')
palm = np.asarray(mask_img).astype(np.float64) / 255.0
palm_rgb, _ = recolour(hands, hmask, PALM_SKIN, contrast=1.0)
hands_out = hands_out * (1 - palm[..., None] * 0.85) + palm_rgb * palm[..., None] * 0.85
report['hands'] = {'sourceMedianSRGB': hands_base.round(1).tolist(), 'palmTargetSRGB': PALM_SKIN.tolist(), 'size': save(hands_out, 'skin_hands.png')}

# ---- eyes (2048): replace Rain's blue iris ----
eyes = load('TEX-rain_eyes.png')
eh, ew, _ = eyes.shape
mx, mn = eyes.max(axis=2), eyes.min(axis=2)
sat = (mx - mn) / np.maximum(mx, 1)
# Rain's iris is the saturated blue disc near the centre of the texture; the window excludes a stray dark
# mark near the top edge.
window = np.zeros_like(sat, dtype=bool)
window[int(eh * 0.25):int(eh * 0.75), int(ew * 0.25):int(ew * 0.75)] = True
iris_px = ((sat > 0.25) | (mx < 120)) & window
ys, xs = np.nonzero(iris_px)
cx, cy = xs.mean(), ys.mean()
radius = np.percentile(np.hypot(xs - cx, ys - cy), 99.5) * 1.2  # a larger iris reads friendlier than Rain's
yy, xx = np.mgrid[0:eh, 0:ew]
r = np.hypot(xx - cx, yy - cy) / radius
theta = np.arctan2(yy - cy, xx - cx)
rng = np.random.default_rng(7)
# Radial fibres: sum of angular sines with random phases, slightly varied with radius.
fib = np.zeros_like(r)
for k, amp in ((23, 0.35), (41, 0.25), (67, 0.2), (113, 0.12)):
    fib += amp * np.sin(theta * k + rng.uniform(0, 6.28) + r * rng.uniform(1, 4))
fib = (fib - fib.min()) / (fib.max() - fib.min())
deep = np.array([58.0, 32.0, 18.0])
warm = np.array([122.0, 70.0, 34.0])
amber = np.array([176.0, 116.0, 52.0])
iris = deep + (warm - deep) * np.clip((r - 0.30) / 0.5, 0, 1)[..., None] * (0.55 + 0.45 * fib[..., None])
collar = np.exp(-((r - 0.44) / 0.07) ** 2)[..., None]
iris = iris * (1 - collar * 0.7) + amber * collar * 0.7 * (0.7 + 0.3 * fib[..., None])
limbal = np.clip((r - 0.86) / 0.14, 0, 1)[..., None]
iris = iris * (1 - limbal * 0.75) + np.array([30.0, 18.0, 12.0]) * limbal * 0.75
pupil = np.clip((0.32 - r) / 0.03, 0, 1)[..., None]
iris = iris * (1 - pupil) + np.array([8.0, 6.0, 6.0]) * pupil
edge = np.clip((1.02 - r) / 0.05, 0, 1)[..., None]
sclera = eyes * np.array([0.965, 0.945, 0.92])  # warm off-white instead of pure white
eyes_out = sclera * (1 - edge) + iris * edge
report['eyes'] = {'irisCentrePx': [round(cx, 1), round(cy, 1)], 'irisRadiusPx': round(float(radius), 1), 'size': save(eyes_out, 'eyes.png')}

(OUT / 'texture-report.json').write_text(json.dumps(report, indent=1), encoding='utf8')
print('TEXTURES_DONE', json.dumps(report))
