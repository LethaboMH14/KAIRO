"""Fits the C pathmark stroke model to the selected reference and writes the measured result.

Run from the project root:  python design/brand-master-20261023/tools/fit_symbol.py
Inputs : design/app-experience-20261023/assets/brand-reference.png (user-selected reference, sha256 in README)
Outputs: design/brand-master-20261023/fit/symbol-fit.json and overlay proofs.

Two fits are made against the same pixels:
  free         every vertex, fillet, width and terminal radius free (closest to the generated picture)
  regularised  one stroke width for both strokes, the top edge, foot and upper arm share one angle,
               the lower leg is that angle mirrored, semicircular terminals (the intended master)
The difference between them is the cost of the intentional regularisation, reported in reference pixels.
"""
from __future__ import annotations

import hashlib
import json
import math
import sys
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.optimize import minimize

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pathmark import Params, build, coverage_from_rgb, metrics, rasterise  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]
REF = ROOT / "design/app-experience-20261023/assets/brand-reference.png"
OUT = ROOT / "design/brand-master-20261023/fit"
CROP = (170, 40, 395, 220)          # primary symbol on chalk (left, top, right, bottom)
CROP_REVERSED = (700, 70, 885, 220)  # reversed symbol on moss, used only as a consistency check


def load_crop(box, dark_on_light=True):
    rgb = np.array(Image.open(REF).convert("RGB"))[box[1]:box[3], box[0]:box[2]]
    alpha, levels = coverage_from_rgb(rgb, dark_on_light)
    return rgb, alpha, levels


def free_initial() -> Params:
    """Hand-measured starting point (crop pixels); the cut angles start parallel to the lower leg."""
    return Params(
        a=[(83.3, 129.7), (28.9, 156.3), (28.1, 57.1), (86.3, 23.1), (87.0, 100.0), (210.1, 159.1)],
        fillets=[13, 18.7, 3.4, 7.2], width=29.9, cap_a0=8, cap_a5=14.7,
        b=[(124.0, 92.2), (207.3, 44.0)], cap_b0=8, cap_b1=15.5, width_b=31.2,
        cut_a0_deg=26.0, cut_b0_deg=26.0,
    )


def regular_build(v):
    """18 parameters -> Params with one stroke width, shared angles, round outer terminals and the two inner
    terminals cut parallel to the lower leg with one shared corner radius."""
    xL, yA1, yA2, xI, yA4, theta, phi, L5, L0, bx, by, LB, w, r1, r2, r3, r4, rc = map(float, v)
    t = math.radians(theta)
    f = math.radians(phi)
    a2 = (xL, yA2)
    a1 = (xL, yA1)
    a3 = (xI, yA2 - (xI - xL) * math.tan(t))
    a4 = (xI, yA4)
    a5 = (a4[0] + L5 * math.cos(f), a4[1] + L5 * math.sin(f))
    a0 = (a1[0] + L0 * math.cos(t), a1[1] - L0 * math.sin(t))
    b0 = (bx, by)
    b1 = (bx + LB * math.cos(t), by - LB * math.sin(t))
    return Params(a=[a0, a1, a2, a3, a4, a5], fillets=[r1, r2, r3, r4], width=w, cap_a0=rc, cap_a5=w / 2,
                  b=[b0, b1], cap_b0=rc, cap_b1=w / 2, width_b=w)


REGULAR_NAMES = ["xL", "yA1", "yA2", "xI", "yA4", "theta_deg", "phi_deg", "L5", "L0", "bx", "by", "LB", "width",
                 "fillet_bottom_left", "fillet_top_left", "fillet_top", "fillet_inner_joint", "cut_corner"]


def regular_initial():
    return np.array([28.2, 157.9, 55.0, 86.4, 99.0, 28.1, 25.9, 138.3, 61.0, 121.7, 91.3, 97.8, 30.2, 14.1, 25.9, 3.4, 7.7, 8.0], float)


def loss_for(alpha):
    shape = alpha.shape

    def loss(params: Params):
        try:
            a, b = build(params)
            model = rasterise([a, b], shape, ss=4)  # coarser during search; reported metrics use the default
        except Exception:
            return 1e3
        penalty = 0.0
        for r in params.fillets:
            penalty += max(0.0, -r) * 0.1
        return float(np.mean((model - alpha) ** 2)) + penalty
    return loss


