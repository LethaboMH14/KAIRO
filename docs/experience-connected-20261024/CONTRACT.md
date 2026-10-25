# Study workspace experience contract — 24 October 2026

Root codex-learner-experience-20261024-g, actual gpt-6 / effort unknown. User requests the full UI/logic/access/teacher/studio journey; prior parallel Luna authorisation applies. Root retains router, provider, studio integration and camera permission-policy ownership. No browser observation, automatic model invocation, new training or public IAM change.

## Design direction

Retain selected C identity: Chalk #f5f0e6, Moss #3e5144, Sage #a7af91, Ink #252b28 and existing Manrope. The engineering model is the main work surface, with KAIRO and one current teaching action alongside it. The surrounding interface answers: which module, what am I learning, what can I change, where is the evidence, and what next? Sources/limits stay inspectable without three competing teacher panels above the experiment. Use plain learner words, responsive stacked layout, visible focus and reduced motion. No new generic dashboard template or unmeasured visual-perfect claim.

```
module / lesson context
Material — Lesson — Explore — My work — Direction
[model / instruments / readings] [KAIRO, current context, explain/hint/predict/check]
                                [current step and cited sources]
```

Camera is optional local hand tracking only, opened by an explicit Start in a temporary access dialog; stop/close/escape/route exit unmounts and releases it. It is not a SASL translator. The browser-observation restriction means we must not activate the user's camera or inspect its image. Microphone remains off. Language choices show actual device/cloud capabilities; selecting a language is not automatic translation of English material.

## Worker A — flow navigation

Own only `studio/src/learning-flow-ui/`, `studio/tests/learning-flow-ui.test.mjs`, `docs/learning-flow-ui-20261024/`, `coordination/handoffs/2026-10-24-learning-flow-ui.md`.

Export default FlowRail from FlowRail.tsx and type FlowStage = 'material'|'lesson'|'studio'|'evidence'|'direction'. Props `{current:FlowStage, moduleLabel?:string, lessonTitle?:string, items:Array<{stage:FlowStage,label:string,href?:string,note?:string}>}`. Stateless; no fetch/storage/router/provider/window. Render only valid same-origin app-relative hrefs (starts single slash, reject protocol-relative/control/backslash), current aria-current='step'; items lacking href are noninteractive with optional note. No click that pretends disabled route works. Compact intentional styling for white/chalk in existing app; labels sentence case. Root supplies permitted/module-aware destinations, no inferred skills or scores. Actual component SSR tests for links, current state, unsupported links and text escaping. No dependencies.

## Worker B — studio teaching presentation

Own only `studio/src/studio-guide-ui/`, `studio/tests/studio-guide-ui.test.mjs`, `docs/studio-guide-ui-20261024/`, `coordination/handoffs/2026-10-24-studio-guide-ui.md`.

Export default StudioGuide from StudioGuide.tsx. Props `{contextLabel:string,response:CoachResponse,speaking:boolean,paused:boolean,status:string,onIntent:(intent:CoachIntent)=>void,onRead:()=>void,onPause:()=>void,onStop:()=>void,onAccess:()=>void,visual?:ReactNode}`. Import type CoachIntent/CoachResponse from existing studio-coach/model (inspect actual response type export; use ReturnType<typeof coachFor> if CoachResponse is not exported). Render KAIRO identity, current selected part/context, four deliberate actions Explain/Hint/Predict/Check, response title/text/prompt, one Read/Pause/Resume/Stop control group and a Voice/language/camera button. Root renders visual slot; fallback portrait if no visual supplied. Authored scope and source links inspectable; use validated https references only. No model/voice/camera calls or state. Do not include fabricated feedback, recognition, scores or simulation correctness. Source links target blank with noreferrer. Component SSR and callback tests must exercise actual implementation and ensure unsafe links escaped/rejected. No dependency, router/provider or studio source edits.

## Root integrations and acceptance

Preserve lesson/module context into motor/pump links and back to evidence; show only relevant cohort activities. Place one KAIRO panel beside pump tasks via optional `PumpLabEntryProps.teachingPanel?:ReactNode` slot, with no hidden case/fault revealed. Motor consolidates teacher presentation while keeping sourced detailed part help. Root owns optional lazy 3D avatar connected to the single teacher's audio/captions and portrait fallback. Role direction initially maps practice to explicit skill questions, not employer verification; no guessed hiring probabilities or outdated offers presented as open.

Product/Usability: fewer disconnected decisions and correct return paths. Creativity/Presentation: contextual KAIRO alongside the experiment. Intelligence: explain what context drives authored coaching, no open-ended capability claim. Sustainability: stateless reusable panels and one narrator. Impact remains learner-validation hypothesis. Evidence: exact route/context tests, real components under deterministic harnesses, cancellation/camera lifecycle checks, full build; no browser/device acceptance implied.
