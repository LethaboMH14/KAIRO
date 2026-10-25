"""Geometry, rasterisation and comparison helpers for the KAIRO C pathmark master.

The selected symbol reads as two constant-width strokes with rounded terminals:
  stroke A  foot terminal -> bottom-left -> top-left -> top -> inner joint -> lower-leg terminal
  stroke B  the detached upper arm
Each corner of stroke A is a fillet on the centreline, so the outside of a corner is an arc of radius
(fillet + width/2) and the inside is sharp when the fillet is no larger than width/2. Terminals are
rounded rectangles whose corner radius is a parameter (width/2 gives a semicircular end).

Coordinates are in reference-crop pixels: x to the right, y downward.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

import cv2
import numpy as np
from shapely.geometry import LineString, MultiPolygon, Polygon
from shapely.ops import unary_union

SS = 8  # supersampling factor for area coverage


@dataclass
class Params:
    a: list[tuple[float, float]]   # 6 centreline vertices of stroke A
    fillets: list[float]           # fillet radii at A1..A4
    width: float                   # stroke width (shared by A and B unless width_b is set)
    cap_a0: float                  # terminal corner radius at A0 (foot)
    cap_a5: float                  # terminal corner radius at A5 (lower leg)
    b: list[tuple[float, float]]   # 2 centreline points of stroke B (upper arm)
    cap_b0: float
    cap_b1: float
    width_b: float | None = None
    cut_a0_deg: float | None = None  # direction of the foot-end cut line; None = parallel to the lower leg
    cut_b0_deg: float | None = None  # direction of the arm's inner-end cut line; None = parallel to the lower leg

    def vector(self) -> np.ndarray:
        flat = [c for p in self.a for c in p] + list(self.fillets) + [self.width, self.cap_a0, self.cap_a5]
        flat += [c for p in self.b for c in p] + [self.cap_b0, self.cap_b1, self.width_b if self.width_b is not None else self.width]
        leg = math.degrees(math.atan2(self.a[5][1] - self.a[4][1], self.a[5][0] - self.a[4][0]))
        flat += [self.cut_a0_deg if self.cut_a0_deg is not None else leg, self.cut_b0_deg if self.cut_b0_deg is not None else leg]
        return np.array(flat, float)

    @staticmethod
    def from_vector(v: np.ndarray) -> "Params":
        v = list(map(float, v))
        a = [(v[2 * i], v[2 * i + 1]) for i in range(6)]
        fillets = v[12:16]
        width, cap_a0, cap_a5 = v[16:19]
        b = [(v[19], v[20]), (v[21], v[22])]
        cap_b0, cap_b1, width_b = v[23:26]
        cut_a0, cut_b0 = (v[26], v[27]) if len(v) > 27 else (None, None)
        return Params(a, fillets, width, cap_a0, cap_a5, b, cap_b0, cap_b1, width_b, cut_a0, cut_b0)


def _unit(dx: float, dy: float) -> tuple[float, float]:
    n = math.hypot(dx, dy) or 1e-9
    return dx / n, dy / n


def filleted_polyline(points: list[tuple[float, float]], radii: list[float], steps: int = 24) -> list[tuple[float, float]]:
    """Replaces each interior vertex by a circular arc of the given radius tangent to both segments."""
    out = [points[0]]
    for i in range(1, len(points) - 1):
        p0, p1, p2 = points[i - 1], points[i], points[i + 1]
        r = max(0.0, radii[i - 1])
        u1 = _unit(p0[0] - p1[0], p0[1] - p1[1])
        u2 = _unit(p2[0] - p1[0], p2[1] - p1[1])
        cos_t = max(-1.0, min(1.0, u1[0] * u2[0] + u1[1] * u2[1]))
        theta = math.acos(cos_t)  # interior angle between the two segments
        if r < 1e-6 or theta < 1e-3 or abs(math.pi - theta) < 1e-3:
            out.append(p1)
            continue
        t = r / math.tan(theta / 2)  # tangent distance from the vertex
        t = min(t, 0.49 * math.hypot(p0[0] - p1[0], p0[1] - p1[1]), 0.49 * math.hypot(p2[0] - p1[0], p2[1] - p1[1]))
        r_eff = t * math.tan(theta / 2)
        s1 = (p1[0] + u1[0] * t, p1[1] + u1[1] * t)
        s2 = (p1[0] + u2[0] * t, p1[1] + u2[1] * t)
        bis = _unit(u1[0] + u2[0], u1[1] + u2[1])
        d = r_eff / math.sin(theta / 2)
        c = (p1[0] + bis[0] * d, p1[1] + bis[1] * d)
        a1 = math.atan2(s1[1] - c[1], s1[0] - c[0])
        a2 = math.atan2(s2[1] - c[1], s2[0] - c[0])
        da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
        for k in range(steps + 1):
            a = a1 + da * k / steps
            out.append((c[0] + r_eff * math.cos(a), c[1] + r_eff * math.sin(a)))
    out.append(points[-1])
    return out


def _end_cap(stroke: Polygon, end: tuple[float, float], direction: tuple[float, float], width: float, corner: float) -> Polygon:
    """Rounds the two corners of the flat stroke end at `end` (the stroke's tip) with radius `corner`.

    The last `corner` of length is replaced by the points within `corner` of a cross-segment of half-length
    width/2 - corner, so corner = width/2 gives a semicircle whose far point is still the tip.
    """
    corner = max(0.0, min(width / 2, corner))
    if corner < 1e-6:
        return stroke
    ux, uy = direction
    nx, ny = -uy, ux
    h = width / 2 + 1
    cx, cy = end[0] - ux * corner, end[1] - uy * corner
    cut = Polygon([(cx + nx * h, cy + ny * h), (end[0] + ux * 1 + nx * h, end[1] + uy * 1 + ny * h),
                   (end[0] + ux * 1 - nx * h, end[1] + uy * 1 - ny * h), (cx - nx * h, cy - ny * h)])
    half = width / 2 - corner
    if half > 1e-6:
        core = LineString([(cx + nx * half, cy + ny * half), (cx - nx * half, cy - ny * half)])
    else:
        core = LineString([(cx, cy), (cx + ux * 1e-6, cy + uy * 1e-6)])
    keep = Polygon([(cx - ux * 0.01 + nx * h, cy - uy * 0.01 + ny * h), (end[0] + ux * 1 + nx * h, end[1] + uy * 1 + ny * h),
                    (end[0] + ux * 1 - nx * h, end[1] + uy * 1 - ny * h), (cx - ux * 0.01 - nx * h, cy - uy * 0.01 - ny * h)])
    cap = core.buffer(corner, quad_segs=24).intersection(keep)
    return unary_union([stroke.difference(cut), cap])


def _cut_piece(end: tuple[float, float], direction: tuple[float, float], width: float, corner: float,
               back: float, cut_dir: tuple[float, float]) -> Polygon:
    """Terminal piece ending on the line through `end` with direction `cut_dir`, both corners filleted.

    `direction` points out of the stroke towards the terminal. The piece starts `back` inside the stroke, where
    the stroke body (built with a flat end there) meets it.
    """
    ux, uy = direction
    nx, ny = -uy, ux
    h = width / 2
    cx_, cy_ = _unit(*cut_dir)
    det = -ux * cy_ + cx_ * uy
    if abs(det) < 1e-3:
        raise ValueError("the cut line cannot run along the stroke")
    # Along-stroke offset t where the side line (sign s) meets the cut line: d*t - c*u = -s*h*n.
    def offset(sgn):
        bx, by = -sgn * h * nx, -sgn * h * ny
        return (bx * -cy_ - (-cx_) * by) / det
    t_plus, t_minus = offset(1), offset(-1)
    c_plus = (end[0] + nx * h + ux * t_plus, end[1] + ny * h + uy * t_plus)
    c_minus = (end[0] - nx * h + ux * t_minus, end[1] - ny * h + uy * t_minus)
    b_plus = (end[0] + nx * h - ux * back, end[1] + ny * h - uy * back)
    b_minus = (end[0] - nx * h - ux * back, end[1] - ny * h - uy * back)
    corner = max(0.0, min(0.45 * width, corner))
    outline = filleted_polyline([b_plus, c_plus, c_minus, b_minus], [corner, corner], steps=16)
    return Polygon(outline)


def stroke_polygon(points: list[tuple[float, float]], radii: list[float], width: float, cap0: float, cap1: float,
                   cut0: tuple[float, float] | None = None, cut1: tuple[float, float] | None = None) -> Polygon:
    """A constant-width stroke. Each end is either rounded along the stroke (cap = corner radius) or, when a cut
    direction is given, cut on a line of that direction through the end point with filleted corners."""
    line = filleted_polyline(points, radii) if len(points) > 2 else list(points)
    d0 = _unit(line[0][0] - line[1][0], line[0][1] - line[1][1])
    d1 = _unit(line[-1][0] - line[-2][0], line[-1][1] - line[-2][1])
    back = 0.9 * width
    body = list(line)
    pieces = []
    if cut0:
        body[0] = (line[0][0] - d0[0] * back, line[0][1] - d0[1] * back)
        pieces.append(_cut_piece(line[0], d0, width, cap0, back + 0.02, cut0))
    if cut1:
        body[-1] = (line[-1][0] - d1[0] * back, line[-1][1] - d1[1] * back)
        pieces.append(_cut_piece(line[-1], d1, width, cap1, back + 0.02, cut1))
    poly = LineString(body).buffer(width / 2, cap_style="flat", join_style="round", quad_segs=24)
    if not cut0:
        poly = _end_cap(poly, line[0], d0, width, cap0)
    if not cut1:
        poly = _end_cap(poly, line[-1], d1, width, cap1)
    return unary_union([poly, *pieces]) if pieces else poly


# Terminal treatment observed in both the primary and reversed reference renderings: the foot end (A0) and the
# upper arm's inner end (B0) are cut on a slant (hypothesis: parallel to the lower leg, which keeps both gaps
# beside the leg at constant width); the lower-leg end (A5) and the arm's outer end (B1) are round.
def _dir(deg: float) -> tuple[float, float]:
    return math.cos(math.radians(deg)), math.sin(math.radians(deg))


def build(p: Params):
    leg = math.degrees(math.atan2(p.a[5][1] - p.a[4][1], p.a[5][0] - p.a[4][0]))
    cut_a0 = _dir(p.cut_a0_deg if p.cut_a0_deg is not None else leg)
    cut_b0 = _dir(p.cut_b0_deg if p.cut_b0_deg is not None else leg)
    a = stroke_polygon(p.a, p.fillets, p.width, p.cap_a0, p.cap_a5, cut0=cut_a0)
    wb = p.width_b if p.width_b is not None else p.width
    b = stroke_polygon(p.b, [], wb, p.cap_b0, p.cap_b1, cut0=cut_b0)
    return a, b


def rasterise(geoms, shape: tuple[int, int], ss: int = SS) -> np.ndarray:
    """Area coverage in [0,1] for shapely polygons on an (h, w) pixel grid."""
    h, w = shape
    canvas = np.zeros((h * ss, w * ss), np.uint8)
    polys = []
    for g in geoms:
        if g.is_empty:
            continue
        polys.extend(g.geoms if isinstance(g, MultiPolygon) else [g])
    shift = 4
    scale = ss * (1 << shift)
    for poly in polys:
        rings = [poly.exterior] + list(poly.interiors)
        pts = [np.round(np.asarray(r.coords) * scale).astype(np.int32) for r in rings]
        cv2.fillPoly(canvas, pts, 255, lineType=cv2.LINE_8, shift=shift)
    return canvas.reshape(h, ss, w, ss).mean(axis=(1, 3)) / 255.0


def coverage_from_rgb(rgb: np.ndarray, dark_on_light: bool = True) -> tuple[np.ndarray, dict]:
    """Soft coverage of the mark from luminance, using robust ink/paper levels."""
    lum = rgb.astype(float) @ np.array([0.2126, 0.7152, 0.0722])
    lo, hi = np.percentile(lum, 3), np.percentile(lum, 97)
    if dark_on_light:
        alpha = (hi - lum) / max(hi - lo, 1e-6)
    else:
        alpha = (lum - lo) / max(hi - lo, 1e-6)
    return np.clip(alpha, 0, 1), {"ink": float(lo if dark_on_light else hi), "paper": float(hi if dark_on_light else lo)}


def metrics(model: np.ndarray, ref: np.ndarray) -> dict:
    """IoU of the half-coverage masks, mean absolute coverage error and boundary distances in pixels."""
    m = model >= 0.5
    r = ref >= 0.5
    inter = np.logical_and(m, r).sum()
    union = np.logical_or(m, r).sum()
    out = {"iou": float(inter / union) if union else 1.0, "mae": float(np.abs(model - ref).mean()),
           "pixels_differ": int(np.logical_xor(m, r).sum())}
    cm = cv2.Canny((m * 255).astype(np.uint8), 50, 150) > 0
    cr = cv2.Canny((r * 255).astype(np.uint8), 50, 150) > 0
    if cm.any() and cr.any():
        dist_to_ref = cv2.distanceTransform((~cr).astype(np.uint8), cv2.DIST_L2, 5)
        dist_to_model = cv2.distanceTransform((~cm).astype(np.uint8), cv2.DIST_L2, 5)
        d = np.concatenate([dist_to_ref[cm], dist_to_model[cr]])
        out.update({"boundary_mean_px": float(d.mean()), "boundary_p95_px": float(np.percentile(d, 95)),
                    "boundary_max_px": float(d.max())})
    return out


def svg_path(geom, digits: int = 2) -> str:
    """Absolute-coordinate SVG path data (even-odd safe) for polygons."""
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    parts = []
    fmt = f"{{:.{digits}f}}"
    for poly in polys:
        for ring in [poly.exterior] + list(poly.interiors):
            coords = list(ring.coords)[:-1]
            if not coords:
                continue
            parts.append("M" + " L".join(f"{fmt.format(x)} {fmt.format(y)}" for x, y in coords) + " Z")
    return " ".join(parts)


# ---- SVG serialisation with true arcs, and the inverse parser used by verification ------------------------
def _fit_circle(pts: np.ndarray):
    x, y = pts[:, 0], pts[:, 1]
    a = np.column_stack([x, y, np.ones_like(x)])
    b = x * x + y * y
    sol, *_ = np.linalg.lstsq(a, b, rcond=None)
    cx, cy = sol[0] / 2, sol[1] / 2
    r = math.sqrt(max(sol[2] + cx * cx + cy * cy, 0.0))
    return cx, cy, r


def _arc_fits(pts: np.ndarray, tol: float):
    """Returns (r, large, sweep) when the points lie on one circle and turn consistently, else None."""
    if len(pts) < 3:
        return None
    cx, cy, r = _fit_circle(pts)
    if not np.isfinite(r) or r <= 0 or r > 1e4:
        return None
    if np.max(np.abs(np.hypot(pts[:, 0] - cx, pts[:, 1] - cy) - r)) > tol:
        return None
    d = np.diff(pts, axis=0)
    cross = d[:-1, 0] * d[1:, 1] - d[:-1, 1] * d[1:, 0]
    if not (np.all(cross > -1e-9) or np.all(cross < 1e-9)):
        return None
    ang = np.unwrap(np.arctan2(pts[:, 1] - cy, pts[:, 0] - cx))
    span = abs(ang[-1] - ang[0])
    if span >= 2 * math.pi - 1e-3:
        return None
    return r, 1 if span > math.pi else 0, 1 if cross.sum() > 0 else 0


def _ring_commands(coords, tol: float, fmt):
    pts = np.asarray(coords[:-1] if coords[0] == coords[-1] else coords, float)
    n = len(pts)
    # Start at a sharp corner so that no arc wraps around the ring's start.
    turns = []
    for i in range(n):
        a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
        u, v = b - a, c - b
        nu, nv = np.linalg.norm(u), np.linalg.norm(v)
        turns.append(0.0 if nu < 1e-12 or nv < 1e-12 else math.degrees(math.acos(max(-1, min(1, float(u @ v) / (nu * nv))))))
    start = int(np.argmax(turns))
    pts = np.vstack([pts[start:], pts[:start], pts[start:start + 1]])
    out = [f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    i = 0
    last = len(pts) - 1
    while i < last:
        # Longest line, then longest arc, starting at i.
        j_line = i + 1
        while j_line + 1 <= last:
            seg = pts[i:j_line + 2]
            p, q = seg[0], seg[-1]
            dq = q - p
            nrm = np.linalg.norm(dq)
            dist = np.abs(dq[0] * (seg[:, 1] - p[1]) - dq[1] * (seg[:, 0] - p[0])) / max(nrm, 1e-12)
            if dist.max() > tol:
                break
            j_line += 1
        # An arc run is a stretch of short sampled segments that keep turning the same way on one circle;
        # a long straight segment never joins it, even when a huge circle would fit it.
        j_arc, arc = i + 1, None
        seg_len = np.linalg.norm(np.diff(pts, axis=0), axis=1)
        k = i + 2
        while k <= last:
            if seg_len[i:k].max() > 6.0:
                break
            fit = _arc_fits(pts[i:k + 1], tol)
            if fit is None:
                break
            j_arc, arc = k, fit
            k += 1
        if arc is not None and j_arc > j_line:
            r, large, sweep = arc
            out.append(f"A{fmt(r)} {fmt(r)} 0 {large} {sweep} {fmt(pts[j_arc][0])} {fmt(pts[j_arc][1])}")
            i = j_arc
        else:
            if j_line < last:
                out.append(f"L{fmt(pts[j_line][0])} {fmt(pts[j_line][1])}")
            i = j_line
    out.append("Z")
    return " ".join(out)


def svg_path_arcs(geom, tol: float = 0.01, digits: int = 2) -> str:
    """Path data with line and true circular-arc commands recovered from a densely sampled outline."""
    polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom]
    fmt = lambda v: (f"{v:.{digits}f}").rstrip("0").rstrip(".") if "." in f"{v:.{digits}f}" else f"{v:.{digits}f}"
    rings = []
    for poly in polys:
        for ring in [poly.exterior] + list(poly.interiors):
            rings.append(_ring_commands(list(ring.coords), tol, fmt))
    return " ".join(rings)


def parse_svg_path(d: str, arc_step_deg: float = 1.0):
    """Absolute M/L/A/Z path data -> shapely geometry with the even-odd fill rule (verification only)."""
    import re
    tokens = re.findall(r"[MLAZ]|-?\d*\.?\d+(?:e-?\d+)?", d)
    rings, ring, i, cur = [], [], 0, (0.0, 0.0)
    while i < len(tokens):
        t = tokens[i]
        if t == "M":
            if ring:
                rings.append(ring)
            cur = (float(tokens[i + 1]), float(tokens[i + 2]))
            ring = [cur]
            i += 3
        elif t == "L":
            cur = (float(tokens[i + 1]), float(tokens[i + 2]))
            ring.append(cur)
            i += 3
        elif t == "A":
            rx, _ry, _rot, large, sweep, x, y = (float(v) for v in tokens[i + 1:i + 8])
            ring.extend(_arc_points(cur, (x, y), rx, int(large), int(sweep), arc_step_deg))
            cur = (x, y)
            i += 8
        elif t == "Z":
            if ring:
                rings.append(ring)
            ring = []
            i += 1
        else:
            raise ValueError(f"unexpected token {t}")
    geom = None
    for r in rings:
        p = Polygon(r).buffer(0)
        geom = p if geom is None else geom.symmetric_difference(p)
    return geom


def _arc_points(p0, p1, r, large, sweep, step_deg):
    """Endpoint-parameterised SVG arc (circle, no rotation) sampled as points after p0, ending at p1."""
    x0, y0 = p0
    x1, y1 = p1
    dx, dy = (x0 - x1) / 2, (y0 - y1) / 2
    d2 = dx * dx + dy * dy
    r = max(r, math.sqrt(d2))
    coef = math.sqrt(max(r * r - d2, 0) / d2) if d2 > 0 else 0
    if large == sweep:
        coef = -coef
    cxp, cyp = coef * dy, -coef * dx
    cx, cy = cxp + (x0 + x1) / 2, cyp + (y0 + y1) / 2
    a0 = math.atan2(y0 - cy, x0 - cx)
    a1 = math.atan2(y1 - cy, x1 - cx)
    da = a1 - a0
    if sweep and da < 0:
        da += 2 * math.pi
    elif not sweep and da > 0:
        da -= 2 * math.pi
    n = max(2, int(abs(math.degrees(da)) / step_deg))
    return [(cx + r * math.cos(a0 + da * k / n), cy + r * math.sin(a0 + da * k / n)) for k in range(1, n + 1)]
