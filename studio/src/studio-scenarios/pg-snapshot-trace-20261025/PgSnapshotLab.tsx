import { useId, useState } from 'react';
import { SOURCE, ISOLATIONS, TIMINGS, BASES, DELTAS, newSession, recordAttempt } from './model.mjs';
import type { Isolation, Timing, Session, Attempt, TraceStep } from './model.mjs';

export type PgSnapshotLabProps = { onLocalAttempt?: (attempt: Attempt) => void };
const selectStyle = { padding: '.5rem', fontSize: '1rem', maxWidth: '100%' } as const;

/** Isolated, reading-first, synthetic database learning activity; no SQL is executed. */
export default function PgSnapshotLab({ onLocalAttempt }: PgSnapshotLabProps) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [isolation, setIsolation] = useState<Isolation>('read-committed');
  const [timing, setTiming] = useState<Timing>('between-reads');
  const [base, setBase] = useState(10);
  const [delta, setDelta] = useState(5);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [session, setSession] = useState<Session>(newSession);
  const [last, setLast] = useState<{ attempt: Attempt; trace: readonly TraceStep[] } | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState('');
  const completed = session.actions.length >= 2;
  const choices = [base, base + delta];
  const canCommit = !completed && prediction !== null && explanation.trim().length >= 12;
  function scenarioChanged() { setPrediction(null); setError(''); }
  function commit() {
    if (!canCommit || prediction === null) return;
    try {
      const result = recordAttempt(session, { isolation, timing, base, delta, prediction, explanation });
      setSession(result.session);
      setLast({ attempt: result.attempt, trace: result.trace });
      setVisibleSteps(0);
      setPrediction(null);
      setExplanation('');
      setError('');
      onLocalAttempt?.(result.attempt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The prepared trace could not be checked.');
    }
  }
  function reset() {
    setSession(newSession()); setLast(null); setVisibleSteps(0);
    setPrediction(null); setExplanation(''); setError('');
  }
  return (
    <section aria-labelledby={prefix + '-title'} style={{ maxWidth: 800, margin: '0 auto', padding: '1rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.55, color: '#162b3b' }}>
      <h1 id={prefix + '-title'}>KAIRO Computer Science Studio — Database snapshot challenge</h1>
      <p>Two readers can see different values even when neither changes a row. Choose an isolation level and the moment a second transaction writes, then <strong>predict the second SELECT</strong> before seeing the trace.</p>
      <p><strong>Reviewed concept:</strong> <a href={SOURCE.url} target="_blank" rel="noopener noreferrer">{SOURCE.title}</a>.
        {' '}Source revision: {SOURCE.sourceRevision}; model revision: {SOURCE.modelRevision}.</p>
      <p><strong>Limits:</strong> This is a KAIRO-authored, illustrative <em>read-only snapshot</em> trace, not a running PostgreSQL database, SQL executor, concurrency benchmark or account-linked assessment. It does not model locks, write conflicts, serialization failures or other engines.</p>
      <p><strong>Privacy:</strong> Your explanation and predictions remain in page memory. Nothing is uploaded or saved to your KAIRO account. Results are local-unverified.</p>
      <p aria-live="polite">Attempt {Math.min(session.actions.length + 1, 2)} of 2; completed {session.actions.length} distinct local attempts.</p>
      <fieldset disabled={completed} style={{ marginBlock: '1rem' }}>
        <legend><strong>Step 1 — Set the two-transaction scenario</strong></legend>
        <p>Transaction A makes two SELECTs. Transaction B changes one fictional row from the starting value to starting value + change.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label htmlFor={prefix + '-isolation'}>A's isolation level<br />
            <select id={prefix + '-isolation'} value={isolation} style={selectStyle}
              onChange={event => { setIsolation(event.target.value as Isolation); scenarioChanged(); }}>
              {ISOLATIONS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </label>
          <label htmlFor={prefix + '-timing'}>When B writes<br />
            <select id={prefix + '-timing'} value={timing} style={selectStyle}
              onChange={event => { setTiming(event.target.value as Timing); scenarioChanged(); }}>
              {TIMINGS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </label>
          <label htmlFor={prefix + '-base'}>Starting value<br />
            <select id={prefix + '-base'} value={base} style={selectStyle}
              onChange={event => { setBase(Number(event.target.value)); scenarioChanged(); }}>
              {BASES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label htmlFor={prefix + '-delta'}>Writer's increase<br />
            <select id={prefix + '-delta'} value={delta} style={selectStyle}
              onChange={event => { setDelta(Number(event.target.value)); scenarioChanged(); }}>
              {DELTAS.map(n => <option key={n} value={n}>+{n}</option>)}
            </select>
          </label>
        </div>
        <p>{ISOLATIONS.find(x => x.id === isolation)?.help}</p>
      </fieldset>
      <fieldset disabled={completed} style={{ marginBlock: '1rem' }}>
        <legend><strong>Step 2 — Predict and explain before revealing</strong></legend>
        <p>Will A's second SELECT return the original {base}, or the changed {base + delta}?</p>
        {choices.map(value => (
          <label key={value} style={{ display: 'inline-block', marginRight: '1.5rem', paddingBlock: '.4rem' }}>
            <input type="radio" name={prefix + '-prediction'} checked={prediction === value}
              onChange={() => setPrediction(value)} /> {value}
          </label>
        ))}
        <label htmlFor={prefix + '-why'} style={{ display: 'block', marginTop: '.7rem' }}>Why do you expect that value? (12–400 characters)</label>
        <textarea id={prefix + '-why'} rows={3} maxLength={400} value={explanation} style={{ width: '100%', maxWidth: '100%', font: 'inherit' }}
          onChange={event => setExplanation(event.target.value)} />
        <button type="button" disabled={!canCommit} onClick={commit} style={{ display: 'block', padding: '.6rem .8rem', marginTop: '.7rem' }}>Lock prediction and inspect the trace</button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {last && <section aria-labelledby={prefix + '-result'} style={{ border: '2px solid #59748a', padding: '1rem' }}>
        <h2 id={prefix + '-result'}>Step 3 — Compare and trace your last attempt</h2>
        <p role="status">You predicted <strong>{last.attempt.prediction}</strong>. A's first SELECT returned {last.attempt.first}; its second SELECT returned <strong>{last.attempt.observed}</strong>.
          {' '}{last.attempt.correct ? 'Your prediction matched.' : 'Your prediction differed. Reveal the steps to see why.'}</p>
        <p>Recorded as {last.attempt.id} ({last.attempt.verification}). This is not certified competency or account evidence.</p>
        <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
          <caption>Ordered reading trace — reveal one event at a time</caption>
          <thead><tr><th scope="col">Step</th><th scope="col">Transaction</th><th scope="col">Event</th><th scope="col">Event value / A read</th><th scope="col">Why</th></tr></thead>
          <tbody>{last.trace.slice(0, visibleSteps).map(step => <tr key={step.step}>
            <th scope="row">{step.step}</th><td>{step.actor}</td><td>{step.action}</td>
            <td>{step.visible === null ? 'Not committed' : step.visible}</td><td>{step.explanation}</td>
          </tr>)}</tbody>
        </table>
        {visibleSteps < last.trace.length
          ? <button type="button" onClick={() => setVisibleSteps(n => Math.min(n + 1, last.trace.length))}>
              Reveal next event ({visibleSteps + 1} of {last.trace.length})
            </button>
          : <p role="status">All events revealed. Try changing the isolation level or writer timing for your next attempt.</p>}
      </section>}
      {session.actions.length > 0 && <section aria-labelledby={prefix + '-history'}>
        <h2 id={prefix + '-history'}>Local practice history</h2>
        <ol>{session.actions.map((action, index) => <li key={index}>
          Attempt {index + 1}: {action.isolation}, {action.timing}, initial {action.base}, change +{action.delta}; prediction {action.prediction}. Local-unverified.
        </li>)}</ol>
      </section>}
      {completed && <p role="status">Two distinct attempts completed locally. Start a new round to practise again.</p>}
      <button type="button" onClick={reset} style={{ marginTop: '1rem', padding: '.6rem .8rem' }}>Start a new two-attempt round</button>
    </section>
  );
}
