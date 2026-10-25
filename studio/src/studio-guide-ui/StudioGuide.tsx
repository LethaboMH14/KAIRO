import type { ReactNode } from 'react';
import type { CoachIntent, CoachResponse } from '../studio-coach/model';
import './studio-guide.css';

export type StudioGuideProps = {
  contextLabel: string;
  response: CoachResponse;
  speaking: boolean;
  paused: boolean;
  status: string;
  onIntent: (intent: CoachIntent) => void;
  onRead: () => void;
  onPause: () => void;
  onStop: () => void;
  onAccess: () => void;
  visual?: ReactNode;
};

const intents: Array<{ intent: CoachIntent; label: string }> = [
  { intent: 'explain', label: 'Explain' },
  { intent: 'hint', label: 'Give me a hint' },
  { intent: 'predict', label: 'Help me predict' },
  { intent: 'check', label: 'Talk through my explanation' },
];

function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** Stateless teaching presentation; media, settings, and teaching decisions stay with the host. */
export default function StudioGuide({ contextLabel, response, speaking, paused, status, onIntent, onRead, onPause, onStop, onAccess, visual }: StudioGuideProps) {
  const sources = response.sourceLinks.flatMap(source => {
    const url = safeSourceUrl(source.url);
    return url ? [{ ...source, url }] : [];
  });
  return <section className="sg-guide" aria-labelledby="sg-heading">
    <header className="sg-context">
      <span className="sg-kicker">Your studio guide</span>
      <p className="sg-context-label">{contextLabel}</p>
    </header>
    <div className="sg-teacher-row">
      <div className="sg-visual" aria-label="KAIRO visual">
        {visual ?? <div className="sg-portrait" role="img" aria-label="KAIRO portrait placeholder"><span>K</span></div>}
      </div>
      <div className="sg-teacher-copy">
        <span className="sg-kairo-name">KAIRO</span>
        <p className="sg-teacher-caption">One guide for this studio activity</p>
      </div>
    </div>
    <div className="sg-response" aria-live="polite">
      <span className="sg-authored-label">Authored studio guidance</span>
      <h2 id="sg-heading">{response.title}</h2>
      <span className="sg-caption-label">KAIRO text and captions</span>
      <p className="sg-response-text" aria-label="KAIRO caption and reading text">{response.text}</p>
      <p className="sg-prompt">{response.prompt}</p>
      <details className="sg-scope">
        <summary>About this guidance</summary>
        <p>{response.scope}</p>
      </details>
    </div>
    <div className="sg-intents" role="group" aria-label="Choose coaching help">
      {intents.map(({ intent, label }) => <button key={intent} type="button" onClick={() => onIntent(intent)}>{label}</button>)}
    </div>
    <div className="sg-controls">
      <div className="sg-speech" role="group" aria-label="KAIRO reading controls">
        <button type="button" className="sg-primary" onClick={onRead}>{speaking && paused ? 'Resume reading' : 'Read with KAIRO'}</button>
        <button type="button" onClick={onPause} disabled={!speaking} aria-pressed={speaking && paused}>{paused ? 'Resume' : 'Pause'}</button>
        <button type="button" onClick={onStop} disabled={!speaking}>Stop</button>
      </div>
      <button type="button" className="sg-access" onClick={onAccess}>Voice, language and camera options</button>
    </div>
    <p className="sg-status" role="status" aria-live="polite">{status}</p>
    <details className="sg-sources">
      <summary>Sources for this guidance ({sources.length})</summary>
      {sources.length ? <ul>{sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul> : <p>No safe source links are available for this response.</p>}
    </details>
  </section>;
}
