# Paste into Claude Design

Build a working interactive prototype for **KAIRO Access — Engineering Studio: Inside an Electric Motor**. KAIRO is a South African experiential learning platform. Learners inspect, manipulate, question and demonstrate understanding. The product has one shared intelligence platform and several distinct studio environments. Computer Science Studio exists; Codex is building Lecture Theatre. Your assigned studio is Engineering.

Make the motor the hero: a detailed, believable multipart machine with brushed metal housing, copper windings, rotor, shaft, bearings and an inspection bench. Use graphite #263b43, copper #b7794f, porcelain #e8e9e4, mint #75baa6 and restrained azure #428bc9. Keep polished camera movement and legible, quiet controls. Avoid an abstract glowing orb, generic dashboard cards, a flat picture pretending to be 3D, or a decorative scene without functioning controls.

Required working interactions:

1. Orbit and inspect the motor from multiple views.
2. Select a part by clicking it or using a keyboard-accessible part list. Highlight it, explain its role, and focus the camera.
3. Smoothly separate/reassemble the parts with an exploded-view control. Use stable part names and intentional pivots.
4. Switch between an exterior view, exposed internals and a conceptual operating demonstration.
5. Let the learner adjust an illustrative rotation-speed control and observe the rotor; label this as visual playback speed, not a prediction of real motor RPM.
6. Include one independently testable educational calculation: for a separately labelled DC resistive load, show I = V/R and P = VI with positive bounded V and R, units and an explicit note that this is not a complete electric-motor model. Do not equate that calculation with motor behaviour. Alternatively omit calculations until a validated motor model is supplied; explain the boundary.
7. A short question with real feedback, plus reduced-motion and a useful 2D alternative.

Tools: use Three.js or React Three Fiber if supported by your current Design runtime. Existing licensed multipart assets are preferred. Blender is available to the implementation agent; Blender Python can author missing geometry. Thrixel/Meshy are optional candidates only if already connected and approved; do not sign up, spend money or assume a generation API exists. Record every asset's author, source and licence. A beautiful generated image may guide style but cannot replace an actual interactive model.

Show working desktop and phone states, part-selection, exploded and reduced-motion states. If your runtime cannot implement real 3D, state that explicitly and produce the interaction design plus a concrete code/asset handoff. Do not claim rendering, simulation, speech, AI chat or cloud integration that is not actually connected.

Export an editable HTML/project bundle, assets and a concise handoff. Preserve source, stable object IDs, scene hierarchy, camera positions, animation timings and technical limitations. Keep prototype content free of credentials and learner data. Do not publish publicly.

Implementation target: React/TypeScript, Three.js/R3F/Drei already installed. A future `EngineeringStudio.tsx` module will receive `{ onExit: () => void }` and use scoped `.engineering-studio` CSS. It must not replace the KAIRO shell, router, existing studios or shared backend. The local integration owner is Codex.

Use your current available model; record its actual name and effort if exposed. Do not invent settings. Work carefully, refine against the brief, and prioritize functional interaction over the number of screens.
