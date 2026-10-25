# Integrated Engineering Studio acceptance (ENG-ACCEPT-001)

22 October 2026. Session `claude-engineering-20261021-a`: Claude Code, model `claude-opus-5-5`, effort `max` (both shown by the client).

This covers backlog items 6.01 and 15.01: the browser check of the Engineering Studio inside the integrated KAIRO app. Codex wired it up in ENG-INTEGRATE-001 but could not observe it in a browser.

## What was tested

- **Code.** A frozen snapshot of the app sources, taken at the start of the run. The 12 files in `studio/src/engineering` are byte-identical to the ENG-001 delivery (newest edit 21 October, 21:57). Shared files were taken as they stood at snapshot time, including other sessions' in-progress work. Their SHA-256 hashes are in `report.json` under `snapshot.integration`. No source file was edited by this task, and `studio/dist` was not written.
- **Build.** The whole app, built with the shared `studio/vite.config.ts` into `%TEMP%/kairo-accept/dist`.
- **Hosting.** A small static server on 127.0.0.1:4186 with single-page-app fallback, so `/engineering` and the other client routes get the app shell. It serves the live `studio/public` assets. It has no API, so `/api/*` answers 503 by design; the Engineering route makes no API calls.
- **Browser.** Microsoft Edge 155 in headless mode, using the laptop's Intel UHD GPU through ANGLE/D3D11 and driven over the DevTools protocol. Phone layout is an emulated 390 × 844 touch screen, not a real phone.

To reproduce: `node docs/engineering/acceptance/integrated-check.mjs`. It writes `report.json` and `screenshots/` in this folder.

## Journeys

1. **Home to Engineering by keyboard.** Home page, then Enter on "Explore studios", then Enter on the "Engineering Studio" row in the picker, then `/engineering`.
2. **Inside the app.**
   - The 3D model loads and the title changes.
   - Clicking in the model selects a part; the parts list and detail card agree.
   - Show inside, explode, then rapid slider reversals and Reassemble; the canvas is compared byte for byte.
   - Run, Pause (the angle freezes), and pause-while-exploded with a visible reason.
   - Tabs with manual activation; the drawing view with keyboard selection, and the return to 3D.
   - The calculator with invalid and valid frequencies, and the quiz.
3. **Leaving and returning.**
   - Back to studios returns home, restores the home title, and leaves no Engineering styles behind.
   - Browser Back returns to `/engineering` and Forward returns home.
   - A direct link to `/engineering` works once, then five more times in fresh tabs.
4. **Phone.** Picker, then Engineering, then explode, then Back to studios, with no horizontal scrolling.
5. **Reduced motion.** The system preference ticks the control, and explode and the camera snap.
6. **Fallbacks.** With the GLB answered by 404, and separately with WebGL disabled, the drawing view and an explanation appear and selection still works.

## Result: accepted with one layout finding

The final run (00:13–00:20 UTC, snapshot at 00:13:24 UTC) passed **45 of 46 checks**. Run before it, without the layout check, passed 45 of 45. All details are in `report.json`; screenshots `A1`–`D2` are in `screenshots/`.

The checks fall into these groups:
- **Build:** the Engineering and integration files type-check cleanly, and the full app builds with the shared Vite config. The lazily loaded chunks are `EngineeringStudio` (114,274 B) and `MotorScene` (70,612 B).
- **Navigation:** home, the picker by keyboard, then `/engineering`; the title changes; no horizontal scroll.
- **Model and operation:**
  - selection in the model and in the list; the cutaway; explode
  - the canvas is **byte-identical** (318,835 B) after rapid reversals and Reassemble
  - Pause freezes the angle; explode pauses operation with a reason; Run stays disabled until reassembly
- **Keyboard and drawing view:** tabs move focus without activating, and Enter activates; keyboard selection works in the drawing view, and 3D returns.
- **Practice:** the calculator rejects 0, "abc" and 401 Hz and accepts 50 and 60 Hz (60 Hz with 4 poles gives 1 800 r/min); the quiz accepts Stator.
- **Leaving and returning:**
  - Back to studios returns home, restores the home title, and leaves no `.engineering-studio` CSS on the home page.
  - Browser Back and Forward work.
  - A direct deep link loads, and loaded in **5 of 5** fresh tabs.
- **Phone, reduced motion and fallbacks:** the phone journey, reduced-motion snapping and both fallbacks pass.

### Finding: the activity controls are partly below the fold on desktop (failed check)

At 1440 × 900, the integrated app now renders a site-wide wayfinding strip above every route. It is the `kh-wayfinding` element, which comes from the in-progress CONTINUITY-001 shell work in `StudioRouter.tsx`. It pushes the Engineering Studio 39 px down. The studio's stage is sized as `100vh − 60px`, which assumes nothing sits above its own header, so the bottom activity controls end at 938 px of a 900 px viewport. They can still be reached by scrolling, and nothing is lost on phones, where the layout flows.

Suggested fix, inside Engineering: measure the studio root's top offset on mount and resize, and subtract it in the stage height. For example, set a `--eng-above` custom property on `.engineering-studio`, then use `height: calc(100dvh - 60px - var(--eng-above, 0px))`. Alternatively, the shell could publish its strip height as a CSS variable. `studio/src/engineering` is now claimed by ENG-002A, so this was reported to that session and to Codex rather than edited here.

### Observations for other owners (not Engineering criteria)

- **Home page:** the Computer Science scene's drei `Html` labels, "Application API" and "SQLite database", render above the studio picker modal (screenshot `A2-picker.png`). They use drei's default z-index range. Giving those labels a `zIndexRange` below the modal's z-index of 20 would fix it. Owner: the home-page or Scene owner.
- **Whole-app type-check** at snapshot time had 4 errors outside Engineering, in files under active Codex tasks:
  - `src/continuity/offline.ts(3,19)`: `import.meta.env` is not typed; it probably needs the `vite/client` types (CONTINUITY-001).
  - `src/portfolio-export/model.ts(71,…)`: three properties are missing on `PracticeArtifact | WorkSimExport` (LUNA-PORTFOLIO-EXPORT-001).

  `npm run build` (`tsc -b`) would fail while these remain. They were in-progress files at the time.

### Console

- The four `/api/health` requests answered 503 by this static server, which has no API, are expected here; the production server provides the API.
- The simulated missing-model scenario logged the 404 and one caught loader rejection.
- There were no other errors or warnings.

### Performance (indicative only)

While running, the integrated studio sampled 54.4, 38.5 and 53.6 fps (median 53.6) at pixel ratio 1 on the headless Intel UHD GPU, at a 1440 × 900 viewport, with other applications loading the laptop. Earlier acceptance runs today had medians of 58.0, 41.0 and 55.9. This is not a device benchmark, and phones were not measured.

## Not covered

- A real phone, and real touch gestures
- Browsers other than Edge 155 on Windows
- Screen readers; audible speech (Read aloud was verified in the ENG-001 suite with speech stubbed)
- The production `server.mjs` with its API
- Subject-matter review of the content (backlog 6.03)
