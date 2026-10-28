# Plan Review Log: KAIRO post-submission wave 1
Started 28 Oct 2026 18:40 SAST. MAX_ROUNDS=3. Reviewer: codex gpt-6.1-terra, reasoning low, read-only.

## Round 1 — Codex
The plan needs revision before implementation. Several lanes cannot deliver their acceptance criteria within their stated scopes.

- **Wrong `/evidence` target:** `StudioRouter.tsx` renders [Work.tsx](C:/Users/USER/Desktop/kairo-improve-loop/studio/src/kairo/Work.tsx:7), which embeds the portfolio; `ProgressPage` is `/progress`. **Fix:** Give L2 ownership of `Work.tsx` and, if needed, `evidence-workspace/EvidenceWorkspace.tsx`.
- **Work is already led by lesson working:** `Work.tsx` already places it before the shop portfolio; changing `ProgressPage` would miss the observed content. **Fix:** Target the portfolio’s heading and default tab, and test the assembled `/evidence` page.
- **Default classroom pointer:** `/classroom` without `bundle` or `lesson` renders [ExperienceClassroom.tsx](C:/Users/USER/Desktop/kairo-improve-loop/studio/src/experience/ExperienceClassroom.tsx:16), which directly uses `STOCK_LESSON`. **Fix:** Put the engineering chooser at the route boundary while preserving both parameterized routes.
- **Cohort contract is unspecified:** `Routes` already has `useStudentSpace()`, but the plan does not establish a cohort field or how L4 obtains it; `/sources` and `/evidence` also render while that request may still be loading or have failed. **Fix:** Verify the response shape, expose a typed shared selector, and define loading, failure and unknown states before L2/L4 implement.
- **Shared ownership conflicts:** L1 owns `StudentSpace.tsx`, while L2/L4 may need its interface; L2 and L4 also touch classroom behavior through separate files. **Fix:** Assign the shared cohort contract to one owner, publish its handoff first, and claim exact dependent files and tests.
- **Claim workaround is invalid:** A `kairo-improve-loop/` prefix does not reserve the actual repository-relative files in the canonical bus. **Fix:** Claim real scopes through the canonical bus; have the owners release conflicting claims or ask the user to coordinate recovery.
- **Context state loses the cause:** [StudioContextPanel.tsx](C:/Users/USER/Desktop/kairo-improve-loop/studio/src/studio-context-ui/StudioContextPanel.tsx:10) receives only `current`, `changed` or `unavailable`; absence of a lesson cannot reliably distinguish a fetch failure. **Fix:** Extend the host-to-panel state contract and claim its callers before changing the wording.
- **Toast rule hides useful errors:** The teacher dock also reports blocked audio, unavailable voices and consent errors when not speaking. **Fix:** Suppress or time-limit only the stopped status; retain actionable errors until dismissed.
- **Warning rule is too broad:** Pasted material can still have coverage or truncation limits; uploaded PDFs can contain native text rather than OCR. **Fix:** Gate OCR-specific warnings on actual extraction method, while retaining applicable coverage and limit warnings.
- **Caveats must remain contextual:** Moving every caveat into a collapsed disclosure can hide material facts at the point of consent or interpretation. **Fix:** Keep essential source, consent, synthetic and unverified-status labels visible beside the relevant action or evidence; use disclosures for detail.
- **Lesson creation wording overclaims:** Cloud availability alone does not establish successful cited AI generation, and a single primary button must preserve provider consent and failure recovery. **Fix:** Label the selected mode before submission and report the actual result after validation.
- **Resume is underspecified:** “Open your last lesson” needs a trustworthy source and handling for deleted, stale, inaccessible or bundle lessons. **Fix:** Reuse the existing resume/catalog logic and show a recovery path when the recorded lesson cannot open.
- **Error tests miss the hard cases:** Both servers have separate middleware, and hosted route wrappers independently map errors. **Fix:** Exercise each actual app for malformed JSON, oversized bodies, missing files, unknown errors and headers-already-sent behavior.
- **Parallel verification is not isolated:** Every lane runs the full suite while shared files change; the README warns of SSR startup contention. **Fix:** Run focused lane checks, then integrate and run the full suite serially on a stable tree.
- **Navigation and screenshots lack acceptance boundaries:** Hiding strips can remove destinations or keyboard access, while screenshots alone do not prove navigation or accessibility. **Fix:** Specify desktop/mobile keyboard and route checks, plus synthetic browser evidence and explicit untested device/human gaps.
- **Task briefs are incomplete:** The lanes do not individually identify judging subquestions, learner needs, observable checks, evidence and remaining gaps as required. **Fix:** Add those fields and exact test, screenshot and handoff paths to each claim.

The local bus status returned “unable to open database file” in this read-only session, so current claim ownership was not verified.


VERDICT: REVISE
### Claude's response (round 1)
Accepted: /evidence → Work.tsx + EvidenceWorkspace; /classroom chooser at route boundary; explicit cohort contract (existing useStudentSpace, frozen); no fake-prefix claims — split into wave 1a (claimable) / 1b (blocked on stale claims); panel derives no-lesson internally so StudioCompanion (claimed) is untouched; dock auto-clears only "Narration stopped"; OCR warnings gated on extraction method; essential caveats stay visible; lesson button states mode + reports actual outcome; resume reuses /catalog; error tests cover both apps incl. headersSent; focused lane checks + one serial full suite; keyboard/route checks for nav; per-lane brief fields.
Rejected: none outright. Deferred: L4/L6 until claims are released (user decision).

