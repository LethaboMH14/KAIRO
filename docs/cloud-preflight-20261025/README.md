# KAIRO Cloud preflight — Issue #8 (25 October 2026)

Session: gpt6-issue8-cloud-preflight-20261025-0539; ChatGPT GPT-6, effort unknown. This is a **read-only implementation and source-based assessment**, not a verified live cloud account audit, deployment or estimate of the owner's invoice. Criteria: Sustainability, Product, Usability, Intelligence and Impact.

## Service state: dated repo evidence versus current authenticated evidence

| Service | Historical evidence in repository | Verified live here? | Next required check |
|---|---|---|---|
| Google Cloud Run | IAM-private kairo-app in africa-south1, deployed revision kairo-app-00007-snn with full traffic reported 25 Oct | **No** GCP management account/CLI | Service describe, ingress, revision/traffic, service-level + inherited IAM, build provenance, external access route |
| Firebase Authentication | HttpOnly server sessions, UID security checks and two synthetic judge identities documented | **No** | Auth config, revocation, account recovery and synthetic owner-isolation probes |
| Firestore | Backend-only owners/hashed-UID paths, immutable revisions and CAS; Johannesburg described | **No** | Database location, PITR/backups, retention, rules/IAM and independent restored synthetic records |
| Google Cloud Storage | Owner-private originals, earlier seven-day soft delete | **No** | Bucket location, uniform access, public access prevention, IAM inheritance, soft delete and versioning; no object reads |
| Cloud Tasks | Durable import queue in europe-west1; UID/job-ID metadata transferred, worker OIDC | **No** | Queue state/region, then separate authorization for synthetic-only worker/OIDC/retry acceptance |
| Vertex / speech | Server credentials, consent and global caps; optional us-central1 embedding OFF | **No** | Exact processing region, provider retention, spend and model quotas |
| Logs, secrets, billing | Server-side configured providers, app gateway reservations | **No** | Independent billing read-only SKU/spend/quotas, log retention/access and secret-policy metadata review, never private content |
| Hugging Face | Connector identity check | **Yes, authentication**: account LethaboMH14, non-Pro; read-repos/read-mcp/jobs scopes | Usage balance, model cost, region, retention and jobs quota **not verified**; no model/Jobs calls |
| Azure | User stated prior access; no current Azure management connector or az executable | **No** | Tenant/subscription auth, actual costs, selected model region, retention; no provisioning |

Sources: AGENTS.md, README.md, coordination/README.md, coordination/handoffs/2026-10-25-ai-integration.md, docs/ai-integration-20261025/ARCHITECTURE.md, docs/connected-release-20261024/README.md, and infra/ai-wave-20261025/main.tf. Existing Terraform root is a Cloud Run **data source only**. It was read but not planned/applied or taken over. Google Drive authentication does not establish Google Cloud project access.

## Implemented bounded CLI

Run offline with zero cloud calls:

    node tools/cloud-preflight-20261025/preflight.mjs
    node --test tools/cloud-preflight-20261025/preflight.test.mjs

Only an explicitly authorized reviewer with an already-configured gcloud CLI should invoke metadata reads:

    node tools/cloud-preflight-20261025/preflight.mjs --live --project kairo-access-20261021 --region africa-south1 --service kairo-app

Optional --bucket BUCKET adds bucket describe/IAM; --queue NAME --tasks-location europe-west1 adds queue describe. The CLI validates identifiers and uses a fixed read-only gcloud command allowlist without a shell. It emits sanitized summary fields, never raw memberships, credentials, object/document contents or cloud stderr. Missing permissions stay not-verified. Absence of public members in one returned resource IAM policy does NOT prove privacy: inherited IAM, front-end routing, network, Firebase and app owner controls remain unverified. Metadata calls may still be metered; check owner approval/budget before live use.

## Public prices and formula-based scenarios (USD, checked 25 Oct; NOT an account quote)

