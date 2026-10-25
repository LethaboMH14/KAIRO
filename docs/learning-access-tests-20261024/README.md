# Learning Access dialog acceptance tests — 24 October 2026

## Learner need and criteria

Learners need temporary access controls that do not activate voice or camera when closed, show the current device voice support honestly, and provide a clear way to close the dialog. This test package supports **Usability** (open/close and visible controls), **Product** (source-lesson link continuity), and **Presentation** (accurate voice and SASL wording). It provides automated component evidence only.

## Test boundary

`studio/tests/learning-access.test.mjs` imports the actual `AccessDialog.tsx` through Vite SSR. A deterministic hook harness runs its real state/effect/event callbacks with synthetic `window`, `document`, dialog methods, location and voice-endpoint `fetch`. It does not define or access `navigator.mediaDevices`, start a real camera, observe a browser, or claim device acceptance.

The cases check that the closed dialog does not request voice status or render the tracking subtree; opening stops narration, shows the dialog and requests status; the camera subtree appears only after the learner selects its explicit controls action; Escape and Close remove it and restore the closed state; voice labels follow installed device-language matches and do not claim translation; valid lesson IDs survive the passage-help URL while invalid IDs fall back to material; and a late response after close cannot set the next dialog's voice status.

Run from `studio/`:

```powershell
node --test tests/learning-access.test.mjs
```

Actual run on 24 October 2026: **6 tests passed, 0 failed**. The separate [signing capture suite](../../studio/tests/signing-capture.test.mjs) exercises actual camera/session disposal logic with deterministic stubs. Neither suite proves physical camera permission behavior or real-device acceptance. The hand-tracking model is not SASL recognition or translation.

## Remaining acceptance

Root integration must validate the source-to-lesson entry context and aggregate build. Human keyboard, screen-reader and device checks remain open. No translation quality, supported-language expansion, voice playback, camera hardware behavior or learning impact is claimed by these tests.
