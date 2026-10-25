# Account progress boundary test handoff

**Task:** `ACCOUNT-PROGRESS-BOUNDARY-20261024-001`  
**Owner:** `codex-luna-edited-lesson-review-20261023-a` (Codex, `gpt-6-luna`, `light`)  
**Scope:** `studio/tests/account-progress-boundary.test.mjs`, `docs/account-progress-boundary-20261024/`, this handoff.  
**Status:** test/evidence scope delivered; root fixed the two provider races; focused rerun passes 10/10.

## Learner need and judging target

“My work should stay in the account or device space I chose, and a slow account request must not overwrite or mark another state as saved.” Improves **Product** through scope isolation and reliability, **Usability** through truthful conflict/pending states, and **Impact** by protecting learner work. There is no learner validation claim.

## Changed files

- `studio/tests/account-progress-boundary.test.mjs` — actual AccountBoundary/storage Vite SSR loading, React hook harness, synthetic storage/fetch/timer/window doubles and ten focused scenarios.
- `docs/account-progress-boundary-20261024/README.md` — scope, reproducible command, results and limits.
- `docs/account-progress-boundary-20261024/verification.json` — actual counts, failures and root report reference.

No provider/storage source, router, auth, shared contract, manifest or another worker's scope was changed.

## Actual check result

`node --test tests/account-progress-boundary.test.mjs` from `studio/` now exits 0: **10 passed, 0 failed** after root's provider fix. Passing cases cover local legacy preview, guest isolation from legacy unscoped data, account-only remote hydration, account-scope preservation on remote failure, conditional saves using a matching remote version, stale-version conflict preservation, and both cleanup races.

Two failures reproduce cleanup races in current root-owned `studio/src/account/AccountBoundary.tsx`:

1. **Late progress hydration after cleanup:** defer the actual progress GET after successful signed-in status; unmount aborts the signal; resolve the mocked GET despite the abort. The provider applies the late response and restores its snapshot after unmount because there is no liveness check after the awaited progress request.
2. **Late save marker after cleanup:** return 404 for progress GET so the provider schedules a save; defer the actual PUT; unmount aborts it; resolve the mocked PUT despite abort. The provider writes the late returned version into the module-global active storage prefix because it marks synced without a liveness check after the await.

The root registration `codex-account-wave-20261024-c` received bus message 120 with both exact reproductions. Root added liveness/abort guards after progress fetch/JSON and save fetch/JSON awaits in `studio/src/account/AccountBoundary.tsx`. Rerun now proves that a mock resolving despite an aborted signal neither hydrates after cleanup nor marks a late save version. This lane did not modify that provider file.

An earlier test harness pass appeared to yield empty markup for the local-preview and conflict assertions. This was a harness defect: the manual React hook harness did not expose its `tree` field, so the test passed `undefined` to `renderToStaticMarkup`. Adding a tree getter made the assertions render the actual component return; both now pass. This was not a product rendering failure.

## Limits and acceptance

All data and responses are synthetic; no network or cloud call occurred. This is actual component logic under static SSR/injected hook execution, not browser/device or screen-reader acceptance. No account authentication or real cross-device sync is validated. Root still owns broader integration/review.
