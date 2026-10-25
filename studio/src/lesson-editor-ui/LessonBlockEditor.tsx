import React from 'react';
import type { DraftAction, DraftBlock, LessonDraft } from '../lesson-draft-core/types';
import './lesson-block-editor.css';

type Props = {
  draft: LessonDraft;
  onAction: (action: DraftAction) => void;
  busy: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// Selection offsets are ephemeral view state. The browser keeps the actual
// textarea selection; this bounded cache lets the toolbar button use it after
// receiving focus, without adding editor state to the lesson document.
const selectionOffsets = new Map<string, number>();
const rememberSelection = (id: string, offset: number) => {
  selectionOffsets.delete(id);
  selectionOffsets.set(id, Math.max(0, offset));
  while (selectionOffsets.size > 40) selectionOffsets.delete(selectionOffsets.keys().next().value as string);
};

const newBlockId = () => `block-${globalThis.crypto.randomUUID()}`;
const provenance = (origin: DraftBlock['origin']) => ({
  source: 'From source',
  generated: 'Generated draft',
  authored: 'Learner edited',
}[origin]);

export default function LessonBlockEditor({ draft, onAction, busy, selectedId, onSelect }: Props) {
  const selected = draft.blocks.find(block => block.id === selectedId) ?? null;
  const act = (action: DraftAction) => { if (!busy) onAction(action); };
  const select = (id: string) => { if (!busy) onSelect(id); };
  const canSplit = selected?.kind === 'explanation' || selected?.kind === 'worked-example';
  const split = () => {
    if (busy || !selected || !canSplit) return;
    act({ kind: 'split', id: selected.id, newId: newBlockId(), offset: selectionOffsets.get(selected.id) ?? 0 });
  };

  return <section className="lbe" aria-labelledby="lbe-heading">
    <header className="lbe__header">
      <div>
        <p className="lbe__eyebrow">LESSON STUDIO <span aria-hidden="true">/</span> EDITOR</p>
        <h2 id="lbe-heading">Shape your lesson</h2>
        <p className="lbe__intro">Edit the reading flow. Source links stay attached to their blocks.</p>
      </div>
      <span className="lbe__identity">KAIRO</span>
    </header>

    <div className="lbe__title-row">
      <label htmlFor="lbe-title">Lesson title</label>
      <input id="lbe-title" value={draft.title} maxLength={120} disabled={busy}
        onChange={event => act({ kind: 'title', title: event.currentTarget.value })} />
    </div>

    <div className="lbe__layout" role="group" aria-label="Lesson layout">
      <span className="lbe__layout-label">Reading layout</span>
      <button type="button" className={`lbe__layout-choice${draft.layout === 'reading' ? ' is-active' : ''}`}
        aria-pressed={draft.layout === 'reading'} disabled={busy} onClick={() => act({ kind: 'layout', layout: 'reading' })}>Reading</button>
      <button type="button" className={`lbe__layout-choice${draft.layout === 'split' ? ' is-active' : ''}`}
        aria-pressed={draft.layout === 'split'} disabled={busy} onClick={() => act({ kind: 'layout', layout: 'split' })}>Side by side</button>
      <button type="button" className={`lbe__layout-choice${draft.layout === 'practice' ? ' is-active' : ''}`}
        aria-pressed={draft.layout === 'practice'} disabled={busy} onClick={() => act({ kind: 'layout', layout: 'practice' })}>Practice focus</button>
    </div>

    <div className="lbe__workspace">
      <aside className="lbe__rail" aria-label="Lesson blocks">
        <div className="lbe__rail-top"><h2>Lesson blocks</h2><span>{draft.blocks.length}</span></div>
        <ol className="lbe__block-list">
          {draft.blocks.map((block, index) => <li key={block.id}>
            <button type="button" className={`lbe__block-pick${block.id === selectedId ? ' is-selected' : ''}`}
              aria-current={block.id === selectedId ? 'true' : undefined} disabled={busy}
              onClick={() => select(block.id)}>
              <span className="lbe__block-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="lbe__block-copy"><strong>{block.title || 'Untitled block'}</strong><small>{block.kind.replace('-', ' ')}</small></span>
              <span className={`lbe__origin lbe__origin--${block.origin}`}>{provenance(block.origin)}</span>
            </button>
          </li>)}
        </ol>
        <button type="button" className="lbe__add" disabled={busy}
          onClick={() => act({ kind: 'add-reflection', id: newBlockId() })}>
          <span aria-hidden="true">＋</span> Add reflection
        </button>
        <p className="lbe__rail-note">Source links are kept with each block.</p>
      </aside>

      <div className="lbe__paper-wrap">
        {selected ? <article className="lbe__paper" aria-label={`Editing ${selected.title || 'lesson block'}`}>
          <div className="lbe__paper-top">
            <div className="lbe__paper-meta"><span className="lbe__paper-index">BLOCK {String(draft.blocks.findIndex(block => block.id === selected.id) + 1).padStart(2, '0')}</span>
              <span className={`lbe__origin lbe__origin--${selected.origin}`}>{provenance(selected.origin)}</span></div>
            <span className="lbe__kind">{selected.kind.replace('-', ' ')}</span>
          </div>
          <label htmlFor="lbe-block-title">Block heading</label>
          <input id="lbe-block-title" className="lbe__block-title" value={selected.title} maxLength={120} disabled={busy}
            onChange={event => act({ kind: 'edit', id: selected.id, patch: { title: event.currentTarget.value } })} />
          <label htmlFor="lbe-block-text">{selected.kind === 'question' ? 'Question text' : 'Block text'}</label>
          {selected.kind === 'question' && <p className="lbe__locked-note">Scored questions keep their original wording and answer key. Add a reflection for your own question.</p>}
          <textarea id="lbe-block-text" className="lbe__text" value={selected.text} maxLength={2400} rows={9} disabled={busy} readOnly={selected.kind === 'question'}
            onSelect={event => rememberSelection(selected.id, event.currentTarget.selectionStart)}
            onKeyUp={event => rememberSelection(selected.id, event.currentTarget.selectionStart)}
            onClick={event => rememberSelection(selected.id, event.currentTarget.selectionStart)}
            onChange={event => { if (selected.kind === 'question') return; rememberSelection(selected.id, event.currentTarget.selectionStart); act({ kind: 'edit', id: selected.id, patch: { text: event.currentTarget.value } }); }} />
          <div className="lbe__source-links">
            <span>Source links</span>
            {selected.citationIds.length ? <ul>{selected.citationIds.map(id => <li key={id}>{id}</li>)}</ul> : <p>No source link attached</p>}
          </div>
          <div className="lbe__toolbar" role="group" aria-label="Block actions">
            <button type="button" disabled={busy || !canSplit} title={selected.kind === 'question' ? 'Questions cannot be split' : undefined} onClick={split}>Split at cursor</button>
            <span className="lbe__toolbar-spacer" />
            <button type="button" aria-label="Move block up" disabled={busy || draft.blocks.findIndex(block => block.id === selected.id) === 0}
              onClick={() => act({ kind: 'move', id: selected.id, direction: -1 })}>↑ <span>Move up</span></button>
            <button type="button" aria-label="Move block down" disabled={busy || draft.blocks.findIndex(block => block.id === selected.id) === draft.blocks.length - 1}
              onClick={() => act({ kind: 'move', id: selected.id, direction: 1 })}>↓ <span>Move down</span></button>
            <button type="button" className="lbe__delete" disabled={busy} onClick={() => act({ kind: 'remove', id: selected.id })}>Delete block</button>
          </div>
        </article> : <div className="lbe__empty" role="status"><span aria-hidden="true">✳</span><h2>No block selected</h2><p>Choose a block from the lesson list to edit it.</p></div>}
      </div>
    </div>
    {busy && <p className="lbe__busy" role="status">Updating lesson…</p>}
  </section>;
}
