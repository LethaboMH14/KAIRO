import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import './material-review-layout.css';

export type MaterialReviewLayoutProps = {
  title: string;
  original: ReactNode;
  reviewed: ReactNode;
  sourceRevision: string | null;
  coverageLabel: string;
  warnings: readonly string[];
  busy: boolean;
  dirty: boolean;
  canSave: boolean;
  canBuild: boolean;
  onSave: () => void;
  onBuild: () => void;
  onCancel: () => void;
};

type ReviewPane = 'original' | 'reviewed';

/** A controlled shell for caller-owned source and review content. */
export default function MaterialReviewLayout({
  title, original, reviewed, sourceRevision, coverageLabel, warnings, busy, dirty, canSave, canBuild, onSave, onBuild, onCancel,
}: MaterialReviewLayoutProps) {
  const headingId = `mrl-title-${useId()}`;
  const originalTabId = `mrl-original-tab-${useId()}`;
  const reviewTabId = `mrl-review-tab-${useId()}`;
  const originalPanelId = `mrl-original-panel-${useId()}`;
  const reviewPanelId = `mrl-review-panel-${useId()}`;
  const saveHintId = `mrl-save-hint-${useId()}`;
  const buildHintId = `mrl-build-hint-${useId()}`;
  const [activePane, setActivePane] = useState<ReviewPane>('original');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const saveDisabled = busy || !dirty || !canSave;
  const buildDisabled = busy || dirty || !canBuild;
  const saveHint = busy ? 'Wait for the current action to finish.' : !canSave ? 'Saving is unavailable for this review.' : dirty ? 'Save your review changes.' : 'There are no unsaved review changes.';
  const buildHint = busy ? 'Wait for the current action to finish.' : dirty ? 'Save your review before building a lesson.' : !canBuild ? 'A lesson cannot be built from this review yet.' : 'Build a lesson from this reviewed material.';

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, current: ReviewPane) {
    let next: ReviewPane | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = current === 'original' ? 'reviewed' : 'original';
    } else if (event.key === 'Home') next = 'original';
    else if (event.key === 'End') next = 'reviewed';
    if (!next) return;
    event.preventDefault();
    setActivePane(next);
    tabRefs.current[next === 'original' ? 0 : 1]?.focus();
  }

  return (
    <section className="mrl-workbench" aria-labelledby={headingId}>
      <header className="mrl-header">
        <div className="mrl-title-block"><p className="mrl-kicker">Review your material</p><h2 id={headingId}>{title}</h2></div>
        <details className="mrl-revision"><summary>Source revision</summary><p>{sourceRevision ?? 'No source revision supplied.'}</p></details>
      </header>

      <section className="mrl-coverage" aria-label="Review coverage">
        <span className="mrl-coverage-mark" aria-hidden="true">i</span>
        <div><h3>Coverage</h3><p>{coverageLabel}</p></div>
      </section>

      {warnings.length > 0 && <section className="mrl-warnings" role="note" aria-label="Review warnings"><h3>Check these warnings</h3><ul>{warnings.map((warning, index) => <li key={`${index}-${warning}`}>{warning}</li>)}</ul></section>}

      <div className="mrl-mobile-tabs" role="tablist" aria-label="Choose material view">
        <button ref={(node) => { tabRefs.current[0] = node; }} id={originalTabId} type="button" role="tab" aria-selected={activePane === 'original'} aria-controls={originalPanelId} tabIndex={activePane === 'original' ? 0 : -1} onClick={() => setActivePane('original')} onKeyDown={(event) => moveTab(event, 'original')}>Original</button>
        <button ref={(node) => { tabRefs.current[1] = node; }} id={reviewTabId} type="button" role="tab" aria-selected={activePane === 'reviewed'} aria-controls={reviewPanelId} tabIndex={activePane === 'reviewed' ? 0 : -1} onClick={() => setActivePane('reviewed')} onKeyDown={(event) => moveTab(event, 'reviewed')}>Review</button>
      </div>

      <div className="mrl-panes">
        <section className="mrl-pane" data-pane="original" data-active={activePane === 'original'} id={originalPanelId} role="tabpanel" aria-labelledby={originalTabId} tabIndex={0}>
          <h3 className="mrl-pane-title">Original</h3>
          <div className="mrl-slot">{original ?? <p className="mrl-empty-original">Original preview is not available here. You can still review the extracted material shown alongside it.</p>}</div>
        </section>
        <section className="mrl-pane" data-pane="reviewed" data-active={activePane === 'reviewed'} id={reviewPanelId} role="tabpanel" aria-labelledby={reviewTabId} tabIndex={0}>
          <h3 className="mrl-pane-title">Review extracted text</h3><div className="mrl-slot mrl-slot--reviewed">{reviewed}</div>
        </section>
      </div>

      <footer className="mrl-footer">
        <div className="mrl-action-hints" aria-live="polite">{busy && <p className="mrl-busy" role="status">A review action is in progress.</p>}<p id={saveHintId} className="mrl-action-hint">{saveHint}</p><p id={buildHintId} className="mrl-action-hint">{buildHint}</p></div>
        <div className="mrl-actions" aria-label="Review actions">
          <button className="mrl-button mrl-button--quiet" type="button" onClick={onCancel}>Cancel</button>
          <button className="mrl-button mrl-button--secondary" type="button" disabled={saveDisabled} aria-describedby={saveHintId} onClick={onSave}>Save review</button>
          <button className="mrl-button mrl-button--primary" type="button" disabled={buildDisabled} aria-describedby={buildHintId} onClick={onBuild}>Build lesson</button>
        </div>
      </footer>
    </section>
  );
}

