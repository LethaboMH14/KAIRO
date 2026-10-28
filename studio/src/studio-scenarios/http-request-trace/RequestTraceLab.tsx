import { useId, useState } from 'react';
import {
  commitAttempt, DEFAULT_SCENARIO, newSession, OUTCOME_LABELS,
  PREPARED_REFERENCE, TRACE_MODEL_VERSION, traceRequest,
} from './model';
import type { Outcome, Prediction, RequestAttempt, RequestTrace, Scenario, TraceSession } from './model';

/**
 * Standalone, accessible 2D/reading-first studio slice.
 * No router, persistence, learner upload, microphone, network or 3D dependency.
 * Any host integrating onLocalAttempt must independently authenticate/validate evidence.
 */
export type RequestTraceLabProps = {
  onLocalAttempt?: (attempt: RequestAttempt) => void;
};
type DraftPrediction = { outcome: Outcome | ''; sendsHttpRequest: '' | 'yes' | 'no'; explanation: string };
const blankPrediction = (): DraftPrediction => ({ outcome: '', sendsHttpRequest: '', explanation: '' });
function makeLocalSession(): TraceSession {
  // Practice identifiers are not authentication tokens, but should not collide after restart.
  const unique = globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return newSession(`local-${unique}`);
}

export default function RequestTraceLab({ onLocalAttempt }: RequestTraceLabProps) {
  const instanceId = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const [session, setSession] = useState<TraceSession>(makeLocalSession);
  const [scenario, setScenario] = useState<Scenario>({ ...DEFAULT_SCENARIO });
  const [draft, setDraft] = useState<DraftPrediction>(blankPrediction);
  const [trace, setTrace] = useState<RequestTrace | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('Choose a scenario, predict the result, then reveal each step.');
  const finished = session.attempts.length === 2;
  const locked = trace !== null || finished;
  const canPredict = draft.outcome !== '' && draft.sendsHttpRequest !== '' &&
    draft.explanation.trim().length >= 12 && draft.explanation.trim().length <= 500;
  const fullTrace = trace !== null && stepCount === trace.steps.length;

  function updateScenario<K extends keyof Scenario>(key: K, value: Scenario[K]) {
    setScenario(previous => ({ ...previous, [key]: value }));
    setError('');
  }
  function reveal() {
    if (!canPredict || locked) return;
    if (session.attempts.some(a => a.scenario.cache === scenario.cache &&
      a.scenario.connection === scenario.connection && a.scenario.origin === scenario.origin)) {
      setError('Change at least one scenario setting before your independent second attempt.');
      return;
    }
    try {
      setTrace(traceRequest(scenario));
      setStepCount(1);
      setNotice('Model trace revealed. Use Next step to explore each stage.');
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Cannot reveal this scenario.'); }
  }
  function record() {
    if (!fullTrace || !canPredict || draft.outcome === '' || draft.sendsHttpRequest === '') return;
    try {
      const prediction: Prediction = {
        outcome: draft.outcome,
        sendsHttpRequest: draft.sendsHttpRequest === 'yes',
        explanation: draft.explanation,
      };
      const next = commitAttempt(session, scenario, prediction, new Date().toISOString());
      setSession(next);
      setTrace(null);
      setStepCount(0);
      setDraft(blankPrediction());
      setError('');
      setNotice(next.attempts.length === 2
        ? 'Two local attempts recorded. Compare your predictions below.'
        : 'First local attempt recorded. Change a scenario setting for a different second attempt.');
      onLocalAttempt?.(next.attempts[next.attempts.length - 1]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Cannot record this attempt.');
    }
  }
  function restart() {
    setSession(makeLocalSession());
    setScenario({ ...DEFAULT_SCENARIO });
    setDraft(blankPrediction());
    setTrace(null);
    setStepCount(0);
    setError('');
    setNotice('Local practice reset. Previous attempts were not saved.');
  }
  return (
    <section aria-labelledby={`${instanceId}-heading`} style={{ maxWidth: '52rem', margin: '0 auto', padding: '1rem', lineHeight: 1.55 }}>
      <h2 id={`${instanceId}-heading`}>Computer Science Studio: follow an HTTP request</h2>
      <p>Predict what happens when a browser opens a prepared example resource. Change the cache, connection or server response, then inspect the model one step at a time. No real website is contacted.</p>
      <p><strong>Prepared educational model:</strong> {TRACE_MODEL_VERSION}. It assumes a cold HTTPS connection, no service worker, no redirects and a simple fresh-cache decision. Real browsers can reuse connections and behave differently.</p>
      <details>
        <summary>Reference concepts and source limitations</summary>
        <p>{PREPARED_REFERENCE.limitation}</p>
        <ul>{PREPARED_REFERENCE.links.map(link => (
          <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>
        ))}</ul>
        <p>This is not an authenticated lesson source, live traffic capture, professional networking diagnostic or validated learning outcome.</p>
      </details>

      <fieldset disabled={locked}>
        <legend>1. Set the request scenario</legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))', gap: '1rem' }}>
          <label htmlFor={`${instanceId}-cache`}>Local browser cache
            <select id={`${instanceId}-cache`} value={scenario.cache} onChange={event => updateScenario('cache', event.target.value as Scenario['cache'])} style={{ display: 'block', width: '100%' }}>
              <option value="empty">No reusable copy</option><option value="fresh">Fresh reusable copy</option>
            </select>
          </label>
          <label htmlFor={`${instanceId}-connection`}>Connection
            <select id={`${instanceId}-connection`} value={scenario.connection} onChange={event => updateScenario('connection', event.target.value as Scenario['connection'])} style={{ display: 'block', width: '100%' }}>
              <option value="online">Online</option><option value="offline">Offline</option>
            </select>
          </label>
          <label htmlFor={`${instanceId}-origin`}>Prepared origin behaviour
            <select id={`${instanceId}-origin`} value={scenario.origin} onChange={event => updateScenario('origin', event.target.value as Scenario['origin'])} style={{ display: 'block', width: '100%' }}>
              <option value="200">Responds HTTP 200</option><option value="503">Responds HTTP 503</option>
            </select>
          </label>
        </div>
        <p>With a fresh cache, the prepared model can reuse content even when offline. The origin setting only matters when an HTTP request is sent.</p>
      </fieldset>

      {!finished && <fieldset disabled={locked}>
        <legend>2. Predict before revealing the trace</legend>
        <label htmlFor={`${instanceId}-outcome`}>What will the browser observe?
          <select id={`${instanceId}-outcome`} value={draft.outcome} onChange={event => setDraft(old => ({ ...old, outcome: event.target.value as Outcome | '' }))} style={{ display: 'block', width: '100%' }}>
            <option value="">Choose an outcome</option>
            {Object.entries(OUTCOME_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label htmlFor={`${instanceId}-request`}>Will the browser send an HTTP request?
          <select id={`${instanceId}-request`} value={draft.sendsHttpRequest} onChange={event => setDraft(old => ({ ...old, sendsHttpRequest: event.target.value as DraftPrediction['sendsHttpRequest'] }))} style={{ display: 'block', width: '100%' }}>
            <option value="">Choose yes or no</option><option value="yes">Yes</option><option value="no">No</option>
          </select>
        </label>
        <label htmlFor={`${instanceId}-explain`}>Why do you predict that?
          <textarea id={`${instanceId}-explain`} value={draft.explanation} minLength={12} maxLength={500} rows={3}
            onChange={event => setDraft(old => ({ ...old, explanation: event.target.value }))}
            style={{ display: 'block', width: '100%', boxSizing: 'border-box' }} />
        </label>
        <p>Write 12–500 characters. Your explanation is recorded for reflection, not automatically graded as correct.</p>
        <button type="button" disabled={!canPredict} onClick={reveal}>Reveal model trace</button>
      </fieldset>}

      {trace && <section aria-labelledby={`${instanceId}-trace`}>
        <h3 id={`${instanceId}-trace`}>3. Read the trace ({stepCount} of {trace.steps.length} steps)</h3>
        <ol>{trace.steps.slice(0, stepCount).map(s => <li key={s.id}><strong>{s.title}</strong><p>{s.reading}</p></li>)}</ol>
        {!fullTrace
          ? <button type="button" onClick={() => setStepCount(n => Math.min(n + 1, trace.steps.length))}>Next step</button>
          : <div>
            <p><strong>Model result:</strong> {OUTCOME_LABELS[trace.outcome]}. HTTP request sent: {trace.sendsHttpRequest ? 'yes' : 'no'}. New HTTP status: {trace.httpStatus ?? 'none'}.</p>
            <p>{trace.explanation}</p>
            <p>Your predicted outcome was {draft.outcome === trace.outcome ? 'correct' : 'different'}; your HTTP request prediction was {String(draft.sendsHttpRequest === (trace.sendsHttpRequest ? 'yes' : 'no') ? 'correct' : 'different')}.</p>
            <button type="button" onClick={record}>Record this local attempt</button>
          </div>}
      </section>}

      <p role="status" aria-live="polite">{notice}</p>
      {error && <p role="alert">{error}</p>}
      {trace && <button type="button" onClick={() => {
        setTrace(null); setStepCount(0); setError('');
        setNotice('Trace closed. You can adjust your prediction and scenario before trying again.');
      }}>Edit scenario or prediction</button>}
      <section aria-labelledby={`${instanceId}-attempts`}>
        <h3 id={`${instanceId}-attempts`}>Your local attempts ({session.attempts.length} of 2)</h3>
        <ol>{session.attempts.map(a => <li key={a.id}>
          <strong>Round {a.id.split('-round-')[1]}:</strong> cache {a.scenario.cache}, {a.scenario.connection}, origin {a.scenario.origin}.
          <p>Predicted: {OUTCOME_LABELS[a.prediction.outcome]}; model: {OUTCOME_LABELS[a.result.outcome]}.</p>
          <p>Outcome {a.outcomeCorrect ? 'matched' : 'did not match'}; request prediction {a.requestPredictionCorrect ? 'matched' : 'did not match'}.</p>
          <p>Your reasoning: {a.prediction.explanation}</p>
          <p>Reference revision: {a.referenceRevision}. Evidence: local practice only, not saved or verified.</p>
        </li>)}</ol>
        {finished && <button type="button" onClick={restart}>Start a new local practice session</button>}
      </section>
    </section>
  );
}
