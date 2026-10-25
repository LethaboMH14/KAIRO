# Local camera tracking and the sign ⇄ text contracts (proposal `kairo-signing/0.1`)

**Owner:** Claude (`claude-classroom-20261023-a`). **Date:** 23 October 2026. **Status:** design proposal for acknowledgement by the shared-session owner (Codex). The **tracking-only package is now implemented** in `studio/src/signing` (SASL-CAPTURE-001, see [its README](../../../../studio/src/signing/README.md) and [measurements](evidence/capture-browser-measurements.json)); recognition, translation and signed output are not, and no part of this is wired into `/classroom`.

Evidence and rights: [RIGHTS.md](RIGHTS.md). Architecture origin: [SASL-BIDIRECTIONAL.md](../../experience/SASL-BIDIRECTIONAL.md).

## Three stages, kept apart

```
camera ─▶ TRACKING ─▶ RECOGNITION ─▶ learner confirms ─▶ TRANSLATION / use
         (landmarks)   (SASL units +    (edits text)       (English text, a teacher
                        uncertainty)                         question, optional TTS)

speech ─▶ transcript ─▶ learner confirms ─▶ SIGNED CONTENT lookup ─▶ reviewed human-signed clip, or "none"
```

- **Tracking** finds hands, upper body and face landmarks on the device. It does not know any language. It ships first, labelled **"Tracking only: this does not understand SASL yet."**
- **Recognition** turns a landmark sequence into SASL units: first a bounded set of intents chosen with Deaf co-designers, later glosses. Each unit carries calibrated uncertainty and alternatives. It can only exist once a model has been validated on consented, signer-disjoint data (RIGHTS.md → SASL-INTENT-001).
- **Translation** maps confirmed SASL units to English and back. For an intent pilot it is a **reviewed lookup table** (intent → English phrase, and semantic ID → reviewed clip), not machine translation. The two directions are never chained into "English word → sign" concatenation.

**Hard rules:**
- Nothing recognised is spoken, sent or acted on until the learner has confirmed it.
- Unknown stays unknown.
- Rain's teaching gestures never share a controller with signing and are never labelled as SASL.

## Tracking lifecycle (SASL-CAPTURE-001)

| State | Entered by | Camera | Frames to worker |
|---|---|---|---|
| `idle` | initial; after `stopped` | off | none |
| `starting` | the learner presses **Start camera** (a user gesture only) | permission prompt, while the pinned engine and model are fetched and checked in parallel | none |
| `tracking` | camera live **and** tracker ready (either may finish first) | on, indicator visible | latest frame only |
| `paused` | tab hidden, or the learner presses **Pause** | stream kept for 30 s, then released | none |
| `stopped` | **Stop**, route exit, `pagehide`, track `ended`, permission revoked, error, or 30 s hidden | every track `stop()`ed, video `srcObject = null` | none, and in-flight results dropped |
| `denied` / `unavailable` / `failed` | permission refused, no camera, or model hash/load failure | off | none: offer text and reading, with a plain reason |

- Implemented as a pure reducer (`lifecycle.ts`); `starting` merges the design's separate "asking" and "loading" because the two run in parallel. The prompt is not delayed by the 17 MB download. If checking fails after the camera was granted, the camera is released at once.
- **Start** only ever comes from a click or keypress, never on route load.
- **Stop** is reachable by keyboard in every state.
- Re-entering after `stopped` requires a new **Start**.
- There is no auto-restart after an error.

### Frame path: bounded, latest-wins

1. `video.requestVideoFrameCallback` (with a `requestAnimationFrame` fallback) offers a frame only while `tracking`.
2. If the worker is busy, the frame is **dropped**: the queue depth is 1 and the latest frame wins. A drop counter is kept. Nothing accumulates, so latency cannot grow.
3. `createImageBitmap(video, { resizeWidth })` resizes the frame to a **fixed 640 px** width (never enlarged). The bitmap is **transferred** to the worker as `{session, seq, capturedAt}` and closed after use.
4. The worker runs the pinned landmark model in `VIDEO` mode, with strictly increasing timestamps.
5. The main thread **discards stale results**: a wrong `session`, a `seq` at or below the last applied one, or an age above 250 ms. A discarded result never touches the UI.
6. **Measured change from the earlier draft:** the draft stepped the width down from 640 to 480 to 320 when the tracker was slow. On 23 October 2026 (Chrome 152, CPU engine, identical frames interleaved) tracker time was 118 ms at 640 px and 122 ms at 320 px, because the model works at a fixed internal size. A smaller picture gave no speed and only less detail for the hand crop, so the step-down was removed. Slow devices are protected by the busy-drop rule (throughput equals tracker speed). A frame-rate cap for thermal reasons is a later option once phones are measured.
7. A tracker that holds one picture for more than 2 s is treated as stalled: the session fails and the camera is released.

### Integrity and privacy

