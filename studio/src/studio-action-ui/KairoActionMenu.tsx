import { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, CircleHelp, Lightbulb, Map, X } from 'lucide-react';
import type { ActionChoice, InteractionContext, KairoAction, KairoActionRequest } from '../kairo-interaction-contract/types';
import './studio-action-ui.css';

export type KairoActionMenuProps = {
  context: InteractionContext;
  actions: readonly ActionChoice<KairoAction>[];
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onRequest: (request: KairoActionRequest) => void;
};

type Draft = { contextKey: string; actionId: KairoAction | null; scopeId: string | null };

const actionIcons = {
  teach: BookOpen,
  explain: Lightbulb,
  test: CircleHelp,
  plan: Map,
} satisfies Record<KairoAction, typeof BookOpen>;

/** A controlled, source-context-aware action chooser. It never starts work itself. */
export function KairoActionMenu({ context, actions, open, busy, onOpenChange, onRequest }: KairoActionMenuProps) {
  const ids = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const submittedRef = useRef<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ contextKey: context.contextKey, actionId: null, scopeId: null });
  const current = draft.contextKey === context.contextKey ? draft : { contextKey: context.contextKey, actionId: null, scopeId: null };
  const chosenAction = actions.find(item => item.id === current.actionId && item.available);
  const chosenScope = context.scopes.find(item => item.id === current.scopeId && item.available);
  const attemptKey = chosenAction && chosenScope ? `${context.contextKey}\u0000${chosenAction.id}\u0000${chosenScope.id}` : null;
  const alreadySubmitted = attemptKey !== null && submittedRef.current === attemptKey;

  useEffect(() => {
    setDraft({ contextKey: context.contextKey, actionId: null, scopeId: null });
    submittedRef.current = null;
  }, [context.contextKey]);

  const changeOpen = (next: boolean) => {
    if (next && busy) return;
    onOpenChange(next);
  };
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
  }, [open, busy, onOpenChange]);

  const chooseAction = (action: ActionChoice<KairoAction>) => {
    if (!open || busy || !action.available) return;
    submittedRef.current = null;
    setDraft({ contextKey: context.contextKey, actionId: action.id, scopeId: null });
  };
  const chooseScope = (scopeId: string) => {
    const scope = context.scopes.find(item => item.id === scopeId);
    if (!open || busy || !chosenAction || !scope?.available) return;
    submittedRef.current = null;
    setDraft({ contextKey: context.contextKey, actionId: chosenAction.id, scopeId });
  };
  const confirm = () => {
    if (!open || busy || !chosenAction || !chosenScope || !attemptKey || alreadySubmitted) return;
    submittedRef.current = attemptKey;
    onRequest({ contextKey: context.contextKey, action: chosenAction.id, scopeId: chosenScope.id });
  };

  const panelId = `kairo-action-panel-${ids}`;
  const titleId = `kairo-action-title-${ids}`;
  const scopeTitleId = `kairo-scope-title-${ids}`;
  const suggestedScope = context.scopes.find(item => item.id === context.defaultScopeId && item.available);

  return <div className="saui-kairo-menu">
    <button ref={triggerRef} type="button" className="saui-trigger" aria-expanded={open} aria-controls={panelId} onClick={() => changeOpen(!open)}>
      <BookOpen aria-hidden="true" size={18} /> <span>Ask KAIRO</span>
    </button>
    <section id={panelId} className="saui-panel saui-kairo-panel" aria-labelledby={titleId} hidden={!open}>
      <header className="saui-panel-header">
        <div><p className="saui-eyebrow">{context.surface === 'classroom' ? 'KAIRO classroom' : 'KAIRO teaching tools'}</p><h2 id={titleId}>What would help?</h2></div>
        <button type="button" className="saui-icon-button" aria-label="Close KAIRO actions" onClick={closeAndRestore}><X aria-hidden="true" size={18} /></button>
      </header>
      <p className="saui-context-line">Using {context.selectionLabel || (context.lessonId ? 'the current lesson' : 'the selected learning context')}.</p>
      <div className="saui-choice-group" role="group" aria-label="Choose a KAIRO action">
        {actions.map((action, index) => {
          const Icon = actionIcons[action.id];
          const reasonId = `${ids}-action-reason-${index}`;
          return <div className="saui-choice-wrap" key={`${action.id}-${index}`}>
            <button type="button" className="saui-choice" aria-pressed={current.actionId === action.id && action.available} aria-describedby={!action.available && action.reason ? reasonId : undefined} disabled={busy || !action.available} onClick={() => chooseAction(action)}>
              <Icon aria-hidden="true" size={18} /><span>{action.label}</span>
            </button>
            {!action.available && action.reason && <small id={reasonId} className="saui-reason">{action.reason}</small>}
          </div>;
        })}
        {actions.length === 0 && <p className="saui-muted">No teaching actions are available here.</p>}
      </div>
      <fieldset className="saui-scopes" disabled={busy || !chosenAction}>
        <legend id={scopeTitleId}>Choose what to use</legend>
        {suggestedScope && <p className="saui-muted">Suggested: {suggestedScope.label}. Choose a scope to continue.</p>}
        <div className="saui-scope-list" aria-labelledby={scopeTitleId}>
          {context.scopes.map((scope, index) => {
            const reasonId = `${ids}-scope-reason-${index}`;
            return <div className="saui-choice-wrap" key={`${scope.id}-${index}`}>
              <button type="button" className="saui-scope" aria-pressed={current.scopeId === scope.id && scope.available} aria-describedby={!scope.available && scope.reason ? reasonId : undefined} disabled={busy || !chosenAction || !scope.available} onClick={() => chooseScope(scope.id)}>
                <span>{scope.label}</span>{scope.kind === 'selection' && <small>Selected part</small>}
              </button>
              {!scope.available && scope.reason && <small id={reasonId} className="saui-reason">{scope.reason}</small>}
            </div>;
          })}
          {context.scopes.length === 0 && <p className="saui-muted">No grounded scope is available.</p>}
        </div>
      </fieldset>
      <footer className="saui-confirm-row">
        <p className="saui-muted">KAIRO will use this context and scope. Review sources in the lesson.</p>
        <button type="button" className="saui-primary" disabled={busy || !chosenAction || !chosenScope || alreadySubmitted} onClick={confirm}>
          {busy ? 'Preparing…' : alreadySubmitted ? 'Request sent' : 'Continue with KAIRO'}
        </button>
      </footer>
    </section>
  </div>;
}
