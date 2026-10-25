# Lesson-plan quality verification

Date: 2026-10-23  
Registration: `codex-luna-lesson-quality-20261023-a`; Codex, model `gpt-6`, effort `unknown` (requested gpt-6-luna/low was not exposed by this client).  
Task: `LESSON-PLAN-QUALITY-001`, claimed before edits.

## Focused checks

Run from `studio/`:

```powershell
node --test tests/lesson-plan-quality.test.mjs
```

Result: exit 0, 6 tests, 6 passed, 0 failed. The cases cover source/revision gating; exact support quote and known citation IDs; recognition, calculation and open-reflection labels; prompt-only examples; vague, missing and long content; invalid answer choices; word-rate estimate boundaries; no mutation of frozen input; and no mastery claim from assistance.

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

Result: exit 0, no diagnostics. No package, lockfile, router, provider, server, profile, auth or runtime file was edited.

## Evidence boundary

The fixture lesson, source passages, locators, titles, questions and choices in `tests/lesson-plan-quality.test.mjs` are explicitly synthetic test data, not curriculum facts. The builder was exercised directly as a pure Node module. There was no browser, device, assistive-technology, audio, cloud or learner testing. The novice-flow audit is source inspection only. No production integration or lesson acceptance is claimed.

## Parent-review repair run

Second bounded task: `LESSON-PLAN-QUALITY-REPAIR-001`, claimed by `codex-luna-planner-repair-20261023-b`, Codex model `gpt-6`, effort `unknown`. The client did not expose the requested Luna/low settings.

The review identified that the runtime `Lesson` uses `id`, while the published planner subset calls this `lessonId`, and that `questionCount` counted all quiz rows instead of only emitted runnable `check` steps. `toLessonPlanInput(value)` now adapts the native identity, accepts a lessonId-only subset, rejects conflicting/malformed IDs and leaves the input untouched. `summary.questionCount` is computed from runnable steps and remains 0 when source state is changed/unavailable.

Run again from `studio/`:

```powershell
node --test tests/lesson-plan-quality.test.mjs
```

Result: exit 0, 9 tests, 9 passed, 0 failed. Added cases cover native `id` mapping, lessonId-only compatibility, conflicting/empty/null/non-text IDs, unsupported quiz rows and valid/blocked runnable counts.

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

Result: exit 0, no diagnostics. The repair changes remain within the planner/test/evidence/handoff claim; no runtime integration was performed.

Compatibility checkpoint, from `studio/`:

```powershell
node --test tests/lesson-plan-quality.test.mjs tests/lesson-start-ui.test.mjs
```

Result: exit 0, 18 tests, 18 passed, 0 failed. This jointly exercises the planner package and the independent stateless start panel; it is not route integration or browser/device acceptance.

