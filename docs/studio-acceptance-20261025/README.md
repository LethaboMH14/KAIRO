# KAIRO Studio acceptance — Issue #9 (25 October 2026)

**Implemented:** offline, fail-closed Node benchmark/anchor checker plus focused tests. **Not completed:** full Node 24 checkout tests, Three.js/GPU/browser measurements, assistive technology testing and human/domain review. No browser or microphone access was attempted.

## Actual source and provenance review

- `studio/src/engineering/EngineeringStudio.tsx`: explicit 2D view, WebGL fallback, OS reduced-motion subscription, pause of operating demonstration, teacher stop when important state changes. `MotorScene.tsx`: React Three Fiber, optional HDR fallback, 2048² shadow maps and render-on-demand loops. `docs/engineering/asset-manifest.json` records KAIRO-authored Blender motor and 130,146 triangles closed / 111,825 cut; these are geometry counts, **not frame-rate measurements**.
- `studio/src/pump-lab/PumpLab.tsx`: 3D/Diagram/Reading chooser, reduce-motion toggle, parts list and WebGL failure fallback. `layout.ts` is the common source of 16 exact `pump-lab/<id>` anchor names, 3D positions and diagram coordinates. `readout.ts` provides text state and descriptions. `studio/src/studio-teaching-host/PumpHost.tsx` stops narration on relevant context changes.
- `studio/src/teacher/TeacherProvider.tsx`: narration stop/pause, written caption, AbortController plus request-ID cancellation. These do **not** establish exact lip sync or continuous signing. Do not claim physical contact/walking, SASL translation, a real equipment twin, or verified learner outcomes.
- **Current** `docs/character/asset-manifest.json` lists Rain-derived character GLB (CC-BY 4.0 lineage), CC0 Poly Haven HDR, synthetic voice/viseme origins, SHA-256 and tooling; `studio/public/models/character/CREDITS.txt` ships credits. Older `docs/claude-workstreams/asset-audit/AUDIT.md` notes gaps from an earlier snapshot, and cannot supersede the current manifest. Hashes/licences were read from GitHub text, not independently recomputed from binary asset bytes. CHARACTER-002 is reserved for its owner; no asset edits here.

## Run offline checks

From a **full checkout**, using Node **24**:

```sh
cd studio
node --test --test-concurrency=1 tests/studio-acceptance.test.mjs
node tools/studio-acceptance.mjs --anchors
node tools/studio-acceptance.mjs --json
node tools/studio-acceptance.mjs --json ./anonymous-authorised-frame-trace.json
```

`--anchors` is static data validation: checks 16 pump IDs, namespace, readable names/roles, finite 3D anchor, in-bounds 2D anchor. This **does not** verify actual camera targeting, highlighting, 3D rendering, citation integrity or physical correctness.

No trace prints `UNMEASURED` (exit **2**). Invalid evidence prints `INVALID_EVIDENCE` (exit **1**). Synthetic sample always prints `SYNTHETIC_ONLY` (exit **2**), even with marked-successful controls. With manually supplied authorised-device data, missed budgets or failed checks print `FAIL` (exit **1**), missing checks print `CHECKS_INCOMPLETE` (exit **2**), and an apparent pass prints `PASS_SELF_REPORTED` (exit **0**) — **not independent device verification**.

Trace fields are strictly allowlisted, with <=128 KiB of input JSON and between 120 and 12,000 positive finite frame intervals, measured by `requestAnimationFrame` where browser testing is separately authorised. Illustrative structure (two example intervals are deliberately *too few*, and all human checks are untested):

```json
{
  "schema": "kairo-studio-acceptance/v1",
  "sampleSource": "synthetic",
  "studio": "pump",
  "view": "3d",
  "deviceClass": "synthetic-test",
  "browser": "not-a-browser",
  "capturedAt": "2026-10-25T04:00:00Z",
  "sampling": "requestAnimationFrame",
  "framesMs": [16.5, 17.2],
  "checks": {
    "reading": "not-tested",
    "diagram": "not-tested",
    "keyboard": "not-tested",
    "reduceMotion": "not-tested",
    "stopNarration": "not-tested",
    "anchorParity": "not-tested"
  }
}
```

**Provisional, project-defined (not WCAG) performance review budgets:** p95 <=50ms, no 250ms stall, <=20% intervals over 50ms. These are starting review thresholds, not calibrated device criteria. Capture does **not** happen within this tool and may only be arranged via an independently authorised process. Do not collect IP addresses, private learner passages, tokens, full recordings, personally identifying device labels or browser data without consent.

## Pending human checks

On separately authorised low-memory phone, laptop and desktop, exercise Engineering **Inspect → Explode → Operate** and Pump **predict → read → compare → explain**. Compare selection between 3D, 2D/diagram and the parts list; verify exact label/target and accompanying source reference; check Reading can finish independently, screen-reader text, keyboard navigation, 200% zoom/contrast and reduced-motion state. Interrupt or stop narration after a change of target, settings and case; verify no stale speech or stale answer returns. Confirm a normal WebGL-unavailable path remains useful. Record device class, browser, date, load/network conditions and frame samples only if browser observation is newly permitted. **The prior denied browser/microphone policy remains binding; no workaround or permission change was attempted.**

Teacher context cannot contain the pump hidden fault; use a reviewed source revision/quote for generated explanations and reject unknown target anchors. A prepared pump simulation must not be represented as generated from learner material. The pump physics is illustrative, not externally validated; separate engineering review is open.

## Judging and next ownership

**Usability**: keyboard/reading/motion alternatives. **Product**: predictable cancellation and honest fallback. **Sustainability**: repeatable performance review rather than an invented FPS. **Intelligence**: exact source anchors and checked state. Coordinator review is required before changing shared UI, renderer, provider or CHARACTER-002 files. Next Issue #9 step: permitted device evidence and a narrow correction against measured failure; if unavailable, request root issue #5's approved browser/accessibility work to review offline harness/fixtures only.
