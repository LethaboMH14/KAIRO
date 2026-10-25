# KAIRO speech, language and SASL research

**Reviewed:** 2026-10-24. **Status:** research recommendation only; no provider calls, audio recordings, model runs, dataset downloads, training, or learner tests were performed.

## Recommendation

Keep KAIRO's current readable lesson text and selected teacher identity as the reliable path. Add microphone speech only as an explicit, cancellable action with a text alternative. Do not present language choices in settings as proof that speech recognition, translation, or voice output works in that language. A language being present in a vendor/model table means only that the vendor/model lists it; quality for KAIRO, local accents, code-switching, technical vocabulary, device latency and learner comprehension is unmeasured.

No single reviewed candidate covers the full spoken-language set, supplies matching South African speech output, preserves one KAIRO voice across languages, and is cleared for commercial use. South African Sign Language (SASL) needs a separate Deaf-led visual-language programme. Speech recognition, speech synthesis, ASL assets, fingerspelling meshes, and gloss strings are not SASL sentence translation.

| Decision | Recommendation | Why / gate |
|---|---|---|
| Mic interaction | Prototype **push-to-talk first**; never open-mic by default. Use explicit permission, a visible live state, short-lived local chunks, editable transcript, explicit send, and Stop that closes tracks, aborts requests, clears in-memory buffers and ignores late results. | KAIRO source currently has no microphone capture/ASR path. Browser permission is not product consent to send audio to a cloud vendor. See [experiment plan](experiment-plan.md). |
| ASR baseline | Compare exact-locale Cloud STT V2 and on-device/open model baselines only after data/consent review. Current V2 tables list 9 of the 11 spoken official languages with exact South African codes; V1 additionally lists `en-ZA`. This is not a measured KAIRO quality result. | Region/model availability differs; select only supported code/model/region combinations. Preserve transcript edit/confirm before it becomes lesson content. [Language matrix](language-matrix.csv). |
| Translation | Use a human-reviewed draft behind explicit consent and keep the source passage, citation IDs and revision immutable. Current Cloud Translation's table lists 10/11 spoken languages (Ndebele South uses `nr`; Tshivenda is not listed). | A supported pair is not a verified translation; do not translate source IDs, formulas, quantities or negation without checks. NLLB-200 is non-commercial research only and expressly not for production/domain-specific document translation. |
| Teacher voice | Keep one KAIRO identity. Use the chosen voice only for its exact supported language/voice. If no compatible output voice exists, show the translated text and captions; do not silently switch to UK/US English or claim cross-language voice identity. | Current in-app Google choices are English UK/US voices. Google's published list includes an Afrikaans standard voice and no `en-ZA` or other South African official-language voice. A separate Gemini TTS page lists Afrikaans as Preview, but that adapter is not in KAIRO. |
| Fine-tuning | Do not fine-tune in this package. First freeze a baseline, check rights, deduplicate, author references and build speaker/source-disjoint splits. | Current inspected Common Voice Xhosa/Zulu sets are tiny (27.0 Xhosa 35 clips / 5 speakers; Zulu 223 clips / 9 speakers). The larger SAMA corpus is Level 0 in its repository and is podcast-harvested/automatically transcribed; permission and label quality remain gates. |
| SASL | Start with a Deaf-led discovery and data-governance partnership, consented natural signing clips, sign-language expertise and a signer-disjoint benchmark. Keep readable text and captions as alternatives. | UFS SASL HLT materials include annotated/synthetic fingerspelling data under CC BY-NC-SA 4.0; commercialisation needs a formal data-sharing agreement. This does not establish continuous natural SASL recognition, translation or avatar synthesis. |
| Kaggle | Treat **30 GPU hours as user-reported**, not available quota. Before any future experiment, inspect the account's current quota and session GPU; Kaggle describes weekly quota as 30 hours or sometimes more. | P100 retirement was announced for 2026-09-15; Kaggle's staff post says T4x2 remains, with two separate 16 GB GPUs, not one 32 GB pool. Notebook docs currently state 12-hour CPU/GPU session limits and 20 GB autosaved working disk. No account or GPU was opened here. |

## KAIRO baseline checked in source

Read-only source inspection on 2026-10-24 found:

- `studio/src/teacher/TeacherSettings.tsx` exposes `en-ZA`, `af-ZA`, `zu-ZA`, `xh-ZA`, `st-ZA`, and `tn-ZA` as **browser/device narration preferences**. The implementation lists voices available on that device and says a missing language is not silently replaced with English.
- The Google TTS choices are `en-GB-Chirp3-HD-Aoede`, `en-US-Chirp3-HD-Kore`, and `en-GB-Chirp3-HD-Puck`. The copy identifies them as synthetic UK/US speech, not a recorded teacher, and says South African voices need a separate adapter. Consent is required before sending chosen text to Google for synthesis.
- A source search found no `SpeechRecognition`, `webkitSpeechRecognition`, `getUserMedia`, `MediaRecorder` or VAD implementation under `studio/src`. This is a bounded source search, not proof that no external/OS capability exists.

Therefore the UI language list does not imply mic support. Preserve KAIRO's selected visual/persona identity in copy, narration controls, text, captions and future adapters. Never describe a machine voice as the same human voice in a new language without evidence and permission.

## Capability boundaries

The per-language flags and exact model tags are in [language-matrix.csv](language-matrix.csv); candidate trade-offs are in [model-evaluation-matrix.md](model-evaluation-matrix.md).

- **ASR/STT** recognizes audio as text. Cloud STT V2 is bidirectional-streaming capable; its language page is region/model-specific. Whisper `whisper-1` is a file model, not streaming mic recognition. A locally chunked Whisper loop is an adapter experiment, not native streaming.
- **VAD** estimates speech vs non-speech. It does not understand meaning, speaker identity or when a learner's turn is complete. Use push-to-talk plus a user-visible endpoint/confirm control; test false starts, pauses, room noise and interruptions.
- **Translation** outputs a text draft. Preserve the source and anchored citations next to it; human-review technical meaning, quantities, proper nouns, negation and code-switches. A translation model cannot repair an incorrect transcript or make a citation support a changed claim.
- **TTS** speaks supplied text. It does not translate text and it does not prove that KAIRO has the same voice/accent in every language. If exact locale output is unavailable, keep text/captions and make the limitation explicit.
- **SASL** is a distinct visual-gestural language. ASR, voice TTS, ASL datasets, word-for-word gloss, and synthetic fingerspelling alone do not provide SASL understanding, signed translation or an animated signer.

## Judging need and acceptance evidence

The judging targets are **Usability** (the learner knows when KAIRO is listening and what happens next), **Impact** (a mic or matching voice is not required to access material), and **Product** (source meaning, privacy, cancellation and voice identity remain reliable). Observable future acceptance: on each exact locale, a qualified-speaker-held-out test has a published error/critical-word report; the learner can edit transcript/translation before use; Stop ends capture and pending work with no late transcript; no unsupported voice is silently selected; and SASL is evaluated by Deaf fluent signers on signer-held-out data. None of these user/device acceptance checks was run here.

## Files

- [Language-by-language registry](language-matrix.csv) — 12 official languages, provider/model listed coverage, KAIRO settings, dataset leads, and an English source prompt for a human-authored evaluation pair.
- [Model and capability matrix](model-evaluation-matrix.md) — ASR, streaming, VAD, translation, TTS, voice-preservation and SASL comparison.
- [Experiment plan](experiment-plan.md) — privacy-first turn contract, test phrase authoring, metrics/splits, data/license gates and a conditional 30-hour Kaggle schedule.
- [Sources and limitations](sources.md) — dated primary links, checked claims and caveats.

