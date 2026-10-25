# B2 local multi-source lesson planner handoff

- **Owner/session:** `codex-luna-bundle-lesson-local-20261025-a`; client Codex; model `gpt-6.1-sol`; effort `unknown`.
- **Task:** `BUNDLE-LOCAL-REPAIR-074` (follow-up to released `BUNDLE-LESSON-LOCAL-B2-20261025`).
- **Judging criteria:** Product (a usable local lesson from more than one reviewed source) and Intelligence (traceable citation-backed content and honest limits). Learner need: compare multiple selected materials while retaining exact source support. Observable acceptance: run real bundle preparation, planner, existing validator, and v2 record constructor for 1, 2, and 8 selected sources; reject a selected source with no retrieved evidence.
- **Branch/base:** `codex/bundle-lesson-local-b2-20261025`; PR #111 now targets `main` after PR48 merged. Base includes repaired schema-v2 commit `ef53479040e2ac1c21f8219454c35d9f89d2d7f0`. Draft PR: https://github.com/LethaboMH14/KAIRO/pull/111.

## Changed files

- `studio/server/bundle-lesson-local/plan.mjs` exports `buildLocalBundleLesson(bundle)`. It is a deterministic adapter over verified local bundles, confirms request/revision/ref/evidence bounds and metadata, requires evidence for each selected source, groups all retrieved evidence into 2–5 chapters, and anchors the quiz to an exact quote substring. It produces no side effects.
- `studio/tests/bundle-lesson-local.test.mjs` uses synthetic owner-scoped source and immutable-revision records and the actual `prepareOwnedLessonBundle`, `validateLesson`, and `createLessonV2Record` modules.
- `docs/bundle-lesson-local-20261025/README.md` records usage, acceptance evidence, criterion and learner need, and limitations; `test-results.txt` preserves the final run output.

## Decisions and evidence

- Retrieval is the existing bounded lexical path. Because it can return a selected source with no evidence, this adapter rejects that bundle and identifies the missing source rather than pretending the lesson covers all selected material.
- Chapter excerpts are exact prefixes of cited quotes. Citation IDs, source titles and locators remain on evidence. Repeated title/locator prose is omitted so an accepted max-length metadata value cannot overflow the chapter text budget.
- Quiz distractors use deterministic suffixes on collision, so source text identical to a stock distractor still yields four distinct validator-accepted choices.
- Source text is treated as inert data. The test includes instruction-like text in a reviewed synthetic source and checks it is retained as text, not executed.
- Final command: `node --test --test-reporter=spec studio/tests/bundle-lesson-local.test.mjs studio/tests/owner-retrieval.test.mjs studio/tests/lesson-v2-record.test.mjs`: **27/27 passed** (9 planner integration/boundary tests + 18 existing preparation/v2 contract tests); no failures, skips, or cancellations. Includes maximal accepted 120-character title/300-character locator across 8 sources and exact source/distractor collision. Captured at `docs/bundle-lesson-local-20261025/test-results.txt`.

## Remaining gaps / next acceptance

- Independent root review of the repaired head remains required before mount/integration. The final PR head SHA is reported in the task handoff message and must be reviewed before mount.
- No browser/device/human learner/domain review or educational correctness validation was performed. Passing automated tests does not show that learners understand more or that retrieved sources are accurate.
- A future caller must handle the actionable missing-evidence error and allow the learner to adjust source selection or study goal. No route or UI was changed here.
