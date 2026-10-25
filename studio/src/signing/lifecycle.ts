// Camera lifecycle as a pure reducer: transition(context, event) -> { context, effects }.
// The session controller executes the effects; nothing here touches a camera, worker or timer.
//
//   idle/stopped/denied/unavailable/failed --START--> starting --(camera and tracker ready)--> tracking
//   tracking --PAUSE|HIDDEN--> paused --RESUME|VISIBLE(after HIDDEN)--> tracking
//   paused --PAUSE_TIMEOUT--> stopped        any live state --STOP|PAGEHIDE|ROUTE_EXIT|TRACK_ENDED|PERMISSION_REVOKED--> stopped
//
// There is no automatic restart: a new session needs a new START, which only the learner's button sends.

export type Phase = 'idle' | 'starting' | 'tracking' | 'paused' | 'stopped' | 'denied' | 'unavailable' | 'failed';
export type PauseReason = 'user' | 'hidden';
export type StopReason = 'user' | 'pagehide' | 'route-exit' | 'track-ended' | 'permission-revoked' | 'pause-timeout';
export type FailureKind = 'model-integrity' | 'model-load' | 'worker' | 'worker-stalled' | 'camera-busy' | 'camera' | 'frames';

export type Context = {
  phase: Phase;
  /** Increments on every START; results and streams from an older session are discarded. */
  session: number;
  cameraReady: boolean;
  modelReady: boolean;
  pause?: PauseReason;
  reason?: StopReason;
  failure?: FailureKind;
};

export type LifecycleEvent =
  | { type: 'START' }
  | { type: 'CAMERA_READY' }
  | { type: 'CAMERA_DENIED' }
  | { type: 'NO_CAMERA' }
  | { type: 'CAMERA_FAILED'; kind: 'camera-busy' | 'camera' }
  | { type: 'MODEL_READY' }
  | { type: 'MODEL_FAILED'; kind: 'model-integrity' | 'model-load' }
  | { type: 'WORKER_FAILED'; kind: 'worker' | 'worker-stalled' | 'frames' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'HIDDEN' }
  | { type: 'VISIBLE' }
  | { type: 'PAUSE_TIMEOUT' }
  | { type: 'STOP' }
  | { type: 'PAGEHIDE' }
  | { type: 'ROUTE_EXIT' }
  | { type: 'TRACK_ENDED' }
  | { type: 'PERMISSION_REVOKED' };

export type Effect =
  | 'open-camera'
  | 'start-worker'
  | 'start-pump'
  | 'stop-pump'
  | 'start-pause-timer'
  | 'clear-pause-timer'
  | 'invalidate'
  | 'release-camera'
  | 'close-worker';

export const initialContext: Context = { phase: 'idle', session: 0, cameraReady: false, modelReady: false };

export function isLive(phase: Phase) {
  return phase === 'starting' || phase === 'tracking' || phase === 'paused';
}

/** Everything that must happen whenever a session ends, in this order. Safe to run more than once. */
export const TERMINAL_EFFECTS: readonly Effect[] = ['stop-pump', 'clear-pause-timer', 'invalidate', 'release-camera', 'close-worker'];

type Result = { context: Context; effects: readonly Effect[] };

const STOP_REASON: Partial<Record<LifecycleEvent['type'], StopReason>> = {
  STOP: 'user', PAGEHIDE: 'pagehide', ROUTE_EXIT: 'route-exit', TRACK_ENDED: 'track-ended',
  PERMISSION_REVOKED: 'permission-revoked', PAUSE_TIMEOUT: 'pause-timeout',
};

const end = (context: Context, phase: Phase, extra: Partial<Context>): Result => ({
  context: { phase, session: context.session, cameraReady: false, modelReady: false, ...extra },
  effects: TERMINAL_EFFECTS,
});

export function transition(context: Context, event: LifecycleEvent): Result {
  const none: Result = { context, effects: [] };
  const { phase } = context;

  if (event.type === 'START') {
    if (isLive(phase)) return none; // a double click never opens a second session
    return {
      context: { phase: 'starting', session: context.session + 1, cameraReady: false, modelReady: false },
      effects: ['open-camera', 'start-worker'],
    };
  }
  if (!isLive(phase)) return none; // every other event is meaningless outside a live session

  const stopReason = STOP_REASON[event.type];
  if (stopReason && event.type !== 'PAUSE_TIMEOUT') return end(context, 'stopped', { reason: stopReason });
  if (event.type === 'PAUSE_TIMEOUT') return phase === 'paused' ? end(context, 'stopped', { reason: 'pause-timeout' }) : none;

  switch (event.type) {
    case 'CAMERA_DENIED': return phase === 'starting' ? end(context, 'denied', {}) : none;
    case 'NO_CAMERA': return phase === 'starting' ? end(context, 'unavailable', {}) : none;
    case 'CAMERA_FAILED': return phase === 'starting' ? end(context, 'failed', { failure: event.kind }) : none;
    case 'MODEL_FAILED': return phase === 'starting' ? end(context, 'failed', { failure: event.kind }) : none;
    case 'WORKER_FAILED': return end(context, 'failed', { failure: event.kind });
    case 'CAMERA_READY':
    case 'MODEL_READY': {
      if (phase !== 'starting') return none;
      const next = { ...context, cameraReady: context.cameraReady || event.type === 'CAMERA_READY', modelReady: context.modelReady || event.type === 'MODEL_READY' };
      if (next.cameraReady && next.modelReady) return { context: { ...next, phase: 'tracking' }, effects: ['start-pump'] };
      return { context: next, effects: [] };
    }
    case 'PAUSE': return phase === 'tracking' ? { context: { ...context, phase: 'paused', pause: 'user' }, effects: ['stop-pump', 'start-pause-timer'] } : none;
    case 'HIDDEN': return phase === 'tracking' ? { context: { ...context, phase: 'paused', pause: 'hidden' }, effects: ['stop-pump', 'start-pause-timer'] } : none;
    case 'RESUME': return phase === 'paused' ? { context: { ...context, phase: 'tracking', pause: undefined }, effects: ['clear-pause-timer', 'start-pump'] } : none;
    // Coming back to the tab resumes only what the tab itself paused; a learner's own pause stays until they resume.
    case 'VISIBLE': return phase === 'paused' && context.pause === 'hidden' ? { context: { ...context, phase: 'tracking', pause: undefined }, effects: ['clear-pause-timer', 'start-pump'] } : none;
  }
  return none;
}
