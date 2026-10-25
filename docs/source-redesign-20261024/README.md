# Staged source workspace redesign

**Task:** SOURCE-REDESIGN-001  
**Session:** `codex-luna-source-redesign-20261024-a1`  
**Client settings exposed:** Codex; model `gpt-6`; effort `unknown`.  
**Scope:** source workspace component, its workflow UI helpers and CSS, focused UI tests, and this evidence note. No router, provider, auth, server, shared schema, package, or manifest edits.

## Learner need and judging targets

Learners need one clear next action as they choose material, check what the app extracted, and shape a lesson. They must keep the chosen source and revision visible, understand where it is stored, inspect the passages selected for a goal before cloud consent, and recover from sign-in or a long extraction without losing their current draft.

- **Product:** preserve the reviewed source, exact revision/citations, local-reading fallback, consent and editing gates.
- **Usability:** keep the active step clear, use plain labels, retain source and goal context, and explain when waiting stopped versus when the app confirmed cancellation.
- **Intelligence:** preview the actual selected evidence returned for the current goal; do not describe the lexical selector as semantic understanding or claim the preview proves entailment.

Automated evidence is the two real-component test files listed below. Browser/device, accessibility-tool, human learner and hosted-session acceptance remain open.

## Design plan and review

**Color:** keep the existing KAIRO chalk `#f5f0e6`, paper `#fffdf7`, moss `#3e5144`, graphite `#252b28`, sage/line `#d7dbce`, and copper focus outline. **Type:** inherit the current `KairoManrope` / Manrope system. **Layout:** a narrow reading path and persistent source strip lead into one active workspace pane; selection is a library, review is a source/original comparison, and shaping pairs the lesson goal with a passage preview and explicit creation choices. On a narrow viewport, each stage stacks rather than compressing the three-step workflow into columns.

```text
┌ Your material. Your way in.     [Material] [Check source] [Shape lesson]
├ Status: next action                                      Storage label
├ Selected source · saved revision · review state
└ One active stage
   Choose: library / paste / upload
   Check: original | extracted text | review and save
   Shape: learner goal | optional selected-passage preview | consent / local
```

The selected direction is a staged, single-task workspace. The alternative of showing library, review and planning as simultaneous columns makes the current action compete for attention and collapses poorly on phones. The accepted design keeps alternatives available inside their appropriate step, does not add a global progress score, and does not turn the workflow into an LMS grade or course-completion claim. Existing C identity, citations, review acknowledgement, original comparison, editor, local reading, and cloud-consent gates stay in place.

## Delivered behavior

- A compact journey header, visible storage label/scope and persistent selected-source strip show the exact saved revision through lesson shaping.
- `/catalog` scope is accepted only as `local` or `account`; its returned label is rendered as text. Missing/invalid scope or label is shown as unavailable, never guessed to be device-only or account-backed.
- The private cloud-copy controls appear only in the returned `local` scope. Account uploads use account-specific retention wording and disclose: “File processing runs in Johannesburg. Queue metadata is handled in Europe.” Local scope copy describes the local app workspace, not the learner’s physical device.
- Upload help retains the native-extraction and 48,000-character review bounds, and says the separate OCR preview covers up to four pages and may miss image content; it does not promise whole-image understanding.
- The source-workspace API parser preserves JSON behavior while retaining plain-text HTTP errors such as a 401 “Sign in again…”. That state offers `/account` in a new tab, leaving the current tab and pasted corrections open. Same-origin credentials are explicit.
- An optional read-only passage preview requests the current source and compiled goal. Its result is cleared on source/revision or goal edits, bounded to 250 entries and 12,000 quoted characters, escaped by React, and displayed with the returned locator. Preview failure remains visible but does not disable local reading.
- Upload polling shows queued versus extracting states. Stop waiting invalidates the current result so it cannot replace the screen. When a job ID is known it sends a same-origin `DELETE /api/workspace/jobs/:id`; “cancelled” appears only when a successful JSON response explicitly returns `{cancelled:true}`. A local 404/405 or other unconfirmed result keeps the truthful “did not confirm cancellation; … may still finish” message.
- `/catalog` can include `jobs: [{id,name,status}]`. When present, a compact **File processing** list restores those jobs after reload. The learner explicitly chooses Resume for queued/extracting jobs, Open source for ready jobs, or Check status for error/cancelled jobs. These actions use the same `GET /api/workspace/jobs/:id` polling and cancellation path as upload; a ready job must return its source. Missing or malformed optional job lists are treated as empty, which keeps local catalogs without jobs working. Resuming a ready job opens its returned source while preserving an unsaved pasted passage.
- Upload-job responses can be queued before extraction. Ready responses must include a source; errors, cancellation and timeout get distinct recovery text. Existing text review, source-revision checks, cited lesson planning, before-unload protection and local fallback remain.

