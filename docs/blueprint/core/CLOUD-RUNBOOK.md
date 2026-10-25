# Cloud, models, dependencies and operating-cost runbook

**Target plan, not an applied deployment.** The user authorizes installations, models, datasets, training and use of Google/Azure credits. Implementation will begin in fresh project chats after Claude refines this plan. Do not repeatedly request permission for already authorized bounded setup; do check entitlement, rights, secret handling, actual cost and the reviewed release gates before acting. The scheduled automation remains deleted.

## Account state and execution boundaries

Existing setup records name the dedicated Google project `kairo-access-20261021`; they report trial credit and an Azure Speech resource on 21 October. Those are historical observations. A current CLI metadata refresh failed in the restricted environment because gcloud/az tried to write profile logs/session files outside writable roots. No balance, expiry, Azure credit amount, current F0 quota or provider API event output was verified live in this planning run. Do not infer “not connected” from that filesystem failure or bypass a permission block through a different surface.

Fresh cloud owner should use a normal supported authenticated CLI/console session, without displaying tokens, to record: selected project/tenant/subscription, billing link, current promotional credit and expiry, eligible SKUs, quotas, chosen regions and existing-resource ownership. Redact account identifiers in shared artefacts where unnecessary. No credit-card numbers or API keys in prompts, bus, frontend, logs or screenshots.

## Minimal first production topology

| Need | Proposed service / decision | Why / gate |
|---|---|---|
| Public static site + app assets | Same-origin static serving initially; CDN/storage later for public licensed GLB/images | Keep cookie/CORS policies simple; version/cache public assets, keep private media separate. |
| API and teaching director | Cloud Run container, managed service identity | Start max instances small; min instances 0 unless latency evidence funds warm instances. Container must bind configured `PORT` on `0.0.0.0` only in reviewed cloud mode; retain loopback dev mode. |
| Extraction, lesson/audio preparation | Private Cloud Run workers + authenticated Cloud Tasks | Explicit timeout/retries, idempotency, storage-backed state. Do not run current Windows-only extraction binary path in Linux image. |
| Durable records | PostgreSQL managed instance chosen after regional price check | Source revisions, permissions, attempts, evidence and usage require transactions/joins. Small private instance with backups for pilot; standing cost and connection pooling matter. |
| Private binary assets | Cloud Storage private bucket | Uniform access, service identity, retention/deletion, signed/proxied reads, upload quarantine. |
| Identity | Managed OIDC provider; Google sign-in + email/password or email link first | Verify auth/session server-side. A Firebase email-link flow is not automatically arbitrary email OTP; custom OTP needs expiry, single-use hashing, delivery/retry/abuse design. Phone OTP is optional, metered and fraud-prone. |
| Generation | Existing Google/Vertex adapter, exact available model pinned during capability probe | Do not guess a model resource because a code constant names it. Authenticated developer tools/subscriptions are not assumed to provide the app a hosted inference endpoint. |
| Speech | Per-locale Google/Azure adapter; local Setswana candidate experiment | Exact voice/model/region/mode/event support and native-speaker evaluation first. Speech is not covered automatically by other AI free allowances. |
| Secrets | Secret Manager only where managed identity cannot replace a secret | Least privilege and rotation; no service-account JSON embedded in image. |
| Telemetry | Cloud Logging/Monitoring + minimal OpenTelemetry spans | Trace stage, timing, tokens/chars/seconds and error code; do not log raw documents, CVs or audio by default. |
| Build/release | Artifact Registry + reproducible container build + reviewed CI | Lock dependencies, SBOM/licence/secret checks, staged image digest and rollback record. |

Use one region for app/data where feasible. Johannesburg is a latency/data-location candidate, **not a guarantee every speech/model/database SKU is available there**. Voice research currently finds some required STT locales in EU/US regions. Record any cross-border processing, latency, rights/contract implications and learner notice before enabling. Do not silently reroute private text/audio to another geography/provider after an outage.

Kubernetes/Terraform are not the same kind of requirement. **Terraform is useful early** for reviewable identities, buckets, services, budgets and reproducibility; **Kubernetes is optional later** if measurements show a need for dedicated GPU serving, persistent media infrastructure or complex workloads. Do not spend credit on a cluster merely to add an architecture logo. A WebRTC SFU/TURN service needs compatible networking and a real hosting design; it is not supplied by an arbitrary Cloud Run websocket endpoint.

## Infrastructure-as-code work package

Fresh cloud owner claims a new `infra/` subtree and its own handoff; do not add root configuration without a separate claim. Proposed module structure: `identity`, `storage`, `database`, `queue`, `run-services`, `observability`, `budgets`. Keep secrets out of Terraform variables/state wherever possible; use protected encrypted remote state with locking and restricted access. Pin provider versions and commit dependency locks. Separate environments and plan artifacts. CI runs fmt/validate/plan first; reviewer confirms concrete resource list, region, max capacity and estimated standing cost before apply under the user's existing authorization.

Parameters: explicit project ID, region per service, image digest, ingress, service accounts, max instances/concurrency, CPU/memory, request timeouts, bucket lifecycle, DB tier/backups, API enablement, per-service quotas, permitted provider endpoints. No broad Owner grants, public private-data buckets or client-exposed credentials. Use removal protection/backup policies deliberately; avoid “destroy and recreate” migrations.

## Cost model: what $300 can and cannot establish

The trial balance is finite, may expire before it is consumed and may exclude selected products. Azure credits are separate and not assumed to be $300. No all-inclusive monthly hosting quote is possible until user count, audio seconds, generation tokens, storage, traffic, region and standing database tier are fixed.

