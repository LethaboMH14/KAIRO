// Chooses master or micro KAIRO artwork for a rendered height (pure, so it can be tested without a DOM).
import { LOCKUP_HORIZONTAL, LOCKUP_HORIZONTAL_MICRO, LOCKUP_SYMBOL_SHARE, MICRO_BELOW_PX, SYMBOL, SYMBOL_MICRO, type MarkArt } from './markArt.ts';

/** Rendered symbol (ink) height in CSS pixels for art drawn `heightPx` tall. */
export function symbolInkPx(kind: 'symbol' | 'lockup', heightPx: number) {
  if (kind === 'lockup') return heightPx * LOCKUP_SYMBOL_SHARE;
  const box = Number(SYMBOL.viewBox.split(' ')[3]);
  return heightPx * ((SYMBOL.ink[3] - SYMBOL.ink[1]) / box);
}

/** Below the measured 32 px limit only the micro art keeps both strokes and the open counter. */
export function chooseArt(kind: 'symbol' | 'lockup', heightPx: number): MarkArt {
  const micro = symbolInkPx(kind, heightPx) < MICRO_BELOW_PX;
  if (kind === 'symbol') return micro ? SYMBOL_MICRO : SYMBOL;
  return micro ? LOCKUP_HORIZONTAL_MICRO : LOCKUP_HORIZONTAL;
}
