# First-use and recovery audit handoff

**Session:** codex-luna-first-use-audit-20261024-a1
**Client settings exposed:** Codex; model gpt-6; effort unknown. The requested gpt-6-luna / low-effort setting was not exposed to this session and is not claimed.
**Task:** FIRST-USE-AUDIT-001
**Owned scope:** docs/first-use-audit-20261024/; coordination/handoffs/2026-10-24-first-use-audit.md.

## Delivery

Created docs/first-use-audit-20261024/README.md, a source-only review of Home → material → source review → lesson → engineering → practice → evidence → resume and the account boundary. It includes code references, learner expectation/recovery mapping, import/generation limits, a storage truth matrix, official product-pattern sources, observable acceptance checks, a bounded follow-up queue and explicit judging/acceptance limits.

The review confirms the existing local loop is substantial: source revisions and citations, local reading/lesson, practice, notes/export and guarded resume have useful recovery paths. Key risks and current status are clear:

- The earlier first-12,000-character prefix routing finding is addressed by root’s goal-ranked lexical selector integration. Current source passes goal for local/cloud generation, checks the full reviewed revision hash, preserves citations, and shows selection method/count on the lesson. Cloud consent labels goal-selected text and its 12,000-character cap. Residual: exact selected passages are not previewed before consent; lexical selection is not semantic. The 48,000-character / 64 KiB source-review limit remains separate. No stale prefix claim remains in the learner-facing Studio source reviewed.
- Upload and generation failure recoveries are less actionable than classroom and profile recovery; Stop waiting is UI cancellation only, with a warning that an already-sent extraction can finish on the app host.
- Storage differs by record: sources and lesson catalogue live in the local app-host workspace, many notes/progress records use browser localStorage, and one evidence simulation remains in page memory until export.
- Hosted Identity Platform/Firestore progress CRUD has real two-account evidence, but account UI/session mount and owner-scoped source/lesson migration are not integrated. Do not mark account resume or in-app hosted learner use accepted.

## Evidence and checks

- Reviewed current source and handoffs: studio/src/kairo/Home.tsx, studio/src/kairo/Services.tsx, studio/src/workspace/SourceWorkspace.tsx, studio/src/workspace/LessonWorkspace.tsx, studio/src/source-classroom/SourceClassroom.tsx, studio/src/source-classroom/session.ts, studio/src/classroom-resume-policy/model.ts, studio/src/classroom-recovery-ui/ClassroomRecovery.tsx, studio/src/profile/ProgressPage.tsx, studio/src/practice/PracticeStudio.tsx, studio/src/evidence-workspace/EvidenceWorkspace.tsx, studio/src/engineering/EngineeringStudio.tsx, studio/src/account-ui/AccountPanel.tsx, studio/src/studiorouter.tsx, studio/server/workspace/routes.mjs, studio/server/workspace/native-extraction.mjs.
- Read coordination/briefs/account-wave-20261024/CONTRACT.md, docs/hosted-foundation-20261024/README.md, coordination/handoffs/2026-10-24-hosted-foundation.md, and coordination/handoffs/2026-10-24-data-visible.md.
- Official interaction-pattern sources (checked 2026-10-24) are linked in the audit: Gemini Notebook source selection/citation help; Khan Academy mastery feedback help; Duolingo Practice Hub and Explain My Answer posts. Root reports tests/goal-evidence-integration.test.mjs passes for late-text evidence, exact anchors and stale rejection; an exact count was not provided and this audit did not run it. Full suite/build remain pending.
- No tests, build, browser, device, accessibility session, learner validation, private-record inspection, network/cloud mutation, code change or deployment was performed. Existing test/build/cloud receipts are not re-presented as this audit’s checks.

## Ownership, review and limits

Only the two claimed documentation paths were changed. No runtime, router/provider/session, manifest, account, evidence-selector or status files were edited. Root should review and assign the bounded local-recovery, account mount, migration, engineering storage-status and device-acceptance packages in the audit. Root integration/session ownership, Worker A account UI ownership, Worker B evidence-selector ownership and existing shared-runtime claims remain respected.

This is an evidence-backed source audit, not an in-app/device acceptance. It does not establish hosted account continuity, full source/lesson migration, device/browser accessibility, or learning outcomes.
