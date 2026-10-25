# AI runtime integration review — 25 October 2026

## Review scope

Read-only review of `studio/server/ai-runtime/`, its learner-workspace route integration, the local workspace integration, and the learner controls. Product/Intelligence: keep source-grounded assistance private to the learner's explicitly selected provider and within the declared usage budget.

## Prior finding status

The earlier P1 is **fixed in the current workspace**. `service.mjs` enables semantic retrieval only when Google is configured and explicitly present in `providerConsent`. It invokes reranking through gateway task `retrieval`, which performs its owner-scoped request record, provider consent check, reservation, cancellation and revision check before calling Vertex. Without Google consent, retrieval stays lexical.

## Remaining product gap

**P2 — Saved practice patterns currently do not affect future lesson approach.** `/pattern-events` correctly derives correctness from the saved quiz and writes `helpExposure:'unknown'`. `curateLesson()` changes its approach only from `helpExposure:'none'` attempts, so events produced by the new `SourceClassroom` flow are counted as observations but never influence its approach. The UI currently says “Save new practice patterns for future lesson suggestions.” Either add a reliable exposure signal or describe this as a private practice record until it can influence suggestions. Do not infer independent mastery from `unknown` events.

## Other reviewed boundaries

- Hosted workspace routes are mounted after same-origin and Firebase session guards; per-learner repository reads use the authenticated UID. Local workspace uses the dedicated local SQLite store.
- Gateway requires a configured provider, explicit candidate consent, a reviewed revision callback, bounded payload and abortable provider call. Its existing tests cover owner-separated ledgers, fallback consent, cancellation and changed revisions.
- Passage help resolves a server-side lesson/source selection and validates anchored output. The studio-help route restricts scene labels to motor/pump metadata and labels readings as learner-reported context.
- Pattern events derive correctness from the saved lesson quiz, stamp server time, set assistance to `unknown`, validate an allowlisted minimized event and retain at most 500 owner events. The generic progress route now blocks direct writes to `learner_pattern_events` and `learner_preferences`.
- `StudioCompanion` expects `{text, anchorQuote, model, language?}`; `validatePassageHelp` returns these fields plus provenance, and `service.help` overrides model with the actual gateway model. The companion creates a fresh UUID request ID. The route resolves the saved lesson's first citation, checks current source revision before dispatch and passes a live revision check to the gateway.
- `node --test tests/ai-runtime.test.mjs tests/listening-core.test.mjs tests/learner-pattern-events.test.mjs tests/teacher.test.mjs` from `studio/`: 31 passed, 0 failed. These tests do not exercise HTTP integration for pattern events or studio help. No live provider, cloud, browser or human acceptance was performed.
