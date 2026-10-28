# Issue #49 — PostgreSQL snapshot trace, scoped worker handoff (25 October 2026)

- Session: gpt6-kairo-pg-snapshot-20261025-t11; ChatGPT GPT-6; effort unknown.
- Base: main@b8a81d14aeb27d5a1c186fb21871f472656798b5.
- Remote-only cooperative claim posted to Issue #49. Owner's canonical SQLite coordination bus is **not accessible** through GitHub; no local claim or independent owner consent is asserted.
- Files: new studio/src/studio-scenarios/pg-snapshot-trace-20261025/**, new studio/tests/pg-snapshot-trace-20261025.test.mjs, this new handoff only. No shared routes, CSS, package files, server/auth, #55 pump, #53 Kaggle or other worker files.

## Learner and judge value

A Computer Science learner selects PostgreSQL READ COMMITTED versus REPEATABLE READ, timing of a second transaction's update/commit and a small fictional value. They predict and explain A's second SELECT before a stepwise reading trace is revealed, then try a distinct second case. This is a real runnable local activity with semantic keyboard-native controls, no 3D dependency and an independently computed oracle. It targets Product (usable learning interaction), Creativity (visible consequence), Usability (reading fallback) and Intelligence (checkable reasoning rather than an unverified AI score).

Official concept source: PostgreSQL 18, *Transaction Isolation*, §13.2, https://www.postgresql.org/docs/18/transaction-iso.html. Source/model revisions are recorded. KAIRO authors the fictional numbers and narrow trace. The model **does not** implement real PostgreSQL, locks, writes by A, serialization failures or actual DB execution. It must not be used as professional database assurance. No private source, Kaggle data or learner account is accessed.

## Test and release boundary

Run cd studio && node --test tests/pg-snapshot-trace-20261025.test.mjs and the repository Node24 serial tests/build in CI. 36 prepared combinations and negative replay cases are covered. Record exact-head CI separately; no prior PR's results transfer. Attempts are **local-unverified**, held in page memory, not authenticated/persisted, and cannot prove who supplied them. Synthetic scenario and automated SSR checks do **not** establish real keyboard/screen-reader/device acceptance or learning gains. No production route was mounted, merged or deployed.

## Next dependency-ready tasks

1. Independent PostgreSQL domain and accessibility review, with explicit human/device testing only when authorized; return errors to this isolated branch.
2. After review and coordination-bus reconciliation, ask the StudioRouter/source/evidence owners to mount one reviewed source-linked scenario and consented attempt persistence under their own claims. Do not silently edit their files.

Issue #50 remains blocked by unmerged PR #53 for this worker; Kaggle-hosted training **NOT RUN**.
