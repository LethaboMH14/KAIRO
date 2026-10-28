# Plan: KAIRO post-submission wave 1 — make the shipped journey correct and simple
_Round 2 — revised by Claude after Codex rounds 1–2 (see PLAN-REVIEW-LOG.md)_

## Goal
Fix the defects in `docs/improve-loop-20261028/AUDIT.md` so a first-time engineering learner can go Home → My material → lesson → studio → My work without wrong-programme content, false error states, jargon, or stacked navigation. No new features. Wave 2 (UI language switch, voice conversation) is planned only after wave 1 lands and is re-audited.

Base: branch `claude/improve-loop-20261028` from `codex/midnight-submission-20261026` @ 49af96c (the submitted code; `main` lacks it). Worktree `C:\Users\USER\Desktop\kairo-improve-loop`. Implementers: Haiku 5.5 / GPT-6 Luna (low–medium). Reviewer: Sonnet 5.5 / GPT-6.1 Terra. Planner/arbiter: Opus 5.5.

## Shared contract (exists — no new interface)
Cohort = `useStudentSpace()` from `studio/src/student-space/StudentSpace.tsx` → `{loading, error, space}`; `space.cohort` is `'engineering' | 'informatics' | string`. Rules for every consumer: **loading** → keep the page's current loading state; **error or `space===null` or unknown cohort** → current (pre-wave) behaviour unchanged; **engineering** → engineering defaults. No lane edits `StudentSpace.tsx` except L1's heading line (the hook and `Space` type are frozen this wave).

## Claims and wave split
Bus claims are repository-relative and checked on the canonical bus. Stale active claims from 26 Oct (`SUBMISSION-INTEGRATION-20261026` covers `sourceworkspace.tsx`, `sourceclassroom.tsx`; `STUDIO-MOUNT-090-FRESH2` covers `engineeringstudio.tsx`, `learning-flow.css`, `studiocompanion.tsx`, `pumphost.tsx`). Protocol: we do **not** take them over.
- **Wave 1a (now):** L1, L2, L3, L5 — each lane is *unstarted* until its exact-file claim succeeds on the canonical bus; the claim output is recorded in PLAN-REVIEW-LOG.md. A rejected claim stops that lane; no prefix workarounds.
- **Wave 1b (blocked):** L4, L6 — briefs ready; dispatched only after the user (or owners) release the stale claims.

## Per-lane brief fields (all lanes)
Judging criterion · learner need · files (claimed) · focused check · evidence path `docs/improve-loop-20261028/evidence/<lane>/` (1280x800 + 375x812 PNGs, synthetic engineering learner) · handoff `coordination/handoffs/2026-10-28-improve-<lane>.md` · untested gaps (real devices, screen readers, hosted app).
Verification: each lane runs only its focused tests + `npx tsc -b`; the full `npm test` runs once, serially, after integration on a stable tree. Caveat rule: essential labels (synthetic learner, consent, not-verified competence, prepared-vs-AI, no SASL translation) stay **visible next to the action they qualify**; only repeated or detailed caveats move into a disclosure.

## Lanes

**L1 — identity & title (Haiku, low).** Usability/Presentation. Files: `studio/index.html`, `studio/src/App.tsx` (only if it sets a title), `studio/src/student-space/StudentSpace.tsx` (heading line only).
- `<title>KAIRO</title>`; meta description "KAIRO turns your course material into a cited lesson, practice and a record of your work." Per-route titles (`StudioRouter` map) unchanged.
- Home heading: every current `Space` is synthetic (`synthetic:true` type), so the heading is exactly `Your next step.`; leave a one-line comment that a real-learner name path is future work. Type unchanged.
- Check: built `dist/index.html` has no "Computer Science"; home `h1` textContent === "Your next step." for both cohorts.

**L2 — programme-aware defaults (Luna, medium).** Product/Usability. Files: `studio/src/StudioRouter.tsx` (`/classroom` no-param branch only), new `studio/src/kairo/ClassroomStart.tsx`, `studio/src/kairo/Work.tsx`, `studio/src/evidence-workspace/EvidenceWorkspace.tsx` (heading/default section only).
- `/classroom` with neither `bundle` nor `lesson`: for engineering render `ClassroomStart` — "Continue a lesson" list from `/api/workspace/catalog` (same call Home uses; keep only entries whose `id` matches `/^[a-f0-9]{24}$/` and has a title; top 3, links via `lessonLink`; empty → "No saved lessons yet"; fetch error → "Your saved lessons could not be loaded"; the other three actions stay visible in every state), "Explore the motor" (`/engineering`), "Bring my material" (`/sources`), and a secondary "Prepared example (shop stock)" link (attribute `data-prepared-example`) that opens the existing shop lesson via `/classroom?example=shop` (router renders `Classroom` for that param). Other cohorts: unchanged. `?bundle` / `?lesson` branches untouched.
- `/evidence` (renders `Work.tsx` → lazy `EvidenceWorkspace`): for engineering, the embedded portfolio's heading becomes "Other practice cases" and starts collapsed/secondary; "Lesson working" stays first (already is). Informatics unchanged.
- Check at 1280x800 with a fixed local workspace (one saved synthetic motor lesson): engineering — no "stock"/"shop"/"notebook" in elements whose bounding box intersects the viewport on `/classroom` and `/evidence`, **excluding the one secondary link marked `data-prepared-example`** (its text may say "shop stock"); repeat with catalog empty and with catalog request blocked (prepared example still reachable). Informatics — visible text of both pages unchanged vs a pre-change capture. Keyboard: Tab reaches each chooser action in order.

