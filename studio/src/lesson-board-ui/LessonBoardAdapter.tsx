import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LessonBoardSaveResult, LessonBoardSurface, LessonBoardV1, SourceAnchorByElementId } from './types';
import { validateLessonBoard, validateSourceAnchors } from './validateBoard';
import './lesson-board.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export type LessonBoardAdapterProps = {
  board: unknown;
  sourceAnchorByElementId: unknown;
  Surface: LessonBoardSurface;
  onElementSelect?: (elementId: string) => void;
  onSave?: (nextBoard: LessonBoardV1) => Promise<LessonBoardSaveResult>;
  readingContent?: ReactNode;
};

export function LessonBoardAdapter({ board: rawBoard, sourceAnchorByElementId: rawAnchors, Surface, onElementSelect, onSave, readingContent }: LessonBoardAdapterProps) {
  const parsedBoard = useMemo(() => validateLessonBoard(rawBoard), [rawBoard]);
  const parsedAnchors = useMemo(() => validateSourceAnchors(rawAnchors), [rawAnchors]);
  const [draft, setDraft] = useState<LessonBoardV1 | null>(null);
  const [activeSlideId, setActiveSlideId] = useState('');
  const [selectedElementId, setSelectedElementId] = useState(parsedBoard.ok ? parsedBoard.value.slides[0]?.elements[0]?.id ?? '' : '');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [mode, setMode] = useState<'read' | 'board'>('board');
  const saveAttempt = useRef(0);
  const draftVersion = useRef(0);
  const context = useRef<{ board: LessonBoardV1 | null; anchors: SourceAnchorByElementId | null }>({ board: null, anchors: null });
  const draftContext = useRef(context.current);
  const currentBoardForContext = parsedBoard.ok ? parsedBoard.value : null;
  const currentAnchorsForContext = parsedAnchors.ok ? parsedAnchors.value : null;
  if (context.current.board !== currentBoardForContext || context.current.anchors !== currentAnchorsForContext) {
    // Fence pending save completions during render, before the reset effect runs.
    saveAttempt.current += 1;
    draftVersion.current += 1;
    context.current = { board: currentBoardForContext, anchors: currentAnchorsForContext };
  }

  useEffect(() => {
    saveAttempt.current += 1;
    draftVersion.current += 1;
    setDraft(null);
    setActiveSlideId('');
    setSelectedElementId(parsedBoard.ok ? parsedBoard.value.slides[0]?.elements[0]?.id ?? '' : '');
    setSaveState('idle');
    setSaveError('');
  }, [parsedBoard, parsedAnchors]);

  if (!parsedBoard.ok) return <section className="kairo-board-error" role="status">{parsedBoard.reason} <div>{readingContent}</div></section>;
  if (!parsedAnchors.ok) return <section className="kairo-board-error" role="status">{parsedAnchors.reason} <div>{readingContent}</div></section>;

  const currentBoard = parsedBoard.value;
  const currentDraft = draftContext.current === context.current ? draft : null;
  const board = currentDraft ?? currentBoard;
  const anchors: SourceAnchorByElementId = parsedAnchors.value;
  const activeId = board.slides.some((slide) => slide.id === activeSlideId) ? activeSlideId : board.slides[0].id;
  const selectedAnchor = Object.hasOwn(anchors, selectedElementId) ? anchors[selectedElementId] : undefined;
  const dirty = currentDraft !== null;

  function acceptSurfaceChange(next: unknown) {
    const validated = validateLessonBoard(next);
    if (!validated.ok || validated.value.lessonRevision !== currentBoard.lessonRevision) {
      setSaveError(validated.ok ? 'The source revision changed. Reload this lesson before saving.' : validated.reason);
      setSaveState('error');
      return;
    }
    // An older save may still finish, but it must not change this draft's state.
    saveAttempt.current += 1;
    draftVersion.current += 1;
    draftContext.current = context.current;
    setDraft(validated.value);
    setSaveError('');
    setSaveState('idle');
  }

  async function saveDraft() {
    if (!onSave || !currentDraft || saveState === 'saving') return;
    const attempt = ++saveAttempt.current;
    const version = draftVersion.current;
    const saveContext = context.current;
    const savingDraft = currentDraft;
    setSaveState('saving');
    setSaveError('');
    try {
      const result = await onSave(savingDraft);
      if (attempt !== saveAttempt.current || saveContext !== context.current) return;
      if (!result.ok) throw new Error(result.message || 'Your changes could not be saved.');
      if (version !== draftVersion.current) {
        setSaveError('A newer change was made while saving. Save the latest changes.');
        setSaveState('error');
        return;
      }
      setDraft(null);
      setSaveState('saved');
    } catch (error) {
      if (attempt !== saveAttempt.current || saveContext !== context.current) return;
      if (version !== draftVersion.current) {
        setSaveError('A newer change was made while saving. Save the latest changes.');
        setSaveState('error');
        return;
      }
      setSaveError(error instanceof Error ? error.message : 'Your changes could not be saved.');
      setSaveState('error');
    }
  }

  function selectElement(elementId: string) {
    const knownElement = board.slides.some((slide) => slide.id === elementId || slide.elements.some((element) => element.id === elementId));
    if (!knownElement) return;
    setSelectedElementId(elementId);
    onElementSelect?.(elementId);
  }

  return (
    <section className="kairo-board" aria-label="KAIRO lesson board">
      <header className="kairo-board__header">
        <div><p className="kairo-board__eyebrow">KAIRO · MY LESSON</p><h2>{board.title}</h2><p className="kairo-board__revision">Reviewed source · {board.lessonRevision}</p></div>
        <div className="kairo-board__tabs" role="tablist" aria-label="Lesson view">
          <button type="button" role="tab" aria-selected={mode === 'read'} onClick={() => setMode('read')}>Read</button>
          <button type="button" role="tab" aria-selected={mode === 'board'} onClick={() => setMode('board')}>Board</button>
        </div>
      </header>
      {mode === 'read' ? <div className="kairo-board__reading">{readingContent ?? <p>Reading view is available from the lesson host.</p>}</div> : (
        <>
          <nav className="kairo-board__slides" aria-label="Lesson steps">
            {board.slides.map((slide, index) => <button key={slide.id} type="button" aria-current={activeId === slide.id ? 'step' : undefined} onClick={() => { setActiveSlideId(slide.id); setSelectedElementId(slide.elements[0]?.id ?? ''); }}><span>{index + 1}</span>{slide.heading}</button>)}
          </nav>
          <div className="kairo-board__body">
            <div className="kairo-board__surface"><Surface board={board} activeSlideId={activeId} editable={Boolean(onSave)} onChange={acceptSurfaceChange} onElementSelect={selectElement} /></div>
            <aside className="kairo-board__source" aria-live="polite" aria-label="Source for selected lesson item">
              <h3>Source</h3>
              {selectedAnchor ? <><p>{selectedAnchor.label}</p><small>Revision {selectedAnchor.sourceRevision}</small>{selectedAnchor.excerpt && <blockquote>{selectedAnchor.excerpt}</blockquote>}</> : <p>Select a cited item to see its source.</p>}
            </aside>
          </div>
          <footer className="kairo-board__footer">
            <p role="status">{saveState === 'saving' ? 'Saving your changes…' : saveState === 'saved' ? 'Changes saved.' : saveState === 'error' ? saveError || 'Save failed.' : dirty ? 'Unsaved changes.' : 'Your source links stay attached to their lesson items.'}</p>
            {onSave && <button type="button" className="kairo-board__save" disabled={!dirty || saveState === 'saving'} onClick={saveDraft}>{saveState === 'error' ? 'Try saving again' : saveState === 'saving' ? 'Saving…' : 'Save changes'}</button>}
          </footer>
        </>
      )}
    </section>
  );
}
