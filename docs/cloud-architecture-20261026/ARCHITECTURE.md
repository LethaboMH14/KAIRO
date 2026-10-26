# KAIRO cloud architecture and rollout decision

## Learner task and judging evidence

The supported task is: a learner brings a passage or document, reviews its extraction, receives source-linked teaching, practises, saves evidence and resumes. The current visual direction remains the selected C identity in `design/studio-ux-direction-20261026/02-whole-app-concept.png`, alongside `01-motor-context-concept.png` and `03-tablet-classroom-concept.png`: prominent KAIRO at the motor or classroom when teaching, a compact contextual teacher elsewhere, and tablet-to-board continuity. This infrastructure package supports **Product** (the source-to-resume journey remains available through failures), **Sustainability** (bounded operating cost and repeatable recovery) and **Intelligence** (source/revision-bound model calls are measured and auditable). It does not implement or visually mount those UI flows.

## Observed deployment (26 October 2026)

Read-only CLI evidence in `cloud-inventory.json` and `live-preflight.json` is limited to metadata:

- Project `kairo-access-20261021`, region `africa-south1`.
- Cloud Run `kairo-app` latest ready `kairo-app-full26b`, 100% traffic; image digest `sha256:2e74388c7fcd295501649d999b77fdaf83899bfea33e6f5a33f25ea505e41ffc`; 1 CPU, 1 GiB memory, max scale 20; runtime account `kairo-app-runtime@kairo-access-20261021.iam.gserviceaccount.com`.
- Cloud Run `kairo-core` latest ready `kairo-core-00003-qkw`.
- Invoker IAM contains the runtime service account only; no `allUsers` or `allAuthenticatedUsers` binding. Service ingress is `all`, so identity authorization is the decisive request gate; verify direct URL and intended reviewer access independently before widening access.
- Cloud Run secrets are bound by name to `kairo-groq-key` and `kairo-openrouter-key`; enabled version `1` exists for each. Payloads were not read.
- Firestore Native default database is in `africa-south1`.
- Storage includes `kairo-access-20261021-materials` and the regional Cloud Run source bucket in `africa-south1`, plus a Cloud Build bucket in US. Bucket lifecycle/versioning/backups were not inspected.
- Cloud Tasks queue `kairo-imports` is RUNNING in `europe-west1`; service metadata confirms that task location. An initial query against `africa-south1` was rejected as invalid and is not counted as a successful check.
- Monitoring alert listing did not return usable output. Billing export, remaining credit balance/expiry, spend cap eligibility, retention/deletion policy, backup restoration and Cloud Run cost were not verified.

The previous automated live preflight exposed a helper defect: gcloud has no configured default project, even though every resource query used the explicit project. The project check source is corrected; `live-preflight.json` must be regenerated and independently reviewed before the helper is considered accepted. Fixture preflight passes 5/5 checks and five scripts parse; receipt overwrite protection was executed. The shell bridge timed out on one subsequent multi-call preflight. No deploy, IAM, traffic, billing or retention mutation occurred.

## Architecture choice

Continue the existing managed design for the competition pilot:

```text
Vite/React/Three.js client
       │ authenticated HTTPS; explicit consent for paid/provider work
       ▼
Cloud Run kairo-app ──► Firebase Auth token verification / owner checks
       ├── Firestore Native (canonical learner records)
       ├── private Cloud Storage (source blobs; owner-bound access)
       ├── Cloud Tasks europe-west1 (bounded, idempotent import jobs)
       ├── Secret Manager (provider secret bindings; server only)
       └── existing managed/external model adapters (measured per provider)
```

The `kairo-core` service is already deployed; its responsibility, callers, identity, traffic, model endpoints, data access and cost are not yet verified by this package. Do not assume it is a model server or route traffic there until the owner reviews its exact interface and isolation.

An isolated Terraform proposal now exists in `infra/cloud-model-service-20261026/`. Its proposed interface is a separate digest-pinned `kairo-model-*` Cloud Run service plus one invoker grant for the existing app runtime account. Defaults are IAM-authenticated ingress, min 0/max 1, concurrency 1, request CPU, 2 CPU/2 GiB and 30 seconds. It does not create a service account, artifact registry, VPC, database, bucket, secret, GPU, GKE cluster or change app traffic. It cannot be applied until the model owner confirms the HTTP adapter and image digest, model licensing, startup and RSS measurements, and root approves quotas and a gross post-credit ceiling. Cloud Run-to-Cloud Run private ingress requires VPC routing; no such network was verified, so the proposal keeps ingress `all` and requires IAM rather than creating a paid VPC.

