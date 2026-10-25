/**
 * Pump hydraulic-power reasoning — isolated, hypothetical education only.
 * WRC Handbook on Pumps and Pumping Systems, §3, printed p.24:
 * P_h(W) = rho(kg/m3) * g(m/s2) * Q(m3/s) * H(m).
 * No machine operation, pump sizing or manufacturer performance is implied.
 */
export const CONTRACT = 'kairo-pump-power-reasoning/1' as const;
export const MODEL = 'wrc-hydraulic-power-illustration/1' as const;
export const SOURCE = Object.freeze({
  publisher: 'South African Water Research Commission',
  title: 'Handbook on Pumps and Pumping Systems, section 3: Power Requirements for Pumps',
  url: 'https://www.wrc.org.za/wp-content/uploads/mdocs/520-1-01.pdf',
  locator: 'printed page 24, equation (3)',
  checked: '2026-10-25',
});
export const RHO_KG_M3 = 1000;
export const GRAVITY_M_S2 = 9.81; // WRC handbook's rounded value
export type Direction = 'increase' | 'decrease' | 'unchanged';
export type Variable = 'flowLps' | 'headM';
export type Case = Readonly<{
  id: string; title: string; variable: Variable; before: Readonly<{ flowLps: number; headM: number }>;
  choices: readonly number[]; independent: boolean;
}>;
export const CASES: readonly Case[] = Object.freeze([
  Object.freeze({ id: 'guided-flow', title: 'Change flow at a fixed head', variable: 'flowLps',
    before: Object.freeze({ flowLps: 8, headM: 12 }), choices: Object.freeze([4, 8, 12, 16]), independent: false }),
  Object.freeze({ id: 'independent-head', title: 'Change head at a fixed flow', variable: 'headM',
    before: Object.freeze({ flowLps: 12, headM: 10 }), choices: Object.freeze([5, 10, 15, 20]), independent: true }),
]);
export type Predict = Readonly<{ type: 'predict'; choice: number; direction: Direction; estimateKw: number }>;
export type Explain = Readonly<{ type: 'explain'; note: string }>;
export type Action = Predict | Explain;
export type Attempt = Readonly<{
  caseId: string; independent: boolean; beforeKw: number; afterKw: number;
  after: Readonly<{ flowLps: number; headM: number }>;
  deltaKw: number; actualDirection: Direction; predictedDirection: Direction;
  directionMatches: boolean; estimateKw: number; errorKw: number; note: string | null;
}>;
export type Progress = Readonly<{ phase: 'predict' | 'explain' | 'done'; round: number; attempts: readonly Attempt[] }>;
export type State = Readonly<{ events: readonly Action[] }>;
export class PowerReasoningError extends Error {
  constructor(message: string) { super(message); this.name = 'PowerReasoningError'; }
}
function fail(message: string): never { throw new PowerReasoningError(message); }
function exactKeys(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('Expected a plain record.');
  const got = Object.keys(value).sort();
  if (got.length !== keys.length || got.some((k, i) => k !== [...keys].sort()[i]))
    fail('Unexpected or missing fields in practice record.');
}
function finite(value: unknown, label: string, min: number, max: number): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    fail(`${label} must be a finite number between ${min} and ${max}.`);
}
export function hydraulicKw(flowLps: number, headM: number): number {
  finite(flowLps, 'Flow (L/s)', 0, 30);
  finite(headM, 'Head (m)', 0, 50);
  return RHO_KG_M3 * GRAVITY_M_S2 * (flowLps / 1000) * headM / 1000;
}
export function afterChoice(spec: Case, choice: number): Readonly<{ flowLps: number; headM: number }> {
  finite(choice, 'Selected change', 0, 50);
  if (!spec.choices.includes(choice)) fail('Choose one of the listed teaching values.');
  return Object.freeze({ ...spec.before, [spec.variable]: choice });
}
function direction(delta: number): Direction {
  return delta > 1e-12 ? 'increase' : delta < -1e-12 ? 'decrease' : 'unchanged';
}
function parsePredict(raw: unknown, spec: Case): Predict {
  exactKeys(raw, ['type', 'choice', 'direction', 'estimateKw']);
  if (raw.type !== 'predict') fail('Prediction action expected.');
  finite(raw.choice, 'Selected change', 0, 50);
  afterChoice(spec, raw.choice);
  if (raw.direction !== 'increase' && raw.direction !== 'decrease' && raw.direction !== 'unchanged')
    fail('Choose a direction.');
  finite(raw.estimateKw, 'Predicted hydraulic power (kW)', 0, 10);
  return Object.freeze({ type: 'predict', choice: raw.choice, direction: raw.direction, estimateKw: raw.estimateKw });
}
function parseExplain(raw: unknown): Explain {
  exactKeys(raw, ['type', 'note']);
  if (raw.type !== 'explain' || typeof raw.note !== 'string') fail('Written explanation expected.');
  const note = raw.note.trim();
  if (note.length < 12 || note.length > 240 || /[\u0000-\u001f\u007f]/.test(note))
    fail('Write an explanation between 12 and 240 visible characters.');
  return Object.freeze({ type: 'explain', note });
}
/** Rebuild all results from learner inputs; no calculated outputs are trusted. */
export function replay(events: unknown): Progress {
  if (!Array.isArray(events) || events.length > CASES.length * 2)
    fail('Invalid or oversized action sequence.');
  const attempts: Attempt[] = [];
  for (let index = 0; index < events.length; index++) {
    const round = Math.floor(index / 2);
    const spec = CASES[round];
    if (index % 2 === 0) {
      const action = parsePredict(events[index], spec);
      const after = afterChoice(spec, action.choice);
      const beforeKw = hydraulicKw(spec.before.flowLps, spec.before.headM);
      const afterKw = hydraulicKw(after.flowLps, after.headM);
      const deltaKw = afterKw - beforeKw;
      const actualDirection = direction(deltaKw);
      attempts.push(Object.freeze({
        caseId: spec.id, independent: spec.independent, beforeKw, afterKw, after, deltaKw,
        actualDirection, predictedDirection: action.direction, directionMatches: action.direction === actualDirection,
        estimateKw: action.estimateKw, errorKw: Math.abs(afterKw - action.estimateKw), note: null,
      }));
    } else {
      const action = parseExplain(events[index]);
      attempts[round] = Object.freeze({ ...attempts[round], note: action.note });
    }
  }
  const phase = events.length === CASES.length * 2 ? 'done' : events.length % 2 ? 'explain' : 'predict';
  return Object.freeze({ phase, round: Math.min(Math.floor(events.length / 2), CASES.length - 1),
    attempts: Object.freeze(attempts) });
}
export function initialState(): State { return Object.freeze({ events: Object.freeze([]) }); }
export function transition(state: State, action: unknown): State {
  exactKeys(state, ['events']);
  const before = replay(state.events);
  if (before.phase === 'done') fail('Both rounds are complete. Restart for another practice.');
  const parsed = before.phase === 'predict' ? parsePredict(action, CASES[before.round]) : parseExplain(action);
  const events = Object.freeze([...state.events, parsed]);
  replay(events);
  return Object.freeze({ events });
}
export function serialize(state: State) {
  exactKeys(state, ['events']);
  replay(state.events);
  return { contract: CONTRACT, model: MODEL, actions: state.events };
}
export function restore(snapshot: unknown): State {
  exactKeys(snapshot, ['contract', 'model', 'actions']);
  if (snapshot.contract !== CONTRACT || snapshot.model !== MODEL) fail('This file uses a different practice or model version.');
  if (!Array.isArray(snapshot.actions)) fail('Expected a list of actions.');
  const events: Action[] = [];
  for (const action of snapshot.actions) {
    const before = replay(events);
    if (before.phase === 'done') fail('Too many actions.');
    events.push(before.phase === 'predict' ? parsePredict(action, CASES[before.round]) : parseExplain(action));
  }
  replay(events);
  return Object.freeze({ events: Object.freeze(events) });
}
