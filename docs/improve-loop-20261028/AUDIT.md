# KAIRO post-submission audit — 28 Oct 2026

Auditor: Claude Opus 5.5 (low). Code: `codex/midnight-submission-20261026` @ 49af96c, worktree branch `claude/improve-loop-20261028`.
Run: `node studio/server.mjs --production`, `KAIRO_LOCAL_CURRICULUM=engineering`, port 4190, synthetic learner KAIRO-ENG-0001.
Viewports: 1280x800 desktop, 375x812 mobile. Local session: no cloud AI, device voice only.

## What works (observed)
- Paste text → Review → tick "I checked" → Save review → Create local reading lesson → `/classroom?lesson=<id>` opens a cited reading lesson. All API calls 200.
- Engineering studio: 3D motor loads (~8 s), parts list, explode/operate, prepared KAIRO guidance, questions.
- Classroom default: KAIRO 3D avatar + chalkboard renders.
- `/direction` is cohort-aware (mechanical design roles, Wits modules). `/opportunities` lists dated sources.
- Mobile: no horizontal scroll on home/engineering; bottom tab bar present.

## Defects (observed, ranked by learner harm)
| # | Where | What a learner sees | Pointer |
|---|---|---|---|
| D1 | `/classroom` (no lesson), `/evidence`, `/sources` sample | Engineering learner is given a **shop stock-control** lesson, "Saved shop practice", "Try the shopkeeper sample". Wrong programme. | `src/experience/ExperienceClassroom.tsx`, `src/StudioRouter.tsx`, `src/profile/ProgressPage.tsx`/evidence page, `src/workspace/SourceWorkspace.tsx` ("shopkeeper sample") |
| D2 | Home | Heading reads "Your next step, Local curriculum preview." (display name interpolated) | `src/student-space/StudentSpace.tsx` ("Your next step") |
| D3 | Every page | Tab title flashes "KAIRO · Computer Science Studio"; meta description says "computer science studio" | `studio/index.html`, `src/App.tsx` |
| D4 | `/engineering`, `/pump-lab` | Red badge "Studio context unavailable" + "KAIRO cannot use the studio context right now" when simply no lesson is open; raw keys `frequencyHz`, `poles`, `supply normal`, `speedRpm`, `valvePct` | `src/studio-context-ui/StudioContextPanel.tsx` |
| D5 | Studios, desktop + mobile | Floating "Teacher controls · Narration stopped" toast persists; on mobile it covers the bottom tab bar | `src/teacher/TeacherProvider.tsx` ("Narration stopped") |
| D6 | Check source (pasted text) | Shows OCR warnings ("OCR may misread numbers…") for typed/pasted text; same warning text repeated 3× | `src/workspace/SourceWorkspace.tsx` |
| D7 | Shape lesson / classroom | Full 64-hex revision hash in learner copy; provenance paragraph ("Source-order text selection because no meaningful goal terms matched…") shown twice | `src/workspace/SourceWorkspace.tsx`, `server/workspace/routes.mjs`, `src/source-classroom/SourceClassroom.tsx` |
| D8 | Shape lesson | Five near-identical create buttons ("Create a local reading lesson", "Create my multi-source lesson", "Build lesson", "Create my cited lesson", "Create local reading lesson"); after creating, viewport stays at top with no visible confirmation | `src/workspace/SourceWorkspace.tsx` |
| D9 | Navigation | Up to four stacked nav layers (sidebar, top tab strip, sub-tabs, step pills). Mobile studio: ~260 px of pills + a second KAIRO header before content | `src/learning-flow/LearningFlow.tsx`, `learning-flow.css`, `src/engineering/EngineeringStudio.tsx` |
| D10 | `/pump-lab` | Opens scrolled past its intro; large empty canvas until a prediction | `src/studio-teaching-host/PumpHost.tsx` / pump page |
| D11 | Server | Express error handler converts any error (incl. sendFile 404) into **400 "Request could not be read."** | `studio/server.mjs`, `studio/server/hosted-core/app.mjs` |
| D12 | Copy everywhere | Dense caveat prose (e.g. "100 units; 48,000 characters / 64 KiB") on primary screens; hard for a first-time learner | sources upload area, classroom footers |
| D13 | Perf | `/api/account/status` requested 2–4× per page load | account status hook |

## Gaps vs user goals (not defects)
- **Multilanguage:** interface chrome is English-only. Lesson language options exist but only via cloud generation (off locally). No UI language switch.
- **Voice / KAIRO interactivity:** device voice + prepared answers only; "Ask KAIRO" is prepared text; microphone conversation not enabled.
- **AI/ML:** cloud generation not configured locally; hosted config untested in this audit.

## Not verified here
Hosted Cloud Run app, cloud AI generation, Google voice, Groq dictation, SASL camera preview, informatics cohort, screen-reader pass.
