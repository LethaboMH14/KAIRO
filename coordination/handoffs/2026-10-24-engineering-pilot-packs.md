# Engineering pilot teaching packs handoff

Date: 2026-10-24 (Africa/Johannesburg)
Owner: `codex-luna-edited-lesson-review-20261023-a` (Codex)
Registered model/effort: `gpt-6-luna` / `light` (the exposed client settings)
Task: `ENGINEERING-PILOT-PACKS-20261024-001`
Scope: `docs/engineering-pilot-packs-20261024/` and this handoff only.

## Delivered

- `docs/engineering-pilot-packs-20261024/motor-field-speed.json`: original short lesson/practice pack for predicting synchronous field speed, using the motor calculator, and separating field speed from rotor speed.
- `docs/engineering-pilot-packs-20261024/centrifugal-pump-pressure-flow.json`: original lesson/practice pack for prediction, simulated readings, section comparison, and evidence-based explanation in the Pump Lab model.
- `docs/engineering-pilot-packs-20261024/FEATURE-SUPPORTEDNESS.md`: current implementation/manual/planned mapping with source paths and route/model boundaries.
- `docs/engineering-pilot-packs-20261024/validate.mjs` and `validation-evidence.json`: dependency-free schema/reference/feature-table validator and captured result.
- `docs/engineering-pilot-packs-20261024/README.md`: schema, sources, reproducible command, and review boundaries.

Both JSON files use exactly the published version 1 content-pack shape. Each step and practice item carries source reference IDs. Source references include a locator, check date, and item-level reuse note; where no item-specific licence was confirmed, the pack uses factual citation and original paraphrase only. No source passage, diagram, source document, or external asset is bundled.

## Current-code review and supportedness

Read-only review covered `studio/src/engineering/EngineeringStudio.tsx`, `fieldMath.ts`, `teaching.ts`, `motorContent.ts`; `studio/src/pump-lab/PumpLab.tsx`, `physics.ts`; and `docs/pump-lab/MODEL.md` and `README.md`.

- The motor component currently provides part explanations and a synchronous field-speed calculator. Its displayed rotor motion deliberately exaggerates slip and is not a real shaft-speed measurement. Manual written prediction is marked `manual`.
- Pump Lab code provides a case, controls, prediction, simulated measurements, section comparisons, explanation and report/evidence draft actions in its standalone component. Its model identifies itself as illustrative and not validated against a real pump. Its package README says it is not mounted in the app; no fixed route, real equipment diagnosis, or arbitrary-source-to-tool bridge is asserted.
- External references support general physics/engineering claims only; they do not validate the app's illustrative pump coefficients or animation. Neither pack claims course credit, certification, maintenance/safety instruction, real equipment applicability, or learner mastery.

## Sources reviewed

- NPTEL, IIT Kharagpur, three-phase induction motor outline: Module 8.1-8.2 (rotating stator field, induction motor construction and slip), PDF navigation p. 9.
- NPTEL, Electrical Machines II, §8.4 (synchronous speed from supply frequency and pole-pair count), PDF navigation p. 5 / printed p. 34.
- NPTEL, induction-machine chapter 4, §4.3.4, eq. (4.76), PDF navigation p. 24 / printed p. 4.25 (slip relation).
- U.S. Department of Energy Fundamentals Handbook HT-03, system curve and operating point, PDF navigation pp. 73-74 / printed pp. 52-53.
- Hydraulic Institute Pump Fundamentals, “Pump Curves” (affinity rules and same-efficiency assumption) and “Pump System Operating Point” (intersection and changes from speed/valve settings).

All sources were checked on the local date 2026-10-24; machine-generated validation timestamp is UTC. Specific reuse permissions were not confirmed for the referenced files/pages, so nothing beyond citation and original factual paraphrase was reused.

## Evidence and judging target

Reproducible checks run from repository root:

```powershell
node docs/engineering-pilot-packs-20261024/validate.mjs
node --check docs/engineering-pilot-packs-20261024/validate.mjs
```

Actual results: validator passed for 2 packs, 6 lesson steps, 2 practice items and 6 source references. It also passed negative checks that reject an unknown source ID, a capability status outside the published enum, and an unpublished top-level bridge field. It checked that the support table contains all three status categories, discloses Pump Lab's unmounted status, and that all eight reviewed source files exist. Node syntax check passed. `validation-evidence.json` contains the recorded output summary and limitations.

This improves **Product** by providing two coherent, source-referenced teaching/practice sequences for existing engineering components, and **Usability** by giving a learner a visible predict → inspect/calculate → explain-with-evidence sequence. Observable acceptance for this package is exact schema/reference validation and auditable agreement between each component action and current code. These checks are not learner research or visual acceptance.

## Remaining review and integration

Root review is needed before use or integration. An engineering specialist should review the authored explanations and especially the pump model's teaching interpretation. Route mounting and any source-to-lesson/tool mapping are owned elsewhere and remain unimplemented by this package. No browser, device, screen-reader, learner, real-pump, or course accreditation acceptance was performed. No global build or full suite result is claimed; only the focused docs validator and Node syntax check were run.
