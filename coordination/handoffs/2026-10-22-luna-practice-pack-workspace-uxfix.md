# LUNA-PRACTICE-PACK-WORKSPACE-UXFIX-001 handoff

**Owner:** `codex-luna-opportunity-20261022-b`  
**Model/effort:** `gpt-6-luna` / `low`  
**Scope:** repair to the already-reviewed isolated learner workspace only.

## Changes

- Replaced slogan and all-caps metadata with plain sentence-case labels such as “Workplace practice”, “Invented scenario · formative practice”, “Updated requirement”, “Feedback” and “Scenario sequence complete”.
- Progress text still reports the current decision (for example, “Decision 1 of 3”). The bar and accessible value now use `run.stepIndex`, the count of already completed steps, so a new run starts at zero.
- Explicit Leave and optional host Back now confirm before discarding the run; browser unload has a `beforeunload` guard while any choice, hint or reflection exists. No persistent save is claimed.
- Hint actions preserve the currently selected radio option while the step stays the same. Submitted choices clear the draft as before.
- Added assertions that the first current decision corresponds to zero completed steps and that advancing the reducer increments completed steps while changing the decision text.

## Validation and limits

- `node --test tests/practice-pack-workspace.test.mjs` from `studio/`: 5 passed.
- Focused strict TypeScript check with `--skipLibCheck`: passed.
- No browser interaction test was run. The SSR smoke test does not exercise confirm dialogs, `beforeunload`, or radio state persistence after a hint; these require root’s later integration/browser review.

Root may proceed with route integration after its review. This task did not alter router, app entrypoint, pack model, shared CSS or manifests.
