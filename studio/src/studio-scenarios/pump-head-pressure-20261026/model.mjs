/**
 * KAIRO Engineering Studio: fictional static fluid columns, not live pump data.
 * The pressure difference is gauge pressure relative to the open surface.
 * OpenStax University Physics 1 §14.1: Δp = ρgh for constant density.
 */
export const VERSION = 'kairo-head-pressure/1';
export const SOURCE_REVISION = 'openstax-14-1-pump-model-20261026/1';
export const EVIDENCE_STATUS = 'local-unverified';
export const SOURCE_REVIEW_STATUS = 'public-concept-checked; independent-subject-review-pending';
export const GRAVITY = 9.80665; // m/s², standard gravity
export const SOURCES = Object.freeze([
  Object.freeze({
    title: 'OpenStax University Physics Volume 1, §14.1',
    url: 'https://openstax.org/books/university-physics-volume-1/pages/14-1-fluids-density-and-pressure',
    concept: 'For a static, constant-density column, gauge pressure rises with density and vertical depth.'
  }),
  Object.freeze({
    title: 'KAIRO pump-lab model/1 (illustrative, not field validated)',
    url: 'https://github.com/LethaboMH14/KAIRO/blob/main/docs/pump-lab/MODEL.md',
    concept: 'The existing teaching model uses metres of head, kPa gauge, rounded water density and standard gravity.'
  })
]);
export const SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'change-depth', kind: 'depth', title: 'Change the column depth',
    baseDepthM: 3, baseDensityKgM3: 1000,
    choices: Object.freeze([2, 4, 6]),
    prompt: 'A fictional open water column begins at 3 m depth. Change its depth while density stays fixed. Predict the new gauge pressure.'
  }),
  Object.freeze({
    id: 'change-density', kind: 'density', title: 'Change the fictional fluid density',
    baseDepthM: 5, baseDensityKgM3: 1000,
    choices: Object.freeze([800, 1000, 1200]),
    prompt: 'A fictional open column stays at 5 m depth. Change the assumed constant fluid density. Predict the new gauge pressure.'
  })
]);
export const DIRECTIONS = Object.freeze({
  lower: 'Lower than the starting gauge pressure',
  same: 'The same as the starting gauge pressure',
  higher: 'Higher than the starting gauge pressure'
});
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const exact = (x, keys) => plain(x) && Object.keys(x).length === keys.length && keys.every(k => own(x, k));
const check = (condition, code) => { if (!condition) throw new Error(code); };
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const scenarioById = id => SCENARIOS.find(s => s.id === id);
const pressure = (density, depth) => density * GRAVITY * depth / 1000;

export function solveScenario(scenarioId, changeValue) {
  const scenario = scenarioById(scenarioId);
  check(Boolean(scenario), 'UNKNOWN_SCENARIO');
  check(typeof changeValue === 'number' && scenario.choices.includes(changeValue), 'INVALID_CHANGE');
  const densityKgM3 = scenario.kind === 'density' ? changeValue : scenario.baseDensityKgM3;
  const depthM = scenario.kind === 'depth' ? changeValue : scenario.baseDepthM;
  const before = pressure(scenario.baseDensityKgM3, scenario.baseDepthM);
  const after = pressure(densityKgM3, depthM);
  const direction = after > before ? 'higher' : after < before ? 'lower' : 'same';
  return Object.freeze({
    scenarioId, changeValue, baseDepthM: scenario.baseDepthM,
    baseDensityKgM3: scenario.baseDensityKgM3,
    depthM, densityKgM3, basePressureKpa: round2(before),
    pressureKpa: round2(after), direction,
    trace: Object.freeze([
      'This is an open, stationary, constant-density column: gauge pressure is measured relative to its surface.',
      'Starting pressure: ' + scenario.baseDensityKgM3 + ' kg/m³ × ' + GRAVITY + ' m/s² × ' + scenario.baseDepthM + ' m ÷ 1000 = ' + round2(before) + ' kPa.',
      'Changed pressure: ' + densityKgM3 + ' kg/m³ × ' + GRAVITY + ' m/s² × ' + depthM + ' m ÷ 1000 = ' + round2(after) + ' kPa.',
      'The new pressure is ' + direction + ' than the starting pressure. One kPa is 1000 Pa.',
      'Depth here is a vertical static column, not a pump curve, total dynamic head, flow rate, or equipment recommendation.'
    ])
  });
}

