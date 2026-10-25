# KAIRO v1 saved-lesson read-integrity boundary — 25 October 2026

Session: `gpt6-kairo-chief-read-integrity-20261025-2212`, ChatGPT GPT-6, effort unknown. GitHub-only remote session; the canonical SQLite coordination bus on the owner's computer is **not available**. Remote scope proposal: [Issue #3 comment 6402617861](https://github.com/LethaboMH14/KAIRO/issues/3#issuecomment-6402617861).

## Problem and judging relevance

`GET /lesson/:id` currently returns a saved lesson without revalidating its current reviewed source, and draft/publish/resume entry points are not consistently source-current. A learner can therefore be shown old evidence after re-review/revocation. This affects **Product** (complete safe journey), **Intelligence** (exact citations), and **Usability** (clear resume recovery); no learning gain or real-device evidence is claimed.

## Scope and interface

Only three NEW files in this branch:

- `studio/server/lesson-read-integrity/v1.mjs`: `loadCurrentV1Lesson({repository, ownerId, lessonId})`, a read-only owner-partitioned guard. It validates a stored v1 lesson ID, source ID and SHA256 revision; requires both current and archived reviewed source; checks archived source hash, exact evidence quote/UTF-16 offset/page locator/source identity, chapter/quiz citation IDs; re-reads source/archive and checks record versions to detect mid-read revocation. Returns `{lesson,source,sourceRevision}` only when valid. Missing lesson is 404; stale/revoked/forged evidence is 409; unavailable storage propagates failure. Rejects schema v2 rather than silently coercing it.
- `studio/tests/lesson-read-integrity-v1.test.mjs`: synthetic deterministic owner, revocation, re-review, archived deletion, forged citation, version-mixing, edited-copy and mid-read race coverage.
- This handoff.

No existing shared router/repository/schema/workflow/package, studio, picker, provider, production or private learner record was changed.

## Limitations and owner integration contract

**Not mounted.** This helper does not repair the live GET/draft/publish/passage/resume routes until the #3/#71 owner explicitly claims and edits `studio/server/learner-workspace/routes.mjs`. It is **not an atomic Firestore read transaction**: a source can change after the final recheck, and multi-source cloud-v2 must use #46/#48's distinct provenance and transaction contract. The guard assumes the existing Firestore repository's `get(uid, kind, id)` returns `{version,value}` and that owner identity was authenticated by the caller.

Recommended owner mount order: (1) wire GET `/lesson/:id` with clear 409 learner recovery; (2) reuse guard for draft read/write/history/publish and lesson passage before provider admission; (3) integrate #86's atomic write-side fence into `/generate` separately; (4) test actual HTTP authenticated A/B, source revocation between fetch and resume, edited-copy read, cancellation and v2 explicit fail-closed; (5) independently review, run exact integrated Node24 full serial tests, Vite production build and Python coordination tests, then permitted browser/keyboard/device QA. Coordinate shared route ownership first.

## Evidence boundary

The new tests are synthetic and can be executed by `cd studio && node --test --test-concurrency=1 tests/lesson-read-integrity-v1.test.mjs`. The normal GitHub Actions workflow includes `tests/*.test.mjs` on Node24, the Vite build and Python bus tests. Record exact-head run IDs before any merge decision; this file does not assert CI passed until observed. No Firebase emulator, live provider, browser/device, hosted Kaggle, autonomous agent, production deployment, IAM or billing work.

## Two next non-overlapping tasks

1. **#3/#71 existing route owner:** claim the shared learner-workspace route and mount v1 read guard + #86 atomic v1 write guard, with HTTP mutation-at-commit and revocation/resume tests.
2. **#46/#48 existing v2 owner:** independently repair cloud-v2 provider/consent provenance and transactionally fence every selected source; do not reuse v1 read guard as a v2 validator.
