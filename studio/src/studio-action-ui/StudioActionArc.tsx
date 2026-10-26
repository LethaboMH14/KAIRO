import { useEffect, useId, useRef } from 'react';
import { BookOpen, CircleHelp, Eye, FileText, Lightbulb, Wrench, X } from 'lucide-react';
import type { ActionChoice, StudioAction } from '../kairo-interaction-contract/types';
import './studio-action-ui.css';

export type StudioActionArcProps = {
  actions: readonly ActionChoice<StudioAction>[];
  open: boolean;
  label: string;
  onOpenChange: (open: boolean) => void;
  onChoose: (action: StudioAction) => void;
};

const studioIcons = {
  explain: Lightbulb,
  inside: Eye,
  try: Wrench,
  practise: CircleHelp,
  source: FileText,
} satisfies Record<StudioAction, typeof BookOpen>;

/** A bounded shortcut arc; every action remains labelled and usable as a list. */
export function StudioActionArc({ actions, open, label, onOpenChange, onChoose }: StudioActionArcProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const visibleActions = actions.slice(0, 5);
  const changeOpen = (next: boolean) => onOpenChange(next);
  const closeAndRestore = () => {
    if (!open) return;
    changeOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeAndRestore();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const choose = (choice: ActionChoice<StudioAction>) => {
    if (!open || !choice.available) return;
    onChoose(choice.id);
    changeOpen(false);
  };

  return <div className="saui-studio-arc">
    <button ref={triggerRef} type="button" className="saui-trigger" aria-expanded={open} aria-controls={`studio-action-panel-${id}`} onClick={() => changeOpen(!open)}>
      <BookOpen aria-hidden="true" size={18} /><span>{label}</span>
    </button>
    <section id={`studio-action-panel-${id}`} className="saui-panel saui-arc-panel" aria-label={`${label} actions`} hidden={!open}>
      <header className="saui-panel-header">
        <div><p className="saui-eyebrow">Selected studio context</p><h2>{label}</h2></div>
        <button type="button" className="saui-icon-button" aria-label="Close studio actions" onClick={closeAndRestore}><X aria-hidden="true" size={18} /></button>
      </header>
      <ul className="saui-arc-list">
        {visibleActions.map((choice, index) => {
          const Icon = studioIcons[choice.id];
          const reasonId = `${id}-studio-reason-${index}`;
          return <li className="saui-arc-item" key={`${choice.id}-${index}`}>
            <button type="button" className="saui-studio-choice" disabled={!choice.available} aria-describedby={!choice.available && choice.reason ? reasonId : undefined} onClick={() => choose(choice)}>
              <Icon aria-hidden="true" size={18} /><span>{choice.label}</span>
            </button>
            {!choice.available && choice.reason && <small id={reasonId} className="saui-reason">{choice.reason}</small>}
          </li>;
        })}
        {visibleActions.length === 0 && <li className="saui-muted">No studio actions are available here.</li>}
      </ul>
      {actions.length > visibleActions.length && <p className="saui-muted">Showing the first five actions. More tools belong in the labelled studio list.</p>}
      <p className="saui-mobile-hint">Choose a labelled action. These controls also work without touch gestures.</p>
    </section>
  </div>;
}
