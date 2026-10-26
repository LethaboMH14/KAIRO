# Bounded Cloud Run rollout helpers

These scripts provide read-only preflight/operational checks and guarded deployment commands for the existing private KAIRO Cloud Run service. They do not build, deploy, change traffic, IAM, secrets, billing or retention policy unless the operator explicitly invokes a mutation command after reviewing its inputs.

All commands require an explicit project, region and service. `preflight.ps1` checks the active gcloud account/project, service ingress/IAM, current image digest, runtime identity, required Secret Manager bindings (names and binding state only), and revision traffic. It never reads secret values or prints environment values. Secret-version reads are metadata-only.

`write-receipt.ps1` records the exact source commit and image digest to a new JSON file. `smoke.ps1` checks only the service URL supplied by the operator and records HTTP status, response headers and bounded timing. `rollback.ps1` requires a receipt and an explicit prior revision; it runs `gcloud run services update-traffic --to-revisions` only after matching project/region/service and confirming the referenced revision exists. This operation changes live traffic.

`ops-check.ps1` reports service/revision traffic, retention-related configured policy names/ages where available, Cloud Monitoring alert policy names/states, and recent billing export totals if an authorized BigQuery billing export is explicitly supplied. It does not change policies and does not assert that absence of an alert means low cost.

The scripts support `-WhatIf` where available. Fixture mode is available for preflight and receipt validation. See `docs/cloud-rollout-20261026/` for actual sanitized outputs and limitations.
