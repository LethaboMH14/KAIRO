# KAIRO action menu, teacher continuity, and motion contract

| Field | Value |
|---|---|
| Prepared | 26 October 2026 |
| Owner/settings | Codex `codex-luna-kairo-action-motion-20261026-a`, gpt-6-luna / low |
| Source base | `origin/main` `c4b9ab22900bb37d573eaa6c29cb6d3e91a76813` |
| Scope | Design/research only; no runtime, model, asset, dependency, route, provider, or UI source edits |
| Status | Proposal, not implementation, classroom art direction, or accessibility acceptance |

## Goal and criteria

**Learner need:** invite KAIRO into the task the learner is doing without forcing a full-screen chat, repeating long explanations, losing the source context, or making unsupported body/AI gestures look real. The same KAIRO voice and controls should follow a lesson into a prepared studio and back to practice/evidence.

**Judging criteria:** Product (source/task continuity), Usability (one clear action, non-blocking controls, accessible alternatives), Creativity (context-grounded teaching with purposeful embodied cues), Presentation (recognizable teacher and classroom), Sustainability (reusable shared action/state contract). No learning gain or intelligence quality is claimed.

**Acceptance for this research deliverable:** current rig files/clips/cue interface are identified from source and local GLB metadata; all page-context actions are gated by available source/lesson state; six motion proposals include timing targets and reduced-motion equivalents; UI/provider completion, cancellation, error, and unsupported states are explicit; official Rive/Motion/Three.js/R3F documentation is linked.

## Current implementation evidence and hard boundaries

Read at source base `c4b9ab2`:

- `studio/src/character/rig.ts` defines five KAIRO rig clips: `Idle`, `Listen`, `Explain`, `Acknowledge`, and `HandPoint`. `kairo-teacher.glb` metadata was read locally: it contains five animation entries with those exact names. The file's credits attribute it to the Rain rig provenance (Blender Foundation, CC BY 4.0), with KAIRO-authored face/figure/clothing changes and teaching animations; preserve that credit.
- `studio/src/character/TeacherCharacter.tsx` crossfades supported posture clips; `point` uses a real target, hand-point pose and two-bone IK. `move` is explicitly unsupported (`locomotion-not-delivered`). A missing point target or missing arms returns an `unsupported` cue result. Do not script walking or free-form pointing as already available.
- `studio/src/character/types.ts` exposes `idle | listen | explain | acknowledge | point | move`, targets, expressions, reduced-motion input and audio/viseme input. `studio/src/character/cues.ts` defines accepted → acting → terminal cue state, with `completed`, `interrupted`, or `unsupported` terminal outcomes.
- `studio/src/character/lesson.ts` has a target called `learner-work` labeled “the learner’s tablet”; it is a scene-space pointing target at the desk. It is **not** a tablet-holding pose, a seated pose, or a tablet clip. No current seated/tablet-hold/write-on-board clip was found in the rig's five animation names. A tablet pose requires new authored/validated motion and likely a suitable prop/seat setup.
- `studio/src/experience/stage/ClassroomStage.tsx` and `studio/src/source-classroom/RainStage.tsx` use `TeacherCharacter`; classroom cue target positions and a prepared board are supported. `studio/src/learning-flow/StudioCompanion.tsx` provides context and uses the shared TeacherProvider narration. `studio/src/teacher/TeacherProvider.tsx` owns voice settings, narration, caption, pause/stop and the global narration dock inside the router provider. This is a continuity foundation, not evidence that every route renders the same animated figure or offers the same action menu.
- `studio/src/avatar/AvatarStage.tsx` is explicitly a rehearsal stage using `studio/src/avatar/TeacherAvatar.tsx` and `/models/teacher/teacher.glb`; its own copy calls it a first working rig and says the chosen cinematic character is still to be art-directed. Do not present this separate MakeHuman/MPFB rehearsal avatar as proof that the selected KAIRO character is already integrated everywhere.
- `studio/src/lecture/LectureStudio.tsx` already has a prepared lecture, scene/reading switch, chapter controls, captions and browser narration, but is a separately authored experience; this brief proposes continuity and does not claim it is already the same lesson narrator/session in every case.

