# KAIRO engineering demo: 90-second rehearsal and claim/image map

**Date:** 26 October 2026
**Owner:** `codex-luna-app-audit-20261025-a` (Codex Luna; model/effort not exposed)
**Audience need:** An adult university/TVET learner wants to understand difficult engineering material, practise from evidence, retain their work, and plan an honest next step.
**Judging criteria:** Product, Creativity, Usability, Sustainability, Impact, Presentation, Intelligence. This is a rehearsal artifact, not an official score or a claim that all criteria are validated.

## 90-second spoken script

**0:00–0:12 — Setup.** “This is KAIRO’s synthetic engineering walkthrough. The hosted service is private; this is not public judge access. We review material before selecting it.”

**0:12–0:27 — Sources and reading.** “Two reviewed motor sources make one lesson. KAIRO keeps both titles beside exact passages. Read on screen or choose ‘Read this chapter with KAIRO.’ Citations help locate claims; they do not certify correctness.”

**0:27–0:43 — Motor.** “The DOE sourcebook’s synchronous-field rule, nₛ = 120f/p, gives 1,500 revolutions per minute at 50 hertz and four poles. That is field speed, not measured shaft speed. The rotor’s slip is illustrative.”

**0:43–0:57 — Pump and fallback.** “Pump Lab is a prepared model, not generated from uploaded notes. Predict, inspect a reading and explain it. If a service fails, visible text and local reading remain.”

**0:57–1:12 — Save and resume.** “We practise source recognition, add a note, save and reload. The place returns. That is persistence, not mastery.”

**1:12–1:30 — Direction and CV.** “Next, consider BMW South Africa’s programme record, checked 25 October; availability is unknown. KAIRO’s project idea is preparation, not an employer requirement. The CV includes only details the applicant confirms.”

Approximate spoken length: 170 words, about 113 words per minute across the full 90 seconds, leaving time to change the screen between beats. Rehearse with a timer; keep the source and shaft-speed distinction clear.

## Release status update — 26 October 2026

