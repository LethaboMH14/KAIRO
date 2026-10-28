// Prepared, read-only PostgreSQL snapshot exercise. No database or learner service is contacted.
export const SOURCE = Object.freeze({
  title: 'PostgreSQL 18 — Transaction Isolation, section 13.2',
  url: 'https://www.postgresql.org/docs/18/transaction-iso.html',
  sourceRevision: 'postgresql-18-section-13.2-reviewed-20261025',
  modelRevision: 'kairo-pg-snapshot-v1',
});
export const ISOLATIONS = Object.freeze([
  { id: 'read-committed', label: 'READ COMMITTED', help: 'Each SELECT starts with a fresh committed snapshot.' },
  { id: 'repeatable-read', label: 'REPEATABLE READ', help: 'Both SELECTs use the same snapshot established by the first SELECT.' },
]);
export const TIMINGS = Object.freeze([
  { id: 'before-first', label: 'Writer commits before the first SELECT' },
  { id: 'between-reads', label: 'Writer commits between the two SELECTs' },
  { id: 'uncommitted', label: 'Writer updates but has not committed at the second SELECT' },
]);
export const BASES = Object.freeze([10, 20, 30]);
export const DELTAS = Object.freeze([5, 10]);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
const has = (items, value) => items.includes(value);
function checkedScenario(scenario) {
  if (!exact(scenario, ['isolation', 'timing', 'base', 'delta']) ||
      !ISOLATIONS.some(x => x.id === scenario.isolation) ||
      !TIMINGS.some(x => x.id === scenario.timing) ||
      !has(BASES, scenario.base) || !has(DELTAS, scenario.delta)) {
    throw new TypeError('Choose only the reviewed isolation, writer timing and example values');
  }
  return { isolation: scenario.isolation, timing: scenario.timing,
    base: scenario.base, delta: scenario.delta };
}
const freezeTrace = trace => Object.freeze(trace.map((x, index) => Object.freeze({ step: index + 1, ...x })));
export function evaluateScenario(input) {
  const s = checkedScenario(input);
  const afterCommit = s.base + s.delta;
  const first = s.timing === 'before-first' ? afterCommit : s.base;
  const second = s.timing === 'before-first' ||
    (s.timing === 'between-reads' && s.isolation === 'read-committed') ? afterCommit : s.base;
  const trace = [];
  if (s.timing === 'before-first') {
    trace.push({ actor: 'B', action: 'UPDATE example value from ' + s.base + ' to ' + afterCommit + '; COMMIT',
      visible: afterCommit, explanation: 'The writer committed before A established its first read snapshot.' });
  }
  trace.push({ actor: 'A', action: 'First SELECT value', visible: first,
    explanation: 'A sees the committed value at its first SELECT; this starts the REPEATABLE READ snapshot.' });
  if (s.timing === 'between-reads') {
    trace.push({ actor: 'B', action: 'UPDATE example value to ' + afterCommit + '; COMMIT',
      visible: afterCommit, explanation: 'B commits after A first read and before A second read.' });
  } else if (s.timing === 'uncommitted') {
    trace.push({ actor: 'B', action: 'UPDATE example value to ' + afterCommit + '; NOT COMMITTED',
      visible: null, explanation: 'An uncommitted write is not visible to A at either isolation level.' });
  }
  trace.push({ actor: 'A', action: 'Second SELECT value', visible: second,
    explanation: s.timing === 'between-reads'
      ? (s.isolation === 'read-committed'
        ? 'READ COMMITTED starts a new snapshot for the second statement.'
        : 'REPEATABLE READ keeps A’s first-statement snapshot.')
      : s.timing === 'uncommitted'
        ? 'The writer has not committed, so A cannot read the pending value.'
        : 'The writer committed before A first read, so both reads see that value.' });
  return Object.freeze({ first, second, trace: freezeTrace(trace),
    sourceRevision: SOURCE.sourceRevision, modelRevision: SOURCE.modelRevision });
}
// Independent truth-table oracle, deliberately not calling evaluateScenario or its trace.
export function independentOracle(input) {
  const s = checkedScenario(input);
  if (s.timing === 'before-first') return s.base + s.delta;
  if (s.timing === 'uncommitted') return s.base;
  return s.isolation === 'read-committed' ? s.base + s.delta : s.base;
}
function checkedAction(action) {
  const keys = ['isolation', 'timing', 'base', 'delta', 'prediction', 'explanation', 'sourceRevision', 'modelRevision'];
  if (!exact(action, keys)) throw new TypeError('Only canonical prediction actions may be replayed');
  const scenario = checkedScenario({ isolation: action.isolation, timing: action.timing,
    base: action.base, delta: action.delta });
  if (!Number.isSafeInteger(action.prediction) ||
      ![scenario.base, scenario.base + scenario.delta].includes(action.prediction))
    throw new TypeError('Prediction must be one of the displayed example values');
  if (typeof action.explanation !== 'string' || action.explanation.trim().length < 12 ||
      action.explanation.length > 400 || /[\u0000-\u001f\u007f]/.test(action.explanation))
    throw new TypeError('Explain your prediction in 12–400 plain-text characters');
  if (action.sourceRevision !== SOURCE.sourceRevision || action.modelRevision !== SOURCE.modelRevision)
    throw new TypeError('The source or model revision is not the reviewed version');
  return Object.freeze({ ...scenario, prediction: action.prediction,
    explanation: action.explanation.trim(), sourceRevision: SOURCE.sourceRevision,
    modelRevision: SOURCE.modelRevision });
}
const scenarioKey = s => [s.isolation, s.timing, s.base, s.delta].join('|');
export function newSession() {
  return Object.freeze({ schemaVersion: 1, actions: Object.freeze([]) });
}
export function replaySession(session) {
  if (!exact(session, ['schemaVersion', 'actions']) || session.schemaVersion !== 1 ||
      !Array.isArray(session.actions) || session.actions.length > 2)
    throw new TypeError('Invalid local session envelope');
  const seen = new Set();
  const attempts = [];
  let latestTrace = Object.freeze([]);
  for (const raw of session.actions) {
    const action = checkedAction(raw);
    const key = scenarioKey(action);
    if (seen.has(key)) throw new RangeError('Two attempts must use distinct scenarios');
    seen.add(key);
    const result = evaluateScenario({ isolation: action.isolation, timing: action.timing,
      base: action.base, delta: action.delta });
    if (result.second !== independentOracle({ isolation: action.isolation, timing: action.timing,
      base: action.base, delta: action.delta })) throw new Error('Snapshot model/oracle disagreement');
    attempts.push(Object.freeze({ id: 'local-' + (attempts.length + 1), key,
      ...action, first: result.first, observed: result.second,
      correct: action.prediction === result.second, verification: 'local-unverified' }));
    latestTrace = result.trace;
  }
  return Object.freeze({ attempts: Object.freeze(attempts), latestTrace });
}
export function recordAttempt(session, input) {
  const prior = replaySession(session);
  if (prior.attempts.length >= 2) throw new RangeError('Two-attempt local round is complete');
  const action = checkedAction({ ...input, sourceRevision: SOURCE.sourceRevision,
    modelRevision: SOURCE.modelRevision });
  const next = Object.freeze({ schemaVersion: 1,
    actions: Object.freeze([...session.actions.map(checkedAction), action]) });
  const replay = replaySession(next);
  return Object.freeze({ session: next, attempt: replay.attempts.at(-1), trace: replay.latestTrace });
}
