# Experiment plan: mic privacy, ASR, translation and SASL

**Research plan only.** Nothing in this plan was executed: no GPU, microphone, cloud endpoint, model inference, training or dataset download. Root owns any later API integration and security design. Keep these experiments separate from existing source/classroom packages.

## Proposed turn lifecycle

1. **Before mic access:** the learner chooses Push to talk. Explain that microphone permission opens the device stream; explain separately whether this turn remains on-device or sends audio to a named cloud provider. Keep a text entry path.
2. **Capture:** request microphone only after the deliberate action; show a persistent recording state and elapsed time. Use a short, bounded in-memory buffer and a **local** VAD. Do not continuously send audio, write it to browser storage, use it to profile the learner or retain it for training.
3. **Turn end:** push-to-talk release or a clear **Finish speaking** action is authoritative. VAD may propose an end after a tuned silence window; do not make it the only way to finish. Show the transcript before KAIRO uses it. The learner can edit, retry, use text instead or cancel.
4. **Send:** send a bounded chunk only after a separately labelled consent action. Display provider, purpose and retention link. Do not include private lesson/source contents except the learner's chosen utterance and minimum context.
5. **Interrupt / Stop / route leave:** stop `MediaStreamTrack`s; close audio worklets/encoders; abort the request/stream; stop KAIRO playback; increment a request generation ID so late responses are ignored; clear local chunks and pending transcript; restore the readable source. Tell the learner if a request may already have reached a provider; do not promise remote deletion without a provider-specific verified mechanism.
6. **Output:** show transcript, original source citation and any translation side-by-side. A learner confirms before it becomes a question or note. Match voice locale exactly or keep text and captions. Maintain KAIRO identity in content, not as a claim that synthetic speech is a human recording.

VAD is only evidence that an acoustic segment sounds like speech. It cannot resolve overlapping voices, decide whether the learner finished a thought, distinguish a room voice from the learner, or correct a transcript. Evaluate silence thresholds with real consented audio later; this research used no audio.

## Human-authored phrase set

Use one fixed English source prompt so language and model differences can be compared:

> **P1:** “KAIRO, read the heading on page two. The pump is off. Wait—stop.”

For each spoken language, two fluent speakers independently author natural versions, then a third fluent reviewer reconciles the intended meaning. Record local orthography, dialect/region, code-switch choices and pronunciation notes. Keep KAIRO and the technical words as intentional named-term/code-switch tests; include a second natural variant only if speakers judge it appropriate. No machine translation output may be used as a gold reference. Evaluate separately: speaker spelling/name, page number, pump, negation “off”, interruption “stop”, full-utterance meaning and punctuation-normalized transcript.

For South African English, add consented accents and natural code-switches rather than treating en-GB/en-US samples as a South African reference. For languages with no reviewed speech set, begin with **reference authoring and consent**, not model scoring. For SASL, Deaf fluent signers author and record the signed meaning; a qualified signer annotates relevant sign units/non-manual features only if the language team chooses that representation. Do not create a word-for-word gloss from the English prompt and call it a translation.

## Evaluation design

### Speech recognition and listening

- Freeze candidate model and exact revision; log model code, tokenizer, inference precision, locale, region/model ID (if hosted), segmentation settings, language prompt, hardware and processing time.
- Capture a consented target set with speaker ID, region/dialect, device/mic, room condition, speaking rate and code-switch labels. Avoid names or real classroom/student content unless explicit consent and retention are approved.
- Split **by speaker and recording session/source**, not random clip. Keep the final speaker-held-out test sealed until model and thresholds are frozen. Deduplicate same scripts/reading text across splits; Common Voice's speaker ID and clip text alone do not guarantee classroom/general domain coverage.
- Report normalized WER and CER per language and speaker, plus raw orthographic version. Report code-switch segment error, proper-name accuracy, number accuracy, negation/critical-term accuracy, false start/end/truncation, real-time factor, first partial latency, finalization latency and Stop-to-audio-off latency. Provide confidence intervals; a handful of speakers is exploratory only.
- Compare exact-locale Google STT V2 streaming vs a frozen local baseline (Whisper only where its tokenizer explicitly supports the language; MMS only where its card lists the exact ISO code). Never treat alternative locale tags as synonyms without checking model API docs.
- Stream/chunk tests must check partial revision stability and overlap deduplication. Audio chunking is an adapter behavior; measure clipped beginnings, repeated words, missing pauses and late/stale responses. User Stop must cancel every outstanding task.

### Translation and source integrity

- Test only language pairs listed by the selected provider/model and separately count unlisted pairs as unsupported.
- Keep sentence-level parallel references authored by qualified bilingual reviewers. Evaluate literal accuracy, technical term/number/negation preservation, fluency and dialect fit; BLEU/chrF are corpus diagnostics, not safety or learner acceptance.
- Do not concatenate whole documents into NLLB-200: its model card limits intended input to sentences up to 512 tokens, says it is not for domain-specific/document translation, and says it is not for production/certified translation. It is CC-BY-NC 4.0.
- Verify every translated claim against the original passage and citation locator; retain both versions. A language being listed by Cloud Translation is not translation validation.

### VAD, endpointing and cancellation

- Use a test-only consented corpus with speech, pauses, fans/traffic, KAIRO playback echo, overlapping talk, quiet speech and keyboard noise. A VAD threshold is not learner intent.
- Measure speech-start miss/false-alarm, speech-end latency, truncated-last-word rate, false turn completion, false activation in silence/background, CPU, battery and behavior at supported sample rates.
- Define interrupt acceptance: a tap on **Stop** ends the mic indicator promptly, stops local playback, cancels server stream if supported, clears local buffers, rejects late callbacks and leaves no visible partial transcript. Verify network cancellation and vendor retention separately before claiming remote audio was withdrawn.

