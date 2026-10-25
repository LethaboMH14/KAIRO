# TEACHER-001 handoff

Owner: codex-teacher-20261021. Client: Codex. Model/effort: unknown.

## Delivered

User selected capability over a fixed look; soft cinematic adult 3D is the default direction, with graphic and realistic options retained. Concept PNG generated using built-in image generation at assets/design-reference/teacher/avatar-directions-v1.png. This is design reference, not a licensed rigged model. Prompt and researched architecture are in docs/TEACHER-AND-INTERACTIVE-SOURCES.md.

Added studio/src/teacher/{model.ts,TeacherProvider.tsx,TeacherSettings.tsx,SourceReader.tsx,StockExplainer.tsx,teacher.css}. Router wraps pages in TeacherProvider and adds /teacher. SourceWorkspace keeps editable review and adds interactive reading. LessonWorkspace shares narration and opens the current chapter's cited evidence through “I’m lost here”. Browser-local settings and version-scoped annotations do not sync across ports/devices.

Added server/workspace/passages.mjs and generatePassageHelp in server/google.mjs. workspace/routes.mjs adds POST /api/workspace/passage and GET /api/workspace/teacher-reference. Requests require explicit consent, existing reviewed source/immutable lesson, exact revision and valid offsets. Server owns context and validates returned anchor. Only explain/translate and known languages allowed. Limits: selected text 1200 characters, nearby context 2800, one request at a time, 30 per process lifetime and cooldown. Citation traceability is not factual or translation-quality verification. No arbitrary generated app actions execute.

## Evidence

TypeScript/Vite production build passed; all 19 tests passed including five new teacher tests in studio/tests/teacher.test.mjs. Shared renderer chunk warning remains. Live HTTP evidence and browser results: data/private/app-workspace/teacher-verification.json. Real Google calls used authored shopkeeper sample only, not private coursework. Explanation and draft Afrikaans translation returned exact validated anchors.

Browser confirmed settings image/list of actual voices, exact sentence selection 220–310, highlight/star persistence after reload, stock animation ending at 23, and contextual lesson help opening cited reader. Export clicked; no matching Downloads file found, so file delivery unverified. Voice choice selected, but speech quality/start/end and pronunciation not verified. Mobile layout not checked. Local preview http://127.0.0.1:4176/teacher and /learn?lesson=fa62224bf62b7acf3ddf189e; production server loopback only. Prior ports left intact.

## Remaining work

Full humanoid rig, expression blending, lip sync, target registry, gaze/IK and authored movement anchors remain future implementation. Current settings are preferences; they do not change a live 3D teacher. SASL is a truthful external resource route, not automatic signing. Stock visual is a local authored template, not generated video. No Remotion/VRM runtime installed, no cloud voice integration or new ML training. Learner recommendations remain existing transparent recorded-answer rules. No public deployment or accredited certificate.

Next increment should reserve an isolated avatar subtree, select and licence a rig with fingers/facial morphs, then implement idle/listen/explain/point synchronized to actual target and speech state. Validate SASL separately with Deaf SASL reviewers. Claude Engineering claims remain untouched and its interim module remains unintegrated.
