# Issue #4 — measured source-index worker handoff, 25 October 2026

Session: `gpt6-kairo-i4-20261025-0541-a`, actual model GPT-6, exposed effort unknown. Remote GitHub connector branch: `feat/issue-4-source-index-20261025-a`, base `main@20183faf31fe30bc68e2fc70cb339e7fd24fce79`. Scope was posted to [Issue #4](https://github.com/LethaboMH14/KAIRO/issues/4) before edits. No access to the owner's canonical SQLite bus, no claim of local bus registration or inbox. No shared source contract/route/package edits.

## Changed paths — independently owned new files

- `studio/server/source-index/index.mjs`: v1 SQLite table/posting index, owner+trusted owner scope check, reviewed page hash check, atomic CAS reindex, revision-checked delete, owner delete, indexed lexical query and quote+offset source anchors.
- `studio/server/source-index/benchmark.mjs`: deterministic measurement of lexical recall and exact source-offset validation.
- `studio/tests/source-index.test.mjs`: 6 persistence, revision, deletion, owner isolation, rejection and unicode tests.
- `studio/tests/source-index-benchmark.test.mjs`: 1 multilingual synthetic baseline test with printed machine-readable result.
- `studio/tests/fixtures/source-index-v1.json`: versioned invented two-owner five-document/six-query fixture; **no learner data**.
- `docs/source-index-20261025/README.md`: proposed adapter contract, reproducibility, measurements, cloud provider/region/cost investigation, residual risks and approval gates.
- This handoff.

## Evidence actually produced in the available runner

- Node.js **v22.16.0**, npm **10.9.2**. It is *not* the mandated Node 24 environment.
- Isolated local source set under `/mnt/data/kairo-issue4`, not a cloned repository. `node --test --test-concurrency=1 /mnt/data/kairo-issue4/studio/tests/source-index*.test.mjs` → final **7/7 pass** (re-run after one initial failing negative fixture; the query had unintentionally included the word `induction` that existed in the expected source).
- Fixture exact result: recall@1 **5/6**, recall@3 **5/6**; structurally exact anchor precision **1.0**; cross-owner returned results **0**. Deliberate zero-hit synonym example remains. SQLite file with all five synthetic documents: **49,152 bytes** and **146 postings**. Tiny authored fixture only; not a realistic multilingual, semantic, scale or cloud billing benchmark.
- The environment's Git client could not resolve `github.com` (DNS failure); GitHub connector was used for new branch/commits. `npm ci`, complete serial Node 24 `tests/*.test.mjs` and `npm run build` in a full repo clone **not run here**; request fresh GitHub Actions validation and review. No provider live calls or deployment.

## Security/privacy and integration boundaries

Uses SQLite `secure_delete=ON`, but index removal is **not** complete account erasure, since drafts, backups, gateways, model logs and external systems need a reviewed lifecycle. Expected owner MUST come from authenticated server identity, not user input. Existing app remains on single reviewed-source lexical selection; this branch does not connect indexing to routes or present a production indexed RAG claim. Owner/day metering and external semantic consent are not changed. No secrets, live learner content, purchased resources, browser or microphone used.

**Judging criterion:** Intelligence — measured baseline with explicit failure, not fabricated semantic performance. Sustainability — documented database index and provider cost terms instead of assuming credits. Product — exact reviewed revision traceability while real journey integration stays separate.

## Next, dependencies and handoff contract

Coordinator: review `docs/source-index-20261025/README.md` proposed result shape/citation IDs against #3 and existing `evidenceFor` and #1; require synthetic Node 24 CI results. Review any shared-interface changes before another worker wires APIs. If source event integration is authorized, depend on authenticated owner/signed revision checks, durable Firestore adapter with idempotent change tracking, deletion/retention and scaled per-query/unit cost measurements.

**Next unblocked adjacent task:** #10's independent synthetic owner-isolation/deletion/recovery adversarial audit can inspect this new prototype and report gaps without changing shared routes. Do not claim #10 is reserved by this session, and coordinate its worker's existing tests/claims.

No merge, deployment, production access, IAM changes, or semantic provisioning has been requested.
