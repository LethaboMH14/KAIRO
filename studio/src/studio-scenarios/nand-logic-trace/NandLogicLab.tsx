import { useId, useState } from 'react';
import { CIRCUITS, SOURCE, newSession, submitPrediction } from './model.mjs';
import type { Attempt, Bit, Inputs, Session, TraceStep } from './model.mjs';

export type NandLogicLabProps = { onLocalAttempt?: (attempt: Attempt) => void };
const choices: readonly Bit[] = [0, 1];
const labelFor = (v: Bit) => v === 1 ? '1 — true' : '0 — false';
const selectStyle = { fontSize: '1rem', padding: '0.4rem', maxWidth: '100%' } as const;
const initialInputs: Inputs = { a: 1, b: 0, sel: 1 };

/** Reading-first interactive learner task. No login, remote calls, storage or real hardware control. */
export default function NandLogicLab({ onLocalAttempt }: NandLogicLabProps) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [circuitId, setCircuitId] = useState('xor');
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [prediction, setPrediction] = useState<Bit | null>(null);
  const [session, setSession] = useState<Session>(newSession);
  const [last, setLast] = useState<{ attempt: Attempt; trace: readonly TraceStep[] } | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [error, setError] = useState('');
  const circuit = CIRCUITS.find(c => c.id === circuitId) ?? CIRCUITS[0];
  const finished = session.attempts.length >= 2;

  function changeInput(name: keyof Inputs, value: Bit) {
    setInputs(current => ({ ...current, [name]: value }));
    setPrediction(null);
    setError('');
  }
  function commit() {
    if (prediction === null || finished) return;
    try {
      const result = submitPrediction(session, { circuitId, inputs, prediction });
      setSession(result.session);
      setLast({ attempt: result.attempt, trace: result.trace });
      setVisibleSteps(0);
      setPrediction(null);
      setError('');
      onLocalAttempt?.(result.attempt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The prepared circuit could not be evaluated.');
    }
  }
  function reset() {
    setSession(newSession()); setLast(null); setVisibleSteps(0); setPrediction(null); setError('');
  }
  return (
    <section aria-labelledby={prefix + '-title'} style={{ maxWidth: 780, margin: '0 auto', padding: '1rem', color: '#172534', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
      <h1 id={prefix + '-title'}>KAIRO Computer Science Studio — NAND circuit challenge</h1>
      <p>Change the input bits, predict the final output, then inspect how each NAND gate computes it. Every gate returns 0 only when <strong>both</strong> its inputs are 1.</p>
      <p><strong>Prepared concept:</strong> <a href={SOURCE.url} target="_blank" rel="noopener noreferrer">{SOURCE.title}</a>.
        {' '}Concept revision: {SOURCE.conceptRevision}; simulation revision: {SOURCE.modelRevision}.
        {' '}This is an illustrative digital-logic exercise, not a circuit timing or physical safety simulator.</p>
      <p><strong>Privacy and progress:</strong> predictions stay in this page's memory only. They are <strong>not</strong> authenticated, uploaded, graded by a teacher or saved to your KAIRO account.</p>
      <p aria-live="polite">Attempt {Math.min(session.attempts.length + 1, 2)} of 2; completed {session.attempts.length} distinct local attempts.</p>
      <fieldset disabled={finished} style={{ marginBlock: '1rem' }}>
        <legend><strong>Step 1 — Choose a circuit and change its input bits</strong></legend>
        <label htmlFor={prefix + '-circuit'}>NAND-built circuit</label>{' '}
        <select id={prefix + '-circuit'} style={selectStyle} value={circuitId}
          onChange={event => { setCircuitId(event.target.value); setPrediction(null); setError(''); }}>
          {CIRCUITS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <p>{circuit.description}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {(['a', 'b', 'sel'] as const).map(name => (
            <label key={name} htmlFor={prefix + '-' + name}>
              {name === 'sel' ? 'Select' : name.toUpperCase()}{' '}
              <select id={prefix + '-' + name} value={inputs[name]} style={selectStyle}
                onChange={event => changeInput(name, Number(event.target.value) as Bit)}>
                {choices.map(bit => <option key={bit} value={bit}>{labelFor(bit)}</option>)}
              </select>
            </label>
          ))}
        </div>
        <p>Inputs: A={inputs.a}, B={inputs.b}, select={inputs.sel}. The select bit matters only for MUX.</p>
      </fieldset>
      <fieldset disabled={finished} style={{ marginBlock: '1rem' }}>
        <legend><strong>Step 2 — Predict before revealing the gate outputs</strong></legend>
        {choices.map(bit => (
          <label key={bit} style={{ display: 'inline-block', marginRight: '1.5rem', paddingBlock: '.3rem' }}>
            <input type="radio" name={prefix + '-prediction'} value={bit} checked={prediction === bit}
              onChange={() => setPrediction(bit)} /> Final output {bit}
          </label>
        ))}
        <div><button type="button" disabled={prediction === null || finished} onClick={commit} style={{ padding: '.55rem .8rem', marginTop: '.5rem' }}>
          Lock prediction and compare
        </button></div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {last && (
        <section aria-labelledby={prefix + '-result'} style={{ border: '2px solid #5a7285', padding: '1rem' }}>
          <h2 id={prefix + '-result'}>Step 3 — Review your most recent attempt</h2>
          <p aria-live="polite">Your prediction: <strong>{last.attempt.prediction}</strong>. Calculated output: <strong>{last.attempt.observed}</strong>.
            {' '}{last.attempt.correct ? 'Your prediction matched.' : 'Your prediction differed; follow the gate steps to find why.'}</p>
          <p>Recorded locally as {last.attempt.id} ({last.attempt.verification}). This result is not account evidence.</p>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <caption>Ordered NAND gate trace; reveal one gate at a time</caption>
            <thead><tr><th scope="col">Gate</th><th scope="col">Left input</th><th scope="col">Right input</th><th scope="col">NAND output</th></tr></thead>
            <tbody>{last.trace.slice(0, visibleSteps).map(step => (
              <tr key={step.gate}><th scope="row">{step.gate}</th>
                <td>{step.leftSignal} = {step.left}</td><td>{step.rightSignal} = {step.right}</td>
                <td>{step.output}</td></tr>
            ))}</tbody>
          </table>
          {visibleSteps < last.trace.length
            ? <button type="button" onClick={() => setVisibleSteps(n => Math.min(n + 1, last.trace.length))}>
                Reveal next gate ({visibleSteps + 1} of {last.trace.length})
              </button>
            : <p role="status">All {last.trace.length} NAND gates reviewed. The final gate output is {last.attempt.observed}.</p>}
        </section>
      )}
      {session.attempts.length > 0 && (
        <section aria-labelledby={prefix + '-history'}>
          <h2 id={prefix + '-history'}>Local attempt history</h2>
          <ol>{session.attempts.map(a => <li key={a.id}>{CIRCUITS.find(c => c.id === a.circuitId)?.name}: A={a.inputs.a}, B={a.inputs.b}, select={a.inputs.sel};
            predicted {a.prediction}, calculated {a.observed} ({a.correct ? 'match' : 'different'}). Local-unverified.</li>)}</ol>
        </section>
      )}
      {finished && <p role="status">Two distinct attempts complete. You may start a new local round; no progress was uploaded.</p>}
      <button type="button" onClick={reset} style={{ padding: '.5rem .8rem', marginTop: '.75rem' }}>Start a new local two-attempt round</button>
    </section>
  );
}
