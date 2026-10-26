# Cloud architecture and model hosting handoff — 26 October 2026

Owner: `codex-cloud-rollout-20261026-luna`, gpt-6-luna / low. This is a no-apply architecture package responding to the explicit user expansion. Judging links: Product, Sustainability, Intelligence. Learner task: source review, cited lesson, accessible KAIRO teaching, practice, evidence and resume. Visual authority: selected whole-app concept plus motor and tablet references under `design/studio-ux-direction-20261026/`.

## Proposed bounded architecture

Keep the current SPA and managed architecture: Cloud Run (`kairo-app`) for authenticated APIs, Firebase Auth verification and owner checks, Firestore Native for current learner records, private Cloud Storage for files, Cloud Tasks in europe-west1 for idempotent imports, Secret Manager for server-side external providers. Keep `kairo-core`'s role unspecified until its owner documents interface/callers/permissions. Avoid a second database/vector source of truth, new GKE cluster and always-on GPU until measured requirements and post-credit costs justify them.

The user-initiated small model work is owned by chat `01a177b1-11a1-7171-88fe-786a831e011a`. I requested exact model/license/source, digest, endpoint contract, image size, memory/startup, cache and test evidence. Do not duplicate download. No adapter contract or new model deploy is approved yet.

## Implemented evidence

- `tools/cloud-architecture-20261026/inventory.ps1` is a read-only, explicit-project metadata inventory helper; parser passed. Its multi-resource run timed out without producing the target JSON file.
- `docs/cloud-architecture-20261026/ARCHITECTURE.md` states observed resources, target architecture, resource caps, no-traffic deployment gates, retention/security recovery questions, cost controls and concrete unknowns.
- `docs/cloud-architecture-20261026/cloud-inventory.json` records individually observed sanitized metadata, not learner data or secret values. Automated inventory output has not yet been reconciled.
- Existing `infra/ai-wave-20261025/main.tf` is a read-only Cloud Run discovery data source. Existing Dockerfile builds current Node 24 service; this package made no Docker or Terraform resource change and performed no `terraform apply`.
- After publishing the interface to root, added a distinct Terraform proposal under `infra/cloud-model-service-20261026/`: one digest-pinned IAM-authenticated Cloud Run service `kairo-model-*`, no public invoker, one caller grant to `kairo-app-runtime`; scale 0..1, concurrency 1, request CPU, 2 CPU/2 GiB starting cap, 30 second request timeout, deletion protection. It creates no service account, registry, VPC, storage, database, secret, GPU or GKE. Ingress is `all` with mandatory IAM because internal-only ingress from Cloud Run needs VPC routing and no VPC was verified. Model owner must supply exact interface/image/license/RSS/startup before use. Terraform CLI is unavailable, so fmt/validate/plan were not run; no apply.
- Further operational proof and gaps are listed in `coordination/handoffs/2026-10-26-cloud-rollout-luna.md`.

## Coordinator review and next action

Please take this package in a fresh current-main publication worktree. The existing release checkout has untracked files from other packages and must not be reset or switched. Verify inventory/preflight helper execution, collect current spend/credit/alert/backup/lifecycle evidence, then review model-hosting handoff before proposing any isolated no-traffic deploy. Root remains sole owner of shared interfaces, allowlist, final candidate and live traffic.
