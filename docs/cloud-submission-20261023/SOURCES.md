# Original sources checked 23 October 2026

| Source | What it supports / limits |
|---|---|
| Local FNB AOTY Hackathon 2026 Programme.pdf, pp3,8–11 | Record-yourself 20s selling video, conflicting Saturday noon/13:30 deadlines, daily progress, SSDLC/Canvas/team profile/live web requirements and final date. Attached document instructions are submission evidence, not automatic permission to submit/click/create reminders |
| Five user-supplied portal screenshots in screenshots/ | Exact current form field names; static screenshots supplied by the user, no new browser observation |
| [AIML docs](https://docs.aimlapi.com/) and [quickstart](https://docs.aimlapi.com/quickstart/simple-model) | Server API setup and OpenAI-compatible chat route; exact model support must be verified |
| [AIML live model catalogue documentation](https://docs.aimlapi.com/api-references/service-endpoints/complete-model-list) | GET https://api.aimlapi.com/v1/models is documented as public/no-key and includes model capability/price metadata. Catalogue itself was not queried with an account; no balance or paid inference verified |
| [AIML model database](https://docs.aimlapi.com/api-references/model-database) | IDs include available/deprecated entries; page alone is not entitlement or a pricing guarantee |
| [Google end-user auth](https://docs.cloud.google.com/run/docs/tutorials/identity-platform), [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) | Managed end-user identity and verification; application resource authorisation still required |
| [Cloud Run runtime contract](https://docs.cloud.google.com/run/docs/container-contract), [pricing](https://cloud.google.com/run/pricing) | Container/network/runtime and resource-based charges; no inference that local filesystem is durable or all services free |
| [Cloud Tasks HTTP jobs](https://cloud.google.com/tasks/docs/creating-http-target-tasks) | HTTP jobs and authenticated handler design; idempotency and durable application status are separate obligations |
| [Storage preconditions](https://docs.cloud.google.com/storage/docs/request-preconditions) | Generation preconditions help concurrency correctness, not automatic multi-object database transactions |
| [Cloud Run GPU](https://docs.cloud.google.com/run/docs/configuring/services/gpu) | GPU serving is possible with constraints/charges; not selected for the initial release |
| [Vertex training](https://docs.cloud.google.com/vertex-ai/docs/training/create-custom-job) | Offline managed training-job path; no job launched or training benefit demonstrated |
| [HF endpoint pricing](https://huggingface.co/docs/inference-endpoints/pricing) | Dedicated hosting has its own compute billing; weight availability is not free serving |
| [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) | English embedding candidate, card Apache-2.0; requires bounded chunk/token evaluation |
| [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3) | Multilingual embedding candidate, card MIT; no KAIRO benchmark or weights acquired |
| [whisper-small](https://huggingface.co/openai/whisper-small) | ASR candidate, card lists Apache-2.0; language tags are not evaluated South African task quality |
| [Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct), [Qwen2.5-3B-Instruct](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct) | 7B card Apache-2.0 versus 3B qwen-research; cannot assume a model family's licences are identical |
| [Qwen2.5-VL-3B](https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct) | Candidate diagram/vision model discovery; exact permitted terms were not established from retrieved excerpt, so not approved here |
| [HF pickle security](https://huggingface.co/docs/hub/security-pickle) | Model acquisition requires runtime/artifact trust review; avoid arbitrary downloaded code/pickle execution |

All provider/model capabilities, licences and prices require rechecking for the exact chosen artifact/endpoint at acquisition/use. No bulk weights, private learning data or generated-person videos acquired by this package.
