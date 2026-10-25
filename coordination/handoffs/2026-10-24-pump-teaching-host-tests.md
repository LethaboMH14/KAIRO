# Pump teaching host regression tests — 24 October 2026

Owner: `codex-pump-host-tests-20261024-d` (Codex, actual model `gpt-6`; effort `unknown`). Task `PUMP-TEACHING-HOST-TESTS-001`.

## Learner need and judging evidence

Learners entering Pump Lab from a lesson need a truthful return path, a teaching guide that follows meaningful selection/task/reading changes, safe session recovery and bounded evidence that does not become a credential claim. This test package supports Product and Usability (return and context continuity), Sustainability (bounded evidence retention), and Intelligence (context follows explicit current state and exports preserve honest verification limits). The observable check runs the real `PumpHost` module under Vite SSR and drives its captured props/callbacks with deterministic storage and narration state.

## Changed files

- `studio/tests/pump-teaching-host.test.mjs`: actual host SSR/hook harness with minimal stubs for PumpLab, StudioCompanion, StudioLessonPlan and teacher hook; actual pump session/report modules and learner storage remain loaded.
- `docs/pump-teaching-host-tests-20261024/README.md` and `CHECKS.txt`: scope, result, defect and limits.

No product source, package, cloud, browser or camera files were changed.

## Verification and finding

Run from `studio/`: `node --test tests/pump-teaching-host.test.mjs`. Six of seven tests pass. One regression assertion fails: with `?lesson=not-a-lesson`, PumpHost routes to `/studios` but labels the exit “Back to my lesson.” The valid 24-hex lesson ID produces `/classroom?lesson=<id>&tab=evidence` and “Back to my lesson.” Snapshot preservation, callback persistence, context cancellation boundaries, panel prop wiring, and generated bounded evidence pass. Full output and results are in `docs/pump-teaching-host-tests-20261024/CHECKS.txt`.

## Next step and limitations

Root should derive exit label and return destination from the same validated lesson decision, then rerun this test. This package does not establish full build, browser/device behavior, audio playback, camera use or human learner outcomes. Test evidence is not release acceptance.
