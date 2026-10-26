# Cloud lesson retry idempotency — bounded engineering contract (26 Oct 2026)

Session: `gpt6-kairo-chief-cloud-retry-contract-20261026-v11` (ChatGPT GPT-6, effort unknown). Parent main: `7e94b557b095188cf80d0a125d6be4967374bd95`. Issue coordination: #16 and #11. Exact scope: new `studio/tests/bundle-cloud-retry-http-chief-20261026-v11.test.mjs` and this unique handoff only. GitHub-only session: canonical local SQLite bus is not accessible, no local claim or sibling worker asserted.

## Learner problem and judging coverage

Product / Usability / Sustainability / Intelligence: after a delayed or ambiguous lesson creation, a learner must safely retry the *same* consented source-backed request and resume the same cited saved lesson without duplicating their lesson or daily allowance. Gateway-level provider request deduplication is not sufficient if the outer saved-lesson write allocates a new ID each time.

## Executable contract

The test uses actual Express `createBundleLessons().router`, actual `createModelGateway()` owner-scoped durable request ledger, a synthetic in-memory CAS repository with two reviewed+archived source revisions, and deterministic fake Google lesson completion. No network/provider/Firebase/Firestore/private data is used. Control: one cloud request returns 201, persisted source-linked record readable at GET, one allowance reservation and one fake model invocation. Red contract: two identical successful POSTs with the same owner, request ID, ordered source revisions, goal, provider and consent must return the **same** saved record ID and version, consume **one** allowance, retain **one** lesson, and call the fake provider **once**.

Source-code observation before execution: `studio/server/bundle-lessons/service.mjs` reserves `bundle_daily_YYYYMMDD` before `gateway.run()` and calls `saveLessonV2Record()` with a new random lesson ID after gateway returns. The gateway's cached completion can therefore be saved again. This test is intended to prove/disprove that at HTTP level, not to assert a real customer incident.

## Ownership and implementation interface

The existing #46 backend owner owns any repair to `studio/server/bundle-lessons/service.mjs`, `studio/server/lesson-v2/record.mjs`, and the owner-scoped transactional repository. Coordinate with #3/#71 and #16 claims before shared-file changes. Add a durable, owner-partitioned operation fingerprint over exact ordered source IDs/revisions, goal, mode, provider/fallback and explicit consent. Atomically bind request ID → saved lesson ID/version and allowance reservation to the saved-lesson commit. Identical completed retry must return that receipt; changed payload under same key must reject 409; revoked source must not return stale saved content. Resolve concurrent same-key races and cancellation/recovery without a second provider call. Local mode requires a separately explicit operation key or documented behavior. Do not infer atomic Firestore safety from this synthetic test.

## Checks and evidence

Remote GitHub Actions Node24 serial tests, Vite build and Python temporary bus are the requested gates. Record the **actual** exact-head run outcome after CI; a failing contract must stay DRAFT/UNMERGED. No browser/device, real Firestore emulator, live model, deployment, public IAM or billing action. Independent PR #34 review/merge belongs to the separate PR Integrator.

## Two disjoint next tasks

1. #46 backend owner: transactional owner-scoped create/idempotency/allowance receipt, then make this HTTP contract green; add concurrent and changed-payload/revoked-source tests.
2. #47 frontend owner: after backend interface and exclusive file clearance, reconcile aborted/unknown create by reading saved lessons, preserving the same request ID and providing an accessible resume link, with permitted keyboard/zoom/device QA.
