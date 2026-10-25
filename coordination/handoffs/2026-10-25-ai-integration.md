# AI integration and private release — 25 October 2026

Root session: `codex-ai-integration-20261025-a`, Codex, exposed model `gpt-6.1-sol`, effort unknown. Luna workers were requested at low effort for bounded extraction, opportunity/listening and release packages; their actual registrations/handoffs remain the record. Existing ML chat delivered its separate package. Claude receipt/action is **not assumed**. Bus messages 135–138 publish integration boundaries and completion evidence.

## Delivered and independently checked

| Criterion / need | Change and acceptance | Evidence | Remaining boundary |
|---|---|---|---|
| Product, Intelligence: make source-backed AI real | Durable owner gateway mounted in local and hosted lesson/passage/studio workflows; revision checks, bounded validated results, explicit alternate consent, deduplication and usage reservations | `studio/tests/ai-runtime.test.mjs`, `studio/tests/ai-connected.test.mjs`; live-ai-check.json; live-lesson-check.json | Reservations are not reconciled provider invoices. Full multi-source/indexed RAG is open |
| Usability, Intelligence: a personal plan with a reason | Language, pace and role/practical goal controls; reviewed evidence and eligible source-revision practice history inform curation; repeated unsupported answers suggest an example without inferring independent competence | Classroom displays saved plan; unknown-assistance regression and preference/API tests; live generated 3 chapters/2 questions with saved curation | No learning-style diagnosis or trained learner prediction. Six-language terminology and device voices need human evaluation |
| Product, Impact: use the lesson inside the studio | Motor/pump companion receives cited lesson, question, preferences, minimized recent attempts, selected component and visible controls; cancellation, reading and one TeacherProvider remain | Live new lesson → motor question with exact anchor; teacher tests; scene-only variables bounded by server | Prepared simulations are not generated from uploads; AI does not operate equipment or autonomously execute actions |
| Product, Usability: see extraction limits and correct them | Luna mixed-PDF gap fixed; local default now uses the same bounded extractor; coverage UI mounted; native citations/corrections retained | Extraction tests and worker handoff; full suite | OCR is not image/diagram/formula understanding. Four-page OCR, 100-unit native, section/character caps remain |
| Impact, Sustainability: find sourced opportunities | Account endpoint and `/opportunities` page show curated official/discovery metadata, requirements, closing/checked dates, stale/unknown states and safe links | Opportunity tests and live endpoint check | Not real-time crawling, eligibility/hiring decisions or automatic employer matching |
| Usability, Impact: ask with recorded words | Uploaded audio → Groq Whisper → editable transcript → explicit confirmation → question; no microphone opens | Listening worker 10/10; route tests; live generated Google English voice → Groq Whisper returned motor/stator | One synthetic English phrase is not language, accent, noise, disability or device acceptance; SASL remains separate |
| Sustainability, Presentation: deploy and reproduce | Existing private Cloud Run updated; two provider secrets stored only after specific approval; runtime-only secret accessor; Terraform installed/validated read-only root | deploy.txt, provider-secrets.json, terraform-install.txt, terraform-validate.txt, staging manifest | No public IAM, Terraform apply, Kubernetes cluster or new GPU service. External judge access arrangement remains needed |

## Runtime and files

- Hosted revision **`kairo-app-00007-snn`**, 100% traffic. Service remains IAM-private; Firebase sessions, owner material and curriculum checks passed for synthetic engineering and informatics accounts.
- Local server **http://127.0.0.1:4188**, PID recorded in local-ready.json; Google/Groq/OpenRouter configured server-side. No browser observation, capture, microphone or camera activation occurred.
- New server core: `studio/server/ai-runtime/{curator,gateway,local-store,providers,retrieval,service}.mjs`. Hosted uses the existing Firestore repository; local SQLite ledger is loopback-only.
- Mounted through `studio/server/learner-workspace/routes.mjs` and `studio/server/workspace/routes.mjs`; Google generation prompts include curator and studio context in `studio/server/google.mjs`.
- UI: `studio/src/ai-personalisation/`, SourceWorkspace, SourceClassroom, StudioCompanion, StudioRouter, workspace/types, EngineeringStudio, PumpHost, studio-coach/model and pump-lab/readout.
- Root test files: ai-runtime.test.mjs, ai-connected.test.mjs; the adversarial test fixture now supplies the required repository get method. Security behaviour was not weakened.
- Deployment package is `tools/ai-release-20261025/stage`; its explicit allowlist excludes credentials, local records, node_modules and repository metadata. Rebuild before restaging. Root operational tools are in `tools/ai-cloud-20261025`; Terraform discovery is in `infra/ai-wave-20261025`.
- Worker details: extraction-wave, opportunities-wave, listening-wave, learner-patterns and ai-release-staging handoffs dated 25 October. The ML package's directory is **learner-patterns-20251025** (existing date suffix), with synthetic-only data/evaluation; no real trained model was promoted.

## Verification

- Final serial **741/741 tests pass** (`regression-serial.txt`). Earlier two failures were repaired; the separate parallel SSR startup stall was isolated and the account panel passed **7/7**. Do not use that abandoned parallel log as a clean result.
- Latest production TypeScript/Vite build passes (`build-release.txt`); existing >500 kB 3D chunk warning remains.
- Connected release tests **25/25**; separate affected regression **22/22**; independent runtime/listening/events/teacher review **31/31** at that checkpoint.
- Terraform **1.17.0**, official ZIP checksum verified, Google provider initialized, configuration valid. No apply or resource provisioning by Terraform.
- Live synthetic checks: Google `gemini-3.5-flash-lite`, Groq `openai/gpt-oss-20b`, free OpenRouter router (actual response `cohere/north-mini-code:free`) each returned source-anchored studio answers. Google voice → Groq `whisper-large-v3-turbo` recognized the synthetic motor/stator phrase. No real learner recordings were used.
- Live Google lesson generation: 3 chapters, 2 quiz items; exact source offsets, source revision, curation, durable save and subsequent studio help all pass. This proves the bounded API journey, not browser/device usability or educational efficacy.

Evidence files are in `docs/ai-integration-20261025/`. Architecture and remaining work are documented in ARCHITECTURE.md. The deleted schedule remains off.

## Next integration gates

1. Owner-filtered retrieval across approved documents/curriculum/role requirements, with persistent index and measured coverage/region/cost.
2. Source-backed role requirements → explicit learner evidence/rubric gaps → targeted study/projects; fresh permitted opportunity ingestion; optional employer sharing and rewards with partner validation.
3. Device-tested microphone controls, terminology/voice evaluation, signer-reviewed SASL content and a separately evaluated recognition/signing path.
4. Real consented practice dataset, privacy/retention, baseline comparisons, leakage/fairness checks before any trained prediction is promoted. Kaggle GPU time is not needed for the current synthetic CPU baseline.
5. Real-device complete learner journey, retention/deletion/recovery exercises and externally tested judge access. Passing code tests and private deployment do not establish these.
