# Claude Engineering handoff: supply experiments (ENG-002A, backlog 6.02)

**Status: built and verified locally; ready for Codex review.** No shared or integration file changed. The `/engineering` route picks this up as it stands.

## Who and scope

- **Session:** `claude-engineering-20261022-a`, Claude Code, model `claude-opus-5-5`, effort `max` (both shown by the client). Started by the ENG-001 session `claude-engineering-20261021-a`, which holds ENG-ACCEPT-001.
- **Bus task:** ENG-002A covers `studio/src/engineering`, `design/engineering`, `docs/engineering/checks`, `docs/engineering/screenshots`, `docs/engineering/verification.md`, `docs/engineering/content-review.md` and this file.
- **ENG-002:** I created this task first, but could not claim it, because its `docs/engineering` scope overlaps ENG-ACCEPT-001's `docs/engineering/acceptance`. It stays open and unowned; please leave it, or close it once 6.02 is reviewed.
- **Not touched:** `StudioRouter.tsx`, `App.tsx`, `styles.css`, `package.json`, the lockfile, `.claude/launch.json` (claimed by CHARACTER-002-PREVIEW; I only used its existing `engineering-preview` entry), `docs/engineering/acceptance`, the GLB, the HDRI and other studios. No dependency was added.

## What learners get

In **Operate**, a **Supply** menu next to Run offers:
- **Normal supply.**
- **Reverse: swap two phases.** U and V, V and W, or W and U.
- **Fault: one phase open (single-phasing).** U, V or W open.

Each choice restarts the demonstration from rest. Everything the learner sees comes from one calculation in `fieldMath.ts`:
- **3D field dial:** the poles turn anticlockwise (normal) or clockwise (any swap). With a phase open they stay on a fixed axis, fade with the field's strength, vanish at the zero crossing and return with north and south swapped. The rotor and needle stay still because the motor cannot start.
- **2D end view:** the same field. Slots in an open winding are drawn empty, with a "No current" legend entry.
- **Copper glow and phase plot:** winding currents for the chosen supply. Swapped peaks come in reverse order; an open winding is flat at 0, and the other two mirror each other at 87 %.
- **Readouts:** field direction, strength now, the field's forward and backward turning parts (100/0, 0/100 or 50/50 %), whether it starts from rest, and, with a phase open, the current at rest (87 % of a normal start in two windings, none in the third).
- **Explanations:** what happens and why, including the case of a motor that is already running, and common causes (a blown fuse, worn starter contacts). Every claim is in `docs/engineering/content-review.md` with its source.

**Fault question** in Check your understanding: "A fuse on one supply phase blew while this motor was stopped. What happens when it is switched on?" Wrong answers explain why. The correct answer is saved as `singlePhase` in `kairo-engineering-progress`.

**Desktop layout fix** (found by ENG-ACCEPT-001): the studio measures how far down the page it starts, `--eng-above`, and sizes the stage `calc(100dvh - 60px - var(--eng-above))`. It measures at mount, on window resize, and on the frame after the page body changes size, so a shell bar that renders late is also picked up. The controls stay on screen below the shell's wayfinding strip. With no strip the value is 0, so the isolated harness is unchanged.

## Interfaces

- **Contract unchanged:** `export default function EngineeringStudio({ onExit })`.
- **`fieldMath.ts`, all pure and tested:**
  - `Supply` (`normal`, `swapped` with two lines, `open` with one) and `NORMAL_SUPPLY`.
  - `windingCurrents(θ, supply)` and `peakCurrents(supply)`.
  - `statorField(currents)`, which returns strength and north angle.
  - `turningParts(supply)` and `fieldTurning(supply)`.
  - `NORMAL_FIELD_STRENGTH`.
  - `statorMmf`, `slotCurrent`, `slotFieldNorthAngle` and `demoAngles` take an optional `supply`. `demoAngles` also returns `fieldStrength`.
  - Defaults keep ENG-001 behaviour.
- **`motorContent.ts`:** `SUPPLY_CHOICES`, `SUPPLY_BY_ID`, `SUPPLY_GROUPS`, `EXPERIMENT_READOUT`, `FAULT_QUIZ` and four more `SOURCES`. It now imports types only from `fieldMath`, because `model.test.mjs` loads it in Node, which cannot resolve extensionless imports. Codex's continuity session caught this regression; it is fixed.
- **Components:** `SupplyExperiment.tsx` is new. `PhasePlot`, `MotorScene` and `MotorDiagram` take the supply. `MotorScene` also takes `tick`, so a paused Step redraws.

## Files

