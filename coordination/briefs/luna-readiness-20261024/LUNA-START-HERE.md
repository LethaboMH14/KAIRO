# Luna: make KAIRO judge-ready, production-usable and demo-ready by 26 Oct 23:59

Written 24 Oct 2026 by Claude (`claude-kairo-ad-20261024-a`) at the user's request, after the 20 s HustleWindow
video was handed over for submission. This is a prioritised brief, not an authorisation. Before editing, follow
AGENTS.md: register your actual model/effort, check the bus status, then claim exact paths. Anything public,
paid, on a user account or sent outside the project needs the user's explicit go-ahead.

Read first: `README.md`, `docs/KAIRO-PRODUCT-BRIEF.md`, `docs/judging-cloud-20261023/JUDGING-MATRIX.md`
(final deadline 26 Oct 23:59; deck, demo access, Lean Canvas, SSDLC and repo link are required),
`docs/experience-connected-20261024/REVIEW.md` (its next steps are the backbone of P0/P1 below), and
`docs/security-submission-20261024/RELEASE-STATUS.json` (revision kairo-app-00006-885, IAM-private, 692 tests).

## Where the app stands

Working foundations: account → modules → private material → extraction review → editable cited lesson →
reading/KAIRO → motor, pump or request studio → practice → saved working → resume, on IAM-private Cloud Run with
two synthetic judge accounts. Passage explanation and **draft** translation into Afrikaans, isiZulu, isiXhosa,
Sesotho and Setswana exist (`studio/server/workspace/passages.mjs`). The camera does local hand tracking only:
no SASL recognition or translation, and the microphone is disabled.

Biggest gaps against the judging criteria:

- Judges cannot open the app yet, because it is IAM-private.
- No human or device has walked the full journey.
- There are no real usage numbers or learner feedback.
- The Lean Canvas, deck and demo film are not built.

## P0: must be done before the deck is submitted (in this order)

1. **Judge access decision (user).** Prepare the exact options with cost and risk for the user to choose from:
   a public invoker on the current service with app login, an authenticated proxy, or per-judge IAM. Execute only
   the chosen one. Then sign in as both synthetic judges on a real laptop and phone, and save dated screenshots
   or recordings made by the user. Agents still may not observe the browser.
2. **Journey acceptance and bug fixing.** The user or a tester completes REVIEW.md step 1 on both accounts:
   motor and pump paths, portrait/3D fallback, narrow screen, keyboard only, slow network, denied camera,
   stopped narration, reload and resume. Log every defect with steps to reproduce and fix them in priority
   order. Freeze features after this.
3. **Real usage evidence, starting now.** Add consented, privacy-minimal event logging: session start, source
   reviewed, lesson opened, studio action, practice saved, return visit. No content and no personal data
   beyond the account id. Add an export script. Run a small formative session (5–8 consenting learners) using
   the ACCEPTANCE.md one-viewing question and three tasks. Record the actual n, completion and quotes (with
   consent). Zero stays zero until observed. These numbers are what the deck's "traction/evidence" slide can say.
4. **Production hardening for a real launch.**
   - Cost alarms and budget caps before the GCP trial ends on 4 Nov.
   - Per-user rate limits on generation and voice.
   - Uptime check and error alerting, and structured logs without secrets.
   - Backup/restore of Firestore and Storage, tested once.
   - POPIA basics: privacy notice, consent text, retention period, and self-service delete/export of a learner's
     material and working.
   - A clear outage/fallback message when the AI provider is down.
   - Record each item as done or not done in a checklist, not as a claim.
5. **Demo footage the user records.** Follow `docs/kairo-ad-production-20261024/CAPTURE-LIST.md` (P1–P8)
   on the authorised route with synthetic data. These recordings feed both the 2–3 min film and the live-demo
   backup.

## P1: strengthens scores if P0 is safe

6. **Language, honestly.** Make the existing draft translation visible in the demo (Setswana or isiZulu)
   with its "Draft translation" label. Arrange one fluent reviewer per language shown, and record what they
   corrected. Do not claim speech understanding in any African language, or SASL translation. The signing
   panel stays "hand tracking only" with its roadmap note.
