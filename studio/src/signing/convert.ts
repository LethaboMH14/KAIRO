// Tracker output -> LandmarkFrame, plus the plain-language framing hints. Pure.
import type { HandSide, LandmarkFrame, Point3, TrackedHand } from './contract.ts';

export type RawLandmark = { x: number; y: number; z: number };
export type RawHandResult = {
  landmarks: readonly (readonly RawLandmark[])[];
  handedness?: readonly (readonly { categoryName: string; score: number }[])[];
};

export const HAND_POINTS = 21;

/**
 * MediaPipe labels handedness assuming a mirrored (selfie) picture. KAIRO feeds the tracker the raw, un-mirrored camera
 * frame, so the labels are swapped to give the learner's own left and right. (The preview is mirrored separately.)
 */
export function userSide(modelLabel: string | undefined): HandSide {
  const label = (modelLabel ?? '').toLowerCase();
  if (label === 'left') return 'right';
  if (label === 'right') return 'left';
  return 'unknown';
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function toLandmarkFrame(raw: RawHandResult, meta: { session: number; seq: number; capturedAt: number; width: number; height: number }): LandmarkFrame {
  const hands: TrackedHand[] = [];
  raw.landmarks.forEach((landmarks, i) => {
    if (landmarks.length !== HAND_POINTS) return;
    const points: Point3[] = [];
    for (const p of landmarks) {
      if (!finite(p.x) || !finite(p.y) || !finite(p.z)) return;
      points.push([p.x, p.y, p.z]);
    }
    const category = raw.handedness?.[i]?.[0];
    hands.push({ side: userSide(category?.categoryName), sideScore: finite(category?.score) ? category.score : 0, points });
  });
  return { ...meta, hands };
}

export type HintCode = 'no-hands' | 'one-hand' | 'hand-at-edge' | 'low-light';
export type Hint = { code: HintCode; text: string };

export const HINT_TEXT: Record<HintCode, string> = {
  'no-hands': 'No hands in view yet. Raise your hands into the picture.',
  'one-hand': 'One hand is in view.',
  'hand-at-edge': 'A hand is at the edge of the picture. Move back a little.',
  'low-light': 'More light would help.',
};

export const LOW_LIGHT = 60; // mean luma on 0..255
export const EDGE = 0.02;

/** Which hints apply to this frame. Only picture facts: nothing about who the signer is or how well they sign. */
export function hintCodes(frame: LandmarkFrame | null, luma: number | null): HintCode[] {
  const out: HintCode[] = [];
  if (luma !== null && luma < LOW_LIGHT) out.push('low-light');
  if (!frame) return out;
  if (frame.hands.length === 0) out.push('no-hands');
  else if (frame.hands.length === 1) out.push('one-hand');
  if (frame.hands.some(h => h.points.some(([x, y]) => x < EDGE || x > 1 - EDGE || y < EDGE || y > 1 - EDGE))) out.push('hand-at-edge');
  return out;
}

export function meanLuma(rgba: ArrayLike<number>): number {
  let sum = 0, n = 0;
  for (let i = 0; i + 2 < rgba.length; i += 4) {
    sum += 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2];
    n++;
  }
  return n ? sum / n : 0;
}

/** Shows a hint only after it has held steadily, so a hand crossing the edge does not make the text flicker. */
export class HintSmoother {
  private since = new Map<HintCode, number>();
  private readonly holdMs: number;

  constructor(holdMs = 600) {
    this.holdMs = holdMs;
  }

  update(codes: readonly HintCode[], now: number): Hint[] {
    const present = new Set(codes);
    for (const code of [...this.since.keys()]) if (!present.has(code)) this.since.delete(code);
    for (const code of present) if (!this.since.has(code)) this.since.set(code, now);
    return (Object.keys(HINT_TEXT) as HintCode[])
      .filter(code => present.has(code) && now - (this.since.get(code) as number) >= this.holdMs)
      .map(code => ({ code, text: HINT_TEXT[code] }));
  }

  reset() {
    this.since.clear();
  }
}
