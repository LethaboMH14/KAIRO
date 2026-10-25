# Model selection, adaptation, memory and training

The ambition is an improving teacher, not an uncontrolled model zoo. **Retrieval**, **learner adaptation**, **memory**, **model fine-tuning** and **voice/avatar animation** are different systems and need separate evidence. Training is user-authorized in principle; source/data licences, speaker consent, cloud entitlement and an evaluated objective still determine what can actually be trained.

## Task routing and model shortlist

| Task | Initial route | Optional experiment / release condition |
|---|---|---|
| Source extraction/OCR/layout | Existing reviewed local pipeline, moved to bounded Linux worker for cloud | Compare OCR on formulas/tables/low-quality images; do not trust fluent reconstruction of missing words. |
| Grounded teaching and explanation | Existing Google adapter behind capability probe; exact available publisher model/region pinned | Keep response structured, short and source-linked; compare held-out domain/language tests before changing model. Current code model name is not itself proof of live availability. |
| Retrieval | Lexical search + reviewed source spans first; hybrid when warranted | Embedding model needs exact licence/version, tenant filtering and local-language retrieval benchmark. Embeddings are personal-derived data when produced from private sources. |
| Multilingual STT | Locale-specific managed path; compare current South African ASR cards in catalog | Benchmark held-out speakers, technical words, code-switching, intent and numbers; no blind broad “all languages” flag. |
| Local Setswana TTS | Isolated Simba ONNX benchmark | Native-speaker quality, rights, numeric pronunciation, phone memory/bytes and timing; do not make a 109 MB download mandatory. |
| Lip/word alignment | Provider timing where actually supported; exact-audio analysis otherwise | Measure word and mouth tracks separately. No emotional talking-head video model required for the current 3D rig. |
| Offline text assistant | Rule/template extractive help in saved material first | [Qwen/Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B) is an Apache-2.0 open text-generation candidate, not a validated local-language tutor. Quantized serving, memory, prompt safety and lesson correctness need measurement; no low-end phone guarantee. |
| Efficient local transcription | Choose a checkpoint with verified runtime compatibility | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) is a CTranslate2 transcription runtime; compatibility of a particular South African fine-tune/quantization must be tested, not inferred. |
| Voice orchestration | Small explicit turn state machine first | Compare [LiveKit](https://docs.livekit.io/agents/logic/turns/) and [Pipecat](https://github.com/pipecat-ai/pipecat); pick one if warranted by requirements, not both by default. |
| SASL | Reviewed authored signer video/concept track | Avatar motion generation/vision translation requires separate Deaf-led research, rights and evaluation. Not a speech-model adapter. |
| Explainer motion | Deterministic chart/diagram templates; authored scene score | Remotion/Motion/GSAP are tools, not models that guarantee factual pedagogical output. Render jobs are bounded; generated code does not run in main origin. |

Model catalog covers exact language-specific model/dataset IDs and commercial restrictions. Non-commercial NLLB/Pocket Polyglot candidates are excluded from a commercial default. A permissive checkpoint does not make restricted underlying speech data suitable for TTS. Keep model licences, training-data rights and voice likeness permission separate.

## What makes learning adaptive before training a model

Start with a transparent rule baseline: objective prerequisites, task-level response evidence, misconception labels, assistance used, changed-item performance and time since last retrieval. Recommend one next action with a reason: “You solved this with a hint; try a changed example tomorrow.” Learner can correct or decline. Do not diagnose intelligence, emotion, race, disability or employment suitability.

For each objective, retain evidence state and uncertainty rather than a single inflated percentage. A later Bayesian knowledge-tracing/IRT approach is a candidate only after item quality, sufficient representative attempts, calibration and privacy are established. Compare it against the simple rule baseline on held-out learners and delayed transfer; more ML is not necessarily better teaching. No training labels from invented “mastery” scores or raw engagement alone.

Memory stores learner-approved preferences, goals, unfinished tasks and concise source-linked summaries. Retrieval supplies temporary course context. The live model does not continuously rewrite its weights whenever someone speaks. A learner's deleted source must leave memory/retrieval/cache dependencies under the deletion policy. Personalization must be inspectable, editable, expiring where appropriate and independent of voice/avatar preference.

## Model/data lifecycle

1. Write a task-specific error hypothesis: e.g. Setswana technical-term recognition or grounded database-step explanations. Define baseline, data rights and measurable target first.
2. Create data manifest with source/consent/licence, language/domain, preprocessing, hashes, speaker/learner split, exclusions and withdrawal obligations. Keep personal data outside public model repositories.
3. Split by learner/speaker/source family, not random near-duplicate text or audio; reserve a locked final test set. Version annotation instructions and adjudication.
4. Benchmark managed baseline and small local alternatives on quality, semantic errors, latency, cost, bytes, RAM/VRAM and operational complexity. A vendor benchmark is not a KAIRO test.
5. Only if justified, estimate a bounded fine-tuning run (e.g. adapter/LoRA for an appropriate text model or ASR adaptation). Confirm GPU eligibility, exact hourly cost, maximum hours/storage and an automatic job time limit. The current trial historically restricted GPUs; do not provision one on assumption.
6. Run in an isolated project/job identity with minimal access; pin code/weights/dataset/toolchain. Record seed, parameters, commit/hash, compute and spend. Never tune on the blind set.
7. Evaluate robustness, privacy memorization, bias, prompt injection, language regressions, source faithfulness and safety alongside task quality. Have native/domain reviewers assess held-out outputs.
8. Register candidate version with model card, data lineage, licence review, metrics and known limitations. Promote only through independent review, canary/feature flag and rollback version. No silent replacement mid-teaching session.
9. Monitor language/device-stratified quality and cost with privacy-safe sampling and opt-in feedback. Reopen errors; do not call uncontrolled online feedback automatic ground truth.

No training, model weight download or learner audio collection was performed for this blueprint. A synthetic fixture is useful for checking logic but cannot establish national language quality, representative learner outcomes or a trained model's generalization.
