# Pump lab acceptance matrix

Against the acceptance paragraph and first-package list in [STUDIO-BRIEFS.md](../blueprint/studio-data/STUDIO-BRIEFS.md). "Evidence" names a test or a file; [verification.md](verification.md) has the results. "Met" means met in the sense the evidence shows, not that independent review has happened.

## First package

| Requested | Status | Evidence |
|---|---|---|
| One procedural pump circuit | Met | `PumpScene.tsx`, `PumpDiagram.tsx`; manifest lists no downloaded file |
| Two parameters | Met | pump speed 600–1,450 rpm, valve handle 0–100% |
| Three authored fault cases | Met, plus a healthy baseline | `cases.ts`; test "learner journey: every case can be solved end to end" |
| Gauge, plot and reading equivalents | Met | three gauges, flow meter and power meter in 3D and diagram; `PumpPlots.tsx` with tables; the Reading view; UI tests |
| Prediction and explanation task | Met | prediction gate; six candidate causes with cited evidence; rule-based feedback; model tests |
| Case, reset and session serialization | Met | `resetRun`, `serialize`/`restore` by replay; tests "reset restores…", "restore rebuilds…" |
| Numerical and model tests | Met | 50 model tests, 15 render tests |
| External specialist review of domain claims | **Not done** | Required before broad release; see limits |

## Acceptance

| Criterion | Status | Evidence |
|---|---|---|
| Conservation and bounds in the chosen simplified model | Met | "conservation: litres taken from the source equal litres added…" (water total within 1e-6 L across 9 runs: three settings × 1, 30 and 600 s); "bounds: source cannot be pumped below the suction cut-off…"; pump head equals system head at the root over 1,000+ grid points; hydraulic power never exceeds shaft power; closed-form match; affinity-law check |
| Repeated seed gives an identical result | Met | "determinism: same actions and seed give byte-identical state, and a replay matches"; "a different seed changes the noise but not the underlying result" |
| Reset restores all state | Met | "reset restores the exact starting state" (deep equality with a fresh state, after hints, a wrong explanation and a full journey) |
| Invalid and non-finite input rejected | Met | "physics rejects non-finite…", "invalid actions are rejected with a stable code and leave the state untouched" (NaN, ±Infinity, strings, null, objects, arrays, out of range, fractions, bad times, unknown actions) |
| A learner can distinguish two faults from the supplied observations | Met in the model | "a learner can tell the faults apart…": 150 seeds × 14 speeds × 8 valve settings, healthy never accused, each fault's signature holds when measured flow is at least 4 L/s; "a blocked strainer and a worn impeller both look weak at the pump, but only the suction loss separates them". **Not tested with real learners.** |
| Help used stays in evidence | Met | "help used stays in the evidence": level `none`/`hint`/`worked-example` in the item, the report and the text export; opening a part before a supported explanation is flagged |
| Mobile reading and diagram alternative | Partly met | Reading view and keyboard-operable diagram exist and render in tests; layout is one column at phone width (375 px checked in the Browser pane); diagram text is small on a phone, so the diagram scrolls sideways and the page offers Reading. **No real phone has been used.** |
| Actual frame-time and touch checks | **Not done** | The 3D room ran live in the Browser pane on this laptop, but no frame-time sample could be taken (the pane was hidden when asked, so animation frames did not run). No touch device was used. These checks remain required. |

## Brief's design requirements

| Requirement | Status | Evidence |
|---|---|---|
| Every glow and particle is a defined state | Met | `stateCues()` in `layout.ts`: six cues, each with an active condition, a stated meaning and words; test "every cue is tied to a defined state"; nothing is active before the prediction; the legend repeats each in words |
| Particles not labelled CFD, no live mains wiring, not marketed as a digital twin | Met | text scan test "learner-facing text makes no overclaims"; legend says dots are an indication, not a flow simulation |
| Exploded impeller, shaft and seal on an inspection bench | Met in the 3D room | bench group with an explode slider; vane, strainer and valve-gate condition appears only after the learner opens the part. Not visually checked in detail |
| Select and label parts | Met | 16 targets; selection from the 3D room, the diagram and the parts list |
| Vary speed and valve; predict; take readings; isolate; compare before and after; explain; export report | Met | state machine and report; browser run through the stuck-valve case from prediction to "Case finished" |
| Simple repair changes a named case state | Met | repair log says so each time; wrong repairs change nothing |
| Reuse the motor only through its published interface | Not reused | No pump-facing motor interface exists; the lab's motor is a stand-in. See INTERFACE.md question 2 |
| Selected C identity, warm Chalk and Moss palette, plain language | Met by construction | tokens in `pump-lab.css`; Sage and Copper used for shapes and borders, never small text. Contrast ratios of the actual pairs have **not** been measured |

## Limits that remain

- No external domain review; coefficients are illustrative.
- No real-learner, assistive-technology, touch or low-end-device testing.
- Frame time, memory and bytes on a phone are unmeasured. The production build of the preview harness emits a lazy scene chunk of 919,794 bytes (unminified size not recorded, gzip not measured) because it includes three.js, as the other studios' scenes do.
- WCAG 2.2 AA is a target, not a result: names, labels, focus and keyboard paths are checked in rendered HTML; contrast, 200% zoom and screen-reader behaviour are not.
- The 3D picture was inspected only at the default overview and one live state.
