# Independent review: C identity, the seven journeys and `/classroom`

**Reviewer:** Claude (`claude-classroom-20261023-a`, Opus 5.5, effort max). **Date:** 23 October 2026.

**Scope:**
- the [selected reference](../../../../design/app-experience-20261023/assets/brand-reference.png)
- the [112-state preview](../../../../design/app-experience-20261023/index.html) with its [screen contract](../../../../design/app-experience-20261023/screen-contract.json) and [SCREEN-SPEC](../../experience/SCREEN-SPEC.md)
- `/classroom` as delivered by EXPERIENCE-INTEGRATE-002

The `F` items were fixed in CLASSROOM-STAGE-001 and BRAND-MASTER-001. The `R` items are recommendations for their owners. Nothing here was edited outside my claims.

## Fixed in this package

| # | Screen | Evidence (before) | Change |
|---|---|---|---|
| F1 | `lesson`, `lesson-answer` | Every number point used one target: `setCue({…type,targetId:'formula'…})` in the former `ExperienceClassroom.tsx`. Asking about 22 (the shelf count) pointed at `20 + 12 = 32`, so the gesture contradicted the caption. | Per-number anchors (`classroom-board/1`). Rain points at the token she explains, and the observed 22 is the notebook shelf itself (`stage/board.ts → pointAnchorFor`). |
| F2 | `lesson` | Two lesson texts. The board drew `BOARD_STEPS` from `character/lesson.ts:17-21` ("A delivery arrives"…), while the chapters used `session.ts` ("Add the delivery"…). The 12, 9 and 22 never appeared as pointable record values. | The board is derived from `session.ts` formulas, plus a fixed record strip (Opening 20 · Delivery 12 · Sales 9 · Shelf count 22). A test asserts the formulas match the lesson. |
| F3 | `lesson` | The board canvas asked for `Manrope` and `DM Sans` (`RehearsalStage.tsx:108,112,120,129,133`), but the route registers the face as `KairoManrope`, so the board fell back to Arial. It also drew before the font loaded. | The board waits for `document.fonts.load('… KairoManrope')` and then redraws. |
| F4 | `lesson-question` ("Choose a number…") | `[20,12,32,9,23,22]` was offered at step 1, giving away 32 and 23 before they are calculated. | `boardNumbers(step)` offers only values already on the board (tested). |
| F5 | `lesson` | Free `OrbitControls` with wheel zoom inside a scrolling page (`RehearsalStage.tsx:289`): the wheel zoomed the room instead of scrolling, and orbiting could lose the board. | Three authored framings (room, board, teacher). No wheel capture. Reduced motion keeps one fixed view. |
| F6 | `lesson` on phones, `studio-unavailable` | One heavy setting: dpr up to 1.75, a 2048 shadow map, a 1.6 MB HDRI, and a rehearsal probe writing `window.__kairoCharacterPerf` (`RehearsalStage.tsx:89`). | Tiers (`stage/quality.ts`): start from device hints and Save-Data, step down only on sustained measured slow frames (stalls ignored), with a learner "Lighter 3D" choice. Rendering stops while off-screen. |
| F7 | `lesson`, `lesson-hint`, `lesson-feedback` | Expression only followed typing or a response. `acknowledge` was never used. "I'm stuck" set `listen`. | Event-mapped (`stage/direction.ts`). Stuck becomes acknowledge + encouraging + teacher framing + line highlight. A correct answer becomes acknowledge. A wrong answer becomes pointing at the 20. Writing uses `focused`. Speech keeps the current point. |
| F8 | `lesson` | No board choreography: the step changed by swapping the texture. | Writing sequence (`stage/writing.ts`): reach the line, write it once the fingertip lands (or after 0.9 s), present the result, return. It is **not word-timed**, and the page says so. |
| F9 | `lesson-answer`, `lesson-hint` | Explanations rendered in the lower card, below the fold. | They render in the caption under the room, in both 3D and reading views, and **Read aloud** reads them. |
| F10 | all shell screens | The mark was a layout reconstruction, next to live Manrope "KAIRO" text. | Outlined master lockup, switching to the micro symbol below the measured 32 px. |
| F11 | brand (shirt) | No badge, as BRAND-DECISION asks. | A runtime skinned chalk badge that deforms with the shirt. The GLB is unchanged, and the badge is pinned to its SHA-256 by a test. |

## Recommendations for their owners

| # | Screen | Observation | Suggested change | Owner |
|---|---|---|---|---|
| R1 | `lesson` (preview) | The preview has 4 chapters ("…Check the count", "Step 2 of 4"). The live lesson has 3 steps and ends at 23. The comparison 23 vs 22 has no step of its own. | Add a 4th authored step, "Compare with the shelf", in `session.ts`. The board and anchors already show 22, so the stage needs no change. | Codex (session) |
| R2 | `lesson-question` (preview) | Only 32 and 23 are anchored on the preview board. | Show the record values plus the written tokens, as live. | Preview owner |
| R3 | First visit | 13 states before `home` (welcome → access → signup → verify → 7 setup → ready). | Merge `setup-study` with `setup-modules`, and `setup-language` with `setup-access`. Make `setup-profile` and `setup-teacher` "later" by default. This gives about 9 states. | Codex (journeys) |
| R4 | Shell nav | The **Studios** item opens `/lecture` (the Lecture Theatre), and the classroom is reachable only through "Learn with Rain". | Add a Studios hub (preview `studios`) listing Classroom, Engineering and CS. | Codex (router) |
| R5 | `settings-teacher`, `setup-teacher` | "Teacher movements: pointing and gaze follow the lesson" has no live control. | Map "off" to reduced motion. With it on, the stage already keeps one framing and writes instantly. | Codex (settings) |
| R6 | `signed-language` | The copy is right, but the screen does not show the two directions the live panel explains. | Mirror the panel: sign → confirmed text → speech, and speech → transcript → reviewed clip. Keep both disabled until the gates in [sasl/RIGHTS.md](../sasl/RIGHTS.md) are met. | Preview owner |
| R7 | Preview brand | `app.js`/`app.css` still draw the layout reconstruction. | Swap in `design/brand-master-20261023/master/*.svg`, using the micro mark under 32 px. | Preview owner |
| R8 | `lesson-listening` | The listening animation (`│ ▏┃ ▎│ ▍│`) is decorative text that a screen reader will read aloud. | Mark it `aria-hidden` and announce "Listening" once. | Preview owner |

## Identity check

The selected C, as measured in [design/brand-master-20261023](../../../../design/brand-master-20261023/README.md):

- **Two constant-width strokes.** The two inner terminals are cut parallel to the lower leg, found in both renderings.
- **Geometric wordmark.** It includes the crossbar-less A, which keeps its optical corrections.

The fitted master is within 0.72 px mean (symbol) and 0.14 px mean (wordmark) of the reference at its native size. The master loses its gaps below a 32 px symbol, which is why a micro mark exists.

## Not reviewed or not verified

- Pages were not tested with assistive technology.
- No phone hardware or real audio was tested.
- No learner, educator or Deaf reviewer was involved.
- The preview's 112 states were read through the spec and code, and spot-checked by journey, not individually re-rendered.
