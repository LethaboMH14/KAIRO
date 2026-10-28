/**
 * A bounded, prepared SQL join exercise. No SQL is executed, no learner data is read.
 * PostgreSQL documents INNER and LEFT OUTER JOIN semantics and ON predicates:
 * https://www.postgresql.org/docs/current/queries-table-expressions.html
 */
export const MODEL_VERSION = 'kairo-sql-join-trace/1' as const;
export const PREPARED_SOURCE = Object.freeze({
  kind: 'prepared-public-reference' as const,
  revision: 'postgresql-current-join-table-expressions-2026-10-25' as const,
  title: 'PostgreSQL: joined tables and JOIN conditions',
  url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
  limitation: 'Prepared public database concept, not a reviewed learner upload, actual SQL engine, or evidence of learning gains.',
});
export type JoinKind = 'inner' | 'left';
export type Row = Readonly<{ id: string; label: string; key: number | null }>;
type Dataset = Readonly<{ label: string; leftName: string; rightName: string;
  left: readonly Row[]; right: readonly Row[] }>;
export const DATASETS: Readonly<Record<string, Dataset>> = Object.freeze({
  multiple: Object.freeze({
    label: 'Duplicate department keys (one-to-many matches)',
    leftName: 'Learners', rightName: 'Course groups',
    left: Object.freeze([
      Object.freeze({ id: 'l1', label: 'Amina', key: 10 }),
      Object.freeze({ id: 'l2', label: 'Bongani', key: 20 }),
      Object.freeze({ id: 'l3', label: 'Chen', key: null }),
      Object.freeze({ id: 'l4', label: 'Dineo', key: 10 }),
    ]),
    right: Object.freeze([
      Object.freeze({ id: 'r1', label: 'Group A', key: 10 }),
      Object.freeze({ id: 'r2', label: 'Group B', key: 10 }),
      Object.freeze({ id: 'r3', label: 'Group C', key: 30 }),
    ]),
  }),
  missing: Object.freeze({
    label: 'No matching right-side rows',
    leftName: 'Orders', rightName: 'Shipments',
    left: Object.freeze([
      Object.freeze({ id: 'l1', label: 'Order 7', key: 7 }),
      Object.freeze({ id: 'l2', label: 'Order 8', key: 8 }),
    ]),
    right: Object.freeze([] as Row[]),
  }),
  nulls: Object.freeze({
    label: 'NULL keys on both sides',
    leftName: 'Requests', rightName: 'Responses',
    left: Object.freeze([
      Object.freeze({ id: 'l1', label: 'Unknown request', key: null }),
      Object.freeze({ id: 'l2', label: 'Request 5', key: 5 }),
    ]),
    right: Object.freeze([
      Object.freeze({ id: 'r1', label: 'Unknown response', key: null }),
      Object.freeze({ id: 'r2', label: 'Response 5', key: 5 }),
    ]),
  }),
});
export type DatasetId = keyof typeof DATASETS;
export type Scenario = Readonly<{ datasetId: DatasetId; join: JoinKind }>;
export type Prediction = Readonly<{ rowCount: number; unmatchedLeft: number; reasoning: string }>;
export type OutputRow = Readonly<{
  leftId: string; leftLabel: string; leftKey: number | null;
  rightId: string | null; rightLabel: string | null; rightKey: number | null;
}>;
export type TraceStep = Readonly<{
  leftId: string; comparedRightIds: readonly string[]; matchingRightIds: readonly string[];
  emittedRows: number; reading: string;
}>;
export type JoinTrace = Readonly<{
  rows: readonly OutputRow[]; steps: readonly TraceStep[];
  rowCount: number; unmatchedLeft: number; explanation: string;
}>;
export type Attempt = Readonly<{
  id: string; at: string; scenario: Scenario; prediction: Prediction;
  actual: JoinTrace; correct: boolean; modelVersion: typeof MODEL_VERSION;
  sourceKind: typeof PREPARED_SOURCE.kind; sourceRevision: typeof PREPARED_SOURCE.revision;
  evidenceStatus: 'local-unverified';
}>;
export type Session = Readonly<{ id: string; attempts: readonly Attempt[] }>;
const own = (v: object, key: string) => Object.prototype.hasOwnProperty.call(v, key);
function fail(message: string): never { throw new Error(message); }
const safeId = (v: unknown) => typeof v === 'string' && /^[a-zA-Z0-9_-]{6,80}$/.test(v);

