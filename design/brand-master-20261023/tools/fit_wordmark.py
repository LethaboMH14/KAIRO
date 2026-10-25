"""Constructs the geometric KAIRO wordmark as editable outlines fitted to the selected reference.

Run from the project root:  python design/brand-master-20261023/tools/fit_wordmark.py
The reference lettering is image-generated artwork, not a font. Each glyph is built from simple strokes
(stems, chevrons, a bowl and a rounded-rectangle O), so the master has no font dependency or licence.
Pass 1 fits every glyph freely; pass 2 shares one cap height, baseline, stem width, bar thickness and
K/R diagonal width across the word (the intended master) and reports the extra deviation that costs.
The A keeps its own heavier diagonals and apex overshoot: both are conventional optical corrections for a
pointed, crossbar-less letter, and forcing the K/R weight on it costs 8% of its overlap with the reference.
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.optimize import minimize
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pathmark import coverage_from_rgb, filleted_polyline, metrics, rasterise  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
REF = ROOT / "design/app-experience-20261023/assets/brand-reference.png"
OUT = ROOT / "design/brand-master-20261023/fit"
WORD = (145, 222, 440, 288)  # wordmark crop (left, top, right, bottom)


def rounded_rect(x0, y0, x1, y1, r_left, r_right):
    """Rectangle with separately rounded left and right corner pairs."""
    r_left = max(0.0, min(r_left, (x1 - x0) / 2, (y1 - y0) / 2))
    r_right = max(0.0, min(r_right, (x1 - x0) / 2, (y1 - y0) / 2))
    pts = []
    def arc(cx, cy, r, a0, a1, n=20):
        return [(cx + r * math.cos(a0 + (a1 - a0) * k / n), cy + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]
    pts += arc(x1 - r_right, y0 + r_right, r_right, -math.pi / 2, 0) if r_right else [(x1, y0)]
    pts += arc(x1 - r_right, y1 - r_right, r_right, 0, math.pi / 2) if r_right else [(x1, y1)]
    pts += arc(x0 + r_left, y1 - r_left, r_left, math.pi / 2, math.pi) if r_left else [(x0, y1)]
    pts += arc(x0 + r_left, y0 + r_left, r_left, math.pi, 1.5 * math.pi) if r_left else [(x0, y0)]
    return Polygon(pts)


def _extend(p, q, d):
    """Point q moved a further distance d along p->q."""
    dx, dy = q[0] - p[0], q[1] - p[1]
    n = math.hypot(dx, dy) or 1e-9
    return (q[0] + dx / n * d, q[1] + dy / n * d)


def chevron(a, v, b, width, fillet=0.0, join="mitre"):
    pts = [_extend(v, a, 30), v, _extend(v, b, 30)]
    line = filleted_polyline(pts, [fillet]) if fillet > 1e-6 else pts
    return LineString(line).buffer(width / 2, cap_style="flat", join_style=join, mitre_limit=10, quad_segs=16)


# ---- glyph builders: (params dict, shared dict) -> shapely geometry ---------------------------------
def glyph_k(p, g):
    yt, yb, s, sd = g["yt"], g["yb"], g["stem"], g["diag"]
    stem = box(p["x0"], yt, p["x0"] + s, yb)
    arms = chevron((p["tx"], yt), (p["vx"], p["vy"]), (p["bx"], yb), sd)
    arms = arms.intersection(box(p["x0"], yt, p["x0"] + 200, yb))
    return unary_union([stem, arms])


def glyph_a(p, g):
    yt, yb, sd = g["yt"], g["yb"], g["diag"]
    apex = (p["ax"], yt + p["apex_drop"])
    shape = chevron((p["lx"], yb), apex, (p["rx"], yb), sd, fillet=p["apex_fillet"], join="round")
    return shape.intersection(box(p["lx"] - 60, yt - 4, p["rx"] + 60, yb))


def glyph_i(p, g):
    return box(p["x0"], g["yt"], p["x0"] + g["stem"], g["yb"])


def glyph_r(p, g):
    yt, yb, s, sd, bar = g["yt"], g["yb"], g["stem"], g["diag"], g["bar"]
    x0, xb, ybowl = p["x0"], p["xb"], p["ybowl"]
    stem = box(x0, yt, x0 + s, yb)
    outer = rounded_rect(x0, yt, xb, ybowl, 0, p["r_out"])
    inner = rounded_rect(x0 + s, yt + bar, xb - p["side"], ybowl - bar, 0, p["r_in"])
    bowl = outer.difference(inner)
    leg = LineString([_extend((p["lx2"], yb), (p["lx1"], ybowl - bar / 2), 0), _extend((p["lx1"], ybowl - bar / 2), (p["lx2"], yb), 30)])
    leg = leg.buffer(sd / 2, cap_style="flat", join_style="mitre").intersection(box(x0, ybowl - bar, xb + 40, yb))
    return unary_union([stem, bowl, leg])


def glyph_o(p, g):
    yt, yb, bar = g["yt"], g["yb"], g["bar"]
    ov = p["overshoot"]
    outer = rounded_rect(p["x0"], yt - ov, p["x1"], yb + ov, p["r_out"], p["r_out"])
    inner = rounded_rect(p["x0"] + p["side"], yt - ov + bar, p["x1"] - p["side"], yb + ov - bar, p["r_in"], p["r_in"])
    return outer.difference(inner)


GLYPHS = {
    # name: (builder, initial params in absolute reference pixels, crop bbox)
    "K": (glyph_k, {"x0": 154.3, "tx": 205.5, "vx": 165.0, "vy": 258.5, "bx": 205.5}, (150, 229, 217, 284)),
    "A": (glyph_a, {"ax": 250.3, "apex_drop": 6.0, "lx": 224.5, "rx": 276.5, "apex_fillet": 2.0}, (213, 228, 288, 284)),
    "I": (glyph_i, {"x0": 290.2}, (286, 229, 308, 284)),
    "R": (glyph_r, {"x0": 313.3, "xb": 365.6, "ybowl": 266.0, "r_out": 11.0, "r_in": 5.0, "side": 12.5, "lx1": 341.0, "lx2": 359.0}, (309, 229, 370, 284)),
    "O": (glyph_o, {"x0": 372.4, "x1": 431.6, "r_out": 19.0, "r_in": 10.0, "side": 12.8, "overshoot": 0.0}, (368, 228, 436, 285)),
}
SHARED0 = {"yt": 233.0, "yb": 280.0, "stem": 13.2, "diag": 13.6, "bar": 11.0}


def crop_alpha(bbox):
    rgb = np.array(Image.open(REF).convert("RGB"))[bbox[1]:bbox[3], bbox[0]:bbox[2]]
    return coverage_from_rgb(rgb)[0]


def render(geom, bbox, ss=8):
    from shapely import affinity
    return rasterise([affinity.translate(geom, -bbox[0], -bbox[1])], (bbox[3] - bbox[1], bbox[2] - bbox[0]), ss)


def fit_glyph(name, shared, free_shared: list[str]):
    builder, init, bbox = GLYPHS[name]
    alpha = crop_alpha(bbox)
    keys = list(init) + free_shared
    x0 = np.array([init[k] for k in init] + [shared[k] for k in free_shared], float)

    def unpack(v):
        p = dict(zip(init, v[:len(init)]))
        g = dict(shared)
        g.update(zip(free_shared, v[len(init):]))
        return p, g

    def loss(v):
        p, g = unpack(v)
        try:
            model = render(builder(p, g), bbox, ss=4)
        except Exception:
            return 1e3
        return float(np.mean((model - alpha) ** 2))

    res = minimize(loss, x0, method="Powell", options={"maxiter": 6000, "maxfev": 6000, "xtol": 1e-3, "ftol": 1e-10})
    p, g = unpack(res.x)
    geom = builder(p, g)
    return {"params": {k: round(float(v), 4) for k, v in zip(keys, res.x)}, "loss": float(res.fun),
            **metrics(render(geom, bbox), alpha)}, p, g, geom


def word_metrics(geoms):
    alpha = crop_alpha(WORD)
    return metrics(render(unary_union(geoms), WORD), alpha)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {"reference": {"file": "design/app-experience-20261023/assets/brand-reference.png",
                            "sha256": hashlib.sha256(REF.read_bytes()).hexdigest(), "word_crop": WORD}}
    # Pass 1: free per glyph (each glyph may adjust shared values for itself).
    free, free_geoms, per_shared = {}, [], {}
    for name in GLYPHS:
        fs = {"K": ["yt", "yb", "stem", "diag"], "A": ["yt", "yb", "diag"], "I": ["yt", "yb", "stem"],
              "R": ["yt", "yb", "stem", "diag", "bar"], "O": ["yt", "yb", "bar"]}[name]
        rec, p, g, geom = fit_glyph(name, SHARED0, fs)
        free[name] = rec
        per_shared[name] = {k: g[k] for k in fs}
        free_geoms.append(geom)
    report["free"] = {"glyphs": free, "word": word_metrics(free_geoms)}

    # Pass 2: one value per shared quantity (median of the free fits), glyph shapes refitted around it.
    shared = dict(SHARED0)
    for key in shared:
        vals = [v[key] for v in per_shared.values() if key in v]
        if vals:
            shared[key] = float(np.median(vals))
    reg, reg_geoms, reg_params = {}, [], {}
    for name in GLYPHS:
        rec, p, g, geom = fit_glyph(name, shared, ["diag"] if name == "A" else [])
        if name == "A":
            p = dict(p, diag_a=g["diag"])
        reg[name] = rec
        reg_params[name] = {k: round(float(v), 4) for k, v in p.items()}
        reg_geoms.append(geom)
    report["regularised"] = {"shared": {k: round(v, 4) for k, v in shared.items()}, "glyphs": reg,
                             "word": word_metrics(reg_geoms)}
    report["regularised_params"] = reg_params
    (OUT / "wordmark-fit.json").write_text(json.dumps(report, indent=2))
    print(json.dumps({"free_word": report["free"]["word"], "regularised_word": report["regularised"]["word"],
                      "shared": report["regularised"]["shared"],
                      "glyph_iou": {k: (free[k]["iou"], reg[k]["iou"]) for k in GLYPHS}}, indent=2))


if __name__ == "__main__":
    main()
