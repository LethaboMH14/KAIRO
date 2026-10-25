# Source continuity repair handoff

Owner: `codex-luna-source-continuity-repair-20261022-a` (Codex, `gpt-6`, effort `unknown`)
Task: `SOURCE-CONTINUITY-REPAIR-001`
Status: implementation complete; root review requested.

## Scope and changes

- `studio/src/workspace/SourceWorkspace.tsx`: invalidate lesson generation and clear the displayed lesson when the goal changes; preserve paste/title drafts after a review-save; consume a captured paste only after a successful source selection and only if the current draft still exactly matches the captured values; guard async run error/busy finalizers by operation identity and ignore catalog/deep-link updates after unmount.
- `studio/src/source-continuity/guards.ts`: add pure source-result commit projection and goal-edit transition helpers. Stale/error request results have no commit projection.
- `studio/tests/source-continuity.test.mjs`: add state-transition cases for review-save retention, successful paste consumption, newer draft preservation, stale/error refusal and goal-edit invalidation.
- `docs/workstreams/source-continuity-fix.md`: record the repair behavior and verification scope.

No server/source contract changed. No runtime UI interaction, aggregate build, private data, network request or cloud call was performed.

## Verification

- `node --test tests/source-continuity.test.mjs` from `studio/`: 9/9 passed.
- Scoped TypeScript check: `npx tsc --noEmit --jsx react-jsx --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions src/workspace/SourceWorkspace.tsx` from `studio/`: exited 0 with no diagnostics.

Root reviewed the source commit helper, review-save preservation path, draft ref, goal invalidation and operation-owned finalizers before aggregate integration. Aggregate build remains outside this worker's scope.
