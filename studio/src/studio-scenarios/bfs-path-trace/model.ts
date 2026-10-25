/**
 * Deterministic, directed, unweighted breadth-first-search teaching model.
 * Prepared concept: MIT OCW 6.006 Lecture 9 BFS (Spring 2020).
 * Distances count edges, not travel time or weights; alphabetical neighbor order
 * breaks shortest-path ties. No user-uploaded source or learner record is read.
 */
export const MODEL_VERSION = 'kairo-bfs-unweighted-directed/1' as const;
export const PREPARED_SOURCE = Object.freeze({
  kind: 'prepared-public-reference' as const,
  revision: 'mit-ocw-6-006-spring-2020-lecture-9' as const,
  url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/lecture-9-breadth-first-search/',
  title: 'MIT OpenCourseWare 6.006: Lecture 9, Breadth-First Search',
  limitation: 'Prepared public concept, not a reviewed uploaded lesson or proof of learner competence.',
});
type Graph = Readonly<Record<string, readonly string[]>>;
export const SCENARIOS = Object.freeze({
  branching: Object.freeze({
    label: 'Branching routes with several shortest paths', start: 'A', target: 'F',
    graph: Object.freeze({ A: ['B', 'C'], B: ['D'], C: ['D', 'E'], D: ['F'], E: ['F'], F: [] }) as Graph,
  }),
  cycle: Object.freeze({
    label: 'Cycle and self-loop', start: 'S', target: 'D',
    graph: Object.freeze({ S: ['A'], A: ['B'], B: ['S', 'B', 'C'], C: ['D'], D: [] }) as Graph,
  }),
  disconnected: Object.freeze({
    label: 'Disconnected destination', start: 'A', target: 'D',
    graph: Object.freeze({ A: ['B'], B: ['A'], C: ['D'], D: [], E: [] }) as Graph,
  }),
  same: Object.freeze({
    label: 'Already at the destination', start: 'A', target: 'A',
    graph: Object.freeze({ A: ['A', 'B'], B: [] }) as Graph,
  }),
  tie: Object.freeze({
    label: 'Two equally short routes', start: 'A', target: 'D',
    graph: Object.freeze({ A: ['C', 'B'], B: ['D'], C: ['D'], D: [] }) as Graph,
  }),
});
export type ScenarioId = keyof typeof SCENARIOS;
export type Prediction = Readonly<{ hops: number | 'unreachable'; reasoning: string }>;
export type Step = Readonly<{
  expanded: string; distance: number; queueBefore: readonly string[];
  discovered: readonly string[]; queueAfter: readonly string[]; reading: string;
}>;
export type Trace = Readonly<{
  hops: number | null; path: readonly string[]; steps: readonly Step[];
  reached: boolean; visited: readonly string[]; explanation: string;
}>;
export type Attempt = Readonly<{
  id: string; at: string; scenarioId: ScenarioId; prediction: Prediction;
  trace: Trace; correct: boolean; modelVersion: typeof MODEL_VERSION;
  sourceKind: typeof PREPARED_SOURCE.kind; sourceRevision: typeof PREPARED_SOURCE.revision;
  evidenceStatus: 'local-unverified';
}>;
export type Session = Readonly<{ id: string; attempts: readonly Attempt[] }>;
const fail = (message: string): never => { throw new Error(message); };
const own = (v: object, key: string) => Object.prototype.hasOwnProperty.call(v, key);
const validId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{6,80}$/.test(id);

