"""Writes web-sized texture copies used by the GLB exporter (system Python + Pillow).

  python design/character/blender/prepare_web_textures.py

design/character/textures/<master>.png -> design/character/textures/web/<name>.png at the sizes below.
Masters stay untouched; the exporter embeds the web copies and glTF-Transform converts colour maps to WebP.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'textures'
WEB = ROOT / 'web'
WEB.mkdir(exist_ok=True)
SIZES = {'skin_head.png': 2048, 'skin_body.png': 1024, 'skin_hands.png': 1024, 'eyes.png': 1024,
         'hair_twist_normal.png': None}
for name, size in SIZES.items():
    img = Image.open(ROOT / name)
    if size and img.size[0] != size:
        img = img.resize((size, size), Image.LANCZOS)
    img.save(WEB / name, optimize=True)
    print('web', name, img.size, (WEB / name).stat().st_size)
