# KAIRO data roles and proposed analytics path

Checked 24 October 2026. This is a documentation-only assessment of public code contracts and existing status evidence. It changes no runtime, schema, cloud resource or private record.

## Current shape

```text
Official public links + reviewed curriculum metadata
        │                         (metadata registries; no blanket source rights)
        ▼
Learner selects private source → bounded extraction → human review → revisioned lesson
        │                                                     │
        │                                                     ├─ exact citation/offset retrieval
        │                                                     │  local lexical library; no vector service
        │                                                     └─ optional explicit consent
        │                                                        reviewed text copy → private GCS object
        ▼
Operational identity and records → hosted API → owner-scoped Firestore
        (current hosted backend; source/lesson UI migration remains incomplete)

Separate future path, only if measured need:
consented minimal learning events → redaction/retention gate → aggregate analytics
                                                       → optional BigQuery SQL/ML
```

## Keep the stores in their jobs

| Need | Current or proposed store | Evidence and boundary |
|---|---|---|
| Curriculum/course IDs and source/licence metadata | TypeScript curriculum registry, public link JSON, public research `catalog.json` and local SQLite/FTS5 metadata index | These are small registries, not a licensed source-text corpus. Curriculum registry code is not currently mounted elsewhere in `studio/src`. |
| Operational user records | Firestore | A real Firestore Native Standard database exists in Johannesburg and the hosted owner repository has conditional owner-scoped record operations. The source/lesson migration and full learner UI are not complete. Firestore fits point reads/writes, ownership and versioned records. |
| Reviewed file copy | Private GCS object | The current optional adapter saves an explicitly consented, reviewed-text snapshot keyed by source/revision; max 100 pages, 48,000 characters and 220 KiB. It does not copy an uploaded PDF/image. GCS is a file layer, not a lesson query engine. |
| Source passage lookup | Local exact-offset lexical retrieval | `source_index.py` searches reviewed/local chunks and preserves excerpt offsets. There is no active BigQuery, hosted vector database or production multi-tenant RAG index. |
| Product telemetry and evaluation | Not yet provisioned as an analytics dataset | Add only a minimal opt-in event schema if a defined evaluation question needs repeated event aggregation. Start with rules and descriptive SQL; do not infer learner traits. |
| Larger historical aggregates / optional ML | BigQuery proposal only | BigQuery is an analytical warehouse for bounded scans, grouped metrics and optional supported ML; it is not the operational source store, binary store or retrieval index. It can add scan/storage/ingestion/transfer costs and a separate regional/deletion policy. |

## BigQuery region, cost and ML check

Google's current location table lists Johannesburg (`africa-south1`) as a BigQuery region and lists built-in model training plus imported models there. The Johannesburg row does not list DNN/AutoML/hyperparameter training. Remote-model and generative endpoints have their own regional rules; a global endpoint explicitly gives no control or guarantee over processing location. A Johannesburg dataset alone therefore does not prove every ML step stays in Johannesburg.

The current official price table groups Johannesburg at USD $6.25 per TiB for on-demand query analysis, after 1 TiB free per month per billing account. This free allowance is pooled, not a per-project promise; table storage, ingestion, transfer and ML can add separate charges. Google's quotas page lists a 200 TiB/day default on-demand project query quota and no default daily per-user query limit. Those are broad service defaults, not acceptable KAIRO controls.

If later authorized, use a dry run and set `configuration.query.maximumBytesBilled` on every on-demand query, plus tight project and per-user custom query quotas. `maximumBytesBilled` rejects a query when the pre-execution estimate exceeds the specified cap; it does not cap storage, ingestion, egress, non-query jobs, another project, or account-wide spend. Do not use a spend alert as a hard cap. Set the dataset/job/bucket locations explicitly and check colocation before loading or querying Cloud Storage data.

## Smallest learning-event proposal

Use only when the research question is written down and separate optional analytics consent exists. Collect a random event ID, session-scoped pseudonym, coarse timestamp, event type, pseudonymous source revision and learning objective, attempt number, coarse outcome, hint count/type, elapsed-time bucket, selected modality/locale when needed, and the consent-policy version. Candidate events are source reviewed, practice attempted, hint requested, task completed, resumed and reading selected.

Exclude source files/text, CVs, audio/video/camera frames, free-text answers, names/emails and inferred traits. Keep identity mapping outside analytics. Proposed pilot retention is 30 days for row-level events, followed by deletion or coarse aggregation, with a learner correction/deletion path. This plan is not implemented, and no event dataset or learner forecast currently exists. Any adaptation claim would require consented data, a held-out-by-learner comparison against the transparent rule baseline, uncertainty and subgroup review; public EdNet data cannot substitute for KAIRO learners.

## Judging evidence and gaps

- **Product:** source lineage and permissions support trustworthy cited lessons; actual complete learner journey still needs parent integration and user acceptance.
- **Intelligence:** exact-source retrieval and proposed event evidence can support transparent rules; there is no trained learner model or validated forecast.
- **Sustainability:** delaying an analytics warehouse avoids avoidable fixed complexity; adoption should follow measured event volume and query cost.
- **Impact:** privacy-minimized evidence can test a defined study task; no public dataset establishes KAIRO learning gain, South African market reach or traction.

Research date: 2026-10-24. Confirm provider rates, quotas, locations and each item licence again before any acquisition, deployment or product claim.
