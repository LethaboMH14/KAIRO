# KAIRO Access

KAIRO helps learners turn study material into checked, source-linked lessons, explore an idea, practise it and keep evidence of their working. KAIRO is the teacher's name; Rain refers to the attributed underlying character rig.

## Current build — 26 October 2026

The learner application is deployed to **IAM-private Google Cloud Run**, with Firebase Authentication, owner-scoped Firestore/private Cloud Storage, durable import jobs, consented Vertex AI lesson generation and Google speech. Public website access has not been approved. Do not describe the link as publicly accessible or the application as fully validated.

The latest integration adds a durable server model gateway (Google, Groq and free OpenRouter; separately configured AIML adapter), personal lesson preferences and pattern-based review suggestions, source-linked motor/pump questions, extraction coverage, curated opportunities and uploaded-audio transcription with editable confirmation. The subsequent readiness/freshness release is deployed as `kairo-app-mount25d`; its evidence supersedes the older model-integration checkpoint below. Final serial tests passed **741/741**, the production build passed, and synthetic live generation/provider/studio/listening and account-isolation checks passed. These are engineering checks, not measured learning gains or full language/device acceptance. See [the current architecture](docs/ai-integration-20261025/ARCHITECTURE.md) and [integration handoff](coordination/handoffs/2026-10-25-ai-integration.md).

## Connected multi-source release — 25 October

The reviewed v2 record, local planner, lesson view and synthetic security kit are merged. The deployed integration connects owner-verified multi-source creation, wording edits with fixed citations/practice, saved notes and practice, resume, and the same lesson context inside motor/pump coaching. It also connects dated engineering role requirements to explicit learner-chosen goals/evidence; unreviewed indexed requirements are non-actionable.

The release passed clean Linux925/925 app tests/build, the synthetic Chromium journey, and private live account/revision checks. Revision `kairo-app-full26b` serves100% traffic after hosted font/encoding and lesson-heading fixes. A separate final hosted four-page browser walkthrough passed with zero JavaScript errors. It is not a claim that every research proposal or open PR is deployed. Current release/CI/cloud evidence and remaining vision are recorded in [the integration release](docs/full-integration-release-20261025/README.md). The website remains IAM-private; public access, institutional tenancy/payments, validated learning gains, automated employer matching, and continuous SASL translation are not implied.

## Work from this repository

```powershell
git clone https://github.com/LethaboMH14/KAIRO.git
cd KAIRO
cd studio
npm ci
npm run build
$env:PORT = '4188'
npm start
```

Use **Node.js 24**. Open `http://127.0.0.1:4188`. The local app can create an extractive reading lesson without cloud credentials. Cloud accounts, private learner material, API keys and judge passwords are not included in Git; they remain private in their existing stores. Configure cloud services and provider credentials server-side before enabling them. `.env.example` files are templates; the local server does not automatically load every example file. Do not use `VITE_` variables for server keys.

