// Tracking session controller: runs the lifecycle reducer's effects against injected dependencies (camera, worker,
// timers, page visibility), so the whole lifecycle is testable without a browser. Nothing starts at construction:
// the camera and the tracker are only touched after start() (the learner's button) is called.
//
// Privacy: no frame, picture or landmark is stored, queued, recorded or sent. The latest LandmarkFrame goes to
// onFrame listeners once and is then forgotten.
import { percentile } from './stats.ts';
import { IntegrityError, type VerifiedAssets } from './assets.ts';
import { classifyCameraError, openCamera, releaseStream, type MediaDevicesLike } from './camera.ts';
import { HintSmoother, hintCodes, type Hint } from './convert.ts';
import { PAUSE_LIMIT_MS, TRACKING_ONLY_LABEL, type LandmarkFrame } from './contract.ts';
import { initialContext, isLive, transition, type Context, type Effect, type FailureKind, type LifecycleEvent, type PauseReason, type Phase, type StopReason } from './lifecycle.ts';
import { FramePump, type Offer, type PumpStats } from './pump.ts';
import type { WorkerIn, WorkerOut } from './protocol.ts';

export type WorkerLike = {
  postMessage(message: WorkerIn, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: { data: WorkerOut }) => void) | null;
  onerror: ((event: unknown) => void) | null;
};

export type VideoLike = {
  srcObject: MediaProvider | null;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
  play(): Promise<void>;
  pause(): void;
};

export type Timers = {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
};

export type Deps = {
  mediaDevices: MediaDevicesLike | undefined;
  video: VideoLike;
  /** Fetches and verifies the tracker engine and model; rejects with IntegrityError on any mismatch. */
  loadAssets(signal: AbortSignal): Promise<VerifiedAssets>;
  /** Creates the tracker worker from verified code. */
  createWorker(): Promise<WorkerLike>;
  grabFrame(video: VideoLike, width: number): Promise<ImageBitmap>;
  requestFrame(callback: () => void): unknown;
  cancelFrame(handle: unknown): void;
  now(): number;
  timers: Timers;
  isHidden(): boolean;
  onVisibilityChange(callback: () => void): () => void;
  onPageHide(callback: () => void): () => void;
  /** Calls back when camera permission is taken away while a session is live. Best effort. */
  watchCameraPermission?(callback: () => void): () => void;
  sampleLuma?(): number | null;
};

export type Stats = PumpStats & { width: number; fps: number; trackerP50Ms: number; trackerP90Ms: number };

export type Snapshot = {
  phase: Phase;
  session: number;
  pause?: PauseReason;
  reason?: StopReason;
  failure?: FailureKind;
  /** Short technical detail for a diagnostics panel, never for the main message. */
  detail?: string;
  hints: readonly Hint[];
  stats: Stats;
  label: string;
};

export const STATS_INTERVAL_MS = 500;
const MAX_CONSECUTIVE_ERRORS = 5;
const TIME_WINDOW = 60;

export class TrackingSession {
  private readonly deps: Deps;
  private ctx: Context = initialContext;
  private readonly pump: FramePump;
  private stream: MediaStream | null = null;
  private worker: WorkerLike | null = null;
  private abort: AbortController | null = null;
  private frameHandle: unknown = null;
  private pumping = false;
  private pauseTimer: unknown = null;
  private statsTimer: unknown = null;
  private readonly smoother = new HintSmoother();
  private readonly listeners = new Set<(snapshot: Snapshot) => void>();
  private readonly frameListeners = new Set<(frame: LandmarkFrame) => void>();
  private readonly unsubscribe: (() => void)[] = [];
  private trackerTimes: number[] = [];
  private appliedAt: number[] = [];
  private consecutiveErrors = 0;
  private lastFrame: LandmarkFrame | null = null;
  private luma: number | null = null;
  private hints: Hint[] = [];
  private detail: string | undefined;
  private disposed = false;
  private snapshot: Snapshot;

  constructor(deps: Deps) {
    this.deps = deps;
    this.pump = new FramePump({ now: () => deps.now() });
    this.snapshot = this.buildSnapshot();
    this.unsubscribe.push(deps.onVisibilityChange(() => this.dispatch({ type: deps.isHidden() ? 'HIDDEN' : 'VISIBLE' })));
    this.unsubscribe.push(deps.onPageHide(() => this.dispatch({ type: 'PAGEHIDE' })));
    const watch = deps.watchCameraPermission?.(() => this.dispatch({ type: 'PERMISSION_REVOKED' }));
    if (watch) this.unsubscribe.push(watch);
  }

  // ---- the learner's controls ---------------------------------------------------------------------------------
  start() { this.dispatch({ type: 'START' }); }
  pause() { this.dispatch({ type: 'PAUSE' }); }
  resume() { this.dispatch({ type: 'RESUME' }); }
  stop() { this.dispatch({ type: 'STOP' }); }

  /** Leaving the page or route: releases everything and detaches all listeners. */
  dispose() {
    if (this.disposed) return;
    this.dispatch({ type: 'ROUTE_EXIT' });
    this.disposed = true;
    for (const off of this.unsubscribe.splice(0)) off();
    this.listeners.clear();
    this.frameListeners.clear();
  }

