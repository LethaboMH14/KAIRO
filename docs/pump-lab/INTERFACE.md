# Pump lab interface: proposal for root review

Version `kairo-pump-lab-interface/1`. **Proposed, not agreed.** Nothing outside `studio/src/pump-lab/` imports or mounts the lab. No router, provider, manifest, stylesheet or other owner's file was edited. Root should read this, change what it wants, and only then claim the router and provider files for integration.

Source of truth: [`interface.ts`](../../studio/src/pump-lab/interface.ts) (types), [`layout.ts`](../../studio/src/pump-lab/layout.ts) (targets), [`report.ts`](../../studio/src/pump-lab/report.ts) (evidence), [`readout.ts`](../../studio/src/pump-lab/readout.ts) (teacher context).

## 1. Entry component

Default export of `studio/src/pump-lab/PumpLab.tsx`. Lazy-load it like `EngineeringStudio`; it lazy-loads its own three.js scene, so the route chunk stays light and the 2D views never download three.js.

```ts
type PumpLabEntryProps = {
  onExit: () => void;                    // required, same contract as EngineeringStudio
  caseId?: CaseId;                       // default 'baseline-commissioning'
  sessionId?: string;                    // default: random, once per mount
  seed?: number;                         // uint32; default derived from sessionId
  snapshot?: string | null;              // a string from onSnapshot; invalid -> fresh start, said on screen
  view?: 'auto' | '3d' | 'diagram' | 'reading';
  onSnapshot?: (serialized: string) => void;            // after every accepted action
  onEvidence?: (item: PumpLabEvidenceItem, report: PumpLabReport) => void;  // when the learner exports
  onContext?: (context: TeacherContext) => void;        // on selection or state change
  highlightTarget?: TargetId | null;     // controlled highlight for a teacher pointing at a part
  now?: () => string;                    // clock injection
};
```

Props are read at mount only for `caseId`, `sessionId`, `seed`, `snapshot`; later changes do not restart a learner's work. `view: 'auto'` picks 3D only when WebGL exists, motion is not reduced and the viewport is at least 760 px; otherwise the diagram. If the 3D scene throws, the lab says so and shows the diagram.

Proposed route: `/pump-lab`, with `onExit={() => { window.location.href = '/'; }}` like `/engineering`. Mount one heavy scene at a time.

## 2. Scene-target registry

16 stable IDs, namespaced `pump-lab/<id>`. Each has a label, a one-sentence role, an anchor in the 3D frame (scene units, x right, y up, z towards the camera), an anchor in the 2D diagram (viewBox 1000 × 560), and an optional bench part.

`source-tank, strainer, suction-pipe, pump-casing, impeller, shaft-seal, coupling, motor, discharge-pipe, valve, dest-tank, gauge-suction, gauge-discharge, gauge-post-valve, flow-meter, power-meter`

`resolveAnchor(id, view, available3d)` returns `{ ok: true, position, label }` or `{ ok: false, reason, fallback: 'highlight-list-entry' }`. It never returns a wrong point: an unknown ID or an unavailable 3D view falls back to highlighting the entry in the parts list. For exact-word pointing the teacher uses `highlightTarget` plus the anchor; the lab does not move a character.

Camera presets (`CAMERA_PRESETS`) are whole circuit, pump and motor, valve and gauges, inspection bench. Scale is schematic: tank depth and elevation share one scale (0.6 scene units per metre); pump and motor are not to scale.

## 3. Evidence

On export the lab calls `onEvidence(item, report)`. The item follows the shape in the experience plan (attempt, rubric version, answer, assistance used, provenance, feedback source, review status), with practice completed, evidence generated and competency externally verified kept as three separate fields:

```ts
{
  schema: 'kairo-evidence-item/pump-lab-draft-1',
  itemId: 'pump-lab-<caseId>-<hash of the action log>',
  studio: 'pump-lab', caseId, rubricVersion: 'pump-lab-rubric-1',
  label: 'local self-directed simulation, unverified',
  attempt: { explanationAttempts, firstTrySupported, predictions, readings },
  answer: { cause, evidenceIds, note } | null,       // the first supported explanation
  assistanceUsed: { level: 'none' | 'hint' | 'worked-example', hintLevels, openedPartsBeforeSupportedExplanation },
  provenance: { simulated: true, modelVersion, modelStatus, seed, sessionId, actionLogHash, sourceManifest },
  feedbackSource: 'deterministic-rule-based',
  reviewStatus: 'not reviewed by a domain expert',
  events: { practiceCompleted, evidenceGenerated: true, competencyExternallyVerified: false }
}
```

The `itemId` is stable under replay. The schema name carries `draft-1` because it has **not** been aligned with the existing `studio/src/evidence` or `profile` modules; that mapping is root's decision, and I did not edit those files. `PumpLabReport` is the fuller record (every prediction, reading with limit checks, comparison, opened part, explanation with feedback, repair, rubric, limitations); `reportText(report)` renders it as the plain-text observation report.

## 4. Teacher context

`teacherContext(state, selected)` returns `{ caseId, caseTitle, nextStep, selectedTarget, selectedLabel, assistance, readings, supportedExplanation, finished }`. It carries state only. A test asserts it never contains the hidden fault, so a teacher driven from it cannot give the answer away. Gauges in every view show the last reading the learner took, never the live hidden value, and nothing animates before the learner predicts.

## 5. Session snapshot

`serialize(state)` is `{ schema, sessionId, seed, caseId, actions[{action, at}] }`. `restore(text)` rebuilds the whole state by replaying the actions through the same validated state machine, so a tampered or inconsistent snapshot returns `null` rather than loading. Limit: 400 actions, 200,000 characters.

## Open questions for root

1. Evidence schema: adopt `kairo-evidence-item/pump-lab-draft-1` as is, or map into the existing evidence contract?
2. Motor: the lab's motor is a procedural stand-in. Reusing the Engineering studio's GLB motor needs a published pump-facing interface (shaft speed rpm, torque N·m, power kW are available from `currentOperatingPoint`). Which owner does that?
3. Teacher integration: the registry and `highlightTarget` are the only hooks. Does the shared teacher adapter want more?
4. Persistence: `onSnapshot` leaves storage to the shell. Which store, and with what retention?
5. Domain review: who is the external specialist, and what is the release gate?
