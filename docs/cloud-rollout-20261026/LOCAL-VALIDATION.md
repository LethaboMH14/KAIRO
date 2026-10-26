# Helper validation record

Observed on 26 October 2026 in the isolated release worktree:

- PowerShell parser accepted 6/6 scripts (`preflight.ps1`, `write-receipt.ps1`, `smoke.ps1`, `rollback.ps1`, `ops-check.ps1`, `inventory.ps1`).
- Synthetic fixture preflight emitted JSON and passed 5/5 checks.
- Receipt writer created a full-SHA/digest-bound fixture receipt and rejected an overwrite.
- Live reads confirmed `kairo-app-full26b`, digest `sha256:2e74388c7fcd295501649d999b77fdaf83899bfea33e6f5a33f25ea505e41ffc`, ingress `all`, 100% traffic on `full26b`, runtime account, no public invoker binding, two secret bindings and enabled version 1 for each. The source accepts `(unset)` for the default project because every resource query includes explicit project and region. A full passing live preflight is saved in `live-preflight.json`.
- Monitoring alerts and Firestore backup schedules both returned empty lists. Project billing is enabled, but budget lookup failed because the billing-budget API/quota context is unavailable. Selected materials-bucket metadata returned null for versioning, retention, lifecycle and soft delete. No staging HTTP smoke was run because no authorized identity-token context for the IAM-private service was used. No traffic, IAM, secret, retention, storage lifecycle or billing changes were made.

The live configuration confirms external ingress `all` with IAM-private invocation. This is not public access because the IAM policy lacked a public member; it still requires a direct auth-denial/authorized synthetic smoke before judging access is accepted.