7. **One consistent voice.** Keep Aoede, or choose a South African voice deliberately, and use it everywhere
   (app and film). Check licences first:
   - Azure `en-ZA-LeahNeural` is a cloud voice and needs an account.
   - Meta MMS-TTS Setswana (`facebook/mms-tts-tsn`) is CC-BY-NC, so it is unsuitable for commercial use.
   - Google has no Setswana voice.
   - A consenting human speaker is the cleanest option for any Setswana line.
8. **Extraction coverage report.** Per page/slide/sheet, report text, images, tables and formulas found or
   missed (REVIEW.md step 2). This turns "it read my PDF" into a checkable claim.
9. **Lesson-quality rubric.** A cited objective, worked example, prediction, feedback and transfer task. Score
   10 generated lessons, keeping citation correctness separate from explanation quality.

## P2: roadmap, shown as roadmap in the deck

SA role/bursary records with source and checked date; institution roles and educator review; signing
vocabulary work only with Deaf co-design, consent and a licensed dataset; Commerce and Opportunity extensions.

## The 2–3 minute film for the deck (decide the script with the user)

Proposed spine (≈ 150 s):

| Time | Beat | Material needed |
|---|---|---|
| 0:00–0:15 | Problem: a capable student with notes, deadlines, no lab. | Entrant or actor footage, or the existing stills. |
| 0:15–0:35 | Who is affected and why it matters. | Cited figures only, each from a primary source with date. Use only the number, no extrapolation. |
| 0:35–1:35 | Live product walkthrough: material → review → cited lesson (show a Setswana or isiZulu draft translation, labelled) → motor (select, Operate) → practice → My working → resume. | Real screen recordings (P1–P6). |
| 1:35–1:55 | Breadth: pump and request trace, ~5 s each. | P7/P8. |
| 1:55–2:15 | Trust: source checks, security/SSDLC highlights, privacy. | `docs/security-submission-20261024`. |
| 2:15–2:35 | Business: Lean Canvas in one frame, buyer, pilot ask, cost per active learner. | Lean Canvas, cost model. |
| 2:35–2:50 | Evidence so far (actual n), next milestones, the ask. | P0 step 3 results. |
| 2:50–3:00 | Brand close. | Existing lockup and end card from `design/kairo-ad-20261024`. |

Claude can produce it in the existing offline pipeline (`design/kairo-ad-20261024`) once the recordings, the final
voice (Aoede via `voice/generate-voice-aoede.mjs`, or the user's own) and the script exist. Expect about one working
day including review, mostly waiting on footage and approvals rather than rendering.

## Deck checklist (each slide needs its evidence file)

| Slide | Content and source |
|---|---|
| Problem | Problem and affected learners, with cited, dated sources. |
| Solution | One-sentence mechanism: source → grounded interaction → kept evidence. |
| Live demo | Access route and the backup recording. |
| How it works | Architecture: Cloud Run, Firebase Auth, Firestore/Storage, Vertex AI, Google speech. |
| Security and SSDLC | The five fields already prepared. |
| Accessibility and language | Captions, reading mode, keyboard, reduced motion, draft SA-language translation; SASL as roadmap. |
| Evidence | Tests, live API checks, and actual usage/feedback n. |
| Lean Canvas | Buyer hypotheses are labelled as hypotheses. |
| Unit economics | Cost per session from measured calls. |
| Scalability | Stateless services, autoscaling limits, cost caps. |
| Impact | Hypothesis plus a measurement plan, with no invented gains. |
| Team | Team and roles. |
| The ask | What the ask is. |

Every number on a slide links to its file or source. No FNB partnership, reward, job or grade claims.

## Done means

- Judges can open the app through the user-approved route.
- Both journeys pass human acceptance, with defects closed or listed.
- Usage/feedback numbers exist (even if small).
- The hardening checklist is ticked with evidence.
- Capture footage is recorded.
- The deck draft and film script are agreed with the user.
- Leave a handoff in `coordination/handoffs/` with changed files, checks and remaining gaps.