## Round 2 — Codex
- **L1 home check misses the real output:** `StudentHome` currently interpolates `space.displayName`, but its synthetic type is always `true`; the check only says the h1 must not contain “preview,” so it can pass while still showing “Local curriculum preview.” **Fix:** Assert the exact heading for synthetic learners, and make `space.synthetic` handling explicit without weakening the type.
- **L2 fetch-failure path is incomplete:** The catalog failure message offers “Bring my material,” but the chooser’s prepared-example link is omitted from that recovery state. The existing Home uses a prepared classroom fallback when no lessons are available. **Fix:** Keep the prepared example reachable after catalog failure and test both catalog-empty and catalog-error cases.
- **L2 fails to ensure the listed lessons are reachable:** It assumes `/api/workspace/catalog` lessons can all open through `lessonLink`; stale, inaccessible or malformed catalog entries can lead to broken links. **Fix:** Validate IDs and use the existing Home resume filtering/logic, with a clear recovery state for lessons that fail to load.
- **L2 “first viewport” is not a stable acceptance check:** It varies with catalog count, viewport and content; hidden portfolio text can also defeat or evade DOM-text comparisons. **Fix:** Specify viewport dimensions, visible-region assertion and a fixed synthetic catalog fixture.
- **L3 no-lesson detection is lossy:** `!lessonTitle` treats an empty/missing title as no lesson even when the host reports a real context failure; it can suppress a genuine warning. **Fix:** Give the panel an explicit no-lesson state or derive it from a validated host signal, not title truthiness.
- **L3 timing/status race:** The four-second clear can erase a newer narration error/status if the learner starts reading again before the stop timer fires. **Fix:** Clear only if the current status is still the same stop event, and cancel/reset the timer on new status.
- **L5 test scope cannot prove the promised 404:** `studio/server.mjs` uses static serving plus an SPA catch-all, so an absent path may return `index.html` with 200 rather than reach the final error handler. **Fix:** Test a route that actually throws 404 or define the intended static-miss behavior before asserting 404.
- **L5 overbroad status preservation:** Preserving every numeric `status`/`statusCode` in 400–599 may expose arbitrary upstream error messages if the generic body is not used for all such errors. **Fix:** Preserve only the status code while always returning a safe generic body; test string and invalid status values.
- **L5 hosted-core “thrown 404” test is incompatible with middleware:** Its route wrapper maps non-`TypeError`, non-409 exceptions to 503 before the final handler. **Fix:** Exercise the final middleware through an error path that bypasses the wrapper or narrow the hosted-core claim to errors it can actually preserve.
- **L5 file ownership omits test/fixture dependencies:** The test may need hosted app construction fixtures or helpers; the brief claims only the new test file and app middleware. **Fix:** Name every existing helper/fixture it will edit, or keep the test self-contained.
- **Coordination remains a material gate:** The plan says exact claims happen before editing but does not record actual claim results; prior bus status failed to open in this read-only environment. **Fix:** Treat each lane as unstarted until canonical-bus claims succeed; no prefix workaround.

VERDICT: REVISE
### Claude's response (round 2)
Accepted all 11: exact heading assertion; catalog id filter + empty/error states keep prepared example; fixed-viewport visible-region check with fixed fixture; no-lesson = lessonTitle===null (implementer confirms in caller, else stops); event-keyed stop timer; L5 extracted shared handler, generic bodies only, self-contained test, hosted wrappers untouched; lanes unstarted until claim recorded.

## Round 3 — Codex
Blocking issue: **L2’s acceptance check conflicts with its required UI.** The engineering classroom chooser must include a visible “Prepared example (shop stock)” link, but the check requires no “stock” or “shop” text anywhere in the classroom viewport. That test will fail even when the implementation follows the plan. Revise the check to exempt that explicitly required link, or move the example link below the tested viewport.

VERDICT: REVISE
### Claude's response (round 3, final — MAX_ROUNDS reached)
Accepted. Check now exempts the single link marked data-prepared-example; link opens /classroom?example=shop so the chooser does not loop back to itself. Fixed after the final round; not re-reviewed by Codex. Outcome: converged except this one Claude-applied fix.

## Claims (canonical bus, agent claude-improve-loop-20261028-a)
IMPROVE-L1/L2/L3/L5/DOCS-20261028 all claimed ok=True at 28 Oct 2026. Implementation pre-authorised by the user at kickoff ("start implementing").

## Implementation review — Sonnet 5.5 (medium), diff b5c8d27..40c31c3
Verdict FIX. (1) Stop during "Preparing <voice>…" left a stuck dock — FIXED (stop treats in-flight fetch / Preparing status as active). (2) Non-engineering /classroom now waits for learning-space — REJECTED: Home and Studios already block on the same fetch; consistent pattern, logged as known. (3) Error-handler contract change (non-status errors 400→500, generic 4xx text, hosted 413 text) — INTENDED per L5 spec; no client matches old strings.
Implementers: L1/L3/L5 Haiku 5.5; L2 attempted twice on GPT-6 Luna (1st refused for bus access, 2nd Codex CLI crashed: Windows OS error 1450), then Haiku (interrupted by session restart), finished by Claude Opus.

## Implementation review — Sonnet 5.5 (low), wave 1b
Verdict FIX, 3 findings, all FIXED in 9ce22a6: sample button hidden while cohort loads; mangled "?" busy strings restored to "…"; "selection limited to this source" caveat moved into the always-visible summary line.
