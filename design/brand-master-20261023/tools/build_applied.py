"""Applied reproductions of the KAIRO C master: phone home, document, presentation and the path pattern.

Run from the project root after build_master.py:
    python design/brand-master-20261023/tools/build_applied.py
Each mockup is one list of drawing operations emitted twice, as SVG (applied/*.svg) and as a PNG preview
(proofs/applied-*.png), so the preview cannot drift from the file. Logo geometry is the outlined master; body
text uses Manrope (SIL OFL, bundled with the studio) and is ordinary text, not logo artwork.
Sample wording only: no learner record, institution, employer or real application is represented.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely import affinity
from shapely.geometry import LineString, box
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_master import BASE, FONT, PALETTE, bounds, hex_rgb, outline, place, symbol_geometry, wordmark_geometry  # noqa: E402
from pathmark import rasterise  # noqa: E402

C = PALETTE


def lockup_horizontal(height):
    """Outlined horizontal lockup scaled to `height` (symbol height), origin top-left."""
    a, b, _ = symbol_geometry()
    glyphs, shared = wordmark_geometry()
    sym, word = [a, b], list(glyphs.values())
    cap = shared["yb"] - shared["yt"]
    sx0, sy0, sx1, sy1 = bounds(sym)
    wx0, wy0, _, _ = bounds(word)
    s = 1.4 * cap / (sy1 - sy0)
    hs = place(sym, -sx0 * s, -sy0 * s, s)
    sym_h = (sy1 - sy0) * s
    hw = place(word, -wx0 + (sx1 - sx0) * s + 0.55 * cap, -wy0 + (sym_h - cap) / 2)
    geo = unary_union(hs + hw)
    k = height / sym_h
    return affinity.scale(geo, k, k, origin=(0, 0))


def lockup_stacked(width):
    a, b, _ = symbol_geometry()
    glyphs, _ = wordmark_geometry()
    geo = unary_union([a, b] + list(glyphs.values()))
    x0, y0, x1, _ = geo.bounds
    k = width / (x1 - x0)
    return affinity.scale(affinity.translate(geo, -x0, -y0), k, k, origin=(0, 0))


def ribbon(points, width):
    """Broad path pattern: constant-width ribbon with rounded corners (the symbol's construction language)."""
    from pathmark import filleted_polyline
    line = filleted_polyline(points, [width * 1.1] * (len(points) - 2), steps=32)
    return LineString(line).buffer(width / 2, cap_style="flat", join_style="round", quad_segs=24)


class Canvas:
    def __init__(self, w, h, background):
        self.w, self.h, self.ops = w, h, [("rect", 0, 0, w, h, background, 0)]

    def rect(self, x, y, w, h, fill, rx=0):
        self.ops.append(("rect", x, y, w, h, fill, rx))

    def geom(self, g, fill, x=0, y=0):
        self.ops.append(("geom", affinity.translate(g, x, y), fill))

    def text(self, x, y, size, fill, string, weight=500):
        self.ops.append(("text", x, y, size, fill, string, weight))

    def svg(self, title, desc):
        out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" role="img" aria-labelledby="t d">'
               f'<title id="t">{title}</title><desc id="d">{desc}</desc>']
        clip = box(0, 0, self.w, self.h)
        for op in self.ops:
            if op[0] == "rect":
                _, x, y, w, h, fill, rx = op
                out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"/>')
            elif op[0] == "geom":
                g = op[1].intersection(clip)
                if not g.is_empty:
                    out.append(f'<path fill="{op[2]}" d="{outline([g])}"/>')
            else:
                _, x, y, size, fill, string, weight = op
                out.append(f'<text x="{x}" y="{y}" font-family="Manrope, Arial, sans-serif" font-size="{size}" '
                           f'font-weight="{weight}" fill="{fill}">{string}</text>')
        out.append("</svg>\n")
        return "".join(out)

    def png(self, scale=1.0):
        w, h = int(self.w * scale), int(self.h * scale)
        img = np.zeros((h, w, 3), float)
        for op in self.ops:
            if op[0] == "rect":
                _, x, y, rw, rh, fill, rx = op
                mask = Image.new("L", (w * 2, h * 2), 0)
                ImageDraw.Draw(mask).rounded_rectangle([x * scale * 2, y * scale * 2, (x + rw) * scale * 2 - 1, (y + rh) * scale * 2 - 1],
                                                       radius=rx * scale * 2, fill=255)
                cov = np.asarray(mask.resize((w, h), Image.LANCZOS), float)[..., None] / 255
                img = img * (1 - cov) + np.array(hex_rgb(fill)) * cov
            elif op[0] == "geom":
                g = affinity.scale(op[1], scale, scale, origin=(0, 0))
                cov = rasterise([g], (h, w), 4)[..., None]
                img = img * (1 - cov) + np.array(hex_rgb(op[2])) * cov
        out = Image.fromarray(np.clip(img + 0.5, 0, 255).astype(np.uint8))
        draw = ImageDraw.Draw(out)
        for op in self.ops:
            if op[0] == "text":
                _, x, y, size, fill, string, weight = op
                font = ImageFont.truetype(str(FONT), max(1, int(size * scale)))
                try:
                    font.set_variation_by_axes([weight])
                except Exception:
                    pass
                draw.text((x * scale, y * scale), string, font=font, fill=hex_rgb(fill), anchor="ls")
        return out


