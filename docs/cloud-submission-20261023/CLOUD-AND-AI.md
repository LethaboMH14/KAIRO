# Cloud and AI solution architecture — implementation decision pack

23 October 2026. KAIRO is the teacher and product identity. This is the target architecture plus inspected current state, not a statement that the app is deployed. [Explorable topology](architecture.html). [Concrete source boundaries and next changes](DEPLOYMENT.md).

## First release and ownership

One adult learner uses reviewed engineering material, reads/listens to a cited lesson, inspects a supported motor, practises, keeps private evidence and resumes. Three existing surfaces remain reachable; only engineering is the full showcase focus. Pump can join after its released interface/domain limits are independently reviewed. Law/anatomy/full degree catalogues are roadmap, not rendered demo substitutes.

Root owns authentication, tenant/owner access, lesson/source/session contracts, provider routing, billing controls, deployment and integration. Luna A builds a pure lesson sequence/quality package; B a stateless lesson-start panel and detailed edge-case audit. Claude's bounded visual/tracking work remains isolated. Their code becomes integrated only after root review and checks; bus notices alone do not invoke an agent.

## What exists versus target

Current Vite/React/Three application uses a loopback-only Node/Express API. The API guard rejects non-local hosts; server binds 127.0.0.1. Source/lesson metadata uses local JSON files, extraction jobs are process-local, and upload extraction invokes a Windows virtualenv path. The source API has no user/tenant ownership enforcement. These are inspected release blockers, not hypothetical warnings. Copying this server to Cloud Run would either fail routing or expose a shared workspace if the guard were simply removed.

Current Google managed text generation has one recorded successful public synthetic source request (docs/app-flow-20261023/api-verification.json). Model defaults to gemini-3.5-flash-lite; exact configured metadata is reported. Existing consented Google TTS and device voice are separate. Local source search is lexical; the experimental attempt-history logistic regression is limited by data/validation gates. MediaPipe hand tracking is a local camera experiment, not SASL recognition. The current source plan and studio interactions are bounded educational examples.

New this package: server-only AIML chat adapter and a locally tested task-routing prototype in studio/server/ai-gateway. Six tests cover admission, idempotency, owner-separated requests, fallback consent, cancellation/stale revision and structured response boundaries. **It is not mounted into the current Google-only lesson API/UI.** That consent UI only says Google; silently routing its private text to another provider would be wrong. The prototype's memory budget/ledger must be replaced by a durable transactional implementation before multi-instance public use.

## Target components and why

| Layer | Initial choice | Reason / deployment boundary |
|---|---|---|
| Web app | Existing Vite SPA on Firebase Hosting or Cloud Run static serving | Retain design/3D investment; no framework rewrite. Choose one public origin with managed HTTPS |
| Identity | Firebase Authentication/Identity Platform, including a bounded private-guest identity | Managed token validation. Email alone never proves institution/course/year membership |
| Application API | Cloud Run CPU service with attached service identity | One API enforces owner/tenant/module permissions and source revisions; no service-account key in browser |
| Canonical state | PostgreSQL with pgvector enabled only when embeddings are adopted | One source of truth for users/enrolments/sources/lessons/jobs/attempts/usage. Managed Cloud SQL is preferred Google option only after actual cost/region approval; don't provision always-on capacity merely for a diagram |
| Private objects | Cloud Storage with public access prevention | Originals, extracted artifacts, reviewed media and private model artifacts; opaque owner keys and short-lived authorised access |
| Background work | Cloud Tasks → private Cloud Run extraction/evaluation worker | Bounded retries, idempotency and durable status. Queue is not a real-time speech clock; worker OIDC auth is checked |
| Models | Existing Google managed model first; separately consented AIML alternative | Avoid GPU ops for first release; select exact model and verified task capability/price before dispatch |
| Open weights | CPU worker for small embedding/baseline ML; isolated batch GPU only after benchmark | Download isn't hosting. Pin model/revision/hash/licence/runtime; never automatically fetch remote code or huge weights on a learner's phone |
| Secrets/ops | Secret Manager, Cloud Logging/Monitoring, Artifact Registry/Cloud Build | Request IDs and cost metrics, no source text/CV/audio/secrets in logs. Max instances/quota/alerts are layered controls, not a universal hard spending cap |

