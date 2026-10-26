/**
 * KAIRO static-head misconception challenge: fictional educational curves only.
 * No pump is measured, specified or controlled. No operational recommendations.
 * The speed affinity rules describe homologous points on a pump curve; the actual
 * operating point also depends on the SYSTEM curve and static lift.
 * Source (concept, not coefficients): Hydraulic Institute Pump Curves / Affinity Rules,
 * https://datatool.pumps.org/pump-fundamentals/pump-curves (checked 2026-10-26).
 */
export const SOURCE = Object.freeze({
  title: 'Hydraulic Institute — Pump Curves: Affinity Rules',
  url: 'https://datatool.pumps.org/pump-fundamentals/pump-curves',
  checked: '2026-10-26',
  revision: 'HI-affinity-concept-20261026+KAIRO-fictional-curves-v1',
});
export const VERSION = 'kairo-pump-static-head-practice/1';
export const EVIDENCE_LEVEL = 'local-unverified';
export const SPEED_RATIOS = Object.freeze([0.8, 0.9]);
export const SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'low-static', title: 'Round 1: modest fixed lift',
    shutoffHeadM: 36, pumpCurveLoss: 0.012, staticHeadM: 6, systemCurveLoss: 0.010,
    question: 'At a lower hypothetical speed, will a positive-flow intersection remain?',
  }),
  Object.freeze({
    id: 'high-static', title: 'Round 2: larger fixed lift',
    shutoffHeadM: 36, pumpCurveLoss: 0.012, staticHeadM: 24, systemCurveLoss: 0.010,
    question: 'Does scaling the old flow by speed still predict an operating point?',
  }),
]);

const isPlain = (value) => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exactKeys = (value, keys, name) => {
  if (!isPlain(value) || Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) {
    throw new TypeError(`${name} has missing or unexpected fields`);
  }
};
const assertRatio = (ratio) => {
  if (typeof ratio !== 'number' || !SPEED_RATIOS.includes(ratio)) throw new RangeError('Unsupported speed ratio');
};
const scenarioFor = (id) => {
  const scenario = SCENARIOS.find((entry) => entry.id === id);
  if (!scenario) throw new RangeError('Unknown scenario');
  return scenario;
};
const round6 = (n) => Math.round(n * 1e6) / 1e6;

/** H_pump = A*r^2 - B*Q^2; H_system = static + K*Q^2, Q in L/s. */
export function solveScenario(scenarioId, ratio) {
  const scenario = scenarioFor(scenarioId);
  assertRatio(ratio);
  const { shutoffHeadM: A, pumpCurveLoss: B, staticHeadM: S, systemCurveLoss: K } = scenario;
  const baseFlow = Math.sqrt((A - S) / (B + K));
  const availableHead = A * ratio ** 2 - S;
  const hasIntersection = availableHead > 0;
  const flow = hasIntersection ? Math.sqrt(availableHead / (B + K)) : null;
  const head = hasIntersection ? S + K * flow ** 2 : null;
  const pumpHead = hasIntersection ? A * ratio ** 2 - B * flow ** 2 : null;
  if (hasIntersection && Math.abs(head - pumpHead) > 1e-8) throw new Error('Internal curve-intersection mismatch');
  return Object.freeze({
    scenarioId, ratio, sourceRevision: SOURCE.revision,
    baseFlowLps: round6(baseFlow), naiveAffinityFlowLps: round6(baseFlow * ratio),
    scaledShutoffHeadM: round6(A * ratio ** 2), staticHeadM: S,
    flowLps: flow === null ? null : round6(flow),
    intersectionHeadM: head === null ? null : round6(head),
    outcome: hasIntersection ? 'flow' : 'no-intersection',
    // Never infer motor input power or safe operation from this simplified model.
    caveat: 'Fictional quadratic curves and constant coefficients. No positive-flow intersection is not a measured zero motor-power claim.',
  });
}

export function newRecord() {
  return { version: VERSION, sourceRevision: SOURCE.revision, evidenceLevel: EVIDENCE_LEVEL, attempts: [] };
}

function validateAttempt(attempt, index) {
  exactKeys(attempt, ['scenarioId', 'ratio', 'prediction', 'explanation'], 'Attempt');
  if (index >= SCENARIOS.length || attempt.scenarioId !== SCENARIOS[index].id) throw new RangeError('Attempt round out of order');
  assertRatio(attempt.ratio);
  exactKeys(attempt.prediction, ['outcome', 'flowLps'], 'Prediction');
  if (!['flow', 'no-intersection'].includes(attempt.prediction.outcome)) throw new RangeError('Invalid predicted outcome');
  const predicted = attempt.prediction.flowLps;
  if (attempt.prediction.outcome === 'no-intersection') {
    if (predicted !== null) throw new RangeError('No-intersection prediction must have null flow');
  } else if (typeof predicted !== 'number' || !Number.isFinite(predicted) || predicted < 0 || predicted > 60) {
    throw new RangeError('Predicted flow must be a finite number between 0 and 60 L/s');
  }
  if (typeof attempt.explanation !== 'string' || attempt.explanation.trim().length < 20 ||
      attempt.explanation.length > 800 || /[\u0000-\u0008\u000b-\u001f\u007f]/.test(attempt.explanation)) {
    throw new RangeError('Explanation must be 20–800 readable characters');
  }
}

/** Strict action-only local record; computed outcomes, scores, user IDs and secrets are forbidden. */
export function validateRecord(record) {
  exactKeys(record, ['version', 'sourceRevision', 'evidenceLevel', 'attempts'], 'Record');
  if (record.version !== VERSION || record.sourceRevision !== SOURCE.revision || record.evidenceLevel !== EVIDENCE_LEVEL) {
    throw new RangeError('Unsupported, stale or falsely verified record');
  }
  if (!Array.isArray(record.attempts) || record.attempts.length > SCENARIOS.length) throw new RangeError('At most two rounds');
  record.attempts.forEach(validateAttempt);
  return record;
}

export function appendAttempt(record, attempt) {
  validateRecord(record);
  if (record.attempts.length >= SCENARIOS.length) throw new RangeError('Both rounds already completed');
  validateAttempt(attempt, record.attempts.length);
  const copied = {
    scenarioId: attempt.scenarioId, ratio: attempt.ratio,
    prediction: { outcome: attempt.prediction.outcome, flowLps: attempt.prediction.flowLps },
    explanation: attempt.explanation,
  };
  const next = { ...record, attempts: [...record.attempts, copied] };
  return validateRecord(next);
}

export function replayRecord(record) {
  validateRecord(record);
  return record.attempts.map((attempt) => {
    const result = solveScenario(attempt.scenarioId, attempt.ratio);
    return Object.freeze({
      attempt, result,
      correctOutcome: attempt.prediction.outcome === result.outcome,
      withinTwoLps: result.flowLps !== null && attempt.prediction.outcome === 'flow' &&
        Math.abs(attempt.prediction.flowLps - result.flowLps) <= 2,
    });
  });
}

export function importRecord(text) {
  if (typeof text !== 'string' || text.length > 12_000) throw new RangeError('Import must be a JSON file under 12 KB');
  const record = JSON.parse(text);
  return validateRecord(record);
}

export function exportRecord(record) {
  validateRecord(record);
  return JSON.stringify(record, null, 2);
}
