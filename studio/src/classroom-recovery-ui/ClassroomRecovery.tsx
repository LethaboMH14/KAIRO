import type { ReactNode } from 'react';

export type RecoveryKind = 'loading' | 'lesson-unavailable' | 'source-changed' | 'room-unavailable' | 'storage-unavailable' | 'resume-conflict';
export type ClassroomRecoveryProps = {
  kind: RecoveryKind;
  lessonId?: string;
  sourceId?: string;
  detail?: string;
  onRetry?: () => void;
  onContinueReading?: () => void;
};

const ID = /^[a-f0-9]{24}$/;
const copy: Record<RecoveryKind, { title: string; text: string; role: 'status' | 'alert' }> = {
  loading: { title: 'Checking your lesson', text: 'Checking the saved lesson and reviewed source.', role: 'status' },
  'lesson-unavailable': { title: 'Your lesson could not open', text: 'Your earlier material has not been deliberately removed. You can try again or return to My material.', role: 'alert' },
  'source-changed': { title: 'This source has changed', text: 'The reviewed words changed. Review the current material and prepare a lesson from this version.', role: 'alert' },
  'room-unavailable': { title: 'The room could not load', text: 'You can continue with the same lesson in the reading view if it is available.', role: 'status' },
  'storage-unavailable': { title: 'Your saved place is unavailable', text: 'This device cannot read or save your place. You can keep learning in this session.', role: 'alert' },
  'resume-conflict': { title: 'Your saved place changed', text: 'Another saved place changed. Recheck it before continuing so you do not overwrite that work.', role: 'alert' },
};

const hrefFor = (base: string, param: string, id?: string) => id && ID.test(id) ? `${base}?${param}=${id}` : base;

export default function ClassroomRecovery({ kind, lessonId, sourceId, detail, onRetry, onContinueReading }: ClassroomRecoveryProps) {
  const message = copy[kind];
  const safeDetail = typeof detail === 'string' ? detail.slice(0, 500) : '';
  const actions: ReactNode[] = [];
  if (kind === 'lesson-unavailable' && onRetry) actions.push(<button className="cr-button cr-primary" key="retry" type="button" onClick={onRetry}>Try opening the lesson again</button>);
  if (kind === 'source-changed') actions.push(<a className="cr-link" key="source" href={hrefFor('/sources', 'source', sourceId)}>Review your material</a>);
  if (kind === 'room-unavailable' && onContinueReading) actions.push(<button className="cr-button cr-primary" key="reading" type="button" onClick={onContinueReading}>Continue in reading view</button>);
  if (kind === 'storage-unavailable') {
    if (onContinueReading) actions.push(<button className="cr-button cr-primary" key="reading" type="button" onClick={onContinueReading}>Continue in this session</button>);
    if (lessonId && ID.test(lessonId)) actions.push(<a className="cr-link" key="practice" href={hrefFor('/learn', 'lesson', lessonId)}>Open practice and notes</a>);
  }
  if (kind === 'resume-conflict') {
    if (onRetry) actions.push(<button className="cr-button cr-primary" key="retry" type="button" onClick={onRetry}>Check the saved place again</button>);
    if (onContinueReading) actions.push(<button className="cr-button" key="reading" type="button" onClick={onContinueReading}>Continue reading</button>);
  }
  actions.push(<a className="cr-link" key="material" href="/sources">My material</a>);
  return <section className="classroom-recovery" role={message.role}>
    <h2>{message.title}</h2>
    <p>{message.text}</p>
    {safeDetail && <p className="cr-detail">{safeDetail}</p>}
    {actions.length > 0 && <nav className="cr-actions" aria-label="Next steps">{actions}</nav>}
    <style>{` .classroom-recovery{--paper:#fffdf8;--chalk:#f5f0e6;--moss:#3e5144;--ink:#252b28;--line:#d9ddcf;box-sizing:border-box;max-width:760px;margin:1rem auto;padding:clamp(1rem,3vw,1.5rem);border:1px solid var(--line);border-left:4px solid #906044;border-radius:12px;background:var(--paper);color:var(--ink);font-family:KairoManrope,Manrope,Arial,sans-serif}.classroom-recovery h2{margin:0 0 .5rem;font-size:1.25rem}.classroom-recovery p{line-height:1.65;overflow-wrap:anywhere}.classroom-recovery .cr-detail{font-size:.9rem}.classroom-recovery .cr-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}.classroom-recovery .cr-button,.classroom-recovery .cr-link{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.65rem 1rem;border:1px solid #bbc4b5;border-radius:8px;background:var(--paper);color:var(--moss);font:inherit;font-weight:650;text-decoration:underline;text-underline-offset:.18em}.classroom-recovery .cr-primary{background:var(--moss);border-color:var(--moss);color:var(--chalk)}.classroom-recovery :focus-visible{outline:3px solid #906044;outline-offset:3px}`}</style>
  </section>;
}