### TTS and identity

- Compare exact locales only. Assess pronunciation, intelligibility, prosody, number/name reading, speed and text/caption sync with fluent listeners. A different synthetic voice may be offered only as a labelled alternate voice and must not be described as the same KAIRO voice.
- Current KAIRO cloud choices are UK/US English only. The published Google voice table's Afrikaans Standard voice is not in KAIRO's current selector. Gemini TTS page marks Afrikaans Preview. Do not wire a preview/voice into KAIRO without product/security review and cost/consent checks.
- Acceptance fallback: translated lesson remains readable, captioned and source linked; KAIRO does not quietly pronounce it with a mismatched locale voice.

### SASL

- First deliverable is a Deaf-led scope and governance plan, not an avatar. Agree sign language variety, dialect/region, camera view, capture permission, reuse/withdrawal, access, annotation model, retention, compensation and community control with qualified SASL signers and Deaf organisations.
- Separate recognition (video → an annotated SASL representation), translation (SASL video ↔ reviewed written language), fingerspelling detection, dictionary lookup and animation synthesis as separate tasks. None may be reported as another task's score.
- Build train/validation/test by **signer**, then stratify/check dialect, camera, clothing/lighting/background, clip topic and collection site where available. No signer appears in multiple splits; remove duplicate and near-duplicate clips. Include signer-held-out and out-of-domain tests. Use signers fluent in SASL as annotators/reviewers; fluent hearing speech annotators alone are insufficient.
- Evaluate task separately: sign-unit/landmark detection; gloss/annotation agreement if useful; bilingual translation adequacy; manual comprehension by Deaf signers; temporal alignment and avatar comprehensibility. Collect error explanations. Report dataset/rights scope and no universal “sign language accuracy.”
- UFS's published repo has synthetic 3D printed painted hands and fingerspelling resources, CC BY-NC-SA 4.0, with commercial use requiring a formal data-sharing agreement. It is a research lead only. No dataset from that repository was downloaded or examined at file level here.

## Conditional 30-GPU-hour Kaggle plan

The **30 hours are user-reported**. Official Kaggle quota docs say a weekly limit is usually 30 hours or sometimes higher; the real account balance, hardware allocation, concurrent-session limit, current environment and eligibility are unknown. The schedule is not an entitlement or guarantee. Kaggle notebooks currently list 12-hour CPU/GPU sessions, a 20 GB autosaved work disk, and T4x2 (two separate 16 GB cards). P100 was announced to retire 2026-09-15. Check current runtime/session instructions first and save resumable checkpoints because any one session is bounded.

| Conditional budget | Experiment | Gate / result |
|---:|---|---|
| 1 h | Read account's live quota and `nvidia-smi`; confirm actual GPU model, per-card memory, drivers, session time/disk, locale package availability and exact dataset terms. Run one tiny shape/VRAM smoke test only after these checks. | If actual quota is below 30 h, rescope to available hours. If no eligible/consented data or needed model license, do not load that model/data. Two T4s are not a 32 GB single device. |
| 7 h | Frozen ASR inference baseline on exact supported locales, first on FLEURS Afrikaans and lawful Common Voice data. For each additional language, use only a reviewed compatible dataset and label the experiment exploratory. | Compare Whisper `af`/`en` and MMS exact codes; test Cloud STT only if an independently authorized API path exists (none in this package). Record baseline hashes and resource use. |
| 4 h | Error slicing with fluent reviewers: code-switching, proper names, numbers, negation, clipped first/last words and pause boundaries. | Use no unconsented examples. Reviewer time is human effort, not GPU budget. If no qualified reviewers, log it as an open gate, not a pass. |
| 6 h | Frozen NLLB-200 sentence-level research comparison on short eligible pairs only; benchmark FLORES language pairs and a small consented KAIRO phrase set. | NLLB CC-BY-NC 4.0 / no production. Stop if non-commercial research terms do not fit. Do not submit private learner or source material. |
| 6 h | Optional one-language adapter trial only if a permission/consent-cleared, representative and speaker-disjoint train/valid/test corpus exists, with a baseline frozen first. | Current Xhosa/Zulu Common Voice sets are too small; SAMA is not cleared by its current Level 0 record. If those conditions are unmet, spend **zero** hours fine-tuning. Use this slot for another frozen baseline or leave it unused. |
| 6 h | Re-run frozen tests, latency/memory checks, robustness/error summaries and recoverable checkpoints. | Report per-language sample/speaker counts, confidence bounds, license/model hashes and failures. No deployment or release claim. |
| **30 h** | **Maximum planned allocation, not promised availability.** | **No GPU, Kaggle account or data was accessed for this research.** |

VAD is small enough to benchmark CPU/on-device separately; it does not justify consuming GPU hours. TTS device/browser QA and human listening tests also should not use Kaggle. Learner outcome/next-step rules need consented evaluation data and a learner-disjoint test design; they are not a GPU-first task.

## Stop/go gates and required next owner decisions

1. Root confirms current KAIRO mic path owner, named service/data-flow and privacy/retention review before any capture/cloud implementation.
2. Language reviewers produce human-authored and reviewed references per locale; legal owner confirms each dataset/model license and commercial use.
3. A data steward approves exact dataset manifests, collection notice/consent, retention and signer/speaker withdrawal path. Record source and revision hashes.
4. A research runner verifies account GPU quota and hardware in a future, user-authorized session. Smoke-test model loading on the real device before scheduling a fine-tuning run.
5. Only after a sealed speaker/source/signer-disjoint holdout exists, use prespecified metrics and human critical-word/translation/sign review. No model promotion from aggregate scores alone.