- **Pinned, self-hosted runtime.** `@mediapipe/tasks-vision` is pinned exactly at `0.10.17`; the engine files and the hand model are served from `/signing/`. The SHA-256 and size of the engine, the model **and the worker code itself** are checked against `manifest.json` (bundled in the app) before any of them runs, and the page hands the worker the already-checked bytes. A mismatch moves the session to `failed` and creates no worker. Nothing unversioned is fetched from a CDN. This catches corrupt, partial or stale deploys and caches, not a compromised origin.
- **Classic worker.** The 0.10.17 engine loads with `importScripts`, so the tracker runs in a classic worker built to a reproducible file by `tools/build-assets.mjs`, not a Vite module worker.
- **No upload or storage.** No frame or landmark leaves the device, and none is stored. Landmarks live only in memory for the current preview. Optional telemetry would carry aggregate fps, drops and latency only, behind a separate opt-in.
- **Biometric caution.** Face, hand and pose landmarks are treated as potentially biometric (POPIA s26/s27, see RIGHTS.md). Consent is the live "communicate" consent only. Storing or training needs separate, explicit consent screens that do not exist yet.
- **Mirroring.** The preview is mirrored for the learner, while the model coordinates are not. Every overlay converts explicitly, and tests cover left/right.
- **Framing help without judgement.** Prompts ("No hands in view yet", "A hand is at the edge of the picture", "More light would help") come from landmark presence and mean luminance, and show only after holding steady for 0.6 s. The first package tracks **hands only**, so there is no face prompt yet. Nothing infers identity, emotion or ability.

### Acceptance for the tracking package

- Unit tests (`studio/tests/signing-capture.test.mjs`, 39 tests, all passing on 23 October 2026):
  - the state machine (every transition in the table)
  - drop-not-queue under a slow worker
  - stale-session and out-of-order rejection
  - cleanup on stop, `pagehide`, route exit and track `ended`, plus permission revocation, tab hidden and the 30 s pause limit
  - integrity: pinned versions, manifest hashes versus the files on disk, fail-closed on any mismatch
  - privacy: no recording, storage or outbound path in the signing code
- Browser tests on real phones and laptops, named in the evidence, measuring:
  - capture → result latency, worker time, drop rate and fps
  - thermal behaviour over 10 minutes
  - permission denial, revocation and device removal
- With consenting signers: landmark presence and stability under hand–face contact, fast movement and low light. This is reported per condition, without claiming any recognition accuracy.

## Contracts proposal `kairo-signing/0.1`

These are **for acknowledgement before any adapter is written.** The shared question path and session director belong to Codex. These types add to the core API/ERD and do not change it.

```ts
type Consent = { communicate: boolean; store: boolean; train: boolean; publish: boolean; grantedAt: string; text: string };

type CaptureSession = {
  id: string; mode: 'tracking-only' | 'recognition'; startedAt: string; endedAt?: string;
  consent: Consent;                       // store/train/publish are false in every first release
  model: { id: string; version: string; sha256: string }; // pinned landmark bundle
};

type LandmarkFrame = {                    // in memory only; never persisted or sent. As built in studio/src/signing/contract.ts
  session: number; seq: number; capturedAt: number; width: number; height: number;
  hands: { side: 'left' | 'right' | 'unknown'; sideScore: number; points: [number, number, number][] }[];
  // 21 raw (unmirrored) points per hand; side is the learner's own hand (the model's labels are swapped for raw pictures).
  // pose and face arrive with their own pinned models in a later package.
};

type RecognitionCandidate = {             // exists only with a validated recogniser
  id: string; session: string; span: [number, number]; language: 'sfs';
  unit: { kind: 'intent' | 'gloss' | 'unknown'; value: string | null };
  confidence: { score: number; calibration: string };  // calibration version, no universal threshold
  alternatives: { value: string; score: number }[];
  model: { id: string; version: string; evaluationRun: string };
};

type ConfirmedUtterance = {               // the ONLY sign-side object downstream code accepts
  text: string; language: string;        // what the learner confirmed or typed
  source: 'sign' | 'speech' | 'typed';
  fromCandidates: string[]; edited: boolean; confirmedAt: string;
  anchor?: { lessonId: string; revision: number; anchorId: string }; // e.g. classroom-board/1 'work-1-12'
};

type SignedContent = {                    // reviewed human-signed clip; SASL-OUTPUT-001
  semanticId: string; language: 'sfs'; region?: string;
  lesson?: { id: string; revision: number };
  clip: { url: string; sha256: string; bytes: number; durationS: number; captionsUrl: string };
  performer: { consentRef: string; credit: string };
  review: { reviewerRole: string; reviewedAt: string; version: number; state: 'reviewed' | 'needs-review' | 'withdrawn' };
};
```

**Flow guarantees:**
- `RecognitionCandidate` never reaches the teacher, TTS or any tool. Only `ConfirmedUtterance` does.
- A `SignedContent` item plays only if `review.state === 'reviewed'` and its lesson revision matches. Otherwise the learner sees "No reviewed signed explanation for this yet", with text and captions.
- `anchor` reuses the `classroom-board/1` IDs. A question signed while Rain is pointing at "12" keeps that context, exactly like a typed question.

## Packages and order

1. **SASL-CAPTURE-001 (tracking only).** New `studio/src/signing/` subtree and tests. Before the runtime is added, claim `studio/package.json` and its lockfile, and pin the tasks-vision version and the model hashes. The camera UI enters `/classroom`'s signed-learning panel only after the `kairo-signing/0.1` acknowledgement.
2. **SASL-INTENT-001.** Gated on the consented, co-designed dataset (RIGHTS.md).
3. **SASL-OUTPUT-001.** Gated on recording and reviewing the human-signed clips: manifest validation, player, captions and speed control.
4. **SASL-INTEGRATE-001.** Shared question path. Codex owns the director; Claude owns the signing adapter.

No package claims community participation, accuracy or "translation" before evidence exists.
