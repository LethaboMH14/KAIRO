# Dataset provenance catalogue handoff

Worker A, `codex-data-catalogue-20261024-a` (Codex; exposed model `gpt-6`; effort `unknown`). Task `DATA-CATALOGUE-001`. Scope: `docs/data-catalogue-20261024/` and this handoff only.

## Why it matters

- **Product:** the source-to-review-to-lesson path needs exact source editions, revision/rights metadata and honest reuse states; learners need traceable explanations based on material the product can actually use.
- **Intelligence:** the proposed event plan supports a measurable transparent adaptation baseline; no learner forecasting model is implemented or validated.
- **Sustainability:** registry-first discovery and waiting for workload evidence avoids acquiring large corpora or adding a warehouse without a demonstrated cost/time benefit.
- **Impact:** a privacy-minimized evidence plan is a prerequisite to evaluating learner benefit; public benchmarks do not establish KAIRO gains or South African learner outcomes.

## Learner need and observable acceptance

Need: an adult learner can bring a source and receive source-linked practice without KAIRO silently using unlicensed public material or retaining unnecessary private learner data.

Acceptance evidence delivered: a structured JSON catalogue with 12 specific records, exact official URLs, licence evidence URLs, commercial-use classification, actual local status, limits and adoption decision; a readable storage/retrieval/analytics architecture; and a dated source register. JSON structural validation passed: 12 records, all required fields present and all values within the three-value `commercialUse` enum. Local registry table/FTS schema was inspected read-only. No private source records or contents were opened.

## Main findings

- OpenStax rights are edition- and component-specific. Current Principles of Economics 3e is CC BY-NC-SA 4.0 and its current page requires prior written permission for generative-AI ingestion. The official older 2018 Economics 2e PDF says CC BY 4.0, while the current 2e online page includes AI-ingestion permission wording and separate NC-SA terms for some components. The catalogue therefore leaves product-level commercial ingestion `unknown` pending written clearance; the old PDF header alone does not clear the whole current book or its third-party art.
- EdNet is CC BY-NC 4.0 research-only; the UFS SASL HLT repository is CC BY-NC-SA 4.0 and says commercialisation needs a formal data-sharing agreement. Neither is approved for commercial KAIRO model training.
- UCI AI4I is CC BY 4.0 synthetic machining data; it is not field motor/pump telemetry or learning data. Paderborn bearing measurements are experimental bearing signals and noncommercial without author permission. No pump-specific dataset with cleared commercial rights was identified.
- DocVQA public portal requires reading challenge download terms; the dataset licence was not established. PubLayNet's annotations use CDLA-Permissive-1.0, but IBM does not own the images, which must follow underlying PMC article terms.
- BigQuery is not present in active app code or cloud receipts searched. Firestore is the current operational record store for the hosted foundation; GCS holds only explicitly consented reviewed-text snapshots via the mounted adapter; local exact-offset lexical search is the retrieval path. Full hosted source/lesson UI migration remains incomplete.
- Official BigQuery documentation lists Johannesburg `africa-south1`; its ML support matrix lists imported models and built-in training there, with other training types/endpoints constrained separately. Pricing is currently $6.25/TiB for on-demand analysis in the Johannesburg pricing group after a pooled 1 TiB/month free/account. The default project on-demand query quota is 200 TiB/day with no per-user daily default. Proposed future jobs should use dry runs, strict custom quotas and `maximumBytesBilled` per query; these do not cap the entire bill.
- Proposed event minimization excludes source text, CVs, audio/video, free-text answers and inferred traits. It uses separate optional consent, a pseudonymous session and a proposed 30-day event retention; it is not implemented.

## Files and checks

- `docs/data-catalogue-20261024/catalog.json` — existing local registries/schemas, 12 research records, BigQuery/Firestore/GCS/retrieval comparison, proposal-only minimal event plan, judging mapping and gaps.
- `docs/data-catalogue-20261024/DATA-ARCHITECTURE.md` — plain-language current architecture, cloud pricing/location/ML/quota checks and evaluation limits.
- `docs/data-catalogue-20261024/SOURCES.md` — primary-source URLs and local source evidence, checked 2026-10-24.
- `node -e` JSON/schema check — passed; 12 records, 6 local registry/schema entries, all required fields present, exactly the allowed commercial-use values.
- Read-only SQLite schema inspection — confirmed `resources(id,metadata)` plus FTS5 metadata search columns (`id,title,domain,notes`); no metadata row content was queried.
- Source-only `rg` over active `studio/server`, public docs and `studio/src` found no BigQuery implementation; existing hosted handoff and source adapters were read for separation of roles.

No downloads, model calls, training, private file inspection, browser observation, runtime/schema/root configuration changes, cloud resource creation, BigQuery job, deployment or billing upgrade occurred. No performance, learning, market or production-readiness claim is made.

## Remaining gaps and next owner actions

Root should review the catalogue, then decide whether any exact resource merits a separate scoped acquisition/rights task. For commercial AI use, obtain written OpenStax clearance or select an independently licensed source. Preserve item-level source/revision/licence checks. Keep BigQuery deferred until opt-in event volume and an analytics question justify it; if later approved, implement only against a separate explicit schema/task and verify Johannesburg dataset/job location and per-query bytes caps. A consented learner study, rights review and complete hosted source-to-resume acceptance remain open.

Independent review is still needed; this handoff records research and schema evidence, not permission to acquire content, create cloud resources, train models or release product changes.
