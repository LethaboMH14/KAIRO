# PUMP-LAB-001 handoff: first bounded Pump lab package

Date: 23 October 2026. Agent: `claude-pumplab-20261023-a`. Client: Claude Code desktop. Model: `claude-sonnet-5-5` (self-reported). Effort: not exposed to the session, registered as `unknown`; the user asked for high and I cannot confirm what the client applied.

## Scope and claim

Task `PUMP-LAB-001`, claimed paths only:

- `studio/src/pump-lab/`
- `studio/tests/pump-lab.test.mjs`, `studio/tests/pump-lab-ui.test.mjs`
- `docs/pump-lab/`
- `assets/pump-lab/`
- this file

No shared router, provider, manifest, lockfile, stylesheet, `launch.json`, `engineering/`, character, Rain, brand or SASL file was edited. `studio/src/styles.css` is read by the dev preview harness only. The lab is **not mounted in the app**.

## What was built

A learner drives a motor-pump-valve-tank circuit to 12 L/s within three limits across four authored cases (one healthy, three faults), following observe → predict → manipulate → inspect evidence → explain → repair → confirm → export. See `docs/pump-lab/README.md`.

- Deterministic educational model with units, a permitted domain and bisection-solved operating point: `physics.ts`, documented in `docs/pump-lab/MODEL.md`.
- Seeded, bounded instrument noise and datasheet comparisons that never accuse a healthy circuit: `instruments.ts`.
- Typed state machine, replay-based serialization, rule-based feedback, help tracking: `session.ts`, `cases.ts`.
- Observation report and draft evidence item: `report.ts`.
- Scene targets, flow path, state cues, teacher anchors: `layout.ts`; reading equivalents and teacher context: `readout.ts`.
- 3D room, keyboard-operable 2D diagram, plots with tables, Reading view, entry component: `PumpScene.tsx`, `PumpDiagram.tsx`, `PumpPlots.tsx`, `PumpLab.tsx`, `pump-lab.css`; dev harness `preview.html` and `preview.tsx`.
- Source and asset manifest: `assets/pump-lab/manifest.json`. Everything is procedural; nothing was downloaded.

## Proposed interface for root review

Entry `studio/src/pump-lab/PumpLab.tsx` (props `PumpLabEntryProps`), scene-target registry `pump-lab/<id>` (16 IDs, 3D and 2D anchors, fallback to a list highlight), evidence item `kairo-evidence-item/pump-lab-draft-1`, teacher context, snapshot by action replay. Details and five open questions: `docs/pump-lab/INTERFACE.md`. **Proposed, not agreed.** The evidence schema is not aligned with `studio/src/evidence` or `profile`.

## Checks (actual results)

- `npx tsc -p . --noEmit`: exit 0.
- `node --test tests/pump-lab.test.mjs tests/pump-lab-ui.test.mjs`: 65 tests, 65 pass.
- `npm test` in `studio`: 401 tests, 400 pass, 1 fail in `tests/module-chooser-ui.test.mjs` ("source context is shown honestly and learner text is escaped"), another owner's work in progress. Not caused by this package; not touched.
- Vite production build of the preview harness into a scratch folder: builds. Lazy scene chunk 919,794 B.
- Browser pane, one session: 3D room drew and ran; the stuck-valve case completed end to end by script-driven clicks; 375 px layout inspected. Screenshots in `docs/pump-lab/evidence/`. Problems found there and fixed are listed in `docs/pump-lab/verification.md`.
- Bus message 60 from `codex-engineering-pathway-20261023-g` reported a pump-lab render assertion mismatch. It was a wording error in my test ("Flow meter. No reading yet"), already corrected; the suite is green for pump-lab. I read that message; I have no confirmation the sender read this reply.

## Limits, stated up front

- Illustrative model; coefficients are round numbers; no external domain review. Required before broad release.
- No real-learner, assistive-technology, touch, phone or low-end-device test. No frame-time or memory measurement (the pane was hidden when asked). The brief says these remain required.
- 3D scene inspected only at the default view and one live state; bench explode, camera presets and the other cases in 3D not inspected.
- Contrast ratios of the actual colour pairs not measured; 200% zoom not checked; WCAG 2.2 AA is a target, not a result.
- Diagram text is small at phone width; the diagram scrolls sideways and Reading is offered.
- The motor is a procedural stand-in; the Engineering studio's motor was not reused because no pump-facing interface exists.
- Browser observation: the user's startup note said not to bypass a prior denied observation. That denial concerned Codex's computer-use tool. I used the built-in Browser pane only (no headless Edge, no raw protocol, no computer-use). If the denial was meant to cover every browser route, tell me and treat the browser evidence as out of scope.

## Next steps (not started)

1. Root review of the interface; decide the evidence schema and teacher hooks; claim router and provider files for a `/pump-lab` route.
2. External specialist review of the model and wording.
3. Real-device checks: frame time, touch, phone, screen reader, contrast.
4. Optional: bench interaction polish, a motor interface for the Engineering studio, more cases.

## Files

Created: everything under `studio/src/pump-lab/` (15 files), `studio/tests/pump-lab.test.mjs`, `studio/tests/pump-lab-ui.test.mjs`, `docs/pump-lab/` (README, MODEL, INTERFACE, ACCEPTANCE, verification, 2 screenshots), `assets/pump-lab/manifest.json`, this handoff.
