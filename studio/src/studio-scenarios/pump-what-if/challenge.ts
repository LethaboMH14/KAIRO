// Source-backed CONCEPT, not source-validated COEFFICIENTS: only the existing
// deterministic KAIRO pump teaching model provides numbers here. No real-pump use.
import {
  DOMAIN, HEALTHY, INITIAL_TANKS, MODEL_VERSION, PumpLabError,
  operatingPoint,
} from '../../pump-lab/physics.ts';

export const CHALLENGE_SCHEMA = 'kairo-pump-what-if/1' as const;
export const PROVENANCE = 'prepared-model-only' as const;
export const CONCEPT_SOURCE = Object.freeze({
  organisation: 'Hydraulic Institute',
  title: 'Pump System Operating Point — Combined Pump & System Curves',
  url: 'https://datatool.pumps.org/pump-fundamentals/combined',
  claim: 'A passive valve changes system resistance; pump/system curve intersection sets the flow.',
  checked: '2026-10-25',
});
export const SCENARIOS = Object.freeze([
  Object.freeze({ id: 'guided-open-valve', speedRpm: 1200, beforeValvePct: 45, afterValvePct: 85, independent: false }),
  Object.freeze({ id: 'independent-close-valve', speedRpm: 1450, beforeValvePct: 90, afterValvePct: 35, independent: true }),
]);
export type Direction = 'increase' | 'decrease' | 'unchanged';
export type PredictAction = { type: 'predict'; direction: Direction; estimateLps: number };
export type ExplainAction = { type: 'explain'; note: string };
export type Action = PredictAction | ExplainAction;
export type Attempt = {
  scenarioId: string; independent: boolean; direction: Direction; estimateLps: number;
  beforeLps: number; afterLps: number; deltaLps: number; beforeHeadM: number;
  afterHeadM: number; beforeValveLossM: number; afterValveLossM: number;
  actualDirection: Direction; directionMatches: boolean; absoluteErrorLps: number;
  note: string | null;
};
export type State = {
  schema: typeof CHALLENGE_SCHEMA; model: typeof MODEL_VERSION;
  provenance: typeof PROVENANCE; phase: 'predict' | 'explain' | 'done';
  attempts: Attempt[]; actions: Action[];
};
export type Snapshot = {
  schema: typeof CHALLENGE_SCHEMA; model: typeof MODEL_VERSION;
  provenance: typeof PROVENANCE; actions: Action[];
};

