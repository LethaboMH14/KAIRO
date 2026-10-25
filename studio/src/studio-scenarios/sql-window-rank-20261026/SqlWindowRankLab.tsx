import { useEffect, useId, useRef, useState } from 'react';
import { BOARDS, FUNCTIONS, SOURCE, newSession, recordAttempt } from './model.mjs';
import type { Attempt, BoardId, FunctionId, RowId, Session, TraceRow } from './model.mjs';

export type SqlWindowRankLabProps = { onLocalAttempt?: (attempt: Attempt) => void };
const controlStyle = { padding: '.55rem', fontSize: '1rem', maxWidth: '100%' } as const;
const cellStyle = { padding: '.4rem', borderBottom: '1px solid #ccd6df' } as const;

/** Standalone, reading-first SQL learning activity. It never runs SQL or contacts a server. */
export default function SqlWindowRankLab({ onLocalAttempt }: SqlWindowRankLabProps) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [boardId, setBoardId] = useState<BoardId>('top-tie');
  const [functionId, setFunctionId] = useState<FunctionId>('rank');
  const [targetId, setTargetId] = useState<RowId>('cy');
  const [prediction, setPrediction] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [session, setSession] = useState<Session>(newSession);
  const [last, setLast] = useState<{ attempt: Attempt; trace: readonly TraceRow[] } | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState('');
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (last) resultHeading.current?.focus(); }, [last]);

  const board = BOARDS.find(item => item.id === boardId)!;
  const chosenFunction = FUNCTIONS.find(item => item.id === functionId)!;
  const completed = session.actions.length === 2;
  const canCommit = !completed && prediction !== null &&
    explanation.trim().length >= 12 && explanation.length <= 400;
  function changed() { setPrediction(null); setError(''); }
  function commit() {
    if (!canCommit || prediction === null) return;
    try {
      const result = recordAttempt(session, { boardId, functionId, targetId, prediction, explanation });
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
    <section aria-labelledby={prefix + '-title'} style={{ maxWidth: 850, margin: '0 auto', padding: '1rem', color: '#193044', font: '1rem/1.55 system-ui, sans-serif' }}>
      <h1 id={prefix + '-title'}>KAIRO Computer Science Studio — SQL ranking challenge</h1>
      <p>Five fictional learners have scores. Choose a SQL window function, predict the selected learner's result, and explain your reasoning <strong>before</strong> you reveal the ordered trace. Complete two different attempts.</p>
      <p><strong>Concept source:</strong> <a href={SOURCE.url} target="_blank" rel="noopener noreferrer">{SOURCE.title}</a>.
        {' '}Source revision: {SOURCE.sourceRevision}; model revision: {SOURCE.modelRevision}.</p>
      <p><strong>Limits:</strong> Prepared KAIRO-authored example scores, not real learner data or a running PostgreSQL database. This model illustrates only one window over five rows, not SQL execution or an assessed grade.</p>
      <p><strong>Privacy:</strong> Predictions and explanations remain in page memory. Nothing is uploaded, stored in your account or certified. Attempts are local-unverified.</p>
      <p role="status" aria-live="polite">Attempt {Math.min(session.actions.length + 1, 2)} of 2; {session.actions.length} distinct local attempts recorded.</p>

      <fieldset disabled={completed} style={{ marginBlock: '1rem' }}>
        <legend><strong>Step 1 — Choose the score table and window function</strong></legend>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label htmlFor={prefix + '-board'}>Score pattern<br />
            <select id={prefix + '-board'} value={boardId} style={controlStyle}
              onChange={event => { setBoardId(event.target.value as BoardId); changed(); }}>
              {BOARDS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label htmlFor={prefix + '-function'}>Window function<br />
            <select id={prefix + '-function'} value={functionId} style={controlStyle}
              onChange={event => { setFunctionId(event.target.value as FunctionId); changed(); }}>
              {FUNCTIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label htmlFor={prefix + '-target'}>Learner to predict<br />
            <select id={prefix + '-target'} value={targetId} style={controlStyle}
              onChange={event => { setTargetId(event.target.value as RowId); changed(); }}>
              {board.rows.map(row => <option key={row.id} value={row.id}>{row.id.toUpperCase()}</option>)}
            </select>
          </label>
        </div>
        <p>{chosenFunction.help}</p>
        <p><strong>SQL expression being modelled:</strong></p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: '.7rem', background: '#edf3f6' }}><code>{chosenFunction.sql}</code></pre>
        <p>ROW_NUMBER uses learner ID as a <strong>second sort key</strong> to make ties deterministic. RANK and DENSE_RANK order only by score, so equal scores are peers.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <caption>Prepared fictional scores — shown before your prediction</caption>
          <thead><tr><th scope="col" style={cellStyle}>Learner ID</th><th scope="col" style={cellStyle}>Score</th></tr></thead>
          <tbody>{board.rows.map(row => <tr key={row.id}>
            <th scope="row" style={cellStyle}>{row.id.toUpperCase()}{row.id === targetId ? ' (target)' : ''}</th>
            <td style={cellStyle}>{row.score}</td>
          </tr>)}</tbody>
        </table>
      </fieldset>

      <fieldset disabled={completed} style={{ marginBlock: '1rem' }}>
        <legend><strong>Step 2 — Predict and explain</strong></legend>
        <p>What number will {chosenFunction.label} return for {targetId.toUpperCase()}?</p>
        <div>{[1, 2, 3, 4, 5].map(value => <label key={value} style={{ display: 'inline-block', padding: '.5rem', marginRight: '.4rem' }}>
          <input type="radio" name={prefix + '-prediction'} checked={prediction === value}
            onChange={() => setPrediction(value)} /> {value}
        </label>)}</div>
        <label htmlFor={prefix + '-why'} style={{ display: 'block', marginTop: '.6rem' }}>
          Why? Explain what ties do to this function (12–400 characters).
        </label>
        <textarea id={prefix + '-why'} rows={3} maxLength={400} value={explanation}
          style={{ width: '100%', maxWidth: '100%', font: 'inherit', padding: '.4rem', boxSizing: 'border-box' }}
          onChange={event => setExplanation(event.target.value)} />
        <button type="button" disabled={!canCommit} onClick={commit} style={{ ...controlStyle, display: 'block', marginTop: '.7rem' }}>
          Lock prediction and reveal result
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {last && <section aria-labelledby={prefix + '-result'} style={{ border: '2px solid #54748b', padding: '1rem', marginBlock: '1rem' }}>
        <h2 id={prefix + '-result'} tabIndex={-1} ref={resultHeading}>Step 3 — Compare and inspect the ordered trace</h2>
        <p role="status">You predicted <strong>{last.attempt.prediction}</strong>; the prepared model returns <strong>{last.attempt.observed}</strong>.
          {' '}{last.attempt.correct ? 'Your prediction matched.' : 'Your prediction differed; inspect the peer groups below.'}</p>
        <p>Attempt {last.attempt.id}: {last.attempt.verification}. This is not an account assessment or certified competency.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <caption>One row at a time — ordered SQL ranking explanation</caption>
          <thead><tr>
            <th scope="col" style={cellStyle}>Position</th><th scope="col" style={cellStyle}>Learner</th>
            <th scope="col" style={cellStyle}>Score</th><th scope="col" style={cellStyle}>Peer group</th>
            <th scope="col" style={cellStyle}>Function result</th><th scope="col" style={cellStyle}>Why</th>
          </tr></thead>
          <tbody>{last.trace.slice(0, visibleSteps).map(row => <tr key={row.id}>
            <th scope="row" style={cellStyle}>{row.position}</th>
            <td style={cellStyle}>{row.id.toUpperCase()}{row.target ? ' (your target)' : ''}</td>
            <td style={cellStyle}>{row.score}</td><td style={cellStyle}>{row.peerGroup}</td>
            <td style={cellStyle}>{row.result}</td><td style={cellStyle}>{row.reason}</td>
          </tr>)}</tbody>
        </table>
        {visibleSteps < last.trace.length
          ? <button type="button" style={{ ...controlStyle, marginTop: '.7rem' }}
              onClick={() => setVisibleSteps(n => Math.min(n + 1, last.trace.length))}>
              Reveal next row ({visibleSteps + 1} of {last.trace.length})
            </button>
          : <p role="status">All five rows revealed. Change the function, target or score pattern for your next attempt.</p>}
      </section>}
      {session.actions.length > 0 && <section aria-labelledby={prefix + '-history'}>
        <h2 id={prefix + '-history'}>Local practice history</h2>
        <ol>{session.actions.map((action, index) => <li key={index}>
          Attempt {index + 1}: {action.boardId}, {action.functionId}, {action.targetId.toUpperCase()}, predicted {action.prediction} — local-unverified.
        </li>)}</ol>
      </section>}
      {completed && <p role="status">Two distinct attempts completed locally. You can start a new round.</p>}
      <button type="button" style={controlStyle} onClick={reset}>Start a new two-attempt round</button>
    </section>
  );
}