export function newRecord() {
  return { version: VERSION, sourceRevision: SOURCE_REVISION, evidenceStatus: EVIDENCE_STATUS, actions: [] };
}
function validateAction(action, index) {
  check(exact(action, ['scenarioId', 'changeValue', 'predictedDirection', 'predictedKpa', 'explanation']), 'INVALID_ACTION_SCHEMA');
  check(index < SCENARIOS.length && action.scenarioId === SCENARIOS[index].id, 'WRONG_ROUND');
  const result = solveScenario(action.scenarioId, action.changeValue);
  check(typeof action.predictedDirection === 'string' && own(DIRECTIONS, action.predictedDirection), 'INVALID_DIRECTION');
  check(typeof action.predictedKpa === 'number' && Number.isFinite(action.predictedKpa) &&
    action.predictedKpa >= 0 && action.predictedKpa <= 120 &&
    Math.abs(action.predictedKpa * 10 - Math.round(action.predictedKpa * 10)) < 1e-8, 'INVALID_PRESSURE_PREDICTION');
  check(typeof action.explanation === 'string' && action.explanation.length >= 20 &&
    action.explanation.length <= 500 && action.explanation === action.explanation.trim() &&
    !/[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/u.test(action.explanation), 'INVALID_EXPLANATION');
  return Object.freeze({
    ...result,
    predictedDirection: action.predictedDirection,
    predictedKpa: action.predictedKpa,
    directionCorrect: action.predictedDirection === result.direction,
    pressureWithinOneKpa: Math.abs(action.predictedKpa - result.pressureKpa) <= 1,
    explanation: action.explanation
  });
}
export function replayRecord(record) {
  check(exact(record, ['version', 'sourceRevision', 'evidenceStatus', 'actions']), 'INVALID_RECORD_SCHEMA');
  check(record.version === VERSION && record.sourceRevision === SOURCE_REVISION &&
    record.evidenceStatus === EVIDENCE_STATUS, 'INVALID_REVISION_OR_EVIDENCE');
  check(Array.isArray(record.actions) && record.actions.length <= SCENARIOS.length, 'INVALID_ACTION_COUNT');
  return Object.freeze(record.actions.map((action, index) => validateAction(action, index)));
}
export function appendAttempt(record, action) {
  replayRecord(record);
  check(record.actions.length < SCENARIOS.length, 'ALREADY_COMPLETE');
  validateAction(action, record.actions.length);
  const next = {
    ...newRecord(),
    actions: [...record.actions, {
      scenarioId: action.scenarioId, changeValue: action.changeValue,
      predictedDirection: action.predictedDirection, predictedKpa: action.predictedKpa,
      explanation: action.explanation
    }]
  };
  replayRecord(next);
  return next;
}
export function importRecord(json) {
  check(typeof json === 'string' && json.length <= 12000, 'INVALID_JSON_SIZE');
  let record;
  try { record = JSON.parse(json); } catch { throw new Error('INVALID_JSON'); }
  replayRecord(record);
  return {
    ...newRecord(),
    actions: record.actions.map(action => ({
      scenarioId: action.scenarioId, changeValue: action.changeValue,
      predictedDirection: action.predictedDirection, predictedKpa: action.predictedKpa,
      explanation: action.explanation
    }))
  };
}
export function exportRecord(record) {
  replayRecord(record);
  return JSON.stringify(importRecord(JSON.stringify(record)), null, 2);
}