Root reports the font-policy fix (PR115) and classroom-heading fix (PR117) are merged, CI run [40240125580](https://github.com/LethaboMH14/KAIRO/actions/runs/40240125580) passed 925/925 on heading-fix commit `2dd3f831`, and private revision `full26b` serves 100% traffic. The hosted browser record at `docs/full-integration-release-20261025/browser-cloud.json` now shows four successful page checks (classroom, Engineering Studio, Direction and CV), `errors: []`, synthetic-only data and zero model calls. It also records four 404 responses for `/api/workspace/progress/learner_browser`; this check does not establish persisted hosted learner progress. This is a private IAM service; no public judge entry path is established. The full integration release folder and its `validation.json` still describe the earlier `full25g` / 923-test promotion, so do not present those historical values as the latest release record.

The local strict-CSP checks documented in `docs/app-audit-luna-csp-20261026/` and `docs/final-local-lesson-acceptance-luna-20261026/` pass on synthetic local routes. The separate hosted screenshot walkthrough is now recorded as successful for four page loads; it is a route/render check, not a full hosted learner journey or persistence test. The synthetic screenshots below may be used with that boundary stated.

## Presentation image and evidence map

| Time | Show | What the image can support | Caveat / handling |
| --- | --- | --- | --- |
| 0:00–0:12 | `docs/full-integration-release-20261025/screenshots/material-multi-source.png` | Local material workspace and synthetic reviewed-source selection. | This is a local preview image, not an account sign-in or judge-access proof. It contains repeated synthetic fixture titles; do not use it as evidence of a clean catalogue. Keep synthetic data labelled. |
| 0:12–0:27 | `docs/full-integration-release-20261025/screenshots/bundle-edited.png` | Two selected source records, exact passages and source IDs, reading prompt, source-recognition practice, saved note and save control. | Read-only citations support checking where text came from, not educational correctness. Narration is an option; this still does not prove voice playback. |
| 0:27–0:43 | `docs/app-audit-luna-csp-20261026/engineering.png` | Current local motor model rendered under the learner CSP; default 50 Hz/four-pole context is visible. | This isolated CSP screenshot has no lesson selected and says studio context is unavailable. Separately, `docs/full-integration-release-20261025/browser-journey.json` records the synthetic reviewed-bundle-to-motor context handoff. Do not imply the CSP screenshot itself proves that handoff. The older `bundle-motor-context.png` is a pre-font-fix capture with the model loader visible; do not put it on screen. |
| 0:43–0:57 | `docs/full-integration-release-20261025/screenshots/bundle-pump-context.png`; optional visual-only follow-up: `docs/app-audit-luna-csp-20261026/pump-lab.png` | Integrated synthetic pump context, operating steps and prepared readouts; the separate CSP capture shows the pump canvas rendering under the strict local policy. | The fresh CSP screenshot has no selected lesson and shows default 1450 rpm / 100% valve values. The pump model is illustrative and not generated from course uploads. Do not describe a changed reading unless it is performed and observed live. |
| 0:57–1:12 | `docs/full-integration-release-20261025/screenshots/bundle-practice-saved.png` | Exact-source practice, saved choice/note and save-place controls. | Pair with `browser-journey.json`, which records save and full-reload restore with synthetic data and zero model calls. This is persistence/source recognition, not mastery. |
| 1:12–1:30 | `docs/full-integration-release-20261025/screenshots/cloud-direction.png` and `cloud-cv.png`; evidence card from `studio/data/role-opportunities/engineering.json`. | Hosted Direction and CV pages loaded with their route-specific titles; the dated BMW Group South Africa Graduate Development Programme record is available for presenter context. | The browser check verified page loads/titles, not goal submission, CV persistence, or a complete role-to-CV flow. Do not claim a live vacancy, automatic employer match, automatic role-to-CV transfer, application, or placement. |

Hosted route captures for the first engineering beats: `docs/full-integration-release-20261025/screenshots/cloud-bundle.png` and `cloud-motor.png`. They show the hosted classroom and Engineering Studio pages after the font/heading fixes. The companion `browser-cloud.json` records the exact synthetic page checks. Treat them as hosted rendering evidence only; the more complete source-selection, practice, save and reload sequence is evidenced by the local synthetic `browser-journey.json` and local captures above.

The source record lists an Engineering degree as an eligible qualification and “team spirit and initiative” as programme wording. Availability is unknown: the official page’s filtered panel showed no matching results on the check date. The KAIRO-authored manufacturing-process project is preparation guidance, not a BMW requirement or endorsement. Source: [BMW Group South Africa Graduate Development Programme](https://www.bmwgroup.jobs/za/en/opportunities/graduate.html?country=ZA&jobType=GRADUATE_JOB), recorded in `engineering.json` with checked date 2026-10-25. Confirm the current provider page before presenting it as current.

Never claim an open BMW role, automatic employer match, qualification check, placement, applicant tracking score, validated learning gain, trained learner-prediction model, SASL translation, validated South African-language output, payment capability, or external judge access from this package.

### Engineering claim boundary

The app calculates synchronous field speed as `n_s = 120 f / p`; at 50 Hz and four poles the result is 1,500 r/min. The formula and its interpretation are documented against the U.S. DOE [Motor Systems Sourcebook](https://www1.eere.energy.gov/manufacturing/tech_assistance/pdfs/motor.pdf), printed page 6, in `docs/authoring-kit-20261023/ARCHITECTURE.md`. The Engineering Studio source list currently names Wikipedia and Engineering ToolBox rather than DOE (`studio/src/engineering/motorContent.ts`); show the DOE reference as a presenter source card or footnote, not as a citation already visible in the UI. The 3D rotor/slip motion is explicitly a presentation model: no actual shaft RPM, torque, heating, efficiency, or physical motor response is measured.

## Claim map and seven-criterion observable checks

| Criterion | Safe claim and observable acceptance check | Evidence now | Remaining gap |
| --- | --- | --- | --- |
| **Product** | Follow two synthetic reviewed sources into a lesson, save practice/notes, reload, and return to the same saved work. | `browser-journey.json`; `bundle-practice-saved.png`; hosted route/title checks for classroom and studio in `browser-cloud.json`. | Human can complete it without a developer; hosted persistence is not established by the route-only cloud check. |
| **Creativity** | The learner connects source reading to a prepared variable-driven motor/pump activity; inspect the field-speed result and its physical limit. | Motor/pump screenshots; deterministic `synchronousSpeed` implementation and engineering checks. | Do not claim improved learning effectiveness or live equipment simulation. |
| **Usability** | Exact text remains available if a provider is unavailable; visible source IDs, progress and resume controls provide a next step. | Local source reading is explicitly no-service-call; automated save/reload journey; CSP routes render locally. | Human, phone, keyboard, screen-reader and language testing remain open. |
| **Sustainability** | The journey reuses existing lesson, storage and studio contracts; local reading avoids a new provider call for the fallback. | Historical full25g gate: 923/923 Linux CI and production build in `validation.json`. Current root-reported CI run 40240125580 passed 925/925; current hosted route checks cover four pages. | Costs per completed session, support load, renewal and buyer path are not validated here. |
| **Impact** | Source and career preparation address a plausible learner need; the demo states the limits. | Source-referenced UI and dated role record. | No measured learning gain, retention, employment, reach or beneficiary feedback. |
| **Presentation** | Explain one learner problem, show source-to-practice evidence, and close with one honest next step within 90 seconds. | This timed script; local synthetic journey evidence; four post-fix hosted page screenshots. | Rehearsal timing remains open; no human/device validation is implied. |
| **Intelligence** | Selected sources remain visible; the motor equation is deterministic and testable; the next-step guidance is explainable. | `browser-journey.json`; `fieldMath.ts`; source coverage tests and role source JSON. | No trained learner forecast, automated employer matching, or validated ability prediction is claimed. |

## Rehearsal fallback and release status

- **Voice/provider unavailable:** stop narration, keep the exact cited passages on screen, and use the local reading lesson. Do not substitute an unlabelled generated voice or imply that this recording contains live KAIRO speech.
- **Engineering canvas unavailable:** show the current saved screenshot only as a labelled local capture, then explain the checked equation from its source. Do not present the old pre-font-fix spinner image or pretend the motor animation is live if it is not.
- **Pump service or route unavailable:** use the labelled local pump capture and describe the prepared model as illustrative. Do not invent a reading or a changed setting.
- **Private account unavailable:** use synthetic local preview evidence and say so. The hosted site remains private; public judge access is not established. Use root-managed ignored credential handoff only for an authorized private rehearsal; never copy credentials into this document, a slide, recording, or chat.
- **Hosted-browser status:** the current report records four successful synthetic hosted page/title checks with zero browser errors and zero model calls. It also records a 404 for the synthetic progress fixture on each page; this is not evidence that private hosted learner progress was saved or restored. Local strict-CSP and fuller save/reload journey checks are separate. The app remains private IAM, and this evidence does not establish public judge access, human usability, phone/device acceptance, or a complete hosted journey.

## Evidence files referenced

- `docs/full-integration-release-20261025/README.md`
- `docs/full-integration-release-20261025/browser-journey.json`
- `docs/full-integration-release-20261025/live-production.json`
- `docs/full-integration-release-20261025/validation.json`
- `docs/full-integration-release-20261025/screenshots/`
- `docs/app-audit-luna-csp-20261026/README.md` and screenshots
- `studio/data/role-opportunities/engineering.json`
- `docs/engineering/content-review.md`
- `docs/authoring-kit-20261023/ARCHITECTURE.md`
