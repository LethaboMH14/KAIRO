/**
 * Prepared, illustrative HTTP request tracing lesson. Pure domain logic:
 * no browser instrumentation, user-uploaded sources, network access or storage.
 * RFC 9110 (HTTP semantics) and RFC 9111 (caching) are conceptual references.
 */
export const TRACE_MODEL_VERSION = 'kairo-http-request-trace/1' as const;
export const PREPARED_REFERENCE = Object.freeze({
  kind: 'prepared-public-reference' as const,
  revision: 'rfc9110-2022+rfc9111-2022',
  links: Object.freeze([
    { label: 'RFC 9110: HTTP semantics and status codes', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
    { label: 'RFC 9111: HTTP caching', url: 'https://www.rfc-editor.org/rfc/rfc9111' },
  ]),
  limitation: 'Prepared public reference concepts only; not a reviewed learner upload or measured browser trace.',
});
export type CacheState = 'fresh' | 'empty';
export type ConnectionState = 'online' | 'offline';
export type OriginResponse = '200' | '503';
export type Outcome = 'cache-hit' | 'http-200' | 'http-503' | 'network-error';
export type Scenario = Readonly<{ cache: CacheState; connection: ConnectionState; origin: OriginResponse }>;
export type Prediction = Readonly<{ outcome: Outcome; sendsHttpRequest: boolean; explanation: string }>;
export type TraceStep = Readonly<{ id: string; title: string; reading: string }>;
export type RequestTrace = Readonly<{
  outcome: Outcome;
  sendsHttpRequest: boolean;
  httpStatus: 200 | 503 | null;
  steps: readonly TraceStep[];
  explanation: string;
}>;
export type RequestAttempt = Readonly<{
  id: string;
  modelVersion: typeof TRACE_MODEL_VERSION;
  referenceKind: typeof PREPARED_REFERENCE.kind;
  referenceRevision: typeof PREPARED_REFERENCE.revision;
  evidenceStatus: 'local-unverified';
  at: string;
  scenario: Scenario;
  prediction: Prediction;
  result: RequestTrace;
  outcomeCorrect: boolean;
  requestPredictionCorrect: boolean;
}>;
export type TraceSession = Readonly<{ id: string; attempts: readonly RequestAttempt[] }>;

export const DEFAULT_SCENARIO: Scenario = Object.freeze({ cache: 'empty', connection: 'online', origin: '200' });
export const OUTCOME_LABELS: Readonly<Record<Outcome, string>> = Object.freeze({
  'cache-hit': 'Fresh local cache is reused',
  'http-200': 'Server returns HTTP 200',
  'http-503': 'Server returns HTTP 503',
  'network-error': 'Offline: no HTTP response arrives',
});
const valid = <T extends string>(v: unknown, choices: readonly T[]): v is T =>
  typeof v === 'string' && choices.includes(v as T);
const own = (v: object, key: string): boolean => Object.prototype.hasOwnProperty.call(v, key);
function fail(message: string): never { throw new Error(message); }

export function assertScenario(value: unknown): asserts value is Scenario {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Scenario must be an object.');
  const s = value as Record<string, unknown>;
  if (Object.keys(s).length !== 3 || !own(s, 'cache') || !own(s, 'connection') || !own(s, 'origin') ||
    !valid(s.cache, ['fresh', 'empty']) || !valid(s.connection, ['online', 'offline']) ||
    !valid(s.origin, ['200', '503'])) fail('Unsupported scenario configuration.');
}
export function assertPrediction(value: unknown): asserts value is Prediction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Prediction must be an object.');
  const p = value as Record<string, unknown>;
  if (Object.keys(p).length !== 3 || !valid(p.outcome, ['cache-hit', 'http-200', 'http-503', 'network-error']) ||
    typeof p.sendsHttpRequest !== 'boolean' || typeof p.explanation !== 'string' ||
    p.explanation.trim().length < 12 || p.explanation.trim().length > 500) {
    fail('Choose an outcome, predict whether an HTTP request is sent, and explain in 12–500 characters.');
  }
}
const step = (id: string, title: string, reading: string): TraceStep => ({ id, title, reading });

