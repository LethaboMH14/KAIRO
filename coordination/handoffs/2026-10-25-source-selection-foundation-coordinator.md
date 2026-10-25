# Issue #16 — reviewed source selection state foundation (25 Oct 2026)

## Identity and ownership
- Interactive coordinator session: `gpt6-kairo-coordinator-20261025-0535-source-selection`, GPT-6, effort unknown.
- Source and tests branch: `feat/issue-16-reviewed-selection-20261025-a`, based on green CI repair branch `fix/ci-portable-extraction-20261025` @ `8f58d3c834f72abaacdc711ff182ed3c3d207c28`. A stacked PR targets the CI-repair branch, not main.
- Remote GitHub issue #16 contains cooperative scoped claim. Canonical local SQLite bus is inaccessible; no local lock or other-chat execution is asserted.
- Only new paths: `studio/src/source-selection/selection.mjs`, `studio/tests/source-selection.test.mjs` and this unique handoff.

## Delivered
- Pure learner-side selection helper for explicitly reviewed source snapshots: valid 24-character saved IDs, 64-character source revisions, 1–8 ordered distinct sources.
- Preserve the chosen revision rather than silently upgrading after edits; any missing/revoked/stale source invalidates a request.
- Prepare a bounded v2 `sourceRefs` payload stripped of text/title; cloud mode requires explicit processing/provider consent, never inferred.
- Multi-source request preparation is disabled unless caller explicitly receives `multiSourceApi===true`; no app route or UI wire-up and no attempt to post v2 arguments to existing single-source `/generate`.
- The server MUST independently verify authenticated account ownership, actual reviewed hashes, revision races and all citations. Client state can never satisfy security/privacy checks.

## Actual test evidence
- Focused independent test of equivalent code and test file on local isolated Node **v22.16.0**: `node --test tests/source-selection.test.mjs`: **12/12 passed, 0 failed, 0 skipped**. A separate import-path correction was tested with 12/12 again.
- No claim of Node24 complete-suite/build in this local environment. Stacked PR's real GitHub Actions is definitive once it runs.
- No browser/keyboard/screen-reader/end-to-end acceptance ran; do not check off issue #16.

## Follow-on integration gates
1. Resolve issue #3's actual v2 API/source-bundle contract and verify corresponding owner-scoped server checks.
2. Expose versioned server capability and private owner-filtered catalog/source revisions, not inferred from the present catalog (currently only ID/title/section count).
3. In reviewed ownership scope, mount a real accessible multi-select component to SourceWorkspace, preserving current single-source journey.
4. Verify source-specific citations, draft/studio/passage/practice compatibility, revision races, cancellation, recovery, human/browser device acceptance and consent.
5. Do not mark the new multi-source lesson path production-ready until all of the above are evidenced.

## Cloud/cost/deployment
No cloud operations, external provider requests, learner documents, paid embeddings, IAM changes or production deployment. No changes to main or canonical bus.
