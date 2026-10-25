# SASL-CAPTURE-001 — tracking-only camera package — 23 October 2026

**Owner:** `claude-classroom-20261023-a`, Claude (`claude-opus-5-5` registered; the client reported Sonnet 5.5 later in the session, so the model value is not fully reliable), effort max. Requested by the user in chat. Status updates to Codex on the bus: message 58 (claim) and the completion message.

**Claimed and edited:**
- `studio/package.json` and `studio/package-lock.json`
- new `studio/src/signing/`
- new `studio/public/signing/`
- `studio/tests/signing-capture.test.mjs`
- `docs/blueprint/claude-review/sasl/`
- this handoff

**Not touched:** router, TeacherProvider, `/classroom`, `session.ts`, the character files, `vite.config.ts`, every other owner's files. The panel is not mounted in the app. Try it at `/src/signing/preview.html` on the dev server.

## What this is

Hand tracking on the learner's device, labelled **"Tracking only: this does not understand SASL yet."** It does not recognise or translate any language, record, store or send anything. Rain's gestures and this view are not sign language.

## Dependency change (the only edit to shared manifests)

- `studio/package.json`: one line added to `dependencies`: `"@mediapipe/tasks-vision": "0.10.17"` (exact, no range).
- `studio/package-lock.json`: the same one line in the root `dependencies`. The package entry already existed because `@react-three/drei` requires exactly 0.10.17, so **no new package, no second copy, no install**. `npm ci --dry-run` passes and `npm ls` shows it deduped.
- Why not 1.1.1 (latest): the 1.x line is 9–19 days old, and 0.10.17 is already vetted in the lockfile.

## Pinned files

Detail and rebuild steps are in [studio/src/signing/README.md](../../studio/src/signing/README.md). Hashes are in `studio/src/signing/manifest.json`:

- **Engine:** SIMD and non-SIMD builds, byte-identical to the package's own files.
- **Model:** `hand_landmarker/float16/1`, SHA-256 `fbc2a300…cde1`, 7,819,105 bytes. The versioned and `latest` URLs returned the identical file. Apache-2.0 per the model card, "meant for experimental usage".
- **Worker:** `tracker.worker.js`, reproducible from `worker.ts` (`build-assets.mjs --check` → `reproducible: true`).
- **Licence text:** `LICENSE-Apache-2.0.txt`.

All of this is fetched same-origin and checked against the manifest's SHA-256 and size **before it runs**. A mismatch fails closed, with no worker created and the camera released. Because the 0.10.17 engine loads with `importScripts`, the tracker is a **classic worker** (Vite's dev workers are module workers and would break it).

## Files

- **Pure and tested in Node:**
  - `lifecycle.ts`: the reducer
  - `pump.ts`: bounded, latest-wins frame pump with stale-session, out-of-order and too-old rejection
  - `assets.ts`: manifest parse, SHA-256 verify, SIMD probe
  - `convert.ts`: handedness swap for raw pictures, hints, luma
  - `camera.ts`, `stats.ts`, `protocol.ts`, `contract.ts`
- **Session controller:** `session.ts`, with the camera, worker, timers and page visibility injected.
- **Browser glue:** `browserDeps.ts`, `worker.ts`, `TrackingPanel.tsx`, `signing.css`, `preview.html/tsx`.
- **Tooling:** `tools/build-assets.mjs`, `manifest.json`, `provenance/` (the download response headers).

## Lifecycle behaviours (each has a test)

- Nothing happens until the learner presses **Start**. Two quick clicks open one camera. Video only, `audio:false`.
- Tracking begins when the camera **and** the tracker are both ready.
- The camera is turned off, the worker terminated and timers cleared on:
  - Stop
  - page hide
  - leaving the screen
  - the camera track ending
  - permission being removed
  - tracker failure, repeated errors or a 2 s stall
  - 30 s after a pause
- If Stop is pressed while the permission prompt is open, the stream is released the moment it arrives.
- A hidden tab pauses, and resumes only what the tab paused. A learner's own pause stays until Resume.
- Results from an old or restarted session, or arriving while paused, are never drawn.
- No picture or landmark history is kept; this is checked by a test of the snapshot's keys and by a static scan of the signing code for recording, storage, outbound or microphone APIs.

## Checks (actual)

- `studio/tests/signing-capture.test.mjs`: **39/39 pass**. Includes the lifecycle table, pump, integrity, conversion and session with fakes, plus the pinned-files checks.
- `npx tsc -b`: exit 0. `npm run build`: passed, 2,254 modules, and the `signing/` files are copied to `dist`.
- Whole `npm test` on the final code: **400/401**. The one failure is `module-chooser-ui.test.mjs:66`, another owner's in-progress test (file written at 17:04), unrelated to these files.
- **Real browser** (built-in pane, Chrome 152, Windows, no camera), recorded in [capture-browser-measurements.json](../../docs/blueprint/claude-review/sasl/evidence/capture-browser-measurements.json):
  - 17.5 MB fetched and verified in 0.94 s; the worker created from verified bytes in 56 ms; engine and model ready in 1.67 s (SIMD).
  - Synthetic frames returned results, the bitmaps were transferred, and a wrong-session frame returned a clean non-fatal error.
  - Pressing the real Start button with this pane's camera permission **denied** gave exactly one `getUserMedia` call with `audio:false`, a plain-language denied message ([screenshot](../../docs/blueprint/claude-review/sasl/evidence/panel-camera-denied.jpg)), no stream, and cancelled loading.

## A measured change to my own design

The earlier draft stepped the picture width down when the tracker was slow. Interleaved identical frames showed tracker time is the same at 640 px and 320 px (118 vs 122 ms), so the step-down gave no speed. I removed it, fixed the width at 640, and corrected [CAPTURE-DESIGN.md](../../docs/blueprint/claude-review/sasl/CAPTURE-DESIGN.md).

## Limits

- **No real camera, hand or signer was involved in any check.** Hand-detection quality, hand–face contact, motion blur, low light, phones and thermal behaviour are untested.
- Tracker throughput on this laptop was roughly 8–14 pictures per second with no hand present. This is not a phone result and not an accuracy result.
- CPU engine and hands only. Pose and face need their own pinned models.
- The 27.3 MB of pinned files in `public/signing` are copied into every build's `dist` (they are fetched only after Start). Decide whether a deployment wants them on a CDN.
- One worker `closed` acknowledgement was missed once and could not be reproduced in three retries. The session does not depend on it.
- No Deaf co-design or review; nothing here claims community participation.

## Next

1. **Codex:** acknowledge or reject `kairo-signing/0.1` ([CAPTURE-DESIGN.md](../../docs/blueprint/claude-review/sasl/CAPTURE-DESIGN.md)) before any adapter touches the shared question path or `/classroom`.
2. **Mount the panel:** only after that acknowledgement, in `/classroom`'s signed-learning panel, behind the existing "not ready" wording for recognition.
3. **Measure on named phones and tablets** with consenting people: latency, thermal over 10 minutes, hand–face contact. No accuracy claim without signer-disjoint data (see RIGHTS.md).
4. **Add pose and face models** (each with its own pin and model card) if non-manual features are needed.
5. **Keyboard and screen-reader pass** on the panel.
