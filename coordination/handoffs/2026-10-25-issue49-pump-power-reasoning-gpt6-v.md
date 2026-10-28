# Issue #49 — hydraulic-power reasoning challenge (25 October 2026)
Session: `gpt6-kairo-pump-power-20261025-2204-v`; GPT-6; effort setting unknown.
Branch: `feat/issue-49-pump-power-reasoning-20261025-v`.
Base: `main@1997ba9f046f6d4122169cb26a72e89cc60befd1`.

## Why this is a separate implementation
The existing pump-valve what-if challenge is owned by draft PR #55 and independent acceptance/fuzz by #80/#84. PR #97 owns its focus helper; PR #70/#78/#82 own source/evidence prerequisites. This slice adds a **different learning concept** (the relationship between flow, head and hydraulic power) on **new isolated files only**. No shared routes, CSS, pump physics, existing studio tests, package manifests or infrastructure are changed. It is not mounted in the authenticated app.

The owner's canonical SQLite bus is NOT remotely readable from GitHub. Issue #49 contains the proposed cooperative exact-path scope; it is not an atomic bus claim. Coordinator must reconcile local claims before merging/mounting.

## Learning contract and evidence boundary
Learner selects a hypothetical flow in guided round 1 and head in independent round 2, commits a direction and numerical kW prediction **before** the result appears, inspects a deterministic unit-checked calculation, writes an explanation and proceeds to the independent attempt. The source is the South African Water Research Commission's *Handbook on Pumps and Pumping Systems*, section 3, printed page 24, equation (3): `P_h = rho*g*Q*H`, https://www.wrc.org.za/wp-content/uploads/mdocs/520-1-01.pdf (checked 2026-10-25). Formula and rounded water constants come from this handbook; the flow/head examples are KAIRO-authored fictional values. They are NOT measurements, equipment advice, a validated pump curve or manufacturer figures. Hydraulic power is not motor input/electrical consumption. No operating instructions.

All learner actions are bounded and strictly ordered: guided predict→explain, then independent predict→explain. Local JSON export/import stores **inputs only**, recalculates outputs, checks schema/model version and rejects extra result fields. Local practice is self-reported, not cryptographically authenticated, saved in Firestore or graded as competency. No Kaggle training or model quality claims.

## Exact files
- `studio/src/studio-scenarios/pump-power-reasoning-20261025/model.ts`: pure formula, cases, finite/unit validation, strict action replay, local export/restore.
- `studio/src/studio-scenarios/pump-power-reasoning-20261025/PumpPowerReasoning.tsx`: accessible native forms, committed prediction, numeric and 2D/reading results, independent round, local save/restore and status/focus recovery.
- `studio/src/studio-scenarios/pump-power-reasoning-20261025/styles.css`: scoped responsive and focus-visible styles.
- `studio/src/studio-scenarios/pump-power-reasoning-20261025/preview.html` and `preview.tsx`: standalone Vite preview (start studio Vite and open `/src/studio-scenarios/pump-power-reasoning-20261025/preview.html`).
- `studio/tests/pump-power-reasoning-20261025.test.mjs`: 15 focused Node tests (domain, invariants, negative controls, replay, source and accessibility structure).

## Tests and review boundaries
At authoring, exact-head GitHub Actions are pending. Do not reuse earlier PR CI as evidence. To run locally on Node24: `cd studio && node --test tests/pump-power-reasoning-20261025.test.mjs && npm run build`; for complete regressions `node --test --test-concurrency=1 tests/*.test.mjs`. Node22 local environment cannot establish the supported Node24 build baseline; CI is authoritative when completed. No real browser, screen-reader, 200% zoom, phone or human domain review was executed. Do not describe the isolated preview as an authenticated product feature.

Judging: Product/Creativity (meaningful prediction→consequence→explanation), Usability (native keyboard/reading alternative), Intelligence (deterministic source-linked formula); impact/traction, subject-expert validation, human/device accessibility and actual learning gain remain unknown.

## Next two dependency-ready tasks
1. **#55 owner**: independently review #97 and integrate focus management into the actual valve challenge, then test on authorised keyboard/screen-reader devices; no overlapping edit by this worker.
2. **Coordinator / #46 / #70 / #78 owners**: review source revision, replay, consent and owner-scoped draft contracts and allocate an authenticated evidence/resume integration branch after independent security review. No router/schema edits without explicit conflict check.
