# Engineering pilot packs: feature support and limits

Checked against the current source tree on 2026-10-24. This is a static code review, not a route, browser, device, or learner test.

| Pack action | Current implementation evidence | Pack status | Boundary |
|---|---|---|---|
| Select motor parts and read descriptions | `studio/src/engineering/EngineeringStudio.tsx` renders the parts list; `motorContent.ts` and `teaching.ts` provide descriptions | implemented | This is KAIRO's current Engineering Studio component. |
| Enter frequency and pole count; calculate synchronous field speed | `EngineeringStudio.tsx` and `fieldMath.ts` call `synchronousSpeed` and render its result | implemented | The result is field speed, not measured shaft speed. |
| Write a prediction before checking | No authored free-form prediction field is part of the motor calculator | manual | Learner writes/records a prediction outside the component. |
| Choose pump case, apply speed/valve settings, predict flow, take simulated readings, compare sections | `studio/src/pump-lab/PumpLab.tsx`, `session.ts`, `physics.ts` expose these component interactions | implemented | Implemented within the Pump Lab component only. `docs/pump-lab/README.md` states it is not mounted in the app; this package claims no live route. |
| Reason from simulated readings and export an observation/evidence draft | `PumpLab.tsx` supports explanation and text/JSON export; `report.ts` labels simulation provenance | implemented | An evidence draft is not a qualification, external assessment, real-equipment record, or learner mastery proof. |
| Use manufacturer pump curves or identify a real pump fault | Not implemented; the Pump Lab model explicitly says it is not validated against a real pump | planned | Future human-reviewed extension only; neither pack asserts this capability. |
| Automatically map arbitrary uploaded material to either pack or invoke a live studio tool | No such integration is asserted in the published content-pack contract or this package | planned | Root owns integration; no bridge is represented as currently available. |

## Model and source boundaries

- The motor's synchronous-speed calculation is implemented. The animated rotor motion is explanatory only: `EngineeringStudio.tsx` says its slip is exaggerated and not to scale, and it does not simulate torque, heating, efficiency, or real shaft speed.
- The pump's equations, constants, fault cases, comparisons, and instrument uncertainty belong to its illustrative model. `studio/src/pump-lab/physics.ts` sets the status to “illustrative teaching model, not validated against a real pump”; `docs/pump-lab/MODEL.md` documents assumptions and missing real-pump validation.
- External engineering references support the physical principles; they do not validate KAIRO's pump coefficients, motor animation, current route availability, or any equipment diagnosis.
- Source reuse status is recorded per reference in each JSON pack. Where no item-specific permission was confirmed, the pack uses original paraphrase and citation only and reproduces no source passage, figure, or diagram.

## Acceptance relation

The two authored packs improve the **Product** criterion by giving the existing engineering demonstrations a small coherent learning objective and improve **Usability** by ordering a learner action as predict → inspect/calculate → explain with evidence. The acceptance check for this docs-only package is structural validation plus reviewable source references and exact capability mapping. No learner study, route integration, device accessibility acceptance, or engineering specialist approval is claimed.
