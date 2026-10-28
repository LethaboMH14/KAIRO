# KAIRO CS Studio — prepared HTTP request trace (Issue #49)

Date: 2026-10-25. Session: `gpt6-kairo-cs-trace-20261025-0805-b`. Client: ChatGPT GPT-6, effort unknown. Remote GitHub connector, **not** the owner's canonical local SQLite bus. No bus registration or lock was made. Cooperative exclusive scope declared in [Issue #49](https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6394215913), with [preview scope extension](https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6394227865). Started from main `0fabfdf9b8515cab8ff4100228a6a1df672491c6`.

## Learner need and observable acceptance

**Product / Usability / Intelligence:** A learner who confuses browser cache, network failure and server errors can vary cache, connectivity and origin behaviour; predict whether a request is sent and whether the result is cache reuse, HTTP 200, HTTP 503 or no HTTP response; read a step-by-step text trace; and complete a second distinguishable attempt. Native selects, textarea and buttons are keyboard operable in principle; screen-reader/device evidence still needs an authorised human check.

This is a **prepared educational conceptual model** referencing [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (HTTP semantics) and [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) (HTTP caching). The model assumes a cold HTTPS connection, a simple fresh-cache decision, no redirects, service workers, proxies or connection reuse. It does not observe network packets, contact an origin, inspect a learner's browser, validate real DNS/TLS timing, or authenticate/review learner-provided source material. A cached representation has no *new* HTTP status, and an offline network error is not an HTTP 503.

## Exclusive new paths

- `studio/src/studio-scenarios/http-request-trace/model.ts`: typed, pure trace engine with eight deterministic input combinations; strict scenario/prediction validation; 2-attempt bound; duplicate-scenario rejection independent of object key order; per-round local IDs; source/revision label and `local-unverified` evidence status.
- `studio/src/studio-scenarios/http-request-trace/RequestTraceLab.tsx`: accessible text/2D React learner interaction; scenario configuration, explicit prediction/explanation, incremental trace reveal, local attempt comparison, recovery/reset. `onLocalAttempt` callback is an **untrusted integration hook** only; a host must authenticate, validate and bind source/revision itself.
- `studio/src/studio-scenarios/http-request-trace/preview.html`, `preview.tsx`: isolated Vite dev preview at `/src/studio-scenarios/http-request-trace/preview.html`, not a StudioRouter route or production deployment.
- `studio/tests/http-request-trace.test.mjs`: pure trace cases, cache/offline precedence, status integrity, malformed input, replay, attempt provenance and UI structure checks.
- This handoff.

No edits to existing pump model/host, StudioRouter, App, global styles, package/lock/config, shared lesson/evidence persistence, #9 acceptance tests, #46/#47 owner scopes or PR #55 pump challenge. No actual local or cloud inference, private learner data, credentials, paid resources, Kaggle activity or production change.

## Evidence and integration boundary

At initial handoff creation, focused Node 24 and full repository GitHub CI are **pending**; do not infer success. This session will update Issue #49/PR with exact-head CI once available. Local container Node 22.16.0 is below repo's Node >=24 target and cannot clone GitHub because DNS is blocked; GitHub Actions is the authoritative Node24 regression/build environment.

Independent reviewer must validate semantics, native keyboard and screen-reader operation, 200% zoom and 375px width, and learner comprehension in an authorised browser. Static assertions and TypeScript build do not prove device accessibility. This is a standalone preview, not a complete authenticated source→lesson→studio→evidence journey.

## Next dependency-ready work

1. Independent subject/UX review of this slice and PR #55; reconcile live canonical bus ownership and request host contract approval from StudioRouter/lesson owners. Do **not** integrate into shared router until authorised.
2. Once #46/#47 contracts and #55 integration are accepted, create a separately claimed source/revision-bound persistence and resume adapter with negative tests for owner/revision mismatch; use authentic user-journey acceptance evidence, not local practice attempts as verified learning gains.
