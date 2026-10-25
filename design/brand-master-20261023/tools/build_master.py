"""Builds the KAIRO C master files from the measured fits.

Run from the project root after fit_symbol.py and fit_wordmark.py:
    python design/brand-master-20261023/tools/build_master.py
Writes master/*.svg, applied/*.svg, proofs/*.png and master/geometry.json. Units are reference pixels of the
selected reference (resolution independent); every master file is outlined paths with no font dependency.
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from shapely import affinity
from shapely.geometry import box
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fit_symbol as fs  # noqa: E402
import fit_wordmark as fw  # noqa: E402
from pathmark import build, parse_svg_path, rasterise, svg_path_arcs  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / "design/brand-master-20261023"
FONT = ROOT / "studio/src/experience/fonts/Manrope-wght.ttf"
PALETTE = {"chalk": "#F5F0E6", "moss": "#3E5144", "sage": "#A7AF91", "copper": "#AE7555", "graphite": "#252B28"}
# Rain's shirt colour: KAIRO_Shirt baseColorFactor (linear) 0.105, 0.150, 0.088 in kairo-teacher.glb build 6.
SHIRT_LINEAR = (0.105, 0.150, 0.088)


def linear_to_srgb(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


SHIRT = "#" + "".join(f"{round(linear_to_srgb(c) * 255):02X}" for c in SHIRT_LINEAR)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def contrast(a, b):
    def lum(h):
        def ch(c):
            c /= 255
            return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        r, g, bb = hex_rgb(h)
        return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(bb)
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


# ---- geometry ---------------------------------------------------------------------------------------------
def symbol_geometry(micro=False):
    d = json.loads((BASE / "fit/symbol-fit.json").read_text())
    v = np.array(list(d["regularised"]["params"].values()), float)
    params = fs.regular_build(v)
    if micro:
        # Micro mark (below 32 px): thinner stroke and shortened inner terminals open both gaps beside the lower
        # leg and the counter mouth enough to survive 16 px rendering. Centrelines otherwise unchanged.
        w = params.width
        params.width = params.width_b = w * 0.8
        ux, uy = math.cos(math.radians(v[5])), -math.sin(math.radians(v[5]))
        a0 = params.a[0]
        params.a[0] = (a0[0] - ux * 0.32 * w, a0[1] - uy * 0.32 * w)
        b0 = params.b[0]
        params.b[0] = (b0[0] + ux * 0.32 * w, b0[1] + uy * 0.32 * w)
        params.cap_a0 = params.cap_b0 = min(params.cap_a0, 0.45 * params.width)
    a, b = build(params)
    return affinity.translate(a, fs.CROP[0], fs.CROP[1]), affinity.translate(b, fs.CROP[0], fs.CROP[1]), params


def wordmark_geometry():
    d = json.loads((BASE / "fit/wordmark-fit.json").read_text())
    shared = d["regularised"]["shared"]
    glyphs = {}
    for name, (builder, _init, _bbox) in fw.GLYPHS.items():
        p = dict(d["regularised_params"][name])
        g = dict(shared)
        if name == "A":
            g["diag"] = p.pop("diag_a")
        glyphs[name] = builder(p, g)
    return glyphs, shared


def bounds(geoms):
    return unary_union(list(geoms)).bounds


def place(geoms, dx, dy, s=1.0):
    return [affinity.translate(affinity.scale(g, s, s, origin=(0, 0)), dx, dy) for g in geoms]


# ---- SVG writing --------------------------------------------------------------------------------------------
def svg_doc(paths, width, height, title, desc, background=None, extra=""):
    bg = f'<rect width="{width:.2f}" height="{height:.2f}" fill="{background}"/>' if background else ""
    body = "".join(f'<path fill="{fill}" d="{d}"/>' for fill, d in paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.2f} {height:.2f}" role="img" '
            f'aria-labelledby="t d"><title id="t">{title}</title><desc id="d">{desc}</desc>{bg}{body}{extra}</svg>\n')


def write(rel, text):
    path = BASE / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")
    return path


def outline(geoms):
    return svg_path_arcs(unary_union(list(geoms)), tol=0.01, digits=2)


# ---- raster proofs ------------------------------------------------------------------------------------------
def raster(geoms, size_wh, color, background, ss=8):
    """Anti-aliased RGB raster of geometry already placed in pixel coordinates."""
    w, h = size_wh
    cov = rasterise(list(geoms), (h, w), ss)
    fg, bg = np.array(hex_rgb(color), float), np.array(hex_rgb(background), float)
    img = bg * (1 - cov[..., None]) + fg * cov[..., None]
    return np.clip(img + 0.5, 0, 255).astype(np.uint8)


def fit_into(geoms, w, h, pad):
    x0, y0, x1, y1 = bounds(geoms)
    s = min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0))
    gw, gh = (x1 - x0) * s, (y1 - y0) * s
    return place(geoms, -x0 * s + (w - gw) / 2, -y0 * s + (h - gh) / 2, s)


def topology(geoms, px):
    """Ink and background components of the symbol rendered px tall (threshold at half coverage)."""
    x0, y0, x1, y1 = bounds(geoms)
    s = px / (y1 - y0)
    w = int(math.ceil((x1 - x0) * s)) + 4
    placed = place(geoms, -x0 * s + 2, -y0 * s + 2, s)
    cov = rasterise(placed, (px + 4, w), 8)
    ink = (cov >= 0.5).astype(np.uint8)
    n_ink = cv2.connectedComponents(ink, connectivity=8)[0] - 1
    n_bg = cv2.connectedComponents(1 - ink, connectivity=4)[0] - 1
    return {"height_px": px, "ink_parts": int(n_ink), "background_regions": int(n_bg),
            "intact": bool(n_ink == 2 and n_bg == 1)}


def main():
    a, b, params = symbol_geometry()
    ma, mb, micro_params = symbol_geometry(micro=True)
    glyphs, shared = wordmark_geometry()
    sym = [a, b]
    word = list(glyphs.values())
    cap = shared["yb"] - shared["yt"]
    x_space = params.width  # clear space unit X = symbol stroke width
    files = {}

    # Symbol masters (origin at the symbol's own top-left plus clear space).
    sx0, sy0, sx1, sy1 = bounds(sym)
    sw, sh = sx1 - sx0 + 2 * x_space, sy1 - sy0 + 2 * x_space
    sym_n = place(sym, -sx0 + x_space, -sy0 + x_space)
    for name, fill, label in [("kairo-symbol", PALETTE["moss"], "moss"), ("kairo-symbol-graphite", PALETTE["graphite"], "one-colour graphite"),
                              ("kairo-symbol-chalk", PALETTE["chalk"], "reversed chalk for dark grounds")]:
        files[name] = write(f"master/{name}.svg", svg_doc([(fill, outline(sym_n))], sw, sh, "KAIRO",
                            f"KAIRO pathmark, {label}. Clear space included: one stroke width on every side."))
    mx0, my0, mx1, my1 = bounds([ma, mb])
    micro_n = place([ma, mb], -mx0 + x_space * 0.8, -my0 + x_space * 0.8)
    files["kairo-symbol-micro"] = write("master/kairo-symbol-micro.svg", svg_doc(
        [(PALETTE["moss"], outline(micro_n))], mx1 - mx0 + 1.6 * x_space, my1 - my0 + 1.6 * x_space, "KAIRO",
        "KAIRO micro pathmark for symbol heights below 32 px: thinner stroke, wider gaps."))

    # Wordmark.
    wx0, wy0, wx1, wy1 = bounds(word)
    word_n = place(word, -wx0 + x_space * 0.5, -wy0 + x_space * 0.5)
    files["kairo-wordmark"] = write("master/kairo-wordmark.svg", svg_doc(
        [(PALETTE["moss"], outline(word_n))], wx1 - wx0 + x_space, wy1 - wy0 + x_space, "KAIRO", "KAIRO wordmark, outlined."))

    # Stacked lockup: the reference's own relative placement of symbol and wordmark.
    lock = sym + word
    lx0, ly0, lx1, ly1 = bounds(lock)
    lock_n = place(lock, -lx0 + x_space, -ly0 + x_space)
    lw, lh = lx1 - lx0 + 2 * x_space, ly1 - ly0 + 2 * x_space
    for name, fill, bg, label in [("kairo-lockup-stacked", PALETTE["moss"], None, "moss"),
                                  ("kairo-lockup-stacked-chalk", PALETTE["chalk"], None, "reversed chalk")]:
        files[name] = write(f"master/{name}.svg", svg_doc([(fill, outline(lock_n))], lw, lh, "KAIRO",
                            f"KAIRO stacked lockup, {label}; placement measured from the selected reference."))

    # Horizontal lockup (constructed): symbol 1.4 cap heights tall, centred on the cap height, gap 0.55 cap.
    s = 1.4 * cap / (sy1 - sy0)
    hs = place(sym, -sx0 * s, -sy0 * s, s)
    sym_h = (sy1 - sy0) * s
    hw_ = place(word, -wx0 + (sx1 - sx0) * s + 0.55 * cap, -wy0 + (sym_h - cap) / 2)
    hor = hs + hw_
    hx0, hy0, hx1, hy1 = bounds(hor)
    pad = 0.5 * cap
    hor_n = place(hor, -hx0 + pad, -hy0 + pad)
    for name, fill, label in [("kairo-lockup-horizontal", PALETTE["moss"], "moss"), ("kairo-lockup-horizontal-chalk", PALETTE["chalk"], "reversed chalk")]:
        files[name] = write(f"master/{name}.svg", svg_doc([(fill, outline(hor_n))], hx1 - hx0 + 2 * pad, hy1 - hy0 + 2 * pad, "KAIRO",
                            f"KAIRO horizontal lockup, {label}; constructed proportions, see README."))
    # Header sizes: the lockup is 2.4 cap heights tall, so its symbol drops below 32 px when the whole lockup is
    # under ~55 px; this variant swaps in the micro symbol at the same size and position.
    msx0, msy0, msx1, msy1 = bounds([ma, mb])
    ms = sym_h / (msy1 - msy0)
    hm = place([ma, mb], -msx0 * ms + ((sx1 - sx0) * s - (msx1 - msx0) * ms) / 2, -msy0 * ms, ms) + hw_
    hm_n = place(hm, -hx0 + pad, -hy0 + pad)
    files["kairo-lockup-horizontal-micro"] = write("master/kairo-lockup-horizontal-micro.svg", svg_doc(
        [(PALETTE["moss"], outline(hm_n))], hx1 - hx0 + 2 * pad, hy1 - hy0 + 2 * pad, "KAIRO",
        "KAIRO horizontal lockup with the micro symbol, for lockups under 55 px tall."))

    # App icon: chalk symbol on a moss tile; 22% corner radius, symbol width 62% of the tile.
    tile = 512
    icon_sym = fit_into(sym, tile, tile, tile * 0.19)
    icon_svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tile} {tile}" role="img" aria-labelledby="t">'
                f'<title id="t">KAIRO</title><rect width="{tile}" height="{tile}" rx="{tile * 0.22:.1f}" fill="{PALETTE["moss"]}"/>'
                f'<path fill="{PALETTE["chalk"]}" d="{outline(icon_sym)}"/></svg>\n')
    files["app-icon"] = write("applied/kairo-app-icon.svg", icon_svg)
    fav_sym = fit_into([ma, mb], 64, 64, 9)
    files["favicon"] = write("applied/kairo-favicon.svg",
                             f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="{PALETTE["moss"]}"/>'
                             f'<path fill="{PALETTE["chalk"]}" d="{outline(fav_sym)}"/></svg>\n')
    # Rain's shirt badge: one-colour chalk symbol, flat, no gradient (BRAND-DECISION).
    badge = fit_into(sym, 256, 256, 22)
    files["shirt-badge"] = write("applied/rain-shirt-badge.svg", svg_doc([(PALETTE["chalk"], outline(badge))], 256, 256, "KAIRO",
                                 "Flat one-colour chest badge for Rain's shirt; chalk on the shirt's moss-sage."))

    # Geometry record (construction values in reference pixels).
    geometry = {
        "units": "reference pixels of design/app-experience-20261023/assets/brand-reference.png",
        "symbol": {"stroke_width": round(params.width, 3), "centreline_A": [[round(x, 3), round(y, 3)] for x, y in params.a],
                   "fillets_A1_to_A4": [round(r, 3) for r in params.fillets], "centreline_B": [[round(x, 3), round(y, 3)] for x, y in params.b],
                   "inner_terminal_corner_radius": round(params.cap_a0, 3),
                   "inner_terminal_cut": "parallel to the lower leg (foot end and the arm's inner end)",
                   "outer_terminals": "semicircular (lower leg end and the arm's outer end)",
                   "shared_angle_deg": json.loads((BASE / "fit/symbol-fit.json").read_text())["regularised"]["params"]["theta_deg"],
                   "lower_leg_angle_deg": json.loads((BASE / "fit/symbol-fit.json").read_text())["regularised"]["params"]["phi_deg"],
                   "gap_arm_to_leg": round(a.distance(b), 3)},
        "micro": {"stroke_width": round(micro_params.width, 3), "use": "rendered symbol height below 32 px (master measured intact at 32 and 48 px, broken at 24 px and below)"},
        "wordmark": {"cap_height": round(cap, 3), **{k: round(v, 3) for k, v in shared.items()}},
        "clear_space": {"X": round(x_space, 3), "rule": "keep X (one symbol stroke width) clear on every side; 0.5 cap height for the horizontal lockup"},
        "horizontal_lockup": {"symbol_height_in_caps": 1.4, "gap_in_caps": 0.55, "vertical_alignment": "symbol centred on the cap height"},
        "palette": PALETTE, "rain_shirt_srgb": SHIRT,
        "contrast": {f"{a_}-on-{b_}": round(contrast(PALETTE[a_] if a_ in PALETTE else SHIRT, PALETTE[b_] if b_ in PALETTE else SHIRT), 2)
                     for a_, b_ in [("moss", "chalk"), ("graphite", "chalk"), ("chalk", "moss"), ("sage", "chalk"), ("copper", "chalk"),
                                    ("chalk", "shirt"), ("moss", "shirt"), ("chalk", "graphite"), ("moss", "sage")]},
    }

    # ---- verification: serialised files reproduce the geometry, no fonts, small-size topology -----------
    checks = {}
    for key, path in files.items():
        text = path.read_text(encoding="utf-8")
        checks[key] = {"bytes": path.stat().st_size, "has_viewBox": "viewBox=" in text, "has_text_or_font": ("<text" in text) or ("font-family" in text)}
    for label, geoms, file_key in [("symbol", sym_n, "kairo-symbol"), ("wordmark", word_n, "kairo-wordmark"),
                                   ("stacked", lock_n, "kairo-lockup-stacked"), ("horizontal", hor_n, "kairo-lockup-horizontal")]:
        text = files[file_key].read_text(encoding="utf-8")
        d = text.split(' d="')[1].split('"')[0]
        back = parse_svg_path(d)
        ref = unary_union(geoms)
        checks[file_key]["roundtrip_area_error_pct"] = round(100 * back.symmetric_difference(ref).area / ref.area, 4)
    checks["topology_master"] = [topology(sym, px) for px in (12, 16, 20, 24, 32, 48)]
    checks["topology_micro"] = [topology([ma, mb], px) for px in (12, 16, 20, 24, 32)]
    geometry["checks"] = checks
    write("master/geometry.json", json.dumps(geometry, indent=2))

    # ---- proofs ------------------------------------------------------------------------------------------
    proofs = BASE / "proofs"
    proofs.mkdir(exist_ok=True)
    # Size ladder: master and micro at small sizes on chalk and moss, drawn at 1:1 pixel size and enlarged x6.
    sizes = [12, 16, 20, 24, 32, 48]
    rows = []
    for geoms, fg, bg in [(sym, PALETTE["moss"], PALETTE["chalk"]), ([ma, mb], PALETTE["moss"], PALETTE["chalk"]),
                          (sym, PALETTE["chalk"], PALETTE["moss"]), ([ma, mb], PALETTE["chalk"], PALETTE["moss"])]:
        cells = []
        for px in sizes:
            cell = raster(fit_into(geoms, px + 4, px + 4, 2), (px + 4, px + 4), fg, bg)
            cells.append(cv2.resize(cell, ((px + 4) * 6, (px + 4) * 6), interpolation=cv2.INTER_NEAREST))
        hmax = max(c.shape[0] for c in cells)
        row = np.full((hmax + 20, sum(c.shape[1] for c in cells) + 20 * (len(cells) + 1), 3), hex_rgb(bg), np.uint8)
        x = 20
        for c in cells:
            row[10:10 + c.shape[0], x:x + c.shape[1]] = c
            x += c.shape[1] + 20
        rows.append(row)
    wmax = max(r.shape[1] for r in rows)
    ladder = np.vstack([np.pad(r, ((0, 0), (0, wmax - r.shape[1]), (0, 0)), constant_values=245) for r in rows])
    Image.fromarray(ladder).save(proofs / "size-ladder-x6.png")

    # Lockups and grounds.
    board = Image.new("RGB", (1800, 1200), hex_rgb(PALETTE["chalk"]))
    grounds = [("chalk", "moss"), ("moss", "chalk"), ("sage", "moss"), ("graphite", "chalk"), ("chalk", "graphite"), (None, None)]
    for i, (bgk, fgk) in enumerate(grounds[:5]):
        x, y = (i % 3) * 600, (i // 3) * 600
        cell = raster(fit_into(lock, 600, 600, 110), (600, 600), PALETTE[fgk], PALETTE[bgk])
        board.paste(Image.fromarray(cell), (x, y))
    shirt = raster(fit_into(sym, 600, 600, 200), (600, 600), PALETTE["chalk"], SHIRT)
    board.paste(Image.fromarray(shirt), (1200, 600))
    draw = ImageDraw.Draw(board)
    font = ImageFont.truetype(str(FONT), 22)
    for i, label in enumerate(["Moss on chalk", "Chalk on moss", "Moss on sage", "Graphite on chalk", "Chalk on graphite", f"Chalk on Rain's shirt {SHIRT}"]):
        x, y = (i % 3) * 600, (i // 3) * 600
        fill = hex_rgb(PALETTE["chalk"]) if i in (1, 4, 5) else hex_rgb(PALETTE["graphite"])
        draw.text((x + 24, y + 560), label, font=font, fill=fill)
    board.save(proofs / "lockups-on-grounds.png")

    # Horizontal lockup at header sizes, plus app icon tiles.
    head = Image.new("RGB", (1400, 420), hex_rgb(PALETTE["chalk"]))
    for i, hpx in enumerate([24, 32, 48]):
        x0_, y0_, x1_, y1_ = bounds(hor)
        sc = hpx / (y1_ - y0_)
        w_ = int((x1_ - x0_) * sc) + 8
        img = raster(place(hor, -x0_ * sc + 4, -y0_ * sc + 4, sc), (w_, hpx + 8), PALETTE["moss"], PALETTE["chalk"])
        head.paste(Image.fromarray(img), (40, 30 + i * 70))
        img2 = raster(place(hor, -x0_ * sc + 4, -y0_ * sc + 4, sc), (w_, hpx + 8), PALETTE["chalk"], PALETTE["moss"])
        head.paste(Image.fromarray(img2), (420, 30 + i * 70))
    for i, px in enumerate([180, 64, 48, 32, 16]):
        t = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        tile_rgb = raster(fit_into([ma, mb] if px <= 24 else sym, px, px, px * 0.19), (px, px), PALETTE["chalk"], PALETTE["moss"])
        mask = Image.new("L", (px * 4, px * 4), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, px * 4 - 1, px * 4 - 1], radius=int(px * 4 * 0.22), fill=255)
        t = Image.fromarray(tile_rgb).convert("RGBA")
        t.putalpha(mask.resize((px, px), Image.LANCZOS))
        head.paste(t, (800 + sum([180, 64, 48, 32, 16][:i]) + 24 * i, 40), t)
    head.save(proofs / "header-and-icons.png")

    # Overlay of the master symbol on the reference (the measurement proof).
    rgb, alpha, _ = fs.load_crop(fs.CROP)
    model = rasterise([affinity.translate(g, -fs.CROP[0], -fs.CROP[1]) for g in sym], alpha.shape)
    fs.overlay(alpha, model, proofs / "symbol-master-overlay-x6.png")
    walpha = fw.crop_alpha(fw.WORD)
    wmodel = fw.render(unary_union(word), fw.WORD)
    fs.overlay(walpha, wmodel, proofs / "wordmark-master-overlay-x5.png", scale=5)

    print(json.dumps({"files": {k: str(v.relative_to(ROOT)).replace("\\", "/") for k, v in files.items()},
                      "checks": checks, "contrast": geometry["contrast"], "shirt": SHIRT}, indent=1))


if __name__ == "__main__":
    main()
