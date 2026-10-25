"""Rasterise the approved KAIRO vector masters (design/brand-master-20261023/master/*.svg) at any size.

The masters contain only M/L/A/Z path commands with explicit coordinates, so this small parser converts arcs
to polylines (SVG 1.1 implementation notes F.6.5) and fills subpaths with the even-odd rule at 4x supersampling.
The logo is never redrawn or regenerated; colours are the master's or one of the palette pairs in its README.
"""
from __future__ import annotations

import math
import re
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw

from gfx import ROOT, from_pil

MASTER = ROOT / 'design/brand-master-20261023/master'
TOKEN = re.compile(r'[MLAZmlaz]|-?\d*\.?\d+(?:e-?\d+)?')


def _arc(x1, y1, rx, ry, phi, large, sweep, x2, y2, seg_per_rad=10):
    if rx == 0 or ry == 0:
        return [(x2, y2)]
    phi = math.radians(phi)
    cp, sp = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    rx, ry = abs(rx), abs(ry)
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    coef = math.sqrt(max(0.0, num / den)) if den else 0.0
    if large == sweep:
        coef = -coef
    cxp, cyp = coef * rx * y1p / ry, -coef * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        return a

    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not sweep and dt > 0:
        dt -= 2 * math.pi
    elif sweep and dt < 0:
        dt += 2 * math.pi
    n = max(4, int(abs(dt) * seg_per_rad * max(rx, ry) / 4))
    pts = []
    for i in range(1, n + 1):
        t = t1 + dt * i / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cp * x - sp * y + cx, sp * x + cp * y + cy))
    return pts


def parse_path(d: str):
    toks = TOKEN.findall(d)
    i, cmd, cur, start, sub, subs = 0, None, (0.0, 0.0), (0.0, 0.0), [], []
    while i < len(toks):
        tk = toks[i]
        if tk.isalpha():
            cmd = tk
            i += 1
            if cmd in 'Zz':
                if sub:
                    subs.append(sub)
                sub, cur = [], start
            continue
        if cmd == 'M':
            cur = (float(toks[i]), float(toks[i + 1])); i += 2
            if sub:
                subs.append(sub)
            sub, start = [cur], cur
            cmd = 'L'
        elif cmd == 'L':
            cur = (float(toks[i]), float(toks[i + 1])); i += 2
            sub.append(cur)
        elif cmd == 'A':
            rx, ry, phi, large, sweep, x, y = (float(t) for t in toks[i:i + 7]); i += 7
            sub.extend(_arc(cur[0], cur[1], rx, ry, phi, int(large), int(sweep), x, y))
            cur = (x, y)
        else:
            raise ValueError(f'Unsupported path command {cmd!r} in brand master')
    if sub:
        subs.append(sub)
    return subs


@lru_cache(maxsize=None)
def master(name: str):
    svg = (MASTER / name).read_text(encoding='utf-8')
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    paths = [(m.group(1), m.group(2)) for m in re.finditer(r'<path[^>]*fill="([^"]+)"[^>]*d="([^"]+)"', svg)]
    return vb, paths


@lru_cache(maxsize=None)
def logo(name: str, height: int, color: tuple | None = None) -> np.ndarray:
    """Premultiplied RGBA sprite of a master SVG at the given pixel height (viewBox incl. clear space)."""
    (vx, vy, vw, vh), paths = master(name)
    ss = 4
    scale = height / vh * ss
    w = int(math.ceil(vw * height / vh))
    out = Image.new('RGBA', (w, height), (0, 0, 0, 0))
    for fill, d in paths:
        mask = Image.new('L', (w * ss, height * ss), 0)
        for sub in parse_path(d):
            m = Image.new('L', mask.size, 0)
            ImageDraw.Draw(m).polygon([((x - vx) * scale, (y - vy) * scale) for x, y in sub], fill=255)
            mask = ImageChops.logical_xor(mask.convert('1'), m.convert('1')).convert('L')
        mask = mask.resize((w, height), Image.LANCZOS)
        rgb = color if color else tuple(int(fill.lstrip('#')[k:k + 2], 16) for k in (0, 2, 4))
        layer = Image.new('RGBA', (w, height), rgb + (0,))
        layer.putalpha(mask)
        out.alpha_composite(layer)
    return from_pil(out)