Existing controller details should be preserved: one teacher name (KAIRO), one selected voice preference, captions/readable content, explicit pause/stop, and consistent “what context is in use” wording. Ordinary gestures are not SASL; no action choice means microphone/camera is opened. Never animate “thinking” as evidence of model reasoning, render user mastery/score as a character emotion, or use a gesture that suggests the model sees a source/selection it did not receive.

## Proposed KAIRO invocation and task/scope menu

Use a small, visible **Ask KAIRO** / **Teach with KAIRO** button close to the active lesson or work area. The press opens a menu with two distinct decisions:

1. **Action:** `Teach this`, `Give a short lecture`, `Explain`, `Test my understanding`, or `Another task…`.
2. **Scope:** `Selected part`, `This passage`, `This topic`, or `Whole lesson`.

Show the chosen scope and the exact source/lesson/scene anchor in a compact line before execution, e.g. “KAIRO will use: *Motor speed*, reviewed lesson revision 3, chapter ‘Poles and frequency’.” Let the learner change scope before sending. If selection is unavailable, do not quietly broaden: disable `Selected part` with a short instruction or ask the learner to select a part. If the lesson/source is stale or not yet reviewed, disable source-grounded generation and offer review/reopen. On routes without a linked lesson, show “No lesson is linked. Choose a lesson for source-grounded help.”

“Another task…” opens a short, optional instruction field with length bound and a visible context summary. It remains a learner request, not permission to operate machinery, access the camera, alter a record, apply to an opportunity, or publish CV facts. Keep generated/editable output separate from the source and require explicit learner actions to save or apply it.

### Scope contract

| Scope | Required context before an action is available | What to send / show | Safe fallback |
|---|---|---|---|
| Selected part | A user-selected block, passage, step, variable, or requirement that the route can identify. For source content, also source ID, current reviewed revision and locator. | Selection title + source/revision/locator; scene target ID and current variable values only when applicable. | Ask the learner to select a part. Never substitute a guessed/nearby item. |
| This passage | A single cited lesson/source passage and its locator. | Exact cited excerpt and source/revision anchor, plus only the short optional learner question. | Open the cited reading view; if excerpt/revision is unavailable, explain why. |
| This topic | A learner-named topic bounded to the selected reviewed material, chapter, role requirement source or prepared activity. | Topic label, relevant selected sources/revisions, and anchor list. State when the topic is broader than available evidence. | Offer reading/navigation; no unanchored confident claim. |
| Whole lesson | A current lesson ID, current reviewed source revisions, and lesson objective/chapter outline. Practice results or personal notes are excluded unless separately disclosed and selected. | Lesson title/objective, chapter scope, source anchors, and a small stated subset of learner-selected attempt context if requested. | Reopen/review the lesson. Never silently include all account material or all previous conversations. |

The scope selector is a filter on a user's teaching request; it is not a permission boundary or model guarantee. For cloud-backed explain/test/other tasks, retain the existing explicit, nearby consent and provider-availability checks. Show the selected service before the request where that is current app policy. With consent off, AI unavailable, network lost, or request cancelled, keep source reading, prepared local explanations, and controls in place. Honor saved voice/caption/reduced-motion preferences, but state exactly which preferences/context are sent to a cloud service. Never infer a preferred learning style or ability.

### Per-route availability matrix

“Teach” and “lecture” can mean a prepared lesson sequence or an explicitly requested explanation with narration. They must not claim an authored lesson exists when it does not. Scope options unavailable for a route must be visibly disabled with a one-line reason.

