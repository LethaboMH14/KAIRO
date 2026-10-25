# Hosted pilot: concrete dependency order

This continues docs/blueprint/core/CLOUD-RUNBOOK.md and docs/judging-cloud-20261023/CLOUD-DECISIONS.md. The user now requests starting hosted delivery; a previous research recommendation alone was not deployment authorisation. Do not upgrade billing, run GPUs or silently create paid database capacity. No deployed-service claim until remote checks pass.

Current app uses loopback origin checks, local SQLite/files and process-local extraction work. These are real deployment blockers: public hosting alone would not supply owner isolation or durable jobs. Do not remove the loopback guard and expose the shared workspace.

Preferred initial path: existing Vite SPA on Firebase Hosting or Cloud Run static serving; Firebase/Identity Platform login; Cloud Run API with attached service identity; private Cloud Storage objects; one canonical relational database following the blueprint (managed PostgreSQL option and cost require an explicit scoped decision); Cloud Tasks for bounded durable extraction/generation jobs. Do not silently duplicate canonical state in Firestore merely because it is available. Guest identity may be anonymous Firebase identity with strong quotas and a documented retention period; institutional verification requires invitation/roster authorisation. A shareable public synthetic demo is a separate, read-only surface from private upload processing.

| Gate | Required concrete result |
|---|---|
| Resource inventory | Current project, enabled APIs, deployed services, region, identity and billing state inspected without tokens in logs |
| Auth boundary | Expired/invalid token rejected; guest A cannot read/write/export/delete B's source/lesson/files; invitation scope cannot be self-promoted |
| Storage migration | Private objects and row owner IDs; restart retains reviewed revision, source, job and progress; signed URLs bounded and owner-checked |
| Upload/job limits | File/page/type caps, bounded queue/retries, idempotency, per-user generation caps, cancel stops later publication |
| Privacy | Consent before model/upload processing, private default, CV optional, retention/deletion/export and incident contact published |
| Runtime | PORT and Cloud Run network binding work, host/origin policy uses explicit configured production origins, secrets via identity/Secret Manager |
| Cost | No new GPU; model limits and max instances; current allowances verified; alerts do not imply a hard universal spending cap |
| Friend acceptance | New account on deployed URL uploads supported material, reviews extraction, makes cited lesson, practises and resumes after restart; second account isolation verified |
| Failure/rollback | Reading/drawing available during model/voice/3D failure; prior deployed revision can be restored; no private data in static build |

Before adding more cloud services, finish identity + ownership + durable storage. Speech/translation services do not solve these. Keep current configured managed text model and consented voice; no new model hosting infrastructure is justified by a prototype without a measured workload. Exact code/auth/database implementation remains root work under new explicit shared/server/config claims after Claude releases manifests.
