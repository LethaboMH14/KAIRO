# Edited lesson review handoff

Date: 2026-10-23. Reviewer: `codex-luna-edited-lesson-review-20261023-a`, Codex / `gpt-6-luna` / low. Task `EDITED-LESSON-REVIEW-001`; read-only review scope only.

## Result

Current source history, source/draft CAS, exact citation checks, immutable native scored-question semantics and fresh-ID publication passed code review. The historical-source route and loader now recover the exact retained revision; the classroom renders the saved `editorDocument`; original lesson JSON and earlier progress identity remain separated from the new learning copy. Current host tests cover save conflicts, failure/retry behavior, undo/redo, unload cancellation, publication and answer-key hiding.

One P2 integration finding remains: the separate saved reading-copy and notes/export path consumes legacy `lesson.chapters`, not `editorDocument`. For edited copies this loses worked-example kind/placement, omits authored reflection cards and layout, and carries a warning that does not explicitly mention worked examples. The live classroom preview itself does correctly render and warn on these block kinds. See `docs/edited-lesson-review/README.md` for code paths and recommended regression.

## Evidence

- Root-provided `docs/editor-build-20261023/backend-tests.txt`: 19/19 pass.
- Root-provided `docs/editor-build-20261023/host-tests.txt`: 8/8 pass.
- Reviewer rerun from `studio/`: `node --test tests/lesson-editor-host.test.mjs tests/lesson-draft-core.test.mjs tests/lesson-versions.test.mjs` — 22/22 pass.
- Reviewer attempt to rerun route integration was denied by sandbox loopback policy (`connect EACCES 127.0.0.1` in five cases); remaining 14 cases in that invocation passed. Root's separately recorded route integration run passed.

No product files changed. No browser/device/screen-reader/learner validation, cloud, paid calls or deployment. This is code/test review evidence, not WCAG certification or production readiness.

## Judging need

Usability: retain the learner's edited content when they save a device copy. Product: preserve visible edited lesson structure across live and saved reading forms. Intelligence: keep citations and scored questions tied to exact original identity. Remaining gap: saved reading/export adaptation and its regression test, then root review/integration.
