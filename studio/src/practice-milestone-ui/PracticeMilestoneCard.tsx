import type { ReactNode } from 'react';

export type PracticeAttempt = { id: string; topicLabel: string; sourceRevision: string; outcome: 'correct' | 'needs-review' | 'unscored'; assistance: 'none' | 'hint' | 'worked-example' | 'unknown'; recordedAt: string };
export type PracticeProgression = { completed: number; total: number };
export type PracticeMilestoneCardProps = {
  attempt: PracticeAttempt;
  progression: PracticeProgression | null;
  busy: boolean;
  onKeepWork?: () => void;
  onReviewSource?: () => void;
};

function validProgression(value: PracticeProgression | null): value is PracticeProgression {
  return !!value && Number.isFinite(value.completed) && Number.isInteger(value.completed) && value.completed >= 0 &&
    Number.isFinite(value.total) && Number.isInteger(value.total) && value.total > 0 && value.completed <= value.total;
}
function dateLabel(value: string): string {
  if (typeof value !== 'string' || !value || !Number.isFinite(Date.parse(value))) return 'Time not available';
  return value;
}

export default function PracticeMilestoneCard({ attempt, progression, busy, onKeepWork, onReviewSource }: PracticeMilestoneCardProps) {
  const guarded = (callback: (() => void) | undefined) => () => { if (!busy) callback?.(); };
  const correct = attempt.outcome === 'correct';
  const outcome = correct ? 'Correct answer' : attempt.outcome === 'needs-review' ? 'Needs another look' : 'Reflection only · not scored';
  const assistance = attempt.assistance === 'none' ? 'No help used for this attempt.' : attempt.assistance === 'hint' ? 'A hint was used.' : attempt.assistance === 'worked-example' ? 'A worked example was used.' : 'Help used is unknown.';
  const actions: ReactNode[] = [];
  if (onKeepWork) actions.push(<button className="pm-primary" type="button" disabled={busy} onClick={guarded(onKeepWork)} key="keep">{busy ? 'Working…' : 'Keep my work'}</button>);
  if (onReviewSource) actions.push(<button type="button" disabled={busy} onClick={guarded(onReviewSource)} key="review">Review the source</button>);
  return <article className="practice-milestone" aria-label="Practice record">
    <style>{`.practice-milestone{--paper:#fffdf8;--chalk:#f5f0e6;--moss:#3e5144;--sage:#dfe6d8;--ink:#252b28;--line:#d9ddcf;box-sizing:border-box;width:100%;max-width:720px;margin:1rem auto;padding:clamp(1rem,3vw,1.5rem);border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink);font-family:KairoManrope,Manrope,Arial,sans-serif}.practice-milestone *{box-sizing:border-box}.practice-milestone .pm-heading{display:flex;align-items:center;gap:.75rem}.practice-milestone .pm-star{display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--sage);color:var(--moss);font-size:1.25rem}.practice-milestone h2{margin:.25rem 0;font-size:1.2rem}.practice-milestone p{line-height:1.6;overflow-wrap:anywhere}.practice-milestone .pm-meta{color:#4f5c51;font-size:.9rem}.practice-milestone .pm-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}.practice-milestone button{min-height:44px;padding:.65rem .95rem;border:1px solid var(--moss);border-radius:8px;background:var(--paper);color:var(--moss);font:inherit;font-weight:650;cursor:pointer}.practice-milestone button.pm-primary{background:var(--moss);color:var(--paper)}.practice-milestone button:disabled{opacity:.65;cursor:wait}.practice-milestone :focus-visible{outline:3px solid #906044;outline-offset:3px}`}</style>
    <div className="pm-heading"><span className="pm-star" aria-hidden="true">✦</span><div><p className="pm-meta">Practice record</p><h2>{attempt.topicLabel}</h2></div></div>
    <p>{outcome}{correct && (attempt.assistance === 'hint' || attempt.assistance === 'worked-example') ? ' · Help was used' : ''}</p>
    <p>{assistance}</p>
    <p className="pm-meta">Source revision: {attempt.sourceRevision || 'Not available'}</p>
    <p className="pm-meta">Recorded: <time>{dateLabel(attempt.recordedAt)}</time></p>
    {validProgression(progression) && <p className="pm-meta">{progression.completed} of {progression.total} activities recorded. This counts activities, not skill.</p>}
    <p className="pm-meta">This is a practice record, not a certificate or verified work skill.</p>
    {actions.length > 0 && <div className="pm-actions">{actions}</div>}
  </article>;
}
