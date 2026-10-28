# Issue #47 — isolated reviewed-source picker — 25 October 2026

Session `gpt6-kairo-chief-issue47-20261025-a`, GPT-6, effort unknown; GitHub-connected remote session, **not** the canonical local SQLite bus. Owner authorised scoped merges, not production deployment or forbidden browser/recording access. A fresh #47 GitHub plan/claim was posted before editing.

## Actual implementation and user value
- New `studio/src/source-selection/ReviewedBundlePicker.tsx`: standalone semantic source checkbox fieldset/legend, source title + abbreviated reviewed revision, max eight current reviewed records, purpose question, loading/error/recovery/status, Cancel and Refresh, exact selected source/revision check, read-only private POST `/api/workspace/bundle-preview`. It never calls `/generate`, never sends provider consent, never persists a lesson and labels excerpts as NOT a generated/saved lesson.
- New `studio/src/source-selection/selection.d.mts`: static TypeScript type declarations for previously merged JS selector, no runtime changes.
- New `studio/tests/reviewed-bundle-picker.test.mjs`: ten regression cases using the actual TSX module via Vite SSR, semantic markup/escaping, malicious/invalid catalog, exact sourceRef local-only API payload, stale revision, bounded response metadata, auth/409 safety errors and cancelled request.
- This unique dated handoff. No changes to shared `SourceWorkspace.tsx`, routes, CSS, scripts, cloud/IAM/provider, previously accepted `selection.mjs` or active Issue #46 backend paths.

## Acceptance and evidence boundary
GitHub Actions on PR exact-head Node24 full serial tests/TypeScript/Vite production build + Python coordination bus are **required**; no preemptive green claim. SSR and pure request tests are automated *not* browser/device/keyboard/screen-reader observations. Prior browser observation denial remains binding. DO NOT merge/mount user-facing component as working before independent technical/UX review and authorised real app/device acceptance under Issue #5.

## Risks and decisions
- Private catalog metadata comes from authenticated v1 `reviewedSources`, does not contain reviewed source passages; local preview endpoint separately rechecks owner and revisions server-side. Client checks are convenience only.
- A successful read-only preview is neither a real lesson nor a cost/performance/user effectiveness measure. No learner outcome, sales or SASL readiness is asserted.
- Existing single-source route remains unmodified; v2 saved lesson endpoint/persistence is Issue #46 (different owner). Mount source UI only when the shared file claim is authorized, with proper current account session handling and focus/refresh tests.

## Two follow-on candidate tasks (not automatically activated)
1. **P0 frontend integration:** after #47 isolated component review, authorised browser/device setup and explicit shared `SourceWorkspace.tsx` file claim, mount behind private account catalog and provide source→preview→v2 route as server capability allows. Test 360px/200% zoom, keyboard, screen reader, cancelled network, revision changes and legacy v1 continuity; #5 owner supplies real-device evidence.
2. **P0 backend journey lifecycle:** continue Issue #46 to mounted private v2 save/read/invalidating-source, correct cited practice/draft/studio fallbacks and resumed learner working. Require exact-head CI, auth/account switch and quote range regression plus independent reviewer; do not silently pretend v2 is v1.

This handoff records a scoped code slice, not a full end-to-end feature acceptance or production release.
