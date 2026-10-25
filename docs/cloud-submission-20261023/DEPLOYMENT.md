# Root deployment work: specific release gates and artifact plan

The user's current instruction authorises work toward cloud deployment and use of services. It does not make unimplemented access controls safe or establish unknown provider entitlement. No new public service has been deployed in this package. Do not disable the loopback guard to make a URL appear.

## Inspection and next implementation scopes

| Root scope to claim before edits | Required change | Acceptance |
|---|---|---|
| studio/server.mjs and new auth module | Explicit local versus hosted mode; configured production origins; 0.0.0.0/PORT only in hosted mode; token verification before every private API | Local mode unchanged; invalid/expired tokens rejected; CSRF policy if cookies used; no trusted client-supplied owner |
| workspace repository + migration/schema | Replace local JSON/global catalog with owner/tenant-filtered canonical durable records; private objects; source/lesson revisions | Two-user negative tests for read/write/export/delete/retrieval; restart durability; no data/private baked into image |
| extraction worker + job schema | Linux paths and pinned parsers/OCR; durable queue/status/idempotency; resource/time/file limits | Unsupported/corrupt/huge/encrypted files handled; retries don't duplicate; cancel cannot publish stale results |
| server AI integration + consent UI | Wire validated gateway to existing Google path; separately consent AIML; durable quota reservations; exact model metadata | Duplicate-click, provider outage, missing consent, cancellation, cost ceiling and stale source cases |
| package manifests/lockfiles and container config | Explicit root ownership; pinned auth/DB/queue clients, non-root container, build excludes local private data, health/readiness | Repeatable clean build; scans + source review, no secret/private asset in layers |
| deployment config and cloud identities | Managed identity with least privilege; private bucket; one canonical DB; secrets; authenticated queue worker; max instances/quotas | Read-only resource evidence followed by scoped creation, remote health/auth/storage smoke and rollback record |
| client profile/module/lesson integration | Root adopts reviewed curriculum + chooser + new Luna lesson packages | Private start, proper module membership, same source/context to evidence/resume; labels reflect actual storage |

Region: evaluate africa-south1 for app/private storage when supported and suitable; model global endpoints may process elsewhere. Record actual selected service regions/data terms, don't claim South-African-only processing without proof. No always-on GPU or paid DB is provisioned simply to preserve a preference for one vendor. Cost/retention/identity must be explicit in the concrete rollout config.

## Friend/judge gate

A usable hosted account must create a supported source, review extraction, request a lesson, inspect real citations, complete practice, save and resume after server restart. Another account must fail to access those objects even knowing their IDs. Delete/export and supported file limits must work. Model outage still permits local reading; audio/3D failure still permits the same text/drawing task. Test real remote services with synthetic data first. Source ownership, actual remote persistence and guest retention must be measured before inviting a friend to upload private material.

Create a dedicated synthetic judge account with its credentials distributed only through the required private submission channel. Do not invent a URL or login in slides. QR codes are generated only from the final verified URL, tested after export. Native APK is not required just to satisfy a web-app screenshot; the programme permits a usable live web build. Keep a backup recording clearly identified, not presented as a live API result.

## Current evidence and limits

API inventory succeeded for project kairo-access-20261021. Root enabled and verified Identity Toolkit, Cloud Tasks and Secret Manager APIs as requested cloud setup; no providers/queues/secrets were created. Historical Cloud Run service list was empty; that is not a fresh all-service inventory today. No new provider key is present in the current process, and current AIML $13 balance is user-reported. GCP billing balance/expiry/region/IAM still require current checks. This task implemented a tested isolated provider gateway, not hosted auth/storage. The plan is concrete enough for the next root claims; the public upload release remains unfulfilled until those gates pass.

No automatic reminder, crawler or recurring schedule has been enabled. Daily submission deadlines are recorded in SUBMISSION.md for manual execution. Public portal submissions were not clicked or saved.