**L3 — studio context & teacher dock (Haiku, medium).** Usability/Intelligence. Files: `studio/src/studio-context-ui/StudioContextPanel.tsx` (+ its css), `studio/src/teacher/TeacherProvider.tsx`. Prop contract of `StudioContextPanel` unchanged (caller `StudioCompanion.tsx` is claimed by another task).
- In the panel, `noLesson = props.lessonTitle === null` (the prop is `string | null`; the host passes `null` when no lesson is linked — implementer confirms in `StudioCompanion.tsx` read-only before relying on it; if not true, stop and report). If `contextState==='unavailable' && noLesson` → neutral text "Open a lesson to ask about your material. Prepared guidance is below." with no warning badge. `unavailable` **with** a lesson keeps the current warning. `changed` unchanged.
- Human labels: `frequencyHz`→"Supply frequency (Hz)", `poles`→"Poles", `supply`→"Supply" (value `normal`→"Normal"), `speedRpm`→"Pump speed (r/min)", `valvePct`→"Valve opening (%)"; unknown keys → de-camel-cased.
- Teacher dock: `stop()` sets "Narration stopped." only if something was speaking/paused; it auto-clears after 4 s via a timer keyed to that stop event (clear only if status is still that same stop event; any new `setStatus`/`say` cancels the timer). All other statuses (blocked audio, unavailable voice, consent errors) remain until dismissed. On ≤768 px the dock sits above the bottom tab bar (`bottom: calc(<tabbar height> + env(safe-area-inset-bottom))` — read the tab bar height from its css).
- Check: `/engineering` and `/pump-lab` load with no dock and no warning badge; Read with KAIRO → Stop shows the dock then clears; 375 px screenshot shows dock not covering tabs.

**L5 — server error status (Haiku, low).** Sustainability/Security. Files: new `studio/server/error-handler.mjs`, `studio/server.mjs` and `studio/server/hosted-core/app.mjs` (replace only the final error middleware with the shared one), new `studio/tests/error-status.test.mjs` (self-contained, no fixture edits).
- `finalErrorHandler(error, req, res, next)`: `res.headersSent` → `next(error)`; `error.type==='entity.parse.failed'` → 400; status 413 → 413; integer `status|statusCode` in 400–599 → that status; anything else (missing, string, out of range) → 500. **Body is always a fixed generic message per status class** (400 "Request could not be read.", 404 "Not found.", 413 "Request too large.", other 4xx "Request could not be completed.", 5xx "Something went wrong."); never `error.message`, stack or paths.
- Test: mount the handler on a minimal express app (port 0) with routes that throw `{status:404}`, `{status:'404'}`, `{status:700}`, plain Error, plus express.json for malformed JSON and a size limit for 413; assert status + exact body. Hosted-core route wrappers (which map to 503) are out of scope and unchanged.

### Wave 1b (blocked on claims)
**L4 — material review & lesson creation (Luna, medium).** Files: `SourceWorkspace.tsx`, `SourceClassroom.tsx`, `server/workspace/routes.mjs` (selection copy).
- OCR warnings only when the section's extraction method is OCR; coverage/limit warnings kept for all sources; dedupe identical strings.
- Revision shown as `Version ab23eb0`, full hash in a disclosure.
- Selection-method sentence rendered once, in "How this lesson was built".
- Shape step: one primary button whose label states the selected mode ("Create reading lesson (no AI)" / "Create AI lesson with citations" — the latter disabled until consent); after the request, show the actual outcome (created / failed + retry / fell back) and scroll-focus the result card with **Start lesson** primary.
- Engineering: sample button becomes "Try a synthetic motor passage"; informatics keeps the shop sample.

**L6 — navigation layering & studio openings (Luna, medium).** Files: `LearningFlow.tsx`, `learning-flow.css`, `EngineeringStudio.tsx`/`engineering.css`, pump page root.
- Desktop with sidebar visible: hide the duplicated top learning-flow strip **only if** every destination in it is reachable from the sidebar (verify list); keep step pills. Mobile: strip → single "Step: <current> ▾" disclosure button, keyboard operable. Remove the studio's second KAIRO logo header on ≤768 px.
- Pump lab: open at top; empty canvas shows idle pump or "Set a prediction to start".
- Check: every former strip destination reachable by Tab+Enter at 1280 and 375.

## Key decisions & tradeoffs
1. Branch from the submission branch, not `main` (main lacks the app and has others' uncommitted edits). Merge to main is a later, separate PR.
2. Respect stale claims → split 1a/1b rather than take over.
3. Reuse existing cohort hook and `/catalog` resume list; no new API.
4. Keep `StudioContextPanel` props frozen; derive no-lesson inside it.
5. No i18n/voice in wave 1 (needs reviewed translations — separate plan).

## Risks / open questions
- Tests pinning old copy ("Studio context unavailable", shop text). Lanes update only assertions for intentional copy changes and list them in their handoff.
- `/classroom` default change could break a demo script that relied on the shop lesson at `/classroom`; mitigated by keeping it one click away and unchanged for informatics.
- Hosted Cloud Run not re-verified; no deploy.

## Out of scope
Deploying, merging to `main`, UI translation, microphone conversation, new studios, cloud AI, design-system rework.
