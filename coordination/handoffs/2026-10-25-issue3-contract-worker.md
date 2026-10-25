# Issue #3 contract-first worker handoff — 25 October 2026

Session: `gpt6-issue3-20261025-0541-lesson-contract`  
Model: GPT-6; effort setting unknown.  
Repository: `LethaboMH14/KAIRO`; branch: `feature/issue-3-lesson-bundle-contract-20261025`.  
Base dependency: PR #1 at `144c920e726102306ca79f708a8f474ab73bbe59`, main inspected at `20183faf31fe30bc68e2fc70cb339e7fd24fce79`.  
Coordination: GitHub Issue #3. The owner's canonical SQLite bus **was not available** in this separate GitHub connector/container session. No local registration or claim is asserted. Confirm local claims with the owner before integration.

## Files solely owned by this change

- `studio/server/owner-retrieval/lesson-contract.mjs` — validated v2 request, SHA-256 source bundle identity, owner/revision integrity, strict evidence provenance and gateway adapter.
- `studio/tests/owner-lesson-contract.test.mjs` — 12 focused tests.
- `coordination/handoffs/2026-10-25-issue3-contract-worker.md` — this handoff.

No existing route, shared schema, UI, AI service/gateway, package, lockfile, deployment, secrets or learner data were changed. The PR is intended to remain **draft**.

## Versioned API contract proposal (not yet mounted)

`POST /generate` with **no `sourceRefs` property** keeps its current v1 `{sourceId,revision,mode,...}` behavior unchanged. A v2 request has:

```json
{
  "sourceRefs": [
    {"sourceId": "aaaaaaaaaaaaaaaaaaaaaaaa", "revision": "64 lowercase hex SHA-256"}
  ],
  "mode": "cloud",
  "goal": "Explain the stator and impeller",
  "consent": true,
  "provider": "google",
  "providerConsent": ["google"],
  "requestId": "study_12345678"
}
```

The `revision` example above is a placeholder, not an acceptable hash literal. Actual requests must use the current saved SHA-256 for each document. The refs are ordered, 1–8 distinct IDs; only `sourceId` and `revision` are accepted in each ref. A v2 request must not also send top-level legacy sourceId/revision. Cloud mode requires explicit provider-specific consent, a provider and request ID. Fallback providers require their own consent. Local mode selects reviewed excerpts without sending data to a model.

The immutable ordered bundle fingerprint is `sha256(JSON.stringify({schemaVersion:2,sourceRefs}))`. It is **not** interchangeable with the revision of any individual source. The gateway adapter includes the ordered sourceRefs, bundleRevision and evidence in its fingerprinted payload and passes `isCurrent` to the existing gateway. Source and immutable revision records are owner-filtered and SHA-256 verified before retrieval, after retrieval, and on gateway completion. Retrieval itself comes from PR #1; this adapter does not reimplement ranking. Every cited quote must match the exact reviewed page locator and UTF-16 offsets for its own source/revision. Max 12 excerpts / 12,000 characters.

**Important:** A successful result from `generateOwnedLessonBundle` is not saved by this module. Shared route owner must perform final revision checks before and after persistence, and atomically handle concurrent review/revocation where possible. No v2 response should masquerade as a v1 `sourceId` lesson.

## Compatibility blockers before mounting

- `studio/server/learner-workspace/routes.mjs` `/generate` and `studio/server/ai-runtime/service.mjs` currently load one source and one revision. Confirm owner and explicit coordinator approval before changing them.
- `studio/src/lesson-draft-core/model.ts`, passage help, studio companion, practice/pattern events and saved lesson edits use v1 source assumptions. Add sourceRefs/bundleRevision semantics and per-citation source checks, or disable those controls for v2 lessons with clear readable UI messages. Do **not** quietly attribute an excerpt from source B to source A.
- Design a safe v2 lesson persistence/validation schema and UI selection with Issue #16. Ensure exclusion of revoked or changed sources after generation and on later lesson/studio/draft requests.
- PR #1's CI repair (#2, PRs #15 and #17) and local canonical bus scope reconciliation must complete before shared wiring/merge.

## Verification (actual vs pending)

- **Ran:** `node --check studio/server/owner-retrieval/lesson-contract.mjs` and `node --check studio/tests/owner-lesson-contract.test.mjs` locally in a temporary hand-built slice.
- **Ran:** Node `v22.16.0`, `node --experimental-strip-types --test --test-concurrency=1 tests/owner-lesson-contract.test.mjs` from the temporary `studio` slice: **12 tests, 12 pass, 0 fail**, approx 227ms. The slice manually recreated PR #1 corpus and TypeScript selector and used a test-only approximation of the shared lesson validator, rather than an authentic full repository checkout. It is preliminary, **not an authoritative PR suite result**.
- **Not run:** Node 24 `npm ci`, complete serial `node --test --test-concurrency=1 tests/*.test.mjs`, `npm run build`, actual CI checks and deployed integration tests. This container has Node 22 and cannot resolve github.com; the GitHub connector can edit files but is not the canonical local checkout. CI on the draft PR is the next authoritative checkpoint.
- **No** provider, microphone, browser, IAM, storage, production deployment or paid cloud access was used.
- Synthetic fixture assertions cover: another owner, deleted/unreviewed revision, duplicate/9 IDs, SHA/tampered citation, multiple source anchors, race on secondary source before provider/during response, explicit consent/fallback refusal, simulated quota 429/provider error propagation, cancellation and v1 dispatch. The quota/provider scenarios use injected stub errors; they do **not** prove live gateway billing behavior.

## Criteria, user need and observable acceptance

Product + Usability + Intelligence + Impact: a learner deliberately combines reviewed course materials without false cross-source attribution, private data leakage or an unexpected provider send. Observable next acceptance: authenticated account with two reviewed documents requests v2; resulting chapter/quiz citations resolve to their own exact stored SHA-256 source, revision races fail without a saved lesson; legacy v1 editing/studios remain functional. Real-device and educational outcome evidence remain absent.

## NEXT unblocked work

Issue #3 coordinator/assigned route owner: approve v2 lesson persistence and compatibility policy (or interim read-only v2 lessons) in Issue #3; check shared claims, then allocate isolated integration scope for `/generate` and `ai-runtime/service.mjs`. After that, Issue #16 can safely implement a learner-facing chooser. Do not start shared-file integration merely because this contract PR exists.
