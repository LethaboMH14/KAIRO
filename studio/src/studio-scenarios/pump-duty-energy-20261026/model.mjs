/**
 * KAIRO pump duty/energy practice: fictional constant shaft-power comparisons.
 * E_shaft (kWh) = P_shaft (kW) * elapsed time (h). This is NOT electrical
 * consumption, cost, pump efficiency, or a safe operating schedule.
 * Internal conceptual source: docs/pump-lab/MODEL.md, model/1 (illustrative,
 * not externally validated); this activity's numbers are separately authored.
 */
export const SOURCE = Object.freeze({
  title: 'KAIRO pump-lab educational model and units',
  path: 'docs/pump-lab/MODEL.md',
  modelVersion: 'kairo-pump-lab-model/1',
  revision: 'fc03149be570cb1bbf4b663f612c3fcbd28f0c76+pump-duty-energy-v1',
  status: 'Illustrative internal source, not externally expert-reviewed',
});
export const VERSION = 'kairo-pump-duty-energy/1';
export const EVIDENCE_LEVEL = 'local-unverified';
export const SCENARIOS = Object.freeze([
  Object.freeze({ id: 'short-vs-long', title: 'Round 1: a lower-power, longer session',
    a: Object.freeze({ powerKw: 1.8, hours: 2 }),
    bPowerKw: Object.freeze([1.2, 1.4]), bHours: Object.freeze([2.5, 3.5]) }),
  Object.freeze({ id: 'second-comparison', title: 'Round 2: test a new schedule independently',
    a: Object.freeze({ powerKw: 2.1, hours: 1.5 }),
    bPowerKw: Object.freeze([1.0, 1.5]), bHours: Object.freeze([2, 3]) }),
]);
const round6 = (n) => Math.round(n * 1e6) / 1e6;
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
function keys(v, expected, label) {
  if (!plain(v) || Object.keys(v).sort().join('|') !== [...expected].sort().join('|')) {
    throw new TypeError(`${label}: missing or unexpected fields`);
  }
}
function scenarioAt(index) {
  if (!Number.isInteger(index) || index < 0 || index >= SCENARIOS.length) throw new RangeError('Unknown round');
  return SCENARIOS[index];
}
function validateAction(action, index) {
  const scenario = scenarioAt(index);
  keys(action, ['scenarioId', 'bPowerKw', 'bHours', 'prediction', 'explanation'], 'Attempt');
  if (action.scenarioId !== scenario.id) throw new RangeError('Attempt is out of round order');
  if (typeof action.bPowerKw !== 'number' || !scenario.bPowerKw.includes(action.bPowerKw) ||
      typeof action.bHours !== 'number' || !scenario.bHours.includes(action.bHours)) {
    throw new RangeError('Only offered fictional schedule values are permitted');
  }
  keys(action.prediction, ['lowerEnergy', 'differenceKwh'], 'Prediction');
  if (!['A', 'B', 'equal'].includes(action.prediction.lowerEnergy)) throw new RangeError('Choose A, B or equal');
  const gap = action.prediction.differenceKwh;
  if (typeof gap !== 'number' || !Number.isFinite(gap) || gap < 0 || gap > 10) {
    throw new RangeError('Predicted difference must be a finite 0–10 kWh number');
  }
  if (typeof action.explanation !== 'string' || action.explanation.trim().length < 20 ||
      action.explanation.length > 800 || /[\u0000-\u0008\u000b-\u001f\u007f]/.test(action.explanation)) {
    throw new RangeError('Explain your prediction in 20–800 readable characters');
  }
}
export function calculate(index, bPowerKw, bHours) {
  const scenario = scenarioAt(index);
  if (typeof bPowerKw !== 'number' || !scenario.bPowerKw.includes(bPowerKw) ||
      typeof bHours !== 'number' || !scenario.bHours.includes(bHours)) throw new RangeError('Unsupported fictional schedule');
  const aKwh = round6(scenario.a.powerKw * scenario.a.hours);
  const bKwh = round6(bPowerKw * bHours);
  return Object.freeze({
    scenarioId: scenario.id, sourceRevision: SOURCE.revision,
    aPowerKw: scenario.a.powerKw, aHours: scenario.a.hours, bPowerKw, bHours,
    aKwh, bKwh, differenceKwh: round6(Math.abs(aKwh - bKwh)),
    lowerEnergy: aKwh === bKwh ? 'equal' : aKwh < bKwh ? 'A' : 'B',
    caveat: 'Fictional constant shaft power only: this is shaft energy, not measured electrical use, a bill, or equipment guidance.',
  });
}
export function newRecord() {
  return { version: VERSION, sourceRevision: SOURCE.revision, evidenceLevel: EVIDENCE_LEVEL, attempts: [] };
}
export function validateRecord(record) {
  keys(record, ['version', 'sourceRevision', 'evidenceLevel', 'attempts'], 'Record');
  if (record.version !== VERSION || record.sourceRevision !== SOURCE.revision || record.evidenceLevel !== EVIDENCE_LEVEL) {
    throw new RangeError('Unsupported, stale or falsely verified record');
  }
  if (!Array.isArray(record.attempts) || record.attempts.length > SCENARIOS.length) throw new RangeError('At most two rounds');
  record.attempts.forEach((a, i) => validateAction(a, i));
  return record;
}
export function appendAttempt(record, action) {
  validateRecord(record);
  if (record.attempts.length >= SCENARIOS.length) throw new RangeError('Both rounds are completed');
  validateAction(action, record.attempts.length);
  const safe = { scenarioId: action.scenarioId, bPowerKw: action.bPowerKw, bHours: action.bHours,
    prediction: { lowerEnergy: action.prediction.lowerEnergy, differenceKwh: action.prediction.differenceKwh },
    explanation: action.explanation };
  return validateRecord({ ...record, attempts: [...record.attempts, safe] });
}
export function replayRecord(record) {
  validateRecord(record);
  return record.attempts.map((attempt, index) => {
    const result = calculate(index, attempt.bPowerKw, attempt.bHours);
    return Object.freeze({ attempt, result,
      correctDirection: attempt.prediction.lowerEnergy === result.lowerEnergy,
      withinHalfKwh: Math.abs(attempt.prediction.differenceKwh - result.differenceKwh) <= 0.5 });
  });
}
export function importRecord(text) {
  if (typeof text !== 'string' || text.length > 12_000) throw new RangeError('Import must be JSON under 12 KB');
  return validateRecord(JSON.parse(text));
}
export function exportRecord(record) {
  validateRecord(record);
  return JSON.stringify(record, null, 2);
}
