# Cloud rollout operations package

## Judging and learner need

This work supports **Product** (private learner service stays protected and a rollback target is explicit), **Sustainability** (repeatable release receipts and bounded operational checks), and **Usability** (a failed deployment can be returned to a previously verified revision). The learner need is continuity and protection of saved learning work during a service update.

## Observable acceptance

- A deployment preflight checks project/region/service, rejects public invoker bindings, requires a digest-pinned image and runtime service account, and verifies each explicitly named secret has an enabled version and a service binding without reading its value.
- A receipt is immutable and binds project, region, service, full Git commit and image digest.
- A staging smoke request uses an operator-supplied HTTPS host, has a body-size cap, and records bounded metadata.
- Rollback requires a matching receipt and verified prior revision; `-WhatIf` previews it. Normal invocation changes Cloud Run traffic and is reserved for an independently reviewed candidate.
- Operations check reads revision/traffic and alert policy metadata only. It does not inspect learner content, change lifecycle policy or claim cost certainty.

## Evidence and limits

Evidence files in this directory are intentionally sanitized. The approved elevated CLI path worked with explicit project/region; no re-login or credential copying was needed. Read-only service/IAM/Secret Manager queries confirmed `kairo-app-full26b`, 100% traffic on that revision, digest `sha256:2e74388c7fcd295501649d999b77fdaf83899bfea33e6f5a33f25ea505e41ffc`, runtime service account, no public invoker binding, and enabled version 1 for both bound secret names. No secret payloads were read. Corrected live preflight output is in `live-preflight.json` and passes 5/5 checks despite gcloud's `(unset)` default project because each resource query explicitly names the project and region.

The shared release allowlist is owned by root and was not edited. This package was transferred into a fresh worktree at current `main`, committed as `441c277`, and published as draft PR #144. The model service Terraform template is a proposal only and was not fmt/validate/plan checked because Terraform CLI is unavailable.

No staging deployment, traffic change, IAM update, billing change, secret payload read, Firebase change, retention/delete action or public judge access was performed. Cloud Monitoring returned no alert policies. Firestore backup schedule list returned empty; PITR/backup coverage remains unknown. Project billing is enabled, but Billing Budget API query failed in the current CLI context, so budget, credits and spend caps remain unknown. The materials bucket policy projection returned null for versioning/retention/lifecycle/soft delete. The service has ingress `all`, while its IAM invoker binding is private; an authenticated reviewer smoke remains untested.
