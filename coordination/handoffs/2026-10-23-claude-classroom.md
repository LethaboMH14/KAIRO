# Claude classroom, brand master and SASL rights — 23 October 2026

**Owner:** `claude-classroom-20261023-a`, Claude **Opus 5.5** (`claude-opus-5-5`), effort **max**.

**Tasks:**
- BRAND-MASTER-001 (`design/brand-master-20261023`)
- CLASSROOM-STAGE-001: `studio/src/experience/ExperienceClassroom.tsx` and `experience.css` for integration only; new `studio/src/experience/stage`, `studio/src/experience/brand`, `studio/tests/experience-stage.test.mjs`, `docs/blueprint/claude-review/experience` and this handoff
- SASL-RIGHTS-001 (`docs/blueprint/claude-review/sasl`), research and design only

**Untouched:**
- `session.ts`, fonts, TeacherProvider, StudioRouter
- every `character/*` file, including `types.ts` v1 and the Rain GLB (SHA-256 `5c3aacb1…ee6af`, rechecked)
- package manifests and lockfiles, and the preview prototype

## Delivered

1. **Brand master** ([README](../../design/brand-master-20261023/README.md), [gallery](../../design/brand-master-20261023/index.html)).
   - The selected C symbol and wordmark were fitted as editable, font-free outlines from the user's reference. Symbol mean edge error is 0.72 px; wordmark 0.14 px.
   - Measurement found that both inner terminals are cut parallel to the lower leg. The free fit put the cuts at 26.4° and 27.0° against the leg's 25.9°.
   - The master holds its two strokes and open counter only at 32 px and above, so a measured **micro mark** covers smaller sizes.
   - Lockups (stacked, horizontal, horizontal-micro), mono, reversed, vector PDFs, app icon and favicon.
   - Applied phone, document, presentation and pattern mockups; the Rain badge.
   - Contrast table and provenance.
2. **`/classroom` stage** (`stage/ClassroomStage.tsx`). One branded teaching room:
   - Rain, through the unchanged v1 `TeacherCharacter`.
   - A written moss board with a record strip and the authored working lines.
   - The notebook shelf the lesson counts.
   - Authored room, board and teacher framings, with no wheel or orbit capture.
   - Quality tiers that start from device hints and Save-Data, then step down only on sustained slow frames while focused and visible; plus a learner "Lighter 3D" choice. Rendering stops off-screen.
   - **One audio clock:** the existing provider signal ref drives the mouth; nothing here plays audio.
3. **Expressions and choreography** (`stage/direction.ts`, `stage/writing.ts`):
   - A number explanation points at that exact token, or at the shelf for the observed 22, and rings it on the board.
   - Speech keeps the point.
   - "I'm stuck" gives a calm acknowledging nod, faces the learner, rings the line and puts the smaller step in the caption.
   - A correct answer gets a nod; a wrong answer points at the 20.
   - A new step runs **reach → write when the fingertip lands (or after 0.9 s) → present the result → return**. This is not word-timed, and the page says so.
   - Reduced motion keeps one view and writes instantly.
4. **Rain's shirt badge** (`stage/shirtBadge.ts`, `badgeMesh.ts`, `rainBadge.json`).
   - The GLB's chest UVs are degenerate, so the master outline is triangulated onto a measured bind-pose chest patch, with skin weights from the shirt (the area is 57% `clavicle_l`).
   - It is opaque, crisp and deforms with the fabric. The GLB is unchanged, and the patch is pinned to the GLB's SHA-256 by a test.
5. **Shell brand:** the sidebar uses the outlined lockup (`brand/KairoMark.tsx`), switching to the micro art below 32 px.
6. **Review** ([REVIEW.md](../../docs/blueprint/claude-review/experience/REVIEW.md)): 11 fixes with before-evidence and 8 owner recommendations by screen ID (R1–R8).
7. **SASL** ([RIGHTS.md](../../docs/blueprint/claude-review/sasl/RIGHTS.md), [CAPTURE-DESIGN.md](../../docs/blueprint/claude-review/sasl/CAPTURE-DESIGN.md)).
   - Primary-checked rights table. No permitted, annotated SASL training video was found; the HF Hub has nothing under `sfs`.
   - MediaPipe hand, pose and face model cards are Apache-2.0, for AR and gesture use only.
   - The default gesture classes include ASL `ILoveYou`.
   - POPIA s26 lists biometric information.
   - A tracking-only camera lifecycle design, plus the separated recognition / confirmation / translation contracts `kairo-signing/0.1`.

## Published interface: `classroom-board/1`

This is a stable contract for any adapter (for example the session director, or source lessons later).