Use **gross cost before promotional credit** for planning. The offline calculator in this folder exposes assumptions; it does not call cloud APIs. Root independently checked [Google STT pricing](https://cloud.google.com/speech-to-text/pricing): the current V2 standard first tier is $0.016/minute. The 60-minute allowance and $0.024/minute row are **V1 without data logging**, not the selected V2 baseline. Recheck the exact chosen model/SKU at execution. [TTS prices](https://cloud.google.com/text-to-speech/pricing) depend on voice family; the speech research uses Chirp 3 HD $30 per million characters with an eligible monthly allowance, not a universal free balance.

Illustration, not forecast: 100 learner-hours/month; teacher speaks 150 words/minute × assumed 5 characters/word = 45,000 characters/hour; learner mic audio is 10% of session time. Then:

- Fresh synthesis: 4.5M characters × $30/M = **$135** conservatively before free allowance; **$105** only if the full eligible 1M allowance remains.
- Google V2 STT: 600 submitted mono minutes × $0.016 = **$9.60**. Capturing every minute instead would be 6,000 minutes = **$96**. Actual encoding/provider mode/channel billing must be checked.
- Add **$50 infrastructure allowance**, **$20 generation allowance**, **$10 egress/storage/other allowance**: conservative gross planning total **$224.60**. These three amounts are engineering allocations, **not provider quotes**. They must be replaced by region/tier/token prices and actual usage before deployment.
- Reusing 80% of approved generic narration reduces new synthesis to 900,000 characters: **$27** before allowances. The same example becomes **$116.60** gross. This reuse assumption is not guaranteed; private material stays tenant-scoped and cannot be reused globally to achieve an artificial saving.

None includes paid reviewers, new content production, SMS, domains, support, tax, currency conversion, GPU training or licensed media. All-local/browser voice has different quality/availability, not magically zero infrastructure cost. No always-on GPU belongs in the first budget. Training begins only when a baseline, data rights and measurable error justify it.

Initial engineering experiment allocation proposed: **up to $30 gross across bounded probes**, within verified available user-authorized credits; do not automatically spend the remaining balance. Log reserved and realized amounts, and stop when entitlement is unknown or the allocation is exhausted. The fresh reviewer can refine this value without confusing it with a provider-enforced cap.

Ordinary billing budgets are alerts. Google now also documents eligible single-project/single-service [spend-cap budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps), with enforcement latency and in-flight/fixed-cost caveats. Eligibility does not currently establish a speech cap. Use per-request/monthly app quotas, admission control, provider quotas, max instances, bounded retries, billing alerts and eligible spend caps together. Never claim a perfect hard ceiling from one alert.

## Dependency and model acquisition plan

Already available in this project: locked React/Three/R3F/Drei/Express/Vite stack; portable Blender; Rhubarb; glTF tooling; and project-local Claude skills for avatar production, Three.js animation/interaction/materials/lights/loaders, frontend design, Remotion, document/PDF and webapp testing. Verify actual files and recorded hashes before use. Do not reinstall duplicates or run every skill.

| Package / artefact | Acquire only for | Installation rule |
|---|---|---|
| Azure Speech SDK | Exact selected voice/event probe | Pin reviewed SDK in isolated experiment first; package/lockfile changes require explicit file claim. |
| LiveKit Agents **or** Pipecat | Later hands-free/RTC comparison | Evaluate hosting, dependencies, licences and real cancellation before committing. Do not install both production stacks by default. |
| ONNX runtime / Transformers.js | Optional Setswana model benchmark | Isolated tool directory/worker; pin runtime and exact weight revision/hash; disclose download size. No surprise phone download. |
| Simba Setswana ONNX | Local TTS experiment after card/upstream rights check | See exact model ID and limitations in speech catalog; approximate 109 MB is not a validated mobile budget. |
| Local ASR candidates | Offline/server-quality comparison | Prefer smallest adequate model; inspect weights/runtime RAM beyond raw parameter size; no `trust_remote_code` without source review. |
| OCR/runtime parsers | Cloud Linux extraction worker | Reuse current logic but replace host-specific paths; pin versions, sandbox and test hostile files. |
| Postgres client/migrations, auth verifier, queue client | Multi-user foundation | Install only in the bounded backend task; lock dependencies and run meaningful integration tests. |
| Remotion/Motion/GSAP | Authored explainer templates | Existing authoring skill is not a runtime package or perpetual licence grant. Select one tool per need and verify current project/commercial terms. |

Downloads need a manifest: source URL/revision, bytes, sha256, licence, upstream/data restrictions, execution trust, purpose and removal instructions. Prefer official release/signature. Models and datasets can have different terms: a permissive model tag does not override a speech dataset's explicit ban on voice cloning/TTS. Do not infer native-language or commercial suitability from a Hugging Face language tag.

No new paid service, dependency, model weight or training job was launched in this planning run. This is deliberate sequencing for the user's fresh-chat implementation request, not an authorization refusal.

## Promotion, smoke checks and rollback

1. Resolve Claude review; freeze one shared teaching contract, schema and signed release manifest.
2. Refresh cloud entitlements and regional API/model capabilities; record redacted evidence and gross budget.
3. Build isolated container with synthetic fixture; verify Linux extraction, dependencies and startup. Keep local mode private.
4. Provision staging with scoped identities/storage/database/queue; no private coursework migration yet.
5. Test auth negatives, two tenants, upload limits, source revision/citations, usage races, job retry/cancel, voice timing, mic revoke, keyboard/2D/phone and restore/deletion.
6. Seed only licensed/synthetic/public material; verify source rights and attribution. User-selected private imports need a visible scope/destination preview.
7. Roll out invite-only adult pilot with observable quota and rollback. Public rollout requires the production acceptance record, not just a successful build.
8. Rollback uses previous image digest, compatible migration strategy, feature flags and tested backups. Preserve audit/usage correctness; do not switch off security to keep the teacher talking.
