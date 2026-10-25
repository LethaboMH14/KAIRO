import { useId } from 'react';
import './lesson-readiness-panel.css';

export type LessonReadinessPanelProps = {
  title: string;
  objective: string;
  steps: Array<{ id: string; title: string; citationIds: string[] }>;
  sources: Array<{ id: string; title: string; locator: string }>;
  sourceState: 'reviewed' | 'changed' | 'unavailable';
  coverageWarnings: string[];
  mode: 'reading' | 'prepared-interactive';
  busy: boolean;
  error: string | null;
  onStart: () => void;
  onEdit: () => void;
  onRetry: () => void;
};

export function isLessonStartAllowed({ sourceState, busy, steps, sources }: Pick<LessonReadinessPanelProps, 'sourceState' | 'busy' | 'steps' | 'sources'>) {
  if (sourceState !== 'reviewed' || busy || steps.length === 0) return false;
  const sourceCounts = new Map<string, number>();
  for (const source of sources) sourceCounts.set(source.id, (sourceCounts.get(source.id) ?? 0) + 1);
  const stepCounts = new Map<string, number>();
  for (const step of steps) stepCounts.set(step.id, (stepCounts.get(step.id) ?? 0) + 1);
  return steps.every(step => step.id.trim() && stepCounts.get(step.id) === 1 && step.citationIds.length > 0 && step.citationIds.every(id => id.trim() && sourceCounts.get(id) === 1));
}

export function createStartHandler(canStart: boolean, busy: boolean, onStart: () => void) {
  return () => { if (canStart && !busy) onStart(); };
}

export default function LessonReadinessPanel(props: LessonReadinessPanelProps) {
  const { title, objective, steps, sources, sourceState, coverageWarnings, mode, busy, error, onStart, onEdit, onRetry } = props;
  const headingId = useId();
  const sourceIds = new Set<string>();
  const duplicateSourceIds = new Set<string>();
  for (const source of sources) {
    if (!source.id.trim() || sourceIds.has(source.id)) duplicateSourceIds.add(source.id);
    sourceIds.add(source.id);
  }
  const citationsById = new Map(sources.filter(source => source.id.trim() && !duplicateSourceIds.has(source.id)).map(source => [source.id, source]));
  const stepIds = new Set<string>();
  const duplicateStepIds = new Set<string>();
  for (const step of steps) {
    if (!step.id.trim() || stepIds.has(step.id)) duplicateStepIds.add(step.id);
    stepIds.add(step.id);
  }
  const missingSteps = steps.filter(step => duplicateStepIds.has(step.id) || !step.citationIds.length || step.citationIds.some(id => !citationsById.has(id)));
  const canStart = isLessonStartAllowed(props);
  const guarded = (callback: () => void) => () => { if (!busy) callback(); };

  return <section className="lesson-readiness" role="region" aria-labelledby={headingId}>
    <header className="lr-heading">
      <div>
        <p className="lr-kicker">Your lesson</p>
        <h1 id={headingId}>{title}</h1>
      </div>
      <p className="lr-mode">{mode === 'reading' ? 'Reading lesson' : 'Prepared interactive lesson'}</p>
    </header>

    <p className="lr-objective">{objective}</p>
    {mode === 'prepared-interactive' && <p className="lr-note">Explore the prepared activity alongside your reading.</p>}

    <section className="lr-section" aria-labelledby={`${headingId}-steps`}>
      <h2 id={`${headingId}-steps`}>What you will learn</h2>
      {steps.length ? <ol className="lr-steps">
        {steps.map((step, index) => <li key={`${step.id}-${index}`}>
          <h3>{step.title}</h3>
          {step.citationIds.length ? <ul className="lr-citations" aria-label={`Sources for ${step.title}`}>
            {step.citationIds.map((id, index) => {
              const source = citationsById.get(id);
              return <li key={`${id}-${index}`}>
                {source ? <><span>{source.title}</span><span className="lr-locator">{source.locator}</span></> : <span className="lr-missing">A source for this step is missing.</span>}
              </li>;
            })}
          </ul> : <p className="lr-missing">This step has no source yet.</p>}
        </li>)}
      </ol> : <p className="lr-missing">No lesson steps are ready yet. Edit the lesson to add one.</p>}
    </section>

    {(coverageWarnings.length > 0 || sourceState !== 'reviewed' || missingSteps.length > 0) && <section className="lr-coverage" aria-labelledby={`${headingId}-coverage`}>
      <h2 id={`${headingId}-coverage`}>Before you start</h2>
      {sourceState === 'changed' && <p>The source changed after review. Check it before starting.</p>}
      {sourceState === 'unavailable' && <p>The source is unavailable. Check it again before starting.</p>}
      {missingSteps.length > 0 && <p>Every step needs a citation from the reviewed sources.</p>}
      {coverageWarnings.map((warning, index) => <p key={index}>{warning}</p>)}
    </section>}

    {error && <p className="lr-error" role="alert">{error}</p>}
    {busy && <p className="lr-status" role="status">Starting your lesson…</p>}

    <div className="lr-actions">
      <button className="lr-primary" type="button" disabled={!canStart} onClick={createStartHandler(canStart, busy, onStart)}>
        {busy ? 'Starting…' : 'Start lesson'}
      </button>
      <button className="lr-secondary" type="button" disabled={busy} onClick={guarded(onEdit)}>Edit lesson</button>
      {sourceState !== 'reviewed' && <button className="lr-secondary" type="button" disabled={busy} onClick={guarded(onRetry)}>Check source again</button>}
    </div>
  </section>;
}
