# Listening package C

**Status:** bounded transcription adapter and learner-controlled transcript review state machine. No app route, provider, or question submission integration is included.

## Learner need and judging evidence

- **Product / Usability:** a learner using audio to ask a question needs a chance to catch speech-recognition mistakes. The UI displays the provided-audio source and requested/unknown language, allows edits, and requires an explicit confirm action.
- **Intelligence:** speech-to-text output is only a draft. It is not a verified understanding of the question, a translated result, or evidence of language accuracy. Question payload generation is impossible until the exact current draft has been confirmed.
- Observable package acceptance: tests verify input limits, caller abort, late-result rejection, status labels, edits invalidating confirmation, cancellation clearing content, and submission gating.

## Official model and API review

Reviewed 25 October 2026:

- [Groq Speech to Text documentation](https://console.groq.com/docs/speech-to-text) names the transcription endpoint and `whisper-large-v3-turbo`, describes the language parameter as an optional ISO 639-1 code, supports multipart file input, and documents response formats and supported audio types.
- [Groq Whisper Large v3 Turbo model page](https://console.groq.com/docs/model/whisper-large-v3-turbo) lists audio input and speech-to-text capability. The documentation describes multilingual support broadly; this package does not claim that all South African languages or dialects are supported accurately.
- [Groq API reference](https://console.groq.com/docs/api-reference) documents the transcription endpoint's response text field.

This is a frozen candidate adapter for `whisper-large-v3-turbo`, not production approval. It submits transcription only; it does not use translation. The package does not make a live API request or verify real-world language quality.

## Package boundaries

- `studio/server/listening-core/transcription.mjs` requires an injected `fetchImpl`, runtime API key, explicit `AbortSignal`, and explicit source label. The endpoint is fixed; no arbitrary URL input is accepted.
- The application cap is 8 MiB, below the vendor documented ceiling. Only listed audio MIME types are accepted. One request is made, with no retries. The adapter checks cancellation around awaits and bounds the response stream to 64 KiB and transcript to 16 KiB.
- An omitted locale is returned as `unknown` and is not sent. A listed ISO 639-1 locale is sent as a caller request and returned as `requested-not-validated`.
- `studio/src/listening-core/transcriptState.ts` exposes idle → transcribing → needs-confirmation → confirmed transitions, edit invalidation, cancel clearing, and `questionForSubmission` gating. A request ID prevents late results from replacing cancelled or newer state.
- `studio/src/listening-core/TranscriptReview.tsx` and local CSS provide accessible review controls. This panel does not start recording, does not submit a question, and makes no microphone, camera, caption synchronization, translation, or SASL claim.

## Checks and remaining gaps

The focused Node suite uses only synthetic in-memory bytes and injected fake responses. It never activates a microphone, reads audio from a file, contacts Groq, or submits a question. Whole-project build results are recorded in the coordination handoff because unrelated root changes can affect them.

Root still needs to review and connect the panel to an approved question flow. Before real use, confirm provider consent, secure key handling, privacy/retention, allowed upload formats, language and accent quality, learner correction behavior, and keyboard/screen-reader/device acceptance. The UI and adapter are prototypes; human validation and real transcription acceptance remain open.