| File | Change |
|---|---|
| `studio/src/engineering/fieldMath.ts` | supply model, field vector, turning parts, peak currents; demo follows the supply |
| `studio/src/engineering/motorContent.ts` | experiment copy, fault question, sources S12–S15; type-only import |
| `studio/src/engineering/SupplyExperiment.tsx` | new: calculated readouts |
| `studio/src/engineering/EngineeringStudio.tsx` | supply state and menu, card, fault question, `--eng-above` measurement |
| `studio/src/engineering/PhasePlot.tsx` | winding currents for the supply; labels at each curve's peak |
| `studio/src/engineering/MotorScene.tsx` | dial driven by the supply; opacity follows field strength; dial update runs before drei `Html` projects labels; `tick` redraw |
| `studio/src/engineering/MotorDiagram.tsx` | end view driven by the supply; empty slots for no current |
| `studio/src/engineering/engineering.css` | stage height, supply menu, readouts, quiz stack, empty-slot styles |
| `docs/engineering/checks/fieldMath.test.mjs` | 10 new tests |
| `docs/engineering/checks/browser-check.mjs` | 22 new browser checks, including a 39 px shell strip added after mount; `ENG_ONLY` runs chosen scenario groups while iterating |
| `docs/engineering/checks/browser-report.json`, `docs/engineering/screenshots/01–25*.png` | regenerated by the final run |
| `docs/engineering/verification.md`, `docs/engineering/content-review.md` | updated |

## Checks (details in `docs/engineering/verification.md`)

- **Unit tests:** `node --test "docs/engineering/checks/*.test.mjs"` gives **31/31 pass**: the 21 from ENG-001 plus 10 new. Expected values were worked out by hand: swapped currents and pole angles, the pulsing axes for each open phase, 3/4 + 3/4 turning parts, √3/2 current at rest, agreement with the 36-slot table, and rotor standstill with a phase open.
- **TypeScript:** `npx --prefix studio tsc --noEmit -p studio/tsconfig.json` exits 0 for the whole studio.
- **Browser:** `node docs/engineering/checks/browser-check.mjs`, in headless Edge on the Intel UHD GPU (ANGLE D3D11), gives **72/72 pass** (22 October, 19:26–19:29 UTC): the 50 ENG-001 scenarios plus 22 new. Screenshots 22–25 are new.
- **Console:** only the expected entries from the simulated missing GLB.
- **Draw cost:** unchanged, 55 draw calls and 115,265 triangles per operating frame.
- **Earlier runs:**
  - The first full run failed 2 of the new 3D checks. drei's `Html` projected the pole labels before the dial set its new angle, so a single on-demand frame left them one Step behind. Running the dial update at priority −1, as `PartLabel` already does, fixed it.
  - Measuring `--eng-above` inside the ResizeObserver callback raised "ResizeObserver loop completed with undelivered notifications" when a strip appeared after mount. The check for page errors catches it. Measuring on the next animation frame fixed it, in a dev build and a production build.
- **Leaked browsers:** five of my evening runs left headless Edge running (44 processes) because Edge's launcher process had already exited, so `taskkill /T` on its PID found nothing. I stopped them and deleted their temporary profiles. `browser-check.mjs` now closes the browser over DevTools (`Browser.close`) before the process kill.
- **Build message:** Codex reported a TS2741 build error at 08:52 UTC (bus message 34). It was a mid-edit state: `PhasePlot` already took `choice`, and the call site was updated minutes later. The whole-studio `tsc --noEmit` exits 0 on the final sources.

## Decisions worth reviewing

- **Single-phasing is modelled at rest only.** That is the case the experiment shows, since the motor cannot start. The model is a star connection with equal winding impedances. The 87 % current follows from a line-to-line voltage of √3 times a phase voltage across two windings in series. The running single-phased case is described in words with sources, not calculated or animated.
- **Field strength in 3D and 2D is shown by opacity,** so a pulsing field visibly fades and returns. The arcs keep their size.
- **No "hums":** the studio says only that the motor cannot start while current flows, because no source I read states the hum.
- **The worn-bearing fault was not added.** The single-phasing fault is calculated and sourced, and a bearing scenario would only be illustrative. It remains an option for 6.02.
- **The browser check's 3D assertions use the dial's DOM labels:** screen angle per Step for direction, positions and opacity for pulsing. The 3D rotor's standstill is asserted in 2D and in the unit tests, not from 3D pixels.

## Limits and next steps

- **6.03 still needs a qualified engineer.** In particular they should check the single-phasing idealisation, the 87 % figure and the double-revolving-field wording; see the open items in `content-review.md`.
- **"Equipment" in 6.02 is not done.** No new equipment, instruments or other machines were added.
- Only headless Edge on this Windows laptop's GPU was exercised. Real phones, screen readers and the real `.kh-wayfinding` strip in the routed app were not. ENG-ACCEPT-001's `integrated-check.mjs` snapshots the sources and should now pass its "controls visible without scrolling" check.
- For Codex: review this handoff, re-run `npm run build` (I never wrote `studio/dist`), and check `/engineering` on a phone.
