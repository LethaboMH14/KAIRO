import { useId } from 'react';
import { BookOpen, Pause, Play, Square, X } from 'lucide-react';
import type { NarrationState, TeachingCardContent } from '../kairo-interaction-contract/types';
import './studio-action-ui.css';

export type TeachingCardProps = {
  content: TeachingCardContent;
  narration: NarrationState;
  busy: boolean;
  onClose: () => void;
  onRead: () => void;
  onPause: () => void;
  onStop: () => void;
  onSource: (index: number) => void;
};

const capabilityLabels = {
  prepared: 'Prepared guidance',
  'source-linked': 'Linked to lesson sources',
  unavailable: 'Unavailable in this context',
} as const;

/** Plain-text teaching response with externally controlled narration and source links. */
export function TeachingCard({ content, narration, busy, onClose, onRead, onPause, onStop, onSource }: TeachingCardProps) {
  const titleId = useId();
  const capabilityId = useId();
  const available = content.capability !== 'unavailable';
  const invoke = (callback: () => void) => {
    if (!busy && available) callback();
  };
  return <article className="saui-teaching-card" aria-labelledby={titleId} aria-describedby={capabilityId}>
    <header className="saui-card-header">
      <div><p className="saui-eyebrow">KAIRO teaching card</p><h2 id={titleId}>{content.title}</h2></div>
      <button type="button" className="saui-icon-button" aria-label="Close teaching card" onClick={onClose}><X aria-hidden="true" size={18} /></button>
    </header>
    <p id={capabilityId} className={`saui-capability saui-capability-${content.capability}`}>{capabilityLabels[content.capability]}</p>
    {available ? <p className="saui-card-body">{content.body}</p> : <p className="saui-card-body">No explanation is available for this context. You can continue with the lesson sources.</p>}
    {content.sourceLabels.length > 0 && <div className="saui-card-sources">
      <h3>Sources</h3>
      <ul>{content.sourceLabels.map((source, index) => <li key={`${source}-${index}`}><button type="button" disabled={busy} onClick={() => { if (!busy) onSource(index); }}>{source}</button></li>)}</ul>
    </div>}
    <div className="saui-narration" role="group" aria-label="Teaching card reading controls">
      <button type="button" disabled={busy || !available || narration === 'playing'} onClick={() => invoke(onRead)}>
        <Play aria-hidden="true" size={16} />{narration === 'paused' ? 'Resume reading' : 'Read aloud'}
      </button>
      <button type="button" disabled={busy || !available || narration !== 'playing'} onClick={() => invoke(onPause)}><Pause aria-hidden="true" size={16} />Pause</button>
      <button type="button" disabled={busy || !available || narration === 'stopped'} onClick={() => invoke(onStop)}><Square aria-hidden="true" size={15} />Stop</button>
    </div>
    {busy && <p className="saui-busy-note" role="status"><BookOpen aria-hidden="true" size={15} />Preparing this explanation…</p>}
  </article>;
}
