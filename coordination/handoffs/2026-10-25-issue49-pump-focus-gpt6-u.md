# Issue #49 — optional pump challenge phase-focus recovery helper

Date: 25 October 2026, ~21:04 SAST.
Session: `gpt6-kairo-pump-focus-20261025-2104-u` (ChatGPT GPT-6, effort unknown).
Branch: `worker/issue49-pump-focus-20261025-u`; base: `main@1997ba9f046f6d4122169cb26a72e89cc60befd1`.
Remote scope proposal: https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6401890333

## Need and judgement
Product / Usability / Impact: the two-round pump what-if task in draft #55 changes form controls on prediction and explanation transitions. Independent coordinator review found that the focused submit control unmounts without an explicit focus destination. This opt-in helper provides a bounded focus destination for the owner to integrate; it does **not** change the #55 component or claim to fix the mounted UI.

## Exact new paths
- `studio/src/studio-scenarios/pump-phase-focus-20261025/focus.mjs`
- `studio/tests/pump-phase-focus-20261025.test.mjs`
- This unique handoff.

No router, shared CSS, model/physics, PR #55's component/test, global configuration, package/lockfile, character, cloud, Kaggle or other active PR paths were modified. Canonical owner's local SQLite bus is not remotely readable; the GitHub issue comment is cooperative, not an atomic local claim.

## Behaviour
`focusAfterPumpPhaseChange(taskRoot, previousPhase, nextPhase)` operates only within the caller-provided `.pw-task` section. It selects the first radio for the next prediction, the textarea for explanation, or the completion heading with a temporary `tabindex=-1`. It returns false without moving focus when phase is unchanged/unknown, the target is missing, disconnected, hidden, inert or disabled, or focus has moved outside the task. No document-wide selectors, listeners, timers, network calls, or learner data.

## Owner integration proposal (not applied)
In #55's `PumpWhatIf.tsx`, the owner may add `ref={taskRef}` to the existing `.pw-task` section and invoke the helper in a React effect **after the phase changes and new DOM has committed**, tracking the previous phase in a ref. The owner must review how restored progress, cancellation, visual/reading switches and React Strict Mode affect focus. This should not be wired through the shared router or schema. A subsequent human/device test must verify keyboard sequence, announcements, screen readers, and 200% zoom.

## Tests and evidence
- Local isolated Node 22.16 `node --test` on the exact helper and test code: **8 passed, 0 failed**; this used fake DOM elements, **not** a real browser.
- Exact-head GitHub Actions Node 24 full suite and production build: **PENDING** at initial commit; update the issue with the observed run and SHA. Do not report as passed before inspection.
- Human keyboard, screen reader, mobile and visual screenshots: **NOT RUN**.
- No Kaggle authentication or hosted training was attempted.

## Next two dependency-ready tasks
1. #55 owner independently reviews and, if accepted, integrates the focus helper into the real pump component; add real DOM/keyboard regression evidence.
2. Independent authorised browser/device acceptance of focus transitions, restore, cancellation and reading view before any learner-facing merge. All merges require PR #34 conditional policy and separate review.
