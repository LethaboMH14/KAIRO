# LUNA-OFFLINE-QA-001 handoff

Agent `codex-luna-offline-qa-20261022-a`, Codex, `gpt-6-luna` / low. Scope: `studio/tests/offline-acceptance.test.mjs`, `docs/workstreams/offline-qa.md`, and this handoff. Continuity implementation was reviewed read-only.

## QA results

- Added VM behavior tests for same-origin/cache allow rules, auth/query/method/API/private path exclusions, cache hit/miss, network error and non-OK home navigation fallback, and no POST/action replay.
- Added model tests for malformed persisted records, quota exception handling with no false success event, and refusal to replace notes across source revisions.
- Added a regression for forged extra fields in persisted memory. It failed before the owning root agent's correction because `writeMemory` validated a projected copy but stored the original input. Root changed it to persist `parseMemory(JSON.stringify(memory))`; the test then passed. This implementation edit is root-owned and outside this QA claim.
- `node --test tests/offline-acceptance.test.mjs tests/continuity.test.mjs` from `studio/`: passed, 13 tests.

## Limits

No implementation changes were made by this QA task. No browser, service-worker installation or screenshot was attempted. Compiled dependency inspection was skipped because no fresh build identity was confirmed. Tests do not establish physical-browser quota, cache lifecycle, shared-device, or production deployment acceptance.
