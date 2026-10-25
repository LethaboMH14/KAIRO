/**
 * Optional focus recovery for the two-round pump challenge.
 *
 * The caller passes ONLY its own `.pw-task` section after React has rendered
 * the new phase. This helper never queries the global document or adds listeners.
 * It is not wired into the #55 component until that owner accepts the contract.
 */
const PHASE_TARGETS = Object.freeze({
  predict: 'input[type="radio"]',
  explain: 'textarea',
  done: 'h2',
});

/** Return true only when a phase transition moved keyboard focus. */
export function focusAfterPumpPhaseChange(taskRoot, previousPhase, nextPhase) {
  if (!taskRoot || typeof taskRoot.querySelector !== 'function'
    || !Object.hasOwn(PHASE_TARGETS, previousPhase)
    || !Object.hasOwn(PHASE_TARGETS, nextPhase)
    || previousPhase === nextPhase) return false;

  const doc = taskRoot.ownerDocument;
  const active = doc?.activeElement;
  // Respect focus that the learner has already moved outside this challenge.
  if (active && active !== doc.body && !taskRoot.contains?.(active)) return false;

  const target = taskRoot.querySelector(PHASE_TARGETS[nextPhase]);
  if (!target || typeof target.focus !== 'function'
    || target.isConnected === false || target.disabled
    || target.getAttribute?.('aria-disabled') === 'true'
    || target.closest?.('[hidden], [inert], [aria-hidden="true"]')) return false;

  // The completion heading is a temporary programmatic focus target, not a
  // permanent extra Tab stop. Leave existing author-supplied tabindex intact.
  if (nextPhase === 'done' && !target.hasAttribute?.('tabindex')) {
    target.setAttribute?.('tabindex', '-1');
  }
  target.focus();
  return doc?.activeElement === target;
}
