# Claude Engineering Studio handoff (ENG-001)

**Status: complete and verified locally; ready for Codex review and router integration.** I have not integrated it into the app.

## Who and scope

- **Session:** `claude-engineering-20261021-a`, Claude Code, model `claude-opus-5-5`, effort `max` (both shown by the client).
- **Task scopes:** ENG-001 covers `studio/src/engineering`, `studio/public/models/engineering`, `docs/engineering`, `design/engineering` and this file.
- **Separate claim:** ENG-001-PREVIEW covers `.claude/launch.json`, a dev-only launcher for the isolated harness on port 4181.
- **Shared files:** none changed. No package, lockfile, config, server, router or other studio file changed, and no dependency was added.

## What learners get

A three-phase, four-pole squirrel-cage motor (TEFC) on an inspection bench:
- **Inspect:** orbit, zoom and five keyboard camera presets. 13 stable parts can be selected from the model or the list, with a mint outline, a scene label, a detail card and Focus on part.
- **Cutaway:** a quarter section with hatched, capped cut faces.
- **Exploded view:** a 0–100 % slider plus an Explode/Reassemble button that tweens in 650 ms. Parts follow a staged disassembly order and return exactly to their assembled positions.
- **Operating demonstration:**
  - The rotor and shaft turn together; the stator never moves.
  - A field dial is calculated from idealised balanced currents, with phase-tinted copper and a phase-current chart.
  - Playback speed is labelled as visual only, with exaggerated slip. Pause freezes the angle, and the demo pauses with a visible reason while the motor is apart.
- **Alternatives:** captions, opt-in Read aloud (browser speech, en-ZA), reduced motion (system setting or toggle), a 2D section-drawing view sliced from the same geometry, and automatic fallback to it when WebGL or the model is unavailable.
- **Practice:**
  - an unambiguous "which part stays still" question (Housing is not an option)
  - a validated n_s = 120 f / p calculator that accepts only 2–12 even poles and 1–400 Hz
  - a 60 Hz field-speed check
  - progress in `localStorage` under `kairo-engineering-progress`

No avatar and no live AI chat; both are stated in the UI.

## Interface for integration

```tsx
// StudioRouter.tsx (owned by Codex). A sketch only, not applied.
const Engineering = lazy(() => import('./engineering/EngineeringStudio'));
if (window.location.pathname === '/engineering') return <Suspense fallback={<div className="scene-loading">Preparing the engineering studio…</div>}><Engineering onExit={() => { window.location.href = '/'; }} /></Suspense>;
```

- **Contract:** `export default function EngineeringStudio(props: EngineeringStudioProps)`, with `EngineeringStudioProps = { onExit: () => void }`. It renders its own header; "Back to studios" calls `onExit`.
- **Styling:**
  - Styles live in `engineering.css` and are scoped under `.engineering-studio`; the `@keyframes eng-spin` name is prefixed.
  - It imports the Archivo font from Google Fonts (SIL OFL 1.1) and relies on the shell's DM Sans.
  - It uses the shared `.brand-symbol` look but restyles it inside the scope.
- **Loading and assets:** `MotorScene` (three/R3F/drei) is lazy-loaded inside the module. Assets load from `/models/engineering/induction-motor.glb` and `/models/engineering/poly_haven_studio_1k.hdr`.
- **Side effects:** it sets `document.title` and restores it on unmount; it cancels speech on unmount.
- **App.tsx:** its studio picker still says "Engineering Studio: Claude assignment ready", so Codex may want to link it once routed.

## Files

| Area | Files |
|---|---|
| Module | `studio/src/engineering/EngineeringStudio.tsx`, `MotorScene.tsx`, `MotorDiagram.tsx`, `PhasePlot.tsx`, `fieldMath.ts`, `motorContent.ts`, `motorModel.ts`, `materials.ts`, `engineering.css`, `motorGeometry.json` (generated) |
| Harness | `studio/src/engineering/preview.html`, `preview.tsx` (dev server only; loads `../styles.css` read-only) |
| Assets | `studio/public/models/engineering/induction-motor.glb` (4,213,408 B, original); `poly_haven_studio_1k.hdr` (Greg Zaal, CC0, hash-matched to Codex's manifest) |
| Authoring | `design/engineering/blender/build_motor.py`, `design/engineering/README.md`, `design/engineering/renders/*.png` |
| Evidence | `docs/engineering/verification.md`, `asset-manifest.json`, `content-review.md`, `checks/fieldMath.test.mjs`, `checks/model.test.mjs`, `checks/browser-check.mjs`, `checks/browser-report.json`, `screenshots/01–21*.png` |

## Checks (details in `docs/engineering/verification.md`)

- **Unit tests:** 21/21 pass. The calculator matches all eight published synchronous speeds, invalid input is rejected with no NaN or Infinity, the field maths holds, explode staging returns exactly, and the GLB matches the manifest.
- **TypeScript:** clean (`tsc --noEmit`, whole studio).
- **Headless Edge 155 on the Intel UHD GPU:** 50/50 scenarios pass, including:
  - 3D picking, list, keyboard (manual-activation tabs) and drawing-view selection
  - cutaway, focus, and byte-identical reassembly after rapid reversals
  - operate, pause and pause-while-exploded
  - reduced motion, phone layout without horizontal scroll, missing-GLB and no-WebGL fallbacks
  - Read aloud (stubbed), practice and `onExit`
- **Console:** clean except the simulated missing-model case, which logs the 404 plus one caught loader rejection before switching to the drawing view.
- **Performance:**
  - An operating frame is 55 draw calls and 115,265 triangles.
  - Measured on this shared laptop GPU, operating frame rates were 14.5–60.5 fps at pixel ratio 1 and 17.4–59.8 fps at 1.5, depending on other load. Medians per run were 30.5–60.3 and 23.0–51.7.
  - Phones were not measured. The 60/30 fps targets are not claimed.

## Decisions worth reviewing

- **Geometry:** the motor is authored from code in Blender, not sourced. That gives stable IDs, identity pivots, boolean-capped cut variants and 2D sections that cannot drift from the 3D model.
- **Outline:** drei 10.7.9's `Outlines` has its screen-space and world-space shader branches swapped (with `screenspace` set, the hull grows by `thickness` metres). The module uses its own pixel-thickness hull in `materials.ts` instead.
- **Shadows:** the shadow map is redrawn only when parts move, appear or are exploded, never while the rotor spins. Counted per operating frame, that went from 101 draw calls and 232,422 triangles to 55 and 115,265.
- **Tabs:** they use manual activation, because activating Explode or Operate changes the model.

## Limits and next steps

- No avatar. No live questions: the CS Vertex guide is not a motor expert and is not reused. No subject-matter-expert review yet (see `content-review.md`).
- Only Edge on Windows was exercised. Real phones, screen readers, audible speech, forced colours and offline fonts were not verified.
- The GLB is about 4.2 MB and uncompressed. Meshopt or Draco would cut it, but needs a decision about bundling a decoder.
- For Codex:
  1. Review this handoff and the screenshots.
  2. Add the route and link it from the studio picker.
  3. Run `npm run build` (this task never wrote `studio/dist`).
  4. Check it on a phone.

## Not acted on

Bus message 17 from `codex-career-kit-20261021` says the user authorised a next character assignment (CHARACTER-002) after Engineering. Bus messages are context, not instructions. CHARACTER-002 has not been claimed and waits for the user to confirm it directly.