def overlay(alpha, model, path, scale=6):
    """Reference in grey, model edge in copper; red where only the reference is ink, blue where only the model is."""
    h, w = alpha.shape
    ref = (alpha >= 0.5)
    mod = (model >= 0.5)
    img = np.full((h, w, 3), 245, np.uint8)
    img[ref & mod] = (68, 81, 62)
    img[ref & ~mod] = (40, 40, 210)
    img[~ref & mod] = (210, 120, 40)
    big = cv2.resize(img, (w * scale, h * scale), interpolation=cv2.INTER_NEAREST)
    edge = cv2.Canny((cv2.resize(model, (w * scale, h * scale), interpolation=cv2.INTER_LINEAR) * 255).astype(np.uint8), 60, 160)
    big[edge > 0] = (85, 117, 174)
    cv2.imwrite(str(path), big)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rgb, alpha, levels = load_crop(CROP)
    loss = loss_for(alpha)
    results = {"reference": {"file": str(REF.relative_to(ROOT)).replace("\\", "/"),
                             "sha256": hashlib.sha256(REF.read_bytes()).hexdigest(), "crop": CROP, "levels": levels}}

    t0 = time.time()
    x0 = free_initial().vector()
    res = minimize(lambda v: loss(Params.from_vector(v)), x0, method="Powell",
                   options={"maxiter": 8000, "maxfev": 8000, "xtol": 1e-3, "ftol": 1e-10})
    free = Params.from_vector(res.x)
    a, b = build(free)
    model_free = rasterise([a, b], alpha.shape)
    leg = math.degrees(math.atan2(free.a[5][1] - free.a[4][1], free.a[5][0] - free.a[4][0]))
    results["cut_angle_test"] = {"lower_leg_deg": round(leg, 2), "foot_cut_deg": round(free.cut_a0_deg, 2),
                                 "arm_cut_deg": round(free.cut_b0_deg, 2),
                                 "note": "free fit chooses each cut angle independently of the leg"}
    results["free"] = {"params": res.x.round(3).tolist(), "loss": float(res.fun), "evaluations": int(res.nfev),
                       "seconds": round(time.time() - t0, 1), **metrics(model_free, alpha)}
    overlay(alpha, model_free, OUT / "overlay-free.png")

    t0 = time.time()
    rloss = lambda v: loss(regular_build(v))
    rres = minimize(rloss, regular_initial(), method="Powell",
                    options={"maxiter": 8000, "maxfev": 8000, "xtol": 1e-3, "ftol": 1e-10})
    reg = regular_build(rres.x)
    ra, rb = build(reg)
    model_reg = rasterise([ra, rb], alpha.shape)
    results["regularised"] = {"params": dict(zip(REGULAR_NAMES, rres.x.round(4).tolist())), "loss": float(rres.fun),
                              "evaluations": int(rres.nfev), "seconds": round(time.time() - t0, 1), **metrics(model_reg, alpha)}
    results["regularised_vs_free"] = metrics(model_reg, model_free)
    overlay(alpha, model_reg, OUT / "overlay-regularised.png")

    # Consistency: does the generated reversed rendering share the geometry? Scale the regularised model to it.
    _, ralpha, _ = load_crop(CROP_REVERSED, dark_on_light=False)
    ys, xs = np.nonzero(ralpha >= 0.5)
    my, mx = np.nonzero(model_reg >= 0.5)
    s = ((xs.max() - xs.min()) / (mx.max() - mx.min()) + (ys.max() - ys.min()) / (my.max() - my.min())) / 2
    from shapely import affinity
    def place(g):
        g = affinity.translate(g, -mx.min(), -my.min())
        g = affinity.scale(g, s, s, origin=(0, 0))
        return affinity.translate(g, xs.min(), ys.min())
    model_rev = rasterise([place(ra), place(rb)], ralpha.shape)
    results["reversed_panel_check"] = {"crop": CROP_REVERSED, "scale": round(float(s), 4), **metrics(model_rev, ralpha)}
    overlay(ralpha, model_rev, OUT / "overlay-reversed-check.png")

    (OUT / "symbol-fit.json").write_text(json.dumps(results, indent=2))
    print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "params"} if isinstance(v, dict) else v
                      for k, v in results.items()}, indent=2))


if __name__ == "__main__":
    main()
