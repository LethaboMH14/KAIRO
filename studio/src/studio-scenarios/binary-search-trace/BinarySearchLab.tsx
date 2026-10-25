import { useId, useState } from 'react';
import {
  ARRAYS, commitAttempt, MODEL_VERSION, newSession,
  PREPARED_SOURCE, traceScenario,
} from './model';
import type { ArrayId, Attempt, Prediction, Scenario, SearchTrace, Session } from './model';

/** Isolated 2D/reading-first Computer Science activity. No app router or owner persistence. */
export type BinarySearchLabProps = {
  onLocalAttempt?: (attempt: Attempt) => void;
};
const freshId = () => `local-${globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`}`;
const makeSession = () => newSession(freshId());
const firstScenario = (): Scenario => ({ arrayId: 'repeats', target: 2 });
const allArrayIds = Object.keys(ARRAYS) as ArrayId[];

export default function BinarySearchLab({ onLocalAttempt }: BinarySearchLabProps) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [session, setSession] = useState<Session>(makeSession);
  const [scenario, setScenario] = useState<Scenario>(firstScenario);
  const [indexDraft, setIndexDraft] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [trace, setTrace] = useState<SearchTrace | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('Choose an array and target, predict an index, then inspect each comparison.');
  const array = ARRAYS[scenario.arrayId];
  const finished = session.attempts.length === 2;
  const locked = trace !== null || finished;
  const predicted = indexDraft.trim() !== '' && Number.isSafeInteger(Number(indexDraft)) &&
    Number(indexDraft) >= 0 && Number(indexDraft) <= array.values.length &&
    reasoning.trim().length >= 12 && reasoning.trim().length <= 400;
  const completeTrace = trace !== null && visibleSteps === trace.steps.length;

  function chooseArray(id: ArrayId) {
    setScenario({ arrayId: id, target: ARRAYS[id].targets[0] });
    setIndexDraft(''); setReasoning(''); setError('');
  }
  function reveal() {
    if (!predicted || locked) return;
    if (session.attempts.some(a => a.scenario.arrayId === scenario.arrayId && a.scenario.target === scenario.target)) {
      setError('Choose a different array or target for your second attempt.');
      return;
    }
    try {
      setTrace(traceScenario(scenario));
      setVisibleSteps(0);
      setError('');
      setNotice('Prediction locked for this trace. Read the comparisons, then record your attempt.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start the trace.'); }
  }
  function record() {
    if (!completeTrace || !predicted) return;
    try {
      const prediction: Prediction = { index: Number(indexDraft), reasoning };
      const next = commitAttempt(session, scenario, prediction, new Date().toISOString());
      setSession(next);
      setTrace(null); setVisibleSteps(0); setIndexDraft(''); setReasoning(''); setError('');
      setNotice(next.attempts.length === 2
        ? 'Two different local attempts completed. Review the evidence below.'
        : 'First local attempt recorded. Change the array or target before round two.');
      // Local callback is a notification, NOT authenticated server persistence.
      try { onLocalAttempt?.(next.attempts[next.attempts.length - 1]); }
      catch { setError('The optional host callback failed. Your local attempt remains visible below, but was not saved by KAIRO.'); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not record this attempt.'); }
  }
  function reset() {
    setSession(makeSession()); setScenario(firstScenario()); setIndexDraft(''); setReasoning('');
    setTrace(null); setVisibleSteps(0); setError('');
    setNotice('Started a new local practice. Earlier attempts were not saved.');
  }
  return (
    <section aria-labelledby={`${prefix}-title`} style={{ maxWidth: '52rem', margin: '0 auto', padding: '1rem', lineHeight: 1.6 }}>
      <h2 id={`${prefix}-title`}>Computer Science Studio: trace binary search</h2>
      <p>Binary search can find the <strong>first insertion position</strong> in an already sorted list.
        Predict the index before seeing the answer. Duplicates, missing values and an empty list behave differently.</p>
      <p><strong>Prepared educational model:</strong> {MODEL_VERSION}. Indexes start at 0; the upper search bound is exclusive.
        This trace illustrates lower-bound binary search, not a live program debugger or an authenticated learner lesson. Local, unverified attempts are not saved to your KAIRO account.</p>
      <details>
        <summary>Concept source and limitations</summary>
        <p><a href={PREPARED_SOURCE.url} target="_blank" rel="noreferrer">{PREPARED_SOURCE.title}</a> — revision {PREPARED_SOURCE.revision}.</p>
        <p>{PREPARED_SOURCE.limitation} The prepared lists are already sorted; comparisons are numeric, not language-sensitive.</p>
      </details>
      <fieldset disabled={locked}>
        <legend>1. Change the data and search target</legend>
        <label htmlFor={`${prefix}-array`}>Sorted list
          <select id={`${prefix}-array`} value={scenario.arrayId}
            onChange={event => chooseArray(event.target.value as ArrayId)} style={{ display: 'block', width: '100%' }}>
            {allArrayIds.map(id => <option key={id} value={id}>{ARRAYS[id].label}</option>)}
          </select>
        </label>
        <p><strong>List values:</strong> {array.values.length ? array.values.join(', ') : '(empty list)'}</p>
        <label htmlFor={`${prefix}-target`}>Value to find or insert
          <select id={`${prefix}-target`} value={scenario.target}
            onChange={event => { setScenario(s => ({ ...s, target: Number(event.target.value) })); setIndexDraft(''); setReasoning(''); setError(''); }}
            style={{ display: 'block', width: '100%' }}>
            {array.targets.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <p>The answer is an index between 0 and {array.values.length}, inclusive. If the target appears more than once, choose its first index.</p>
      </fieldset>
      {!finished && <fieldset disabled={locked}>
        <legend>2. Predict before revealing the trace</legend>
        <label htmlFor={`${prefix}-index`}>Predicted first insertion index
          <input id={`${prefix}-index`} type="number" min={0} max={array.values.length} step={1}
            value={indexDraft} onChange={event => setIndexDraft(event.target.value)}
            style={{ display: 'block', width: '100%' }} />
        </label>
        <label htmlFor={`${prefix}-reason`}>Why is this the first possible index?
          <textarea id={`${prefix}-reason`} rows={3} minLength={12} maxLength={400} value={reasoning}
            onChange={event => setReasoning(event.target.value)} style={{ display: 'block', width: '100%' }} />
        </label>
        <p>Explain in 12–400 characters. Your reasoning is saved locally for reflection but is not automatically graded.</p>
        <button type="button" disabled={!predicted} onClick={reveal}>Commit prediction and reveal comparisons</button>
      </fieldset>}
      {trace && <section aria-labelledby={`${prefix}-steps`}>
        <h3 id={`${prefix}-steps`}>3. Read the comparison trace ({visibleSteps} of {trace.steps.length})</h3>
        {trace.steps.length === 0 && <p>The list is empty. No comparisons are needed.</p>}
        <ol>{trace.steps.slice(0, visibleSteps).map((s, i) => (
          <li key={i}>
            <strong>Step {i + 1}: interval [{s.low}, {s.high}), midpoint index {s.mid}, value {s.value}.</strong>
            <p>{s.reading}</p>
            <p>Next possible interval: [{s.nextLow}, {s.nextHigh}).</p>
          </li>
        ))}</ol>
        {!completeTrace
          ? <button type="button" onClick={() => setVisibleSteps(n => Math.min(n + 1, trace.steps.length))}>Next comparison</button>
          : <div>
            <p><strong>Model answer:</strong> index {trace.index}; target {trace.found ? 'found' : 'not present'}.
              Your prediction {Number(indexDraft) === trace.index ? 'matched' : 'did not match'}.</p>
            <p>{trace.explanation}</p>
            <p><strong>Partition check:</strong> before index {trace.index}: [{trace.leftPartition.join(', ')}] (all less than {scenario.target});
              from index {trace.index}: [{trace.rightPartition.join(', ')}] (all at least {scenario.target}).</p>
            <button type="button" onClick={record}>Record this local attempt</button>
          </div>}
        <button type="button" onClick={() => {
          setTrace(null); setVisibleSteps(0); setError('');
          setNotice('Trace closed. You may edit your prediction before recording.');
        }}>Edit my prediction</button>
      </section>}
      <p role="status" aria-live="polite">{notice}</p>
      {error && <p role="alert">{error}</p>}
      <section aria-labelledby={`${prefix}-attempts`}>
        <h3 id={`${prefix}-attempts`}>4. Local practice evidence ({session.attempts.length} of 2)</h3>
        <ol>{session.attempts.map((a, i) => <li key={a.id}>
          <strong>Round {i + 1}:</strong> {ARRAYS[a.scenario.arrayId].label}; target {a.scenario.target}.
          <p>Predicted index {a.prediction.index}; model index {a.trace.index}. {a.correct ? 'Matched.' : 'Different.'}</p>
          <p>Your reasoning: {a.prediction.reasoning}</p>
          <p>Model {a.modelVersion}; source revision {a.referenceRevision}. Evidence status: local, unverified and not saved to your account.</p>
        </li>)}</ol>
        {session.attempts.length > 0 && <details>
          <summary>Inspect local evidence JSON (not uploaded)</summary>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(session.attempts, null, 2)}</pre>
        </details>}
        {finished && <button type="button" onClick={reset}>Start a new local practice</button>}
      </section>
    </section>
  );
}
