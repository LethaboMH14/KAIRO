import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  CASES, CONTRACT, GRAVITY_M_S2, MODEL, RHO_KG_M3, SOURCE, hydraulicKw,
  initialState, replay, restore, serialize, transition, type Direction,
} from './model.ts';
import './styles.css';

const kw = (n: number) => n.toFixed(3);
const word = (d: Direction) => d === 'unchanged' ? 'stay the same' : d;
export default function PumpPowerReasoning() {
  const id = useId();
  const [state, setState] = useState(initialState);
  const [choice, setChoice] = useState('');
  const [direction, setDirection] = useState<Direction | ''>('');
  const [estimate, setEstimate] = useState('');
  const [note, setNote] = useState('');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Choose a hypothetical change, then predict before the answer appears.');
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const explanationRef = useRef<HTMLTextAreaElement>(null);
  const choiceRef = useRef<HTMLSelectElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [focusTarget, setFocusTarget] = useState<'explain' | 'predict' | 'done' | null>(null);
  const progress = replay(state.events);
  const spec = CASES[progress.round];
  const latest = progress.phase === 'explain' ? progress.attempts.at(-1) : null;
  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => {
    if (focusTarget === 'explain') explanationRef.current?.focus();
    if (focusTarget === 'predict') choiceRef.current?.focus();
    if (focusTarget === 'done') doneRef.current?.focus();
    if (focusTarget) setFocusTarget(null);
  }, [focusTarget, state]);

  function predict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!choice || !direction || !estimate.trim()) throw new Error('Select a change, direction and power estimate before revealing the result.');
      const next = transition(state, { type: 'predict', choice: Number(choice), direction, estimateKw: Number(estimate) });
      setState(next);
      setError('');
      setStatus('Prediction recorded. Compare the computed values and write an explanation.');
      setFocusTarget('explain');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Prediction was not recorded.'); }
  }
  function explain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const next = transition(state, { type: 'explain', note });
      setState(next);
      setChoice(''); setDirection(''); setEstimate(''); setNote('');
      setError('');
      const finished = replay(next.events).phase === 'done';
      setStatus(finished ? 'Both attempts recorded locally. These are not graded or authenticated.' : 'First explanation recorded. Now complete the independent second round.');
      setFocusTarget(finished ? 'done' : 'predict');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Explanation was not recorded.'); }
  }
  function restart() {
    generation.current += 1;
    setState(initialState()); setChoice(''); setDirection(''); setEstimate(''); setNote('');
    setError(''); setLoading(false); setFocusTarget('predict');
    setStatus('New local practice started. Save a file first if you want to keep earlier attempts.');
    if (fileRef.current) fileRef.current.value = '';
  }
  function exportLocal() {
    const blob = new Blob([JSON.stringify(serialize(state), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'kairo-pump-power-local-practice.json'; link.click();
    URL.revokeObjectURL(url);
    setStatus('Local file prepared. It is not an authenticated account record or a competency grade.');
  }
  async function importLocal(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const token = ++generation.current;
    setLoading(true); setError(''); setStatus('Checking selected local practice file…');
    try {
      if (file.size > 8192) throw new Error('The local practice file exceeds the 8 KiB limit.');
      const raw = await file.text();
      if (token !== generation.current) return;
      const next = restore(JSON.parse(raw) as unknown);
      setState(next); setChoice(''); setDirection(''); setEstimate(''); setNote('');
      setStatus('Local practice restored and recalculated; ownership and learner identity remain unverified.');
    } catch (cause) {
      if (token === generation.current) setError(cause instanceof Error ? cause.message : 'Could not restore this file.');
    } finally {
      if (token === generation.current) {
        setLoading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    }
  }
  function cancelImport() {
    generation.current += 1; setLoading(false); setError('');
    if (fileRef.current) fileRef.current.value = '';
    setStatus('Import cancelled; existing attempts were not changed.');
  }

  return <main className="ppr" aria-labelledby={id + '-title'}>
    <a className="ppr-skip" href={'#' + id + '-task'}>Skip to the prediction task</a>
    <header className="ppr-head">
      <p className="ppr-kicker">KAIRO Access · Engineering Studio · Hydraulic power</p>
      <h1 id={id + '-title'}>What changes the power delivered to water?</h1>
      <p><strong>Illustrative, hypothetical calculation — not instructions for operating or selecting a pump.</strong> Change one number, commit your prediction, inspect the result, and explain it twice.</p>
      <p>Concept reference: <a href={SOURCE.url} target="_blank" rel="noopener noreferrer">{SOURCE.publisher}, {SOURCE.title}</a> ({SOURCE.locator}; checked {SOURCE.checked}). The reference supports the formula, not these invented scenarios.</p>
      <p>Teaching assumptions: water density {RHO_KG_M3} kg/m³; gravity {GRAVITY_M_S2} m/s²; flow and head are treated as independent hypothetical inputs. Hydraulic power only: no shaft, motor, electrical demand, losses or equipment limits are modelled.</p>
      <p>Formula: <strong>P (kW) = density × gravity × (flow in L/s ÷ 1000) × head in m ÷ 1000</strong>. The answer remains hidden until you predict.</p>
    </header>
    <section id={id + '-task'} aria-labelledby={id + '-round'}>
      <p className="ppr-kicker">Round {progress.phase === 'done' ? 2 : progress.round + 1} of 2 · {spec.independent ? 'Independent' : 'Guided'} reasoning</p>
      <h2 id={id + '-round'}>{progress.phase === 'done' ? 'Your completed local practice' : spec.title}</h2>
      {progress.phase !== 'done' && <p>Starting example: <strong>{spec.before.flowLps} L/s</strong> of water at <strong>{spec.before.headM} m</strong> head. Only <strong>{spec.variable === 'flowLps' ? 'flow' : 'head'}</strong> changes. What happens to hydraulic power?</p>}
      {progress.phase === 'predict' && <form onSubmit={predict} noValidate>
        <label htmlFor={id + '-choice'}>Choose a new {spec.variable === 'flowLps' ? 'flow (L/s)' : 'head (m)'}</label>
        <select id={id + '-choice'} ref={choiceRef} value={choice} onChange={e => setChoice(e.target.value)} required>
          <option value="">Choose a value</option>
          {spec.choices.map(v => <option key={v} value={v}>{v} {spec.variable === 'flowLps' ? 'L/s' : 'm'}</option>)}
        </select>
        <fieldset>
          <legend>Predict the change in hydraulic power</legend>
          {(['increase', 'decrease', 'unchanged'] as const).map(d => <label className="ppr-radio" key={d}>
            <input type="radio" name={id + '-direction'} value={d} checked={direction === d} onChange={() => setDirection(d)} required />
            {d === 'unchanged' ? 'Stay the same' : d[0].toUpperCase() + d.slice(1)}
          </label>)}
        </fieldset>
        <label htmlFor={id + '-estimate'}>Predict the new hydraulic power in kW (0–10)</label>
        <input id={id + '-estimate'} type="number" min="0" max="10" step="any" inputMode="decimal" required value={estimate} onChange={e => setEstimate(e.target.value)} />
        <button className="ppr-primary" type="submit">Commit prediction and reveal calculation</button>
      </form>}
      {latest && <section className="ppr-result" aria-label="Revealed calculation">
        <h3>Recalculated teaching result</h3>
        <p>You predicted power would <strong>{word(latest.predictedDirection)}</strong>, reaching <strong>{kw(latest.estimateKw)} kW</strong>.</p>
        <p>The formula gives <strong>{kw(latest.afterKw)} kW</strong>, a {word(latest.actualDirection)} from {kw(latest.beforeKw)} kW. Direction {latest.directionMatches ? 'matched' : 'did not match'}; absolute estimate error: {kw(latest.errorKw)} kW.</p>
        <div role="group" aria-label="Result display">
          <button type="button" aria-pressed={!reading} onClick={() => setReading(false)}>2D comparison</button>
          <button type="button" aria-pressed={reading} onClick={() => setReading(true)}>Reading view</button>
        </div>
        {reading ? <dl className="ppr-data">
          <dt>Before hydraulic power</dt><dd>{kw(latest.beforeKw)} kW</dd>
          <dt>After hydraulic power</dt><dd>{kw(latest.afterKw)} kW</dd>
          <dt>Difference (after minus before)</dt><dd>{kw(latest.deltaKw)} kW</dd>
          <dt>After flow</dt><dd>{latest.after.flowLps} L/s</dd>
          <dt>After head</dt><dd>{latest.after.headM} m</dd>
        </dl> : <div className="ppr-bars" aria-label="Hydraulic power values shown numerically">
          <label>Before: {kw(latest.beforeKw)} kW<meter min="0" max="4" value={latest.beforeKw} /></label>
          <label>After: {kw(latest.afterKw)} kW<meter min="0" max="4" value={latest.afterKw} /></label>
        </div>}
        <details><summary>Inspect units and why the result changed</summary>
          <p>Flow {latest.after.flowLps} L/s equals {latest.after.flowLps / 1000} m³/s. At {latest.after.headM} m head, hydraulic power is 1000 × 9.81 × {latest.after.flowLps / 1000} × {latest.after.headM} watts, then divided by 1000 for kW.</p>
          <p>This is the water-power equation at assumed conditions, not a real operating-point calculation or a motor electricity estimate.</p>
        </details>
        <form onSubmit={explain} noValidate>
          <label htmlFor={id + '-note'}>Explain what changed and why in your own words (12–240 characters; not auto-graded)</label>
          <textarea id={id + '-note'} ref={explanationRef} minLength={12} maxLength={240} required rows={3} value={note} onChange={e => setNote(e.target.value)} />
          <p className="ppr-muted">Do not include names or private study material in local notes.</p>
          <button className="ppr-primary" type="submit">{spec.independent ? 'Record independent explanation' : 'Record explanation and try independently'}</button>
        </form>
      </section>}
      {progress.phase === 'done' && <section className="ppr-result">
        <h3 ref={doneRef} tabIndex={-1}>Two local attempts completed</h3>
        <p>These are self-reported practice inputs, not a verified learner identity, official grade or evidence of mastery.</p>
        <ol>{progress.attempts.map(a => <li key={a.caseId}><strong>{a.independent ? 'Independent' : 'Guided'}:</strong> predicted {word(a.predictedDirection)}, formula {word(a.actualDirection)}; error {kw(a.errorKw)} kW. <blockquote>{a.note}</blockquote></li>)}</ol>
      </section>}
    </section>
    <section className="ppr-save" aria-labelledby={id + '-save'}>
      <h2 id={id + '-save'}>Save and resume local practice</h2>
      <p>Export and later restore a small JSON file. Recalculation checks the action order and model version; it does <strong>not</strong> prove who completed the work or save to a KAIRO account.</p>
      <div className="ppr-actions">
        <button type="button" onClick={exportLocal} disabled={loading}>Export local practice</button>
        <label htmlFor={id + '-file'}>Restore practice JSON</label>
        <input id={id + '-file'} ref={fileRef} type="file" accept=".json,application/json" disabled={loading} onChange={importLocal} />
        {loading && <button type="button" onClick={cancelImport}>Cancel import</button>}
        <button type="button" onClick={restart}>Restart</button>
      </div>
      {error && <p className="ppr-error" role="alert">{error}</p>}
      <p role="status" aria-live="polite">{status}</p>
      <p className="ppr-muted">Practice contract {CONTRACT}; formula model {MODEL}. All examples are fictional and computed locally, without network requests.</p>
    </section>
  </main>;
}
