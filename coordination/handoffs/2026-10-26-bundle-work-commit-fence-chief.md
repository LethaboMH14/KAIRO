# Practice-work commit fence — deterministic regression probe (26 October 2026)

Session: `gpt6-kairo-chief-work-commit-probe-20261026-a` (ChatGPT GPT-6, effort unknown).
Base: `main@fc03149be570cb1bbf4b663f612c3fcbd28f0c76`.
Branch: `test/issue16-bundle-work-commit-fence-20261026-chief`.

## Exclusive scope and coordination
- NEW `studio/tests/bundle-work-commit-fence-20261026.test.mjs`
- NEW `coordination/handoffs/2026-10-26-bundle-work-commit-fence-chief.md`
- PLAN posted to issue #16 before editing. No shared backend, existing test, schema, picker, workflow, provider, cloud or IAM changes.
- GitHub comments are cooperative coordination only. Canonical owner-local SQLite bus was not accessible.

## User-facing requirement and expected red test
Source → review → cited lesson → practice → evidence → resume must not save a learner's attempt if a reviewed source is revoked during the attempt write. Current `studio/server/bundle-lessons/service.mjs` writes `progress/bundlework_<id>` and then re-reads the source; a failed final read returns 409 without reverting the written attempt. This is a code-path hypothesis until CI executes the test.

The test uses two synthetic reviewed sources and an in-memory CAS repository behind an authenticated synthetic Express HTTP route. Control: create a local v2 lesson, save an attempt, resume successfully. Adversarial case: immediately after the repository commits the attempt, revoke one source, expect HTTP 409 **and no saved attempt**. The final assertion is expected to fail on current main, intentionally. Do not merge a red regression. No private learner data, provider calls, real Firebase identity or Firestore emulator is involved.

## Acceptance for the existing backend owner
Under a separately approved exclusive claim for the shared bundle route and Firestore repository adapter, make the source-current/review revision check and attempt create/update CAS commit atomic, or fail closed before committing. Preserve prior accepted work on a rejected update; cancellation and foreign-owner checks must not write. Rerun this test and full exact-head Node24 suite, production build and Python temporary-bus checks; then independent review under PR #34 and permitted browser/device acceptance. Do not treat an in-memory fake as a Firestore transaction proof.

## Status and follow-ons
CI results must be reported with exact PR SHA after workflow completion. Product/Usability/Intelligence benefit is integrity of private learning evidence, not measured learning gain.
1. #46 backend owner: atomic v2 source/work write with conflict and quota semantics, then real emulator verification if authorized.
2. #47/#5 frontend/QA owners: keyboard/screen-reader, narrow-screen and resume conflict explanation acceptance after backend fix.
