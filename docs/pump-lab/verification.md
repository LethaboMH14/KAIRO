# Pump lab verification

23 October 2026, Windows 11, Node v24.18.0. Commands run from `studio/`. Results are what the commands printed, not a judgement that the lab is correct or finished.

## Automated

| Command | Result |
|---|---|
| `npx tsc -p . --noEmit` | exit 0 (13 pump-lab files are in the program) |
| `node --test tests/pump-lab.test.mjs tests/pump-lab-ui.test.mjs` | 65 tests, 65 pass, 0 fail |
| `npm test` (whole studio) | 401 tests, 400 pass, 1 fail. The failure is `module-chooser-ui.test.mjs` "source context is shown honestly and learner text is escaped", another owner's in-progress module, which this package does not touch. |
| Vite production build of `src/pump-lab/preview.html` into a scratch folder (not `studio/dist`) | builds; entry chunk 315,514 B JS + 25,996 B CSS; lazy scene chunk 919,794 B (includes three.js) |

What the 50 model tests cover: constants and units; pump-equals-system-head at the root over more than 1,000 grid points; closed-form agreement; the affinity law; monotonic flow in speed and valve for healthy and faulted circuits; efficiency between 0 and 1; pressure consistency; no-flow reasons; water conservation and tank bounds; input rejection; every fault still failing at full speed with its documented reason; noise bounds over 400 seeds; fault signatures over 150 seeds × 112 settings, with a healthy circuit never accused; the gated state machine (prediction first, evidence before opening a part, explain before repair, comparison before finishing); explanation feedback that does not name the cause; help recorded in the evidence and the report; replay, tamper and size rejection; reset equality; report and evidence honesty; an overclaim text scan; scene targets, flow path continuity, particle speed proportional to flow, cue definitions, teacher anchor fallback, no live value on gauges; the module staying inside its subtree and free of `Math.random` and clock reads; the manifest matching the code.

What the 15 render tests cover: the real component tree rendered to HTML in every view and case with no React warnings; the heading, back action and disclosure; all 16 parts focusable with names in the diagram and as buttons in the parts list; the Reading view carrying the whole state in text; nothing running before a prediction; cues appearing in words; every button having text and every control a label; unique and resolvable ids; slider value text; stylesheet rules for 44 px targets, reduced motion and the one-column breakpoint; hints, comparisons and the finished state; invalid snapshot handling; 3D fallback; plot tables and datasheet; the hidden fault never rendered; highlight handling.

One earlier failure is worth recording: root's full-suite run (bus message 60) caught a render-test assertion that did not match the component's wording ("Flow meter. No reading yet"). It was a test wording error, fixed; the current 65/65 includes the corrected assertion. The render tests also caught a real defect: SVG `<title>` elements with interpolated children produced React warnings, now fixed.

## Browser pane (manual, one session, this laptop)

Vite dev server on port 4181 using the existing `engineering-preview` launch entry (serves all of `studio`), opened at `/src/pump-lab/preview.html`, then stopped. I used the built-in Browser pane. I did not use headless Edge, a raw debugging protocol, or the computer-use tool whose observation was denied earlier. If the earlier denial was meant to cover every browser route, that is a decision for the user; I flag it in the handoff.

Observed:

- The 3D room draws: both tanks with water at the true levels, the elevated destination tank on legs, suction line with strainer, translucent pump casing with impeller, motor, riser, valve with handle, gauges, flow meter, and the bench parts. Screenshot: [room-3d-live-motor-over-rating.jpg](evidence/room-3d-live-motor-over-rating.jpg).
- Taking a reading before a prediction was refused with a plain message. After a prediction the pump ran: particles on the pipes, and a ring plus the words "The motor is over its rating" at full speed.
- The stuck-valve case was completed end to end by a script that clicked the page's own buttons, radio buttons, checkboxes and selects (not by hand): predict, read (6.4 L/s, 215 kPa, over the limit), compare three sections, explain (supported), repair, predict again, read (12.8 L/s, 82 kPa), compare the two readings, finish. Status "Case finished". Screenshot: [diagram-finished-valve-case.jpg](evidence/diagram-finished-valve-case.jpg).
- Keyboard: focusing a diagram part and pressing Enter selected it and updated the card (checked by script dispatching the key event, not by a physical keyboard).
- At 375 px wide the layout is one column with full-width controls; diagram labels are small (see limits).

Problems found in the pane and fixed: the 3D canvas collapsed to 150 px high (an inline `height:100%` beat the class); the camera framing cut off the tanks; drei `Html` chips for the gauges threw "unmount a root while React was rendering" errors and one uncaught `removeChild` error, so all `Html` was removed and readings moved to a DOM overlay; diagram labels overlapped; a pressed toggle turned unreadable on hover.

Not observed: frame time (the pane was hidden when asked, so animation frames did not run), any real phone or touch input, the bench explode slider, camera presets, a screen reader, contrast measurement, 200% zoom. The console was read after most changes but not after the last diagram-label and scroll-wrapper edits.

## Reproduce

```
cd studio
npx tsc -p . --noEmit
node --test tests/pump-lab.test.mjs tests/pump-lab-ui.test.mjs
```

The render tests bundle the component with esbuild into the OS temp folder at run time; nothing is written into the repository.
