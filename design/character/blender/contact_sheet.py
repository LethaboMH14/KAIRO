"""Builds the labelled rig-selection contact sheet from compare_bases.py renders (system Python + Pillow).

  python design/character/blender/contact_sheet.py <renders dir> <output png>
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
CONCEPT = ROOT / 'coordination/briefs/AVATAR-AND-PATHWAYS/concept-reference.png'

TILE = 420
PAD = 18
LABEL_H = 64


def font(size):
    for name in ('segoeui.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def fit(img, w, h):
    img = img.convert('RGB')
    scale = max(w / img.width, h / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - w) // 2, (img.height - h) // 2
    return img.crop((left, top, left + w, top + h))


def concept_face():
    img = Image.open(CONCEPT)
    # Bottom-row close-up of the concept teacher (decorative reference, not a rig).
    return img.crop((700, 645, 1090, 822))


ROWS = [
    ('Face, identical camera', TILE, [
        ('Concept target (image only)', concept_face()),
        ('Rain v3 as downloaded', Image.open(SRC / 'rain_face.png')),
        ('Rain v3, quick recolour only', Image.open(SRC / 'rain_restyle_face.png')),
        ('Finished MPFB example (CC0 rehearsal)', Image.open(SRC / 'rehearsal_face.png')),
    ]),
    ('Full body, identical camera', round(TILE * 1.5), [
        ('Rain v3 as downloaded', Image.open(SRC / 'rain_front.png')),
        ('Rain v3, quick recolour only', Image.open(SRC / 'rain_restyle_front.png')),
        ('Finished MPFB example (CC0 rehearsal)', Image.open(SRC / 'rehearsal_front.png')),
        ('Rain v3 three-quarter', Image.open(SRC / 'rain_three_quarter.png')),
    ]),
]

width = PAD + 4 * (TILE + PAD)
height = PAD + sum(h + LABEL_H + PAD for _, h, _ in ROWS) + 70
sheet = Image.new('RGB', (width, height), (246, 242, 233))
draw = ImageDraw.Draw(sheet)
draw.text((PAD, PAD), 'KAIRO teacher base comparison: same cameras, lights and world (Blender 4.5 Eevee)', fill=(23, 60, 52), font=font(26))
y = PAD + 52
for row_title, tile_h, items in ROWS:
    for i, (label, img) in enumerate(items):
        x = PAD + i * (TILE + PAD)
        sheet.paste(fit(img, TILE, tile_h), (x, y))
        draw.text((x, y + tile_h + 8), label, fill=(30, 40, 36), font=font(19))
    y += tile_h + LABEL_H + PAD
draw.text((PAD, height - 44), 'Recolours are a direction check: Rain\'s face shape, rig and eye/brow shaders are unchanged. Concept art is not a rig.', fill=(90, 96, 90), font=font(18))
OUT.parent.mkdir(parents=True, exist_ok=True)
sheet.save(OUT, optimize=True)
print('SHEET', OUT, sheet.size)
