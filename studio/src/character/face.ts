// Face timing helpers: viseme lookup with short coarticulation blends, an amplitude-only fallback and a blink clock.
import { VISEMES } from './rig.ts';
import type { Viseme } from './types.ts';

/** Index of the last viseme starting at or before `time` (binary search), or -1. */
export function visemeIndex(visemes: readonly Viseme[], time: number) {
  let lo = 0;
  let hi = visemes.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (visemes[mid].at <= time) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

function add(out: Record<string, number>, shape: string, scale: number) {
  const weights = VISEMES[shape] ?? VISEMES.X;
  for (const key in weights) out[key] = (out[key] ?? 0) + weights[key] * scale;
}

/**
 * Writes mouth shape weights for `time` into `out` (added on top of existing values). Consecutive shapes cross-fade
 * over `blend` seconds, which keeps fast sequences readable without popping. Returns the active shape letter.
 */
export function visemeWeights(visemes: readonly Viseme[], time: number, out: Record<string, number>, blend = 0.07) {
  const i = visemeIndex(visemes, time);
  if (i < 0) return null;
  const current = visemes[i];
  if (current.end !== undefined && time > current.end + blend) return null;
  const into = Math.min(1, (time - current.at) / blend);
  add(out, current.shape, into * current.weight);
  if (into < 1 && i > 0) add(out, visemes[i - 1].shape, (1 - into) * visemes[i - 1].weight);
  return current.shape;
}

/** Amplitude-only fallback: opens the jaw with speech energy. Not phoneme-aligned. */
export function amplitudeWeights(energy: number, out: Record<string, number>) {
  const e = Math.min(1, Math.max(0, energy));
  out.jawOpen = (out.jawOpen ?? 0) + Math.min(0.42, e * 0.75);
  out.mouthLowerDown = (out.mouthLowerDown ?? 0) + e * 0.18;
  out.mouthStretchLeft = (out.mouthStretchLeft ?? 0) + e * 0.06;
  out.mouthStretchRight = (out.mouthStretchRight ?? 0) + e * 0.06;
}

/** Natural blink timing: 2.5-6 s apart (1.8-4 s while speaking), sometimes doubled, ~0.2 s each. */
export class BlinkClock {
  private wait: number;
  private phase = -1;
  private double = false;
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    this.wait = 1 + random() * 2;
  }

  /** Advances time and returns the blink closure 0..1. */
  update(dt: number, speaking: boolean) {
    if (this.phase < 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.phase = 0;
        this.double = this.random() < 0.15;
      }
      return 0;
    }
    this.phase += dt;
    const closing = 0.07, hold = 0.03, opening = 0.11;
    const total = closing + hold + opening;
    let w: number;
    if (this.phase < closing) w = this.phase / closing;
    else if (this.phase < closing + hold) w = 1;
    else w = Math.max(0, 1 - (this.phase - closing - hold) / opening);
    if (this.phase >= total) {
      if (this.double) {
        this.double = false;
        this.phase = 0;
      } else {
        this.phase = -1;
        const [lo, hi] = speaking ? [1.8, 4] : [2.5, 6];
        this.wait = lo + this.random() * (hi - lo);
      }
    }
    return w * w * (3 - 2 * w);
  }
}