function invalid(code: string, message: string): never { throw new PumpLabError(code, message); }
function exactKeys(value: unknown, expected: string[]): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join('|') === [...expected].sort().join('|');
}
function validateAction(value: unknown): asserts value is Action {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('bad-action', 'Use a prediction or explanation action.');
  const a = value as Record<string, unknown>;
  if (a.type === 'predict') {
    if (!exactKeys(a, ['type', 'direction', 'estimateLps'])) invalid('bad-action', 'Prediction fields are not recognised.');
    if (!['increase', 'decrease', 'unchanged'].includes(String(a.direction))) invalid('bad-direction', 'Choose one flow direction.');
    if (typeof a.estimateLps !== 'number' || !Number.isFinite(a.estimateLps)
      || a.estimateLps < DOMAIN.predictLps.min || a.estimateLps > DOMAIN.predictLps.max) {
      invalid('bad-estimate', 'Estimate must be a finite number from 0 to 30 L/s.');
    }
    return;
  }
  if (a.type === 'explain') {
    if (!exactKeys(a, ['type', 'note'])) invalid('bad-action', 'Explanation fields are not recognised.');
    if (typeof a.note !== 'string' || a.note.trim().length < 12 || a.note.length > 280
      || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(a.note)) {
      invalid('bad-explanation', 'Explain in 12–280 characters, without control characters.');
    }
    return;
  }
  invalid('bad-action', 'Unknown action.');
}
export function scenarioResult(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= SCENARIOS.length) invalid('bad-scenario', 'Unknown challenge scenario.');
  const scenario = SCENARIOS[index];
  const calculate = (valvePct: number) => operatingPoint({
    speedRpm: scenario.speedRpm, valvePct,
    tanks: { ...INITIAL_TANKS }, fault: { ...HEALTHY },
  });
  const before = calculate(scenario.beforeValvePct), after = calculate(scenario.afterValvePct);
  const delta = after.flowLps - before.flowLps;
  const actualDirection: Direction = delta > 0.000001 ? 'increase' : delta < -0.000001 ? 'decrease' : 'unchanged';
  return { before, after, delta, actualDirection };
}
export function initialState(): State {
  return { schema: CHALLENGE_SCHEMA, model: MODEL_VERSION, provenance: PROVENANCE,
    phase: 'predict', attempts: [], actions: [] };
}
export function transition(previous: State, action: Action): State {
  if (previous.schema !== CHALLENGE_SCHEMA || previous.model !== MODEL_VERSION || previous.provenance !== PROVENANCE) {
    invalid('model-mismatch', 'This challenge uses a different model/version.');
  }
  validateAction(action);
  if (previous.phase === 'done') invalid('already-done', 'Restart to try again.');
  if (previous.actions.length >= SCENARIOS.length * 2) invalid('too-many-actions', 'This challenge has two attempts.');
  if (previous.phase === 'predict') {
    if (action.type !== 'predict') invalid('predict-first', 'Commit a prediction before inspecting the result.');
    const index = previous.attempts.length, scenario = SCENARIOS[index];
    if (!scenario) invalid('already-done', 'No challenge remains.');
    const result = scenarioResult(index);
    const attempt: Attempt = {
      scenarioId: scenario.id, independent: scenario.independent, direction: action.direction,
      estimateLps: action.estimateLps, beforeLps: result.before.flowLps, afterLps: result.after.flowLps,
      deltaLps: result.delta, beforeHeadM: result.before.pumpHeadM,
      afterHeadM: result.after.pumpHeadM, beforeValveLossM: result.before.valveLossM,
      afterValveLossM: result.after.valveLossM, actualDirection: result.actualDirection,
      directionMatches: result.actualDirection === action.direction,
      absoluteErrorLps: Math.abs(result.after.flowLps - action.estimateLps), note: null,
    };
    return { ...previous, phase: 'explain', attempts: [...previous.attempts, attempt],
      actions: [...previous.actions, { ...action }] };
  }
  if (action.type !== 'explain') invalid('explain-next', 'Explain the observed change before the next attempt.');
  const cleanedNote = action.note.trim();
  const last = previous.attempts.at(-1);
  if (!last || last.note !== null) invalid('invalid-sequence', 'There is no new result to explain.');
  const attempts = [...previous.attempts.slice(0, -1), { ...last, note: cleanedNote }];
  return { ...previous, attempts, phase: attempts.length === SCENARIOS.length ? 'done' : 'predict',
    actions: [...previous.actions, { type: 'explain', note: cleanedNote }] };
}
export function serialize(state: State): Snapshot {
  // Reconstruct first, rejecting forged result/phase objects before exporting.
  const rebuilt = restore({ schema: state.schema, model: state.model, provenance: state.provenance, actions: state.actions });
  if (JSON.stringify(rebuilt.attempts) !== JSON.stringify(state.attempts) || rebuilt.phase !== state.phase) {
    invalid('tampered-state', 'Progress does not match the deterministic action trace.');
  }
  return { schema: CHALLENGE_SCHEMA, model: MODEL_VERSION, provenance: PROVENANCE,
    actions: rebuilt.actions.map(a => ({ ...a })) };
}
export function restore(value: unknown): State {
  if (!exactKeys(value, ['schema', 'model', 'provenance', 'actions'])) invalid('invalid-snapshot', 'This progress file has the wrong structure.');
  if (value.schema !== CHALLENGE_SCHEMA || value.model !== MODEL_VERSION || value.provenance !== PROVENANCE) {
    invalid('model-mismatch', 'Progress was made with a different model/version or source contract.');
  }
  if (!Array.isArray(value.actions) || value.actions.length > SCENARIOS.length * 2) {
    invalid('invalid-snapshot', 'Progress contains too many actions.');
  }
  return value.actions.reduce<State>((state, action) => transition(state, action as Action), initialState());
}
