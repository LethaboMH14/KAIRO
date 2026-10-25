import type { ReactNode } from 'react';

export type LessonReadiness = {
  title: string; objective: string; chapterCount: number; questionCount: number; estimatedMinutes: number | null;
  estimateBasis: string; sourceState: 'reviewed' | 'changed' | 'unavailable'; capability: 'source-reading' | 'prepared-interactive';
  savedStep: number | null; saving: 'device' | 'session-only' | 'unavailable'; notices: string[];
};
export type LessonStartPanelProps = { summary: LessonReadiness; busy: boolean; onBeginReading: () => void; onResume?: () => void; onReviewSource: () => void; onRetry?: () => void };

export default function LessonStartPanel({ summary, busy, onBeginReading, onResume, onReviewSource, onRetry }: LessonStartPanelProps) {
  const guarded = (callback: () => void) => () => { if (!busy) callback(); };
  const validStep = Number.isInteger(summary.savedStep) && summary.savedStep !== null && summary.savedStep >= 0 && summary.savedStep < summary.chapterCount;
  const canStart = summary.sourceState === 'reviewed' && !busy;
  let action: ReactNode;
  if (summary.sourceState === 'changed') action = <button className="lp-secondary" type="button" disabled={busy} onClick={guarded(onReviewSource)}>Review the current source</button>;
  else if (summary.sourceState === 'unavailable') action = onRetry ? <button className="lp-secondary" type="button" disabled={busy} onClick={guarded(onRetry)}>Try checking the source again</button> : <p role="status">The source is unavailable. Return to your material to try again.</p>;
  else if (validStep && onResume) action = <div className="lp-actions"><button type="button" disabled={!canStart} onClick={guarded(onResume)}>{busy ? 'Opening your place…' : 'Resume lesson'}</button><button className="lp-secondary" type="button" disabled={!canStart} onClick={guarded(onBeginReading)}>Start reading from the beginning</button></div>;
  else action = <button type="button" disabled={!canStart} onClick={guarded(onBeginReading)}>{busy ? 'Preparing lesson…' : 'Begin reading'}</button>;
  const time = summary.estimatedMinutes !== null && Number.isFinite(summary.estimatedMinutes) && summary.estimatedMinutes > 0
    ? `About ${Math.ceil(summary.estimatedMinutes)} minutes to read (${summary.estimateBasis}). Practice time varies.` : 'Time varies; practice time is not included.';
  return <section className="lesson-start">
    <style>{`.lesson-start{--paper:#fffdf8;--chalk:#f5f0e6;--moss:#3e5144;--sage:#dfe6d8;--ink:#252b28;--line:#d9ddcf;box-sizing:border-box;width:100%;max-width:820px;margin:auto;padding:clamp(1rem,3vw,2rem);border:1px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink);font-family:KairoManrope,Manrope,Arial,sans-serif}.lesson-start *{box-sizing:border-box}.lesson-start img{max-width:100%}.lesson-start h1{font-size:clamp(1.5rem,3vw,2rem);line-height:1.2}.lesson-start p{line-height:1.65;overflow-wrap:anywhere}.lesson-start .lp-meta{color:#4f5c51;font-size:.92rem}.lesson-start .lp-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}.lesson-start button{min-height:44px;padding:.7rem 1rem;border:1px solid var(--moss);border-radius:8px;background:var(--moss);color:var(--paper);font:inherit;font-weight:650;cursor:pointer}.lesson-start button.lp-secondary{background:var(--paper);color:var(--moss)}.lesson-start button:disabled{opacity:.65;cursor:wait}.lesson-start :focus-visible{outline:3px solid #906044;outline-offset:3px}`}</style>
    <h1>{summary.title}</h1><p>{summary.objective}</p>
    <p className="lp-meta">{summary.chapterCount} chapters · {summary.questionCount} checks · {time}</p>
    <p>{summary.capability === 'source-reading' ? 'Reading lesson' : 'Prepared interactive lesson'} · {summary.sourceState === 'reviewed' ? 'Reviewed source' : summary.sourceState === 'changed' ? 'Source changed' : 'Source unavailable'}</p>
    {summary.saving === 'device' ? <p className="lp-meta">Progress can be saved on this device.</p> : summary.saving === 'session-only' ? <p className="lp-meta">Your place stays in this session only.</p> : <p className="lp-meta">Saving is unavailable. Download your work before leaving if that option is available.</p>}
    {summary.notices.map((notice, index) => <p className="lp-meta" key={index}>{notice}</p>)}
    {action}
  </section>;
}