def phone():
    c = Canvas(390, 844, C["chalk"])
    c.rect(0, 0, 390, 64, C["chalk"])
    c.geom(lockup_horizontal(26), C["moss"], 20, 20)
    c.rect(20, 92, 350, 210, C["moss"], 18)
    card = box(38, 110, 352, 284).buffer(18, quad_segs=16)
    c.geom(affinity.translate(ribbon([(250, 80), (250, 170), (420, 170)], 46), 0, 32).intersection(card), "#4E6353")
    c.text(40, 140, 13, C["chalk"], "Continue", 600)
    c.text(40, 176, 24, C["chalk"], "Follow the stock,", 700)
    c.text(40, 206, 24, C["chalk"], "not the guess.", 700)
    c.text(40, 270, 13, C["chalk"], "Step 2 of 3 · Stock control", 500)
    for i, (title, line) in enumerate([("My material", "1 reviewed source"), ("My evidence", "Keep your working"), ("My direction", "Connect it to a role")]):
        y = 330 + i * 92
        c.rect(20, y, 350, 78, "#FFFDF8", 14)
        c.text(40, y + 34, 16, C["graphite"], title, 700)
        c.text(40, y + 58, 13, "#596259", line, 500)
    c.rect(0, 772, 390, 72, C["moss"])
    for i, label in enumerate(["Home", "Material", "Studios", "Practise", "More"]):
        c.text(26 + i * 74, 816, 12, C["chalk"], label, 600)
    return c


def document():
    c = Canvas(1240, 1754, "#FFFFFF")  # A4 at 150 dpi
    c.geom(lockup_horizontal(46), C["moss"], 118, 118)
    c.text(1122 - 300, 150, 18, "#596259", "Learning evidence summary", 600)
    c.rect(118, 214, 1004, 2, "#D9DDCF")
    c.text(118, 300, 40, C["graphite"], "Stock reconciliation practice", 700)
    c.text(118, 350, 20, "#596259", "Sample document · not an accredited certificate", 500)
    body = ["Calculated the expected closing stock from the opening record, one delivery",
            "and recorded sales: 20 + 12 − 9 = 23 notebooks.",
            "Compared the expected count with the observed shelf count of 22 and listed",
            "which records to check before explaining the difference.",
            "Assistance used: one hint. Source: authored KAIRO stock-control example."]
    for i, line in enumerate(body):
        c.text(118, 440 + i * 40, 22, C["graphite"], line, 400)
    c.geom(ribbon([(-40, 1560), (700, 1560), (700, 1900)], 120), "#E3E7DA")
    c.text(118, 1660, 16, "#596259", "Generated from the learner's own saved work. Check every statement before sharing.", 500)
    return c


def presentation():
    c = Canvas(1920, 1080, C["moss"])
    c.geom(ribbon([(1180, -80), (1180, 520), (2100, 520)], 170), "#4E6353")
    c.geom(ribbon([(1500, -80), (1500, 250), (2100, 250)], 110), C["sage"])
    c.geom(lockup_horizontal(70), C["chalk"], 96, 96)
    c.text(96, 640, 92, C["chalk"], "Make room for what", 700)
    c.text(96, 750, 92, C["chalk"], "you could become.", 700)
    c.text(96, 860, 30, "#D9DDCF", "Learn with your own material, practise it and keep the evidence.", 500)
    return c


def pattern_card():
    c = Canvas(1200, 750, C["chalk"])
    c.geom(ribbon([(-60, 300), (420, 300), (420, 820)], 150), C["sage"])
    c.geom(ribbon([(1260, 120), (860, 120), (860, 820)], 150), "#D6DBC9")
    c.geom(lockup_stacked(300), C["moss"], 450, 230)
    return c


def main():
    jobs = [("phone-home", phone(), "KAIRO on a phone", "Sample home screen using the horizontal lockup and moss navigation."),
            ("document-summary", document(), "KAIRO document", "Sample evidence summary with a modest flat logo and conventional body text."),
            ("presentation-title", presentation(), "KAIRO presentation", "Title slide: chalk lockup in the safe area, broad path pattern cropped at the edge."),
            ("pattern-card", pattern_card(), "KAIRO pattern", "Broad path pattern behind a stacked lockup, cropped at the card edges.")]
    for name, canvas, title, desc in jobs:
        (BASE / "applied").mkdir(exist_ok=True)
        (BASE / f"applied/{name}.svg").write_text(canvas.svg(title, desc), encoding="utf-8", newline="\n")
        canvas.png(1.0 if canvas.w <= 1240 else 0.6).save(BASE / f"proofs/applied-{name}.png")
        print("wrote", name)


if __name__ == "__main__":
    main()
