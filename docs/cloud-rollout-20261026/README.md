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

Evidence files in this directory are intentionally sanitized. The approved elevated CLI path worked with explicit project/region; no re-login or credential copying was needed. Read-only service/IAM/Secret Manager queries confirmed `kairo-app-full26b`, 100% traffic on that revision, digest `sha256:2e74388c7fcd295501649d999b77fdaf83899bfea33e6f5a33f25ea505e41ffc`, runtime service account, no public invoker binding, and enabled version 1 for both bound secret names. No secret payloads were read. The live preflight JSON currently has a known project-check defect: gcloud reports `(unset)` for its default project although every resource query explicitly specifies `kairo-access-20261021` and `africa-south1`. Source was adjusted to accept that sentinel; a full post-fix live run timed out and still needs to be captured before calling the helper live-verified.

The shared release allowlist is owned by root and was not edited. The available release worktree is clean at `fc03149be570cb1bbf4b663f612c3fcbd28f0c76` (PR126 merge); its shared Git worktree metadata denies writes, so it could not be fetched/advanced to current `origin/main`. The package must be transferred to a fresh isolated publication worktree at the current main before a draft PR.

No staging deployment, traffic change, IAM update, billing change, secret payload read, Firebase change, retention/delete action or public judge access was performed. Monitoring alert policies and billing credits/cost caps remain unknown. The service has ingress `all`, while its IAM invoker binding is private; an authenticated reviewer smoke remains untested.
