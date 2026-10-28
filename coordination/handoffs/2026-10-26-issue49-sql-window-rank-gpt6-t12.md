# Issue #49 — isolated SQL window-ranking challenge handoff (26 October 2026)

Session: gpt6-i49-window-rank-20261026-t12. Client: ChatGPT. Model: GPT-6. Effort: unknown.

## Ownership and dependency boundaries

Based on main b12ba1054f2b3918cd1588df61df14ef8cda5f0e after #113. The canonical owner's SQLite coordination bus is not exposed to GitHub; issue #49 plan comment is a **cooperative remote-only claim**, not an atomic bus reservation. Reconcile it before integrating. The requested pump-what-if subtree and test are already owned by draft PR #55; #80/#84/#97/#106 and other studio PRs have separate scopes. PR #53 remains unmerged, so no Kaggle edits. PR #54 was closed without merge; do not claim a running Codex session.

All edits are **new-only**:
- studio/src/studio-scenarios/sql-window-rank-20261026/model.mjs
- studio/src/studio-scenarios/sql-window-rank-20261026/model.d.mts
- studio/src/studio-scenarios/sql-window-rank-20261026/SqlWindowRankLab.tsx
- studio/src/studio-scenarios/sql-window-rank-20261026/preview.tsx
- studio/src/studio-scenarios/sql-window-rank-20261026/preview.html
- studio/tests/sql-window-rank-20261026.test.mjs
- this unique handoff.

No shared router, global CSS, manifests, lockfile, existing scenario, server/auth, IAM, paid provider or production change.

## Learner job and evidence

A learner selects a fictional five-row score table, a PostgreSQL window function (ROW_NUMBER, RANK, DENSE_RANK), and a target row. They predict the output, explain it, then inspect a row-by-row trace and make a second distinct attempt. The 2D/reading React view uses native keyboard controls, labelled inputs, explicit result focus, score tables and no 3D/voice/network requirement.

The prepared model implements PostgreSQL 18 section 9.22 (https://www.postgresql.org/docs/18/functions-window.html). ROW_NUMBER explicitly orders by score DESC **and ID ASC** to break ties; RANK and DENSE_RANK order only by score DESC so equal scores are peers. Three synthetic five-row boards; 45 deterministic combinations; independent count-based oracle; action-only two-attempt replay; strict version/shape bounds and forged-output rejection.

Judging: Product (correctness and trace), Creativity (predict → inspect consequence), Usability (reading/native controls), Intelligence (transparent deterministic source model), Sustainability (reusable isolated contract). Impact, learner efficacy, human/device UX, institutional traction and expert review are **not evidenced**.

## How to run and boundaries

From studio after npm ci on Node 24:
- node --test --test-concurrency=1 tests/sql-window-rank-20261026.test.mjs
- npm run build
- npm test

Vite dev preview path: /src/studio-scenarios/sql-window-rank-20261026/preview.html . It is **not** mounted in the authenticated StudioRouter. Local session state is page-memory only; nothing is uploaded or certified. It is not a live PostgreSQL executor, real student data, verified account evidence, an official grade or a Kaggle-trained model.

At handoff creation: exact-head GitHub Actions and device/browser tests **pending/not run**. Record actual workflow results in issue #49 and PR before acceptance; do not infer success from previous main or PR runs.

## Next dependency-ready work

1. Independent SQL-domain, accessibility and privacy review of this isolated draft; authorised keyboard/screen-reader/mobile/200%-zoom browser acceptance (not yet performed).
2. Coordinator reconcile canonical local bus and route ownership, then connect **one reviewed** Studio activity into the authenticated source → practice → evidence → resume journey with genuine end-to-end regression, subject to #34 conditional merge gates. No direct merge or deployment from this worker.
