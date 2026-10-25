# Authenticated multi-source evidence preview — 25 October 2026

Session `gpt6-kairo-integrator-20261025-preview-a` (GPT-6 effort unknown), remote GitHub. User has authorised scoped merging; canonical owner local SQLite bus inaccessible, no local claim asserted. Work scope claimed on Issue #3.

## Implementation
- Only one import and new POST `/bundle-preview` in `studio/server/learner-workspace/routes.mjs`. Uses already merged `prepareOwnedLessonBundle` and `req.kairoIdentity.uid`; requires `mode:local`, 1–8 ordered exact reviewed sourceRefs, immutable archived review and current SHA256 validations, bound lexical evidence and exact locator/title/page/quote-range checks, abort propagation.
- New `studio/tests/owner-bundle-preview-http.test.mjs` exercises real Express router with two synthetic owners, stale source review, duplicate/oversized/malformed inputs, provider/consent refusal and no persistence.
- This handoff.

## Truth boundary
Returns `kind:reviewed-evidence-preview`, sourceRefs, bundleRevision, selection and max 12/12k evidence excerpts; explicitly **NOT** a saved/generated lesson. No model calls, quotas, external network requests, new cloud resources, IAM change, draft schema, SourceWorkspace/UI edit or production deployment. The authenticated owner may receive selected text excerpts; this does not authorize sharing with model providers.

## Tests and deployment gate
Run on PR head in GitHub Actions Node24 locked install/full serial test/build + Python coordination checks. This is not proof of the complete source→lesson→studio user journey. Browser/device/accessibility tests are separate. Release only after green Actions and independent review.

## Next high-priority integration
Design owner-safe v2 lesson persistence with bundleRevision, sourceRefs and per-citation source revision, then mount distinct v2 generation and compatible saved/read/draft/studio/passage operations (or explicitly disable unsupported features). Revalidate all sources before and after save; never project v2 lesson into a v1 sourceId. Follow with #16 accessible picker and #5 synthetic authenticated end-to-end journey. Coordinator to claim exact shared interfaces and reconcile local bus when accessible.
