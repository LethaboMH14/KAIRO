# PRACTICE-001 handoff

Agent `codex-practice-20261021`, Codex, model/effort unknown (not exposed). 21 October 2026.

## Delivered

- `/practice?lesson=fa62224bf62b7acf3ddf189e`: authored stock-control case linked to the existing generated shopkeeper lesson.
- `/practice`: standalone version with explicit authored-training context.
- `/progress`: browser-local subject progress, format choices, first/latest answer metrics, case history, explained next-practice recommendation and portfolio export.
- Source/lesson navigation and an eligible-lesson workplace CTA; existing prepared routes preserved.

The shop is code-authored, with a selectable shelf (21 displayed notebook units), sales register, delivery crate and damage book. Native evidence controls provide identical information without 3D. Four tasks cover calculation, evidence-based reconciliation, decision consequences and a written handover. First attempts and retries remain separate. The task engine prevents skipping required steps, concluding without all four records, or completing after unsupported decisions. Reflection length is checked, not writing quality.

Profiles use explicit subject and per-lesson format choices. Recommendations are transparent rules over saved outcomes. No cognitive diagnosis, learning-style assignment, trained prediction, competence verification or accredited certificate is claimed. A practice portfolio is self-reported activity, not independent assessment.

## Files / interfaces

- `studio/src/practice/model.ts`: pure state machine, source-template compatibility, rubric and case-record adapter.
- `studio/src/practice/ShopScene.tsx`: optional lazy Three.js scene, CanvasTexture signs, demand rendering, reduced-motion support.
- `studio/src/practice/PracticeStudio.tsx`, `practice.css`: learner case, evidence desk, action replay/resume and source-linked Markdown export.
- `studio/src/profile/model.ts`: versioned/bounded profile parsing, upserts, metrics, recommendation logic and portfolio formatter. Storage key `kairo-learning-profile-v1`, maximum 50 lessons / 20 runs.
- `studio/src/profile/ProgressPage.tsx`, `profile.css`: profile and portfolio interface.
- `studio/src/workspace/LessonWorkspace.tsx`: explicit subject selector, saved profile contribution, explained recommendation, eligible workplace-case link. Profile read failures are separate from existing lesson-note reads.
- `studio/src/workspace/SourceWorkspace.tsx`: My progress navigation.
- `studio/src/StudioRouter.tsx`: lazy practice/progress routes.
- `studio/tests/practice.test.mjs`: six behavioural tests, alongside eight prior tests.
- `docs/WORKPLACE-PRACTICE.md`: interface proposal, design, implementation and product boundaries.

No dependency, backend, cloud configuration, public deployment, root launcher or Engineering-owned file was changed. Claude's ENG-001 remains marked interim/not ready for integration; its claims remain respected.

## Evidence and limitations

The first production build passed and all 14 tests passed. Browser checks verified actual mesh selection opening the shelf evidence; a wrong calculation; inspection of all four records; rejection of an unsupported cause and accusation; correction; replay/resume at the reflection stage after reload; handover completion; and per-check first/retry reporting.

Actual browser export was downloaded and inspected: `C:/Users/USER/Downloads/KAIRO-practice-7bba7775-459d-4727-b226-538af8c89030.md`, 2,836 bytes. It includes wrong attempts, reflection, source revision, exact source passage and the non-accreditation boundary. Verification report: `data/private/app-workspace/practice-verification.json`.

The browser download helper took unusually long to return even with an explicit timeout; avoid waiting on that helper again. The download itself was real and verified on disk.

The final production build passed (2,158 modules, 17.64 seconds) and all 14 tests passed after the profile/notes storage separation fix. Existing shared-renderer chunk warning remains.

The final browser profile showed the preserved lesson note and selected chapter; the new Business operations subject; one unanswered lesson question as the explained next recommendation; the completed case; all three checks requiring retries; and its inspectable action trail. The linked lesson CTA was present. These are authored demo/test actions, not evidence of the human user's ability.

At a 390-pixel phone viewport, profile and case document width was 375 pixels (no page overflow beyond the scrollbar). The case opened the evidence desk with zero WebGL canvases, and restored the completed record. The temporary viewport override was reset. This is a responsive-browser check, not physical low-end-phone performance measurement.

No paid call was made for this increment. Device-wide portability, a multi-user server profile, independent learner acceptance, different numerical case variants and outcome evaluation remain future work.
