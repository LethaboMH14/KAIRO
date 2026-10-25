# Tracking-only camera package (SASL-CAPTURE-001)

Finds hands in the learner's camera picture **on their device** and draws them. It does **not** recognise or translate SASL, record anything or send anything. Design and contracts: [CAPTURE-DESIGN.md](../../../docs/blueprint/claude-review/sasl/CAPTURE-DESIGN.md). Rights and evidence: [RIGHTS.md](../../../docs/blueprint/claude-review/sasl/RIGHTS.md).

Mounted on demand in the app’s Voice, language and camera dialog. Opening controls does not start tracking; only Start camera requests the video stream. Closing the preview/dialog unmounts and disposes the session. The developer-only `/src/signing/preview.html` entry remains separate.

## What is pinned, and where it comes from

| Item | Pin | Source |
|---|---|---|
| `@mediapipe/tasks-vision` | exactly `0.10.17` in `package.json` and the lockfile (integrity `sha512-CZWV/q6T…cxrg==`) | npm. Already the exact version `@react-three/drei` requires, so there is one copy, not two. Apache-2.0. |
| Engine files `public/signing/wasm/*` (SIMD and non-SIMD) | SHA-256 in `manifest.json`; byte-identical to the package's own files | Copied from `node_modules/@mediapipe/tasks-vision/wasm`. |
| Hand model `public/signing/models/hand_landmarker.task` | SHA-256 `fbc2a300…cde1`, 7,819,105 bytes | Google's `hand_landmarker/float16/1` file. The versioned URL and the mutable `latest` URL returned the identical file on 23 October 2026. Upstream last-modified 26 Apr 2023. Header records in `provenance/`. Model card: Apache-2.0, "meant for experimental usage". |
| Worker `public/signing/tracker.worker.js` | SHA-256 in `manifest.json`; rebuilt byte-identically from `worker.ts` | `tools/build-assets.mjs` |

**Why 0.10.17 and not the newest 1.x:** the 1.x releases are 9–19 days old, `0.10.17` is already vetted in the lockfile and has the Hand Landmarker API this package needs. Moving to 1.x is a separate, tested change.

## Safety properties (each covered by `tests/signing-capture.test.mjs`)

- Nothing happens at construction; the camera is only requested after the learner presses **Start**. Video only: the microphone is never requested.
- The engine, model and worker code are fetched same-origin and **checked against the manifest's SHA-256 and size before they run**. A mismatch fails closed: no worker is created and the camera is released. (This catches corrupt, partial or stale deploys and caches. It does not defend against a compromised origin.)
- At most one picture is with the tracker. If it is busy, newer pictures are dropped, not queued. Results from an old session, out of order or older than 250 ms are never shown.
- The camera turns off on Stop, page hide, leaving the screen, a camera track ending, permission being removed, tracker failure or stall, and 30 s after a pause.
- No frame, picture or landmark is stored or sent. The latest frame goes once to the drawing callback.

## Rebuilding assets

From `studio/`:

```
node src/signing/tools/build-assets.mjs           # builds the classic worker, rewrites src/signing/manifest.json
node src/signing/tools/build-assets.mjs --check   # proves the committed worker is reproducible from source
```

The worker is a **classic** script because tasks-vision 0.10.17 loads its engine with `importScripts`, which module workers (and Vite's dev worker mode) do not have.

To refresh the model: download the new `.task` into `public/signing/models/`, update the source facts in `tools/build-assets.mjs`, rebuild, re-run the tests and re-record the model card's limits. Do not fetch a `latest` URL at runtime.

## Measured so far (23 October 2026, Chrome 152 on Windows, 12 logical cores, CPU engine, window often occluded)

See [capture-browser-measurements.json](../../../docs/blueprint/claude-review/sasl/evidence/capture-browser-measurements.json). In short: 17.5 MB of pinned files fetched and verified in 0.94 s; worker created in 56 ms; engine and model ready in 1.67 s; tracker time on picture frames with no hand was about 72–128 ms median and 150–250 ms 90th percentile. That is **roughly 8–14 pictures a second on this laptop, under these conditions**. It is not a phone result and says nothing about accuracy.

Picture width made no difference to tracker time (identical frames, interleaved: 118 ms at 640 px, 122 ms at 320 px), so the width is fixed at 640.

## Limits

- No real camera, hand or signer was involved in any check. Hand-detection quality, hand–face contact, motion blur, low light and phones are **untested**.
- The CPU engine only. A GPU engine is a later experiment.
- Hands only. Face and body (for non-manual features) need the pose and face models and their own pins.
- Not tied to any SASL recogniser, because none exists yet.