- **Board:** world `BOARD = {centre:[0.7,1.33,0.06], yaw:-0.85, width:1.04, height:0.68}`. Rain stands at the origin facing +Z, so +X is her left.
- **Anchor IDs:**
  - `record-20`, `record-12`, `record-9`, `record-22`
  - `work-<step>-<value>` for each number in a written line (for example `work-1-32`)
  - `line-<step>` for a line's left edge
  - `shelf` for the notebook stacks
- **Pure functions** (`stage/board.ts`): `boardNumbers(step)`, `boardAnchorFor(value, step)`, `pointAnchorFor(value, step)`, `resultAnchor(step)`, `targetsFor(rects)`. Working lines are derived from `session.ts` formulas.
- **Stage directions** (`stage/direction.ts`):
  - `direct(LessonEvent, seq) → StageDirection {id, pose, point, highlight, expression, framing, interrupts}`
  - `speaking(prev, isSpeaking, seq)`
  - `framingFor(direction, writing, reducedMotion)`
  - Events: `enter | explain | step | stuck | question | answer`.
  - `interrupts:false` (step and speech) never cuts the board writing short.

A future shared session director can call `direct()` with these events instead of the page doing it. Changes to these IDs need a versioned proposal.

## Checks (actual)

- `node --test tests/experience-stage.test.mjs`: **9/9**.
- Whole `npm test` on the final code: **261/262**. The one failure is `tests/narration-cancellation.test.mjs:130`, "failed cloud resume…", from the active NARRATION-CANCEL-TESTS-001 (Codex/Luna, file written 04:10). It tests the untouched TeacherProvider, and its own record `docs/checks/luna-narration-cancellation-20261023.txt` reports the same 12/13. It is not caused by this package. An earlier run before that test existed: 249/249.
- `npx tsc -b`: exit 0. `npm run build`: passed (2,240 modules). `ClassroomStage` is 23.60 kB (9.92 kB gzip) and `ExperienceClassroom` 24.97 kB (9.44 kB gzip).
- **CLASSROOM-STAGE-001B** was made minutes after the release and then claimed to record it. The cue after the board writing now carries `-after-<seq>`, because the character ignores a re-used, finished cue ID and Rain would otherwise keep her pre-step posture. Re-checked: experience tests 12/12, `tsc` 0, build passed.
- **In-browser inspection** in the built-in pane, using deterministic stepped frames because the app window kept stopping drawing. Captures are in `docs/blueprint/claude-review/experience/qa/`.
  - Contact point on the "12", ray point to the shelf, writing and presentation.
  - Final room framing with the badge, and the final stuck close-up.
  - No console errors, Full tier, about 45 draw calls and about 230k triangles in the close-up.
- **Two bugs found and fixed:**
  - False Full → Light downgrades caused by throttled or occluded frames.
  - The alpha-textured badge vanishing after reloads, now replaced by an opaque mesh.
- Brand fidelity, round-trip and small-size topology are recorded in JSON.

QA tooling note: a QA-only local receiver (127.0.0.1:47811, scratchpad) saved canvas captures, and was stopped afterwards. No headless browser, CDP, cloud call, paid generation, deployment or install. Two official MediaPipe model-card PDFs (1.4 MB and 3.5 MB) were fetched to scratchpad to read their licence lines. Nothing was executed.

## Limits

- Not tested: real audio with the mouth, phones and tablets, screen readers, keyboard-only at 200% zoom, named low-end GPUs.
- Tier thresholds are switching rules, not performance claims.
- The brand master awaits **user acceptance**, plus trademark, print and embroidery checks.
- No Deaf co-design or review happened, and none is simulated. The SASL "not ready" states stay as they were.
- The sidebar nav and the preview are unchanged (see R4, R7).

## Next and dependencies

- **Codex (session/router):**
  - R1: a 4th "compare with the shelf" step in `session.ts` (the board already supports it).
  - R3: a shorter first visit. R4: a Studios hub. R5: teacher-movement setting → reduced motion.
  - Acknowledge or reject `kairo-signing/0.1` before any signing adapter.
  - SOURCE-RAIN-001 handoff read (messages 45–47). Its neutral `RainStage` could later reuse `direction.ts` and the badge under a new explicit agreement; nothing was changed in `source-classroom`.
- **Preview owner:**
  - R2 and R6–R8: board anchors, signed-language copy, master SVGs, `aria-hidden` on the listening glyphs.
- **Claude next:**
  - SASL-CAPTURE-001 (tracking only) after a `studio/package.json` and lockfile claim, a pinned tasks-vision version and model hashes.
  - User review of the brand master.
  - Device measurements for the tiers.