| Page/work area | Useful actions | Scope choices | Context or guard |
|---|---|---|---|
| Home / modules | Help me choose a starting point; explain a module; open material | Topic (module title/reference); whole prepared lesson only when linked | Do not invent material, current grades or learning status. If profile is synthetic, keep that label in view. |
| My material / extraction review | Explain selected text; teach from reviewed source; another question | Selected part, passage, topic; whole lesson only after a lesson exists | A file is not yet a reviewed lesson. Distinguish original/revision and extraction coverage; no provider call until consent. |
| Multi-source lesson builder | Explain a selected source; create a teaching plan; test after lesson exists | Selected part/passage/topic; whole lesson after creation | Only selected, reviewed sources; show source set and provider/context before cloud request. Local reading mode remains available. |
| Lesson reader / editor / classroom | Teach, short lecture, explain, test, another task | All four scopes where selection and citations exist | Whole lesson means the shown revision, not unrelated lessons. Any edited learning copy keeps its citations/revision semantics visible. |
| Engineering / pump / computer science studio | Explain part/variable/step; teach/lecture linked principle; test if lesson activity has a real task | Selected part/variable, current topic; whole lesson only with current linked lesson; passage only via an actual citation | Show observed vs authored/calculated values and their sources. No equipment command, verified measurement, camera access, or uploaded-source-to-simulation claim. |
| Lecture theatre | Teach/lecture current chapter; explain board item; test the chapter prompt | Selected chapter/board step; topic; whole prepared lesson | Chapter controls, captions, reading alternative and narration state stay synchronized. A sequence timeout is not a service request. |
| Practice / cases | Explain current decision/source principle; test by continuing the authored task; other question | Current step/evidence item; current scenario; full task | Keep “formative simulation” language. Do not grade reflection quality or assert employer competence. |
| My work / evidence / saved reading / progress | Explain what a record means; resume its lesson; read a saved passage | Selected record/passage; current lesson/topic | Name storage owner, timestamp and source revision. No “teach/test” against evidence records by implying a mastery score. |
| My direction / pathways / funding | Explain one official requirement, source or status; suggest a learner-chosen lesson goal | Selected requirement/source; topic. Whole lesson only after goal links to an existing lesson. | Availability can remain unknown; suggested projects remain KAIRO-authored. No employer match score or eligibility verdict. |
| CV draft | Explain a selected requirement; help edit wording after learner supplies facts; another task | Selected role requirement, selected draft section; topic | Ask before sending personal content; do not invent, autofill or certify experience. Offer local/plain-text path. |
| Account / settings / teacher preferences / institutional info | Explain this setting or page; another task | Current setting/page; no private lesson scope unless user chooses it | No capture or submission. Keep privacy and voice/language controls usable without an AI call. |

## Teacher and classroom forms

These are composition proposals, not current asset variants:

- **Modern whiteboard classroom (main lesson/lecture):** a bright, calm, contemporary room; a large readable board is the teaching focus and stays synchronized with chapter text. Put KAIRO standing at the board edge, never covering text. Use a one-column reading/board equivalent on mobile. Let learner select a board step; do not auto-orbit the camera or make gaze the only navigation. Existing classroom scene and board code can inform the layout, but a new visual direction is not approved by this research.
- **Standing studio teacher:** the current KAIRO rig and purposeful point target can work next to a prepared motor/pump scene. Keep KAIRO small enough not to obscure values, connectors or controls; offer “hide 3D teacher” while captions and shared narration controls remain. Current studio companions include portrait/guide panels; don't imply the avatar is moving through or touching machinery.
- **Seated/tablet classroom:** only as a new art/rig/clip project. The current target at `learner-work` is a point target at a desk/tablet location, not an existing tablet clip. Create a suitable seat/tablet prop, pose, contact constraints and animation, keep hands clear of editable UI, then review the clip in scene and reduced-motion modes before describing it as delivered. No new tablet asset is assumed here.
- **Compact reading dock:** a small persistent KAIRO mark/portrait plus current action, caption and play/pause/stop, visually separate from selected passage text. It must not cover a selection, locator, form field, browser bottom controls, or quiz. A static portrait/mark is enough when speech is stopped; do not loop subtle motion just to make the dock feel alive.
- **Mini helper on source/career pages:** a small labeled button opens a short nonmodal panel adjacent to source or role detail. It retains the current form draft and scroll position, names the context it sees, and closes back to the same focus. On CV it must not write into a factual field unless the learner reviews and applies the suggestion.

