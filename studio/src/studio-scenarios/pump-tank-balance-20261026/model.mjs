/**
 * Fictional, one-step incompressible storage balance for education only.
 * Not a pump controller, field model, hydraulic design or verified learner record.
 */
export const VERSION = 'kairo-pump-tank-balance/1';
export const SOURCE_REVISION = 'openstax-14-5-conservation-20261026-v1';
export const SOURCE_URL = 'https://openstax.org/books/university-physics-volume-1/pages/14-5-fluid-dynamics';
export const MAX_REPLAY_BYTES = 8192;

export const CASES = Object.freeze([
  Object.freeze({
    id: 'inflow-change',
    title: 'Round 1 — changing the fictional inlet',
    initialL: 320, capacityL: 900, durationMin: 8,
    inflowLpm: 40, outflowLpm: 65,
    adjustable: 'inflowLpm', options: Object.freeze([20, 35, 50, 75]),
    question: 'Choose an inlet flow. Can the reservoir satisfy the requested outlet flow?'
  }),
  Object.freeze({
    id: 'demand-change',
    title: 'Round 2 — changing the fictional outlet demand',
    initialL: 880, capacityL: 1000, durationMin: 6,
    inflowLpm: 65, outflowLpm: 35,
    adjustable: 'outflowLpm', options: Object.freeze([20, 35, 50, 80]),
    question: 'Choose an outlet demand. Will the fictional reservoir spill?'
  })
]);

export const OUTCOMES = Object.freeze(['contained', 'spill', 'unmet-demand']);

function exactKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).length !== keys.length ||
      !keys.every((key) => Object.hasOwn(value, key))) {
    throw new TypeError(`Invalid ${label} fields`);
  }
}

function nonnegativeSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`Invalid ${label}`);
  }
  return value;
}

export function solve(caseId, chosenFlowLpm) {
  const scenario = CASES.find((item) => item.id === caseId);
  if (!scenario) throw new TypeError('Unknown scenario');
  if (!scenario.options.includes(chosenFlowLpm)) throw new TypeError('Unsupported flow selection');
  const inflowLpm = scenario.adjustable === 'inflowLpm' ? chosenFlowLpm : scenario.inflowLpm;
  const outflowLpm = scenario.adjustable === 'outflowLpm' ? chosenFlowLpm : scenario.outflowLpm;
  const inletL = inflowLpm * scenario.durationMin;
  const requestedOutletL = outflowLpm * scenario.durationMin;
  const availableL = scenario.initialL + inletL;
  const deliveredOutletL = Math.min(availableL, requestedOutletL);
  const unmetDemandL = requestedOutletL - deliveredOutletL;
  const beforeCapacityL = availableL - deliveredOutletL;
  const spillL = Math.max(0, beforeCapacityL - scenario.capacityL);
  const finalL = beforeCapacityL - spillL;
  const outcome = unmetDemandL > 0 ? 'unmet-demand' : spillL > 0 ? 'spill' : 'contained';
  if (scenario.initialL + inletL - requestedOutletL !== finalL + spillL - unmetDemandL) {
    throw new Error('Storage conservation invariant failed');
  }
  return Object.freeze({
    caseId, chosenFlowLpm, initialL: scenario.initialL, capacityL: scenario.capacityL,
    durationMin: scenario.durationMin, inflowLpm, outflowLpm, inletL,
    requestedOutletL, deliveredOutletL, unmetDemandL, spillL, finalL, outcome
  });
}

export function trace(result) {
  return Object.freeze([
    `Start with ${result.initialL} L of fictional water in a ${result.capacityL} L reservoir.`,
    `Inlet: ${result.inflowLpm} L/min × ${result.durationMin} min = ${result.inletL} L.`,
    `Requested outlet: ${result.outflowLpm} L/min × ${result.durationMin} min = ${result.requestedOutletL} L.`,
    `Available before outlet: ${result.initialL} + ${result.inletL} = ${result.initialL + result.inletL} L.`,
    `Delivered outlet: ${result.deliveredOutletL} L; unmet demand: ${result.unmetDemandL} L.`,
    `Spill beyond reservoir capacity: ${result.spillL} L; final stored water: ${result.finalL} L.`,
    `Check: ${result.initialL} + ${result.inletL} − ${result.requestedOutletL} = ${result.finalL} + ${result.spillL} − ${result.unmetDemandL} L.`
  ]);
}

export function newReplay() {
  return { version: VERSION, sourceRevision: SOURCE_REVISION, actions: [] };
}

function validateAction(action, expectedIndex) {
  exactKeys(action, ['kind', 'caseId', 'flowLpm', 'predictedFinalL', 'predictedOutcome', 'explanation'], 'action');
  if (action.kind !== 'commit' || action.caseId !== CASES[expectedIndex]?.id) {
    throw new TypeError('Unexpected or repeated round');
  }
  if (!CASES[expectedIndex].options.includes(action.flowLpm)) {
    throw new TypeError('Unsupported flow selection');
  }
  nonnegativeSafeInteger(action.predictedFinalL, 'prediction');
  if (action.predictedFinalL > CASES[expectedIndex].capacityL * 2) {
    throw new TypeError('Prediction outside supported bounds');
  }
  if (!OUTCOMES.includes(action.predictedOutcome)) throw new TypeError('Invalid outcome prediction');
  if (typeof action.explanation !== 'string' ||
      action.explanation.trim().length < 10 || action.explanation.length > 500 ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(action.explanation)) {
    throw new TypeError('Explanation must be 10–500 readable characters');
  }
}

export function replay(value) {
  exactKeys(value, ['version', 'sourceRevision', 'actions'], 'replay');
  if (value.version !== VERSION || value.sourceRevision !== SOURCE_REVISION) {
    throw new TypeError('Incompatible model or reviewed concept revision');
  }
  if (!Array.isArray(value.actions) || value.actions.length > CASES.length) {
    throw new TypeError('Invalid attempt count');
  }
  const attempts = value.actions.map((action, index) => {
    validateAction(action, index);
    const result = solve(action.caseId, action.flowLpm);
    return Object.freeze({
      caseId: action.caseId,
      prediction: action.predictedFinalL,
      predictedOutcome: action.predictedOutcome,
      explanation: action.explanation,
      result,
      differenceL: Math.abs(action.predictedFinalL - result.finalL),
      outcomeMatches: action.predictedOutcome === result.outcome,
      verification: 'local-unverified'
    });
  });
  return Object.freeze(attempts);
}

export function appendAttempt(current, proposed) {
  const previous = replay(current);
  if (previous.length >= CASES.length) throw new TypeError('Both rounds are complete');
  validateAction(proposed, previous.length);
  const next = {
    version: VERSION,
    sourceRevision: SOURCE_REVISION,
    actions: [...current.actions.map((a) => ({ ...a })), { ...proposed }]
  };
  // Always recompute and revalidate; never trust saved scores or verification flags.
  replay(next);
  if (new TextEncoder().encode(JSON.stringify(next)).length > MAX_REPLAY_BYTES) {
    throw new TypeError('Replay is too large');
  }
  return next;
}

export function parseReplay(json) {
  if (typeof json !== 'string' || new TextEncoder().encode(json).length > MAX_REPLAY_BYTES) {
    throw new TypeError('Replay is too large or not text');
  }
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new TypeError('Invalid JSON replay'); }
  replay(parsed);
  return {
    version: VERSION,
    sourceRevision: SOURCE_REVISION,
    actions: parsed.actions.map((a) => ({ ...a }))
  };
}
