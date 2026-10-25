"""Deterministic 2D graphics helpers for the KAIRO advert compositor.

Every layer is an RGBA float32 array with premultiplied alpha in 0..1. Nothing here reads the clock or
draws random numbers without an explicit seed, so a frame number always produces the same pixels.
"""
from __future__ import annotations

import math
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
FONT = ROOT / 'studio/src/experience/fonts/Manrope-wght.ttf'

CHALK = (245, 240, 230)
MOSS = (62, 81, 68)
SAGE = (167, 175, 145)
INK = (37, 43, 40)
PAPER = (251, 248, 242)
COPPER = (184, 115, 64)   # accent only: large shapes and lines, never small text
MINT = (186, 222, 205)    # selection glow, echoes the studio's selected-part highlight

W, H = 1920, 1080


# ---------------------------------------------------------------- timing
def clamp(x, lo=0.0, hi=1.0):
    return lo if x < lo else hi if x > hi else x


def lerp(a, b, u):
    return a + (b - a) * u


def ease_out(u):
    u = clamp(u)
    return 1 - (1 - u) ** 3


def ease_in(u):
    u = clamp(u)
    return u ** 3


def ease_in_out(u):
    u = clamp(u)
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def smooth(u):
    u = clamp(u)
    return u * u * (3 - 2 * u)


def window(t, t0, t1, fade_in=0.3, fade_out=0.3):
    """Opacity envelope: 0 before t0, eases to 1, eases back to 0 by t1."""
    if t < t0 or t > t1:
        return 0.0
    a = ease_out((t - t0) / fade_in) if fade_in > 0 else 1.0
    b = ease_out((t1 - t) / fade_out) if fade_out > 0 else 1.0
    return min(a, b)


def track(t, keys, ease=ease_in_out):
    """Piecewise interpolation through (time, value) keys; values may be tuples."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            u = ease((t - t0) / (t1 - t0)) if t1 > t0 else 1.0
            if isinstance(v0, tuple):
                return tuple(lerp(a, b, u) for a, b in zip(v0, v1))
            return lerp(v0, v1, u)
    return keys[-1][1]


# ---------------------------------------------------------------- layers
def canvas(color=(0, 0, 0)):
    out = np.empty((H, W, 3), np.float32)
    out[:] = np.array(color, np.float32) / 255.0
    return out


def from_pil(img: Image.Image) -> np.ndarray:
    """PIL RGBA -> premultiplied float32."""
    a = np.asarray(img.convert('RGBA'), np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]
    return a


def over(dst: np.ndarray, src, x: int, y: int, opacity: float = 1.0):
    """Composite premultiplied src onto RGB dst at integer offset (clipped). src may be (array, dx, dy)."""
    if isinstance(src, tuple):
        src, dx, dy = src
        x, y = x + dx, y + dy
    if opacity <= 0.001:
        return
    sh, sw = src.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(dst.shape[1], x + sw), min(dst.shape[0], y + sh)
    if x1 <= x0 or y1 <= y0:
        return
    s = src[y0 - y:y1 - y, x0 - x:x1 - x]
    if opacity < 0.999:
        s = s * opacity
    d = dst[y0:y1, x0:x1]
    d *= 1.0 - s[..., 3:4]
    d += s[..., :3]


def place(dst, sprite, cx, cy, scale=1.0, opacity=1.0, rotate=0.0, blur=0.0):
    """Composite a sprite centred at subpixel (cx, cy) with scale/rotation. Uses a local warp only."""
    if opacity <= 0.001 or scale <= 0.001:
        return
    sh, sw = sprite.shape[:2]
    ow, oh = sw * scale, sh * scale
    if rotate:
        c, s = abs(math.cos(math.radians(rotate))), abs(math.sin(math.radians(rotate)))
        ow, oh = sw * scale * c + sh * scale * s, sw * scale * s + sh * scale * c
    pad = int(math.ceil(blur * 3)) + 2
    bw, bh = int(math.ceil(ow)) + 2 * pad, int(math.ceil(oh)) + 2 * pad
    bx, by = int(math.floor(cx - bw / 2)), int(math.floor(cy - bh / 2))
    m = cv2.getRotationMatrix2D((sw / 2, sh / 2), -rotate, scale)
    m[0, 2] += (cx - bx) - sw / 2
    m[1, 2] += (cy - by) - sh / 2
    interp = cv2.INTER_AREA if scale < 0.75 else cv2.INTER_LINEAR
    local = cv2.warpAffine(sprite, m, (bw, bh), flags=interp, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    if blur > 0.05:
        local = cv2.GaussianBlur(local, (0, 0), blur)
    over(dst, local, bx, by, opacity)


def solid(w, h, color, alpha=1.0):
    a = np.zeros((h, w, 4), np.float32)
    a[..., :3] = np.array(color, np.float32) / 255.0 * alpha
    a[..., 3] = alpha
    return a


# ---------------------------------------------------------------- drawing (4x supersampled, cached)
SS = 4


def _down(img: Image.Image, w, h):
    return img.resize((w, h), Image.LANCZOS)


@lru_cache(maxsize=None)
def font(size: int, weight: int = 600) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONT), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def text_size(txt, size, weight=600):
    f = font(size, weight)
    l, t, r, b = f.getbbox(txt)
    return r - l, b - t


def text_sprite(txt, size, weight=600, color=INK, alpha=1.0, tracking=0.0):
    """Text rendered on a transparent sprite whose height is the font's line height."""
    f = font(size, weight)
    asc, desc = f.getmetrics()
    if tracking:
        widths = [f.getlength(ch) + tracking for ch in txt]
        w = int(math.ceil(sum(widths))) + 4
    else:
        w = int(math.ceil(f.getlength(txt))) + 4
    h = asc + desc + 4
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if tracking:
        x = 2
        for ch, cw in zip(txt, widths):
            d.text((x, 2), ch, font=f, fill=color + (int(255 * alpha),))
            x += cw
    else:
        d.text((2, 2), txt, font=f, fill=color + (int(255 * alpha),))
    return from_pil(img)


