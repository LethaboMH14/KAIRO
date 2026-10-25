# Offline and device-memory QA

## Behavioral checks

`studio/tests/offline-acceptance.test.mjs` runs the service worker in a VM with controlled cache and network responses. It covers pass-through for APIs, external origins, private paths, query URLs, authorization-bearing requests and non-GET methods; cached asset hits; a one-shot network response on asset cache miss; saved-home fallback after network error and non-OK response; and the bounded 503 response when no saved home exists. POST external-action requests are not intercepted or retried by the worker.

The continuity-model checks reject malformed persisted lesson records, verify allowlisted projection on read, ensure quota failures do not claim success, and protect notes when a lesson source revision changes. A persistence regression checks that `writeMemory` stores only projected fields. That regression first failed against the read-only implementation because the writer validated a projected value but stored the original object; the owning root agent corrected the writer to persist the projected value, after which the test passed.

## Evidence and limits

Commands run from `studio/`:

- `node --test tests/offline-acceptance.test.mjs`: 8 tests passed.
- `node --test tests/offline-acceptance.test.mjs tests/continuity.test.mjs`: 13 tests passed.

No browser acceptance, screenshot or service-worker installation was performed. No compiled asset dependency closure was inspected because a fresh production build corresponding to the current source was not confirmed. These VM and model tests do not establish physical-device quota behavior, browser lifecycle behavior, shared-device isolation, accessibility acceptance, or production service-worker deployment.
