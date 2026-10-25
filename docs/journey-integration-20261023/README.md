# Clear lesson → practice → evidence flow

23 October2026. Root codex-journey-20261023-o, Codex gpt-6 / effort unknown. Product, Usability and Intelligence: connect reviewed worker deliveries into actual learner-facing use, with traceability and truthful evidence. No browser observation or recording performed. The current screenshot restriction remains in effect.

## Implemented in the actual app

1. Open a source lesson in `/classroom?lesson=<saved lesson id>`. The existing loader first checks the reviewed source revision and exact cited excerpts. The planner adapter then validates the native Lesson.id shape before readiness is offered. A malformed lesson returns recovery instead of a broken panel.
2. New starts show **Begin reading**. A successfully decoded matching saved cursor also offers **Resume lesson** and **Start reading from the beginning**. Invalid/stale records are not offered as resume; existing preservation helpers keep their bytes protected.
3. Begin/resume first stops the one existing narrator, enters reading view, selects the intended chapter and uses the existing resume writer. No automatic speech or 3D mount. KAIRO in3D remains an explicit learner choice.
4. Readiness displays the supported check count and reading-only estimate, plus expandable editorial limitations such as prompt-only examples. It does not display the planner's developer-facing storage integration instruction. A validated stored cursor or actual successful study save permits device-save capability wording; otherwise session-only wording is conservative. No cloud sync claim.
5. **Practise** now mounts the new PracticeMilestoneCard after an actual recorded attempt. It shows the question, result, exact source revision, timestamp and Keep my work action. Native historic attempts do not track help use, so assistance remains **unknown**, even for correct answers. No inferred independent mastery, fake XP or level. Existing feedback, source excerpt, retry and evidence export remain.
6. **Keep my work** remains the existing notes/evidence/export view. A callback switches views; only actual save handling reports successful device persistence. Notes/attempts/resume formats and source/provider/server/router remain unchanged.

Direct practice/evidence links continue to work after reviewed-source loading. The separate legacy `/learn` route and the prepared `/classroom` without a lesson ID are not redesigned by this task.

## Useful app path for future clips

From Home choose **Try the guided example** → review/save material → create a supported local or consented AI lesson → open with KAIRO → Begin reading/Resume → inspect a citation → choose3D explicitly → stop narration/switch back to reading → Practise → inspect the practice record → Keep my work → add an explanation → download working → reopen/resume.

For the **motor** part, use the Engineering link from the lesson. It retains source lesson context for returning, but the prepared motor has its own sources/calculations. An arbitrary upload has not become a motor simulation. The next product step is a single reviewed motor teaching objective tied to the specific parameter/exercise, followed by scenario/domain review. Do not film a stitched mock as proof that automatic arbitrary3D generation exists.

## Evidence and limits

`studio/tests/journey-integration.test.mjs` loads the actual entry component, planner adapter and integrated LessonPractice via Vite SSR. It tests real reviewed-source loading, source mismatch, cancellation-before-entry, validated cursor behaviour, truthful saving notices, existing-shape attempt mapping without mutation, and actual practice card markup. The first test run caught a test fixture missing its AbortSignal; corrected the fixture, not production code. Focused suite9/9. Full suite and final build outputs are retained as full-tests.txt and build.txt. Build refreshes local dist; no public deployment.

Preserved existing narrator cancellation/resume/storage tests. This is deterministic Node/SSR and compiler evidence, not screen-reader/browser/phone/audio/learner acceptance. Browser capture remains unperformed. Existing large-chunk warning remains. No cloud calls, installs, pricing changes, external posting, verified credentials, new schedule or automatic recording.

Remaining limitations: historical attempt assistance is unknown; study storage retains its existing schema; supported question counts do not independently establish correctness; open reflection still needs separate assessment; motor physics/source alignment needs domain review; revenue, partner rewards, employment outcomes and SASL are not delivered by this change. Existing experimental next-attempt labels are unchanged and are not validated mastery.
