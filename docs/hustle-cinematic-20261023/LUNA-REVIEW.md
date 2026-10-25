# Independent Luna delivery review

23 October 2026. Read both actual chats, published briefs, handoffs and source; reran the focused tests together. Do not infer work from the chat titles.

| Chat (verbatim title) | Actual newest delivery | Independent result |
| --- | --- | --- |
| Add narration cancellation evidence | LESSON-PLAN-QUALITY-001: pure source-aware lesson planner, validation/warnings, novice-flow audit | Six focused tests pass; delivered files exist. Registers Codex gpt-6 / effort unknown because requested Luna/low was not exposed. Do not report this run as verified Luna/low. |
| Implement lesson resume package | LESSON-START-001 and LESSON-START-COPY-001: stateless readiness/start/resume/recovery panel; save copy corrected after root review | Nine focused tests pass; delivered TSX and handoff exist. Registers gpt-6-luna / low. |

Combined independent command, from studio: `node --test tests/lesson-plan-quality.test.mjs tests/lesson-start-ui.test.mjs` → 15 tests, 15 pass, zero fail. These are deterministic Node/SSR checks, not real browser, audio, phone, screen-reader or learner acceptance. The independent output is retained in this directory.

## What is incomplete

Neither package is imported by current runtime code outside its own directory (source search). Both briefs explicitly reserved router/provider/runtime integration to root. Their completion therefore means bounded package completion, not the whole learner flow. The user's concern that one task did not happen is not established as missing code by the inspected records; the visible missing result is integration, plus one run not confirming requested model settings.

Root published `lessonId` in the planner subset, while actual workspace Lesson uses `id`. An explicit host adapter must map `{...lesson, lessonId: lesson.id}` from a validated current lesson, not cast blindly. This mismatch originates in the published parent contract; do not blame the worker for implementing it.

The planner summary currently counts every quiz item while invalid/unsupported check steps can be omitted. Before displaying “N checks”, count runnable check steps or expose a separate supported count. Editorial warnings must not disappear merely because identity/revision validation succeeds. The planner requires trusted reviewed source context and does not authenticate quotes against original source pages; root must preserve its existing source/revision checks. Worked-example candidates are lesson-supplied, not independently verified solutions.

Start panel is presentation only: root must classify stale/unavailable source, validate storage, preserve corrupt records, guard request identity and connect cancellation to the one narrator. Its generic capability “prepared interactive” does not prove arbitrary uploads have motor simulation support. No ML adaptation, cloud save, automatic career matching or mastery scoring is delivered by these two packages.

## Next bounded work

The independent synthetic counterexample is retained as `luna-review-probe.mjs` and `luna-review-probe.json`: declared summary count1, runnable check count0, warning correctly present. It reproduces a display/integration concern rather than an invented production incident.

1. **Root integration first:** claim exact host/controller files after checking current claims. Reconcile identity adapter, supported check count and trusted readiness. Mount panel, preserve reading/cancellation/resume and actual lesson coverage. Publish final controller/test seam before dependent worker implementation.
2. **Luna A supporting package:** after root publishes seam, add independent contract regressions for identity mapping, missing reviewed source, supported counts and assisted-attempt labels. No competing router/provider ownership. If requested Luna settings are not exposed, report that and register unknown instead of claiming Luna.
3. **Luna B supporting package:** after root publishes seam, add stateless practice-milestone/evidence UI with source revision, helped/unassisted indicator and no certified-level/partner claim. Concept level-up graphics stay in the advert until an explicit real progression policy exists.

No follow-up was silently dispatched in this task; no new worker/chats spawned and no worker claim was taken over. These are the next packages to issue once the dependent interface exists, not a claim work is underway.
