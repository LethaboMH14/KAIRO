/**
 * Fictional measurement reasoning, NOT an instrument calibration or equipment diagnostic.
 * Pure deterministic model and action-only, local-unverified replay contract.
 */
export const SCHEMA = 'kairo-pump-sensor-bias-v1';
export const SOURCE = Object.freeze({
  id: 'nist-calibration-concepts-kairo-fictional-v1',
  revision: '2026-10-26-synthetic-1',
  url: 'https://www.nist.gov/publications/careful-consideration-calibration-concept-0',
  review: 'concept-reference-only; scenario assumptions not expert reviewed',
});
export const OFFSETS_KPA = Object.freeze([-8, -4, 0, 4, 8]);
export const DIAGNOSES = Object.freeze(['sensor-offset', 'process-change']);
export const SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'zero-check-offset',
    title: 'Round 1 · The reading moved, but did the pressure?',
    baselineKpa: 120,
    referenceKpa: 120,
    indicatedKpa: 128,
    zeroCheckKpa: 8,
    prompt: 'The suspect display is higher than before. A separate fictional reference still reads the baseline. What explains the mismatch?',
  }),
  Object.freeze({
    id: 'reference-confirmed-change',
    title: 'Round 2 · Both readings moved together',
    baselineKpa: 100,
    referenceKpa: 112,
    indicatedKpa: 112,
    zeroCheckKpa: 0,
    prompt: 'The suspect display increased and the independent fictional reference agrees. Does an offset explain this change?',
  }),
]);
const SESSION_KEYS = ['actions', 'schema', 'sourceId', 'sourceRevision', 'verification'];
const ACTION_KEYS = ['diagnosis', 'explanation', 'predictedKpa', 'roundId', 'selectedOffsetKpa'];
const MAX_JSON_LENGTH = 12_000;

function fail(message) { throw new TypeError(message); }
function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join('|') !== [...expected].sort().join('|')) {
    fail(`${label} has missing or unexpected fields`);
  }
}
function validAction(action, scenario) {
  exactKeys(action, ACTION_KEYS, 'Attempt');
  if (action.roundId !== scenario.id) fail('Round order or identity mismatch');
  if (!OFFSETS_KPA.includes(action.selectedOffsetKpa)) fail('Offset must be a listed integer');
  if (!DIAGNOSES.includes(action.diagnosis)) fail('Diagnosis must be a listed option');
  if (!Number.isSafeInteger(action.predictedKpa) || action.predictedKpa < 0 || action.predictedKpa > 250) {
    fail('Prediction must be a finite integer from 0 to 250 kPa');
  }
  if (typeof action.explanation !== 'string' || action.explanation.trim().length < 8 ||
      action.explanation.length > 500 || /[\u0000-\u001f\u007f]/.test(action.explanation)) {
    fail('Write a plain-text explanation (8–500 characters)');
  }
  return { ...action, explanation: action.explanation.trim() };
}

export function solve(scenario) {
  if (!SCENARIOS.includes(scenario)) fail('Unknown or altered fictional scenario');
  const expectedCorrectedKpa = scenario.indicatedKpa - scenario.zeroCheckKpa;
  if (expectedCorrectedKpa !== scenario.referenceKpa) fail('Inconsistent fictional measurement card');
  const processDeltaKpa = scenario.referenceKpa - scenario.baselineKpa;
  const expectedDiagnosis = scenario.zeroCheckKpa !== 0 ? 'sensor-offset' : 'process-change';
  return Object.freeze({
    expectedCorrectedKpa,
    expectedOffsetKpa: scenario.zeroCheckKpa,
    processDeltaKpa,
    expectedDiagnosis,
    trace: [
      `Zero-check offset: ${scenario.zeroCheckKpa} kPa (fictional known reference).`,
      `Corrected display = ${scenario.indicatedKpa} − (${scenario.zeroCheckKpa}) = ${expectedCorrectedKpa} kPa.`,
      `Independent reference = ${scenario.referenceKpa} kPa; corrected-reference difference = ${expectedCorrectedKpa - scenario.referenceKpa} kPa.`,
      `Reference change from baseline = ${scenario.referenceKpa} − ${scenario.baselineKpa} = ${processDeltaKpa} kPa.`,
    ],
  });
}

export function evaluate(scenario, action) {
  const submitted = validAction(action, scenario);
  const expected = solve(scenario);
  const learnerCorrectedKpa = scenario.indicatedKpa - submitted.selectedOffsetKpa;
  const checks = Object.freeze({
    offset: submitted.selectedOffsetKpa === expected.expectedOffsetKpa,
    diagnosis: submitted.diagnosis === expected.expectedDiagnosis,
    prediction: submitted.predictedKpa === expected.expectedCorrectedKpa,
  });
  return Object.freeze({
    roundId: scenario.id,
    checks,
    correctCount: Object.values(checks).filter(Boolean).length,
    learnerCorrectedKpa,
    referenceDifferenceKpa: learnerCorrectedKpa - scenario.referenceKpa,
    ...expected,
  });
}

export function newSession() {
  return {
    schema: SCHEMA,
    sourceId: SOURCE.id,
    sourceRevision: SOURCE.revision,
    verification: 'local-unverified',
    actions: [],
  };
}

/** Import is fail-closed; it does not mutate the caller's object or store data. */
export function replaySession(input) {
  if (typeof input === 'string' && input.length > MAX_JSON_LENGTH) fail('Import is too large');
  let data;
  try { data = typeof input === 'string' ? JSON.parse(input) : input; }
  catch { fail('Import is not valid JSON'); }
  exactKeys(data, SESSION_KEYS, 'Session');
  if (data.schema !== SCHEMA || data.sourceId !== SOURCE.id ||
      data.sourceRevision !== SOURCE.revision || data.verification !== 'local-unverified') {
    fail('Unknown, stale or falsely verified session');
  }
  if (!Array.isArray(data.actions) || data.actions.length > SCENARIOS.length) fail('Too many attempts');
  const actions = data.actions.map((action, index) => validAction(action, SCENARIOS[index]));
  const canonical = { ...newSession(), actions };
  if (JSON.stringify(canonical).length > MAX_JSON_LENGTH) fail('Session is too large');
  return { session: canonical, attempts: actions.map((a, i) => evaluate(SCENARIOS[i], a)) };
}

export function submitAttempt(session, action) {
  const restored = replaySession(session);
  const next = SCENARIOS[restored.session.actions.length];
  if (!next) fail('Both rounds have already been submitted');
  const validated = validAction(action, next);
  return replaySession({ ...restored.session, actions: [...restored.session.actions, validated] });
}

export function exportSession(session) {
  return JSON.stringify(replaySession(session).session, null, 2);
}
