# Deterministic local multi-source lesson planner

This package converts a verified local v2 bundle from `prepareOwnedLessonBundle` into content accepted by `validateLesson`. It is a deterministic adapter; it does not fetch, persist, call a provider, or execute source text.

## Behaviour

- Rechecks that the request is local and schema v2, the source refs agree with the bundle revision, evidence metadata is bounded and internally consistent, and selection metadata covers the selected refs.
- Requires at least one retrieved evidence passage for every selected source. If lexical retrieval returns no passage for a selected source, the planner fails with the source ID and asks the caller to reselect material or revise the study goal. It never silently drops that source.
- Emits two or more and at most five chapters. Chapter citations retain the exact evidence IDs; chapter excerpts are exact prefixes of the retrieved quotes. At most four evidence IDs appear in each chapter.
- Keeps chapter explanations within the existing 1,300-character validator limit even when evidence title and locator metadata are at their accepted maximums. Titles and locators remain on the evidence objects and persisted record rather than being duplicated into prose.
- Uses an exact quote substring as the practice support anchor. The question checks recognition of a cited passage only and explicitly says that it does not demonstrate subject understanding or mastery.
- Builds three deterministic distractors and adds a deterministic suffix only if a distractor collides with the exact source excerpt, preserving four unique quiz options for the existing validator.
- Preserves source text as inert text. Strings that resemble instructions are displayed as quoted evidence; they are not interpreted or run.

## Evidence and judging alignment

- **Product / Intelligence:** enables a source-grounded local lesson from multiple reviewed sources. Automated acceptance is the real `prepareOwnedLessonBundle` → `buildLocalBundleLesson` → `validateLesson` → `createLessonV2Record` path for 1, 2, and 8 sources, plus missing-source and malformed-evidence rejection.
- **Learner need:** study from more than one reviewed source without losing which exact passage supports the lesson.
- **Observable check:** every selected source is represented by evidence and every retrieved evidence ID appears in chapter citations; record creation preserves all source refs and evidence.
- **Limitations:** synthetic repository fixtures and local automated tests only. This is not evidence of educational correctness, learner understanding, mastery, retrieval recall, browser/device acceptance, or improved outcomes. Retrieval remains bounded lexical selection and does not prove source accuracy.

## Run

From the `studio` project root:

```powershell
node --test tests/bundle-lesson-local.test.mjs
```

The tests use synthetic reviewed source records and the actual local bundle preparation, validator, and v2 record constructor. They include eight sources with maximum accepted title/locator lengths and source text matching a stock distractor. No provider, network, or browser is used.
