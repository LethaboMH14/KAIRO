import { useId } from 'react';
import './studio-context-panel.css';

export type StudioContextPanelProps = {
  studioLabel: string;
  lessonTitle: string | null;
  selectedComponent: string | null;
  variables: Array<{ id: string; label: string; value: string }>;
  citations: Array<{ id: string; title: string; locator: string }>;
  contextState: 'current' | 'changed' | 'unavailable';
  busy: boolean;
  onAsk: () => void;
  onOpenLesson: () => void;
};

/** Read-only summary of the context available to KAIRO. It never speaks or asks on its own. */
export default function StudioContextPanel(props: StudioContextPanelProps) {
  const headingId = useId();
  const sourcesId = useId();
  const canAsk = !props.busy && props.contextState === 'current' && !!props.lessonTitle && props.citations.length > 0;
  const canOpen = !props.busy && !!props.lessonTitle;
  const stateText = props.contextState === 'current' ? 'Current studio context' : props.contextState === 'changed' ? 'Studio context changed' : 'Studio context unavailable';

  return <section className="scx-panel" aria-labelledby={headingId}>
    <header className="scx-header">
      <div><p className="scx-eyebrow">KAIRO can see</p><h2 id={headingId}>{props.studioLabel}</h2></div>
      <span className={`scx-state scx-state-${props.contextState}`}>{stateText}</span>
    </header>
    <div className="scx-context">
      <h3>Lesson</h3>
      <p>{props.lessonTitle || 'No lesson selected'}</p>
    </div>
    <div className="scx-context">
      <h3>Selected part</h3>
      <p>{props.selectedComponent || 'No part selected'}</p>
      {props.variables.length > 0 && <dl className="scx-variables">{props.variables.map(item => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
    </div>
    <div className="scx-context" aria-labelledby={sourcesId}>
      <h3 id={sourcesId}>Source context</h3>
      {props.citations.length ? <ul className="scx-citations">{props.citations.map(item => <li key={item.id}><span>{item.title}</span>{item.locator && <small>{item.locator}</small>}</li>)}</ul> : <p>No source citations available</p>}
    </div>
    {props.contextState === 'changed' && <p className="scx-note">The studio has changed since this context was prepared. Refresh the lesson context before asking.</p>}
    {props.contextState === 'unavailable' && <p className="scx-note">KAIRO cannot use the studio context right now. You can still open the lesson or continue reading.</p>}
    <div className="scx-actions">
      <button type="button" disabled={!canAsk} onClick={() => { if (canAsk) props.onAsk(); }}>Ask KAIRO about this</button>
      <button type="button" className="scx-secondary" disabled={!canOpen} onClick={() => { if (canOpen) props.onOpenLesson(); }}>Open lesson</button>
    </div>
  </section>;
}