export function assertGraph(graph: unknown, start: unknown, target: unknown): asserts graph is Graph {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) fail('Graph must be an adjacency list.');
  const g = graph as Record<string, unknown>;
  const nodes = Object.keys(g);
  if (!nodes.length || nodes.length > 10 || nodes.some(n => !/^[A-Z]$/.test(n))) fail('Use 1–10 unique single-letter nodes.');
  if (typeof start !== 'string' || typeof target !== 'string' || !own(g, start) || !own(g, target)) {
    fail('Start and target must be nodes in the graph.');
  }
  let edges = 0;
  for (const node of nodes) {
    const adjacent = g[node];
    if (!Array.isArray(adjacent)) fail('Each node needs a neighbor list.');
    const neighbors: unknown[] = adjacent;
    if (neighbors.length > 10 ||
      neighbors.some(n => typeof n !== 'string' || !own(g, n)) ||
      new Set(neighbors).size !== neighbors.length) fail('Each node needs a valid, duplicate-free neighbor list.');
    edges += neighbors.length;
  }
  if (edges > 30) fail('Graph exceeds the educational edge limit.');
}
export function assertScenarioId(value: unknown): asserts value is ScenarioId {
  if (typeof value !== 'string' || !own(SCENARIOS, value)) fail('Choose a prepared graph scenario.');
}
export function assertPrediction(value: unknown): asserts value is Prediction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Predict a hop count and explain.');
  const p = value as Record<string, unknown>;
  if (Object.keys(p).length !== 2 || !own(p, 'hops') || !own(p, 'reasoning') ||
    !(p.hops === 'unreachable' || (Number.isSafeInteger(p.hops) && (p.hops as number) >= 0 && (p.hops as number) <= 9)) ||
    typeof p.reasoning !== 'string' || p.reasoning.trim().length < 12 || p.reasoning.trim().length > 400 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(p.reasoning)) fail('Choose 0–9 hops or unreachable and explain in 12–400 readable characters.');
}
/** FIFO BFS with discovery-time visited marking and sorted neighbors for deterministic ties. */
export function runBfs(graph: Graph, start: string, target: string): Trace {
  assertGraph(graph, start, target);
  const queue = [start];
  const parent = new Map<string, string | null>([[start, null]]);
  const distance = new Map<string, number>([[start, 0]]);
  const visited: string[] = [];
  const steps: Step[] = [];
  while (queue.length) {
    const queueBefore = [...queue];
    const expanded = queue.shift()!;
    visited.push(expanded);
    const discovered: string[] = [];
    if (expanded !== target) for (const next of [...graph[expanded]].sort()) {
      if (!parent.has(next)) {
        parent.set(next, expanded);
        distance.set(next, distance.get(expanded)! + 1);
        queue.push(next);
        discovered.push(next);
      }
    }
    steps.push({
      expanded, distance: distance.get(expanded)!, queueBefore, discovered,
      queueAfter: [...queue],
      reading: expanded === target
        ? `Reached ${target} at distance ${distance.get(expanded)}. Stop; this is the fewest-edge distance.`
        : `Remove ${expanded} from the front of the queue; discover ${discovered.join(', ') || 'no new nodes'}. Each newly discovered node is one edge farther away.`,
    });
    if (expanded === target) break;
  }
  const reached = parent.has(target);
  const path: string[] = [];
  if (reached) {
    let current: string | null = target;
    while (current !== null) { path.unshift(current); current = parent.get(current)!; }
  }
  const hops = reached ? distance.get(target)! : null;
  if (reached && path.length - 1 !== hops) fail('Internal BFS parent-distance invariant violated.');
  return {
    hops, path, steps, reached, visited,
    explanation: reached
      ? `Shortest route ${path.join(' → ')} uses ${hops} edge${hops === 1 ? '' : 's'}. FIFO BFS explores nodes in increasing distance, so the first discovered route is shortest in this unweighted graph. Equal-length routes may also exist.`
      : `No directed path from ${start} to ${target}. BFS exhausted every reachable node; the destination was not discovered.`,
  };
}
export function traceScenario(id: ScenarioId): Trace {
  assertScenarioId(id);
  const s = SCENARIOS[id];
  return runBfs(s.graph, s.start, s.target);
}
export function newSession(id: string): Session {
  if (!validId(id)) fail('Local session ID must be 6–80 safe characters.');
  return { id, attempts: [] };
}
export function commitAttempt(session: Session, scenarioId: ScenarioId, prediction: Prediction, at: string): Session {
  if (!session || !validId(session.id) || !Array.isArray(session.attempts) || session.attempts.length > 2) {
    fail('Invalid local session.');
  }
  if (session.attempts.length >= 2) fail('Two attempts completed. Start a new practice session.');
  assertScenarioId(scenarioId);
  assertPrediction(prediction);
  if (typeof at !== 'string' || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at) {
    fail('Exact ISO timestamp required.');
  }
  if (session.attempts.some(a => a.scenarioId === scenarioId)) fail('Choose a different graph for your second attempt.');
  const trace = traceScenario(scenarioId);
  const attempt: Attempt = {
    id: `${session.id}-round-${session.attempts.length + 1}`, at, scenarioId,
    prediction: { hops: prediction.hops, reasoning: prediction.reasoning.trim() },
    trace, correct: prediction.hops === (trace.hops ?? 'unreachable'),
    modelVersion: MODEL_VERSION, sourceKind: PREPARED_SOURCE.kind,
    sourceRevision: PREPARED_SOURCE.revision, evidenceStatus: 'local-unverified',
  };
  return { id: session.id, attempts: [...session.attempts, attempt] };
}