The posture is responsive composition, not five different character identities or voices. Keep body movement to the same supported KAIRO model; adjust camera framing and UI panels, not character identity. When screen space is small, show one caption line and a button to open the full panel; do not shrink reading text or put explanation solely in speech.

## Six purposeful motion beats

Timings below are **design targets for a later prototype**, not measured durations of existing clips. Test with the actual target device and with reduced motion before acceptance. Service state and body animation are independent: a service timeout must not hold a fake “thinking” pose.

| Beat | Trigger and proposed motion | Target timing | Reduced-motion / no-3D equivalent |
|---|---|---|---|
| 1. Invite and orient | Button opens the menu; use a brief surface opacity transition. KAIRO may use the existing one-shot Acknowledge clip if it feels natural and the clip ends cleanly. No camera push required. | UI 160–220 ms; clip duration follows authored asset, not stretched to the menu. | Menu appears immediately; no autoplay character movement. |
| 2. Mark the chosen scope | Highlight the selected passage/step/requirement in the document or scene and show its label in the context strip. Do not animate a finger at plain DOM text unless there is a stable real 3D target. | Highlight 180–260 ms; stable thereafter. | Immediate outline/color plus text label and focus state. |
| 3. Attend to the learner | For an actual voice-capture session only, transition into Listen after permission and visible recording state. For typed input use a neutral ready state, not a “listening” pose. | Posture transition target 300–450 ms; hold only while input is actually active. | Show “Ready” or “Recording” status and waveform only from actual input; static posture. |
| 4. Explain or lecture | On user action, use Explain and read the same visible/captioned explanation. Tie mouth movement to actual audio/visemes where available; do not fabricate lip timing while text loads. | Transition target 300–450 ms; speech duration from actual audio/text. | No auto speech; show text and a deliberate Read button. Avoid spatial camera movement. |
| 5. Point to the cited idea | Use a real scene target and the existing point IK, or highlight the cited passage/variable in 2D. Keep the marker/citation visible so the gesture is understandable. | Transition target 350–550 ms; hold while the point is relevant, then leave on learner action. | Static highlighted anchor + locator and plain text. Avoid a tiny rapidly pulsing target. |
| 6. Hand the task back | Stop/finish narration, return to Idle, preserve the highlighted source and caption, and expose one next action (continue, try, save). Acknowledge only a real completed action, never inferred mastery. | Return target 300–450 ms. | Immediate state change, persistent text and explicit next-action button. |

For loading, use only truthful states: `Preparing KAIRO…` while the model asset is loading; `Sending your selected passage…` after an AI request actually starts; `Waiting for audio…` only during speech startup. If provider duration is unmeasured, show elapsed/indeterminate progress rather than a made-up percent or a choreographed thinking loop. Show **Stop waiting** only while work is cancellable at the client; after cancellation, say if already-sent provider work might still finish. On error offer retry/continue reading without clearing selection or unsaved fields.

## Shared UI state and failure semantics

Proposed component contract:

```text
closed
  → action-menu
  → scope-selection
  → context-review
  → ready-to-send (or local-ready)
  → waiting (visible actual task/status; Stop waiting where supported)
  → result / narration-playing / paused
  → complete | cancelled | unavailable | error
```

