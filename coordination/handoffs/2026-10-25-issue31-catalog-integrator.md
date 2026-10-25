# Issue #31 — Reviewed-source catalog first integration (25 October 2026)

Session: `gpt6-kairo-integrator-20261025-catalog-a`, GPT-6 effort unknown. Remote GitHub connector, not owner canonical checkout; no SQLite local bus access/registration or atomic claim. Cooperative issue #31 claim precedes branch edits; user gave merge authority, but no direct production deployment.

## Shipped code

- `studio/server/source-catalog/reviewed-summary.mjs`: authenticated repository snapshots only, rejects ID mismatch, duplicate valid IDs, revoked/deleted/unreviewed/invalid revision or malformed reviewed pages. Uses exact existing `hash(reviewedPages)` from server/workspace/model. No retrieved passages, binaries or owner identifiers leave metadata response.
- `studio/server/learner-workspace/routes.mjs`: only one import and /catalog response spread changed; preserves existing `catalog`, `lessons`, `jobs`, cloud status. Adds `reviewedSourcesVersion:1`, `reviewedSources`, `reviewedSourcesPage` from same owner-filtered list.
- `studio/tests/reviewed-source-catalog.test.mjs`: unit and synthetic authenticated Express HTTP tests covering tenant isolation, stale reviews, deleted/revoked sources, malformed data, duplicate IDs, bounded deterministic output and prior response compatibility.
- This unique handoff.

The existing repository.list defaults to **100 rows** with no public pagination cursor. `reviewedSourcesPage.possiblyTruncated` is conservatively true when it sees 100 rows, even when fewer reviewed items were returned. This is a v1 bounded snapshot, **not** a claim of complete pagination beyond 100. A later paginated repository API can be separately scoped.

## Dependency issue discovered

Issue #16/PR #26 `reviewedChoice(source)` presently checks `reviewedPages` even though `reviewedSources` intentionally does not return page text. The #16 owner must add an explicit server-authenticated metadata choice adapter keyed by `reviewedSectionCount` (or another agreed field) and cover stale/owner states; **do not copy full source pages to solve UI compatibility**. Client selection never replaces backend authenticated revalidation.

## Tests and evidence

GitHub Actions must run exact PR head Node24 locked install, serial full suite, build and Python shared-bus job. Synthetic HTTP tests do not prove production tenant/IAM state. No browser/device/provider/Cloud Run deployment in this work.

## Next

After green CI and scoped independent review, merge to main, hand off catalog response to #16 UI, and coordinate #3 v2 source bundle save/read/draft/studio semantics. Do not enable #16 `multiSourceApi` until v2 route and persistence are verified. Continue #10 owner privacy and #5 E2E synthetic/authorized device checks.
