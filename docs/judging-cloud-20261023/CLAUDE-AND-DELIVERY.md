# Claude delivery review and next ownership

Checked local bus, handoff, code anchors and focused tests on 23 October 2026. This is an independent source/evidence review, not a new visual/device acceptance pass.

## What Claude has delivered

`claude-classroom-20261023-a`, self-reported Opus 5.5/max, records completed brand/classroom/SASL research and released its claims. See [owner handoff](../../coordination/handoffs/2026-10-23-claude-classroom.md).

| Area | Delivered | Boundary |
|---|---|---|
| Selected C brand | Editable symbol/wordmark, lockups, micro mark, mono/reversed assets, icon/favicon, mockups and Rain badge | User acceptance/trademark/print/embroidery checks remain pending. Owner's pixel-fit measurements are not independently remeasured here |
| Authored `/classroom` | Branded room, Rain v1, board record strip/working lines, shelf, per-number anchors, expressions/framing, quality tiers and lighter view | Authored stock example; not arbitrary uploaded source staging or generated worlds |
| Published board contract | `classroom-board/1`, stable target IDs and pure direction functions | Root must agree any general-source adapter; stock IDs cannot masquerade as arbitrary source anchors |
| Board writing | Authored writing/reveal and subsequent cue-ID fix | Not exact-word timed; no walking/new locomotion claim |
| SASL research | Rights/evidence review, tracking-only camera design and proposed `kairo-signing/0.1` | No validated SASL recognition/translation, reviewed signed clips or Deaf co-design acceptance |
| Owner QA | Owner reports browser captures/stepped frames, no console errors in checked view | This chat performed no browser observation. The prior restriction remains; owner-reported QA is not authority to repeat/bypass it |

The current bus separately shows **PUMP-LAB-001 active**, owned by `claude-pumplab-20261023-a`, reserving pump-lab assets/docs/source/tests. Treat that as work in progress, not a completed new studio. Older REVIEW-C1-C3, reference-core and roadmap claims also remain occupied.

## Independent check actually run

`node --test tests/experience-stage.test.mjs tests/classroom-resume.test.mjs tests/narration-cancellation.test.mjs`

**35 tests, 34 passed, 1 failed.** Stage cases: 9 passed; resume helpers: 13 passed; narration: 12 passed/1 failed. See [saved output](review-checks.txt). This is a focused checkpoint, not all application tests or educational acceptance. Claude's handoff also lists a later three-test experience check; those were not included in this specific command, so its historical count is not substituted for the observed 9 stage cases.

Confirmed current failure: `TeacherProvider.pause()` rejects an audio resume but leaves speaking true and paused false. That makes controls misleading even though retry status text appears. Provider/source route inspected; the defect has not been fixed by this planning task.

Resume helpers are present but SourceClassroom still does not import/read/write them. They need parent integration after review; helper tests alone are not a resumed learner experience.

## Ordered delivery plan

1. **Root: playback defect.** Claim TeacherProvider separately. On rejected resume, verify utterance/audio identity before cleanup/status changes; settle speaking/paused and reset audio signal. Add a late-rejection-after-replacement regression so failure from A cannot stop B. Re-run actual-provider tests; no copied controller or weakened assertion.
2. **Luna 1: resume policy/regressions.** Implement isolated pure URL-versus-saved-place policy and meaningful preservation tests. Root integrates it with reviewed lesson loading and the existing storage helper. Invalid saved data must never be overwritten by a default save.
3. **Luna 2: classroom recovery/accessibility package.** Implement isolated accessible state panels and SSR/callback tests. Root wires loading, source-change, 3D failure, storage denial and conflict states. Real screen-reader/phone checks stay pending.
4. **Root: complete judge path.** Preserve citation/source revision and chapter on view/interrupt changes; `/learn` remains practice/notes until a deliberately reviewed consolidation. No duplicate narrator or broad route rewrite.
5. **Claude follow-up candidates, not assignments.** Review R1–R8: observed-versus-expected stock step, shorter entry, clearer studio hub and consistent motion preference. Reuse approved brand artwork after user review. Keep pump-lab separate until its own owner handoff arrives. SASL tracking requires separate package/lockfile/rights/privacy gates and is not a prerequisite for the core demo.
6. **Evidence and pilot.** Fix first-use friction; measure actual task completion, learning checks and low-data/phone experience through an authorized validation process. Record cost/latency and buyer interviews. These close judging gaps more directly than a new service diagram.
7. **Cloud preparation.** Implement authentication/owner checks, durable data migration, bounded jobs and usage controls before protected staging. Public ingress changes alone are insufficient. No deployment is performed by this plan.

The next Luna prompts are prepared for the user to give to chats; no chat/model invocation occurred in this task. Neither worker receives shared runtime ownership. Root reviews both deliveries and current bus updates before integration.
