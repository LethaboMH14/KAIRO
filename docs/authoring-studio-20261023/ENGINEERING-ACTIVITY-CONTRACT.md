# Engineering lesson contract for bounded authoring

Date: 23 October 2026. Lane E read-only review of Engineering motor and PUMP-LAB-001. This is an adapter proposal, not a runtime/API implementation or approval of the proposed pump interface.

## Why this slice

Judging criteria improved: Product (complete source-to-practice path), Creativity (predict a consequence before changing a meaningful variable), Usability (same steps in diagram/reading and recoverable exit), Intelligence (deterministic source-grounded calculation and explicit evidence provenance). Learner need: connect a cited AC induction-motor principle to an observable result, make a safe bounded change, explain what the result supports, and resume the attempt. Acceptance is observable as an immutable lesson revision + validated action sequence + resulting measurement + learner explanation and assistance record. The current local controls do not yet provide the complete shared lesson artifact/evidence/resume adapter.

## Public interfaces actually found

**Engineering motor.** `EngineeringStudio` default export accepts only `{ onExit: () => void }` (`studio/src/engineering/EngineeringStudio.tsx`). It is not externally controlled: selecting parts, modes, cutaway, assembly, playback, speed, supply, calculator frequency and poles are private React state and UI handlers. Public pure calculations are `synchronousSpeed(frequencyHz, poles)` and `readNumber(text)` in `fieldMath.ts`: finite frequency 1–400 Hz; total poles exactly 2, 4, 6, 8, 10 or 12; return is rotating-field synchronous speed in rpm and rev/s. It does not calculate loaded shaft rpm. UI default is 50 Hz and four poles; South Africa framing should use 50 Hz. Its existing `FIELD_CHECK` is 60 Hz and a displayed 4-pole answer of 1,800 rpm, a US reference example, and must not be silently used as a local supply claim. At 50 Hz and four poles, synchronous speed is 1,500 rpm. The demonstration's slip and playback rate are illustrative, not a measurement. The operating field offers normal, phase-swap and one-phase-open teaching experiments, but these alter prepared illustrative supply state; they are not physical wiring instructions or a motor-control API.

Only component callback is `onExit`; no `onAction`, state snapshot, command dispatcher, computed measurement callback or cancellation prop exists. It does internally cancel animation frames on effect cleanup, stop playing on reduced motion/unassembled state, use 2D on unavailable/failed WebGL, and stop shared narration on equipment context changes/unmount. Exit returns to `/` in current integration. Shell must avoid mounting another heavy scene concurrently; no explicit scene resource lifecycle callback is published. Existing teacher is a stateless in-component adapter to the single shared TeacherProvider, with explicit read/pause/stop actions; speech consent is managed by provider and isn't the motor calculation's consent. There is no additional AI or cloud consent needed for this deterministic lesson proposal.

**Pump lab.** `docs/pump-lab/INTERFACE.md` v1 is explicitly proposed/unagreed and unmounted. It describes default `PumpLab` props including `onExit`, optional `caseId`, `sessionId`, uint32 `seed`, `snapshot`, `view`, `onSnapshot`, `onEvidence`, `onContext`, controlled `highlightTarget`, and test-only `now`. Props are read at mount for identity/case/snapshot. `view` has auto/3d/diagram/reading; auto chooses diagram for reduced motion, narrow viewport or missing WebGL; scene error falls back to diagram. `onSnapshot` after accepted actions and `onEvidence` on export are proposed interface hooks, not shell integration. Pump session already has typed `Action`, `transition`, `serialize`, and `restore` within its isolated module. The UI allows only declared actions, with speed 600–1450 rpm and valve 0–100%; these are model controls, not electrical motor settings. Its deterministic values are illustrative and not a real pump/twin; coefficients are authored teaching targets, not sourced equipment facts. Its report distinguishes simulated from learner events and draft evidence. No pump-facing motor component interface is published; the Engineering scene's current operating data must not be inferred as a shared setter.

## Example authored activity

Title: **Why does a four-pole induction motor have a different field speed on 50 Hz and 60 Hz supplies?**