For document extraction, install Python 3.11+ and create a virtual environment from the repository root, then set `KAIRO_PYTHON` to its interpreter before starting the app:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r tools/github-publication-20261025/requirements-extraction.txt
$env:KAIRO_PYTHON = (Resolve-Path '.venv/Scripts/python.exe').Path
cd studio
$env:PORT = '4188'
npm start
```

Install Tesseract separately for scanned-page/image OCR. Native text/Office parsing does not replace OCR or diagram understanding. The existing Cloud Run Dockerfile installs these runtime dependencies for hosting.

From `studio`, run `npm test` (or `node --test --test-concurrency=1 tests/*.test.mjs` to avoid parallel SSR startup contention). These tests use local fixtures; keep live provider verification separate.

The repository contains application/runtime assets, source design files, research, tests and deployment scripts. Downloaded tool installations, dependency folders, private records, live coordination databases, caches, generated deployment copies and duplicate rendered video outputs stay local. They are reproducible artifacts rather than source requirements. Asset-specific licences and credits remain in force; see [third-party notices](THIRD-PARTY-NOTICES.md). Cloned collaborators should initialize their own coordination bus and register before editing; the original machine's active claim database is intentionally not published.

The connected flow is **account → relevant modules → private material → extraction review → editable cited lesson → reading/KAIRO → relevant studio → practice → saved working → resume**. The account, import, review, lesson, editing, progress and voice foundation passed 24 deployed API checks. The student-space additions have a newer test/build checkpoint; see their evidence below rather than reusing earlier results.

Two fictional judge examples are provisioned in separate owner workspaces:

| Synthetic ID | Public-curriculum selection | Available context |
|---|---|---|
| KAIRO-ENG-0001 | Wits BSc (Eng) Mechanical Engineering, year 3, 2026: six selected modules | Motor and pump enrichment, module references and prepared reading |
| KAIRO-INF-0001 | UP BCom specialising in Information Systems (07130173), year 2, 2026: five selected INF core modules | Request-trace enrichment and module references/orientations |

These are fictional learners, selected public curriculum facts and KAIRO-authored activities. They are not university accounts, a full registered curriculum, grades, credentials, endorsements or live university integration. The server assigns the programme by authenticated UID. Student IDs are labels; email/password authenticates. Credentials live only in an ignored local file, never in this README or the research pack.

## Open the application

The local preview is `http://127.0.0.1:4188`. It remains a separate single-user workspace. Its current engineering curriculum preview displays public module metadata and prepared studio links; it does not copy private hosted account files. Use Home to see the programme/module view.

The hosted service URL is `https://kairo-app-747226582754.africa-south1.run.app`; it remains IAM-protected. After an access method is explicitly approved, use the issued judge login to enter the corresponding private learning space. No broader IAM change is implied by deploying an update.

Primary routes: `/` modules/Home, `/account` sign-in, `/sources` My material and extraction review, `/lesson-editor?lesson=...` editing, `/classroom?lesson=...` learning/practice/evidence, `/studios` relevant activities, `/engineering` motor, `/pump-lab` pump, `/computer-science` request trace, `/evidence` saved working and `/saved` device reading. The default `/classroom` is a separate authored example; it is not shown as a course-prescribed exercise in the student studio list.

Source: `studio/`. The app needs Node 24; extraction uses Python dependencies described in the ingestion/deployment files. For the existing installation, `cd studio`, `npm run build`, then `node server.mjs --production` serves the built app. Set `PORT=4188` before launch if using this preview port. The local curriculum preview is server-configured with `KAIRO_LOCAL_CURRICULUM=engineering` or `informatics`; this is a local presentation setting, not an authentication mechanism. Cloud configuration and keys must stay outside source control.

## Evidence and honest limits

- [Connected cloud release](docs/connected-release-20261024/README.md): account security, cloud architecture, import/review/draft/progress integrity, 635-test foundation and 24 real synthetic API checks; no browser acceptance.
- [Student-specific spaces](docs/judge-spaces-20261024/README.md): newer curriculum/profile integration, provisioning and account-specific verification status.
- [Engineering curriculum provenance](docs/judge-engineering-20261024/README.md) and [Information Systems provenance](docs/judge-informatics-20261024/README.md).
- Source extraction supports bounded PDF/DOCX/PPTX/XLSX/text and image OCR previews. Native processing is limited to 100 units; review text to 48k characters / 64 KiB; OCR to four pages; generation to 12k goal-selected reviewed characters. It is not full-document semantic or diagram understanding.
- Motor/pump models are prepared educational activities with their own references. Uploaded material does not automatically become a validated simulation. Readable alternatives, citation checks and one shared narrator remain core requirements.
- No measured learning gains, traction, continuous SASL translation, trained mastery predictor, exact employability score, payment checkout or institutional tenancy is claimed. BigQuery is not needed for the operational learner loop; future consented analytics require event/retention design.
- Browser observation remains prohibited. The deleted schedule stays off. Automated tests/builds are engineering evidence, not human/device or official judging acceptance.

## Research with current context

Give an external research assistant [the explanatory build brief](docs/judge-spaces-20261024/RESEARCH-CONTEXT.md), then one of the [12 focused research prompts](docs/judge-spaces-20261024/RESEARCH-PROMPTS.md). Bring back primary sources, exact versions/licences, interface contracts, failure cases, measured or formula-based costs and a bounded evaluation plan. Do not attach private material or secrets.

Read [the provider/hosting claim review](docs/provider-hosting-review-20261024/README.md) and [the independent model capability audit](docs/model-evaluation-audit-20261024/README.md) before adopting pasted AI recommendations. API model access, self-hosting, open weights, commercial rights and genuinely supported tasks are separate questions. A model name or a claimed free allowance is not a deployment plan.

## Collaboration and product direction

Read [AGENTS.md](AGENTS.md), [the coordination protocol](coordination/README.md), [the selected product brief](docs/KAIRO-PRODUCT-BRIEF.md) and [the judging matrix](docs/judging-cloud-20261023/JUDGING-MATRIX.md) before editing. Register actual exposed settings, claim exact files, publish shared interfaces first, respect active/blocked owners and leave evidence-backed handoffs. Bus messages are not an automatic bridge to Claude. KAIRO supersedes the concepts retained in the archive.

Prioritise a complete usable learner journey across Product, Creativity, Usability, Sustainability, Impact, Presentation and Intelligence. Report implemented behaviour, automated verification, human testing, learning/market validation and roadmap separately.
