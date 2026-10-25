# Account and local progress boundary checks

This package tests the actual `AccountBoundary.tsx` and `storage.ts` modules through installed Vite SSR and a deterministic injected React-hook harness. It makes no changes to those source files.

## Covered boundaries

- Legacy unscoped records remain visible in local preview and are not sent to account progress.
- A hosted guest uses only the `guest` prefix; legacy unscoped records are not read into that workspace.
- A signed-in, empty account prefix hydrates from its remote snapshot while unscoped and other account prefixes remain separate.
- A failed progress read keeps account work in its account prefix and does not save it into guest scope.
- A local record with a sync marker matching the fetched remote version is conditionally saved against that version.
- A newer remote version reports a conflict and preserves local work.
- Two cleanup races are captured as failing regression tests against the current provider (details below).

## Current test result

Run from `studio/`:

```powershell
node --test tests/account-progress-boundary.test.mjs
```

Current result after root's provider update: **10 tests, 10 pass**. The same deferred-response regression tests that previously reproduced cleanup races now pass. A first test-harness version also produced empty SSR markup for two assertions because its `rig` did not expose a `tree` getter; the component itself rendered correctly. Adding the getter fixed the harness and those assertions pass.

1. `cleanup aborts a late remote hydration without restoring into storage`: this first reproduced the actual bug. Root added liveness/abort checks after the awaited progress fetch and JSON read; rerun now confirms no late restore.
2. `cleanup aborts a pending save and a late save response cannot set the account sync marker`: this first reproduced the actual bug. Root added liveness/abort checks after the awaited save fetch and JSON read; rerun now confirms no late marker write.

The tests exercise the actual component, not copied predicates. In a real fetch implementation abort normally rejects the operation; the deliberately abort-ignoring mock models a completion racing with cleanup, so the component's own liveness guard is still tested. Current rerun passes after root changed `AccountBoundary.tsx`.

See `verification.json` for captured command/result and `coordination/handoffs/2026-10-24-account-progress-boundary.md` for root handoff. No real account, learner data, network, cloud or browser is used.
