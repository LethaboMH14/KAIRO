# KAIRO — cloud request collision and allowance contract (26 October 2026)

Session: `gpt6-kairo-chief-collision-20261026-v12`; GPT-6; effort unknown. Pinned base `main@7e94b557b095188cf80d0a125d6be4967374bd95`. Remote GitHub session only: the owner-local SQLite bus is not remotely accessible, so GitHub issue PLAN is a cooperative notice, not an atomic local claim.

## Exact scope

Added only `studio/tests/bundle-cloud-collision-quota-chief-20261026-v12.test.mjs` and this handoff. No backend service, shared route, source picker, PumpHost, provider configuration, packages or CI changed. Separate PR Integrator owns release review/merge.

## Interface and observable result

The test exercises the real Express bundle lesson route and durable `createModelGateway` ledger with two synthetic owner-reviewed sources and a deterministic Google completion stub (no external calls). A valid consented cloud request must save/resume one cited lesson. Reusing the **same requestId** with a different learning goal, or with the ordered sourceRefs reversed, must return 409 **without** another saved lesson, another model call, or another daily lesson allowance debit. This is a distinct collision contract from draft #139's identical-payload replay.

At base, `studio/server/bundle-lessons/service.mjs` invokes `reserveCreation(uid)` **before** the gateway compares the stored request fingerprint, so rejected collisions may debit the daily allowance. The tests intentionally expose the boundary; a red contract is NOT evidence of production data loss, actual provider billing, or Firestore behaviour. Do not merge red regression tests.

## Evidence / gates

PLAN: [Issue #46](https://github.com/LethaboMH14/KAIRO/issues/46#issuecomment-6411432783), [coordinator #11](https://github.com/LethaboMH14/KAIRO/issues/11#issuecomment-6411432066). Initial test commit: `3b2301c3b5737a0f8c5b28466c78d6f9a96b9ed7`.

Node24 exact-head CI, Vite build and Python coordination checks: **pending** at handoff creation; do not report them as executed. Canonical bus, permitted browser/device and Firestore emulator: **not run**. Judging: Product/Usability safe retry, Sustainability avoiding wasted allowance, Intelligence revision-ordered evidence.

## Next two non-overlapping tasks

1. Existing backend owner #46: atomically check owner-scoped request fingerprint/receipt and source revisions **before** quota reservation, ensure changed payload returns 409 without debit, same payload returns saved result, concurrent requests commit once. Rerun this contract and #139; validate Firestore emulator where permitted.
2. Existing frontend owner #47: after the backend contract is accepted and shared file scope cleared, reconcile cancelled/ambiguous creates, preserve retry keys and show accessible saved-lesson resume states.

No merge, cloud change, IAM, billing, deployment, private learner processing or hosted model training is authorized by this test.
