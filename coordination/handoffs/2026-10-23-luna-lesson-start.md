# KAIRO lesson start panel — bounded handoff

Date: 2026-10-23. Bus identity `codex-luna-lesson-start-20261023-e`; client Codex, model `gpt-6-luna`, effort low. Task `LESSON-START-001`; owned only `studio/src/lesson-start-ui/`, `studio/tests/lesson-start-ui.test.mjs`, and this handoff.

## Judging and learner need

Targets: Product completeness/correctness, Usability clarity, and Intelligence through a traceable next step and honest assistance boundaries. Acceptance: first-time learner has one Begin reading action; a valid saved cursor can resume without autoplay; stale/unavailable source cannot start; saving limitations are described honestly.

`LessonStartPanel.tsx` exports a stateless panel with local compatible readiness/prop types. It presents purpose, chapters/checks, an approximate reading-only estimate when available or “Time varies,” source state/notices, reading vs prepared-interactive capability, and device/session/unavailable save wording. It uses KAIRO, not Rain, as the teacher identity. It has no provider, persistence, fetch, router, speech, autoplay or shared stylesheet dependency. Busy controls are disabled and callbacks are guarded even if invoked directly. A valid saved cursor offers Resume and Start reading from the beginning; invalid cursor does not. Changed source offers review only. Unavailable source exposes retry only when supplied. Multiple panels have no fixed DOM IDs.

Root review correction: device saving is now described as a capability (“Progress can be saved on this device”), not a completed save. Unavailable saving suggests downloading before leaving only if that option is available; it does not claim an export action exists or that earlier saved work was preserved.

## Checks and evidence

- `node --test tests/lesson-start-ui.test.mjs` from `studio/`: exit 0, **9/9 passed** after the copy correction. Actual TSX was loaded by Vite middleware SSR and rendered with ReactDOMServer; tests exercise button handlers from returned elements.
- `.\node_modules\.bin\tsc.cmd --noEmit` from `studio/`: exit 0, no diagnostics.
- Visible-copy score guard strips style/script nodes, so CSS percentages do not count; a positive check confirms actual visible “75%” is still detected.
- All test data is labelled synthetic. No learner or course claims derive from fixtures.

These checks do not establish real browser events, screen-reader announcements, keyboard focus order, phone layout, color contrast, learner acceptance or educational outcomes. No browser observation or device work was done.

## Source-only journey audit for root

Inspected `studio/src/source-classroom/SourceClassroom.tsx`, `studio/src/source-classroom/session.ts`, and `studio/src/source-classroom-ui/LessonReading.tsx`; this is code inspection, not observed browser behavior.

- Start: the classroom loader checks cancellation and reviewed source/citation identity before setting lesson state. The panel should be mounted only after parent readiness is established; do not infer source review from lesson fields alone.
- Next/back: chapter navigation uses bounded indices and cancels current narration in the caller. Root should verify route/back behavior retains source context and that chapter changes cannot leave stale lesson actions enabled.
- Retry: loader errors currently collapse to a message in the classroom; parent must classify source-changed vs unavailable from trusted results before selecting the panel state. Never retry a stale revision as if it were current.
- Cancel: fetch has AbortController on unmount, while narration stop is delegated to the shared teacher provider. Root should test delayed source response and delayed speech/provider completion together at integration; no second narrator belongs here.
- Save/resume: this panel accepts a validated `savedStep` and does not persist it. Parent must gate it on successfully read/validated storage, preserve corrupt bytes and handle concurrent-tab conflict before supplying `onResume`.
- Repeat clicks: this panel guards its callbacks while busy; root still owns request identity/idempotency, partial save recovery, and disabling stale callbacks after route/source changes.

No runtime defects are asserted by this audit. Parent owns classification, integration and testing of the connected journey. No router/provider/profile/auth/storage changes were made.
