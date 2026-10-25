# KAIRO — current build brief for external research

Snapshot: 24 October 2026. Give this file to a research assistant before sending a focused prompt from RESEARCH-PROMPTS.md. This is project context, not authority to buy, deploy, scrape private services, execute downloaded code, create accounts or change security settings. Never include credentials or private learner material in a research prompt.

## What we are building

KAIRO Access helps an adult university/TVET learner move from difficult study material to checked understanding and practical evidence. The intended journey is account → relevant programme/modules → private material → extraction review → editable cited lesson → reading or KAIRO teaching → relevant interactive studio → practice → saved working → resume. The avatar's name is KAIRO; Rain is the underlying rig's attribution. Preserve our chalk, moss, sage and ink identity and simple learner wording.

The first strong subject use case is engineering. A motor supports part inspection and bounded synchronous-field-speed calculations; a pump supports an illustrative prediction/investigation. Computer Science supports a real parameterized SQLite request trace. The business stock-control example is a separate prepared teaching activity. Law, anatomy, mining and other rooms are ambitions, not all delivered experiences. Match representations to the concept: text, tables, plots, 2D diagrams, 3D, short motion or an accessible reading alternative. Do not force everything into 3D.

## Verified foundation versus current additions

The learner app is deployed on Google Cloud Run in Johannesburg as an **IAM-private pilot**. Revision `kairo-app-00003-m4q` passed 24 real API checks with two disposable synthetic users; both were deleted. The installed automated suite passed 635/635 checks, an additional import-recovery regression passed, 12 focused trace checks passed and the production build passed. The newer student-space checkpoint passes 639/639 installed tests, a final 10/10 focused rerun and the production build; its 19 real API checks are recorded separately. Browser observation remains prohibited; no visual/device/accessibility acceptance follows from these results.

Student-space additions implemented and verified on private revision kairo-app-00004-wcw (19/19 account/curriculum isolation API checks): two fictional, server-assigned student identities, one Wits Mechanical Engineering year-three example and one UP Information Systems year-two example. Public course metadata includes official codes, titles, source links and verified/unknown periods. Six engineering and five informatics modules are **selected examples**, not full registered curricula or affiliation. Motor/pump/request-trace mappings are KAIRO-authored enrichment. No fabricated grades, outcomes, deadlines, funding status, work experience or enrolment verification is permitted. Student IDs label fictional profiles; passwords authenticate accounts. A URL or browser setting must not grant another programme.

## Actual stack and where work runs

| Layer | Current implementation | Important boundary |
|---|---|---|
| Interface | React, TypeScript, Vite, React Three Fiber/Three.js, shared teacher provider, bundled brand/font assets | Teacher and 3D render in the browser; a 70B text model is not required to animate the rig |
| API | Node/Express, same-origin routes, server validation, bounded payloads | No general model-controlled shell or arbitrary code execution |
| Authentication | Firebase email/password exchanged server-side for Secure, HttpOnly, SameSite session cookie | ID tokens/keys do not enter browser storage; private requests check revocation |
| Account data | Firestore owner paths derived from authenticated UID, conditional writes and immutable source revisions | Browser cannot choose a different owner; no direct browser database access |
| Original files | Private Google Cloud Storage, owner prefix, hash/byte checks, 8 MiB uploads | Existing seven-day soft-delete window; do not promise instant irreversible deletion |
| Imports | Persistent Firestore jobs and OIDC-verified Cloud Tasks callbacks | Queue metadata UID/job ID is in Europe; files and extraction in Johannesburg |
| Extraction | Python parsers for PDF, DOCX, PPTX, XLSX and text; Tesseract OCR preview for scans/images | Native processing up to 100 units; reviewed text 48k characters/64 KiB; OCR up to four pages; no complete visual semantics |
| Lessons | Goal-based lexical evidence selection, original span offsets, bounded Vertex generation, citation validation, editable draft history/CAS | At most 12k reviewed characters selected for generation; this is not full-document semantic RAG |
| Voice | Browser narration or consented Google speech with pause/stop/cancellation | South African language quality and continuous SASL translation are not established |
| Progress | Account-scoped device snapshot, conditional cloud sync, conflict preservation and download | Visible save confirmation matters; no silent local-to-account migration |
| Deployment | Cloud Run min zero/max one, 1 CPU/1 GiB, rate-limited queue and conservative app quotas | No dedicated GPU, GKE cluster or trained mastery model is deployed |

Core paths: studio/server/learner-entry.mjs; server/account; server/learner-workspace; server/learner-repository; src/account; src/workspace; src/source-classroom; src/studio-teaching-host; src/student-space. Evidence: docs/connected-release-20261024 and docs/judge-spaces-20261024.

