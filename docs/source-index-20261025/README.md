# Issue #4 — measured persistent source-index prototype (2026-10-25)

Status: **isolated prototype on a feature branch; not connected to production RAG.** Uses no external network or paid embedding calls. See [Issue #4](https://github.com/LethaboMH14/KAIRO/issues/4).

## Contract proposed for coordinator review

Module: `studio/server/source-index/index.mjs`. Built-in Node 24 `node:sqlite`, schema `user_version=1`. Own database path; not the canonical collaboration bus, AI gateway ledger, or Cloud Run filesystem.

- `createSourceIndex(path)` exposes `upsert({ownerId,expectedOwnerId,source,expectedRevision?})`, `search({ownerId,expectedOwnerId,query,limit?})`, `deleteSource({ownerId,expectedOwnerId,sourceId,expectedRevision})`, `deleteOwner({ownerId,expectedOwnerId})`, `stats({ownerId,expectedOwnerId})`, `close()`.
- The caller **must** derive `expectedOwnerId` from trusted authentication; do not pass two user-supplied owner values. It rejects mismatches, stores composite owner keys and filters SQL by owner. This alone does not authenticate a caller.
- Only `reviewed:true` sources with matching SHA-256 `revision = hash(JSON.stringify(reviewedPages))` enter the index. The revision rule matches `studio/server/workspace/model.mjs`, but currently reads no app route. Source fields: `id`, `title`, `ownerId` (optional if proven by caller), `reviewed`, `reviewedPages` (`text,locator,edited`), `revision`.
- Reindex requires `expectedRevision` equal to the indexed previous revision; SQLite transaction removes old chunks/postings atomically. Stale updates or deletes return status 409. Re-indexing the identical revision is idempotent.
- Search uses persisted owner-filtered Unicode NFKD/accent-insensitive lexical postings, not external embeddings. Bounded query length 1,000, top-k 1–12, up to 16 query terms, 1,400 UTF-16-code-unit page chunks. Returns `sourceId`, source `revision`, locator, start/end offsets and exact quote, with an index-unique `id` of `encodeURIComponent(sourceId)::S{pageIndex+1}-{start}`. **This is a proposed index anchor, not yet the app's evidence ID contract.**
- Deletions cascade from documents to chunks and postings with SQLite `secure_delete=ON`. Remaining file space may not shrink; backups, retained model outputs, drafts, other databases, logs and cloud replicas require separate lifecycle integration. There is no automatic observer of Firestore source changes.

## Tiny reproducible baseline — synthetic data, not language acceptance

Command actually run on the **isolated local file set**, Node **22.16.0**:
`node --test --test-concurrency=1 /mnt/data/kairo-issue4/studio/tests/source-index*.test.mjs` → **7/7 pass** after changing the one deliberately negative synonym query that initially used a source term. This run was **not** the repository's Node 24 full test/build baseline. Node 22 printed an experimental SQLite warning.

Fixture: `studio/tests/fixtures/source-index-v1.json`, 5 authored synthetic documents (4 one owner, 1 other owner), 6 query-to-source judgements: English, isiZulu-labelled, Afrikaans-labelled, Sesotho-labelled, mixed vocabulary and one synonym miss. Labelling does not certify language correctness; seek language-speaker review before any learner claims.

| Metric | Local measurement | What it does and does not show |
|---|---:|---|
| Recall@1 / Recall@3 | **5/6 = 83.3%** each | Expected source in top 1/top 3 among 6 trivial synthetic questions; one intentional lexical synonym failure |
| Exact citation anchor precision | **100% of returned chunks** | Offsets, revision, title/locator and quote exactly match fixture text; **not** factual entailment, suitability or scholarly citation quality |
| Cross-owner returned sources | **0** | Fixture only, plus negative read/write/delete mismatch tests; not a full security review |
| Index size | **49,152 bytes** | One local SQLite file containing all five synthetic docs, 146 token postings; **not** per-owner or cloud storage billing, not an at-scale cost estimate |
| Persistence/delete/reindex | **Passing focused tests** | SQLite close/reopen, CAS, old-term invalidation, owner partition, bound checks; no cloud recovery or retention test |

Run focused checks within a genuine Node 24 repository checkout: `cd studio && node --test --test-concurrency=1 tests/source-index*.test.mjs`. Required overall integration gate remains `npm ci` then `node --test --test-concurrency=1 tests/*.test.mjs` then `npm run build`, plus GitHub CI. This runner has Node 22 only and cannot resolve github.com via Git, so these repo-wide gates remain **pending**, not passed.

## Provider, residency and unit-cost investigation — no provisioning

- **Zero-provider lexical baseline**: this prototype adds no npm dependencies or remote inference. Persistent SQLite works for one process / controlled local evaluation, **not** shared ephemeral Cloud Run storage across instances. Durable hosted ownership must reuse an approved database and revision event flow rather than copying this file into Cloud Run.
- **Existing regional Firestore**: Firestore offers Johannesburg `africa-south1` regional storage. Current free quota for a single eligible database is 1 GiB storage, 50,000 reads/day, 20,000 writes/day and 20,000 deletes/day; index-entry reads, stored bytes, network egress, backups and named databases may incur costs. Confirm actual project database, edition, exact SKU, index shape and billing before committing to cost claims. [Firestore regions](https://docs.cloud.google.com/firestore/docs/locations), [Firestore pricing](https://cloud.google.com/firestore/pricing).
- **Firestore vector alternative**: Firestore supports prefiltered KNN with a vector index, but requires separate embedding generation and limits stored vector dimensions to 2,048. Composite filters must guarantee owner/reviewed revision; vector indexing adds write/storage/read work. No vector collection/index was created. [Firestore vector docs](https://firebase.google.com/docs/firestore/vector-search), [Firestore index/read pricing](https://firebase.google.com/docs/firestore/pricing).
- **Google Vertex embeddings option**: existing read-only app adapter uses `gemini-embedding-001`, 256 dimensions, and defaults to `us-central1`, distinct from Johannesburg records; its optional metered path is off by default. The generic location directory listing `africa-south1` for machine-learning services **does not prove this exact model supports that region**; verify model-specific regional availability and data processing terms before any learner transfer. A newer `gemini-embedding-2` exists but is **incompatible** with `gemini-embedding-001` embeddings and would require versioned full re-embedding. [Vertex model docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings), [region directory](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/general/locations), [model version notes](https://ai.google.dev/gemini-api/docs/embeddings).
- **Cost model to evaluate, not a bill**: `monthly_cost = storage_GiB_month * local_region_storage_SKU + billed_document_reads * read_SKU + billed_index_reads * index_read_SKU + writes * write_SKU + deletes * delete_SKU + network_egress_GiB * egress_SKU + optional_embedding_input_units * approved_model_SKU + rerank_request_cost`. Evaluate initial full indexing and every source edit (full reindex), owner deletion, churn, and per-search reads on measured representative corpora, with quota/alert policy. Price/quotas are subject to change; no current account budget or provider bill was read. [Model pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing).

## Explicit gates before app integration

Coordinator approval of interface, correct authenticated UID binding, real reviewed source lifecycle/deletion event hook, compatibility with pending #3 multi-source evidence IDs and revision verification, Firestore storage adapter design, crash/recovery and concurrency tests, realistic consented multilingual evaluation with reviewed relevance/grounding labels, retention/backups and provider privacy/region/cost sign-off. No browser, microphone, cloud provisioning, IAM or private learner data accessed.

**Judging connection:** Intelligence: retrieval is measured against an explicit lexical baseline and admits the synonym failure. Sustainability: unit economics and default no-bill fallback are made reviewable. Product/Usability: exact cited source revisions remain essential, but the live learner journey has **not** been altered by this PR.
