# PostgreSQL, pgvector and offline ML

**Recommended direction:** server PostgreSQL/pgvector for the proposed canonical account service; a carefully bounded **PGlite/pgvector** subset on capable devices; cached reading/lexical search/notes as the smallest offline tier. This refines the existing core architecture rather than creating a competing canonical database.

## What each piece does

- PostgreSQL stores structured records, revisions, relationships and transactions.
- pgvector stores vectors and performs similarity search; it does not create embeddings or answer questions by itself.
- An embedding model transforms text/query into compatible vectors. Query and document vectors need the same model/version/dimension/normalisation and any required input prefixes.
- A generation model is optional for composing a new answer. Saved explanations, deterministic diagrams and exact retrieved excerpts can work without one. A local LLM introduces a separate download/memory/latency/rights/quality requirement.

[PGlite's official docs](https://pglite.dev/docs/about) describe PostgreSQL compiled to WASM for browser/Node/Bun, with IndexedDB or filesystem persistence and pgvector support. The [extension catalogue](https://pglite.dev/extensions/) currently uses a separate `@electric-sql/pglite-pgvector` package. Use the official `@electric-sql` packages, not a similarly named unrelated project found in search.

## Concrete device tiers

| Tier | Saved capabilities | New online-dependent work |
|---|---|---|
| Reading | Selected reviewed text, citations, notes, authored practice, lightweight diagrams and downloaded audio | Fresh web facts, new cloud narration/answers, remote account operations |
| Local retrieval | Above plus a bounded PGlite/pgvector pack and a compatible local embedding model, if measured viable | Uncached sources and cloud generation |
| Local tutoring experiment | Above plus a suitable quantized local generation model after quality/performance/licence evaluation | Anything outside its supported sources/capabilities |
| Desktop | Optional actual local PostgreSQL service or PGlite filesystem DB, larger local model budget | Still needs explicit sync/identity/cost design |

Do not force PostgreSQL server installation onto every learner phone. PGlite is a more suitable browser candidate, but IndexedDB quota, persistence denial/eviction, WASM memory, concurrent tabs and device thermal behaviour still require testing. A cloud PG instance cannot be queried when disconnected unless the required authorised subset already exists locally.

## Proposed local pack

Manifest includes `packId`, version, source revisions, owner scope, rights/purpose, locale, expiry/refresh policy, model/embedding identifiers, vector dimension, byte counts, hashes and required app/schema versions. Store text/IDs/vector metadata in the local DB; large audio/model/3D files belong in controlled file/cache storage. A DB row saying “download complete” must follow verified bytes, not precede them.

Download only learner-selected permitted content. Keep private and public packs scoped separately and isolate account switches. On a shared device, offer removal of private copies at sign-out. Encryption and key lifecycle need a deliberate design; PostgreSQL/WASM/local storage does not automatically encrypt private data. A local SQL owner predicate is a correctness guard, not an adversarial multi-tenant security boundary when the device user controls the database.

Use [PGlite's worker guidance](https://pglite.dev/docs/multi-tab-worker) to keep queries off the UI thread and coordinate a single database leader across tabs. Test leader closure/election, worker crash, simultaneous pack imports and schema upgrade. Do not assume running two separate DB instances on the same browser storage is safe.

## Retrieval and sync

1. Resolve user/session and chosen source/lesson revision.
2. Filter by scope, reviewed/published state, rights, deletion/withdrawal, expiry policy and compatible embedding version.
3. Combine lexical/identifier lookup with vector candidates if an actual retrieval benchmark justifies it. A scalar exact filter must not be replaced by a vague similarity guess.
4. Return exact spans/citations and an explicit coverage limit. No retrieved web/document text can issue tool commands.
5. If offline generation is unavailable, show saved source-backed text/diagrams and queue the learner's unsent question visibly.
6. Reconnect with revision-aware idempotent sync. Re-authorize server-side. Preserve both note versions on conflict; never replay applications/submissions or overwrite a newer assessment automatically.

A permission withdrawal cannot always retract bytes already held by an offline person. Prevent further access/sync according to the device/key design, withdraw future downloads, purge on reconnect and disclose that limit rather than promising instantaneous remote erasure.

## Local model route

[Transformers.js](https://huggingface.co/docs/transformers.js/en/index) is a browser/Node inference runtime candidate, including feature-extraction pipelines; exact model/ONNX/runtime compatibility, checkpoint rights and measured languages remain to choose. Do not turn English embedding performance into a Setswana/isiZulu claim. Benchmark course codes, technical terms, formulas, multilingual queries and relevant exact spans. Quantization, first-load, resume, storage and memory budgets are measured separately from database query time.

Start by comparing the existing lexical source search against a permitted small embedding benchmark. Models can be downloaded opt-in on Wi-Fi and hash/version pinned; no automatic large model download or private cloud upload. Learner attempt data is not training permission.

## Actual probe result

`pg-spike/package.json` pins PGlite 0.5.11 / pgvector package 0.0.12; its own lockfile records integrity. `npm test` ran under Node v24.18.0 with PGlite reporting PostgreSQL 18.6 WASM. It verified extension loading, cosine search, owner/review/revision/model conditions, close/reopen filesystem persistence and deletion exclusion using **three-dimensional synthetic fixture vectors**.

The one recorded end-to-end local probe took about 29 seconds, including initialisation and reopen. It is not a query latency benchmark, browser/phone measurement or release budget. No embedding checkpoint, semantic text retrieval, generation model, IndexedDB browser run, network instrumentation or app integration was performed. See `pg-verification.json` for exact evidence. The probe's `.probe-data` contains only its synthetic fixture records.

## Next acceptance gate

Propose the shared storage adapter and pack schema; benchmark browser worker/IndexedDB persistence using synthetic fixtures only when browser review is authorised. Test malformed/partial packs, version mismatch, vector dimension/model mismatch, no storage, eviction, reload/offline cold start, account isolation, stale owner/source rights and conflict recovery. Then select a small permitted embedding model and evaluate it against lexical search. No migration/deployment until the integrating owner accepts a versioned contract.
