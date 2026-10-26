# Cloud rollout and architecture handoff — 26 October 2026

Owner: `codex-cloud-rollout-20261026-luna`, Codex, gpt-6-luna / low. Product scope: private Cloud Run rollout operations for learner source → reviewed lesson → practice/evidence → resume continuity. Judging links: Product, Sustainability, Usability, Intelligence. The selected KAIRO experience references remain `design/studio-ux-direction-20261026/02-whole-app-concept.png`, `01-motor-context-concept.png`, and `03-tablet-classroom-concept.png`; this package is infrastructure and is not mounted UI.

## Work delivered locally

- `tools/cloud-rollout-20261026/`: metadata-only preflight, immutable source/image receipt, bounded HTTPS smoke, explicit receipt/revision rollback, and read-only operations check.
- `docs/cloud-rollout-20261026/`: scope, fixture, local validation record, and sanitized live operations notes.
- `tools/cloud-architecture-20261026/inventory.ps1`: read-only inventory report; parser succeeds, but multi-resource run did not produce an evidence file before command timeout.
- `docs/cloud-architecture-20261026/ARCHITECTURE.md` and `cloud-inventory.json`: managed-services decision, existing resource inventory from individually successful reads, spend and lifecycle gates, no-apply infrastructure boundary.

## Evidence

- Parser: 5/5 rollout PowerShell scripts and 1/1 architecture inventory script accepted by the PowerShell parser.
- Synthetic preflight fixture: 5/5 checks passed, emitted JSON.
- Immutable receipt: created with full commit SHA and image digest; second write to the same receipt was rejected.
- Live explicit-target metadata reads: Cloud Run service `kairo-app`, latest ready `kairo-app-full26b`; image digest `sha256:2e74388c7fcd295501649d999b77fdaf83899bfea33e6f5a33f25ea505e41ffc`; 1 CPU, 1 GiB, max scale 20; runtime service account; traffic 100% on `full26b`; ingress `all`; IAM invoker binding only for the runtime account; no public invoker binding; secrets `kairo-groq-key` and `kairo-openrouter-key` each bound with enabled version 1. No payload reads.
- Resource inventory: `kairo-core` revision `kairo-core-00003-qkw`; Firestore Native `(default)` in africa-south1; materials and source buckets in africa-south1, Cloud Build bucket in US; `kairo-imports` queue RUNNING in europe-west1.
- A queue query in africa-south1 returned invalid location; corrected to europe-west1 and confirmed queue. Monitoring alert listing returned no usable output; status unknown.

## Open work and boundaries

- A full live preflight run first failed its project check because gcloud returns `(unset)` for its default; per-resource calls used explicit project and location. Source was corrected to accept the unset sentinel, but a complete post-fix live JSON result was not captured. Regenerate and review `live-preflight.json` before calling the helper live-verified.
- `cloud-inventory.json` is manually assembled from independently successful read-only CLI outputs; the scripted inventory did not create its result file. Re-run `inventory.ps1` and reconcile its output before treating as automated evidence.
- No staging smoke, credit balance/expiry, spend-cap eligibility, alerts, billing export totals, storage lifecycle, backups/PITR, deletion retention or restoration drill were verified.
- No deployment, traffic/IAM mutation, secret payload read, billing change, Terraform apply, GKE/GPU resource or model download occurred. Root owns shared traffic and release allowlist. Existing Terraform module is read-only discovery; never import/apply against `kairo-app` without a single-writer plan.
- Existing shared release worktree `.worktrees/full-integration-release` now has current fetched `origin/main` ref `7e94b557b095188cf80d0a125d6be4967374bd95`, but HEAD remains `37421c8937631769be1995a1d6cad02164bd7e66` on an older PR branch and includes another package’s untracked files. Do not switch/reset it. Transfer this package only through a fresh current-main publication worktree or coordinator-owned cherry-pick/copy review.
- Model-hosting owner was asked for the exact model/interface/image/resource contract; no weights are duplicated. Root should integrate only after that owner returns verified licensing and runtime evidence.

## Remaining acceptance

Regenerate sanitized live preflight and automated inventory evidence; verify alert/billing/credit and storage/Firestore recovery metadata; run a synthetic IAM-authenticated staging smoke; and have root review a clean exact-source candidate before any no-traffic deploy or traffic promotion. Demonstrate the mounted learner path and actual selected visual references separately; these infrastructure results do not establish browser/device or human learner acceptance.
