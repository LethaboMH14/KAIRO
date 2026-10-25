// Board writing sequence for a new lesson step: reach the line, write it, present the result, return control.
// Pure state machine driven by the stage's frame clock and Rain's cue events. The writing is authored stage
// motion: it is not timed to any spoken word, and the board text appears whether or not the point lands.

export type WritingPhase = 'reach' | 'write' | 'present' | 'done';
export type WritingState = { seq: number; step: number; phase: WritingPhase; phaseAt: number; reveal: number; duration: number };

/** Seconds to wait for Rain's fingertip to reach the board before writing anyway. */
export const REACH_TIMEOUT = 0.9;
/** Seconds Rain holds the point on the line's result before returning control. */
export const PRESENT_HOLD = 1.1;

export function writeDuration(chars: number, reduced: boolean) {
  return reduced ? 0 : Math.min(1.6, 0.35 + 0.07 * Math.max(0, chars));
}

export function startWriting(seq: number, step: number, chars: number, now: number, reduced: boolean): WritingState {
  return { seq, step, phase: reduced ? 'write' : 'reach', phaseAt: now, reveal: 0, duration: writeDuration(chars, reduced) };
}

export type WritingEvent = { type: 'tick'; now: number } | { type: 'landed'; now: number } | { type: 'interrupt' };

/** Advances the sequence. `landed` is Rain's reach cue completing (fingertip on the line) or being unsupported. */
export function advanceWriting(state: WritingState, event: WritingEvent): WritingState {
  if (state.phase === 'done') return state;
  if (event.type === 'interrupt') return { ...state, phase: 'done', reveal: 1 };
  const now = event.now;
  switch (state.phase) {
    case 'reach':
      if (event.type === 'landed' || now - state.phaseAt >= REACH_TIMEOUT) return { ...state, phase: 'write', phaseAt: now, reveal: 0 };
      return state;
    case 'write': {
      const reveal = state.duration <= 0 ? 1 : Math.min(1, (now - state.phaseAt) / state.duration);
      if (reveal >= 1) return { ...state, phase: 'present', phaseAt: now, reveal: 1 };
      return reveal === state.reveal ? state : { ...state, reveal };
    }
    case 'present':
      return now - state.phaseAt >= PRESENT_HOLD ? { ...state, phase: 'done', reveal: 1 } : state;
  }
  return state;
}