Google generation/speech were actually tested. Groq/OpenRouter have a separate bounded provider lab; do not assume every app call automatically routes there. AIML credit is user-reported and should not be treated as a measured current balance. The account's current Google credit balance, eligibility, expiry and GPU quota must be checked before spending; a pasted '$300 until 11 November' is not a billing probe.

## Decisions research should resolve

1. **Document fidelity:** preserve page/slide/sheet/cell/image coordinates, formulas, tables and image relationships. Detect missing extraction, report coverage and allow correction; then evaluate visual reasoning on specific cited regions. Include scanned/native mixtures and hostile/corrupt files.
2. **Retrieval:** distinguish public approved curriculum/reference data from private per-owner uploads. Filter permissions before retrieval and reranking, preserve versions/locators/licences and delete stale derived data. Search grounding does not grant bulk scraping/republication rights.
3. **Lesson composition:** create validated structured blocks with objectives, worked examples, retrieval practice, feedback and accessible representations. Cite each factual block. Treat generated code/HTML as untrusted and isolate it if execution is ever added. A2UI/MCP/framework adoption must solve a concrete gap.
4. **Teaching intelligence:** ask for a prediction, observe a task action, compare with a deterministic result, request an explanation, give a graduated hint and preserve evidence. LLMs explain; validated code computes engineering results. Do not let a model grade its own unsupported claim as truth.
5. **Learning adaptation:** begin with explicit preferences and observable attempts, hints, timing/context and missingness. Learner-level temporal holdouts, calibration and uncertainty precede mastery forecasts. Do not diagnose fixed learning styles or promise faster learning without an evaluation.
6. **Role alignment:** compare sourced job requirements with learner-confirmed skills and verified versus self-reported evidence. Similarity is retrieval assistance, not an exact employability probability. Keep role choice with the learner and explain missing evidence.
7. **Languages:** evaluate listening/ASR, translation and speech separately per language/accent/code-switching condition. SASL needs community expertise, consented/licensed data and temporal/non-manual language evaluation. A gesture classifier or LLM-generated gloss is not a working translator.
8. **Cost/operations:** compare APIs, CPU inference, batch experiments and optional GPU endpoints using measured demand, cold starts, warm idle, retries, CPU/RAM, storage, builds and transfer. No 24/7 GPU deployment merely to use credits. Budget alerts alone are not a cap; newer spend-cap features need exact eligibility/coverage checks.

## Required research answer format

Date the answer. Use current primary documentation/model cards/papers, direct links, short supporting locators and a claim verdict (verified/conditional/unsupported/incorrect). For each candidate give exact version/model ID, task, language support, licence/commercial limits, hardware/runtime/region/quota, input/output contract, privacy, total cost formula, failure fallback and an executable bounded evaluation plan. Show one conservative baseline, one stronger candidate and one rejected alternative. Mark evidence unavailable rather than inventing it.

Return an implementation slice with exact modules/interfaces, acceptance checks and rollback path. Do not recommend a broad agent framework or dedicated GPU just because it is fashionable. All seven judging criteria matter: Product, Creativity, Usability, Sustainability, Impact, Presentation and Intelligence. Map the recommendation to an observable learner need and distinguish implementation evidence, human validation, learning/market validation and roadmap.

## Immediate source checks on the pasted answer

- [Vertex online autoscaling](https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/predictions/autoscaling): ordinary minimum replicas and the separate restricted Preview scale-to-zero feature must not be conflated. Preview can drop a cold request with 429 while scaling up; a retrying asynchronous job UI is needed.
- [Cloud Run GPU configuration](https://docs.cloud.google.com/run/docs/configuring/services/gpu) and [GPU inference guidance](https://docs.cloud.google.com/run/docs/configuring/services/gpu-best-practices): GPU service configuration, supporting CPU/memory, quotas, regions and whole instance lifetime affect cost; autoscaling is not simply GPU-utilization driven.
- [Cloud Billing budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets) and [spend-cap budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps): alerts-only and supported spend caps are different. No project cap configuration has been verified here.
- [Ollama pricing](https://ollama.com/pricing): current free starter usage is limited; it is not unlimited cloud inference or proof of a particular account balance.
- [Gemini search grounding](https://ai.google.dev/gemini-api/docs/google-search/): allowance and billing depend on API/model generation and actual searches. Do not transfer a Developer API allowance to our Vertex account without checking its SKU.

These checks reject the pasted universal '$42.62 for the whole system' estimate as an unmeasured scenario, not a project quotation. Specialist-model and hosting review packages are separate parallel research deliveries; read their final evidence before adopting a recommendation.