| Option | Concrete published public costs and usage example | Processing privacy and decision |
|---|---|---|
| Existing CPU Cloud Run | Example Tier 1 active CPU $0.000024/vCPU-second, memory $0.0000025/GiB-second, requests $0.40/million. **Illustrative** 100k requests × 0.2 billed seconds on 1 CPU/1 GiB = 20k×(0.000024+0.0000025)+0.04 = **$0.57 pre-free-tier**. Excludes Johannesburg actual SKU, rounding, idle, egress, logs, revisions, and other services. | africa-south1 per repo; keep managed. Owner-approved rollback to prior revision if necessary. |
| Firestore Standard | One eligible database free allowance: 1 GiB, 50k reads/day, 20k writes/day, 20k deletes/day, 10 GiB outbound/month. Backups/PITR/restore/TTL and overages may cost extra; indexes count. | Location and owner isolation require separate live checks; approved synthetic backup/restore before relying on recoverability. |
| Cloud Tasks | First **1 million billable operations per month free**, next tier $0.40/million. Example 10k creates + 10k push attempts ≈ 20k operations; retries and 32-KiB chunks increase cost. | Queue europe-west1 carries UID/job metadata; no task creation or queue mutation in this PR. |
| Hugging Face Inference Providers | Public free-account monthly inference credit **$0.10**, subject to change. Connected non-Pro account verified; actual remaining credit, extra spend and provider-specific per-token pricing unknown. | Serving region and data retention unverified. Keep all new HF model/Jobs use OFF pending separate approval. |
| Azure Foundry | Pay-as-you-go price varies by selected model, deployment class, region and tokens. **Worked volume example:** 1,000 calls with 3k input + 1k output tokens = 3M input + 1M output; USD = 3 × input-rate-per-million + 1 × output-rate-per-million. Account rates unknown; provisioned capacity may incur idle charges. | GlobalStandard may process in any Azure region; DataZoneStandard within designated US/EU/APAC zone, Standard within chosen Azure geography where offered. Do not infer inference residency from resource region. |
| New GPU, GKE, self-hosted models | GPU hourly rate + minimum vCPU/memory + idle and egress, quota and weights licence unresolved. | No measured need; defer provisioning entirely. |

Official public sources: [Cloud Run pricing](https://cloud.google.com/run/pricing), [Firestore pricing](https://cloud.google.com/firestore/pricing), [Cloud Tasks pricing](https://cloud.google.com/tasks/pricing), [Hugging Face pricing](https://huggingface.co/docs/inference-providers/pricing), [Azure model processing regions](https://learn.microsoft.com/en-us/azure/ai-foundry/foundry-models/concepts/deployment-types), [Google spend-cap limitations](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps). Historical $300 credit is NOT a current verified balance. Alert-only budgets are not a hard spend limit; eligible spend caps can lag/overshoot and exclude other services.

## Least-privilege staging and rollback plan — proposal, no changes

1. Owner identifies existing project and approved short-lived read-only reviewer identity. No new service keys, project changes, broad roles, paid resources, secret access or real learner copies.
2. After checking SDK permissions, consider a custom metadata-only role with run.services.get, run.services.getIamPolicy, datastore.databases.get, storage.buckets.get, storage.buckets.getIamPolicy, cloudtasks.queues.get as applicable. No secretmanager.versions.access, contents/list objects, billing edits, run.admin or setIamPolicy. Inspect project-level grants only with separate scoped approval.
3. Record sanitized service revision/traffic, ingress, bucket public principal presence, database location/PITR, soft delete and queue state. Separate synthetic account-isolation, deletion and restore exercises must be authorized; do not post logs/IAM identities publicly.
4. Record actual cloud billing quotas, unit SKUs, credits expiry, budgets, model input/output p50/p95, consent and provider residency. App reservations are not provider invoices or hard spending stops.
5. If a separate owner authorizes staging: use synthetic-only canary, explicit model kill switch, fallback to extractive reading, test denial/recovery, and name manual rollback owner. No production rollout, traffic split, Terraform apply or Azure/HF deployment under Issue #8.

## Actual runner evidence and remaining checks

Available runner Node v22.16.0 (NOT Node 24), no checked-out KAIRO repo or local canonical coordination SQLite bus, and no gcloud/az/Terraform executable. git ls-remote could not resolve github.com; GitHub connector used for branch/commits. Focused test first **6/7** due a duplicated test fixture flag; after fixing, **7/7**; node --check both files and offline script succeeded. No live --live invocation was made. Full Node 24 studio npm ci, serial all-tests and build are **PENDING** until appropriate CI/checkout available. Previous 25 Oct 741/741 and cloud checks are historical, not rerun. No deployment/IAM/cloud resource/data mutation or browser/microphone use.
