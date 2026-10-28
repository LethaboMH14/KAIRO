# KAIRO presentation state adapter

This package provides deterministic, immutable presentation state transitions for a caller that owns real content requests and save results. It validates untrusted event shapes and rejects stale context/request results. Cue selection uses only the caller-provided availability allowlist; absent tablet cues fall back to an available idle/explain cue, otherwise no cue is selected. Compact and reduced-motion settings suppress tablet transitions while preserving request/lesson state.

**Judging connection:** Product (coherent presentation state) and Usability (interruption, cancellation, recovery); Creativity/Presentation only when an available cue exists. Learner need: understand whether the lesson is preparing, presenting, failed, or cancelled without misleading animation claims.

**Acceptance evidence:** `node --test tests/kairo-presentation-state.test.mjs` from `studio/`. Tests cover event chains, duplicate/wrong/late responses, cancellation, context changes, cue fallback, compact/reduced-motion behavior, malformed events, immutability and explicit save acknowledgement.

**Limits:** This is a standalone policy adapter, not mounted in the app. It does not perform requests, timers, audio, persistence, scene control or animation. No assertion is made that KAIRO's current rig includes tablet clips. No human/device or learning outcome validation is represented.
