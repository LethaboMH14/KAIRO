# KAIRO lesson-plan quality package handoff

Date: 23 October 2026  
Owner: `codex-luna-lesson-quality-20261023-a`  
Client/model/effort: Codex / `gpt-6` / `unknown` (the requested Luna/low setting was not exposed in this client).  
Task: `LESSON-PLAN-QUALITY-001`; claimed successfully before edits.

## Scope and delivery

Changed only:

- `studio/src/lesson-plan-quality/model.ts`
- `studio/tests/lesson-plan-quality.test.mjs`
- `docs/lesson-plan-quality-20261023/novice-flow-audit.md`
- `docs/lesson-plan-quality-20261023/verification.md`
- this handoff

`buildLessonPlan(lesson, sourceContext)` validates a structural lesson subset and builds source-linked reading, lesson-supplied worked-example candidates, explain-back, check and reflection steps. The caller must provide a trusted reviewed source context; source ID/revision mismatch or unreviewed context returns no start steps. Exact cited IDs and supplied support quotes are checked against the provided evidence, not against the original source itself. Repeated IDs, vague goals, prompt-only examples, missing editorial content, long chunks and invalid choices produce actionable warnings. No facts, answers, worked solutions, mastery, saving capability or interactive environment are inferred. Reading-time estimate is explicitly 200 words/minute over title/objective/explanations/cited passages and excludes examples, questions, practice and setup. The output stays source-reading, savedStep null and saving unavailable pending host integration.

## Judging evidence

- **Product:** learner need is a useful, source-grounded first lesson. Check: revision mismatch blocks the sequence and the sequence draws from cited chapters/questions. Evidence: focused test suite 6/6. Gap: no route integration or subject-matter review.
- **Usability:** learner need is a clear goal, honest example label and accurate reading-time expectation. Check: actionable warnings and estimate basis are emitted. Evidence: focused tests and source-only audit. Gap: root has not integrated these signals; no learner/device check.
- **Intelligence:** learner need is context traceability without presenting recognition/helped answers as mastery. Check: exact anchors, question labels and non-mastery notices. Evidence: focused tests. Gap: no model-quality or learning-outcome evaluation.

## Checks and limits

From `studio/`:

- `node --test tests/lesson-plan-quality.test.mjs` — exit 0; 6 passed, 0 failed.
- `.\node_modules\.bin\tsc.cmd --noEmit` — exit 0; no diagnostics.

Synthetic names/passages/options are labeled in the tests and are not curriculum facts. The source audit maps existing UI/server concerns to exact lines and recommended owners. This work did not edit router/provider/server/profile/auth/manifests or runtime components. No browser, headless browser, screenshot, audio, cloud, device or learner acceptance was performed. No integration, official learning outcome, mastery, traction or institutional verification is claimed.

## Parent review and next steps

1. Review this pure API and evidence, then claim integration paths separately if accepted.
2. Consider offering observable action prompts instead of “What do you want to understand?” in `SourceWorkspace.tsx:58`.
3. Integrate prompt-only example warnings; local examples are reflective prompts in `studio/server/workspace/model.mjs:46-47`, while the learner view offers “Example first” in `LessonWorkspace.tsx:41,44`.
4. Preserve assisted-attempt provenance before using answer history as skill evidence (`studio/src/workspace/learning.ts:2,5-10`; `studio/src/workspace/LessonWorkspace.tsx:46`).
5. Confirm all lesson starts use the reviewed source/revision gate (`studio/src/source-classroom/session.ts:17-25`), then conduct allowed device/accessibility checks later. The current route save wording is browser-local (`LessonWorkspace.tsx:27,31,47`); this package makes no cloud-sync claim.

## Parent-review repair addendum — 23 October 2026

Follow-up task `LESSON-PLAN-QUALITY-REPAIR-001` was separately registered and claimed by `codex-luna-planner-repair-20261023-b` (Codex / gpt-6 / effort unknown; requested Luna/low was not exposed). It stayed within the same four package scopes.

- Added `toLessonPlanInput(value: unknown)`: maps native workspace `Lesson.id` to `lessonId`, also accepts the already-published `lessonId` subset, rejects disagreement and malformed identities, and delegates to the existing strict structural validator. It reads but does not mutate the input and passes only the published subset onward.
- Corrected `LessonReadiness.questionCount` to count emitted runnable `check` steps. It is zero for changed/unavailable sources and excludes questions with invalid choices or missing source anchors.
- Regressions now cover native `id`, subset compatibility, conflicting/empty/null/non-text identity, no input mutation, valid supported count, unsupported quiz exclusion, and blocked-source zero count.

Repair verification from `studio/`: `node --test tests/lesson-plan-quality.test.mjs` exit 0, 9/9; `.\node_modules\.bin\tsc.cmd --noEmit` exit 0 with no diagnostics. Current results are also recorded in `docs/lesson-plan-quality-20261023/verification.md`.

Root still owns integration and should call the adapter only after its existing reviewed-source/revision checks. The adapter itself does not authenticate the source or evidence against original pages. No browser/device/learner acceptance is claimed.

