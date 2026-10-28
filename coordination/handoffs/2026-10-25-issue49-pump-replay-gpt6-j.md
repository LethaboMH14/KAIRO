# Issue #49 — pump draft evidence deterministic replay prerequisite

**Date:** 25 October 2026. **Session:** `gpt6-kairo-pump-replay-20261025-1407-j`, ChatGPT GPT-6, effort setting unknown. **Base main:** `0fabfdf9b8515cab8ff4100228a6a1df672491c6`. **Task:** PUMP-REPLAY-49-J, remote-only cooperative GitHub claim recorded in Issue #49. Canonical local `coordination/bus.sqlite3` unavailable: NOT registered/claimed there, no locks cleared or inferred.

## Why this slice

Existing pump what-if work is owned by PR #55; other Computer Science demos #57/#58/#60/#62/#66, acceptance PR #27 and local attempt review PR #64 have distinct claims. PR #53 (Kaggle foundation) remains unmerged, and PR #56 owns a separate Kaggle public benchmark. PR #54 is unmerged; no real Codex worker execution was observed. More standalone scenes without integration would not address the source→lesson→studio→evidence gap. This bounded slice verifies existing **main pump lab** draft consistency via independent replay without touching a shared host.

## Exact owned new files

- `studio/server/studio-evidence-replay/audit.mjs`: fail-closed replay and recomputation of pump draft evidence from bounded canonical action log; reject forged/changed evidence, extra metadata, unknown action fields and wrong trusted expected session ID. Privacy-minimal, no raw action/notes output, SHA-256 fingerprint.
- `studio/server/studio-evidence-replay/README.md`: precise server-only interface, limitations and future auth/source/revision bridge.
- `studio/tests/studio-evidence-replay.test.mjs`: nine tests covering valid local draft, altered results, changed action log, expected session mismatch, extra fields, invalid actions, oversized/circular payload, empty run and privacy.
- This unique handoff file.

No shared `StudioRouter`, `PumpHost`, physics, model, existing API, global CSS, root manifest/lockfile, CI workflow, secrets, local bus, production cloud or other workers' paths changed.

## Observable benefit and acceptance

**Product / Intelligence / Usability / Sustainability:** future authenticated evidence endpoints can independently reject forged client-side draft summaries instead of trusting a client-reported score. A valid replay is only `replayed-local-draft-only`, with `ownerVerified:false`, `sourceRevisionVerified:false`, `competencyExternallyVerified:false`, `publishable:false`. The underlying pump coefficients are illustrative and not expert-certified. A matching SHA-256 is NOT authentication; client-authored logs can be fabricated. No learner outcomes, browser/device checks, Kaggle-hosted runs, or external user tests claimed.

## Checks and status

Code authored through authenticated GitHub connector on an isolated branch; container Node **22.16.0** exists but has no GitHub DNS access or repo checkout, so **local Node24 tests/build NOT RUN**. Exact-head GitHub Actions Node24 regression/build/Python bus CI will be required after draft PR opens. Until then test result is **NOT VERIFIED**. Security/privacy independent review and canonical bus reconciliation remain mandatory before any merge under PR #34.

## Next two dependency-ready tasks

1. Independent reviewer checks this new replay gate and draft PR #64 for truthful evidence semantics, exact-head CI and ownership; coordinator reconciles canonical local bus. Do not self-approve.
2. After #46/#47 reviewed owner/source-revision contracts, coordinator assigns a separately claimed **authenticated** server evidence write bridge with real owner/lesson/source binding, replay idempotency and consent/retention tests; integrate UI only after authorised browser/device acceptance. No production deployment approved here.
