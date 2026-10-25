/**
 * Prepared Computer Science Studio exercise: lower-bound binary search.
 * The Python bisect_left documentation explains the insertion-point invariant:
 * a[:ip] < x and a[ip:] >= x for an ascending list.
 * This is a deterministic educational simulation, not learner-source retrieval.
 */
export const MODEL_VERSION = 'kairo-binary-search-lower-bound/1' as const;
export const PREPARED_SOURCE = Object.freeze({
  kind: 'prepared-public-reference' as const,
  revision: 'python-3.14-bisect-left' as const,
  url: 'https://docs.python.org/3.14/library/bisect.html',
  title: 'Python 3.14 bisect — bisect_left insertion point',
  limitation: 'Prepared public algorithm reference, not a reviewed uploaded source or a measured learner outcome.',
});
export const ARRAYS = Object.freeze({
  repeats: Object.freeze({ label: 'Repeated values', values: Object.freeze([1, 2, 2, 2, 5, 9]), targets: Object.freeze([2, 3, 10]) }),
  gaps: Object.freeze({ label: 'Values with gaps', values: Object.freeze([1, 3, 5, 7, 9]), targets: Object.freeze([0, 6, 9]) }),
  empty: Object.freeze({ label: 'Empty sorted list', values: Object.freeze([] as number[]), targets: Object.freeze([0, 4, 10]) }),
});
export type ArrayId = keyof typeof ARRAYS;
export type Scenario = Readonly<{ arrayId: ArrayId; target: number }>;
export type Prediction = Readonly<{ index: number; reasoning: string }>;
export type SearchStep = Readonly<{
  low: number; high: number; mid: number; value: number;
  branch: 'discard-left-through-mid' | 'keep-left-through-mid';
  nextLow: number; nextHigh: number; reading: string;
}>;
export type SearchTrace = Readonly<{
  index: number; found: boolean; steps: readonly SearchStep[];
  leftPartition: readonly number[]; rightPartition: readonly number[];
  explanation: string;
}>;
export type Attempt = Readonly<{
  id: string; at: string; scenario: Scenario; prediction: Prediction;
  trace: SearchTrace; correct: boolean; modelVersion: typeof MODEL_VERSION;
  referenceKind: typeof PREPARED_SOURCE.kind;
  referenceRevision: typeof PREPARED_SOURCE.revision;
  evidenceStatus: 'local-unverified';
}>;
export type Session = Readonly<{ id: string; attempts: readonly Attempt[] }>;
const own = (v: object, k: string) => Object.prototype.hasOwnProperty.call(v, k);
function fail(msg: string): never { throw new Error(msg); }

export function assertSorted(values: readonly number[]): void {
  if (!Array.isArray(values) || values.length > 16 || values.some(v => !Number.isSafeInteger(v) || v < -100 || v > 100)) {
    fail('Use a sorted list of at most 16 bounded integers.');
  }
  for (let i = 1; i < values.length; i++) if (values[i] < values[i - 1]) {
    fail('Binary search requires a nondecreasing sorted list.');
  }
}
export function assertScenario(value: unknown): asserts value is Scenario {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Choose a prepared scenario.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || !own(v, 'arrayId') || !own(v, 'target') ||
    typeof v.arrayId !== 'string' || !own(ARRAYS, v.arrayId)) fail('Unknown prepared array.');
  const arr = ARRAYS[v.arrayId as ArrayId];
  if (typeof v.target !== 'number' || !arr.targets.includes(v.target)) fail('Choose one of the prepared target values.');
}
export function assertPrediction(value: unknown): asserts value is Prediction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Predict an insertion index and explain why.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || !Number.isSafeInteger(v.index) || (v.index as number) < 0 ||
    (v.index as number) > 16 || typeof v.reasoning !== 'string' ||
    v.reasoning.trim().length < 12 || v.reasoning.trim().length > 400 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v.reasoning)) {
    fail('Enter a whole index from 0 to 16 and explain your prediction in 12–400 readable characters.');
  }
}
/** Educational lower-bound algorithm: half-open interval [low, high). */
export function lowerBound(values: readonly number[], target: number): SearchTrace {
  assertSorted(values);
  if (!Number.isSafeInteger(target) || target < -100 || target > 100) fail('Target must be a bounded integer.');
  let low = 0, high = values.length;
  const steps: SearchStep[] = [];
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    const value = values[mid];
    const beforeLow = low, beforeHigh = high;
    const less = value < target;
    if (less) low = mid + 1;
    else high = mid;
    steps.push({
      low: beforeLow, high: beforeHigh, mid, value,
      branch: less ? 'discard-left-through-mid' : 'keep-left-through-mid',
      nextLow: low, nextHigh: high,
      reading: less
        ? `Value ${value} at index ${mid} is less than target ${target}. The first possible insertion position must be after index ${mid}; low becomes ${low}.`
        : `Value ${value} at index ${mid} is at least target ${target}. Index ${mid} could be the first insertion position; high becomes ${high}.`,
    });
  }
  const index = low;
  if (values.slice(0, index).some(v => v >= target) || values.slice(index).some(v => v < target)) {
    fail('Internal lower-bound partition invariant violated.');
  }
  return {
    index, found: index < values.length && values[index] === target,
    steps, leftPartition: values.slice(0, index), rightPartition: values.slice(index),
    explanation: `Insertion index ${index}: every item before it is less than ${target}, and every item from it onward is at least ${target}. ${index < values.length && values[index] === target ? 'This is the first matching index, including when values repeat.' : 'The target is absent; this is where it could be inserted while preserving order.'}`,
  };
}
export function traceScenario(scenario: Scenario): SearchTrace {
  assertScenario(scenario);
  return lowerBound(ARRAYS[scenario.arrayId].values, scenario.target);
}
export function newSession(id: string): Session {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{6,80}$/.test(id)) fail('Local session ID must contain 6–80 safe characters.');
  return { id, attempts: [] };
}
export function commitAttempt(session: Session, scenario: Scenario, prediction: Prediction, at: string): Session {
  if (!session || typeof session !== 'object' || !Array.isArray(session.attempts) ||
    typeof session.id !== 'string' || !/^[a-zA-Z0-9_-]{6,80}$/.test(session.id)) fail('Invalid local session.');
  if (session.attempts.length >= 2) fail('Two attempts completed. Start a new practice session.');
  assertScenario(scenario);
  assertPrediction(prediction);
  if (prediction.index > ARRAYS[scenario.arrayId].values.length) fail('Prediction index outside this prepared list.');
  if (typeof at !== 'string' || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) {
    fail('A valid exact ISO timestamp is required.');
  }
  if (session.attempts.some(a => a.scenario.arrayId === scenario.arrayId && a.scenario.target === scenario.target)) {
    fail('Change the array or target for an independent second attempt.');
  }
  const trace = traceScenario(scenario);
  const attempt: Attempt = {
    id: `${session.id}-round-${session.attempts.length + 1}`, at,
    scenario: { ...scenario },
    prediction: { index: prediction.index, reasoning: prediction.reasoning.trim() },
    trace, correct: prediction.index === trace.index,
    modelVersion: MODEL_VERSION,
    referenceKind: PREPARED_SOURCE.kind, referenceRevision: PREPARED_SOURCE.revision,
    evidenceStatus: 'local-unverified',
  };
  return { id: session.id, attempts: [...session.attempts, attempt] };
}
