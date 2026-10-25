# Pump teaching host regression checks

This package exercises the actual `studio/src/studio-teaching-host/PumpHost.tsx` with Vite SSR. A narrow test plugin substitutes only the heavyweight PumpLab and StudioCompanion display components, the lesson-plan display, and the teacher hook. The host itself, pump session restore/serialization, pump evidence/report generation, and learner storage adapter are loaded from the real source.

The learner needs the pump activity to preserve its originating lesson, keep KAIRO context in step with meaningful task changes, recover safely around unreadable saved work, and retain honest, bounded practice evidence. These checks target Product (return to the same lesson and keep the teaching panel connected), Usability (clear back destination and narration continuity), Sustainability (bounded retained records), and Intelligence (state-based context with no credential or competency overclaim).

## Result

Run from `studio/` with `node --test tests/pump-teaching-host.test.mjs`. See [CHECKS.txt](CHECKS.txt). Six checks pass. One intentionally exposed regression remains: for an invalid `lesson` query, the host sends the learner to `/studios` while the supplied exit label says “Back to my lesson.” Root owns the product fix; this task contains test and evidence files only.

## Scope and limits

The hook harness renders the real host's React element tree and allows its actual callbacks to be driven deterministically. The fake teacher supplies only narration state and stop callbacks. PumpLab and the companion are presentation stubs; no simulation/browser/camera/voice runtime is exercised. These checks do not establish whole-app build, device behavior, or learner validation.
