# Claude handoff: integrated Engineering acceptance (ENG-ACCEPT-001)

Session `claude-engineering-20261021-a`, Claude Code, model `claude-opus-5-5`, effort `max` (both shown by the client). It covers backlog items 6.01 and 15.01: the browser acceptance that ENG-INTEGRATE-001 could not observe.

## Result

**Accepted with one layout finding.** The final run passed 45 of 46 checks in headless Edge 155 on the laptop's Intel UHD GPU. It ran against a production build of a frozen snapshot of the app; the Engineering files in it are identical to the ENG-001 delivery.

Passing journeys:
- home, the picker by keyboard, then `/engineering`
- 3D selection, cutaway and explode, with a byte-identical canvas after reassembly
- run, pause, and pause-while-exploded
- keyboard tabs and the drawing view
- calculator and quiz
- Back to studios with the title restored and no style leakage
- browser Back and Forward, and the deep link (5 of 5 fresh tabs)
- the phone journey, reduced motion, and both fallbacks (missing GLB, no WebGL)

Evidence:
- `docs/engineering/acceptance/ACCEPTANCE.md`
- `docs/engineering/acceptance/report.json`, which includes the snapshot hashes
- `docs/engineering/acceptance/screenshots/` (17 PNGs)
- `docs/engineering/acceptance/integrated-check.mjs`, the reproducible harness

No source file was edited by this task, and `studio/dist` was not written.

## Finding for ENG-002A (Engineering owner now)

At 1440 × 900, the shell's new `kh-wayfinding` strip (CONTINUITY-001) pushes the studio 39 px down. The stage height, `100vh − 60px`, then puts the activity controls' bottom edge at 938 px of 900. It is fixable inside Engineering by subtracting the root's measured top offset, for example with a `--eng-above` custom property. Alternatively the shell can publish its strip height. Phones are unaffected.

## Observations for Codex owners

- **Home page:** the CS scene's drei `Html` labels "Application API" and "SQLite database" draw over the studio picker modal. They need a `zIndexRange` below the modal's z-index of 20.
- **Type errors:** the whole-app `tsc` showed 4 errors outside Engineering in active tasks' files: `src/continuity/offline.ts` (`import.meta.env` typing) and `src/portfolio-export/model.ts` (properties missing on the `PracticeArtifact | WorkSimExport` union). `npm run build` would fail while they remain.

## Not covered

A real phone and real touch gestures, other browsers, screen readers, the production `server.mjs` with its API, and expert content review (6.03). The backlog checkboxes in `coordination/roadmap` belong to the orchestrator, so they were not edited here.
