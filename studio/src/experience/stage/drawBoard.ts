// Draws the classroom board into a 2D canvas and measures every anchor it draws (classroom-board/1).
// Moss board, chalk writing, copper highlight; the master micro mark in the corner (it sits below 32 px on screen).
import { SYMBOL_MICRO } from '../brand/markArt.ts';
import { RECORD, WORK, clampStep, type Rect } from './board.ts';

export const BOARD_FONT = 'KairoManrope';
const FALLBACK = 'Manrope, Arial, sans-serif';
const C = { moss: '#3E5144', chalk: '#F5F0E6', sage: '#A7AF91', copper: '#AE7555', dim: 'rgba(245,240,230,0.55)', faint: 'rgba(245,240,230,0.22)' };

export type BoardState = { step: number; reveal: number; highlight: string | null; fontReady: boolean };

let markPath: Path2D | null = null;

function font(weight: number, px: number, ready: boolean) {
  return `${weight} ${Math.round(px)}px ${ready ? `${BOARD_FONT}, ${FALLBACK}` : FALLBACK}`;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Draws the board for `state` and returns each anchor's rectangle in normalised board coordinates. */
export function drawBoard(g: CanvasRenderingContext2D, state: BoardState): Record<string, Rect> {
  const W = g.canvas.width, H = g.canvas.height;
  const step = clampStep(state.step);
  const rects: Record<string, Rect> = {};
  const norm = (x: number, y: number, w: number, h: number): Rect => ({ u: x / W, v: y / H, w: w / W, h: h / H });

  // Surface: moss with a soft vignette so chalk reads as written on a matte board.
  g.fillStyle = C.moss;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.45, H * 0.4, H * 0.1, W * 0.5, H * 0.5, W * 0.7);
  glow.addColorStop(0, 'rgba(255,255,255,0.05)');
  glow.addColorStop(1, 'rgba(0,0,0,0.16)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  const pad = W * 0.05;
  // Header: micro mark, topic, step counter.
  const markH = H * 0.06;
  markPath ??= new Path2D(SYMBOL_MICRO.d);
  const [ix0, iy0, ix1, iy1] = SYMBOL_MICRO.ink;
  const ms = markH / (iy1 - iy0);
  g.save();
  g.translate(pad - ix0 * ms, H * 0.07 - iy0 * ms);
  g.scale(ms, ms);
  g.fillStyle = C.chalk;
  g.fill(markPath);
  g.restore();
  g.fillStyle = C.dim;
  g.font = font(700, H * 0.042, state.fontReady);
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillText('STOCK CONTROL', pad + (ix1 - ix0) * ms + W * 0.018, H * 0.07 + markH * 0.78);
  g.textAlign = 'right';
  g.fillText(`Step ${step + 1} of ${WORK.length}`, W - pad, H * 0.07 + markH * 0.78);
  g.textAlign = 'left';

  // The record: four cells across the top.
  const cellY = H * 0.18, cellH = H * 0.17, gap = W * 0.018;
  const cellW = (W - 2 * pad - gap * (RECORD.length - 1)) / RECORD.length;
  RECORD.forEach((r, i) => {
    const x = pad + i * (cellW + gap);
    g.strokeStyle = C.faint;
    g.lineWidth = H * 0.004;
    roundRect(g, x, cellY, cellW, cellH, H * 0.02);
    g.stroke();
    g.fillStyle = C.dim;
    g.font = font(600, H * 0.036, state.fontReady);
    g.fillText(r.label, x + cellW * 0.08, cellY + cellH * 0.36);
    g.fillStyle = C.chalk;
    g.font = font(750, H * 0.075, state.fontReady);
    const text = String(r.value);
    const tw = g.measureText(text).width;
    const tx = x + cellW * 0.08, base = cellY + cellH * 0.84;
    g.fillText(text, tx, base);
    rects[`record-${r.value}`] = norm(tx, base - H * 0.058, tw, H * 0.064);
  });

  // Working lines, one per step written so far; the newest is brighter, underlined and revealed progressively.
  const lineBase = [H * 0.535, H * 0.71, H * 0.885];
  const size = H * 0.15;
  for (let i = 0; i <= step; i++) {
    const current = i === step;
    const y = lineBase[i];
    let x = pad + W * 0.01;
    const startX = x;
    g.font = font(750, size, state.fontReady);
    const space = g.measureText(' ').width * 1.3;
    const pieces: { text: string; value: number | null; x: number; w: number }[] = [];
    for (const t of WORK[i]) {
      const w = g.measureText(t.text).width;
      pieces.push({ ...t, x, w });
      x += w + space;
    }
    const lineW = x - space - startX;
    rects[`line-${i}`] = norm(startX, y - size * 0.78, lineW, size * 0.9);
    for (const p of pieces) if (p.value !== null) rects[`work-${i}-${p.value}`] = norm(p.x, y - size * 0.76, p.w, size * 0.86);
    const reveal = current ? Math.max(0, Math.min(1, state.reveal)) : 1;
    g.save();
    if (reveal < 1) {
      g.beginPath();
      g.rect(startX - W * 0.01, y - size, lineW * reveal + W * 0.01, size * 1.3);
      g.clip();
    }
    g.fillStyle = current ? C.chalk : C.dim;
    for (const p of pieces) g.fillText(p.text, p.x, y);
    if (current) {
      g.fillStyle = C.copper;
      g.fillRect(startX, y + size * 0.16, lineW * reveal, H * 0.008);
    }
    g.restore();
    if (current && reveal > 0 && reveal < 1) {
      // Chalk point at the writing edge.
      g.fillStyle = C.chalk;
      g.beginPath();
      g.arc(startX + lineW * reveal, y - size * 0.3, H * 0.009, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Highlight: copper ring and wash around the anchor the lesson is talking about (also shown in reading view text).
  const h = state.highlight ? rects[state.highlight] : undefined;
  if (h) {
    const m = H * 0.018;
    const x = h.u * W - m, y = h.v * H - m, w = h.w * W + 2 * m, hh = h.h * H + 2 * m;
    g.fillStyle = 'rgba(174,117,85,0.22)';
    roundRect(g, x, y, w, hh, H * 0.02);
    g.fill();
    g.strokeStyle = C.copper;
    g.lineWidth = H * 0.008;
    g.stroke();
  }
  return rects;
}