Use Cloud Run scale-to-zero for bursty stateless API endpoints; set explicit maximum instances, concurrency, request/job deadlines, token/page/audio limits and per-owner daily quotas. Queue only idempotent ingestion work. Keep job IDs, owner, source revision, bounded state and retry count; no duplicate lesson or paid inference on replay. No arbitrary external tool execution.

Keep Firestore as the existing canonical source for learner state and Storage for file bytes. Do not add PostgreSQL/pgvector as a second source of truth. Use the existing full-text/source index first; add vector retrieval only after same-source revision/relevance evaluation shows a gain. Separate public generic assets from private source objects, prevent cache/public ACLs, and maintain object/database deletion semantics together.

Prefer existing managed inference APIs for general teaching where privacy, latency and measured cost fit. A small separately hosted CPU model may be added behind a versioned adapter only after the model-owner handoff confirms its exact license, commit/revision, runtime and evaluation, and after an isolated service can run with bounded memory, request timeout, concurrency and no private-data retention. No weight was downloaded here. GKE/always-on GPU is not justified by the current observed requirements; revisit only with measured throughput or isolation needs and an explicit post-credit ceiling.

Terraform remains read-only discovery until its state/import plan is reviewed. Existing Terraform root `infra/ai-wave-20261025` is a `google_cloud_run_v2_service` data source. Do not apply a second manager against `kairo-app`, import without a single-writer plan, or add service/IAM/bucket/database/cluster resources as part of this package. Existing Dockerfile builds the current Node 24 service with local extractors; model weights must not be added to that image without the model owner and image-size/startup/cost evidence.

## Deployment, privacy and operations gates

1. Build exact reviewed source commit; run serial app checks, type/build and image scanner; record immutable image digest and commit receipt.
2. Run read-only preflight against explicit project/region/service and verify IAM, ingress, runtime identity, digest pinning, secret names/bindings and enabled versions (never secret contents).
3. Deploy a new revision with zero traffic or a separately authorized tag. Root owns the only traffic change. Confirm intended auth-denied/authorized synthetic smoke, saved synthetic source round-trip, provider timeout, cancellation, and retry idempotency. Do not use learner data.
4. Capture revision/image receipt, smoke status/latency, redacted request IDs and synthetic checks. Route traffic only after independent review and root approval.
5. Roll back by restoring a verified prior revision and its exact traffic allocation. Keep database migrations additive/backward compatible; rollback code cannot undo irreversible data changes.
6. Before real learner material: decide purpose-specific retention, expiry, user export/delete, object lifecycle, Firestore backups/PITR, audit redaction, restoration drill and region/legal review. No retention period or compliance claim is set by this package.

## Cost and controls

Use gross post-credit resource estimates for every workload. Maintain a provider usage ledger by request ID, owner-safe pseudonymous key, model, input/output units, retries, and measured latency; never log source text, auth tokens, secret values or full prompts. Cap model tokens/pages/audio duration, retries, per-user/day requests and Cloud Run max instances. Add alert policies for spend/error/latency only after confirming metric scope and delivery. Alerts notify; they do not cap spend. Verify any Cloud Run spend-cap feature's eligibility and affected resources before relying on it; downstream Tasks, Firestore, Storage, Logging, builds and providers remain separate cost paths. Record current credits and expiry from billing UI/API; historical credit notes are not current balances.

The proposed first controlled synthetic staging envelope in the existing cloud decision record is $30 gross, but this package does not authorize that spend. A coordinator must confirm remaining credits, free quotas, current billing account, all-service estimate, hard/soft cap coverage and named stop owner before any paid model call or new resource.

## Observable checks and gaps

- Automated local evidence: six PowerShell scripts parse; fixture preflight 5/5 including unset default-project sentinel; receipt refuses overwrite; malformed commit/digest, rollback target mismatch and smoke host mismatch are rejected. See `docs/cloud-rollout-20261026/validation.json`. Terraform CLI is not installed in the current execution environment, so the new module has not been fmt/validate/plan checked.
- Live metadata: Cloud Run image/traffic/identity, IAM, secret binding names and enabled versions, app/core services, bucket names/locations, Firestore DB location and import queue location/state were queried.
- Not validated: current source commit for `full26b`; actual secret permissions; authenticated user-owner isolation on current revision; URL smoke under approved identity; current alert policies; billing/credit balance; storage lifecycle, backup/restore, deletion retention; task retry/idempotency against production; real-device/browser or human learner acceptance.

Next acceptance: rerun `tools/cloud-rollout-20261026/preflight.ps1` to a sanitized JSON file; inspect current model-hosting chat output and approve exact adapter contract; deploy no traffic first only after root has an independently reviewed integrated candidate; then record synthetic staging evidence. Keep UI/browser claims tied to the selected references and actual mounted behavior, not this operations inventory.
