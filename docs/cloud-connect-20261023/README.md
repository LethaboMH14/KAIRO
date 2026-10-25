# KAIRO private cloud connection

Verified 23 October 2026 UTC / 24 October SAST. Owner: codex-cloud-connect-20261023-u; Codex, exposed model gpt-6, effort unknown.

## Actual access

The active gcloud login has roles/owner on project `kairo-access-20261021`. This verifies project access, not organization-wide or billing-account administration. No new IAM role grant or service-account key was needed. Application Default Credentials are absent; the existing server gcloud token bridge successfully authenticates Storage requests. No credentials are included in this pack.

CLI credentials and ADC are separate. `GOOGLE_APPLICATION_CREDENTIALS`, if used, points to a credential file; it does not contain raw JSON. Prefer attached runtime identity on Cloud Run rather than distributing long-lived Owner keys. See [Google ADC documentation](https://docs.cloud.google.com/docs/authentication/application-default-credentials).

## Working feature

Refresh My material, select a saved and reviewed source, and expand **Private cloud copy**. Explicitly consent, then select **Save private cloud copy**. **Verify cloud copy** checks the current revision against the remote snapshot. **Remove cloud copy** removes the cloud object while retaining the local source. The bucket's seven-day soft-delete policy can retain deleted objects for recovery.

This copies only the current reviewed text, title and citation locations. It does not upload originals, lessons, accounts or the entire material. Current reviewed-source limits remain four pages with 16,000 characters per page. Storage does not solve incomplete document extraction.

Private bucket: `kairo-access-20261021-materials`, AFRICA-SOUTH1, uniform bucket access and public-access prevention. Object namespace is server-controlled: `local-pilot/sources/<sourceId>/<revision>.json`. Revision is the SHA-256 of reviewed pages. Writes use generation preconditions; save success requires verified read-back. Deletes use the verified object generation. No private learner document was uploaded during testing.

Local preview now runs on port 4188 with `KAIRO_CLOUD_LIBRARY_ENABLED=1`, `KAIRO_CLOUD_BUCKET=kairo-access-20261021-materials`, `KAIRO_AUTH_MODE=gcloud`. These are process settings, not a committed secret/configuration file. A future process restart must preserve them.

## Evidence and limits

- `full-tests.txt`: full suite 531/531 before final backend authentication-timer adjustment.
- `cloud-tests.txt`: final focused cloud store and actual HTTP route tests 7/7 after that adjustment.
- `build.txt`: TypeScript and Vite production build passed; existing large bundle warning remains.
- `live-roundtrip.json`: real synthetic Google Storage save/read/remove/absence passed. No learner documents. This exercises the real store adapter, not an end-user browser journey.
- `access-check.json`: active CLI login and project Owner role verified; ADC absent; zero keys created.
- `server-health.json`: restarted local server and cloud configuration healthy.

First live attempt exposed a timeout that included cold CLI authentication. The adapter now starts its bounded network timer after credential acquisition and checks cancellation before dispatch. A regression test verifies cancellation during credential refresh prevents the subsequent network request.

This remains a single-user local pilot. It is not public deployment, account synchronization, institutional tenant isolation, complete multimodal extraction or validated learning improvement. No browser observation/device acceptance was performed. The schedule remains off.

## Next implementation gates

1. Implement whole-document extraction coverage with anchored blocks and explicit missing/failed regions; compare native parsers and Docling against fixtures before promotion. See `../multimodal-research-wave2/README.md`.
2. Add hosted authentication, server-verified user identity, owner-scoped storage and durable application data before exposing learner upload routes publicly.
3. Make extraction a bounded asynchronous job with retries, cancellation, idempotency and persisted status. Keep private material local until an explicit cloud-processing choice.
4. Deploy a bounded authenticated Cloud Run pilot using an attached runtime service account and minimum required permissions, then test the real hosted journey. Do not reuse the local-pilot namespace as a multi-user design.
5. Add consented model gateway routing and anchored output validation before promoting Groq/OpenRouter lab candidates into the learner flow. Framework selection is in ORCHESTRATION.md.

Judging evidence: Product—actual verified storage action; Usability—explicit save/verify/remove and truthful scope; Sustainability—private managed object storage; Intelligence—no new model-quality claim. Creativity, Impact and Presentation still require a demonstrated learner journey and user evidence, not infrastructure alone.
