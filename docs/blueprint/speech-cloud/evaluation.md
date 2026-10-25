# KAIRO multilingual speech evaluation plan

This is a research/evaluation plan, not a test report. It assumes an adult 18+ pilot as confirmed by the user. No learner audio is authorized for collection by this plan. Build an evaluation corpus only after native-speaker participation, consent terms, data handling, budget and research review are agreed.

## Evaluation questions

1. Does the selected STT system transcribe native isiZulu and Setswana speech accurately enough for grounded learner questions, including common code-switching, names, subject vocabulary and low-quality phone microphones?
2. Can the learner understand the selected voice, pronunciation of technical words, numbers and code-switched phrases? Does it sound acceptable and respectful across regional accents?
3. Can KAIRO align each highlighted word, gaze, point and board action to the **exact audio playback**, and cancel without showing content not yet spoken?
4. Does an interruption work reliably on a phone with variable latency and low data? Does “I’m stuck” make it easy to get a simpler explanation without needing voice?
5. Can KAIRO make a credible Deaf-led SASL feature without presenting generic gestures, speech captions or machine-generated glosses as signing?

## Native-speaker and Deaf-led protocol

- Recruit **separately** native isiZulu and Setswana speakers across regions/dialects, age range within adult pilot, gender, first language and common code-switch patterns. Include educators and learners, but do not ask one fluent reviewer to represent a whole language community.
- Recruit Deaf native SASL users and qualified SASL interpreters/educators for signing work. Deaf reviewers should control scope, signer choice, language quality, non-manual markers, filming conditions, translations, corrections and publication approval; pay reviewers and signers for their expertise and time.
- Use a written consent that explains the task, expected audience, whether audio/video will be sent to a cloud vendor, retention, public release, model-training eligibility, commercial use, voice cloning, withdrawal process and contact for questions. Default **no voice cloning or model training** unless a separate explicit permission is negotiated. Consent for ASR does not imply permission for TTS.
- Separate train/development/evaluation data by speaker, not random clip. Keep the blind evaluation set inaccessible to model tuning. Use only approved source text and consented samples; do not copy web/podcast recordings simply because a dataset card mentions them.
- Keep an auditable versioned list of prompts, language/locale, speaker ID code (not real name), mic/device, noise, consent scope, transcription corrections, model/provider/version, all transformations and reviewer decision. Restrict access and delete raw recordings under the agreed schedule.

## Speech set design

The following is a proposed minimum first evaluation set, not a population-representative sample:

| Split | Suggested design | Purpose |
|---|---|---|
| Prompt familiarization (not scored) | 5–10 short prompts per participant; confirm mic, comfort and pronunciation variants. | Avoid scoring setup confusion; allow participant to correct their own displayed transcript. |
| Blind STT test | Start with 8–12 speakers per language × 20 short utterances each (roughly 160–240 utterances per language). Include conversational spontaneous speech and 25% code-switch/loanwords; hold speakers out from all tuning. Expand after pilot effect-size review. | Produce an initial error profile without pretending this small sample establishes national performance. |
| Noise/device strata | Each utterance paired with a clean close-mic and natural phone/room condition where participant agrees; use a small controlled set of noise/spacing conditions, not destructive audio augmentation as the only proxy. | Measure actual phone capture differences, distance and background noise. |
| Domain vocabulary | Include names, numbers, formulas, units, common English technical terms inserted into the local language, inflection and ambiguous homophones. Native instructor writes and approves alternatives. | Detect errors that change explanation meaning, answer grounding or board actions. |
| TTS comprehension and preference | 20–30 short lines per chosen voice/locale, with target pronunciations, numbers and normal conversational phrasing. Include one speaker-independent blind presentation and feedback. | Evaluate intelligibility and language acceptability, not only MOS score. |
| Word/event timing | 50–100 short utterances per TTS locale with manual timing labels for spoken words and intended stage cues; at least two annotators, adjudicate disagreement. | Compute word-boundary error and cue timing error against human labels. Keep label policy for contractions/code-switched tokens explicit. |
| Interruption stress | Script rapid interrupts, button stop, silence, double stop, old response chunks, network delay/drop and “I’m stuck” after formula/number/definition segments. Include real users only with consent. | Verify cancellation, exactly-once cue terminal events and preservation of last completed spoken span. |
| SASL authored content | Deaf-led glossary, short lesson and concept set that covers spatial reference, facial/non-manual expression, fingerspelling and domain concepts. | Review signed video for naturalness/completeness and learner comprehension with Deaf participants. Do not score against spoken-word alignment alone. |

Size per split is only a starting hypothesis. The evaluation owner should use pilot variance and available native-speaker capacity to justify any expansion. Do not claim a confidence interval or representative quality from the initial small set without computing and stating the sampling assumptions.

## Metrics and reporting

