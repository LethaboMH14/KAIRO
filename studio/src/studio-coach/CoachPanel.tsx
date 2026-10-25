import type { CoachIntent, CoachResponse } from './model';
import './studio-coach.css';

export type CoachPanelProps = {
  response: CoachResponse;
  speaking: boolean;
  paused: boolean;
  status: string;
  onIntent(intent: CoachIntent): void;
  onRead(): void;
  onPause(): void;
  onStop(): void;
};

/** Stateless accessible controls; speech state and timing belong to the shared teacher provider. */
export default function CoachPanel({ response, speaking, paused, status, onIntent, onRead, onPause, onStop }: CoachPanelProps) {
  return <section className="sc-panel" aria-labelledby="sc-title">
    <div className="sc-heading"><span className="sc-kicker">Learn with KAIRO</span><h2 id="sc-title">{response.title}</h2></div>
    <p className="sc-copy">{response.text}</p>
    <p className="sc-prompt">{response.prompt}</p>
    <p className="sc-scope">{response.scope}</p>
    <div className="sc-intents" aria-label="Choose coaching help">
      <button type="button" onClick={() => onIntent('explain')}>Explain</button>
      <button type="button" onClick={() => onIntent('hint')}>Give me a hint</button>
      <button type="button" onClick={() => onIntent('predict')}>Help me predict</button>
      <button type="button" onClick={() => onIntent('check')}>Talk through my explanation</button>
    </div>
    <div className="sc-speech" aria-label="KAIRO narration controls">
      <button type="button" onClick={onRead}>{speaking && paused ? 'Resume KAIRO' : speaking ? 'Reading' : 'Read with KAIRO'}</button>
      <button type="button" onClick={onPause} disabled={!speaking} aria-pressed={speaking && paused}>{paused ? 'Resume' : 'Pause'}</button>
      <button type="button" onClick={onStop} disabled={!speaking}>Stop</button>
      <span role="status" aria-live="polite">{status}</span>
    </div>
    <ul className="sc-sources" aria-label="Sources">
      {response.sourceLinks.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target={source.url.startsWith('https://') ? '_blank' : undefined} rel={source.url.startsWith('https://') ? 'noreferrer' : undefined}>{source.title}</a></li>)}
    </ul>
  </section>;
}
