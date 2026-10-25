// Rendering tiers for the classroom room. The starting tier comes from what the browser reports (or a saved-data
// request); measured frame times can only lower it during a visit. No fps promise: the thresholds are switching
// rules to be confirmed on real phones and laptops, not a performance claim.

export type Tier = 'full' | 'balanced' | 'light';
export type TierSettings = { dpr: [number, number]; shadows: boolean; shadowMap: number; environment: boolean; boardTexture: number; badge: boolean };

export const TIERS: Record<Tier, TierSettings> = {
  full: { dpr: [1, 1.75], shadows: true, shadowMap: 2048, environment: true, boardTexture: 2048, badge: true },
  balanced: { dpr: [1, 1.25], shadows: true, shadowMap: 1024, environment: false, boardTexture: 1536, badge: true },
  light: { dpr: [1, 1], shadows: false, shadowMap: 0, environment: false, boardTexture: 1024, badge: false },
};

export const ORDER: readonly Tier[] = ['full', 'balanced', 'light'];

export type DeviceHints = { deviceMemory?: number; cores?: number; saveData?: boolean; coarsePointer?: boolean; width?: number };

export function initialTier(h: DeviceHints): Tier {
  if (h.saveData) return 'light';
  if ((h.deviceMemory !== undefined && h.deviceMemory <= 2) || (h.cores !== undefined && h.cores <= 2)) return 'light';
  if (h.coarsePointer && (h.width ?? 0) < 900) return 'balanced';
  if ((h.deviceMemory ?? 0) >= 8 && (h.cores ?? 0) >= 8) return 'full';
  return 'balanced';
}

export function lowerTier(tier: Tier): Tier {
  return ORDER[Math.min(ORDER.length - 1, ORDER.indexOf(tier) + 1)];
}

/** Collects frame times after a warm-up; reports sustained slow frames (90th percentile over a window).
 *  A gap longer than `stallS` (hidden or throttled tab, minimised window, long pause) is not a slow frame: it
 *  discards the partial window, so background throttling can never lower the tier. */
export class FrameBudget {
  private samples: number[] = [];
  private elapsed = 0;
  private readonly warmup: number;
  private readonly window: number;
  private readonly slowMs: number;
  private readonly stallS: number;
  private readonly minSamples: number;

  constructor(warmup = 1.5, window = 2, slowMs = 34, stallS = 0.25, minSamples = 8) {
    this.warmup = warmup;
    this.window = window;
    this.slowMs = slowMs;
    this.stallS = stallS;
    this.minSamples = minSamples;
  }

  /** Forgets the current window (call when the page loses focus or visibility). */
  reset() {
    this.samples = [];
  }

  /** Returns true once per window when the window's 90th-percentile frame time exceeds the slow threshold. */
  push(dtSeconds: number): boolean {
    if (!(dtSeconds > 0) || dtSeconds > this.stallS) {
      this.samples = [];
      return false;
    }
    this.elapsed += dtSeconds;
    if (this.elapsed <= this.warmup) return false;
    this.samples.push(dtSeconds * 1000);
    const span = this.samples.reduce((a, b) => a + b, 0) / 1000;
    if (span < this.window) return false;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
    const enough = this.samples.length >= this.minSamples;
    this.samples = [];
    return enough && p90 > this.slowMs;
  }
}

/** Vertical field of view that keeps a framing's horizontal span on narrow screens. */
export function fitFov(fov: number, aspect: number, designAspect = 1.5) {
  if (!(aspect > 0) || aspect >= designAspect) return fov;
  const half = (fov * Math.PI) / 360;
  return (Math.atan(Math.tan(half) * (designAspect / aspect)) * 360) / Math.PI;
}
