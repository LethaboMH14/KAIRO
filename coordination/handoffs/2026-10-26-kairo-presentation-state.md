# KAIRO presentation state adapter

## Proposed interface (published before implementation)

Criterion: **Product** (coherent presentation state) and **Usability** (safe interruption/recovery); supports Creativity/Presentation only where a real cue is available. Need: learners must see honest, recoverable presentation status while moving through lesson contexts, including constrained/reduced-motion devices.

Export `createPresentationState(contextKey, reducedMotion, availableCues)` and `transitionPresentation(state, event)`. The state is immutable and carries the supplied cue allowlist. Events: `context-changed`, `request-started`, `content-ready`, `request-failed`, `cancelled`, `saved`, `compact-changed`, `motion-changed`. Request-result events must match both active request ID and context. Cancellation and context changes invalidate outstanding work. Unknown event shapes are ignored without mutating state. Requested cues resolve only to allowlisted cues; missing tablet cues fall back to `idle`, then `explain`, otherwise `null`. Compact/reduced-motion suppresses tablet transitions. A saved acknowledgement is emitted only in response to caller-confirmed `saved`.

This module owns only `studio/src/kairo-presentation-state`, its test, its evidence note, and this handoff. Root owns integration. No provider, timer, audio, persistence, scene, asset or shared contract changes.

## Evidence and status

Implementation and scoped test results will be appended below. Requested tablet cues do not establish that the current character rig has tablet clips. No learning, traction, human/device validation or deployment claim is made.

## Implementation and evidence

- Implemented `studio/src/kairo-presentation-state/index.ts` as a pure immutable adapter. Untrusted events must be plain/null-prototype objects and valid fields; request results require matching context and active request ID. Cancellation/context changes invalidate pending work. Cues resolve only from the supplied availability list; compact/reduced motion suppress tablet cues. Save acknowledgement follows only an explicit context-matched `saved` event.
- `studio/tests/kairo-presentation-state.test.mjs`: **7/7 passed** with Node v24.18.0 using `node --test tests/kairo-presentation-state.test.mjs` from `studio/`. Covered immutability, event chains, wrong/duplicate/late/malformed events, cancellation, context switch, cue fallback, compact/reduced motion and save acknowledgement.
- No app integration, browser/device check, timer, audio, provider, persistence or scene changes. Current rig tablet-clip availability remains unverified; callers must supply actual available cues.
- Judging: Product/Usability acceptance is deterministic state behavior and stale-event safety. Creativity/Presentation benefit only where real cues exist. No learning or user outcome is claimed.
