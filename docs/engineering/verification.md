# Engineering Studio verification (ENG-001, ENG-002A)

21 October 2026. Session `claude-engineering-20261021-a`: Claude Code, model `claude-opus-5-5`, effort `max` (both shown by the client).

Updated 22 October 2026 for ENG-002A, backlog 6.02 (supply experiments, a fault question and a desktop layout fix), by session `claude-engineering-20261022-a`: Claude Code, model `claude-opus-5-5`, effort `max`. What changed is in [Supply experiments (ENG-002A)](#supply-experiments-eng-002a). The ENG-001 results below were re-run on that code.

## Environment

| Item | Value |
|---|---|
| Machine | Windows 11 Home 10.0.26300, 12th Gen Intel Core i5-1235U, 7.7 GB RAM |
| GPU in browser | ANGLE (Intel UHD Graphics 0x4628, Direct3D11), headless Edge with `--enable-gpu --use-angle=d3d11` |
| Browser | Microsoft Edge 155.0.4283.62, headless (new) mode, driven over the DevTools protocol |
| Runtime | Node 24.18.0, Vite 7.3.7 with the shared `studio/vite.config.ts`, TypeScript 5.9.3 |
| Libraries | React 19.3.1, three 0.180.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9; nothing added or upgraded |
| Blender | 4.5.14 LTS portable (`tools/blender-install.json`) |

The machine was shared with other running applications. Total CPU load was sampled at 20–100 % across the runs (see Performance).

## How to reproduce

```powershell
node --test "docs/engineering/checks/*.test.mjs"
npx --prefix studio tsc --noEmit -p studio/tsconfig.json
node docs/engineering/checks/browser-check.mjs
```

`browser-check.mjs` takes these steps:
1. Builds `studio/src/engineering/preview.html` with the shared Vite config into `%TEMP%/kairo-eng-preview-build`. It never writes `studio/dist`.
2. Serves that build and `studio/public/models` on 127.0.0.1:4182.
3. Drives headless Edge through every scenario.
4. Writes `docs/engineering/checks/browser-report.json` and `docs/engineering/screenshots/*.png`.
5. Closes the browser over DevTools (`Browser.close`), then ends any remaining process tree. Edge's launcher process can exit early, and then a tree kill by its PID alone left headless Edge running. ENG-002A added this step.

Set `ENG_RENDERER=swiftshader` for software WebGL, or `ENG_PREVIEW_URL` to test a running server. While iterating, `ENG_ONLY` runs only some scenario groups, for example `ENG_ONLY=experiments,shell-strip`; the names are the keys of `SCENARIOS` in the script. A partial run overwrites the report with only its own checks, so evidence must come from a full run.

To regenerate the model, run `tools/blender/blender-4.5.14-windows-x64/blender.exe -b --factory-startup --python design/engineering/blender/build_motor.py -- --render`.

## Results

| Check | Result |
|---|---|
| Unit tests: calculations, field maths, supply experiments, explode staging | **22/22 pass** (`fieldMath.test.mjs`; 12 from ENG-001, 10 for ENG-002A) |
| Asset tests: parsed GLB against the manifest | **9/9 pass** (`model.test.mjs`) |
| TypeScript, whole studio project, no emit | **exit 0** (22 October, after ENG-002A) |
| Production bundle of the module (harness build) | Built. ENG-001: studio chunk 717,643 B; lazy `MotorScene` chunk 704,613 B (three/R3F/drei); CSS 41,868 B. After ENG-002A: 728,107 B, 704,903 B and 43,389 B. No dependency or config change. |
| Browser scenarios on GPU | **72/72 pass** on 22 October, 19:26–19:29 UTC: the 50 ENG-001 scenarios plus 22 for ENG-002A. ENG-001's own final run was 50/50 (20:26–20:29 UTC on 21 October). |

### Calculations against independent values

`synchronousSpeed` (n_s = 120 f / p) matches all eight synchronous speeds in Engineering ToolBox's table: 3000/3600, 1500/1800, 1000/1200 and 750/900 r/min for 2/4/6/8 poles at 50/60 Hz.

Rejected input never produces NaN or Infinity, and only the explicit pole counts are accepted:
- frequency: NaN, ±Infinity, 0, −50, 0.5, 400.01 and 1e9
- poles: odd, fractional, 0, negative and above 12
- text: malformed strings ("abc", "1e3", "50Hz", empty)

A decimal comma is accepted ("50,5" gives 1 515 r/min).

The idealised rotating field keeps a 3/2 amplitude at every sampled instant. Its north pole turns at f / pole pairs.

The analytic phase axes (U 55°, V 115°, W 175°) agree to within 5° with the stepped MMF computed from the 36-slot table exported with the GLB. That ties the overlay to the actual winding layout.

### Supply experiments (ENG-002A)

Expected values in `fieldMath.test.mjs` were worked out by hand from the idealised currents, not taken from the code under test. The idealisation and its sources are in `content-review.md`.

- **Two phases swapped:** with V and W swapped, a quarter cycle in, U carries 0, V −√3/2 and W +√3/2. For every pair (U–V, V–W, W–U) a brute-force scan of the MMF around the bore finds a peak of 3/2. The north pole starts on the axis of the winding fed by line U (115°, 55° and 175°) and is 45 mechanical degrees clockwise a quarter cycle later.
- **Direction:** forward and backward turning parts are 3/2 and 0 for the normal supply, and 0 and 3/2 for every swap. `fieldTurning` gives +1, −1 for each swap and 0 for each open phase.
- **One phase open:** with W open, the currents at 0° are U +0.75, V −0.75 and W 0. They sum to zero at every sampled instant for each open phase. U peaks at √3/2 at 330°. Peak currents with V open are √3/2 in U and W and 0 in V.
- **Pulsating field:** at every instant where the field is not near zero, the MMF peak sits on one of two fixed axes: 100°/10° with U open, 70°/160° with V open, 40°/130° with W open. Its height runs from 0 to 3/2. The turning parts are 3/4 forward and 3/4 backward. At the zero crossing (W open, 60°) the field angle is still a finite number.
- **Slot table:** for all six experiments, the north pole computed from the 36-slot table agrees with the analytic field within 5°, wherever the field is at least a third of its full strength.
- **Demonstration:** after 1 s of playback, the rotor is at −0.4π with V and W swapped and +0.4π normally. With W open it stays at 0 while the field strength goes from √3/2 at 0 s to 0 at 1/3 s.

### Browser scenarios (`browser-report.json`)

- **Load and select:**
  - The model loads into a WebGL canvas.
  - Clicking the 3D model selects the part under the pointer (Housing).
  - List selection, the detail panel and the scene label all share one selection.
  - A hidden internal part offers Show inside.
- **Read aloud:** nothing is spoken until asked; Read aloud speaks the selected part (en-ZA) and Stop cancels it. Speech was stubbed, so no audio was heard.
- **Explode and reassemble:**
  - The Explode tab separates the parts.
  - After nine rapid slider reversals mid-tween, Reassemble returns the canvas to a **byte-identical image** (318,835 B both times; overlays hidden, same camera preset).
- **Operate:**
  - Operate turns the cutaway on.
  - Pause freezes the angle (the readout is unchanged 2 s later).
  - Exploding while running pauses with a visible reason; Run stays disabled until reassembly.
- **Keyboard:**
  - Activity tabs use manual activation: arrows move focus without changing the model, and Enter, Home and End work.
  - Enter selects a focused list part, and Escape clears the selection.
- **Drawing view:** it replaces the canvas; section parts are keyboard-selectable and share the selection; returning to 3D restores the canvas.
- **Practice:**
  - A wrong answer gets specific feedback, and Stator is accepted.
  - The calculator rejects 0, −50, "abc", empty and 401; it accepts 50, 60 and "50,5". 60 Hz with 4 poles gives 1 800 r/min; 50 Hz with 2 poles gives 3 000 r/min.
  - The field-speed question accepts 1800, and progress is saved to localStorage.
  - Back to studios calls `onExit`.
- **Reduced motion:** the system preference ticks the control, explode and camera snap (two captures 1.2 s apart are identical), and operation starts paused.
- **Phone (390 × 844, touch emulated):** no horizontal page scroll, before or after expanding the controls. The parts list collapses behind a toggle and works when opened.
- **Fallbacks:**
  - A GLB answered with 404 gives the drawing view plus an explanation.
  - With WebGL disabled, the studio starts in the drawing view with an explanation; the lesson, selection and practice still work.

#### Supply experiments and layout (ENG-002A)

States are made exact by pausing and pressing Step: one Step is 30 electrical degrees, so the field turns 15 mechanical degrees.
- **Menu:** Operate offers the normal supply, U–V, V–W and W–U swapped, and U, V or W open. Choosing a supply restarts the demonstration at 0°.
- **Normal supply:** the readouts say the field turns anticlockwise, is 100 % forward and 0 % backward, and the motor starts. The 3D dial's north poles move +7.0° on screen per Step: anticlockwise, foreshortened by the oblique camera.
- **V and W swapped:** the readouts say clockwise, 0 % forward and 100 % backward, and the motor starts in reverse. The 3D north poles move −7.3° on screen per Step.
- **Phase W open:**
  - The readouts say the field pulses on a fixed axis, is 50 % forward and 50 % backward, and cannot start.
  - The current at rest is 87 % of a normal start in U and V, and none in W. The phase plot reads U +0.75, V −0.75, W 0.
  - In 3D the pole labels keep their screen positions while their opacity falls from 0.87 to 0.50. At 60° all are at 0. At 90° they return at 0.50, with every north label where a south label was.
- **Drawing view, phase W open:** over six Steps the field stays on its axis (130°) while its strength goes 0.5, 0.87, 1, 0.87, 0.5 and 0. The rotor stays at 0°, all 12 W slots are drawn empty, and the legend lists "No current".
- **Drawing view, V and W swapped:** the field moves from 55° to 40° in one Step and the rotor turns −12°.
- **Fault question:** a wrong answer explains why. The single-phasing answer is accepted and saved as `singlePhase`.
- **Layout:**
  - At 1440 × 900 the controls end on screen without scrolling.
  - A simulated 39 px app-shell strip is added above the studio after it has mounted, as a late-rendering shell bar would be. `--eng-above` then becomes 39 px and the controls end at 899 px of 900.
  - The page raises no error while it adapts. The measurement runs on the next animation frame, outside the ResizeObserver callback. Measuring inside the callback raised "ResizeObserver loop completed with undelivered notifications"; that run is the reason this check exists.
  - On a 390 × 844 phone layout, the supply menu fits and a fault experiment adds no horizontal scroll.

### Console

| Scenario | Entries |
|---|---|
| Desktop, density, reduced motion, phone, no-WebGL, and the ENG-002A experiments and shell-strip pages | none |
| Missing model (simulated 404) | The 404 itself, plus one "Could not load …induction-motor.glb" rejection from the R3F/drei loader. It is expected and caught by the in-canvas boundary, which switches to the drawing view. |

### Screenshots (`docs/engineering/screenshots/`)

| File | State |
|---|---|
| 01 | desktop, assembled |
| 02 | a part picked by clicking the model |
| 03 | cage selected, hidden inside |
| 04 | cutaway with the cage selected |
| 05 | focus on the cage |
| 06 and 09 | canvas before explode and after reassembly (identical) |
| 07 | exploded |
| 08 | focus on the rotor while exploded |
| 10 | operating, with field dial and phase plot |
| 11 | operation paused while taken apart |
| 12 | drawing view, side section |
| 13 | drawing view, side section exploded |
| 14 | drawing view, end section operating |
| 15 | practice |
| 16 | reduced motion, explode snapped |
| 17 | phone, assembled |
| 18 | phone, parts list open |
| 19 | phone, exploded |
| 20 | fallback, missing model |
| 21 | fallback, no WebGL |
| 22 | operating with V and W swapped: the field and rotor run in reverse |
| 23 | phase W open at 0°: pulsing field at 87 %, readouts and mirrored currents |
| 24 | drawing view, end section, phase W open: fixed field axis and empty W slots |
| 25 | fault question answered and saved |

All 25 screenshots were regenerated by the 22 October run. Screenshots 01–21 show the same states as in ENG-001.

The Blender preview renders are in `design/engineering/renders/`.

## Performance

These figures were measured, not modelled, and are not a device benchmark. Frames are rendered on demand: when nothing changes, no frame is drawn. The shadow map is redrawn only when parts move, appear or are exploded, not while the rotor turns inside the frame.

Draw cost was measured by counting WebGL draw calls per animation frame in the page:

| State | Draw calls | Triangles per frame |
|---|---|---|
| Operating (cutaway on), every sampled frame | 55 | 115,265 |
| Explode tween, median (maximum) | 45 (92) | 127,615 (268,284, when the shadow map is redrawn) |
| Model asset | | 130,146 closed / 111,825 cutaway; 188,573 in the GLB including cut variants |

Operating frame rate, sampled as three 2-second windows per run on the headless Intel UHD GPU at a 1440 × 900 viewport:

| Pixel ratio | Medians in the 5 runs after the shadow change | All samples (min–max) |
|---|---|---|
| 1 | 56.6, 30.5, 58.6, 32.2, 60.3 | 14.5–60.5 |
| 1.5 (the cap; the performance monitor may drop it to 1) | 40.3, 25.8, 27.3, 23.0, 51.7 | 17.4–59.8 |
| 1, phone layout 390 × 844 (this PC's GPU, not a phone) | 43.7, 39.1, 34.7, 50.9, 60.2 | 21.4–60.2 |

On this laptop the demonstration reaches about 60 fps at pixel ratio 1 when the machine is otherwise quiet, and drops to about 25–35 fps while other applications load the CPU and GPU. The brief's targets (60 fps desktop, 30 fps phone) are goals. They are **not verified**: no phone was measured, and the desktop target was met only in some runs.

The final ENG-002A run, on 22 October at 19:26–19:29 UTC, measured the same draw cost: 55 draw calls and 115,265 triangles in every sampled operating frame. Pole opacity uses two shared dial materials, so it adds no draw calls. One run per setting, sampled as before:

| Setting | Samples (fps) | Median |
|---|---|---|
| Pixel ratio 1, 1440 × 900 | 57.0, 60.3, 59.3 | 59.3 |
| Pixel ratio 1.5, 1440 × 900 | 45.0, 44.0, 41.4 | 44.0 |
| Pixel ratio 1, phone layout 390 × 844 | 60.4, 60.4, 60.5 | 60.4 |

One run is not enough to compare with the ENG-001 figures, and none is claimed.

## Contract compliance (`coordination/briefs/STUDIO-CONTRACT.md`)

- `studio/src/engineering/EngineeringStudio.tsx` default-exports `EngineeringStudio(props: EngineeringStudioProps): React.JSX.Element` with `EngineeringStudioProps = { onExit: () => void }`.
- The page renders its own header below which the full studio sits.
- `engineering.css` is imported only by the component, and every rule is scoped under `.engineering-studio`. The one global name, the `@keyframes eng-spin` loading spinner, is prefixed. It overrides the shell's global `main`, `h1` and `h2` rules only inside the studio.
- The module owns its state and its single Canvas. Runtime assets use `/models/engineering/…`.
- No change to:
  - App.tsx, Scene.tsx, styles.css, main.tsx or StudioRouter.tsx
  - package.json, the lockfile, server code or `studio/src/lecture`
  - any other studio directory

  The isolated harness imports `styles.css` read-only.
- Also delivered: `.claude/launch.json`, under the separate claim ENG-001-PREVIEW. It is a dev-only launcher for the harness on port 4181.
- ENG-002A keeps the same contract. It adds `SupplyExperiment.tsx` inside the module and changes no shared file. To fit below the app shell's bars, the studio reads its own page position. It sets `--eng-above` on its root and observes `document.body` for size changes; it does not touch the shell.

## Calculated or illustrative

- **Calculated and tested:**
  - the n_s calculator
  - the field-pole angle and phase-current readout in Operate (idealised supply, this model's winding)
  - the explode staging (exact return to assembly)
  - for ENG-002A, each supply experiment: winding currents, field angle and strength, forward and backward turning parts, direction, and current at rest with a phase open. These assume a star connection, equal winding impedances and, with a phase open, the rotor at rest.
- **Illustrative and labelled in the UI:**
  - playback speed (field 0.25 rev/s at 1×)
  - the rotor drawn 20 % slower than the field (real full-load slip is typically about 0.5–5 %)
  - the bearing-cage ratio 0.4
  - the phase "glow" intensity
  - the disassembly order
- **Not simulated:** torque, current magnitude in amperes, heating, efficiency, real shaft speed, acceleration, and a running motor losing a phase. The studio states whether the field can start the rotor, from its calculated turning parts and the sourced double-revolving-field result. It does not compute a torque.

## Not verified

- Real phones and tablets, Safari, Firefox and Chrome on macOS or Linux. Only Edge 155 on Windows was exercised.
- Screen readers. The DOM semantics were checked (buttons, aria-pressed, tabs, live caption, labelled SVG parts), but NVDA, Narrator and VoiceOver were not run.
- Audible speech quality (speech was stubbed), forced-colours or high-contrast modes, and offline font fallback when Google Fonts is unreachable.
- Real touch gestures: pinch and drag were only emulated as touch.
- Integration into the shared router; that is Codex's task.
- Subject-matter review by a qualified engineer (see `content-review.md`).
- ENG-002A's layout fix was tested only with a simulated 39 px strip in the isolated harness, not with the real `.kh-wayfinding` strip in the routed app. ENG-ACCEPT-001's `docs/engineering/acceptance/integrated-check.mjs` covers that.
