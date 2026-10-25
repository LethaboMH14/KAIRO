# Engineering interaction contract

This is an implementation specification, not a claim that the interactions already exist. Use a single source of truth: selectedPartId, inspectionMode, explodeProgress, operationPlaying, visualSpeed, guideEnabled, guideState, reducedMotion, qualityLevel and quizAnswer. Retain the actual installed React/Three API versions.

## Scene structure

Metres; Y up; motor shaft axis X. One MotorRoot group owns assembly transforms. Retain individually selectable housing, stator, rotor, shaft, front/rear bearings, front/rear end bells, fan and cover. Rotor and shaft share an operating assembly so they turn together, while their stable semantic IDs remain distinct. Stator and housing remain fixed. Store each group's base position/quaternion/scale before any explosion; slider transforms are derived from these, never accumulated from prior frames.

Human guide, workshop and bench use separate scene subtrees and can be unloaded independently. Derive part focus/label/guide targets from each part's current world bounds so selection remains correct in exploded view. An animated pointing clip without an aiming solution must be staged to point toward the actual motor, not at a random wall.

## Events and expected behaviour

| Learner action | Required result | Failure to avoid |
|---|---|---|
| Select a mesh/list item | same selectedPartId; highlight, fact and focus action update | independent list/scene selections |
| Focus part | camera and controls target use current world bounds | camera targets the assembled position after explosion |
| Drag explosion slider | parts derive positions from base transform + intended offset | drift, detachment of shaft from its rotor, scattered random motion |
| Reverse explosion rapidly | retarget smoothly from current interpolated state | queued animations and jumps |
| Reset assembly | every transform returns to saved base values | tiny per-frame drift that grows on repetition |
| Start operation | assembled rotor+shaft rotate with elapsed time | stator spins or speed depends on frame rate |
| Pause operation | current angle freezes | reset to zero or continued hidden rotation |
| Explode while operating | operation pauses, visible explanation; assembly can be restored | physically impossible running disassembly presented as normal |
| Toggle cutaway | shell hides/clips, visible internals remain selectable | invisible shell intercepts clicks |
| Enable reduced motion | operation paused; camera and explosion snap; captions work | default spinning continues |
| Disable guide | guide mesh/animations disappear; lesson controls remain intact | loss of lesson access or invisible animator keeps rendering |
| Read aloud | user action initiates available browser voice; captions retained | autoplay, fake voice progress or claiming lip sync |
| No WebGL/asset error | readable 2D parts and lesson/quiz are usable | blank canvas or endless uninformative spinner |
| Correct quiz answer | Stator accepted, explanation and completion feedback | ambiguous question where Housing is also valid |
| Invalid frequency/poles | validation, no NaN/Infinity or spurious answer | dividing by zero and showing an invented RPM |

Field-speed checks: f=50,p=4 → 1500 r/min; f=50,p=2 → 3000 r/min; f=60,p=4 → 1800 r/min. Allow only explicit supported even pole counts such as 2,4,6,8 and positive bounded frequency. Reject empty, nonfinite and invalid values before calculation. Label synchronous field speed separately from the slowed illustrative animation and actual rotor speed. This exercise does not validate a motor simulation.

Avatar states: hidden, idle and explaining with a finite return to idle. A listening state requires real input UI, and does not by itself justify a microphone request. Speech-driven mouth animation requires actual rig/audio/timing support; otherwise retain captions and optional audio without a lip-sync claim. No learner camera or microphone access is required by this brief.

## Evidence to hand off

Part ID/mesh manifest, base transforms, camera presets, source and asset licences, actual avatar clips, independent calculation results, assembly reversal check, keyboard/phone/reduced-motion/fallback checks, console observations, build result, measured frame/device details or an explicit unmeasured field. A generated reference screenshot is not proof of any of these. Keep public publishing separate from local implementation.