The preview endpoint contract used here is the parent-published `GET /api/workspace/source/:id/selection?goal=...` with `{selection,evidence:[{id,locator,quote,start,end,...}]}`. This UI currently renders the `evidence` locators/quotes and does not trust extra metadata. The optional preview is not a precondition for local or cloud creation. The processing list uses the parent-published optional `/catalog` jobs summary and existing job GET/DELETE routes; root owns and must verify those implementations.

## Changed files

- `studio/src/workspace/SourceWorkspace.tsx` — staged context, storage-scope handling, preview, sign-in recovery and extraction wait/cancel behavior.
- `studio/src/workspace/material-flow.css` — unchanged; remains imported for the existing C palette and base layout.
- `studio/src/source-workflow-ui/SourceWorkflowPanels.tsx` — returned storage note, accessible passage-preview panel and restored processing-job panel.
- `studio/src/source-workflow-ui/source-workflow.ts` — safe local API response parsing, cancellation acknowledgement and scope wording.
- `studio/src/source-workflow-ui/source-workflow.css` — scoped responsive treatment for the new panels.
- `studio/tests/source-workflow-ui.test.mjs` — actual SourceWorkspace SSR/event harness and helper tests, including restored queued/ready/error/cancelled jobs; fixtures are explicitly synthetic.
- `docs/source-redesign-20261024/CHECKS.txt` — captured commands, results and test names.
- `coordination/handoffs/2026-10-24-source-redesign.md` — parent review and integration handoff.

No third-party images, fonts or other licensed assets were added.

## Checks run

From `studio/`:

```text
node --test tests/source-workflow-ui.test.mjs tests/material-integration.test.mjs
14 tests passed, 0 failed.

node node_modules/typescript/bin/tsc --noEmit --pretty false
exit 0, no diagnostics.
```

The UI tests render the actual `SourceWorkspace` and its real child panels through installed Vite SSR. Event props are invoked with deterministic Node fetch/timer mocks for goal invalidation, pasted-text sign-in recovery, selected passages, local fallback, restored jobs after reload, ready-source opening with paste preservation, terminal statuses and acknowledged/unacknowledged cancellation. This is provider/event simulation only; it does not exercise a real React DOM/browser, cookie session, cloud queue or cloud storage.

## Remaining acceptance and owner boundaries

- Root owns auth/session, hosted routes, router and shared API/server contracts. It must verify the endpoint response shapes and current runtime retention disclosure, then independently review and integrate these isolated files.
- A mock `cancelled:true` response proves only this component’s acknowledgement rule. It does not prove the service stops OCR or cloud work. Likewise, mocked queued polling does not prove Cloud Tasks behavior or Europe/Johannesburg processing separation.
- No browser, headless browser, screenshot, real account, real file processing, cloud mutation, audio, full build, deployment or device accessibility check was used. TypeScript and focused SSR/event tests pass; product acceptance remains pending parent integration and separate learner/device validation.
- The account sign-in link opens a second tab to avoid unloading current pasted text. Cross-tab session refresh and route behavior still need an authorized hosted/device check.

Do not claim that all uploads are device-only, that account progress includes migrated local sources/lessons beyond the API’s returned scope, that the selector semantically understands a document, or that user learning/market outcomes have been measured.
