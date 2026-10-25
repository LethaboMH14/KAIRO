# Connected editable lessons handoff

Date: 23 October 2026. Root `codex-editor-integration-20261023-r`, Codex / GPT-6 / effort unknown. Root tasks EDITOR-INTEGRATION-007, EDITOR-FLOW-STYLES-007 and EDITOR-REGRESSION-007. Final verification is recorded in `docs/editor-build-20261023/verification.json`.

## Delivered and integrated

Implemented the live material → review → editable lesson → separate learning copy → classroom reading/practice/evidence path. The host has controlled block editing, source-linked live preview, layout choices, debounced/manual saves, conflicts, undo/redo, history restore, bounded import/export and shared-narrator cancellation. The classroom renders the full edited document. Publishing allocates a fresh lesson ID and keeps original questions/attempts/resume identity unchanged.

Source/draft history uses the separately reviewed built-in SQLite version store. Source correction uses expected-revision CAS. Historical lessons load their exact retained source revision before checking citation locators, offsets and quoted bytes. Legacy JSON seeds the first observed snapshot; already lost historical revisions cannot be recreated. Draft history is append-only and stale saves receive 409 without overwriting newer content.

New uploads can explicitly retain an original file for private comparison. PDF.js 6.4.299 (Apache-2.0) and its worker are pinned/bundled; no global tool or arbitrary authoring framework is required. PDF/image view opens on demand, first-four-page PDF navigation and bounded canvas allocation are implemented. Attachment download covers other supported formats. Removing original bytes preserves extracted text/history. Previously deleted upload bytes cannot be recovered.

## Ownership and review

- Worker A: domain schema/actions/provenance/question identity, 8 focused tests, independently read and integrated. Untouched chapters round-trip exactly; teaching edits project in block order.
- Worker B: stateless editor UI and a separately claimed follow-up removing a literal C badge, reflection splitting and misleading practice-first label. Selected C palette/wordmark retained.
- Worker C: SQLite version store, 6 focused tests, reviewed against real route CAS/history behavior.
- Worker D: original material UI, 12 focused SSR/mock checks. Root found type errors and canvas-resource concerns; owner corrected them before completion.
- Existing chat **Implement lesson resume package** accepted read-only review, reran 22 host/domain/store tests and found copy-out loss in legacy saved-reading/export paths. Worker E received a published, bounded continuity/export follow-up; see its handoff and final verification for closure.
- Existing chat **Add narration cancellation evidence** declined the viewer assignment; no work or receipt is attributed to it. D was reassigned to the active worker. An older unrelated research claim remains owner-controlled.
- Claude scopes were inspected and respected. No Claude response or acceptance of this package is assumed. The bus is pull-based and no watcher/model invocation was installed.

## Root changed paths

`studio/server/workspace/routes.mjs`; `studio/src/workspace/{SourceWorkspace.tsx,types.ts,material-flow.css}`; `studio/src/source-classroom/{session.ts,SourceClassroom.tsx}`; `studio/src/StudioRouter.tsx`; `studio/src/lesson-editor-host/`; `studio/tests/{editor-integration.test.mjs,lesson-editor-host.test.mjs,material-integration.test.mjs}`; `studio/package.json` and lock; published contract and root evidence/docs/handoff. Worker-owned paths are detailed in their own handoffs.

## Checks and limits

The pre-copy-out aggregate passed 521/521, including actual backend HTTP routes with temporary synthetic sources, real SQLite CAS, actual React host under deterministic mocked hooks, SSR escaping, cancellation and existing regressions. TypeScript plus Vite production build passed. The test runner emits dependency-scan shutdown diagnostics in some SSR suites; named tests still pass. Build reports an existing >500 kB chunk warning; PDF worker is about 1.26 MB and lazy-loaded. No mobile performance claim is made.

Local preview at 127.0.0.1:4188 was restarted from a verified app process, preserving cloud-enabled configuration, and its backend health endpoint returned OK. No paid cloud inference, new deployment, public exposure, browser observation, screenshot/headless/CDP, voice or physical-device check was performed. Final copy-out counts/build/restart evidence supersede the intermediate checkpoint in verification.json.

This remains a loopback-only local pilot without tenant authentication or cloud draft sync. File signatures, content-type policy, hash checks and resource bounds are not antivirus or a complete security certification. Authored explanations/examples/reflections remain unverified. Scored question editing is intentionally limited to display heading/reorder/removal; new authored questions are ungraded reflections. Layout templates arrange cards and do not generate arbitrary HTML or new 3D worlds. The deleted schedule remains off.

## Judging and next acceptance

Product: a real editable end-to-end learning copy with protected source/progress identity. Usability: recoverability and honest saved/conflict/error states. Creativity: restructure teaching without losing source anchors. Sustainability: local saves/editing do not require paid inference. Impact: reading alternative and checkable source text. Presentation: one reproducible story for demo capture once human review is authorized. Intelligence: structured evidence/provenance rules preserve assessment meaning; no prediction or learning improvement is invented. Detailed need/check/evidence/gap mapping is in `docs/editor-build-20261023/README.md`.

Next: real PDF/keyboard/phone/audio acceptance; targeted AI rewrite proposals reviewed before application; richer material library search/annotations; then separately scoped account/cloud deployment. Employer verification, incentives, production scraping and arbitrary simulation generation remain outside this delivery.

## Final integration review corrections

Worker E closes the independent review's copy-out gap: optional validated `editedReading` preserves block order/kinds/text/options/citation IDs and recorded arrangement in device reading, pack Markdown and notes export. Saved reading honestly uses a linear page while recording the chosen arrangement. Legacy packs still parse, source labels carry citation IDs, personal reflections stay ungraded and answer keys are stripped from the device projection. Quiz attempts remain in the existing notes/working export, separate from reading-pack notes. Root review caught a native split-ID regex mismatch and missing citation IDs in exported passage labels; owner corrected both and added regression assertions. Focused E tests pass 3/3. No ownership overlap was introduced.

Root also normalizes restored native wording/headings to their original provenance before validation, so editing and typing the original back does not fail. Actual-host suite now passes 9/9. Package/lock engine metadata now requires Node >=24, matching the verified 24.18.0 runtime and the direct shared TypeScript-domain backend import. Final aggregate after these corrections passes 525/525.

Final `npm run build` exits 0 (TypeScript plus Vite); final local preview restarted at4188 and backend health `ok:true`. Worker E handoff is complete. Root's integrated build supersedes the worker's standalone declaration-check limitation; it does not supersede the pending human/device acceptance. Root verification.json pins the checked files and results.