export function assertScenario(value: unknown): asserts value is Scenario {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Choose a prepared SQL join scenario.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || typeof v.datasetId !== 'string' || !own(DATASETS, v.datasetId) ||
      (v.join !== 'inner' && v.join !== 'left')) fail('Unknown prepared dataset or JOIN type.');
}
export function assertPrediction(value: unknown): asserts value is Prediction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Predict the result and explain your reasoning.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 3 ||
      !Number.isSafeInteger(v.rowCount) || (v.rowCount as number) < 0 || (v.rowCount as number) > 20 ||
      !Number.isSafeInteger(v.unmatchedLeft) || (v.unmatchedLeft as number) < 0 || (v.unmatchedLeft as number) > 10 ||
      typeof v.reasoning !== 'string' || v.reasoning.trim().length < 12 || v.reasoning.trim().length > 400 ||
      /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v.reasoning)) {
    fail('Use bounded whole-number predictions and 12–400 readable explanation characters.');
  }
}
export function traceJoin(scenario: Scenario): JoinTrace {
  assertScenario(scenario);
  const dataset = DATASETS[scenario.datasetId];
  const rows: OutputRow[] = [];
  const steps: TraceStep[] = [];
  let unmatchedLeft = 0;
  for (const left of dataset.left) {
    // SQL ON a.key = b.key does not match NULL to NULL (UNKNOWN is not TRUE).
    const matches = dataset.right.filter(right =>
      left.key !== null && right.key !== null && left.key === right.key);
    if (!matches.length) unmatchedLeft++;
    for (const right of matches) rows.push({
      leftId: left.id, leftLabel: left.label, leftKey: left.key,
      rightId: right.id, rightLabel: right.label, rightKey: right.key,
    });
    if (!matches.length && scenario.join === 'left') rows.push({
      leftId: left.id, leftLabel: left.label, leftKey: left.key,
      rightId: null, rightLabel: null, rightKey: null,
    });
    const emittedRows = matches.length || (scenario.join === 'left' ? 1 : 0);
    steps.push({
      leftId: left.id,
      comparedRightIds: dataset.right.map(right => right.id),
      matchingRightIds: matches.map(right => right.id),
      emittedRows,
      reading: matches.length
        ? `${left.label} matched ${matches.length} right-side row${matches.length === 1 ? '' : 's'} on equal, non-NULL keys, producing ${matches.length} result row${matches.length === 1 ? '' : 's'}.`
        : `${left.label} has no matching right-side key${left.key === null ? ' (NULL does not equal NULL in an ON equality condition)' : ''}. ${scenario.join === 'left' ? 'LEFT JOIN retains it with empty right-side columns.' : 'INNER JOIN excludes it.'}`,
    });
  }
  return {
    rows, steps, rowCount: rows.length, unmatchedLeft,
    explanation: `${scenario.join === 'inner' ? 'INNER JOIN emits only matching pairs.' : 'LEFT JOIN emits every matching pair and one empty-right row for each unmatched left row.'} A repeated right-side key can multiply rows. NULL keys never match each other with the equality predicate used here. ${unmatchedLeft} left-side row${unmatchedLeft === 1 ? '' : 's'} had no match.`,
  };
}
export function newSession(id: string): Session {
  if (!safeId(id)) fail('Session ID must contain 6–80 safe characters.');
  return { id, attempts: [] };
}
export function commitAttempt(session: Session, scenario: Scenario, prediction: Prediction, at: string): Session {
  if (!session || !safeId(session.id) || !Array.isArray(session.attempts) ||
      session.attempts.length > 2) fail('Invalid local practice session.');
  if (session.attempts.length >= 2) fail('Two attempts completed. Restart for new local practice.');
  assertScenario(scenario);
  assertPrediction(prediction);
  if (typeof at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(at) ||
      !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) fail('Use a complete ISO timestamp.');
  if (session.attempts.some(a => a.scenario.datasetId === scenario.datasetId && a.scenario.join === scenario.join)) {
    fail('Choose a different dataset or JOIN type for the second attempt.');
  }
  const actual = traceJoin(scenario);
  const attempt: Attempt = {
    id: `${session.id}-round-${session.attempts.length + 1}`, at,
    scenario: { datasetId: scenario.datasetId, join: scenario.join },
    prediction: { rowCount: prediction.rowCount, unmatchedLeft: prediction.unmatchedLeft,
      reasoning: prediction.reasoning.trim() },
    actual, correct: prediction.rowCount === actual.rowCount && prediction.unmatchedLeft === actual.unmatchedLeft,
    modelVersion: MODEL_VERSION, sourceKind: PREPARED_SOURCE.kind,
    sourceRevision: PREPARED_SOURCE.revision, evidenceStatus: 'local-unverified',
  };
  return { id: session.id, attempts: [...session.attempts, attempt] };
}
