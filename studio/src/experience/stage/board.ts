// classroom-board/1: where the /classroom board stands, what it shows at each lesson step and the anchors Rain can
// point at. Pure (no DOM): drawBoard.ts measures the drawn tokens and targetsFor() turns them into world targets.
// Working lines come from the authored lesson (session.ts), so the board never says more than the lesson does.
import type { Target, Vec3 } from '../../character/types.ts';
import { STOCK_LESSON } from '../session.ts';

export const BOARD_CONTRACT = 'classroom-board/1';

/** World metres; Rain stands at the origin facing +Z, so +X is her left. The board stands at her left, angled to the
 *  class, inside a side-forward reach for its near half (the far half is pointed at along a ray). */
export const BOARD = { centre: [0.7, 1.33, 0.06] as Vec3, yaw: -0.85, width: 1.04, height: 0.68, lift: 0.022 };

/** The source record, always on the board: the lesson works from it. */
export const RECORD = [
  { label: 'Opening', value: 20 },
  { label: 'Delivery', value: 12 },
  { label: 'Sales', value: 9 },
  { label: 'Shelf count', value: 22 },
] as const;

export type Token = { text: string; value: number | null };

/** One working line per lesson step, tokenised from the authored formula. */
export const WORK: readonly (readonly Token[])[] = STOCK_LESSON.map(step => step.formula.split(' ').map(text => {
  const value = Number(text);
  return { text, value: text.trim() !== '' && Number.isFinite(value) ? value : null };
}));

/** Order of the number buttons, matching the lesson's reading order. */
export const NUMBER_ORDER = [20, 12, 32, 9, 23, 22] as const;

export function clampStep(step: number) {
  return Number.isInteger(step) ? Math.max(0, Math.min(WORK.length - 1, step)) : 0;
}

/** Numbers visible on the board at `step`: the record plus every working line written so far. */
export function boardNumbers(step: number): number[] {
  const s = clampStep(step);
  const seen = new Set<number>(RECORD.map(r => r.value));
  for (let i = 0; i <= s; i++) for (const t of WORK[i]) if (t.value !== null) seen.add(t.value);
  return NUMBER_ORDER.filter(n => seen.has(n));
}

/** Board anchor that shows `value` at `step`: the latest working line containing it, else its record cell. */
export function boardAnchorFor(value: number, step: number): string | null {
  const s = clampStep(step);
  for (let i = s; i >= 0; i--) if (WORK[i].some(t => t.value === value)) return `work-${i}-${value}`;
  return RECORD.some(r => r.value === value) ? `record-${value}` : null;
}

/** What Rain points at for `value`: the observed count is the shelf itself; everything else is on the board. */
export function pointAnchorFor(value: number, step: number): string | null {
  if (value === 22) return 'shelf';
  return boardAnchorFor(value, step);
}

/** The token that closes a working line (its result), for the end of the writing sequence. */
export function resultAnchor(step: number): string {
  const s = clampStep(step);
  const numbers = WORK[s].filter(t => t.value !== null);
  return `work-${s}-${numbers[numbers.length - 1].value}`;
}

export function lineAnchor(step: number) {
  return `line-${clampStep(step)}`;
}

/** Characters written for a step's line (drives the writing duration). */
export function lineLength(step: number) {
  return WORK[clampStep(step)].map(t => t.text).join(' ').length;
}

/** Normalised board coordinates (u right, v down, 0..1) -> board-local metres (x right, y up). */
export function boardLocal(u: number, v: number): [number, number] {
  return [(u - 0.5) * BOARD.width, (0.5 - v) * BOARD.height];
}

/** Board-local metres -> world position on the board face (lifted off it) and the face normal. */
export function boardWorld(x: number, y: number): { position: Vec3; normal: Vec3 } {
  const [cx, cy, cz] = BOARD.centre;
  const c = Math.cos(BOARD.yaw), s = Math.sin(BOARD.yaw);
  const z = BOARD.lift;
  return { position: [cx + x * c + z * s, cy + y, cz - x * s + z * c], normal: [s, 0, c] };
}

/** A drawn region in normalised board coordinates. */
export type Rect = { u: number; v: number; w: number; h: number };

/** Pointing targets from measured board rectangles: numbers at their centre, line starts at their left edge. */
export function targetsFor(rects: Readonly<Record<string, Rect>>, extra: readonly Target[] = []): Target[] {
  const out: Target[] = [];
  for (const id of Object.keys(rects).sort()) {
    const r = rects[id];
    const u = id.startsWith('line-') ? r.u : r.u + r.w / 2;
    const [x, y] = boardLocal(u, r.v + r.h / 2);
    out.push({ id, ...boardWorld(x, y) });
  }
  return [...out, ...extra];
}

/** The shelf beside Rain's right (-X): 22 notebooks in three stacks; the target is the top of the middle stack. */
export const SHELF = { centre: [-0.98, 0, -0.18] as Vec3, yaw: 0.55, width: 0.62, height: 0.78, depth: 0.34, stacks: [8, 7, 7] as const, notebook: [0.21, 0.012, 0.15] as Vec3 };

export function shelfTarget(): Target {
  const [cx, , cz] = SHELF.centre;
  const top = SHELF.height + SHELF.stacks[1] * SHELF.notebook[1] + 0.004;
  return { id: 'shelf', position: [cx, top, cz], normal: [0, 1, 0] };
}
