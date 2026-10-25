# Connected learner release — 24 October 2026

Root: `codex-connected-release-20261024-e`, actual model gpt-6 / effort unknown. Contract: `coordination/briefs/connected-release-20261024/CONTRACT.md`.

**Later student-space update:** private revision `kairo-app-00004-wcw` adds person-specific synthetic curriculum accounts; see `../judge-spaces-20261024/README.md` for its newer tests and 19 live checks. The following foundation evidence remains dated to revision 00003.

**Deployment checkpoint:** revision `kairo-app-00003-m4q` serves 100% of service traffic. All **24 final live API checks passed** (two temporary accounts created and deleted). The service remains **IAM-private**: automatic approval review rejected the proposed service-level `allUsers` / `roles/run.invoker` binding pending explicit user permission. Public reachability has not been tested or claimed. Local preview on port 4188 was restarted with the new UI and hosted-account link; that link remains IAM-protected until approval.

## Connected journey

1. Open the hosted app and create/sign into an email account. A secure, HttpOnly session cookie authenticates server requests. Browser code never receives the Firebase ID token. Device-only preview work remains separate.
2. Open My material. Paste text or upload a supported document/image. The account owns its sources, immutable reviewed revisions, lessons, drafts and processing jobs.
3. Upload jobs persist in Firestore and run through authenticated Cloud Tasks. The processing list survives reload. Cancellation confirms only a successful server cancellation; ready jobs open their extracted source.
4. Check the extracted text against a retained original if chosen. Correct it and acknowledge review. See the passages selected for the learning goal. Cloud generation requires consent; extractive reading makes no model call.
5. Edit the actual lesson, retain source citations, publish a learning copy and open the classroom. Reading, 3D, shared narration, practice, evidence and resume remain connected.
6. Enter either the motor or pump activity from the lesson. These are prepared, separately cited activities; uploading arbitrary material does not generate a validated simulation. KAIRO can explain, hint, ask for a prediction or prompt a check of the current activity.
7. Keep practice and pump evidence, choose up to six pieces of working and download a selected evidence pack. Nothing is automatically published to employers or represented as an accredited skill.
8. Account device progress hydrates from cloud and saves conditionally after changes. A conflicting device copy is preserved and requires an explicit choice. Look for the save confirmation; failed sync does not imply cloud durability.

## Runtime architecture

- **Cloud Run, africa-south1:** one same-origin React app/API and bounded extraction worker; maximum one instance, zero minimum, 1 GiB, one CPU, concurrency eight, 300-second request deadline.
- **Firebase Authentication:** email/password and server session cookies, recent-auth checks, revocation checks on private requests, password reset and all-session sign-out. No service-account JSON keys.
- **Firestore:** server-owned `owners/<sha256(uid)>/...` paths, transactional compare-and-swap updates and immutable source revision documents. Browsers do not connect directly to the database.
- **Private Cloud Storage:** owner-prefixed original/temp files, integrity checks, eight-MiB upload limit. Existing bucket has a seven-day soft-delete retention window.
- **Cloud Tasks, europe-west1:** only account UID and random job ID cross to queue metadata. Files and extraction remain in Johannesburg. OIDC verifies the exact worker account/audience; no client-selectable callback URL.
- **Vertex AI and Google voice:** server-side keyless credentials, explicit processing consent and daily global caps. Real synthetic generation and speech were exercised. Local/extractive reading and browser narration remain alternatives.
- **Native extraction:** Python parsers for PDF, DOCX, PPTX, XLSX, text; Tesseract preview for images/scans. Four-page OCR ceiling, 12-million-pixel pre-render bound and timeouts. No claim of complete visual understanding.

Global daily pilot caps: uploads 30, cloud lessons 60, passage requests 100, speech requests 60. Per-account limits also apply. These are application quotas, not guaranteed zero cost or a billing hard stop. They are intentionally conservative for a public demonstration.

## Evidence

- `full-tests-authorized.txt`: full installed Node suite, **635/635 passed**, no skips. Includes real components under deterministic hook/SSR harnesses, account/security and HTTP integration tests.
- `import-recovery-tests.txt`: additional actual-router regression **1/1 passed** for crash recovery and cancellation cleanup after the full-suite checkpoint.
- `live-check.json`: 24 real final-revision API checks, two disposable users, private source/lesson/progress/job isolation, import completion and original integrity, draft CAS, Computer Science trace, Google generation/speech/question, revocation. Both synthetic users deleted; no private learner files used.
- `build-final.txt`, deployment evidence and public reachability evidence are recorded at release completion. A build/test pass is not visual or device acceptance.
- Worker deliveries were independently read and integrated. The requested Luna workers/chats registered the settings they could actually expose (gpt-6 / unknown); no unverified model setting or Claude acknowledgement is asserted.

Browser observation remains prohibited. No screenshots, browser automation, page capture, user-device acceptance or screen-reader acceptance was performed. The deleted schedule remains off.

## Honest limits and next priorities

Extraction is bounded, not full-document multimodal understanding: native processing up to 100 units, review capped at 48,000 characters / 64 KiB, and generation selects at most 12,000 reviewed characters lexically. Mixed scanned/native PDFs can still miss figures or scanned pages; formulas, charts and image meaning need a reviewed multimodal pipeline. Audio/video, legacy `.doc`/`.xls`, Document AI and arbitrary generated HTML execution are not part of this release.

Progress sync has a bounded device snapshot; a visible failure requires export before leaving. No automatic local-to-account migration, public employer profile, verified certification, institutional tenancy, payment checkout, trained mastery model or continuous SASL translation is claimed. Public account signup is a limited pilot; abuse controls, verification policy, full account deletion/retention workflows, recovery email delivery and assistive-device testing need further release work.

Deepen the two existing studios before adding six rooms: require a prediction, vary one parameter, show the measured change, ask for an explanation and keep the resulting evidence. Next bounded environments can reuse this contract: a low-voltage circuit bench and a calculus graph laboratory. Add role-specific tasks only with authored rubrics and source provenance. Teacher improvements should track task context, pause on scene changes, give progressively stronger hints, explain uncertainty and offer a textual route; authored prompts are not open-ended reasoning or automatic grading.

## Judging alignment

| Criterion | Observable improvement | Remaining evidence gap |
|---|---|---|
| Product | Account → private material → review → editable lesson → practice → saved progress | Human end-to-end acceptance |
| Creativity | Source-linked 3D motor/pump investigations and evidence curation | Learner comparison with existing tools |
| Usability | Three stages, recoverable jobs, clear save/conflict states, reading alternative | Mobile and accessibility sessions |
| Sustainability | Managed services, keyless runtime, bounded compute and quotas | Measured unit economics and paying demand |
| Impact | Material can become checked, usable learning and practical working | Measured learning/access outcomes |
| Presentation | Hosted journey, prepared teaching packs, explicit limits | Final recorded demo and submission assets |
| Intelligence | Cited generation, goal-based evidence selection and contextual coaching | Validated semantic retrieval/adaptation models |
