/** Prepared, fictional dependency-graph learning exercise. No learner or equipment data. */
export const REFERENCE = Object.freeze({
  id: 'python-graphlib-toposort-concept',
  revision: 'prepared-2026-10-26-v1',
  title: 'Python graphlib.TopologicalSorter documentation (concept reference)',
  url: 'https://docs.python.org/3/library/graphlib.html',
  status: 'prepared-reference-not-learner-reviewed',
});

export const SCENARIOS = Object.freeze([
  {
    id: 'materials', title: 'Prepare a fictional class project',
    nodes: ['Collect', 'Clean', 'Tag', 'Publish'],
    baseEdges: [['Collect', 'Clean'], ['Collect', 'Tag'], ['Clean', 'Publish'], ['Tag', 'Publish']],
    choices: [
      { id: 'none', label: 'Keep the existing dependencies', edge: null },
      { id: 'reorder', label: 'Add Tag → Clean', edge: ['Tag', 'Clean'] },
      { id: 'cycle', label: 'Add Publish → Collect', edge: ['Publish', 'Collect'] },
    ],
  },
  {
    id: 'release', title: 'Plan a fictional software release',
    nodes: ['Design', 'Build', 'Review', 'Ship'],
    baseEdges: [['Design', 'Build'], ['Design', 'Review'], ['Build', 'Ship'], ['Review', 'Ship']],
    choices: [
      { id: 'none', label: 'Keep the existing dependencies', edge: null },
      { id: 'reorder', label: 'Add Review → Build', edge: ['Review', 'Build'] },
      { id: 'cycle', label: 'Add Ship → Design', edge: ['Ship', 'Design'] },
    ],
  },
]);

const SCHEMA = 'kairo-dependency-order-local-v1';
const ownKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join('|') === [...keys].sort().join('|');

export function scenarioForRound(round) {
  if (!Number.isInteger(round) || round < 1 || round > SCENARIOS.length) throw new Error('Unknown round');
  return SCENARIOS[round - 1];
}

export function solve(scenarioId, choiceId) {
  const scenario = SCENARIOS.find((entry) => entry.id === scenarioId);
  if (!scenario) throw new Error('Unknown scenario');
  const choice = scenario.choices.find((entry) => entry.id === choiceId);
  if (!choice) throw new Error('Unknown dependency change');
  const edges = [...scenario.baseEdges, ...(choice.edge ? [choice.edge] : [])];
  const incoming = new Map(scenario.nodes.map((node) => [node, 0]));
  const outgoing = new Map(scenario.nodes.map((node) => [node, []]));
  const seen = new Set();
  for (const [before, after] of edges) {
    if (!incoming.has(before) || !incoming.has(after) || before === after) throw new Error('Invalid graph');
    const key = before + '\0' + after;
    if (seen.has(key)) throw new Error('Duplicate edge');
    seen.add(key);
    incoming.set(after, incoming.get(after) + 1);
    outgoing.get(before).push(after);
  }
  const order = [];
  const trace = [];
  while (order.length < scenario.nodes.length) {
    const ready = scenario.nodes.filter((node) => !order.includes(node) && incoming.get(node) === 0).sort();
    if (!ready.length) break;
    const chosen = ready[0]; // Deterministic teaching tie-break, not a required Python ordering.
    order.push(chosen);
    for (const dependent of outgoing.get(chosen)) incoming.set(dependent, incoming.get(dependent) - 1);
    const readyAfter = scenario.nodes.filter((node) => !order.includes(node) && incoming.get(node) === 0).sort();
    trace.push({ readyBefore: ready, chosen, readyAfter });
  }
  const remaining = scenario.nodes.filter((node) => !order.includes(node)).sort();
  return {
    scenarioId, choiceId, addedEdge: choice.edge ? [...choice.edge] : null,
    completion: remaining.length ? 'blocked' : 'complete',
    nextTask: trace[1]?.chosen ?? 'none',
    order, trace, remaining,
  };
}

function validateAttempt(attempt, expectedRound) {
  if (!ownKeys(attempt, ['round', 'scenarioId', 'choiceId', 'prediction', 'explanation', 'source'])) throw new Error('Invalid attempt fields');
  if (attempt.round !== expectedRound) throw new Error('Out-of-order or repeated round');
  const scenario = scenarioForRound(expectedRound);
  if (attempt.scenarioId !== scenario.id) throw new Error('Wrong scenario for round');
  if (!scenario.choices.some((choice) => choice.id === attempt.choiceId)) throw new Error('Invalid dependency choice');
  if (!ownKeys(attempt.prediction, ['completion', 'nextTask'])) throw new Error('Invalid prediction fields');
  if (!['complete', 'blocked'].includes(attempt.prediction.completion)) throw new Error('Invalid completion prediction');
  if (![...scenario.nodes, 'none'].includes(attempt.prediction.nextTask)) throw new Error('Invalid next-task prediction');
  if (typeof attempt.explanation !== 'string' || attempt.explanation.trim().length < 12 || attempt.explanation.length > 400) {
    throw new Error('Explain your prediction in 12–400 characters');
  }
  if (!ownKeys(attempt.source, ['id', 'revision']) || attempt.source.id !== REFERENCE.id || attempt.source.revision !== REFERENCE.revision) {
    throw new Error('Source reference mismatch');
  }
  return {
    round: expectedRound, scenarioId: scenario.id, choiceId: attempt.choiceId,
    prediction: { completion: attempt.prediction.completion, nextTask: attempt.prediction.nextTask },
    explanation: attempt.explanation.trim(),
    source: { id: REFERENCE.id, revision: REFERENCE.revision },
  };
}

export function recordAttempt({ round, choiceId, prediction, explanation }) {
  const scenario = scenarioForRound(round);
  return validateAttempt({ round, scenarioId: scenario.id, choiceId, prediction, explanation,
    source: { id: REFERENCE.id, revision: REFERENCE.revision } }, round);
}

export function replaySession(value) {
  if (!ownKeys(value, ['schema', 'referenceId', 'referenceRevision', 'attempts']) || value.schema !== SCHEMA
    || value.referenceId !== REFERENCE.id || value.referenceRevision !== REFERENCE.revision) {
    throw new Error('Invalid local practice session');
  }
  if (!Array.isArray(value.attempts) || value.attempts.length < 1 || value.attempts.length > SCENARIOS.length) {
    throw new Error('Expected one or two ordered attempts');
  }
  const attempts = value.attempts.map((attempt, index) => validateAttempt(attempt, index + 1));
  const results = attempts.map((attempt) => {
    const model = solve(attempt.scenarioId, attempt.choiceId);
    return { round: attempt.round, completion: model.completion, nextTask: model.nextTask,
      correct: attempt.prediction.completion === model.completion && attempt.prediction.nextTask === model.nextTask,
      trace: model.trace, remaining: model.remaining, order: model.order };
  });
  return { attempts, results, finished: attempts.length === SCENARIOS.length };
}

export function exportSession(attempts) {
  const value = { schema: SCHEMA, referenceId: REFERENCE.id, referenceRevision: REFERENCE.revision, attempts };
  const replay = replaySession(value);
  return JSON.stringify({ ...value, attempts: replay.attempts }, null, 2);
}

export function importSession(raw) {
  if (typeof raw !== 'string' || raw.length > 16_384) throw new Error('Local practice file is too large');
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('Local practice file is not valid JSON'); }
  return replaySession(value);
}