def wrap(txt, size, weight, max_w):
    f = font(size, weight)
    words, lines, cur = txt.split(), [], ''
    for wd in words:
        trial = (cur + ' ' + wd).strip()
        if f.getlength(trial) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def rrect_img(w, h, r, fill=None, stroke=None, stroke_w=0, shadow=0, shadow_alpha=0.18, shadow_dy=6):
    """PIL RGBA rounded rectangle with optional soft shadow (shadow drawn outside the box)."""
    pad = shadow * 2 if shadow else 0
    W2, H2 = (w + 2 * pad) * SS, (h + 2 * pad + (shadow_dy if shadow else 0)) * SS
    img = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
    if shadow:
        sh = Image.new('L', (W2, H2), 0)
        ImageDraw.Draw(sh).rounded_rectangle(
            [pad * SS, (pad + shadow_dy) * SS, (pad + w) * SS - 1, (pad + h + shadow_dy) * SS - 1],
            r * SS, fill=int(255 * shadow_alpha))
        sh = sh.resize((W2 // SS, H2 // SS), Image.LANCZOS)
        sh = np.asarray(sh, np.float32)
        sh = cv2.GaussianBlur(sh, (0, 0), shadow / 2)
        shadow_img = Image.fromarray(np.dstack([np.zeros_like(sh)] * 3 + [sh]).astype(np.uint8), 'RGBA')
    d = ImageDraw.Draw(img)
    box = [pad * SS, pad * SS, (pad + w) * SS - 1, (pad + h) * SS - 1]
    d.rounded_rectangle(box, r * SS, fill=fill, outline=stroke, width=stroke_w * SS if stroke else 0)
    img = _down(img, W2 // SS, H2 // SS)
    if shadow:
        base = shadow_img
        base.alpha_composite(img)
        img = base
    return img, pad


def chip(txt, size=36, weight=650, fg=INK, bg=CHALK, bg_alpha=0.94, dot=SAGE, pad_x=26, pad_y=16,
         radius=None, shadow=14, stroke=None, badge=None):
    """A KAIRO-style chip: rounded card, optional leading dot or numbered badge, text. Returns sprite."""
    tw, _ = text_size(txt, size, weight)
    f = font(size, weight)
    asc, desc = f.getmetrics()
    lead = 0
    if dot:
        lead = int(size * 0.62)
    if badge is not None:
        lead = int(size * 1.15)
    w = int(tw + 2 * pad_x + lead)
    h = int(asc + desc + 2 * pad_y - size * 0.12)
    radius = radius if radius is not None else h // 2
    fill = bg + (int(255 * bg_alpha),)
    img, pad = rrect_img(w, h, radius, fill=fill, stroke=(stroke + (255,)) if stroke else None,
                         stroke_w=2 if stroke else 0, shadow=shadow)
    big = img.resize((img.width * SS, img.height * SS), Image.NEAREST)
    d = ImageDraw.Draw(big)
    cy = (pad + h / 2) * SS
    x = (pad + pad_x) * SS
    if dot:
        rr = size * 0.17 * SS
        d.ellipse([x, cy - rr, x + 2 * rr, cy + rr], fill=dot + (255,))
    if badge is not None:
        rr = size * 0.45 * SS
        d.ellipse([x - rr * 0.2, cy - rr, x - rr * 0.2 + 2 * rr, cy + rr], fill=MOSS + (255,))
    img = big.resize(img.size, Image.LANCZOS)
    d = ImageDraw.Draw(img)
    if badge is not None:
        bf = font(int(size * 0.55), 750)
        bw = bf.getlength(str(badge))
        rr = size * 0.45
        d.text((pad + pad_x - rr * 0.2 + rr - bw / 2, pad + h / 2 - size * 0.40), str(badge), font=bf, fill=CHALK + (255,))
    ty = pad + (h - (asc + desc)) / 2 - size * 0.04
    d.text((pad + pad_x + lead, ty), txt, font=f, fill=fg + (255,))
    return from_pil(img)


def polyline_layer(polys, color, width, alpha=1.0, size=(W, H), closed=False, progress=1.0):
    """Antialiased polylines, rasterised only inside their bounding box. Returns (premultiplied RGBA, x, y).
    progress trims each line to that fraction of its length."""
    trimmed = []
    for pts in polys:
        p = np.asarray(pts, np.float64)
        if len(p) < 2:
            continue
        if progress < 1.0:
            seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
            acc = np.concatenate([[0], np.cumsum(seg)])
            keep = acc[-1] * progress
            n = int(np.searchsorted(acc, keep))
            if n <= 0:
                continue
            p = p[:n + 1].copy()
            if n < len(acc):
                over_ = acc[n] - keep
                if over_ > 0 and seg[n - 1] > 0:
                    p[-1] = p[-1] - (p[-1] - p[-2]) * (over_ / seg[n - 1])
        trimmed.append(p)
    empty = (np.zeros((1, 1, 4), np.float32), 0, 0)
    if not trimmed:
        return empty
    allp = np.concatenate(trimmed)
    pad = int(math.ceil(width)) + 3
    x0 = max(0, int(math.floor(allp[:, 0].min())) - pad)
    y0 = max(0, int(math.floor(allp[:, 1].min())) - pad)
    x1 = min(size[0], int(math.ceil(allp[:, 0].max())) + pad)
    y1 = min(size[1], int(math.ceil(allp[:, 1].max())) + pad)
    if x1 <= x0 or y1 <= y0:
        return empty
    bw, bh = x1 - x0, y1 - y0
    canvas_ = np.zeros((bh * 2, bw * 2), np.uint8)
    for p in trimmed:
        q = (p - [x0, y0]) * 2
        cv2.polylines(canvas_, [np.round(q * 8).astype(np.int32)], closed, 255, max(1, int(round(width * 2))),
                      lineType=cv2.LINE_AA, shift=3)
    m = cv2.resize(canvas_, (bw, bh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0 * alpha
    out = np.empty((bh, bw, 4), np.float32)
    out[..., :3] = (np.array(color, np.float32) / 255.0)[None, None, :] * m[..., None]
    out[..., 3] = m
    return out, x0, y0


# ---------------------------------------------------------------- image plates
@lru_cache(maxsize=8)
def load_rgba(path: str) -> np.ndarray:
    return from_pil(Image.open(path))


def cover_transform(src_w, src_h, scale, focus):
    """Affine matrix mapping a source still to the 1920x1080 frame, 'cover' fitted, zoomed around focus."""
    base = max(W / src_w, H / src_h) * scale
    fx, fy = focus  # normalised source point that stays at the same normalised screen point
    sx, sy = fx * src_w, fy * src_h
    tx, ty = fx * W, fy * H
    return np.array([[base, 0, tx - base * sx], [0, base, ty - base * sy]], np.float32)


def warp_plate(rgb: np.ndarray, m: np.ndarray):
    return cv2.warpAffine(rgb, m, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


@lru_cache(maxsize=1)
def vignette():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    return np.clip(1.0 - 0.38 * np.clip(d - 0.55, 0, None) ** 1.6, 0.55, 1.0)[..., None]


def grain(frame: int, amount=0.018):
    rng = np.random.default_rng(10_000 + frame)
    g = rng.standard_normal((H // 2, W // 2), dtype=np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
    return g[..., None] * amount


def to_uint8(rgb: np.ndarray) -> np.ndarray:
    return (np.clip(rgb, 0, 1) * 255.0 + 0.5).astype(np.uint8)
