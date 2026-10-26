export const PRESENTATION_CUES = [
  'idle', 'explain', 'tablet-retrieve', 'tablet-hold', 'tablet-tap',
  'tablet-present', 'tablet-stow', 'acknowledge',
] as const;

export type PresentationCue = (typeof PRESENTATION_CUES)[number];
export type PresentationPhase = 'idle' | 'preparing' | 'presenting' | 'error';
export type PresentationEvent =
  | { type: 'context-changed'; contextKey: string }
  | { type: 'request-started'; contextKey: string; requestId: string }
  | { type: 'content-ready'; contextKey: string; requestId: string }
  | { type: 'request-failed'; contextKey: string; requestId: string }
  | { type: 'cancelled'; contextKey: string; requestId: string }
  | { type: 'saved'; contextKey: string }
  | { type: 'compact-changed'; compact: boolean }
  | { type: 'motion-changed'; reduced: boolean };

export interface PresentationState {
  readonly contextKey: string;
  readonly availableCues: readonly PresentationCue[];
  readonly activeRequestId: string | null;
  readonly phase: PresentationPhase;
  readonly compact: boolean;
  readonly reducedMotion: boolean;
  readonly requestedCue: PresentationCue;
  readonly resolvedCue: PresentationCue | null;
}

const validString = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 160;
const validCue = (v: unknown): v is PresentationCue => typeof v === 'string' && (PRESENTATION_CUES as readonly string[]).includes(v);
const obj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);

function resolveCue(state: Pick<PresentationState, 'availableCues' | 'compact' | 'reducedMotion'>, requested: PresentationCue): PresentationCue | null {
  const available = new Set(state.availableCues);
  if (requested === 'acknowledge') return available.has('acknowledge') ? 'acknowledge' : (available.has('idle') ? 'idle' : null);
  if (state.compact || state.reducedMotion) {
    return available.has('explain') ? 'explain' : (available.has('idle') ? 'idle' : null);
  }
  if (available.has(requested)) return requested;
  return available.has('idle') ? 'idle' : (available.has('explain') ? 'explain' : null);
}

export function createPresentationState(contextKey: string, reducedMotion: boolean, availableCues: readonly string[]): PresentationState {
  if (!validString(contextKey) || typeof reducedMotion !== 'boolean' || !Array.isArray(availableCues)) throw new TypeError('Invalid presentation state input');
  const cues = [...new Set(availableCues.filter(validCue))];
  const base = { contextKey, availableCues: Object.freeze(cues), activeRequestId: null, phase: 'idle' as const, compact: false, reducedMotion, requestedCue: 'idle' as const };
  return Object.freeze({ ...base, resolvedCue: resolveCue(base, 'idle') });
}

export function transitionPresentation(state: PresentationState, event: unknown): PresentationState {
  if (!state || !Array.isArray(state.availableCues) || !obj(event) || typeof event.type !== 'string') return state;
  const unchanged = () => state;
  const update = (patch: Partial<PresentationState>): PresentationState => Object.freeze({ ...state, ...patch });
  switch (event.type) {
    case 'context-changed': {
      if (!validString(event.contextKey) || event.contextKey === state.contextKey) return unchanged();
      const base = { ...state, contextKey: event.contextKey, activeRequestId: null, phase: 'idle' as const, requestedCue: 'idle' as const };
      return Object.freeze({ ...base, resolvedCue: resolveCue(base, 'idle') });
    }
    case 'request-started': {
      if (event.contextKey !== state.contextKey || !validString(event.requestId) || event.requestId === state.activeRequestId) return unchanged();
      const requestedCue = state.compact || state.reducedMotion ? 'explain' : 'tablet-retrieve';
      return update({ activeRequestId: event.requestId, phase: 'preparing', requestedCue, resolvedCue: resolveCue(state, requestedCue) });
    }
    case 'content-ready':
      if (event.contextKey !== state.contextKey || !validString(event.requestId) || event.requestId !== state.activeRequestId) return unchanged();
      return update({ activeRequestId: null, phase: 'presenting', requestedCue: 'tablet-present', resolvedCue: resolveCue(state, 'tablet-present') });
    case 'request-failed':
      if (event.contextKey !== state.contextKey || !validString(event.requestId) || event.requestId !== state.activeRequestId) return unchanged();
      return update({ activeRequestId: null, phase: 'error', requestedCue: 'idle', resolvedCue: resolveCue(state, 'idle') });
    case 'cancelled':
      if (event.contextKey !== state.contextKey || !validString(event.requestId) || event.requestId !== state.activeRequestId) return unchanged();
      return update({ activeRequestId: null, phase: 'idle', requestedCue: 'idle', resolvedCue: resolveCue(state, 'idle') });
    case 'saved':
      if (event.contextKey !== state.contextKey) return unchanged();
      return update({ requestedCue: 'acknowledge', resolvedCue: resolveCue(state, 'acknowledge') });
    case 'compact-changed':
      if (typeof event.compact !== 'boolean') return unchanged();
      return update({ compact: event.compact, resolvedCue: resolveCue({ ...state, compact: event.compact }, state.requestedCue) });
    case 'motion-changed':
      if (typeof event.reduced !== 'boolean') return unchanged();
      return update({ reducedMotion: event.reduced, resolvedCue: resolveCue({ ...state, reducedMotion: event.reduced }, state.requestedCue) });
    default: return unchanged();
  }
}