Do not add Firestore as a second canonical store to avoid a deliberate SQL decision. A cheap short-lived pilot could choose a single managed free PostgreSQL alternative with reviewed terms/region instead; that would be an explicit architecture decision, not a hidden substitution. GCP project credits and AIML balance are separate accounts.

## Exact request lifecycle

1. User signs in or receives a private guest identity. API verifies the token and loads authorised organisation/module assignments. A self-declared selection affects relevance, not security.
2. API admits a supported upload with byte/type/page limits; object receives owner ID, source ID and deletion/retention metadata. Queue task stores a job ID; queue payload references private objects, not unrestricted URLs.
3. Sandboxed Linux worker parses/OCRs a bounded file with pinned dependencies, timeout/memory/temp limits. Persist status and extracted sections. Client polls/streams status safely. No background promise is the durable job record.
4. Learner reviews extraction. API creates an immutable reviewed revision; lessons/citations refer to that identity. Edits invalidate dependent pending work, never silently reuse the old result.
5. Lesson request carries owner ID, idempotency key, revision, goal, selected provider permission and usage allowance. Gateway validates source scope and model capabilities before reserving a conservative cost/token allowance atomically.
6. Retrieve only that user's permitted reviewed source passages (and separately labelled reviewed reference corpus). A requested degree/module filters context but cannot grant access. Hybrid lexical/embedding retrieval is later than correct source filtering.
7. Primary managed model returns bounded structured content. Validate schema, exact evidence IDs/quotes and current source revision. A model claiming confidence does not bypass checks. Invalid citation/schema is rejected, not retried until a model produces an agreeable answer.
8. Only transient provider failure may use the one configured fallback, under the SAME overall deadline and only if the learner separately allowed that provider. No fallback on cancel, changed source, missing permission, exhausted allowance or invalid citations. Local reading is offered with a visible mode change; it is not disguised as AI generation.
9. Save validated lesson/version/provider/model/request/cost metadata. Root reconciles actual usage conservatively; admission reservations cannot assume failed requests are unbilled. Idempotent duplicate requests return the existing result without another provider call.
10. Narration gets its own text/language/voice consent and cancellable task. Shared narrator controls all routes. Long render/export jobs use a queue and human-reviewed templates; never let generated HTML/JS run with application credentials.
11. Assessments retain attempts, hints, assisted/unassisted labels and source context. Evidence is private until explicitly shared. Skill estimates, coursework marks and verified professional competence remain distinct.

## Model registry: every task has an owner and location

| Task | Current / first choice | Open-weight alternative and location | Promotion gate |
|---|---|---|---|
| Lesson/passage reasoning | Configured Google managed text model; successful synthetic lesson recorded | Qwen2.5-7B-Instruct candidate on isolated server/GPU or provider serving same pinned model | Held-out engineering correctness, citations, latency and cost; no fine-tune required first |
| Provider alternative | AIML server-only chat adapter, no live call yet | Exact catalogue model ID from AIML's public model catalogue; host is provider, not our bucket | Key configured securely, current capability/price, separate user consent, synthetic smoke then evaluated corpus |
| Source embeddings | None active; lexical local retrieval exists | all-MiniLM-L6-v2 for English CPU prototype; BAAI/bge-m3 for multilingual server benchmark | Recall@k/grounding test, chunk/token limits, language slices; changing encoder requires reindex, dimensions and version recorded |
| OCR / diagrams | Existing extraction/OCR review pipeline | Tesseract-style OCR where already available; later Qwen2.5-VL benchmark only after exact licence/runtime review | Accurate page/character extraction and learner review, not a model's guessed diagram readings |
| Speech input | Not required for first text flow | whisper-small candidate in isolated CPU/GPU ASR worker | Per-language WER/task quality, consent, noisy audio tests, correction before use; no automatic recording |
| Speech output | Device voice or consented Google TTS | A reviewed local TTS model only after language/voice rights and hardware benchmark | Voice/language availability, intelligibility, interruption, captions; no voice cloning without permission |
| Hand tracking | MediaPipe hand landmarks, browser worker, pinned assets | Current local model; no need to upload camera frames or host GPU | Real device/camera lifecycle tests still required; this is tracking, NOT SASL |
| Learning support | Transparent next-step rules plus experimental attempt-history logistic model | CPU logistic regression or gradient-boosted baseline in offline training job | Consented longitudinal data, learner-level/temporal split, calibration/Brier baseline, minimum sample gates, no claimed mastery from synthetic tests |
| Opportunity matching | Original-source requirements and explicit rules first | Embedding candidate retrieval + reviewed rubric, CPU service | Freshness/eligibility/expiry, counterexamples and user correction; no job-probability guarantee |
| Motion/video | Authored deterministic explainer templates and real app recordings | No generative video model required for functional demo. AIML media only with separate limited asset budget | Rights, factual review, accessibility/captions and actual final frame/audio verification |

