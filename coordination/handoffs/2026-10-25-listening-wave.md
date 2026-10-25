# Listening wave handoff — 25 October 2026

## Ownership

- Agent: `codex-luna-listening-20261025-c`
- Client/model/effort: Codex / `gpt-6-luna` / low
- Scope: `studio/server/listening-core/`, `studio/src/listening-core/`, `studio/tests/listening-core.test.mjs`, `docs/listening-wave-20261025/`, this handoff.
- Interface: new bounded injected-fetch adapter, state machine, and stateless review panel. No shared router/server/provider files were edited.

## Delivery

- `createGroqTranscriber({fetchImpl})` targets only Groq's documented transcription endpoint and fixed `whisper-large-v3-turbo` model. Each call requires runtime API key, explicit abort signal, supported audio MIME, and source label. It limits audio to 8 MiB, response to 64 KiB, transcript to 16 KiB, performs one request with no retry, and checks cancellation before and after awaits. No credentials are returned or stored.
- Unknown locale is explicitly labelled and omitted from the request. Listed ISO 639-1 language inputs are sent as a request and returned as `requested-not-validated`; no South African language-wide accuracy claim is made.
- `transcriptState.ts` requires confirmation before returning a question payload. Edits clear confirmation. Cancel clears the text and increments the request identity, so a late response cannot replace the cancelled state.
- `TranscriptReview.tsx` presents source and language labels, edit, confirm, and cancel controls. It does not capture audio or submit questions.

## Official capability evidence

- Groq Speech to Text: `https://console.groq.com/docs/speech-to-text` — endpoint, multipart file field, optional ISO 639-1 language, supported audio formats, response format, model choice.
- Official model page: `https://console.groq.com/docs/model/whisper-large-v3-turbo` — audio input, speech-to-text capability, broad multilingual description.
- Groq API reference: `https://console.groq.com/docs/api-reference` — transcription endpoint and text response.

The official material supports choosing the model as a transcription candidate; it does not establish accuracy for each South African language, accent, or dialect. The API was not called.

## Checks

- `node --test --test-reporter=spec tests/listening-core.test.mjs` from `studio/`: 10/10 pass. Includes synthetic audio input, allowlist/8 MiB checks, one-request/no-retry behavior, response bounds, abort before fetch/during fetch/during body reads, unknown locale, and confirmation/edit/cancel/late-response gating.
- `npx tsc -b` from `studio/`: exit 0 on the latest run.

## Remaining work

- Root reviews the package and mounts the review panel only after deciding provider consent and question-flow integration.
- No real audio, service request, browser, learner, screen-reader, device, or language-accuracy acceptance was performed.