| Area | Report | Guard against |
|---|---|---|
| STT | WER and CER, with tokenization conventions per language; utterance-level exact intent/entity accuracy for `number`, `topic`, `I’m stuck`; error taxonomy (substitution/deletion/insertion, code-switch, entity, negation, number). | A good overall WER can hide dangerous negation/number errors. Report per language, speaker, phone/mic condition and code-switch stratum, plus denominator. No vendor’s global WER is local KAIRO proof. |
| Confidence / interaction | Calibration/coverage if scores exist; correction rate, false “I’m stuck”, missed interrupt, false interruption/backchannel, turn-end latency and successful cancellation. | Don’t treat raw recognition confidence as calibrated certainty. Let user edit transcript and recover from mistakes. |
| TTS quality | Native listener intelligibility, pronunciation correctness for technical terms/numbers, naturalness/pleasantness, language acceptability, speaker/voice selection preference; collect comments with consent. | An English-only MOS panel cannot validate isiZulu/Setswana. Do not infer quality from voice availability. |
| Timing | Word-boundary mean/median/95th percentile absolute error (ms); fraction within pre-agreed tolerance; missed/duplicate event rate; exact audio version, offset semantics, playback path and SDK. Visemes separately: timestamp error and expected mapping alignment, plus human visual review. | An SDK event’s availability is not evidence of accuracy for the locale. Word boundaries and visemes are different signals. Do not map TTS marks to all words unless the provider contract and actual audio show that. |
| Lesson action correctness | Correct highlight text range; correct target ID for gaze/point; correct board-written text/number; source fact agreement; action count and completion/cancellation state. | No free-form target/action from the LLM. Incorrect action can mislead even when transcript is right. |
| Interrupt/safety | Stop-to-silence P50/P95; stale audio after stop; old cue terminal count; overlap with new response; last-spoken source span; transcript correction availability; network failure recoverability. | A green integration test is not proof under real phone/network audio capture. |
| SASL | Deaf reviewer ratings by concept, naturalness, grammar, non-manual markers, spatial reference and clarity; comprehension tasks with Deaf users; disagreement/comments, revisions and sign-off scope. | BLEU from a spoken-text translation does not establish SASL correctness, naturalness or access. A signing avatar can still omit essential grammar. |
| Accessibility/data | Setup success with voice disabled; bytes per turn; initial model bytes; reading/caption/keyboard route; reduced motion; mic status comprehension; screen-reader/keyboard completion; language choice retention. | Don’t use a 3D performance score as a substitute for the lightweight 2D route. |

Report both user-facing and technical measurements. Publish no claims such as “supports isiZulu” until they are qualified, e.g. “tested on adult pilot prompts in conditions X/Y; limitations Z.” Keep the provider-supported matrix distinct from locally evaluated results.

## Reproducible provider comparison

For each candidate row, store a dated test record with:

- service, exact model/voice ID, SDK/API version, region/endpoint, call mode (`short`, streaming, batch, synchronous TTS), account quota status, request settings and whether data logging is enabled;
- test corpus revision, consent scope, split seed or speaker partition, language/locale and recording context;
- input audio/text hash (not a public identifier), reference transcript and corrections, output audio hash, event offsets and timing unit;
- model calls, retries/errors, bytes and billed chars/minutes using the current price sheet; never paste secret keys or bearer tokens;
- output latency (P50/P95), quality metrics and qualitative notes, device/browser/OS, network profile and device resource observations;
- reviewer role (e.g. native Setswana educator) and feedback authorization, without publishing their identity unless they explicitly consent.

First compare managed services with a small consented set. Only then decide whether the open model is worth a local benchmark. The user broadly authorized use of existing cloud credits/resources; once live credits, entitlement and endpoint are read-only verified, proceed with the first experiments within the proposed $30 gross-cost engineering cap without requesting authorization again. Do zero paid calls until those checks succeed, and stop if the plan exceeds $30 or changes the account/subscription. This is an engineering limit, not a provider quote or verified credit balance. Do not use restricted Swivuriso data for TTS.

## Decision rules

- **No launch gate based on vendor locale matrix alone.** A capability is pilot-ready only when reviewers approve task-specific use and the app has a visible user fallback.
- **Numbers/negations/technical facts:** any error that changes lesson meaning must fail the utterance-level safety gate even if WER is favorable; show transcript and let user correct before triggering a board action.
- **Action timing:** stage cues require source-linked, author-approved spans and measured timing. If timing fails, degrade to sentence-level actions at explicit segment boundaries; do not claim word-by-word synchronization.
- **No event stream:** use pre-generated/audio-aligned lesson chunks for authored content; keep generated answers as speech + transcript with simple gestures, no claims of exact word-locked writing.
- **Phone or low data:** if latency, battery, bytes or frame rate misses the agreed target, keep 2D/text/captions and defer 3D narration; do not silently download larger weights.
- **SASL:** if Deaf-led reviewers reject content, do not ship it; use captions/interpreter-recorded authored material only when its rights are clear.
- **Cost:** if live trial eligibility, quotas or service location is uncertain, perform zero paid calls. Recompute estimate for current price/traffic mix and stay within the verified user-authorized $30 first-experiment cap; exceeding that cap or changing accounts requires revised scope.