/** Deterministic conceptual trace, not an observation of a real device or server. */
export function traceRequest(input: Scenario): RequestTrace {
  assertScenario(input);
  const steps: TraceStep[] = [step('cache-check', '1. Check the local cache',
    'The browser first checks whether a reusable fresh copy is already available in this simplified model.')];
  if (input.cache === 'fresh') {
    steps.push(step('cache-reuse', '2. Reuse fresh cached content',
      'This prepared scenario assumes a valid fresh response; it can be displayed without sending a new HTTP request.'));
    steps.push(step('display-cached', '3. Display the cached representation',
      'The learner sees the cached content. No new server status code is received during this attempt.'));
    return {
      outcome: 'cache-hit', sendsHttpRequest: false, httpStatus: null, steps,
      explanation: 'Fresh cache wins even when the connection is offline or the origin would return 503.',
    };
  }
  if (input.connection === 'offline') {
    steps.push(step('offline', '2. Network unavailable',
      'With no cached representation and an offline connection, this model cannot send an HTTP request.'));
    steps.push(step('network-error', '3. Show a connection error',
      'A network error is not an HTTP 503 response; no server status code was received.'));
    return {
      outcome: 'network-error', sendsHttpRequest: false, httpStatus: null, steps,
      explanation: 'No cached content and no connection means no HTTP response. A browser may offer other offline features not modelled here.',
    };
  }
  steps.push(step('dns', '2. Resolve the host name',
    'Assume a cold connection: DNS provides an address. A real browser may reuse a cached DNS result.'));
  steps.push(step('tls', '3. Establish a secure connection',
    'Assume a new HTTPS connection and a successful TLS handshake; real browsers can reuse existing connections.'));
  steps.push(step('get', '4. Send an HTTP GET request',
    'The browser requests the prepared example resource. This lesson does not send an actual request.'));
  if (input.origin === '503') {
    steps.push(step('response-503', '5. Receive HTTP 503',
      'In this selected scenario the origin explicitly responds Service Unavailable. That is an HTTP response, not a DNS or connection error.'));
    steps.push(step('display-503', '6. Explain the service error',
      'The client can present an accessible error explanation. It has received a 503 status code.'));
    return {
      outcome: 'http-503', sendsHttpRequest: true, httpStatus: 503, steps,
      explanation: 'A server-originated 503 response requires a request to reach an HTTP responder in this prepared example.',
    };
  }
  steps.push(step('response-200', '5. Receive HTTP 200',
    'The origin responds OK with the prepared representation. This is an illustrative successful HTTP response.'));
  steps.push(step('display-200', '6. Display the representation',
    'The client renders the response. Rendering details, redirects, proxies and service workers are intentionally omitted.'));
  return {
    outcome: 'http-200', sendsHttpRequest: true, httpStatus: 200, steps,
    explanation: 'With no reusable cache and an available connection, this prepared origin returns 200.',
  };
}
export function newSession(id: string): TraceSession {
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) fail('Session identifier must be 6–80 letters, digits, underscores or hyphens.');
  return { id, attempts: [] };
}
export function commitAttempt(session: TraceSession, scenario: Scenario, prediction: Prediction, at: string): TraceSession {
  if (!session || !/^[A-Za-z0-9_-]{6,80}$/.test(session.id) || !Array.isArray(session.attempts)) fail('Invalid local session.');
  if (session.attempts.length >= 2) fail('Two attempts completed. Start a new local session to practise again.');
  assertScenario(scenario);
  assertPrediction(prediction);
  if (typeof at !== 'string' || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) {
    fail('An exact ISO timestamp is required for the local attempt.');
  }
  if (session.attempts.some(a => a.scenario.cache === scenario.cache && a.scenario.connection === scenario.connection && a.scenario.origin === scenario.origin)) {
    fail('Change at least one scenario setting for an independent second attempt.');
  }
  const result = traceRequest(scenario);
  const attempt: RequestAttempt = {
    id: `${session.id}-round-${session.attempts.length + 1}`,
    modelVersion: TRACE_MODEL_VERSION,
    referenceKind: PREPARED_REFERENCE.kind,
    referenceRevision: PREPARED_REFERENCE.revision,
    evidenceStatus: 'local-unverified',
    at,
    scenario: { ...scenario },
    prediction: { ...prediction, explanation: prediction.explanation.trim() },
    result,
    outcomeCorrect: prediction.outcome === result.outcome,
    requestPredictionCorrect: prediction.sendsHttpRequest === result.sendsHttpRequest,
  };
  return { id: session.id, attempts: [...session.attempts, attempt] };
}
