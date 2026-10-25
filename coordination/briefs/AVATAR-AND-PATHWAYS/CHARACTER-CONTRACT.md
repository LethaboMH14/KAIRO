# Proposed character interface v1

Published before integration. This contract is a proposal for CHARACTER-002; the existing runtime has not adopted it automatically.

```ts
type CharacterCue =
 | {id:string;type:'idle'|'listen'|'explain'|'acknowledge'}
 | {id:string;type:'point';targetId:string}
 | {id:string;type:'move';anchorId:string};
type Target = {id:string;position:[number,number,number];normal?:[number,number,number]};
type CharacterProps = {
 cue: CharacterCue;
 targets: readonly Target[];
 audio: {energy:number;playing:boolean;paused:boolean;time:number;visemes?:readonly {at:number;shape:string;weight:number}[]};
 expression:'neutral'|'encouraging'|'curious'|'focused';
 reducedMotion:boolean;
 onReady:(report:{assetId:string;rigVersion:string;capabilities:string[]})=>void;
 onCueState:(event:{id:string;state:'accepted'|'acting'|'completed'|'interrupted'|'unsupported';reason?:string})=>void;
};
```

Deliver `studio/src/character/TeacherCharacter.tsx` as a default component rendered inside an existing R3F Canvas. Do not create a second renderer inside that component. Keep a separate standalone rehearsal harness and keyboard-accessible controls in the same subtree. No hard dependency on a provider, global mutable state, network credentials or the whole app shell. A missing target returns unsupported; it does not trigger an invented action.

Speech and semantic lesson actions remain separate. The character can complete a movement cue; it cannot claim a lesson board changed until the app action controller confirms that change. To support touching, derive target coordinates from the scene/DOM adapter, respect reachable distances, use a hand approach and contact stage, and avoid hand penetration. Camera perspective and occlusion are part of acceptance, not just animation math.

## Rehearsal sequence

1. Warm rest → listen to the learner cue → explain a stock step.
2. Turn gaze/head toward the board; point at the highlighted formula; the board updates only from a real allowed action.
3. Interrupt midway with a different target; blend from the current pose. Confirm no double completion event.
4. Play actual audio; pause, resume and stop. Mouth should stop appropriately. Compare viseme-timed speech against amplitude-only baseline and label what is actually implemented.
5. Move between two authored floor anchors with plausible foot contact if locomotion is included. A root sliding across the floor is not accepted as walking.
6. View front, side/three-quarter and facial close-up. Test alternate aspect ratios and keyboard controls.
7. Disable WebGL or remove the model: readable lesson and useful error recovery remain. Reduced-motion mode removes idle sway and travel while retaining a usable static pointing/teaching state.

## Asset acceptance

Preserve editable .blend and export pipeline. Include glTF validator output or equivalent structural checks, model and texture sizes, material count/draw calls, bone/morph/clip names, licence/credit, reproducible checksum and screenshots of the actual exported model. Initial performance budget is a target to measure: model around 5–12 MB, modest texture sizes and a usable scene on a named midrange phone/laptop. Deviations need measurement and a trade-off, not blind fidelity reduction. Avoid adding GPU postprocessing when lighting/material work solves the problem.

Blender control rigs, constraints and Python-driven shapes do not automatically survive glTF export. Bake transforms to deformation bones and export required expressions as supported morphs/bones. Check the actual GLB has finger and face controls. Some reviewed external examples target newer Three revisions than KAIRO r180; check APIs and keep the existing lockfile until explicitly owning a dependency change.

SASL is outside this generic gesture acceptance. It needs language-specific temporal/spatial grammar, appropriate facial expression and review by fluent Deaf SASL experts with licensed material. Keep the hand rig capable, but do not present a wave or a dictionary-sign sequence as sentence translation.
