// Isolated, deterministic educational trace. No database, learner API or network access.
export const SOURCE = Object.freeze({
  title: 'PostgreSQL 18 — Window Functions, section 9.22',
  url: 'https://www.postgresql.org/docs/18/functions-window.html',
  sourceRevision: 'postgresql-18-section-9.22-20261026',
  modelRevision: 'kairo-sql-window-rank-v1',
});
const freezeRows = rows => Object.freeze(rows.map(row => Object.freeze(row)));
export const BOARDS = Object.freeze([
  Object.freeze({ id: 'top-tie', label: 'Two learners tie for first',
    rows: freezeRows([{ id: 'ada', score: 92 }, { id: 'bo', score: 92 }, { id: 'cy', score: 84 }, { id: 'dee', score: 77 }, { id: 'eli', score: 77 }]) }),
  Object.freeze({ id: 'middle-tie', label: 'Two learners tie in the middle',
    rows: freezeRows([{ id: 'ada', score: 98 }, { id: 'bo', score: 89 }, { id: 'cy', score: 89 }, { id: 'dee', score: 81 }, { id: 'eli', score: 73 }]) }),
  Object.freeze({ id: 'no-tie', label: 'Every learner has a different score',
    rows: freezeRows([{ id: 'ada', score: 98 }, { id: 'bo', score: 91 }, { id: 'cy', score: 86 }, { id: 'dee', score: 80 }, { id: 'eli', score: 75 }]) }),
]);
export const FUNCTIONS = Object.freeze([
  Object.freeze({ id: 'row-number', label: 'ROW_NUMBER',
    sql: 'row_number() OVER (ORDER BY score DESC, learner_id ASC)',
    help: 'Every row receives a unique position. The additional ID sort makes ties deterministic.' }),
  Object.freeze({ id: 'rank', label: 'RANK',
    sql: 'rank() OVER (ORDER BY score DESC)',
    help: 'Tied scores are peers and share a rank; the next rank can have a gap.' }),
  Object.freeze({ id: 'dense-rank', label: 'DENSE_RANK',
    sql: 'dense_rank() OVER (ORDER BY score DESC)',
    help: 'Tied scores are peers and share a rank; the next rank has no gap.' }),
]);
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
function checkedScenario(value) {
  if (!exact(value, ['boardId', 'functionId', 'targetId'])) throw new TypeError('Invalid ranking scenario shape');
  const board = BOARDS.find(item => item.id === value.boardId);
  if (!board || !FUNCTIONS.some(item => item.id === value.functionId) ||
      !board.rows.some(row => row.id === value.targetId)) {
    throw new TypeError('Select a prepared board, ranking function and learner');
  }
  return Object.freeze({ boardId: board.id, functionId: value.functionId, targetId: value.targetId });
}
const scenarioKey = value => [value.boardId, value.functionId, value.targetId].join('|');
export function evaluateScenario(value) {
  const scenario = checkedScenario(value);
  const board = BOARDS.find(item => item.id === scenario.boardId);
  const sorted = [...board.rows].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id, 'en'));
  let previousScore = null;
  let peerGroup = 0;
  let firstPosition = 0;
  const trace = Object.freeze(sorted.map((row, index) => {
    const position = index + 1;
    if (row.score !== previousScore) {
      peerGroup += 1;
      firstPosition = position;
      previousScore = row.score;
    }
    const result = scenario.functionId === 'row-number' ? position :
      scenario.functionId === 'rank' ? firstPosition : peerGroup;
    const reason = scenario.functionId === 'row-number'
      ? 'Position after sorting by score descending, then learner ID ascending.'
      : scenario.functionId === 'rank'
        ? 'The peer group uses its first row position, leaving gaps after ties.'
        : 'The peer group uses its consecutive group number, without gaps.';
    return Object.freeze({ position, id: row.id, score: row.score, peerGroup, result,
      reason, target: row.id === scenario.targetId });
  }));
  return Object.freeze({ scenario, trace,
    observed: trace.find(row => row.target).result,
    sourceRevision: SOURCE.sourceRevision, modelRevision: SOURCE.modelRevision });
}
// Independent count-based oracle; does not call evaluateScenario or use its trace.
export function independentOracle(value) {
  const scenario = checkedScenario(value);
  const rows = BOARDS.find(item => item.id === scenario.boardId).rows;
  const target = rows.find(row => row.id === scenario.targetId);
  const higher = rows.filter(row => row.score > target.score);
  if (scenario.functionId === 'rank') return 1 + higher.length;
  if (scenario.functionId === 'dense-rank') return 1 + new Set(higher.map(row => row.score)).size;
  return 1 + higher.length +
    rows.filter(row => row.score === target.score && row.id < target.id).length;
}
function checkedAction(value) {
  if (!exact(value, ['boardId', 'functionId', 'targetId', 'prediction', 'explanation',
    'sourceRevision', 'modelRevision'])) throw new TypeError('Only canonical prediction actions are accepted');
  const scenario = checkedScenario({ boardId: value.boardId, functionId: value.functionId, targetId: value.targetId });
  if (!Number.isSafeInteger(value.prediction) || value.prediction < 1 || value.prediction > 5)
    throw new TypeError('Prediction must be a displayed whole-number rank from 1 to 5');
  if (typeof value.explanation !== 'string' || value.explanation.trim().length < 12 ||
      value.explanation.length > 400 || /[\u0000-\u001f\u007f]/.test(value.explanation))
    throw new TypeError('Explanation must be 12–400 printable characters');
  if (value.sourceRevision !== SOURCE.sourceRevision || value.modelRevision !== SOURCE.modelRevision)
    throw new TypeError('Source or model revision has changed');
  return Object.freeze({ ...scenario, prediction: value.prediction, explanation: value.explanation.trim(),
    sourceRevision: SOURCE.sourceRevision, modelRevision: SOURCE.modelRevision });
}
export function newSession() {
  return Object.freeze({ schemaVersion: 1, actions: Object.freeze([]) });
}
export function replaySession(value) {
  if (!exact(value, ['schemaVersion', 'actions']) || value.schemaVersion !== 1 ||
      !Array.isArray(value.actions) || value.actions.length > 2)
    throw new TypeError('Invalid local session envelope');
  const seen = new Set();
  const attempts = [];
  let latestTrace = Object.freeze([]);
  for (const raw of value.actions) {
    const action = checkedAction(raw);
    const key = scenarioKey(action);
    if (seen.has(key)) throw new RangeError('Two attempts must use different ranking scenarios');
    seen.add(key);
    const scenario = { boardId: action.boardId, functionId: action.functionId, targetId: action.targetId };
    const result = evaluateScenario(scenario);
    if (result.observed !== independentOracle(scenario)) throw new Error('Ranking model/oracle disagreement');
    attempts.push(Object.freeze({ ...action, id: 'local-' + (attempts.length + 1), key,
      observed: result.observed, correct: action.prediction === result.observed,
      verification: 'local-unverified' }));
    latestTrace = result.trace;
  }
  return Object.freeze({ attempts: Object.freeze(attempts), latestTrace });
}
export function recordAttempt(session, input) {
  const previous = replaySession(session);
  if (previous.attempts.length === 2) throw new RangeError('Two-attempt local round is complete');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid prediction');
  const action = checkedAction({ ...input, sourceRevision: SOURCE.sourceRevision,
    modelRevision: SOURCE.modelRevision });
  const next = Object.freeze({ schemaVersion: 1,
    actions: Object.freeze([...session.actions.map(checkedAction), action]) });
  const replay = replaySession(next);
  return Object.freeze({ session: next, attempt: replay.attempts.at(-1), trace: replay.latestTrace });
}
