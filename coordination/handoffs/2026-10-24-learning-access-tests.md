# Learning Access dialog tests handoff

Date: 24 October 2026  
Owner: `codex-learning-access-tests-20261024-a`  
Client/model/effort: Codex / `gpt-6` / `unknown`  
Task: `LEARNING-ACCESS-TESTS-001`

## Need and criteria

Learners need controls that stay inactive while closed, honest voice-language availability and translation wording, and reliable return to the closed state. These tests support Usability, Product journey continuity and Presentation claim accuracy.

## Scope and files

- `studio/tests/learning-access.test.mjs` uses the actual `AccessDialog.tsx` loaded through Vite SSR, with a synthetic hook/event/dialog/fetch harness. No production code was edited.
- `docs/learning-access-tests-20261024/README.md` records acceptance evidence and boundaries.

Root-owned `studio/src/learning-flow/AccessDialog.tsx` was read-only. The harness replaces its teacher hook with a deterministic mock and supplies synthetic window, document, location, modal methods and voice availability fetch. It does not use browser automation, mediaDevices, or a real camera.

## Acceptance checks

Tests cover closed state with no voice fetch/tracking subtree; open event stops narration and opens a temporary dialog; Escape and Close return to closed state and remove the camera subtree; learner action is required before tracking subtree appears; UI labels distinguish installed device voices from unsupported choices and do not claim English lesson translation or SASL; valid lesson ID is preserved for passage translation while invalid IDs fall back to `/sources`; and aborting on close prevents a late voice response from changing the next open dialog's status.

The separate `studio/tests/signing-capture.test.mjs` exercises camera/session disposal logic. Neither deterministic suite establishes physical device/browser acceptance.

## Checks and limits

From `studio/`, `node --test tests/learning-access.test.mjs` completed with **6 passed, 0 failed**. Component SSR/event tests do not replace human keyboard/screen-reader/device checks, full journey integration, or an aggregate build. No translation quality, real voice output, camera hardware behavior, SASL recognition or learning outcome is claimed.
