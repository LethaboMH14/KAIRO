import { useId, useState } from 'react';
import { DATASETS, MODEL_VERSION, PREPARED_SOURCE, commitAttempt, newSession, traceJoin } from './model';
import type { Attempt, DatasetId, JoinKind, JoinTrace, Scenario, Session } from './model';

/** Standalone, keyboard/reading-first activity; no authenticated account integration. */
export type SqlJoinLabProps = { onLocalAttempt?: (attempt: Attempt) => void };
const freshId = () => `local-${globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`}`;
const makeSession = () => newSession(freshId());
const firstScenario = (): Scenario => ({ datasetId: 'multiple', join: 'inner' });
const datasetIds = Object.keys(DATASETS) as DatasetId[];
const displayKey = (key: number | null) => key === null ? 'NULL' : String(key);

export default function SqlJoinLab({ onLocalAttempt }: SqlJoinLabProps) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [session, setSession] = useState<Session>(makeSession);
  const [scenario, setScenario] = useState<Scenario>(firstScenario);
  const [rowDraft, setRowDraft] = useState('');
  const [unmatchedDraft, setUnmatchedDraft] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [trace, setTrace] = useState<JoinTrace | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('Choose a dataset and JOIN type. Predict the output before inspecting the matching steps.');
  const dataset = DATASETS[scenario.datasetId];
  const finished = session.attempts.length === 2;
  const locked = trace !== null || finished;
  const valid = rowDraft.trim() !== '' && unmatchedDraft.trim() !== '' &&
    Number.isSafeInteger(Number(rowDraft)) && Number(rowDraft) >= 0 && Number(rowDraft) <= 20 &&
    Number.isSafeInteger(Number(unmatchedDraft)) && Number(unmatchedDraft) >= 0 &&
    Number(unmatchedDraft) <= dataset.left.length && reasoning.trim().length >= 12 &&
    reasoning.trim().length <= 400;
  const allStepsRead = trace !== null && visibleSteps === trace.steps.length;

  function chooseDataset(id: DatasetId) {
    setScenario({ datasetId: id, join: scenario.join });
    setRowDraft(''); setUnmatchedDraft(''); setReasoning(''); setError('');
  }
  function reveal() {
    if (locked || !valid) return;
    if (session.attempts.some(a => a.scenario.datasetId === scenario.datasetId &&
      a.scenario.join === scenario.join)) {
      setError('Choose a different dataset or JOIN type for the second attempt.');
      return;
    }
    try {
      setTrace(traceJoin(scenario)); setVisibleSteps(0); setError('');
      setNotice('Prediction locked. Read each left-row matching step, then record your local attempt.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not calculate the join.'); }
  }
  function record() {
    if (!allStepsRead || !valid) return;
    try {
      const next = commitAttempt(session, scenario, {
        rowCount: Number(rowDraft), unmatchedLeft: Number(unmatchedDraft), reasoning,
      }, new Date().toISOString());
      setSession(next); setTrace(null); setVisibleSteps(0);
      setRowDraft(''); setUnmatchedDraft(''); setReasoning(''); setError('');
      setNotice(next.attempts.length === 2
        ? 'Two distinct local attempts completed. Review them below.'
        : 'First local attempt recorded. Change the dataset or JOIN type for round two.');
      try { onLocalAttempt?.(next.attempts[next.attempts.length - 1]); }
      catch { setError('Optional host callback failed. Your local attempt is visible but was not saved to KAIRO.'); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not record this attempt.'); }
  }
  function restart() {
    setSession(makeSession()); setScenario(firstScenario()); setRowDraft('');
    setUnmatchedDraft(''); setReasoning(''); setTrace(null); setVisibleSteps(0); setError('');
    setNotice('Started fresh local practice. Previous attempts were not saved.');
  }

  return (
    <section aria-labelledby={`${prefix}-title`} style={{ maxWidth: '54rem', margin: '0 auto', padding: '1rem', lineHeight: 1.6 }}>
      <h2 id={`${prefix}-title`}>Computer Science Studio: SQL JOIN detective</h2>
      <p>Predict what happens when two small tables are joined on matching numeric keys. A single left row can match multiple right rows; a missing match behaves differently in INNER JOIN and LEFT JOIN.</p>
      <p><strong>Prepared illustrative exercise:</strong> {MODEL_VERSION}. This is not a live SQL database or a lesson grounded in your uploaded material. Attempts stay in this browser session and are <strong>not saved to your KAIRO account</strong>.</p>
      <details>
        <summary>Source, SQL assumptions and limitations</summary>
        <p><a href={PREPARED_SOURCE.url} target="_blank" rel="noreferrer">{PREPARED_SOURCE.title}</a> (reference label: {PREPARED_SOURCE.revision}).</p>
        <p>{PREPARED_SOURCE.limitation} The only ON predicate simulated is left.key = right.key; NULL never equals NULL in this predicate. We show a fixed left-to-right pedagogical row order, but real SQL output order is <strong>not guaranteed without ORDER BY</strong>.</p>
      </details>
      <fieldset disabled={locked}>
        <legend>1. Choose the tables and join</legend>
        <label htmlFor={`${prefix}-dataset`}>Prepared dataset
          <select id={`${prefix}-dataset`} value={scenario.datasetId}
            onChange={event => chooseDataset(event.target.value as DatasetId)}
            style={{ display: 'block', width: '100%' }}>
            {datasetIds.map(id => <option key={id} value={id}>{DATASETS[id].label}</option>)}
          </select>
        </label>
        <label htmlFor={`${prefix}-join`}>JOIN type
          <select id={`${prefix}-join`} value={scenario.join}
            onChange={event => { setScenario(s => ({ ...s, join: event.target.value as JoinKind })); setRowDraft(''); setUnmatchedDraft(''); setReasoning(''); setError(''); }}
            style={{ display: 'block', width: '100%' }}>
            <option value="inner">INNER JOIN (matched pairs only)</option>
            <option value="left">LEFT JOIN (keep unmatched left rows)</option>
          </select>
        </label>
      </fieldset>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Left table: {dataset.leftName}</caption>
          <thead><tr><th scope="col">Row ID</th><th scope="col">Label</th><th scope="col">key</th></tr></thead>
          <tbody>{dataset.left.map(row => <tr key={row.id}>
            <th scope="row">{row.id}</th><td>{row.label}</td><td>{displayKey(row.key)}</td>
          </tr>)}</tbody>
        </table>
        <table>
          <caption>Right table: {dataset.rightName}</caption>
          <thead><tr><th scope="col">Row ID</th><th scope="col">Label</th><th scope="col">key</th></tr></thead>
          <tbody>{dataset.right.length ? dataset.right.map(row => <tr key={row.id}>
            <th scope="row">{row.id}</th><td>{row.label}</td><td>{displayKey(row.key)}</td>
          </tr>) : <tr><td colSpan={3}>No rows in this table.</td></tr>}</tbody>
        </table>
      </div>
      {!finished && <fieldset disabled={locked}>
        <legend>2. Predict before revealing the answer</legend>
        <label htmlFor={`${prefix}-rows`}>How many result rows?
          <input id={`${prefix}-rows`} type="number" min={0} max={20} step={1}
            value={rowDraft} onChange={event => setRowDraft(event.target.value)} />
        </label>
        <label htmlFor={`${prefix}-unmatched`}>How many left rows have no match?
          <input id={`${prefix}-unmatched`} type="number" min={0} max={dataset.left.length} step={1}
            value={unmatchedDraft} onChange={event => setUnmatchedDraft(event.target.value)} />
        </label>
        <label htmlFor={`${prefix}-reason`}>Explain your prediction
          <textarea id={`${prefix}-reason`} rows={3} minLength={12} maxLength={400}
            value={reasoning} onChange={event => setReasoning(event.target.value)}
            style={{ display: 'block', width: '100%' }} />
        </label>
        <p>Write 12–400 characters. Your explanation is for reflection and is not automatically assessed.</p>
        <button type="button" disabled={!valid} onClick={reveal}>Commit prediction and reveal the join</button>
      </fieldset>}
      {trace && <section aria-labelledby={`${prefix}-trace`}>
        <h3 id={`${prefix}-trace`}>3. Inspect the join ({visibleSteps} of {trace.steps.length} left rows)</h3>
        <ol>{trace.steps.slice(0, visibleSteps).map((step, i) => <li key={step.leftId}>
          <strong>Left row {i + 1}: {step.leftId}</strong>
          <p>{step.reading}</p>
          <p>Right rows compared: {step.comparedRightIds.join(', ') || 'none'}.
            Matching IDs: {step.matchingRightIds.join(', ') || 'none'}.
            Result rows emitted: {step.emittedRows}.</p>
        </li>)}</ol>
        {!allStepsRead
          ? <button type="button" onClick={() => setVisibleSteps(n => Math.min(n + 1, trace.steps.length))}>Next left row</button>
          : <div>
            <h4>4. Compare prediction with model result</h4>
            <p role="status">Model output: <strong>{trace.rowCount} rows</strong>; <strong>{trace.unmatchedLeft} unmatched left rows</strong>. Your prediction was {rowDraft} rows and {unmatchedDraft} unmatched left rows.</p>
            <p>{trace.explanation}</p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <caption>Illustrative JOIN output (fixed trace order, not SQL ORDER BY)</caption>
                <thead><tr><th scope="col">Left ID</th><th scope="col">Left label</th><th scope="col">Left key</th><th scope="col">Right ID</th><th scope="col">Right label</th><th scope="col">Right key</th></tr></thead>
                <tbody>{trace.rows.length ? trace.rows.map((row, i) => <tr key={`${row.leftId}-${row.rightId ?? 'empty'}-${i}`}>
                  <th scope="row">{row.leftId}</th><td>{row.leftLabel}</td><td>{displayKey(row.leftKey)}</td>
                  <td>{row.rightId ?? '—'}</td><td>{row.rightLabel ?? '—'}</td>
                  <td>{row.rightId === null ? '—' : displayKey(row.rightKey)}</td>
                </tr>) : <tr><td colSpan={6}>No output rows for this INNER JOIN.</td></tr>}</tbody>
              </table>
            </div>
            <button type="button" onClick={record}>Record this local attempt</button>
          </div>}
      </section>}
      {error && <p role="alert">{error}</p>}
      <p role="status" aria-live="polite">{notice}</p>
      <section aria-labelledby={`${prefix}-attempts`}>
        <h3 id={`${prefix}-attempts`}>Local practice evidence ({session.attempts.length} of 2)</h3>
        {session.attempts.length === 0 ? <p>No attempt recorded yet.</p> : <ol>
          {session.attempts.map(attempt => <li key={attempt.id}>
            <strong>{attempt.scenario.datasetId} / {attempt.scenario.join.toUpperCase()} JOIN</strong>:
            predicted {attempt.prediction.rowCount} rows and {attempt.prediction.unmatchedLeft} unmatched;
            model gave {attempt.actual.rowCount} rows and {attempt.actual.unmatchedLeft} unmatched.
            {attempt.correct ? ' Both numbers matched.' : ' Review the model trace to revise your reasoning.'}
            <p>Reasoning: {attempt.prediction.reasoning}</p>
            <small>{attempt.modelVersion} · {attempt.sourceRevision} · {attempt.evidenceStatus} · {attempt.at}</small>
          </li>)}
        </ol>}
        <button type="button" onClick={restart}>Restart local practice</button>
      </section>
    </section>
  );
}
