# WORKSPACE-001: source-to-studio learner integration

Agent: codex-workspace-20261021; client Codex; model/effort unknown (not exposed). 21 October 2026.

## Outcome

Implemented `/sources` and `/learn?lesson=<24-hex-id>`. Material selection, upload, local extraction/OCR review, reviewed-text saving, local or Vertex lesson creation, source inspection, dynamic classroom board, reading connections, formative practice, explicit presentation preference, saved browser progress/notes and Markdown export are connected.

Preview: http://127.0.0.1:4175/sources

Live generated demo: http://127.0.0.1:4175/learn?lesson=fa62224bf62b7acf3ddf189e

The final `node server.mjs --production` preview is running on loopback port 4175. The older 4174 preview was not stopped.

## Changed files and interfaces

- `studio/src/workspace/`: SourceWorkspace, LessonWorkspace, shared types, learning helpers and scoped CSS.
- `studio/src/StudioRouter.tsx`: lazy source and lesson routes; prepared routes preserved.
- `studio/src/App.tsx`: source navigation and current modal wording.
- `studio/src/lecture/LectureScene.tsx`: optional `board: {title, line, count}`. Existing prepared lecture defaults preserved. Source lessons reuse the room; no new geometry is generated.
- `studio/server/workspace/model.mjs`: bounded review, evidence, local reading and cloud-output validation.
- `studio/server/workspace/routes.mjs`: catalog/import/text/upload/jobs/review/generate/lesson APIs.
- `studio/server/workspace/smoke.mjs`: HTTP integration checks with authored fixtures and optional synthetic OCR image.
- `studio/server.mjs`: workspace routes before the small global JSON parser; exact local Host/Origin validation; shutdown closes remaining connections.
- `studio/server/google.mjs`: structured lesson generation. Windows local authentication now uses vendor `gcloud.cmd` through fixed cmd.exe arguments. The previous PowerShell launcher timed out. Credentials remain in server memory. Request timeout starts after authentication.
- `tools/course_sources/app_worker.py`: fixed-path worker with upload/package/image limits and first-four-page extraction using the existing CPU OCR environment.
- `studio/tests/workspace.test.mjs`: review/citation bounds, invalid output, adaptation and export checks.
- `docs/JUDGING-STRATEGY-AND-DEMO.md`, `docs/SOURCE-WORKSPACE.md`: user intent, evidence, demo and limits.

The frontend contract is `studio/src/workspace/types.ts`. Lessons are immutable snapshots with source ID/title, reviewed revision, mode/model, objective, chapters, quiz and exact evidence. Citations have locators, offsets and learner-edit flags. Student text and filenames saying memo are not automatically official answer keys.

Private data is in ignored `data/private/app-workspace`, outside static assets. APIs resolve known/random IDs, not arbitrary browser-supplied paths. Originals are unchanged. No new package dependency, public endpoint, MCP host installation or Engineering integration was added.

## Verified evidence

- Final production build passed, 2151 modules. Existing shared renderer large-chunk warning remains; low-end-device performance is not measured.
- Eight Node tests passed: three existing and five workspace tests.
- Eight HTTP integration checks passed: catalog omits original paths; review required; stale revision rejected; cloud consent required; reviewed citations/edit flag persist; foreign origin rejected; uploaded text extraction; uploaded image OCR.
- Real Vertex request through the app API saved three chapters and two questions, model `gemini-3.5-flash-lite`, 45,657 ms in that run. Only authored stock-control text was sent; private coursework stayed local during testing.
- Desktop browser verified source selection, readable extraction, review acknowledgement/save, actual 3D lesson rendering, chapter navigation, wrong-answer evidence opening, correct retry, personal note and persistence after reload.
- Actual browser Markdown download verified on disk: 4,774 bytes, with personal note, source revision, both practice outcomes and source passage. File: `C:/Users/USER/Downloads/KAIRO-fa62224bf62b7acf3ddf189e-notes.md`.
- Private reports: `data/private/app-workspace/integration-verification.json`, `cloud-verification.json`, `browser-verification.json`.

Browser automation initially timed out, then recovered. Reloading during Vite's dist replacement briefly produced the missing-static-file response; the completed build loaded and saved state survived. Cloud creation was checked through HTTP rather than clicking the entire browser generation sequence. Mobile viewport, narration audio and independent learner acceptance remain unverified.

## Limits and coordination

Local reading is extractive source recognition, clearly labelled. Cloud paraphrases and question correctness still require source review; exact quotation and ID checks establish traceability, not truth. Coverage is bounded and disclosed.

Help after an error uses a transparent rule; format choice is explicit and per lesson. No trained learner profile, prediction, workplace scenario, recording vault, accredited certificate, verified workplace skill or local-language avatar is claimed. Public use needs multi-user authorization, durable storage/deletion controls, isolated workers and traffic/cost controls.

Claude message 8 marks ENG-001 interim and not ready for integration. Engineering and `.claude/launch.json` claims were respected. Read its final handoff before integration.