Source claim (DOE, *Improving Motor and Drive System Performance—A Sourcebook for Industry*, AC motor section): “Synchronous speed = 120 × frequency [hertz (Hz)] / number of poles”. DOE also gives 60 Hz/four-pole = 1,800 rpm. KAIRO should cite the source with location/page/edition from the downloaded/public edition after editor review; the web-discovered source is the [DOE sourcebook PDF](https://www.energy.gov/sites/default/files/2014/04/f15/amo_motors_sourcebook_web.pdf). This source describes an AC rotating stator field. A DC commutator motor explanation is the wrong machine/domain for this activity.

Steps, identical semantic order in 3D, diagram and reading views:

1. Review the quoted claim, machine type (three-phase AC induction motor), four-pole winding, units and revision citation.
2. Predict the field speed at 50 Hz; capture numeric answer and confidence/optional explanation before calculation.
3. Choose the allowed control change: change calculator supply frequency from 50 to 60 Hz, holding pole count at four. This is a calculator input only, not a change to the visual motor winding or a real installation instruction. Keep frequency within 1–400 Hz; pole count from enumerated supported choices.
4. Calculate locally with `synchronousSpeed(60, 4)`, show measured/calculated value 1,800 rpm (=30 rev/s) and the equation. Label as calculated rotating-field speed, never measured motor shaft speed. At the original South African 50 Hz context, show 1,500 rpm (=25 rev/s).
5. Explain direction: at fixed poles, synchronous field speed scales directly with supply frequency; state one limit (rotor shaft runs below synchronous speed under load due to slip; actual motor response is not simulated). Compare prediction to value.
6. Attempt an authored follow-up (e.g. at 50 Hz, what pole count gives 1,000 rpm? supported answer: 6 poles) and record answer, explanation, help level, source revision, formula version and action/result provenance. This is practice evidence, not mastery or learning gain.
7. Save a resumable lesson attempt against the exact source/lesson revision and current step; restoring opens in reading with the learner's attempt intact. Clear/resume must not silently recompute an old result against a new lesson/source revision.

The chosen “safe change” means a bounded, nonphysical calculator input. Do not expose `frequency` as a motor scene actuator. The visual 36-slot/four-pole winding stays fixed while calculator poles vary; copy must say so.

## Command and capability adapter proposal

Use a registry keyed by reviewed lesson capability, with discriminated payloads, never generated JavaScript or arbitrary method names. Example command variants: `{kind:'motor.fieldSpeed.calculate', frequencyHz:number, poles:2|4|6|8|10|12}`; `{kind:'pump.setSpeed', rpm:number}` and `{kind:'pump.setValve', percent:number}` only after the pump owner confirms the proposal; plus typed activity-level `predict`, `explain`, `requestHint`, `saveAttempt`, `resumeAttempt`, `exit`. Registry entries bind capability/version, schema validator, finite enumerations/bounds/units, source-backed concept id, deterministic handler, output label, evidence adapter and supported views. Unknown command, unreviewed source revision, invalid bound, stale session or unsupported view returns a typed refusal. Teacher actions can only request registered commands; consent-gated speech remains a separate provider capability and may be stopped on context change/exit.

A shared capability must not expose arbitrary `setState`, callbacks to generated code, a generic JavaScript evaluator, raw event injection, hidden pump fault state, or a catch-all simulator API. Preserve the current owners' boundaries: no router/provider implementation assigned here, and no proposal to modify EngineeringStudio internals without a separately claimed interface task.

## Secondary example: pump-lab

Title: **Meet delivery target without exceeding the model's limits**. Lead with authored case goal: target 12 L/s; model limits discharge ≤200 kPa, shaft power ≤2.2 kW and suction margin ≥0.5 m. Cite the source/model version explicitly as “illustrative authored model”; these thresholds are lesson targets, not universal pump safety specs. Learner predicts flow, selects bounded speed/valve values, runs the deterministic local model, observes its seeded instrument reading with noise/error bounds, compares sections/readings, cites evidence for an explanation, then repairs and confirms the case. Same meaning in 3D/diagram/reading. Record assistance and the exact seed/action log/model version. Do not call the displayed readings measured real-world values or the equipment a digital twin. Pump lesson cannot start through the shared route until root accepts interface/evidence schema and maps persistence/resume.

## Acceptance matrix

| Step | Existing evidence/support | Required adapter acceptance | Open gap |
|---|---|---|---|
| Source review | DOE sourcebook formula; source revision/edition citation still needs editor verification | Every claim maps to immutable source span and lesson revision in all views | Public link currently sourced, page metadata not pinned in app |
| Predict | Engineering UI has calculator answer entry; not generic activity prediction callback | No result/animation before stored prediction; reload restores it | No exported generic attempt contract |
| Allowed change | Local calculation has bounded 1–400 Hz and finite pole enum | Command registry validates units/range and logs before/after input | No public motor setter/callback; calculator itself currently local UI |
| Observe | `synchronousSpeed` deterministically returns rpm/rev/s | Display value, formula, model/source revision and label `calculated field speed` | No value callback to shell; must add adapter under owner claim |
| Explain/practice | Prepared `engineeringExplanation`; calculator check | Feedback references answer and source, allows help and retry | Existing progress is local topic flag, not attempt evidence or mastery |
| Evidence | Pump draft schema + report; Engineering only local progress flags | Common evidence preserves source id/revision, command, prediction, output, assistance, status | Mapping to shared evidence contract unresolved |
| Resume/exit | Motor `onExit`; pump proposed snapshot hooks and action replay restore | Exact revision/session resume; stop narration, cancel pending work, unmount one heavy scene on exit | Root shell/persistence owns route lifecycle; no motor snapshot; pump hooks unaccepted |
| Alternate view | Motor 2D; pump diagram/reading, fallback rules documented | Same action order, labels, units and evidence in every view; no 3D requirement | Human keyboard/phone acceptance remains open |

Evidence checked: source reads and code interface inspection only; no app source changed, tests/build/browser checks not run in this lane. Criterion coverage is contract-level proposal, not delivered behavior or validation.