Google/AIML services are managed APIs, not all open source. HF Hub stores/distributes weights; hosting/inference/training is a separate paid/free service choice. Model cards checked: Qwen2.5-7B-Instruct Apache-2.0; Qwen2.5-3B-Instruct is labelled qwen-research and is **not** the permissive commercial baseline. all-MiniLM-L6-v2 Apache-2.0, bge-m3 MIT; whisper-small HF card lists Apache-2.0. Runtime/data/voice and individual artifact terms still need exact review. Qwen2.5-VL candidate licence was not established from the retrieved excerpt, so it is not approved for acquisition/deployment. See SOURCES.md.

## Where training actually happens

Training is offline, not per request or in a learner's browser. Initial attempt/skill predictors train on CPU in a reproducible local script or Cloud Run Job; retain data/feature/version/evaluation manifests and the previous approved model. Pin training rows by owner consent and purpose. Fit preprocessing on training split only; split by learner and time to avoid memorising repeated attempts. Do not train on arbitrary uploaded books/CVs/audio because the model can read them. Delete/retention requirements apply to derived training data too.

Use a small human-reviewed public/synthetic evaluation set now to test curation/citations and engineering invariants. Synthetic evaluation does not establish learner outcomes. For LLM fine-tuning, first establish a stable task-specific baseline and an error pattern that prompting/retrieval cannot solve; then prepare rights-cleared instruction pairs, separate evaluation, cost estimate and LoRA experiment on an isolated Vertex Custom Training or HF job. A specific GPU/model/time budget is approved before launch. Nothing in this package launches training or downloads model weights. HF jobs/endpoints and Cloud Run GPUs are not assumed free.

Model artifacts belong in a private registry/bucket with revision, sha256, licence, task, input/output schema, languages, evaluation, limits and rollback identity. Serve small predictors/embeddings in a CPU worker; serve large weights only where measured GPU memory/latency/cost justify them. Approved changes move through candidate → offline eval → synthetic staging → limited pilot → monitored serving, with rollback. There is no automatic promotion or continuous self-training from learner activity.

## Credit and configuration boundaries

User reports **$13 AIML credit**; balance/expiry/top-up settings not independently verified. Proposed allocation, not a spend: $2 text comparison, $2 speech check if needed, at most $4 promotional assets after price/rights review, $5 reserve. Never assume enough for 20 seconds of any particular video model; price per second/job differs. Total admission must remain within confirmed account allowance and a smaller task cap. The memory ledger prototype is useful local evidence but is **not** a distributed/provider-enforced spending ceiling.

No AIML_API_KEY is configured in the current process (name-presence check only; no secret values read). Configure it via Secret Manager/server environment, never VITE_* or chat. Select the exact model after live catalogue/price inspection. No AIML spend, secret upload or model-training run was made. Existing Google credit/expiry observations are historical; current enabled APIs were inspected but credit balance not verified.

Enabled APIs include Run, Cloud Build, Artifact Registry, Cloud Storage, Vertex, TTS, logging/monitoring and Firestore. Root then enabled **identitytoolkit.googleapis.com, cloudtasks.googleapis.com and secretmanager.googleapis.com** in the existing project; the operation completed successfully and a second read-only list confirmed all three. This enables APIs only: no authentication provider, queue, secret, service account permission, storage/database resource or hosted app was configured by that operation. Enabled Firestore is not evidence of configured app identity, tenant permissions or deployed hosting.