- Keep action/scope selection, request state, teacher posture and narration as separate state dimensions. A provider status change cannot silently replace the current source or generated explanation.
- On a new action, cancel narration and interrupt the previous pose only as needed. `CueLedger` terminal outcomes remain observable. Do not announce a cue `completed` because the AI request succeeded; those are separate lifecycles.
- Keep source/language/provider consent as explicit gates. For no-AI, hide nothing: offer prepared text, local reading/practice, or a clear “AI help isn't available here” explanation. Avoid sending private material from an auto-opened menu.
- Keep the keyboard focus on the invoking control on close; after sending, announce `role=status` text and return focus to the result/heading only when that move is deliberate. Escape closes menus and popovers but should not discard a form draft or cancel cloud work without a clear action.
- On phone use a bottom sheet or inline expansion; preserve scroll position and keep the active source/selection on screen. Do not place a floating teacher over quiz choices, upload forms, CV fields, or final buttons. Voice/captions/reading stay reachable at 200% zoom.
- Pointing, gaze, expression and pose are decorative cues to a known UI state, not input, prediction or a confidence signal. Never use smile/celebration to signal correctness when there is no checked criterion.

## Official animation references (accessed 26 October 2026)

- [Rive feature overview](https://rive.app/features): authoring system supports state-machine states/transitions, listener-driven interactions, blend states, reusable components, responsive layouts and data binding. It is a **candidate pattern** for state-based helper visuals, not an installed dependency or approved runtime change. Rive has frequent API/runtime updates; [its August 2026 runtime notice](https://community.rive.app/c/announcements/rive-runtime-updates-august-31-2026) documents deprecated web/react state-machine input APIs and focus/lifecycle changes. Pin and re-check current docs before any future implementation.
- [Motion `useReducedMotion`](https://motion.dev/docs/react-use-reduced-motion) returns and responds to the user's reduced-motion preference, with examples like replacing spatial movement and disabling autoplay. [Motion accessibility guide](https://motion.dev/docs/react-accessibility) describes global and per-component adaptation. Transfer: preference is a real behavior branch, not a speed slider alone.
- [Three.js animation manual](https://threejs.org/manual/pages/animation-system.html), [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer), and [AnimationAction](https://threejs.org/docs/pages/AnimationAction.html) describe named clips, playback, repeat/once and crossfade. Transfer: use explicit finite cue/state transitions and clean up actions; the current TeacherCharacter already uses a mixer and fade logic.
- [React Three Fiber events](https://r3f.docs.pmnd.rs/api/events) describes pointer raycasting/capture and propagation. Transfer: pointer interaction on a 3D board is not an accessible replacement for DOM controls, keyboard labels and focus.
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) describes demand rendering plus explicit invalidation for occasional changes. Transfer: only consider it for static scenes; the current teacher has procedural springs/gaze/face work each frame, so changing the render loop requires a separate performance/visual regression study.

These are primary vendor/library docs, retrieved 26 October 2026. They support implementation patterns, not a claim of lower latency, measured accessibility, or learner benefit.

## Future acceptance slice

Prototype only two connected places first: selected cited passage in the lesson reader → source-linked studio panel. Check these behaviors before broad rollout:

1. learner invokes KAIRO, selects `Explain` + `This passage`, sees the exact current source/revision/locator and consent, then gets a response with visible citation and matching caption/read controls;
2. learner follows an action into a motor/pump studio, sees the linked lesson/context and values actually sent, asks about one selected variable, stops/cancels safely and returns to the same lesson;
3. no-AI, stale source, no 3D, voice unavailable, reduced motion and 320px/200% zoom all retain a reachable reading path and the same saved work;
4. keyboard-only traversal can open/close the menu, change action/scope, review context, cancel, use caption/read controls, and resume the form at its prior focus;
5. a domain/language reviewer confirms that names, captions, pronunciation/translation and action text are appropriate; animation is not used as SASL.

Automated state tests, actual browser/device checks, adult learner usability evaluation, frame-time measurement, language review, and asset review are all still future evidence. No model/voice/SASL, teacher authorship, prediction, or efficacy claim is granted by this design contract.
