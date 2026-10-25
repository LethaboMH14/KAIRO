# Connected release integration — 24 October 2026

Owner `codex-connected-release-20261024-e`, Codex, actual exposed model gpt-6, effort unknown. User authorised cloud implementation/deployment, existing-chat messaging and requested Luna parallel work. Workers/chats registered their actual exposed settings; no assumed Luna setting or Claude receipt is claimed.

## Changes and interfaces

- Root owns the application router/provider integration, server authentication, private learner API, account-scoped storage/sync and deployment. Separate workers delivered repository adapters, contextual studio coaching, material workflow UI, selected evidence UI and actual-component/security tests under published contracts.
- `studio/server/account/`: Firebase email/password exchange and secure server session cookies, recent authentication, same-origin mutations, generic recovery errors, revocation and hashed storage scope.
- `studio/server/learner-workspace/`: Firestore/GCS owner-scoped route adapter, durable Cloud Tasks imports, signature/size checks, native extraction/OCR, review revision and draft CAS, progress CAS, cancellation/crash recovery and daily quotas.
- `studio/server/learner-entry.mjs`: isolated hosted entry; no legacy global workspace route. Includes public synthetic Computer Science trace and protected/capped cloud questions, private material and speech routes, verified internal queue callback, static application and security headers.
- `studio/src/account/`: account page/boundary, separate storage namespace, conditional progress hydration/save, explicit conflict choice and selected evidence export. Existing storage consumers now use the boundary adapter.
- `studio/src/studio-teaching-host/`: real motor/pump authored lesson steps and references, Pump Lab mounting, meaningful context changes and shared narrator cancellation, evidence/snapshot persistence.
- Router, Home, navigation, Studios, settings, Work and classroom connect the available journey. My material redesign preserves review/citation/consent gates and now restores durable processing jobs after reload.
- `tools/connected_release/`: allowlisted build stage, Docker image, keyless provisioning and live synthetic API check. Local `.local` configuration files contain secrets and must never be copied into evidence, messages or source control. `.gitignore` explicitly excludes them and the stage.

Detailed evidence, decisions and limits: `docs/connected-release-20261024/README.md` and `REVIEW.md`.

## Evidence and acceptance boundary

Full installed suite: **635/635 passed** in `full-tests-authorized.txt`. Additional import crash/cancellation regression: **1/1** in `import-recovery-tests.txt`. Production TypeScript/Vite build successful, with the existing large-3D-chunk warning. Dependency audit after the compatible vulnerability fix reported zero vulnerabilities.

Real deployed APIs were exercised with two disposable synthetic accounts: owner isolation, sources/review, local and Google cited lessons, draft stale-write protection, progress, durable import/original integrity, Google speech and revoked-session rejection. Both test users were deleted. Final live/deployment files identify the accepted revision and exact checks; do not substitute a previous revision's result for a later one.

No browser observation, page capture, screenshot, headless browser, keyboard/device/screen-reader or human learner acceptance was performed. The deleted schedule remains off. Passing tests are not an official score, credential, security certification or complete release acceptance.

## Deployment and continuation

Project `kairo-access-20261021`; app `kairo-app` in `africa-south1`; URL `https://kairo-app-747226582754.africa-south1.run.app`. Runtime uses a dedicated scoped service account, no JSON key. Firestore/GCS store owner records and originals. Cloud Tasks uses `europe-west1` because Johannesburg is not a supported queue region: account UID and random job ID only travel as queue metadata. Do not claim all processing/data stays exclusively in South Africa. Bucket deletion has a seven-day soft-delete window.

Accepted private revision: `kairo-app-00003-m4q`, 100% service traffic. Final `live-check.json` reports **24/24** true, zero failures, two synthetic accounts created and deleted. Public access remains pending: automatic approval review rejected adding `allUsers` as service-level `roles/run.invoker` because explicit permission for the public blast radius was required. The user has been asked that precise question. Do not bypass the rejection through another identity, gateway or indirect command. `public-check.mjs` is prepared but was not run; no public-launch claim is made.

Local preview port 4188 remains a distinct local workspace; Account links to the hosted app. Existing local files are not silently imported into accounts. No continuous background watcher was installed.

Limits: bounded native/OCR extraction, not full diagram understanding; max 12k selected reviewed characters to generation; prepared studio simulations rather than arbitrary uploaded-to-3D conversion; no continuous SASL translation, payment checkout, employer publishing, trained mastery ML or institutional multi-tenancy. BigQuery is not required for the operational learner loop; consider consented, deidentified analytics later after event/retention design. Cloud quotas limit pilot usage but do not establish a billing hard stop.

Next: human acceptance on an allowed device, real recovery-email delivery, explicit account deletion/retention policy, mixed native/scanned PDF and diagram evaluations, then a deeper prediction→experiment→explanation→evidence teaching loop in the two existing studios. Preserve the single narrator and citation/review boundaries when adding new tools or models.

## Later continuation

The user requested person-specific judge accounts rather than explicitly authorising public access. Private revision kairo-app-00004-wcw now adds synthetic engineering/informatics spaces; see coordination/handoffs/2026-10-24-judge-spaces.md. Integration is complete as a private pilot; public access is a separately unresolved approval decision, not a reason to keep all application ownership held. No IAM bypass occurred.
