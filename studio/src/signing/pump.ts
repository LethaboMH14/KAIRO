// Bounded frame pump: at most one picture is ever with the tracker, and the newest picture wins. If the tracker is
// busy the offered picture is dropped rather than queued, so delay cannot build up. Results that belong to an old
// session, arrive out of order or are too old never reach the screen. Pure: the caller supplies the clock.
import { CAPTURE_WIDTH } from './contract.ts';

export type Offer =
  | { action: 'send'; session: number; seq: number; capturedAt: number; width: number }
  | { action: 'drop'; reason: 'busy' | 'inactive' };

export type Verdict = { apply: true } | { apply: false; reason: 'stale-session' | 'not-in-flight' | 'out-of-order' | 'too-old' };

export type PumpStats = {
  offered: number; sent: number; dropped: number; applied: number;
  staleSession: number; outOfOrder: number; tooOld: number; failed: number;
};

export const MAX_AGE_MS = 250;
export const STALL_MS = 2000;

export class FramePump {
  private session = 0;
  private active = false;
  private seq = 0;
  private inFlight: { seq: number; sentAt: number } | null = null;
  private lastApplied = -1;
  private counters: PumpStats = FramePump.zero();
  private readonly now: () => number;
  private readonly width_: number;
  private readonly maxAgeMs: number;
  private readonly stallMs: number;

  constructor(opts: { now: () => number; width?: number; maxAgeMs?: number; stallMs?: number }) {
    this.now = opts.now;
    this.width_ = opts.width ?? CAPTURE_WIDTH;
    this.maxAgeMs = opts.maxAgeMs ?? MAX_AGE_MS;
    this.stallMs = opts.stallMs ?? STALL_MS;
  }

  private static zero(): PumpStats {
    return { offered: 0, sent: 0, dropped: 0, applied: 0, staleSession: 0, outOfOrder: 0, tooOld: 0, failed: 0 };
  }

  /** Starts offering pictures for `session`. Resuming the same session keeps its sequence; a new one starts clean. */
  activate(session: number) {
    if (session !== this.session) {
      this.session = session;
      this.seq = 0;
      this.inFlight = null;
      this.lastApplied = -1;
      this.counters = FramePump.zero();
    }
    this.active = true;
  }

  /** No more pictures are offered. A result still on its way is accepted (to free the tracker) but never shown. */
  pause() {
    this.active = false;
  }

  /** Ends the session: anything in flight is forgotten and every later result is stale. */
  end() {
    this.active = false;
    this.inFlight = null;
    this.session = -1;
  }

  offer(): Offer {
    if (!this.active) return { action: 'drop', reason: 'inactive' };
    this.counters.offered++;
    if (this.inFlight) {
      this.counters.dropped++;
      return { action: 'drop', reason: 'busy' };
    }
    const seq = ++this.seq;
    const capturedAt = this.now();
    this.inFlight = { seq, sentAt: capturedAt };
    this.counters.sent++;
    return { action: 'send', session: this.session, seq, capturedAt, width: this.width_ };
  }

  /** The tracker answered. Frees the tracker and says whether the answer may be shown. */
  accept(result: { session: number; seq: number; capturedAt: number; workerMs: number }): Verdict {
    if (result.session !== this.session) {
      this.counters.staleSession++;
      return { apply: false, reason: 'stale-session' };
    }
    if (!this.inFlight || this.inFlight.seq !== result.seq) {
      this.counters.outOfOrder++;
      return { apply: false, reason: result.seq <= this.lastApplied ? 'out-of-order' : 'not-in-flight' };
    }
    this.inFlight = null;
    if (result.seq <= this.lastApplied) {
      this.counters.outOfOrder++;
      return { apply: false, reason: 'out-of-order' };
    }
    if (this.now() - result.capturedAt > this.maxAgeMs) {
      this.counters.tooOld++;
      return { apply: false, reason: 'too-old' };
    }
    this.lastApplied = result.seq;
    this.counters.applied++;
    return { apply: true };
  }

  /** The picture could not be prepared or the tracker reported an error for it: free the tracker. */
  fail(session: number, seq: number) {
    if (session === this.session && this.inFlight?.seq === seq) {
      this.inFlight = null;
      this.counters.failed++;
    }
  }

  /** True when the tracker has held one picture far longer than any measured tracker time. */
  isStalled(): boolean {
    return !!this.inFlight && this.now() - this.inFlight.sentAt > this.stallMs;
  }

  get width() {
    return this.width_;
  }

  stats(): PumpStats {
    return { ...this.counters };
  }
}