  // ---- observation --------------------------------------------------------------------------------------------
  getSnapshot = (): Snapshot => this.snapshot;

  subscribe = (listener: (snapshot: Snapshot) => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  /** Per-frame callback for drawing. The frame is not kept by the session beyond the next frame. */
  onFrame(listener: (frame: LandmarkFrame) => void): () => void {
    this.frameListeners.add(listener);
    return () => { this.frameListeners.delete(listener); };
  }

  // ---- lifecycle ----------------------------------------------------------------------------------------------
  private dispatch(event: LifecycleEvent) {
    if (this.disposed) return;
    const { context, effects } = transition(this.ctx, event);
    if (context === this.ctx && effects.length === 0) return;
    const before = this.ctx;
    this.ctx = context;
    if (context.session !== before.session) this.beginSession();
    for (const effect of effects) this.run(effect);
    if (context.phase === 'tracking' && before.phase !== 'tracking') this.afterEnteringTracking();
    this.notify();
  }

  private beginSession() {
    this.trackerTimes = [];
    this.appliedAt = [];
    this.consecutiveErrors = 0;
    this.lastFrame = null;
    this.luma = null;
    this.hints = [];
    this.detail = undefined;
    this.smoother.reset();
  }

  private live(session: number) {
    return !this.disposed && this.ctx.session === session && isLive(this.ctx.phase);
  }

  private run(effect: Effect) {
    switch (effect) {
      case 'open-camera': return void this.openCameraFor(this.ctx.session);
      case 'start-worker': return void this.startWorkerFor(this.ctx.session);
      case 'start-pump': return this.startPumping();
      case 'stop-pump': return this.stopPumping();
      case 'start-pause-timer': return this.startPauseTimer();
      case 'clear-pause-timer': return this.clearPauseTimer();
      case 'invalidate': return this.invalidate();
      case 'release-camera': return this.releaseCamera();
      case 'close-worker': return this.closeWorker();
    }
  }

  private async openCameraFor(session: number) {
    try {
      if (!this.deps.mediaDevices) throw Object.assign(new Error('This browser has no camera access.'), { name: 'NotFoundError' });
      const stream = await openCamera(this.deps.mediaDevices);
      if (!this.live(session)) {
        releaseStream(stream); // stopped, or a newer session began, while the permission prompt was open
        return;
      }
      this.stream = stream;
      for (const track of stream.getVideoTracks()) {
        track.addEventListener('ended', () => { if (this.ctx.session === session) this.dispatch({ type: 'TRACK_ENDED' }); });
      }
      this.deps.video.srcObject = stream;
      await this.deps.video.play();
      if (this.live(session)) this.dispatch({ type: 'CAMERA_READY' });
    } catch (error) {
      if (!this.live(session)) return;
      this.detail = (error as Error)?.message;
      const kind = classifyCameraError(error);
      if (kind === 'denied') this.dispatch({ type: 'CAMERA_DENIED' });
      else if (kind === 'unavailable') this.dispatch({ type: 'NO_CAMERA' });
      else this.dispatch({ type: 'CAMERA_FAILED', kind: kind === 'busy' ? 'camera-busy' : 'camera' });
    }
  }

  private async startWorkerFor(session: number) {
    const abort = new AbortController();
    this.abort = abort;
    try {
      const assets = await this.deps.loadAssets(abort.signal);
      if (!this.live(session)) return;
      const worker = await this.deps.createWorker();
      if (!this.live(session)) {
        worker.terminate();
        return;
      }
      this.worker = worker;
      worker.onmessage = event => this.fromWorker(session, event.data);
      worker.onerror = () => { if (this.live(session)) { this.detail = 'The tracker stopped unexpectedly.'; this.dispatch({ type: 'WORKER_FAILED', kind: 'worker' }); } };
      worker.postMessage({ type: 'init', session, loader: assets.loader, wasm: assets.wasm, model: assets.model }, [assets.loader, assets.wasm, assets.model]);
    } catch (error) {
      if (!this.live(session)) return;
      this.detail = (error as Error)?.message;
      this.dispatch({ type: 'MODEL_FAILED', kind: error instanceof IntegrityError ? 'model-integrity' : 'model-load' });
    }
  }

  private fromWorker(session: number, message: WorkerOut) {
    if (!this.live(session)) return;
    switch (message.type) {
      case 'ready':
        this.dispatch({ type: 'MODEL_READY' });
        return;
      case 'result': {
        const { frame, workerMs } = message;
        const verdict = this.pump.accept({ session: frame.session, seq: frame.seq, capturedAt: frame.capturedAt, workerMs });
        this.rememberTime(workerMs);
        this.consecutiveErrors = 0;
        if (verdict.apply && this.ctx.phase === 'tracking') this.deliver(frame);
        return;
      }
      case 'error':
        this.detail = message.message;
        if (message.fatal) {
          this.dispatch({ type: 'WORKER_FAILED', kind: 'worker' });
          return;
        }
        if (message.seq !== undefined) this.pump.fail(session, message.seq);
        if (++this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) this.dispatch({ type: 'WORKER_FAILED', kind: 'worker' });
        return;
      case 'closed':
        return;
    }
  }

  private deliver(frame: LandmarkFrame) {
    this.lastFrame = frame;
    this.appliedAt.push(this.deps.now());
    if (this.appliedAt.length > TIME_WINDOW) this.appliedAt.shift();
    for (const listener of this.frameListeners) listener(frame);
  }

  private rememberTime(ms: number) {
    this.trackerTimes.push(ms);
    if (this.trackerTimes.length > TIME_WINDOW) this.trackerTimes.shift();
  }

  // ---- frame loop ---------------------------------------------------------------------------------------------
  private afterEnteringTracking() {
    // A tab that went to the background while the camera and tracker were starting pauses as soon as it is live.
    if (this.deps.isHidden()) queueMicrotask(() => this.dispatch({ type: 'HIDDEN' }));
  }

  private startPumping() {
    this.pump.activate(this.ctx.session);
    this.pumping = true;
    this.consecutiveErrors = 0;
    this.schedule();
    if (this.statsTimer === null) this.statsTimer = this.deps.timers.setInterval(() => this.tickStats(), STATS_INTERVAL_MS);
  }

  private stopPumping() {
    this.pumping = false;
    this.pump.pause();
    if (this.frameHandle !== null) {
      this.deps.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
    if (this.statsTimer !== null) {
      this.deps.timers.clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }

  private schedule() {
    if (this.pumping && this.frameHandle === null) this.frameHandle = this.deps.requestFrame(this.tick);
  }

  private tick = () => {
    this.frameHandle = null;
    if (!this.pumping) return;
    const video = this.deps.video;
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const offer = this.pump.offer();
      if (offer.action === 'send') this.send(offer);
    }
    this.schedule();
  };

  private send(offer: Extract<Offer, { action: 'send' }>) {
    const { session, seq, capturedAt, width } = offer;
    this.deps.grabFrame(this.deps.video, width).then(bitmap => {
      if (!this.worker || this.ctx.session !== session || this.ctx.phase !== 'tracking') {
        bitmap.close();
        this.pump.fail(session, seq);
        return;
      }
      try {
        this.worker.postMessage({ type: 'frame', session, seq, capturedAt, bitmap }, [bitmap]);
      } catch {
        bitmap.close();
        this.pump.fail(session, seq);
      }
    }).catch(() => {
      this.pump.fail(session, seq);
      if (this.live(session) && ++this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        this.detail = 'This browser could not pass camera pictures to the tracker.';
        this.dispatch({ type: 'WORKER_FAILED', kind: 'frames' });
      }
    });
  }

  private tickStats() {
    if (this.ctx.phase !== 'tracking') return;
    if (this.pump.isStalled()) {
      this.detail = 'The tracker stopped answering.';
      this.dispatch({ type: 'WORKER_FAILED', kind: 'worker-stalled' });
      return;
    }
    const now = this.deps.now();
    this.luma = this.deps.sampleLuma?.() ?? this.luma;
    this.hints = this.smoother.update(hintCodes(this.lastFrame, this.luma), now);
    this.notify();
  }

  // ---- timers and release ---------------------------------------------------------------------------------------
  private startPauseTimer() {
    this.clearPauseTimer();
    this.pauseTimer = this.deps.timers.setTimeout(() => this.dispatch({ type: 'PAUSE_TIMEOUT' }), PAUSE_LIMIT_MS);
  }

  private clearPauseTimer() {
    if (this.pauseTimer !== null) {
      this.deps.timers.clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  private invalidate() {
    this.abort?.abort();
    this.abort = null;
    this.pump.end();
    this.lastFrame = null;
    this.hints = [];
  }

  private releaseCamera() {
    releaseStream(this.stream);
    this.stream = null;
    this.deps.video.pause();
    this.deps.video.srcObject = null;
  }

  private closeWorker() {
    const worker = this.worker;
    this.worker = null;
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    try { worker.postMessage({ type: 'close' }); } catch { /* already gone */ }
    worker.terminate();
  }

  // ---- snapshot -------------------------------------------------------------------------------------------------
  private buildSnapshot(): Snapshot {
    const times = [...this.trackerTimes].sort((a, b) => a - b);
    const now = this.deps.now();
    const recent = this.appliedAt.filter(t => now - t <= 2000).length;
    return {
      phase: this.ctx.phase,
      session: this.ctx.session,
      pause: this.ctx.pause,
      reason: this.ctx.reason,
      failure: this.ctx.failure,
      detail: this.detail,
      hints: this.hints,
      stats: { ...this.pump.stats(), width: this.pump.width, fps: Math.round((recent / 2) * 10) / 10, trackerP50Ms: percentile(times, 50), trackerP90Ms: percentile(times, 90) },
      label: TRACKING_ONLY_LABEL,
    };
  }

  private notify() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener(this.snapshot);
  }
}
