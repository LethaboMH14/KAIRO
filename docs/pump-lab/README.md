# Pump lab: the pump room that will not fill the tank

23 October 2026. PUMP-LAB-001, first bounded package of the Engineering studio extension described in [STUDIO-BRIEFS.md](../blueprint/studio-data/STUDIO-BRIEFS.md). Built by `claude-pumplab-20261023-a` (Claude Sonnet 5.5; effort not exposed by the client, so registered as `unknown`). It is **not mounted in the app**. Root integration is a separate claim; see [INTERFACE.md](INTERFACE.md).

## What a learner does

A motor drives a pump from a source tank, through a discharge valve, to a raised tank. The target is **12 L/s** without breaking three limits: discharge pressure at most 200 kPa, motor shaft power at most 2.2 kW, and a suction margin of at least 0.5 m so the pump does not cavitate.

Observe → predict → manipulate → inspect evidence → explain → repair → confirm → export:

1. **Observe.** Read the operator's report. Select any part (3D room, diagram, or the parts list) to see what it does and what it shows.
2. **Predict.** Say what flow to expect before the first reading. The datasheet curves in the plot are available to work it out.
3. **Manipulate.** Set pump speed (600–1,450 rpm) and valve handle (0–100%). Run the transfer so the tanks change.
4. **Inspect.** Take readings (flow, three pressures, motor power, crackling). Compare one section at a time against the datasheet: suction line and strainer, pump, discharge valve. Compare two readings. Open a part on the bench, but only after some evidence exists.
5. **Explain.** Choose a cause from six candidates and cite which of your own comparisons show it. Feedback names what your readings do and do not support.
6. **Repair.** Only after a supported explanation. A repair changes a named state in the case; it is not a maintenance procedure.
7. **Confirm and export.** Predict again, read again, compare before and after, finish when every limit is met. Export a plain-text observation report and a draft evidence item.

Four cases, all authored:

| Case | Hidden state | What "turn the speed up" does |
|---|---|---|
| Commission a healthy circuit | none | Full speed overloads the motor; the lesson is the limits. |
| The handle says open | valve gate stuck at 15% | Flow barely rises and discharge pressure goes over 200 kPa. |
| Crackling and low flow | strainer loss 70× clean | Pump cavitates; flow barely changes. |
| Runs but delivers weakly | impeller at 62% of shut-off head | Flow stays under target and the motor is overloaded. |

A blocked strainer and a worn impeller both make the pump look weak. Only the suction-line comparison separates them, and the explanation step checks that the learner used it.

## Where things are

| Path | Contents |
|---|---|
| `studio/src/pump-lab/` | Model, session, scene, diagram, plots, entry component, stylesheet, dev preview |
| `studio/tests/pump-lab.test.mjs` | 50 model, state-machine, layout and manifest tests |
| `studio/tests/pump-lab-ui.test.mjs` | 15 tests that render the real component tree to HTML |
| `assets/pump-lab/manifest.json` | Asset, source and licence record (nothing downloaded) |
| `docs/pump-lab/` | This folder |
| `coordination/handoffs/2026-10-23-claude-pump-lab.md` | Bus handoff |

To look at it on a dev server: serve `studio` with Vite and open `/src/pump-lab/preview.html`.

## What this is not

An illustrative teaching model. Its coefficients are round numbers chosen to teach, not measured from a pump, and no qualified engineer has reviewed it. It is not computational fluid dynamics, not an equipment digital twin, and not a maintenance or electrical-safety course. Completing it earns no credential. See [MODEL.md](MODEL.md) and [ACCEPTANCE.md](ACCEPTANCE.md).
