"""KAIRO 'When it clicks' — deterministic frame compositor (1920x1080, 30 fps, 600 frames).

Every pixel derives from the frame number, timeline.json and the plates listed in source/manifest.json.
No clock, no unseeded randomness, no browser. Frames are piped to FFmpeg (imageio-ffmpeg binary).

  python design/kairo-ad-20261024/compose/build.py --variant master            # writes out/*.mp4
  python design/kairo-ad-20261024/compose/build.py --stills 0,45,100 --variant review   # QA PNGs

Variants: master (clean + small honesty super), silent (burned-in captions), review (adds a status label),
entrant (labelled placeholders where the entrant's own opening and close belong), reduced (reduced-motion
companion: no camera moves, orbit, slides or flights; fades and cuts only, still grain, captions burned in).
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
import time
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import brand  # noqa: E402
from gfx import (CHALK, COPPER, INK, MINT, MOSS, PAPER, SAGE, H, W, canvas, chip, clamp, cover_transform,  # noqa: E402
                 ease_in, ease_in_out, ease_out, font, from_pil, grain, lerp, over, place, polyline_layer,
                 rrect_img, smooth, text_sprite, to_uint8, track, vignette, window, wrap)

HERE = Path(__file__).resolve().parents[1]
ROOT = HERE.parents[1]
TL = json.loads((HERE / 'timeline.json').read_text(encoding='utf-8'))
FPS = TL['format']['fps']
FRAMES = TL['format']['frames']
UI = TL['ui_copy']
SRC = HERE / 'source'
BUILD = HERE / 'build'
OUT = HERE / 'out'

# Plates (pinned copies; hashes in source/manifest.json).
STILL_A = SRC / 'stills/01-student-overwhelmed.png'
STILL_B = SRC / 'stills/02-student-understanding.png'
STILL_C = SRC / 'stills/03-laptop-composite-plate.png'
KAIRO_DIR = BUILD / 'kairo'
MOTOR_DIR = BUILD / 'motor'
KAIRO_FALLBACK = ROOT / 'design/video-production-20261023/kairo-production-frame.png'

# Laptop lid in still-source pixels (both stills share camera/laptop). Corners: TL, TR, BR, BL.
LID = np.array([[1150, 445], [1555, 458], [1452, 873], [745, 818]], np.float32)
LID_CENTRE = LID.mean(axis=0)
# Display area of the blank laptop screen in still C (detected from the plate: contour of the uniform screen).
SCREEN = np.array([[859, 218], [1430, 233], [1382, 613], [798, 552]], np.float32)
SCREEN_CENTRE = SCREEN.mean(axis=0)
FULL = np.array([[0, 0], [W, 0], [W, H], [0, H]], np.float32)
MOTOR_OFFSET = (720, 0)
CONTENT_X = 450
RM = False  # reduced-motion companion: fades and cuts only; set per frame by render()


def voice_times():
    """Actual take placements when the audio build has run; planned starts otherwise."""
    placed = BUILD / 'voice-placement.json'
    lines = {}
    for group in ('kairo', 'chorus'):
        for item in TL['voice'][group]:
            lines[item['id']] = {'text': item['text'], 'start': item['start'], 'end': item['start'] + 1.2,
                                 'speaker': 'KAIRO' if group == 'kairo' else 'Student (thought)'}
    if placed.exists():
        for item in json.loads(placed.read_text(encoding='utf-8'))['lines']:
            lines[item['id']].update(start=item['start'], end=item['end'])
    return lines


VOICE = voice_times()


# ------------------------------------------------------------------ plates
@lru_cache(maxsize=2)
def still(path):
    return np.asarray(Image.open(path).convert('RGB'), np.float32) / 255.0


def plate_matrix(src_w, src_h, scale, src_pt, screen_pt):
    base = max(W / src_w, H / src_h) * scale
    return np.array([[base, 0, screen_pt[0] - base * src_pt[0]], [0, base, screen_pt[1] - base * src_pt[1]]], np.float32)


def apply(m, pts):
    pts = np.asarray(pts, np.float32)
    return pts @ m[:, :2].T + m[:, 2]


def student_plate(path, m, blur=0.0, gain=1.0):
    img = still(str(path))
    out = cv2.warpAffine(img, m, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    if blur > 0.1:
        out = cv2.GaussianBlur(out, (0, 0), blur)
    if gain != 1.0:
        out *= gain
    return out


FOCUS_A = (0.47 * 1672, 0.42 * 941)


def opening_matrix(t):
    """Still A: slow, intimate push for the first three seconds."""
    s1 = 1.06 if RM else track(t, [(0.0, 1.035), (3.0, 1.09)], ease=ease_in_out)
    return plate_matrix(1672, 941, s1, FOCUS_A, (0.47 * W, 0.42 * H))


def screen_push(t, entering):
    """Still C: one clean move into (or back out of) the laptop screen. Returns plate matrix and progress u."""
    u = ease_in((t - 3.0) / 1.1) if entering else 1 - ease_out((t - 15.85) / 0.65)
    base = plate_matrix(1672, 941, 1.04, (836, 470.5), (W / 2, H / 2))
    start = apply(base, [SCREEN_CENTRE])[0]
    scale = math.exp(lerp(math.log(1.04), math.log(3.0), u))
    target = (lerp(start[0], W / 2, smooth(u)), lerp(start[1], H / 2, smooth(u)))
    return plate_matrix(1672, 941, scale, tuple(SCREEN_CENTRE), target), u


def closing_matrix(t):
    """Still B: the learner again, calmer; a slow settle."""
    s2 = 1.06 if RM else track(t, [(16.5, 1.075), (17.75, 1.05)], ease=ease_out)
    return plate_matrix(1672, 941, s2, FOCUS_A, (0.47 * W, 0.42 * H))


def screen_composite(f, t, m, u, variant, content_t):
    """Perspective-composite the product surface onto the laptop screen; it flattens to full frame as u -> 1."""
    quad = apply(m, SCREEN)
    k = ease_in_out(clamp((u - 0.5) / 0.5))
    dst = quad * (1 - k) + FULL * k
    hm = cv2.getPerspectiveTransform(FULL, dst.astype(np.float32))
    content = surface_content(content_t, variant)
    warped = cv2.warpPerspective(content, hm, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    mask = np.zeros((H * 2, W * 2), np.uint8)
    cv2.fillConvexPoly(mask, np.round(dst * 2 * 8).astype(np.int32), 255, lineType=cv2.LINE_AA, shift=3)
    a = cv2.resize(mask, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255
    gain = lerp(0.86, 1.0, k)  # a screen in a dim room, then the space itself
    f *= 1 - a
    f += warped * gain * a


@lru_cache(maxsize=1)
def sticker():
    return brand.logo('kairo-symbol-chalk.svg', 150)


def draw_sticker(frame, m, opacity):
    """Subtle KAIRO sticker on the laptop lid: the in-scene brand cue."""
    spr = sticker()
    sh, sw = spr.shape[:2]
    u = (LID[1] - LID[0]) / np.linalg.norm(LID[1] - LID[0])
    v = (LID[3] - LID[0]) / np.linalg.norm(LID[3] - LID[0])
    k = 0.42
    centre = LID_CENTRE + np.array([22, -38], np.float32)
    a = np.array([[u[0] * k, v[0] * k * 0.78], [u[1] * k, v[1] * k * 0.78]], np.float32)
    local = np.hstack([a, (centre - a @ np.array([sw / 2, sh / 2], np.float32))[:, None]])
    full = np.vstack([m, [0, 0, 1]]) @ np.vstack([local, [0, 0, 1]])
    warped = cv2.warpAffine(spr, full[:2], (W, H), flags=cv2.INTER_LINEAR, borderValue=0)
    warped[..., :3] *= 0.62  # the lid is in shadow; keep the mark quiet
    over(frame, warped, 0, 0, opacity * 0.55)


def kairo_sprite(t):
    k = int(round((t - 3.0) * FPS)) + 1
    p = KAIRO_DIR / f'kairo-{k:04d}.png'
    if p.exists():
        return from_pil(Image.open(p))
    return fallback_kairo()


@lru_cache(maxsize=1)
def fallback_kairo():
    img = Image.open(KAIRO_FALLBACK).crop((300, 40, 660, 480)).resize((720, 880), Image.LANCZOS)
    return from_pil(img)


def motor_sprite(t):
    k = int(round((t - 8.0) * FPS)) + 1
    # reduced motion: hold the front view that matches the section line, then cut to the three-quarter view
    k = (1 if t < 9.25 else 75) if RM else max(1, min(240, k))
    p = MOTOR_DIR / f'motor-{k:04d}.png'
    return from_pil(Image.open(p)) if p.exists() else None


@lru_cache(maxsize=1)
def motor_projection():
    p = BUILD / 'motor-projection.json'
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else None


# ------------------------------------------------------------------ static UI sprites
@lru_cache(maxsize=None)
def hero_chip(txt):
    return chip(txt, size=36, weight=650, shadow=16)


@lru_cache(maxsize=None)
def atmos_chip(txt):
    return chip(txt, size=23, weight=600, bg_alpha=0.80, shadow=8, pad_x=18, pad_y=11)


@lru_cache(maxsize=None)
def rail_chip(txt, state):
    if state == 'active':
        return chip(txt, size=24, weight=700, fg=CHALK, bg=MOSS, bg_alpha=1.0, dot=CHALK, shadow=10)
    if state == 'done':
        return chip(txt, size=24, weight=650, fg=MOSS, bg=CHALK, bg_alpha=1.0, dot=MOSS, shadow=6, stroke=MOSS)
    return chip(txt, size=24, weight=600, fg=INK, bg=(236, 231, 220), bg_alpha=1.0, dot=SAGE, shadow=0)


def rail_layout():
    labels = UI['rail']
    sprites = [rail_chip(lbl, 'idle') for lbl in labels]
    gap = 34
    total = sum(s.shape[1] for s in sprites) + gap * (len(sprites) - 1)
    x = (CONTENT_X + W) / 2 - total / 2
    centres = []
    for s in sprites:
        centres.append((x + s.shape[1] / 2, 92.0))
        x += s.shape[1] + gap
    return centres


RAIL = rail_layout()


def rail_state(i, t):
    # (start of active, start of done) per step
    spans = [(4.6, 6.45), (6.45, 7.7), (7.7, 14.35), (14.35, 99)]
    a, d = spans[i]
    if t < a:
        return 'idle'
    if t < d:
        return 'active'
    return 'done'


def draw_rail(frame, t, opacity=1.0, skip=()):
    if opacity <= 0:
        return
    xs = [c[0] for c in RAIL]
    line = polyline_layer([[(xs[0], 92), (xs[-1], 92)]], SAGE, 2, alpha=0.9)
    over(frame, line, 0, 0, opacity)
    for i, (lbl, c) in enumerate(zip(UI['rail'], RAIL)):
        if i in skip:
            continue
        st = rail_state(i, t)
        spr = rail_chip(lbl, st)
        pop = 1.0
        if st == 'active' and not RM:
            pop = 1.0 + 0.06 * math.sin(math.pi * clamp((t - [4.6, 6.45, 7.7, 14.35][i]) / 0.35))
        place(frame, spr, c[0], c[1], scale=pop, opacity=opacity)


@lru_cache(maxsize=1)
def material_card():
    """'My material' card. Returns (sprite, layout dict with card-local coordinates)."""
    w, h = 660, 720
    img, pad = rrect_img(w, h, 26, fill=PAPER + (255,), shadow=22, shadow_alpha=0.16)
    d = ImageDraw.Draw(img)
    x0, y0 = pad + 40, pad + 36
    d.text((x0, y0), 'MY MATERIAL', font=font(19, 750), fill=MOSS + (255,))
    tag = UI['material_tag']
    tw = font(18, 650).getlength(tag)
    d.rounded_rectangle([pad + w - 40 - tw - 30, y0 - 6, pad + w - 40, y0 + 26], 16, fill=(226, 232, 214, 255))
    d.text((pad + w - 40 - tw - 15, y0 - 1), tag, font=font(18, 650), fill=MOSS + (255,))
    d.text((x0, y0 + 46), UI['material_title'], font=font(35, 750), fill=INK + (255,))
    lines = wrap(UI['material_body'], 24, 520, w - 80)
    ly = y0 + 104
    line_boxes = []
    for ln in lines:
        d.text((x0, ly), ln, font=font(24, 520), fill=(60, 66, 62, 255))
        line_boxes.append((x0, ly, x0 + font(24, 520).getlength(ln), ly + 32, ln))
        ly += 34
    # Highlight span: the sentence about the field inducing voltages.
    target = 'As the stator’s field sweeps past, it induces voltages in the bars.'
    hl = []
    text_so_far = ''
    for (lx, ly_, rx, by, ln) in line_boxes:
        start = len(text_so_far)
        text_so_far += ln + ' '
        s = UI['material_body'].find(target)
        e = s + len(target)
        a, b = max(s, start), min(e, start + len(ln))
        if a < b:
            f = font(24, 520)
            hx0 = lx + f.getlength(ln[:a - start])
            hx1 = lx + f.getlength(ln[:b - start])
            hl.append((hx0 - 3, ly_ - 1, hx1 + 3, by + 1))
    # Diagram box (section drawing from the motor's own geometry).
    diag = (x0, ly + 26, pad + w - 40, pad + h - 70)
    d.text((x0, pad + h - 52), 'Fig. 3.4  Section through the motor (from the KAIRO motor model)', font=font(16, 560), fill=(110, 116, 110, 255))
    sprite = from_pil(img)
    proj = motor_projection()
    polys_local = []
    if proj:
        allpts = np.concatenate([np.asarray(p['mm'], np.float32).reshape(-1, 2) for p in proj['polylines']])
        mn, mx = allpts.min(0), allpts.max(0)
        bw, bh = diag[2] - diag[0], diag[3] - diag[1]
        s = min(bw / (mx[0] - mn[0]), bh / (mx[1] - mn[1])) * 0.96
        ox = diag[0] + (bw - (mx[0] - mn[0]) * s) / 2 - mn[0] * s
        oy = diag[1] + (bh - (mx[1] - mn[1]) * s) / 2 - mn[1] * s
        for p in proj['polylines']:
            pts = np.asarray(p['mm'], np.float32).reshape(-1, 2) * s + [ox, oy]
            polys_local.append({'part': p['part'], 'mesh': p['mesh'], 'pts': pts, 'px': np.asarray(p['px'], np.float32)})
        # bake the ink drawing into the card
        big = img.resize((img.width * 2, img.height * 2), Image.NEAREST)
        dd = ImageDraw.Draw(big)
        for pl in polys_local:
            dd.line([tuple(q * 2) for q in pl['pts']], fill=INK + (215,), width=3, joint='curve')
        img = big.resize(img.size, Image.LANCZOS)
        sprite = from_pil(img)
    return sprite, {'pad': pad, 'w': w, 'h': h, 'highlight': hl, 'polys': polys_local}


@lru_cache(maxsize=1)
def lesson_card():
    w, h = 650, 470
    img, pad = rrect_img(w, h, 26, fill=(255, 253, 249, 255), shadow=22, shadow_alpha=0.16)
    d = ImageDraw.Draw(img)
    x0, y0 = pad + 40, pad + 36
    d.text((x0, y0), 'MY LESSON', font=font(19, 750), fill=MOSS + (255,))
    d.text((x0, y0 + 46), UI['lesson_title'], font=font(40, 750), fill=INK + (255,))
    lines = wrap(UI['lesson_body'], 27, 540, w - 80)
    ly = y0 + 118
    for ln in lines:
        d.text((x0, ly), ln, font=font(27, 540), fill=(55, 62, 58, 255))
        ly += 38
    last = lines[-1]
    mx = x0 + font(27, 540).getlength(last) + 8
    my = ly - 38
    d.rounded_rectangle([mx, my + 3, mx + 34, my + 33], 8, fill=MOSS + (255,))
    d.text((mx + 10, my + 4), '1', font=font(21, 750), fill=CHALK + (255,))
    return from_pil(img), {'pad': pad, 'w': w, 'h': h, 'marker': (mx + 17, my + 18), 'button_y': ly + 40, 'x0': x0}


@lru_cache(maxsize=None)
def button(txt, kind):
    if kind == 'primary':
        return chip(txt, size=25, weight=700, fg=CHALK, bg=MOSS, bg_alpha=1.0, dot=None, shadow=8, pad_x=24, pad_y=13)
    if kind == 'checked':
        spr = chip('      ' + txt, size=25, weight=700, fg=MOSS, bg=(226, 232, 214), bg_alpha=1.0, dot=None, shadow=0, pad_x=24, pad_y=13)
        h = spr.shape[0]
        tick = polyline_layer([[(24, h / 2 + 1), (31, h / 2 + 8), (45, h / 2 - 8)]], MOSS, 3.6, size=(spr.shape[1], h))
        out = spr.copy()
        over_rgba_tuple(out, tick)
        return out
    return chip(txt, size=24, weight=650, fg=INK, bg=CHALK, bg_alpha=1.0, dot=None, shadow=4, pad_x=22, pad_y=12, stroke=(205, 200, 188))


@lru_cache(maxsize=1)
def part_callout():
    w, h = 470, 150
    img, pad = rrect_img(w, h, 22, fill=(255, 253, 249, 246), shadow=18, shadow_alpha=0.18)
    d = ImageDraw.Draw(img)
    d.ellipse([pad + 26, pad + 26, pad + 70, pad + 70], fill=MOSS + (255,))
    num = str(UI['part_badge'])
    d.text((pad + 48 - font(24, 750).getlength(num) / 2, pad + 32), num, font=font(24, 750), fill=CHALK + (255,))
    d.text((pad + 88, pad + 26), UI['part_name'], font=font(34, 750), fill=INK + (255,))
    d.text((pad + 88, pad + 80), UI['part_role'], font=font(24, 560), fill=(70, 78, 72, 255))
    return from_pil(img)


@lru_cache(maxsize=None)
def mode_chip(txt, active):
    if active:
        return chip(txt, size=24, weight=700, fg=CHALK, bg=MOSS, bg_alpha=1.0, dot=None, shadow=8, pad_x=26, pad_y=12)
    return chip(txt, size=24, weight=620, fg=INK, bg=(250, 247, 240), bg_alpha=1.0, dot=None, shadow=3, pad_x=26, pad_y=12, stroke=(210, 205, 194))


@lru_cache(maxsize=1)
def practice_card():
    w, h = 590, 620
    img, pad = rrect_img(w, h, 26, fill=(255, 253, 249, 255), shadow=22, shadow_alpha=0.16)
    d = ImageDraw.Draw(img)
    x0, y0 = pad + 40, pad + 36
    d.text((x0, y0), 'PRACTICE', font=font(19, 750), fill=MOSS + (255,))
    d.text((x0, y0 + 44), UI['practice_title'], font=font(36, 750), fill=INK + (255,))
    ly = y0 + 106
    for ln in wrap(UI['practice_prompt'], 26, 540, w - 80):
        d.text((x0, ly), ln, font=font(26, 540), fill=(55, 62, 58, 255))
        ly += 36
    box = (x0, ly + 52, pad + w - 40, ly + 52 + 200)
    d.rounded_rectangle(box, 16, fill=(248, 245, 238, 255), outline=(206, 201, 188, 255), width=2)
    d.text((x0 + 18, box[1] - 30), 'Your explanation', font=font(18, 650), fill=(95, 102, 96, 255))
    return from_pil(img), {'pad': pad, 'w': w, 'h': h, 'box': box}


@lru_cache(maxsize=None)
def typed_text(n_chars):
    note = UI['learner_note'][:n_chars]
    lines = wrap(note, 26, 560, 470) if note else []
    hgt = 36 * max(1, len(lines)) + 10
    img = Image.new('RGBA', (500, hgt), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, ln in enumerate(lines):
        d.text((0, i * 36), ln, font=font(26, 560), fill=INK + (255,))
    end = (font(26, 560).getlength(lines[-1]) if lines else 0, 36 * (len(lines) - 1) if lines else 0)
    return from_pil(img), end


@lru_cache(maxsize=1)
def saved_row():
    txt = UI['saved']
    w = int(font(24, 700).getlength(txt)) + 70
    img = Image.new('RGBA', (w * 4, 44 * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([0, 4 * 4, 36 * 4, 40 * 4], fill=MOSS + (255,))
    d.line([(9 * 4, 22 * 4), (16 * 4, 29 * 4), (28 * 4, 15 * 4)], fill=CHALK + (255,), width=4 * 4, joint='curve')
    img = img.resize((w, 44), Image.LANCZOS)
    ImageDraw.Draw(img).text((50, 6), txt, font=font(24, 700), fill=MOSS + (255,))
    return from_pil(img)


@lru_cache(maxsize=1)
def working_card():
    w, h = 700, 500
    img, pad = rrect_img(w, h, 28, fill=(255, 253, 249, 255), shadow=26, shadow_alpha=0.2)
    d = ImageDraw.Draw(img)
    x0, y0 = pad + 44, pad + 38
    d.text((x0, y0), 'MY WORKING', font=font(19, 750), fill=MOSS + (255,))
    for i, ln in enumerate(wrap(UI['working_title'], 34, 750, w - 88)):
        d.text((x0, y0 + 44 + i * 44), ln, font=font(34, 750), fill=INK + (255,))
    ry = y0 + 156
    for row in UI['working_rows']:
        d.rounded_rectangle([x0, ry, pad + w - 44, ry + 64], 14, fill=(244, 241, 233, 255))
        d.ellipse([x0 + 18, ry + 18, x0 + 46, ry + 46], outline=MOSS + (255,), width=3)
        d.line([(x0 + 25, ry + 32), (x0 + 30, ry + 37), (x0 + 39, ry + 26)], fill=MOSS + (255,), width=3)
        d.text((x0 + 64, ry + 17), row, font=font(23, 600), fill=(45, 52, 48, 255))
        ry += 78
    d.text((x0, ry + 10), 'Saved', font=font(20, 650), fill=(110, 116, 110, 255))
    return from_pil(img)


@lru_cache(maxsize=1)
def path_chip():
    """The organised path that replaces the scattered thoughts in the closing shot."""
    labels = UI['rail']
    f = font(22, 680)
    widths = [f.getlength(l) + 44 for l in labels]
    gap = 26
    w = int(sum(widths) + gap * (len(labels) - 1) + 48)
    h = 76
    img, pad = rrect_img(w, h, 38, fill=CHALK + (240,), shadow=16, shadow_alpha=0.22)
    d = ImageDraw.Draw(img)
    x = pad + 24
    cy = pad + h / 2
    d.line([(x + 10, cy), (x + sum(widths) + gap * 3 - 10, cy)], fill=SAGE + (255,), width=2)
    for l, wd in zip(labels, widths):
        d.rounded_rectangle([x, cy - 22, x + wd, cy + 22], 22, fill=MOSS + (255,))
        d.text((x + 22, cy - 15), l, font=f, fill=CHALK + (255,))
        x += wd + gap
    return from_pil(img)


@lru_cache(maxsize=None)
def caption_sprite(txt, thought):
    f = font(40, 650)
    tw = f.getlength(txt)
    w, h = int(tw + 64), 70
    img, pad = rrect_img(w, h, 18, fill=INK + (196,), shadow=0)
    d = ImageDraw.Draw(img)
    d.text((pad + 32, pad + 10), txt, font=f, fill=(SAGE if thought else CHALK) + (255,))
    return from_pil(img)


@lru_cache(maxsize=None)
def small_text(txt, size=18, weight=600, color=CHALK, shadow=True):
    spr = text_sprite(txt, size, weight, color)
    if not shadow:
        return spr
    sh = text_sprite(txt, size, weight, (0, 0, 0))
    sh = cv2.GaussianBlur(sh, (0, 0), 2.0) * 0.8
    out = np.zeros((spr.shape[0] + 4, spr.shape[1] + 4, 4), np.float32)
    over_rgba(out, sh, 2, 2)
    over_rgba(out, spr, 0, 0)
    return out


def over_rgba_tuple(dst, layer):
    arr, x, y = layer
    h, w = arr.shape[:2]
    d = dst[y:y + h, x:x + w]
    a = arr[:d.shape[0], :d.shape[1]]
    d *= 1 - a[..., 3:4]
    d += a


def over_rgba(dst, src, x, y):
    h, w = src.shape[:2]
    d = dst[y:y + h, x:x + w]
    d *= 1 - src[..., 3:4]
    d += src


@lru_cache(maxsize=1)
def laptop_lines():
    sx0, sy0, sx1, sy1 = 1010, 292, 1650, 690
    r = 22
    screen = []
    for a0, cx, cy in [(180, sx0 + r, sy0 + r), (270, sx1 - r, sy0 + r), (0, sx1 - r, sy1 - r), (90, sx0 + r, sy1 - r)]:
        for k in range(0, 91, 10):
            a = math.radians(a0 + k)
            screen.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    screen.append(screen[0])
    base = [(sx0 - 70, sy1 + 22), (sx1 + 70, sy1 + 22), (sx1 + 40, sy1 + 52), (sx0 - 40, sy1 + 52), (sx0 - 70, sy1 + 22)]
    hinge = [(sx0 + 30, sy1 + 22), (sx0 + 30, sy1 + 4), (sx1 - 30, sy1 + 4), (sx1 - 30, sy1 + 22)]
    return [screen, base, hinge], ((sx0 + sx1) / 2, (sy0 + sy1) / 2)


# ------------------------------------------------------------------ the product surface
def surface_content(t, variant):
    """Full-frame chalk product space with everything that lives inside it."""
    f = canvas(CHALK)
    # quiet dot texture, like the studio backdrop
    over(f, dots_layer(), 0, 0, 0.55)
    # header: lockup + rail
    over(f, brand.logo('kairo-lockup-horizontal.svg', 70), 40, 56)
    rail_fade = clamp((t - 4.15) / 0.3)
    draw_rail(f, t, rail_fade)
    # KAIRO: big at the reveal, then docked left
    kpos = track(t, [(4.55, (560.0, 640.0, 1000.0)), (5.2, (205.0, 752.0, 680.0))], ease=ease_in_out)
    kin = ease_out((t - 3.32) / 0.45)
    if kin > 0 and RM:
        spr = kairo_sprite(t)
        a = clamp((t - 4.95) / 0.15)
        for (cx, cy, hd), op in (((560.0, 640.0, 1000.0), 1 - a), ((205.0, 752.0, 680.0), a)):
            if op > 0:
                place(f, glow_sprite(), cx, cy - hd * 0.12, scale=hd / 900, opacity=0.55 * kin * op)
                place(f, spr, cx, cy, scale=hd / spr.shape[0], opacity=kin * op)
    elif kin > 0:
        spr = kairo_sprite(t)
        cx, cy, hd = kpos
        scale = hd / spr.shape[0] * lerp(0.96, 1.0, kin)
        place(f, glow_sprite(), cx, cy - hd * 0.12, scale=hd / 900, opacity=0.55 * kin)
        place(f, spr, cx, cy + (1 - kin) * 24, scale=scale, opacity=kin)
    # -------- source beat
    mat, ml = material_card()
    les, ll = lesson_card()
    mat_in = ease_out((t - 5.0) / 0.45)
    mat_out = ease_in_out((t - 11.15) / 0.5)
    # material card shrinks to the left column during the motor transition
    shrink = (1.0 if t >= 7.7 else 0.0) if RM else ease_in_out((t - 7.55) / 0.6)
    mscale = lerp(1.0, 0.62, shrink)
    mx = lerp(492.0, 480.0, shrink) - ml['pad'] * mscale
    my = lerp(166.0, 246.0, shrink) - ml['pad'] * mscale
    m_op = mat_in * (1 - mat_out)
    if RM:  # the size change happens inside a brief fade, not as movement
        m_op *= clamp(abs(t - 7.7) / 0.15)
    mat_geom = None
    if m_op > 0:
        cx = mx + mat.shape[1] * mscale / 2 + (0 if RM else (1 - mat_in) * -30)
        cy = my + mat.shape[0] * mscale / 2
        place(f, mat, cx, cy, scale=mscale, opacity=m_op)
        mat_geom = (cx - mat.shape[1] * mscale / 2, cy - mat.shape[0] * mscale / 2, mscale)
        gx, gy, gs = mat_geom
        # highlight sweep (multiply-like sage under-wash drawn on top at low alpha)
        hl_u = ease_in_out((t - 5.75) / 0.55)
        for (x0, y0, x1, y1) in ml['highlight']:
            if hl_u <= 0:
                break
            wdt = (x1 - x0) * gs * hl_u
            if wdt < 1:
                continue
            bar = np.zeros((max(1, int((y1 - y0) * gs)), max(1, int(wdt)), 4), np.float32)
            bar[..., :3] = np.array(SAGE, np.float32) / 255 * 0.42
            bar[..., 3] = 0.42
            over(f, bar, int(gx + x0 * gs), int(gy + y0 * gs), m_op)
        # copper trace along the diagram (7.2-7.65) and the rotor match (9.45+)
        tr = clamp((t - 7.2) / 0.45)
        polys_screen = [pl['pts'] * gs + [gx, gy] for pl in ml['polys']] if ml['polys'] else []
        if 0 < tr and t < 8.4:
            over(f, polyline_layer(polys_screen, COPPER, 2.6 * max(gs, 0.7), progress=1.0 if RM else tr), 0, 0, m_op * (tr if RM else 1))
        if t >= 9.45 and ml['polys']:
            rotor = [pl['pts'] * gs + [gx, gy] for pl in ml['polys'] if pl['part'] in ('rotor-cage', 'rotor-core')]
            over(f, polyline_layer(rotor, COPPER, 3.0 * gs + 0.6), 0, 0, m_op * ease_out((t - 9.45) / 0.3))
    l_in = ease_out((t - 5.45) / 0.45)
    l_out = ease_in_out((t - 7.5) / 0.4)
    if l_in > 0 and l_out < 1:
        lx = 1228 if RM else 1228 + (1 - l_in) * 40 + l_out * 80
        ly = 166
        cx = lx - ll['pad'] + les.shape[1] / 2
        cy = ly - ll['pad'] + les.shape[0] / 2
        op = l_in * (1 - l_out)
        place(f, les, cx, cy, opacity=op)
        # check-the-source button and connector
        bx = lx + 40
        by = ly + ll['button_y'] - ll['pad'] + 6
        if t >= 6.35:
            pressed = t >= 6.85
            spr = button(UI['checked'] if t >= 7.05 else UI['check_button'], 'checked' if t >= 7.05 else 'primary')
            press = 1 - 0.05 * math.sin(math.pi * clamp((t - 6.85) / 0.18)) if pressed and not RM else 1
            place(f, spr, bx + spr.shape[1] / 2, by + spr.shape[0] / 2, scale=press, opacity=op * ease_out((t - 6.35) / 0.25))
        if t >= 6.9 and mat_geom is not None and ml['highlight']:
            gx, gy, gs = mat_geom
            ys = [b[1] for b in ml['highlight']] + [b[3] for b in ml['highlight']]
            target = (gx + mat.shape[1] * gs - ml['pad'] * gs + 2, gy + (min(ys) + max(ys)) / 2 * gs)
            mk = (lx - ll['pad'] + ll['marker'][0], ly - ll['pad'] + ll['marker'][1])
            u = ease_in_out((t - 6.9) / 0.3)
            gutter = target[0] + 40
            curve = cubic([mk, (mk[0] + 10, mk[1] + 62), (gutter + 10, mk[1] + 62), target], 60)
            over(f, polyline_layer([curve], MOSS, 2.4, progress=1.0 if RM else u), 0, 0, op * (u if RM else 1))
            if u >= 1:
                for (x0, y0, x1, y1) in ml['highlight']:
                    box = [(gx + x0 * gs, gy + y0 * gs), (gx + x1 * gs, gy + y0 * gs), (gx + x1 * gs, gy + y1 * gs), (gx + x0 * gs, gy + y1 * gs)]
                    over(f, polyline_layer([box], MOSS, 1.8, closed=True), 0, 0, op * 0.8)
    # -------- motor beat
    proj = motor_projection()
    if RM and 7.8 <= t < 8.8 and proj:
        polys = [pl['px'] + MOTOR_OFFSET for pl in ml['polys']]
        over(f, polyline_layer(polys, COPPER, 2.4), 0, 0, window(t, 7.8, 8.75, 0.25, 0.4))
    elif 7.62 <= t < 8.8 and proj and mat_geom is not None:
        u = ease_in_out((t - 7.62) / 0.5)
        gx, gy, gs = mat_geom
        polys = []
        for pl in ml['polys']:
            a = pl['pts'] * gs + [gx, gy]
            b = pl['px'] + MOTOR_OFFSET
            polys.append(a + (b - a) * u)
        fade = 1 - ease_in_out((t - 8.3) / 0.45)
        over(f, polyline_layer(polys, COPPER, 2.4), 0, 0, fade)
    if 8.0 <= t < 16.2:
        spr = motor_sprite(t)
        if spr is not None:
            m_op = ease_out((t - 8.0) / 0.35) * (1 - ease_in_out((t - 14.25) / 0.5) * 0.6)
            dx = 0 if RM else int(round(100 * ease_in_out((t - 11.1) / 0.7)))
            over(f, shadow_ellipse(), 1320 - 380 + dx, 744, 0.9 * m_op)
            over(f, spr, MOTOR_OFFSET[0] + dx, MOTOR_OFFSET[1], m_op)
    if 9.45 <= t < 12.25:
        op = ease_out((t - 9.45) / 0.3) * (1 - ease_in_out((t - 11.9) / 0.35))
        callout = part_callout()
        cx, cy = 1505, 205
        anchor = cage_anchor(t)
        leader = [(cx - 120, cy + callout.shape[0] / 2 - 26), anchor]
        over(f, polyline_layer([leader], MOSS, 2.2, progress=1.0 if RM else ease_out((t - 9.5) / 0.3)), 0, 0, op)
        dot = disc(9, MOSS)
        place(f, dot, anchor[0], anchor[1], opacity=op)
        place(f, callout, cx, cy + (0 if RM else (1 - ease_out((t - 9.45) / 0.3)) * 12), opacity=op)
    if 10.15 <= t < 16.2:
        op = ease_out((t - 10.15) / 0.3) * (1 - ease_in_out((t - 14.25) / 0.4))
        names = UI['modes']
        sprites = [mode_chip(n, (n == 'Operate' and t >= 10.55) or (n == 'Inspect' and t < 10.55)) for n in names]
        total = sum(s.shape[1] for s in sprites) + 14 * 2
        mcx = 1320 if RM else 1320 + 100 * ease_in_out((t - 11.1) / 0.7)
        x = mcx - total / 2
        for n, s in zip(names, sprites):
            press = 1 - 0.06 * math.sin(math.pi * clamp((t - 10.55) / 0.16)) if n == 'Operate' and t >= 10.55 and not RM else 1
            place(f, s, x + s.shape[1] / 2, 872, scale=press, opacity=op)
            x += s.shape[1] + 14
        if t >= 10.7:
            note = small_text(UI['operate_note'], 20, 600, (80, 88, 82), shadow=False)
            place(f, note, mcx, 930, opacity=op * ease_out((t - 10.7) / 0.3))
    # -------- working beat
    pc, pl_ = practice_card()
    p_in = ease_out((t - 11.15) / 0.5)
    p_out = ease_in_out((t - 15.85) / 0.3)
    if p_in > 0:
        px0, py0 = 492, 186
        cx = px0 - pl_['pad'] + pc.shape[1] / 2 - (0 if RM else (1 - p_in) * 30)
        cy = py0 - pl_['pad'] + pc.shape[0] / 2 + (0 if RM else (1 - p_in) * 18)
        op = p_in * (1 - p_out)
        place(f, pc, cx, cy, opacity=op)
        bx0, by0, bx1, by1 = pl_['box']
        n_chars = int(len(UI['learner_note']) * clamp((t - 12.3) / 1.45))
        if n_chars > 0:
            spr, end = typed_text(n_chars)
            ox = px0 - pl_['pad'] + bx0 + 20
            oy = py0 - pl_['pad'] + by0 + 18
            over(f, spr, int(ox), int(oy), op)
            if t < 13.9 and int(t * 2.2) % 2 == 0:
                caret = np.zeros((32, 3, 4), np.float32); caret[..., :3] = np.array(MOSS) / 255; caret[..., 3] = 1
                over(f, caret, int(ox + end[0] + 3), int(oy + end[1] + 3), op)
        if t >= 13.85:
            sv = saved_row()
            u = ease_out((t - 13.85) / 0.3)
            place(f, sv, px0 + 40 + sv.shape[1] / 2, py0 + pl_['h'] - 46 + (0 if RM else (1 - u) * 8), opacity=op * u)
    if t >= 14.25:
        wc = working_card()
        u = ease_out((t - 14.25) / 0.55)
        place(f, wc, 1490, 520 + (0 if RM else (1 - u) * 60), scale=1.0 if RM else lerp(0.97, 1.0, u), opacity=u)
    # honesty super inside the product space
    if variant != 'entrant' and 5.0 <= t < 15.8:
        sup = small_text(UI['dramatisation_super'], 17, 600, (95, 102, 96), shadow=False)
        sx = W - sup.shape[1] - 30 if variant in ('silent', 'reduced') else CONTENT_X + 20  # clear of burned captions
        over(f, sup, sx, H - 40, window(t, 5.0, 15.8, 0.4, 0.3) * 0.95)
    return f


@lru_cache(maxsize=1)
def dots_layer():
    img = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(img)
    for y in range(18, H, 28):
        for x in range(18 + (14 if (y // 28) % 2 else 0), W, 28):
            d.ellipse([x - 1.1, y - 1.1, x + 1.1, y + 1.1], fill=255)
    a = np.asarray(img, np.float32) / 255 * 0.10
    out = np.zeros((H, W, 4), np.float32)
    out[..., :3] = (np.array(SAGE, np.float32) / 255)[None, None] * a[..., None]
    out[..., 3] = a
    return out


@lru_cache(maxsize=1)
def glow_sprite():
    s = 900
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    r = np.sqrt((xx - s / 2) ** 2 + (yy - s / 2) ** 2) / (s / 2)
    a = np.clip(1 - r, 0, 1) ** 1.8 * 0.55
    out = np.zeros((s, s, 4), np.float32)
    out[..., :3] = (np.array(SAGE, np.float32) / 255)[None, None] * a[..., None]
    out[..., 3] = a
    return out


@lru_cache(maxsize=1)
def shadow_ellipse():
    w, h = 760, 90
    img = Image.new('L', (w, h), 0)
    ImageDraw.Draw(img).ellipse([60, 20, w - 60, h - 20], fill=255)
    a = cv2.GaussianBlur(np.asarray(img, np.float32) / 255, (0, 0), 14) * 0.16
    out = np.zeros((h, w, 4), np.float32)
    out[..., :3] = (np.array(INK, np.float32) / 255)[None, None] * a[..., None]
    out[..., 3] = a
    return out


@lru_cache(maxsize=None)
def disc(r, color):
    s = r * 2 + 4
    img = Image.new('RGBA', (s * 4, s * 4), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse([8, 8, s * 4 - 8, s * 4 - 8], fill=color + (255,), outline=CHALK + (255,), width=8)
    return from_pil(img.resize((s, s), Image.LANCZOS))


@lru_cache(maxsize=1)
def cage_track():
    p = BUILD / 'motor-anchors.json'
    return json.loads(p.read_text(encoding='utf-8'))['rotor_cage_px'] if p.exists() else None


def cage_anchor(t):
    tr = cage_track()
    if tr:
        k = 75 if RM else max(1, min(len(tr), int(round((t - 8.0) * FPS)) + 1))
        x, y = tr[k - 1]
        return (x + MOTOR_OFFSET[0], y + MOTOR_OFFSET[1])
    return (1318.0, 470.0)


def cubic(pts, n):
    p0, p1, p2, p3 = (np.asarray(p, np.float32) for p in pts)
    u = np.linspace(0, 1, n)[:, None]
    return (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3 * p3


def bezier(pts, n):
    p0, p1, p2 = (np.asarray(p, np.float32) for p in pts)
    u = np.linspace(0, 1, n)[:, None]
    return ((1 - u) ** 2) * p0 + 2 * (1 - u) * u * p1 + (u ** 2) * p2


# ------------------------------------------------------------------ thoughts (opening)
def draw_thoughts(f, t):
    head = (812, 330)
    for th in TL['thoughts']['atmosphere']:
        if t < th['at']:
            continue
        spr = atmos_chip(th['text'])
        u = ease_out((t - th['at']) / 0.5)
        x, y = th['pos']
        dx, dy = (head[0] - x), (head[1] - y)
        dist = math.hypot(dx, dy) or 1
        drift = 0 if RM else 10 * clamp((t - th['at']) / 2.5)
        x += dx / dist * drift
        y += dy / dist * drift
        op = 0.58 * u
        blur = 1.4
        becomes = th.get('becomes')
        if t >= 3.0:
            if becomes and not RM:
                continue  # drawn by the reorganisation
            r = ease_in_out((t - 3.0) / 0.45)
            op *= 1 - r
            if not RM:
                blur += 6 * r
                x -= dx / dist * 50 * r
                y -= dy / dist * 50 * r
        place(f, spr, x, y + (0 if RM else (1 - u) * 10), opacity=op, blur=blur)
    for th in TL['thoughts']['hero']:
        if t < th['at']:
            continue
        if t >= 3.32 and not RM:
            continue  # handed to the reorganisation
        spr = hero_chip(th['text'])
        u = ease_out((t - th['at']) / 0.4)
        if RM:
            u *= 1 - clamp((t - 3.3) / 0.3)  # reduced motion: the questions simply fade out
            if u <= 0:
                continue
        x, y = th['pos']
        press = 1.0 if RM else 1 + 0.012 * math.sin(2 * math.pi * (t - th['at']) / 1.6) * clamp((t - 2.0) / 0.8)
        # tether towards the head: thoughts belong to the learner
        tx = x + (head[0] - x) * 0.18
        ty = y + (head[1] - y) * 0.18 + 26
        tether = [(x + (head[0] - x) * 0.1, y + (head[1] - y) * 0.1 + 18), (tx, ty)]
        over(f, polyline_layer([tether], CHALK, 1.6, alpha=0.55 * u), 0, 0, 1.0 if t < 3.0 else 1 - clamp((t - 3.0) / 0.3))
        place(f, spr, x, y + (0 if RM else (1 - u) * 14), scale=1.0 if RM else lerp(0.96, 1.0, u) * press, opacity=u)


def draw_reorganisation(f, t):
    """3.0-4.45 s: the questions become the path (screen space, over the growing surface)."""
    if not (3.0 <= t < 4.5):
        return
    items = [(th, hero_chip(th['text'])) for th in TL['thoughts']['hero']]
    motor_q = next(th for th in TL['thoughts']['atmosphere'] if th.get('becomes'))
    items.append((motor_q, atmos_chip(motor_q['text'])))
    for th, spr in items:
        label = th['becomes']
        idx = UI['rail'].index(label)
        end = RAIL[idx]
        start = th['pos']
        u = ease_in_out((t - 3.32) / 0.95)
        x = lerp(start[0], end[0], u)
        y = lerp(start[1], end[1], u) - math.sin(math.pi * u) * 40
        hero = th in TL['thoughts']['hero']
        base_op = 1.0 if hero else 0.58 + 0.42 * clamp((t - 3.0) / 0.3)
        lbl = rail_chip(label, 'idle')
        k = smooth((u - 0.35) / 0.3)
        s_from = lerp(1.0, lbl.shape[0] / spr.shape[0], u)
        s_to = lerp(spr.shape[0] / lbl.shape[0], 1.0, u)
        fade_end = 1 - clamp((t - 4.3) / 0.15)
        place(f, spr, x, y, scale=s_from, opacity=base_op * (1 - k) * fade_end, blur=0 if hero else 1.4 * (1 - u))
        place(f, lbl, x, y, scale=s_to, opacity=k * fade_end)


# ------------------------------------------------------------------ frame
def render(n, variant='master'):
    global RM
    RM = variant == 'reduced'
    t = n / FPS
    photo = True
    if t < 3.0:
        m = opening_matrix(t)
        f = student_plate(STILL_A, m)
        draw_sticker(f, m, 1.0)
        if variant == 'entrant':
            f = entrant_placeholder(f, t, 'opening')
        else:
            draw_thoughts(f, t)
            sup = small_text(UI['dramatisation_super'], 17, 600, CHALK)
            over(f, sup, 40, H - 44, window(t, 0.3, 2.95, 0.4, 0.3) * 0.8)
    elif t < 4.1 and RM:
        m, _ = screen_push(3.0, entering=True)
        f = student_plate(STILL_C, m)
        screen_composite(f, t, m, 0.0, variant, t)
        a = clamp((t - 3.6) / 0.3)
        if a > 0:
            over_full(f, surface_content(t, variant), a)
        draw_thoughts(f, t)
    elif t < 4.1:
        m, u = screen_push(t, entering=True)
        f = student_plate(STILL_C, m, blur=2.2 * ease_in(u), gain=1 - 0.08 * u)
        screen_composite(f, t, m, u, variant, t)
        if variant != 'entrant':
            draw_thoughts(f, t)
            draw_reorganisation(f, t)
    elif t < 15.85:
        photo = False
        f = surface_content(t, variant)
        if variant not in ('entrant', 'reduced'):
            draw_reorganisation(f, t)
    elif t < 16.5 and RM:
        m = closing_matrix(t)
        f = student_plate(STILL_B, m)
        draw_sticker(f, m, 1.0)
        a = 1 - clamp((t - 15.85) / 0.3)
        if a > 0:
            over_full(f, surface_content(15.84, variant), a)
    elif t < 16.5:
        m, u = screen_push(t, entering=False)
        f = student_plate(STILL_C, m, blur=2.0 * u, gain=1 - 0.08 * u)
        screen_composite(f, t, m, u, variant, 15.84)
    elif t < 17.75:
        m = closing_matrix(t)  # learner, calmer
        f = student_plate(STILL_B, m)
        draw_sticker(f, m, 1.0)
        if variant == 'entrant':
            f = entrant_placeholder(f, t, 'close')
        else:
            pc = path_chip()
            u = ease_out((t - 16.62) / 0.5)
            place(f, pc, 1238, 214 + (0 if RM else (1 - u) * 14), scale=0.92, opacity=u)
        if t >= 17.55:
            close = brand_close(t, variant)
            over_full(f, close, ease_in_out((t - 17.55) / 0.2))
    else:
        photo = False
        f = brand_close(t, variant)
    # finishing: vignette and grain everywhere for one photographic surface
    f *= vignette() if photo else vignette() * 0.35 + 0.65
    f += grain(0 if RM else n, 0.014)  # reduced motion: still grain
    if variant in ('silent', 'reduced'):
        draw_captions(f, t)
    if variant == 'review':
        lab = small_text('REVIEW CUT v0.1 · temp voice · reconstructed interface · fictional student', 18, 650, CHALK)
        bg = np.zeros((lab.shape[0] + 12, lab.shape[1] + 24, 4), np.float32)
        bg[..., :3] = 0.08; bg[..., 3] = 0.55
        over(f, bg, W - bg.shape[1] - 24, 22)
        over(f, lab, W - bg.shape[1] - 12, 28)
    return f


def over_full(f, g, a):
    f *= 1 - a
    f += g * a


def entrant_placeholder(f, t, which):
    g = f * 0.35
    lines = {'opening': ['ENTRANT OPENING · 0–3 s', 'Record yourself: the three questions, or your own hook.', 'Placeholder for review only. See CAPTURE-LIST.md'],
             'close': ['ENTRANT CLOSE · 16–17.6 s', 'You on camera: “KAIRO. Put knowledge to work.”', 'Placeholder for review only. See CAPTURE-LIST.md']}[which]
    y = 430
    for i, ln in enumerate(lines):
        spr = small_text(ln, 44 if i == 0 else 30, 750 if i == 0 else 600, CHALK)
        place(g, spr, W / 2, y, opacity=1.0)
        y += 70 if i == 0 else 50
    return g


def brand_close(t, variant):
    f = canvas(MOSS)
    over(f, close_glow(), 0, 0, 1.0)
    # KAIRO beside the device
    if variant != 'entrant' or t >= 17.6:
        spr = kairo_sprite(t)
        u = ease_out((t - 17.5) / 0.5)
        place(f, spr, 520, 640 + (0 if RM else (1 - u) * 20), scale=1000 / spr.shape[0], opacity=u)
    lines, centre = laptop_lines()
    draw = ease_in_out((t - 17.6) / 0.55)
    over(f, polyline_layer(lines, CHALK, 3.0, alpha=0.92, progress=1.0 if RM else draw), 0, 0, draw if RM else 1.0)
    lock = brand.logo('kairo-lockup-horizontal-chalk.svg', 150)
    place(f, lock, centre[0], centre[1], opacity=ease_out((t - 17.85) / 0.4))
    slogan = text_sprite(UI['slogan'], 56, 680, CHALK)
    place(f, slogan, centre[0], 840, opacity=ease_out((t - 18.15) / 0.4))
    cta = chip(UI['cta'], size=26, weight=680, fg=CHALK, bg=MOSS, bg_alpha=1.0, dot=None, shadow=0, stroke=SAGE)
    place(f, cta, centre[0], 932, opacity=ease_out((t - 18.6) / 0.4))
    credit = small_text('KAIRO character based on the Rain rig © Blender Foundation | studio.blender.org, CC BY 4.0', 15, 560, (200, 206, 190), shadow=False)
    over(f, credit, 36, H - 34, ease_out((t - 18.0) / 0.5) * 0.85)
    return f


@lru_cache(maxsize=1)
def close_glow():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - 900) / 1300) ** 2 + ((yy - 520) / 820) ** 2)
    a = np.clip(1 - r, 0, 1) ** 2 * 0.16
    out = np.zeros((H, W, 4), np.float32)
    out[..., :3] = (np.array(SAGE, np.float32) / 255)[None, None] * a[..., None]
    out[..., 3] = a
    return out


def draw_captions(f, t):
    for lid, ln in VOICE.items():
        if ln['start'] - 0.05 <= t <= ln['end'] + 0.35:
            thought = ln['speaker'] != 'KAIRO'
            spr = caption_sprite(ln['text'], thought)
            op = window(t, ln['start'] - 0.05, ln['end'] + 0.35, 0.12, 0.15)
            if thought:
                # chorus captions stack so overlapping thoughts stay readable
                idx = ['c1', 'c2', 'c3'].index(lid)
                place(f, spr, W / 2, 1012 - 80 * sum(1 for o in ['c1', 'c2', 'c3'][idx + 1:]
                                                   if VOICE[o]['start'] - 0.05 <= t <= VOICE[o]['end'] + 0.35), opacity=op)
            else:
                place(f, spr, W / 2, 1012, opacity=op)


# ------------------------------------------------------------------ output
def ffmpeg_exe():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def encode(variant, audio, out_path, frames=range(FRAMES)):
    cmd = [ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
           '-r', str(FPS), '-i', '-']
    if audio and Path(audio).exists():
        cmd += ['-i', str(audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000']
    cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
            '-r', str(FPS), '-frames:v', str(len(frames)), '-movflags', '+faststart', str(out_path)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.monotonic()
    for i, n in enumerate(frames):
        p.stdin.write(to_uint8(render(n, variant)).tobytes())
        if i % 60 == 0:
            print(f'{variant}: frame {n} ({time.monotonic() - t0:.0f}s)', flush=True)
    p.stdin.close()
    if p.wait() != 0:
        raise SystemExit(f'FFmpeg failed for {out_path}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--variant', default='master', choices=['master', 'silent', 'review', 'entrant', 'reduced'])
    ap.add_argument('--stills', default='')
    ap.add_argument('--audio', default='')
    ap.add_argument('--out', default='')
    a = ap.parse_args()
    if a.stills:
        qa = HERE / 'qa/stills'
        qa.mkdir(parents=True, exist_ok=True)
        for s in a.stills.split(','):
            n = int(s)
            Image.fromarray(to_uint8(render(n, a.variant))).save(qa / f'{a.variant}-{n:03d}.png')
            print('still', n)
        return
    OUT.mkdir(parents=True, exist_ok=True)
    out = Path(a.out) if a.out else OUT / f'kairo-when-it-clicks-{a.variant}-1080p30.mp4'
    encode(a.variant, a.audio, out)
    print('WROTE', out)


if __name__ == '__main__':
    main()
