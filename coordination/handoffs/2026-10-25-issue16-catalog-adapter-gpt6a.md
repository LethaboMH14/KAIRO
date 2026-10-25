# Source selection catalog adapter — 25 October 2026

Session: `gpt6-kairo-integrator-20261025-selector-catalog`, GPT-6, effort unknown; GitHub remote-only, no canonical SQLite coordination bus claims. Owner authorised scoped merges. Issue #16 records exact claimed files.

## Problem and bounded fix
Merged PR #26 `reviewedChoice()` required `reviewedPages` from client-side source snapshots, whereas authenticated reviewed catalog PR #41 correctly returns only `reviewedSectionCount` metadata and no private source text. Exposing pages in the catalog would expand data exposure and couple picker to documents.

Fix accepts either existing reviewedPages snapshot (legacy) or `reviewedSectionCount` integer 1..120 from authenticated catalog. It rejects explicitly deleted/revoked records, invalid reviewed/revision status and invalid counts. The client still only constructs ordered `sourceRefs`; backend owner/revision/citation checks remain necessary. The default `multiSourceApi:false` feature gate is unchanged. No UI, routes or provider operations changed.

## Changed files
- Existing `studio/src/source-selection/selection.mjs` (narrow choice compatibility)
- NEW `studio/tests/source-selection-catalog.test.mjs` (6 deterministic regressions)
- This handoff

## Integration requirements
Full GitHub Actions Node24 serial suite/build/bus on this PR. It targets main and does not contain Issue #31's branch; its new tests exercise the planned catalog metadata contract synthetically. Merge after independent review and accepted PR #41, or verify via a combined CI virtual merge. Existing v1 source flow must remain functional.

The chosen source revisions may become stale after retrieval; backend #3 must independently check every current owner record and immutable review. No claim of actual mounted v2 lesson or device acceptance. UI worker can later read the metadata from private `/catalog` and wire keyboard-accessible selection only once #3 has an authenticated mounted v2 /generate response and compatible lesson storage/drafts/studios.
