import { useId, useState } from 'react';
import {
  SCENARIOS, PREPARED_SOURCE, MODEL_VERSION, commitAttempt, newSession, traceScenario,
} from './model';
import type { Attempt, Prediction, ScenarioId, Session, Trace } from './model';

/** Accessible, standalone reading-first BFS lab. Does not write authenticated KAIRO evidence. */
export type BfsPathLabProps = { onLocalAttempt?: (attempt: Attempt) => void };
const freshId = () => `local-${globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`}`;
const makeSession = () => newSession(freshId());
const graphIds = Object.keys(SCENARIOS) as ScenarioId[];

export default function BfsPathLab({ onLocalAttempt }: BfsPathLabProps) {
  const prefix = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const [session, setSession] = useState<Session>(makeSession);
  const [scenarioId, setScenarioId] = useState<ScenarioId>('branching');
  const [hopsDraft, setHopsDraft] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [trace, setTrace] = useState<Trace | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('Choose a graph and predict the fewest number of directed edges before revealing the trace.');
  const scenario = SCENARIOS[scenarioId];
  const finished = session.attempts.length === 2;
  const locked = trace !== null || finished;
  const validPrediction = (hopsDraft === 'unreachable' ||
    (hopsDraft !== '' && Number.isSafeInteger(Number(hopsDraft)) &&
      Number(hopsDraft) >= 0 && Number(hopsDraft) <= 9)) &&
    reasoning.trim().length >= 12 && reasoning.trim().length <= 400;
  const allStepsRead = trace !== null && visibleSteps === trace.steps.length;

  function chooseScenario(next: ScenarioId) {
    setScenarioId(next); setHopsDraft(''); setReasoning(''); setError('');
  }
  function reveal() {
    if (locked || !validPrediction) return;
    if (session.attempts.some(a => a.scenarioId === scenarioId)) {
      setError('Choose a different graph for your second attempt.');
      return;
    }
    try {
      setTrace(traceScenario(scenarioId)); setVisibleSteps(0); setError('');
      setNotice('Prediction locked. Step through the FIFO queue before seeing the model answer.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not trace this graph.'); }
  }
  function record() {
    if (!allStepsRead || !validPrediction) return;
    try {
      const prediction: Prediction = {
        hops: hopsDraft === 'unreachable' ? 'unreachable' : Number(hopsDraft), reasoning,
      };
      const next = commitAttempt(session, scenarioId, prediction, new Date().toISOString());
      setSession(next); setTrace(null); setVisibleSteps(0); setHopsDraft(''); setReasoning(''); setError('');
      setNotice(next.attempts.length === 2
        ? 'Two distinct local attempts completed. Inspect the results below.'
        : 'First attempt recorded locally. Choose a different graph for round two.');
      try { onLocalAttempt?.(next.attempts[next.attempts.length - 1]); }
      catch { setError('Optional host callback failed. Your attempt is still shown locally but was not saved to KAIRO.'); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not record the attempt.'); }
  }
  function reset() {
    setSession(makeSession()); setScenarioId('branching'); setHopsDraft(''); setReasoning('');
    setTrace(null); setVisibleSteps(0); setError('');
    setNotice('New local practice started. Previous attempts were not saved.');
  }

  return (
    <section aria-labelledby={`${prefix}-title`} style={{ maxWidth: '54rem', margin: '0 auto', padding: '1rem', lineHeight: 1.6 }}>
      <h2 id={`${prefix}-title`}>Computer Science Studio: find a shortest path with BFS</h2>
      <p>In a <strong>directed, unweighted</strong> graph, breadth-first search (BFS) explores
        the nearest nodes first using a first-in, first-out (FIFO) queue. Predict how many
        edges the shortest route needs, or whether the destination is unreachable.</p>
      <p><strong>Prepared educational model:</strong> {MODEL_VERSION}. A route follows arrows only;
        every edge counts as one hop. Neighbors are checked alphabetically, so equally
        short routes have a repeatable tie-break. This is not a route planner or a
        lesson generated from your uploaded source. Attempts are local, unverified
        and <strong>not saved to your KAIRO account</strong>.</p>
      <details>
        <summary>Source, graph assumptions and limitations</summary>
        <p><a href={PREPARED_SOURCE.url} target="_blank" rel="noreferrer">
          {PREPARED_SOURCE.title}</a> ({PREPARED_SOURCE.revision}).</p>
        <p>{PREPARED_SOURCE.limitation} Graphs and node labels are authored examples.
          BFS gives a fewest-edge path, not a lowest-cost path for weighted edges.
          Several equally short routes may exist.</p>
      </details>
      <fieldset disabled={locked}>
        <legend>1. Choose a prepared graph</legend>
        <label htmlFor={`${prefix}-scenario`}>Graph scenario
          <select id={`${prefix}-scenario`} value={scenarioId}
            onChange={event => chooseScenario(event.target.value as ScenarioId)}
            style={{ display: 'block', width: '100%' }}>
            {graphIds.map(id => <option key={id} value={id}>{SCENARIOS[id].label}</option>)}
          </select>
        </label>
      </fieldset>
      <section aria-labelledby={`${prefix}-graph`}>
        <h3 id={`${prefix}-graph`}>Directed graph: {scenario.start} to {scenario.target}</h3>
        <p>Each row lists outgoing arrows. No arrow means no outgoing neighbor.</p>
        <ul>{Object.entries(scenario.graph).sort(([a], [b]) => a.localeCompare(b))
          .map(([node, neighbors]) => <li key={node}>
            <strong>{node}</strong> → {neighbors.length ? [...neighbors].sort().join(', ') : 'none'}
          </li>)}</ul>
      </section>
      {!finished && <fieldset disabled={locked}>
        <legend>2. Predict before seeing the answer</legend>
        <label htmlFor={`${prefix}-hops`}>Fewest edges from {scenario.start} to {scenario.target}
          <select id={`${prefix}-hops`} value={hopsDraft} onChange={event => setHopsDraft(event.target.value)}
            style={{ display: 'block', width: '100%' }}>
            <option value="">Choose a prediction</option>
            {Array.from({ length: 10 }, (_, n) => <option key={n} value={String(n)}>{n} hops</option>)}
            <option value="unreachable">Unreachable</option>
          </select>
        </label>
        <label htmlFor={`${prefix}-reason`}>Explain why you expect this result
          <textarea id={`${prefix}-reason`} rows={3} minLength={12} maxLength={400}
            value={reasoning} onChange={event => setReasoning(event.target.value)}
            style={{ display: 'block', width: '100%' }} />
        </label>
        <p>Write 12–400 characters. Your explanation is not automatically graded.</p>
        <button type="button" disabled={!validPrediction} onClick={reveal}>
          Commit prediction and begin BFS trace
        </button>
      </fieldset>}
      {trace && <section aria-labelledby={`${prefix}-trace`}>
        <h3 id={`${prefix}-trace`}>3. Inspect the FIFO queue ({visibleSteps} of {trace.steps.length} steps)</h3>
        <ol>{trace.steps.slice(0, visibleSteps).map((step, i) => <li key={i}>
          <strong>Step {i + 1}: expand {step.expanded}</strong>
          <p>{step.reading}</p>
          <p>Queue before: [{step.queueBefore.join(', ')}]. New nodes: [{step.discovered.join(', ')}].
            Queue after: [{step.queueAfter.join(', ')}]. Distance of expanded node: {step.distance}.</p>
        </li>)}</ol>
        {!allStepsRead
          ? <button type="button" onClick={() => setVisibleSteps(n => Math.min(n + 1, trace.steps.length))}>
              Next queue step
            </button>
          : <div>
              <h4>4. Compare your prediction with the model</h4>
              <p role="status">Your prediction: <strong>{hopsDraft}</strong>.
                Model: <strong>{trace.hops === null ? 'unreachable' : `${trace.hops} hops`}</strong>.</p>
              <p>{trace.explanation}</p>
              <p>Visited nodes: {trace.visited.join(' → ')}.
                {trace.reached ? ` Shortest path: ${trace.path.join(' → ')}.` : ' No path exists.'}</p>
              <button type="button" onClick={record}>Record this local attempt</button>
            </div>}
      </section>}
      {error && <p role="alert">{error}</p>}
      <p role="status" aria-live="polite">{notice}</p>
      <section aria-labelledby={`${prefix}-attempts`}>
        <h3 id={`${prefix}-attempts`}>Local practice evidence ({session.attempts.length} of 2)</h3>
        {session.attempts.length === 0 ? <p>No attempt recorded yet.</p> : <ol>
          {session.attempts.map(a => <li key={a.id}>
            <strong>{SCENARIOS[a.scenarioId].label}</strong>:
            predicted {a.prediction.hops}; model {a.trace.hops ?? 'unreachable'}.
            {a.correct ? ' Matched.' : ' Different.'}
            <p>Your reasoning: {a.prediction.reasoning}</p>
            <p>Source revision {a.sourceRevision}; model {a.modelVersion};
              evidence status: local, unverified, not saved to your account.</p>
          </li>)}
        </ol>}
        {session.attempts.length > 0 && <details>
          <summary>Inspect local attempt JSON (not uploaded)</summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {JSON.stringify(session.attempts, null, 2)}
          </pre>
        </details>}
        {finished && <button type="button" onClick={reset}>Start a new local practice</button>}
      </section>
    </section>
  );
}
