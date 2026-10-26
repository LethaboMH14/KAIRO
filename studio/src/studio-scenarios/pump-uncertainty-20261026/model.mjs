/** Pure, synthetic interval-reasoning exercise. Never use for equipment decisions. */
export const VERSION = 'kairo-pump-uncertainty/1';
export const SOURCE_REVISION = 'docs/pump-lab/MODEL.md:kairo-pump-lab-model/1';
export const EVIDENCE_STATUS = 'local-unverified';
export const SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'pressure', title: 'Discharge pressure gauge', unit: 'kPa',
    expected: 80, modelError: 3, readings: Object.freeze([80, 83, 85, 91]),
    errors: Object.freeze([0.5, 2, 2.5, 6]),
    context: 'A fictional gauge is compared with a prepared model band, not a real pump.',
  }),
  Object.freeze({
    id: 'flow', title: 'Flow meter', unit: 'L/s',
    expected: 12, modelError: 0.6, readings: Object.freeze([12, 12.5, 13.2, 14]),
    errors: Object.freeze([0.2, 0.5, 0.6, 1.2]),
    context: 'A second fictional instrument uses different units and tolerance values.',
  }),
]);
export const LABELS = Object.freeze({
  contained: 'Inside the model band',
  overlap: 'Partly overlapping / inconclusive',
  separated: 'Separated from the model band',
});

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
function exactKeys(value, keys) {
  return object(value) && Object.keys(value).length === keys.length &&
    keys.every((key) => own(value, key));
}
function requireCondition(ok, code) {
  if (!ok) throw new Error(code);
}
const round = (value) => Math.round((value + Number.EPSILON) * 10000) / 10000;

export function evaluateChoice(scenarioId, reading, error) {
  const scenario = SCENARIOS.find((item) => item.id === scenarioId);
  requireCondition(Boolean(scenario), 'UNKNOWN_SCENARIO');
  requireCondition(typeof reading === 'number' && scenario.readings.includes(reading), 'INVALID_READING');
  requireCondition(typeof error === 'number' && scenario.errors.includes(error), 'INVALID_ERROR');
  const expected = Object.freeze({ low: round(scenario.expected - scenario.modelError), high: round(scenario.expected + scenario.modelError) });
  const measured = Object.freeze({ low: round(reading - error), high: round(reading + error) });
  // Touching bands are not disjoint. A wide reading band cannot prove agreement.
  const classification = measured.high < expected.low || measured.low > expected.high
    ? 'separated'
    : measured.low >= expected.low && measured.high <= expected.high
      ? 'contained'
      : 'overlap';
  return Object.freeze({ scenarioId, reading, error, expected, measured, classification });
}

export function newRecord() {
  return { version: VERSION, sourceRevision: SOURCE_REVISION, evidenceStatus: EVIDENCE_STATUS, actions: [] };
}
function validateAction(action, index) {
  requireCondition(exactKeys(action, ['scenarioId', 'reading', 'error', 'prediction', 'explanation']), 'INVALID_ACTION_SCHEMA');
  requireCondition(index < SCENARIOS.length && action.scenarioId === SCENARIOS[index].id, 'WRONG_ROUND');
  const outcome = evaluateChoice(action.scenarioId, action.reading, action.error);
  requireCondition(typeof action.prediction === 'string' && own(LABELS, action.prediction), 'INVALID_PREDICTION');
  requireCondition(typeof action.explanation === 'string' && action.explanation === action.explanation.trim() &&
    action.explanation.length >= 12 && action.explanation.length <= 500 &&
    !/[\u0000-\u001f\u007f]/u.test(action.explanation), 'INVALID_EXPLANATION');
  return Object.freeze({ ...outcome, prediction: action.prediction,
    correct: action.prediction === outcome.classification, explanation: action.explanation });
}

export function replayRecord(record) {
  requireCondition(exactKeys(record, ['version', 'sourceRevision', 'evidenceStatus', 'actions']), 'INVALID_RECORD_SCHEMA');
  requireCondition(record.version === VERSION && record.sourceRevision === SOURCE_REVISION, 'STALE_SOURCE_OR_VERSION');
  requireCondition(record.evidenceStatus === EVIDENCE_STATUS, 'INVALID_EVIDENCE_STATUS');
  requireCondition(Array.isArray(record.actions) && record.actions.length <= SCENARIOS.length, 'INVALID_ACTION_COUNT');
  return Object.freeze(record.actions.map((action, index) => validateAction(action, index)));
}

export function appendAttempt(record, choice) {
  replayRecord(record);
  requireCondition(record.actions.length < SCENARIOS.length, 'ALREADY_COMPLETE');
  requireCondition(exactKeys(choice, ['scenarioId', 'reading', 'error', 'prediction', 'explanation']), 'INVALID_ACTION_SCHEMA');
  const action = {
    scenarioId: choice.scenarioId, reading: choice.reading, error: choice.error,
    prediction: choice.prediction, explanation: choice.explanation,
  };
  validateAction(action, record.actions.length);
  const next = { ...newRecord(), actions: [...record.actions, action] };
  replayRecord(next);
  return next;
}

export function importRecord(json) {
  requireCondition(typeof json === 'string' && json.length <= 8192, 'INVALID_JSON_SIZE');
  let value;
  try { value = JSON.parse(json); } catch { throw new Error('INVALID_JSON'); }
  replayRecord(value);
  return { ...newRecord(), actions: value.actions.map((action) => ({
    scenarioId: action.scenarioId, reading: action.reading, error: action.error,
    prediction: action.prediction, explanation: action.explanation,
  })) };
}
export function exportRecord(record) {
  replayRecord(record);
  return JSON.stringify(importRecord(JSON.stringify(record)), null, 2);
}
