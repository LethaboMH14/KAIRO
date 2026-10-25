import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  CHALLENGE_SCHEMA, CONCEPT_SOURCE, PROVENANCE, SCENARIOS, initialState,
  restore, serialize, transition, type Direction, type State,
} from './challenge.ts';
import './pump-what-if.css';

const fixed = (n: number) => n.toFixed(2);
const dirWord = (direction: Direction) =>
  direction === 'increase' ? 'increase' : direction === 'decrease' ? 'decrease' : 'stay the same';

export default function PumpWhatIf() {
  const id = useId();
  const [state, setState] = useState<State>(initialState);
  const [direction, setDirection] = useState<Direction | ''>('');
  const [estimate, setEstimate] = useState('');
  const [note, setNote] = useState('');
  const [view, setView] = useState<'visual' | 'reading'>('visual');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Choose a prediction. The model result stays hidden until you commit.');
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => { generation.current += 1; }, []);

  const ready = state.phase === 'predict';
  const round = ready ? state.attempts.length : state.attempts.length - 1;
  const scenario = SCENARIOS[Math.max(0, round)];
  const latest = state.phase === 'explain' ? state.attempts[state.attempts.length - 1] : null;

  function predict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!direction || !estimate.trim()) throw new Error('Choose a direction and enter a numeric estimate before revealing the model.');
      // Never accept Number('') as zero.
      const next = transition(state, { type: 'predict', direction, estimateLps: Number(estimate) });
      setState(next);
      setError('');
      setStatus('Prediction recorded. Now inspect the model result and write your own explanation.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The prediction could not be recorded.'); }
  }

  function explain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const next = transition(state, { type: 'explain', note });
      setState(next);
      setNote('');
      setDirection('');
      setEstimate('');
      setError('');
      setStatus(next.phase === 'done' ? 'Two attempts recorded, with explanations. Save your local progress file.' : 'Guided attempt recorded. Now predict the new case without hints.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The explanation could not be recorded.'); }
  }

  function save() {
    try {
      const snapshot = serialize(state);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kairo-pump-what-if-progress.json';
      link.click();
      URL.revokeObjectURL(url);
      setError('');
      setStatus('Local progress file prepared. This is not saved to your KAIRO account or verified as coursework.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not prepare the local file.'); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const token = ++generation.current;
    setLoading(true);
    setError('');
    setStatus('Reading your selected local file. Your current work is unchanged until it passes validation.');
    try {
      if (file.size > 8192) throw new Error('Progress file too large (8 KiB limit). Choose a valid KAIRO challenge file.');
      const raw = await file.text();
      if (token !== generation.current) return;
      const restored = restore(JSON.parse(raw) as unknown);
      setState(restored);
      setDirection('');
      setEstimate('');
      setNote('');
      setStatus('Progress restored from a local file and checked against the current model. It is not an authenticated record.');
    } catch (cause) {
      if (token === generation.current) setError(cause instanceof Error ? cause.message : 'Could not load progress. Try another local file.');
    } finally {
      if (token === generation.current) setLoading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function cancelImport() {
    generation.current += 1; // A late File.text() result is discarded; no network action occurs.
    setLoading(false);
    setError('');
    setStatus('Import cancelled. Existing work was not changed.');
    if (fileInput.current) fileInput.current.value = '';
  }
  function restart() {
    generation.current += 1;
    setLoading(false);
    setState(initialState());
    setDirection('');
    setEstimate('');
    setNote('');
    setError('');
    setStatus('New attempt started. Earlier work remains only in files you already saved.');
  }

  return <main className="pw" aria-labelledby={id + '-title'}>
    <a href={'#' + id + '-task'} className="pw-skip">Skip to prediction task</a>
    <header className="pw-heading">
      <p className="pw-eyebrow">KAIRO Access / Engineering Studio / Two-round practice</p>
      <h1 id={id + '-title'}>What happens when the valve changes?</h1>
      <p><strong>Illustrative teaching model — not a real pump or operating instruction.</strong> Predict a change, reveal a deterministic consequence, inspect why it happened, then try a new case independently.</p>
      <p className="pw-source">Concept reference: <a href={CONCEPT_SOURCE.url} target="_blank" rel="noopener noreferrer">{CONCEPT_SOURCE.organisation}: {CONCEPT_SOURCE.title}</a> (checked {CONCEPT_SOURCE.checked}). {CONCEPT_SOURCE.claim}</p>
      <p>Numbers: existing KAIRO pump model <code>kairo-pump-lab-model/1</code>, documented in <code>docs/pump-lab/MODEL.md</code>. Its coefficients are educational choices, not externally calibrated. Evidence status: <strong>{PROVENANCE}</strong>; no uploaded source/revision or private lesson is attached.</p>
    </header>

    <section className="pw-task" id={id + '-task'} aria-labelledby={id + '-round'}>
      <p className="pw-eyebrow">Round {Math.min(state.attempts.length + (state.phase === 'predict' ? 1 : 0), SCENARIOS.length)} of {SCENARIOS.length} · {scenario.independent ? 'Independent attempt' : 'Guided prediction'}</p>
      <h2 id={id + '-round'}>{state.phase === 'done' ? 'Your two-round evidence' : scenario.independent ? 'Test your own understanding' : 'First, make a prediction'}</h2>
      {state.phase !== 'done' && <>
        <p>Use the same healthy model, fixed water levels, and speed <strong>{scenario.speedRpm} rpm</strong>. The passive valve goes from <strong>{scenario.beforeValvePct}%</strong> open to <strong>{scenario.afterValvePct}%</strong> open. What will happen to the steady water flow?</p>
        <p className="pw-muted">Only valve opening changes. The pump model solves the intersection of its head curve with the system resistance curve. The tanks do not transfer water in this task.</p>
      </>}
      {ready && <form onSubmit={predict} noValidate>
        <fieldset>
          <legend>Predict the change in flow before seeing the result</legend>
          {(['increase','decrease','unchanged'] as const).map(choice => <label className="pw-option" key={choice}>
            <input type="radio" name={id + '-direction'} value={choice} checked={direction === choice} onChange={() => setDirection(choice)} required />
            {choice === 'unchanged' ? 'Stay the same' : choice[0].toUpperCase() + choice.slice(1)}
          </label>)}
        </fieldset>
        <label className="pw-estimate" htmlFor={id + '-estimate'}>Estimate the flow after the change (0–30 L/s)</label>
        <input id={id + '-estimate'} type="number" inputMode="decimal" min="0" max="30" step="any" required value={estimate} onChange={event => setEstimate(event.target.value)} />
        <button type="submit" className="pw-primary">Commit prediction and reveal model</button>
      </form>}
      {latest && <div className="pw-outcome" aria-label="Recorded model result">
        <h3>What the teaching model calculated</h3>
        <p>Your prediction: flow would <strong>{dirWord(latest.direction)}</strong>, reaching <strong>{fixed(latest.estimateLps)} L/s</strong>.</p>
        <p>Model result: flow would <strong>{dirWord(latest.actualDirection)}</strong>. Your direction {latest.directionMatches ? 'matched' : 'did not match'} the model. Numerical error: <strong>{fixed(latest.absoluteErrorLps)} L/s</strong>.</p>
        <div className="pw-view-switch" role="group" aria-label="Result display">
          <button type="button" aria-pressed={view === 'visual'} onClick={() => setView('visual')}>2D comparison</button>
          <button type="button" aria-pressed={view === 'reading'} onClick={() => setView('reading')}>Reading view</button>
        </div>
        {view === 'visual' ? <div className="pw-bars" aria-label="Model flows with numerical labels">
          <div><span>Before: {fixed(latest.beforeLps)} L/s</span><meter aria-label="Flow before, litres per second" min="0" max="30" value={latest.beforeLps}/></div>
          <div><span>After: {fixed(latest.afterLps)} L/s</span><meter aria-label="Flow after, litres per second" min="0" max="30" value={latest.afterLps}/></div>
        </div> : <dl className="pw-reading">
          <dt>Before flow</dt><dd>{fixed(latest.beforeLps)} L/s</dd>
          <dt>After flow</dt><dd>{fixed(latest.afterLps)} L/s</dd>
          <dt>Change (after minus before)</dt><dd>{fixed(latest.deltaLps)} L/s</dd>
        </dl>}
        <details>
          <summary>Inspect the model explanation and assumptions</summary>
          <p>A passive valve changes resistance. In this simplified model, the loss coefficient is 0.01 divided by (opening fraction squared). Closing it raises resistance; opening it reduces resistance. A different intersection of the pump and system curves changes the flow.</p>
          <dl className="pw-reading">
            <dt>Flow (before → after)</dt><dd>{fixed(latest.beforeLps)} → {fixed(latest.afterLps)} L/s</dd>
            <dt>Valve head loss (before → after)</dt><dd>{fixed(latest.beforeValveLossM)} → {fixed(latest.afterValveLossM)} m at each operating point</dd>
            <dt>Pump head (before → after)</dt><dd>{fixed(latest.beforeHeadM)} → {fixed(latest.afterHeadM)} m</dd>
            <dt>Speed and tank volumes</dt><dd>Held fixed in the healthy illustrative model</dd>
          </dl>
          <p>These head-loss readings change with flow as well as the valve coefficient. The reference supports the concept, not these particular calculated coefficients.</p>
        </details>
        <form onSubmit={explain} noValidate>
          <label htmlFor={id + '-explain'}>Explain in your own words what changed and why (12–280 characters; not automatically graded)</label>
          <textarea id={id + '-explain'} required minLength={12} maxLength={280} rows={3} value={note} onChange={event => setNote(event.target.value)} />
          <p className="pw-muted">No names, personal details or private study passages in this locally exported note.</p>
          <button type="submit" className="pw-primary">{scenario.independent ? 'Record independent explanation' : 'Record explanation and start independent attempt'}</button>
        </form>
      </div>}
      {state.phase === 'done' && <div className="pw-outcome">
        <p>Two predictions and written explanations are recorded. This is <strong>self-reported local practice, not a grade or verified mastery</strong>.</p>
        <ol>{state.attempts.map(a => <li key={a.scenarioId}>
          <strong>{a.independent ? 'Independent' : 'Guided'}:</strong> predicted {dirWord(a.direction)}, model {dirWord(a.actualDirection)}, estimate error {fixed(a.absoluteErrorLps)} L/s.
          <blockquote>{a.note}</blockquote>
        </li>)}</ol>
      </div>}
    </section>

    <section className="pw-save" aria-label="Local progress and recovery">
      <h2>Save and resume on this device</h2>
      <p>Export a small JSON file, then choose it here to resume. This does <strong>not</strong> save to a KAIRO account, sync across devices, or verify source ownership. Files containing personal notes are your responsibility.</p>
      <div className="pw-actions">
        <button type="button" onClick={save} disabled={loading}>Export local progress</button>
        <label htmlFor={id + '-file'}>Restore local progress JSON</label>
        <input id={id + '-file'} ref={fileInput} type="file" accept=".json,application/json" onChange={importFile} disabled={loading} />
        {loading && <button type="button" onClick={cancelImport}>Cancel import</button>}
        <button type="button" onClick={restart}>Restart challenge</button>
      </div>
      {loading && <p role="status">Validating local progress…</p>}
      {error && <p className="pw-error" role="alert">{error}</p>}
      <p className="pw-status" role="status" aria-live="polite">{status}</p>
      <p className="pw-muted">Progress contract: <code>{CHALLENGE_SCHEMA}</code>. Older or changed model files fail closed instead of silently showing incompatible results. No network is contacted by this challenge.</p>
    </section>
  </main>;
}
