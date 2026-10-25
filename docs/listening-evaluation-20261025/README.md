# Issue #7: consented audio and language acceptance — 25 October 2026

## Current implementation and isolation boundary

The 25 October app already has **uploaded audio → Groq Whisper → editable transcript → explicit confirmation → question**. This feature branch adds a separate uploaded-audio flow controller at **studio/src/listening-consent/uploadFlow.mjs** which composes the existing production transcriptState.ts without modifying shared UI, routes, backend or transcriber.

This controller requires explicit per-request provider consent, aborts pending requests on cancel, ignores stale successes and failures, never silently retries, and uses the original model's edit/confirmation gate. **It is not mounted into the live UI**. It does not record microphone input, persist raw audio, submit questions, deploy a service, or validate speech accuracy. Integration is subject to coordinator review of file ownership and canonical local bus claims.

Judging impact: Product (reliable journey), Usability (correct misheard questions and safely stop), Impact (honest language accessibility).

## Proposed production UX integration contract (requires coordinator approval)

1. Show provider **Groq**, audio source, max **8 MiB**, retention/privacy explanation and **unselected** consent for **this upload** before data leaves the device. Denial must send no audio; provide **Type instead**. Groq credentials belong only on the authenticated server. The injected adapter is responsible for the server credential, exact permissions and size validations.
2. After a deliberate learner Upload action, invoke flow.upload with {audio,mimeType,locale,consent:true}. Expose the transcribing state and Stop/Cancel control with accessible announcements. flow.cancel aborts client-side and invalidates request identity; it cannot guarantee deletion of bytes already received by a provider. Do not retry or resume network uploads automatically.
3. Render existing TranscriptReview using flow.getState and callbacks flow.edit, flow.confirm, flow.cancel. Keep the text area editable and keyboard accessible. Only flow.question().ok === true can activate a separate Ask action. Never submit from a raw ASR result. Editing invalidates confirmation, and cancel clears the transcript.
4. On failure/reconnect, show error without private provider messages; **Try another upload** must require new consent and selected file, with **Type instead** always available. Release file references and avoid logging raw transcripts client-side.
5. Push-to-talk is a **separate future gate**, requiring visible permission requested/denied/granted, recording/stopped/device-lost states, explicit gesture, Stop/Discard, text parity and permitted microphone/device/assistive-technology testing. Browser observation and microphone permissions previously denied remain denied. No getUserMedia call or live microphone test occurred.

The unmodified model marks locale as requested-not-validated and accepts ISO-639-1 codes. Neither 'zu' nor 'tn' proves recognition ability; for code-switching use 'unknown' until evaluated and do not claim automatic language detection/translation.

## Synthetic fixture, language and voice research

The companion synthetic-cases.json contains **eight metadata-only scenarios**, not audio or reference speech: English, isiZulu, Setswana, English/isiZulu/Setswana code switching, noise, silence, cancel and disconnect. Each case is synthetic, not device-recorded, and not human reviewed. The tests verify invariants, not word error rate (WER) or character error rate (CER).

Permissible candidates to evaluate **only after licence/consent/provenance review**:
- Groq official documentation: https://console.groq.com/docs/speech-to-text documents multilingual Whisper, the audio-transcription endpoint and optional ISO-639-1 language. Its broad support label is **not** per-language, per-accent or mixed-language accuracy evidence. Transcription, not translation, is currently selected.
- Mozilla Common Voice dataset catalog https://commonvoice.mozilla.org/ha/datasets lists scripted **Zulu** speech (27.0, CC0-1.0 metadata). Verify exact version, quality, participants, dataset terms and approved purpose prior to download; scripted speech is not local code-switch/device acceptance. **Not downloaded.**
- OpenSLR https://openslr.org/32/ hosts Setswana multi-speaker **TTS** recordings (SLR32; CC BY-SA 4.0). This is not automatically a representative ASR evaluation set; share-alike/attribution/redistribution and suitability require licence review. **Not downloaded.**
- Google Speech-to-Text V2 official supported language/model/region matrix https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages lists Zulu (zu-ZA) and Tswana (tn-Latn-ZA) in specified regions/model families. This is a possible **comparison candidate only**; check processing region, pricing, retention and model before tests. A matrix listing is not measured accuracy.
- Google current Text-to-Speech voice matrix https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types is the authoritative source for voice IDs. No claimed or approved native isiZulu or Setswana TTS voice here. System browser voices are device dependent; captions and reading view are the reliable parity fallback.
- SASL capture/signing/animation is separately Deaf-reviewed and **not** a validated recognizer, continuous translation or signer-reviewed output.

## Human/device evaluation gate — not yet executed

After consent, privacy, provider region, retention and budget approval: recruit consenting adult speakers with native/fluent reviewers; capture opted-in science/engineering terms, natural code switching, silence, noise and varied budget devices. Keep human reference transcripts and raw audio access-controlled; follow approved delete/withdrawal policy. Split evaluation by speaker to avoid leakage. Report speaker count, minutes, language mix, WER/CER with uncertainty, technical term errors, edit-to-confirm time, abort/retry reliability, task completion using **Type instead**, keyboard/screen-reader success, and error groups. Never extrapolate from synthetic fixtures or one English sample. Research/dataset licences are candidates, not install/deployment authorization.

## Reproducible checks

On **Node 24** from studio/ run:

    npm ci
    node --test --test-concurrency=1 tests/listening-consent.test.mjs
    node --test --test-concurrency=1 tests/*.test.mjs
    npm run build

Focused checks were executed only on a local reconstruction using an exact SHA-identical copy of production transcriptState.ts and Node 22.16 with experimental TS type stripping; full repo Node 24 install, serial suite, build and permitted browser/real-device tests are pending. The handoff records actual run results and limitations. No real user audio, API call, service permission change or production deployment was performed.
