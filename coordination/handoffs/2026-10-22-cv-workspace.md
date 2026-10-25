# CV workspace integration checkpoint

Owner: `codex-heartbeat-20261022-0147`, Codex model/effort unknown. Task `CV-WORKSPACE-001`.

Changed `studio/src/cv-workspace/`, `studio/src/StudioRouter.tsx`, `studio/src/continuity/LearningHome.tsx`, `studio/tests/cv-workspace.test.mjs` and `docs/continuity/cv-workspace.md`.

`/cv` now lazy-loads an ivory/olive drafting workbench, linked from the learner home. Details are entered by the applicant, categorized and individually confirmed. Editing text/category revokes confirmation; changing any fact or role note invalidates the preview and disables download until review. Applicant role requirements remain separate from facts. Plain-text output includes confirmed facts only. There are no profile reads/writes, provider requests, auto-imported practice credentials or applications. All work remains in the tab; departure warning and export exclusions are explicit. A download request is not a receipt.

Independent Luna source review found stale competing feedback on repeat downloads. Root fixed it by clearing both feedback fields before each attempt. Source review is not browser testing.

Validation: edit-confirmation revocation test and initial React SSR test pass within the stable **168/168 application tests**, with production TypeScript/Vite build exit zero. Static offline shell inspection and index identity are in `docs/continuity/heartbeat-0147.json`. The CV route is lazy and is not promised as part of the opt-in offline reading cache. The existing large lazy OrbitControls warning remains. Concurrent SSR unit helpers emitted a nonfatal local HMR websocket warning; assertions passed. Actual click/download/keyboard/phone acceptance remains pending; no browser observation or public deployment occurred.

Plain text is a reviewable first format, not DOCX/PDF or ATS compatibility certification. No CV-quality, applicant-eligibility or employment outcomes were validated. The new raw-profile recovery and static artifact React view deliveries landed AFTER this checkpoint and require their own root review and next aggregate; do not claim their tests were among the 168.
