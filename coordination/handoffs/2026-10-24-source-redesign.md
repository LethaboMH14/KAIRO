# Source workspace redesign handoff

**Task:** `SOURCE-REDESIGN-001`  
**Session:** `codex-luna-source-redesign-20261024-a1`  
**Client settings exposed:** Codex; model `gpt-6`; effort `unknown`.  
**Status:** Isolated UI/test/evidence package delivered; exact claim completed and released for root review. Not browser/device or product acceptance.

## Need and judging targets

Learners need one clear next action through choose → check source → shape lesson, with source/revision identity, storage scope, selected passage context and recovery visible. This package targets **Product** (keep source/review/citation/local fallback semantics), **Usability** (plain staged actions, honest save/storage/cancel wording) and **Intelligence** (show returned goal-selected passages without claiming semantic understanding).

## Files in my scope

- `studio/src/workspace/SourceWorkspace.tsx`
- `studio/src/workspace/material-flow.css` — reserved, unchanged; existing styles remain the base.
- `studio/src/source-workflow-ui/SourceWorkflowPanels.tsx`
- `studio/src/source-workflow-ui/source-workflow.ts`
- `studio/src/source-workflow-ui/source-workflow.css`
- `studio/tests/source-workflow-ui.test.mjs`
- `docs/source-redesign-20261024/README.md`
- `coordination/handoffs/2026-10-24-source-redesign.md`

No router, provider, auth/session, server, manifest, lockfile or shared schema was edited. C palette and Manrope remain inherited from the existing workspace design.

## Decisions and parent-facing interfaces

- `/catalog` accepts only returned `storageScope: 'local' | 'account'` and displays the returned label. Missing values stay unavailable; the client does not infer device-only/account scope. The old optional Google cloud-copy panel renders only for `local`.
- Account-scoped upload copy says processing runs in Johannesburg and queue metadata is handled in Europe. Original retention wording follows the scope and remains opt-in.
- Workspace calls use the same-origin cookie through `credentials: 'same-origin'`. A small source-workspace parser retains plain-text HTTP errors so 401 “Sign in again…” gets a `/account` link in a new tab. The current tab remains open with its pasted draft.
- The optional read-only selection request uses `GET /api/workspace/source/:id/selection?goal=<compiled goal>`. It displays validated `{id,locator,quote}` evidence only, is invalidated when the selected source/revision or goal changes, and fails soft without blocking local reading.
- Upload status accepts `queued` before `extracting`. Stop waiting invalidates the pending selection and asks `DELETE /api/workspace/jobs/:id` only when a job ID is known. The UI says “cancelled” only for successful `{cancelled:true}` acknowledgement; 404/405 or malformed responses retain the unconfirmed-wait wording.
- The parent-published optional `/catalog` response `jobs: [{id,name,status}]` is rendered in a compact File processing panel after reload. Queued/extracting jobs offer Resume; ready jobs offer Open source; error/cancelled jobs offer Check status. All request current status through the existing job GET route and use the same wait/cancel code as upload. Optional absent/malformed job lists are ignored. A ready job opens the returned source and preserves any unsaved pasted passage. No endpoint schema or server code was changed.

Root owns these endpoint implementations and must verify the response details against the code before integration. No interface ownership was taken from root.

## Evidence and checks

From `studio/`:

```text
node --test tests/source-workflow-ui.test.mjs tests/material-integration.test.mjs
14 passed, 0 failed.

node node_modules/typescript/bin/tsc --noEmit --pretty false
exit 0, no diagnostics.
```

The SSR/event harness renders actual `SourceWorkspace` and the real panels via installed Vite; it uses deterministic Node HTTP and timer mocks. It covers account/local labels and panel boundaries, plain-text 401 with retained paste state, preview goal/source invalidation and 404 local fallback, XSS escaping, upload queue cancellation success/failure acknowledgement, and the prior material review/citation/consent/generation gates. Test curriculum/source labels are synthetic.

This is provider/component event simulation only; it is not real React DOM, browser, device, account-session, storage or cloud acceptance. The added restored-job cases test exact ready-source opening with pasted-draft retention, queued resume and cancel, error/cancelled recovery, and a local catalog that omits `jobs`.

Detailed design plan, source summary, per-criterion evidence, limitations and future checks are in `docs/source-redesign-20261024/README.md`; captured test/check output is in `docs/source-redesign-20261024/CHECKS.txt`.

## Remaining work

- Root independently checks and integrates the API contract, confirms the returned storage label/scope and current-region copy, and verifies account-session transition behavior.
- Hosted cancel success/failure, queued OCR lifecycle, Firestore/GCS retention and queue-region metadata were mocked or supplied by contract; this lane did not connect to cloud services.
- No browser/headless browser, screenshot, device, keyboard/screen-reader, real account or human learner test was run. Responsive layout and accessibility need later device validation. No full app build, deployment or user-acceptance claim is made.

The claim is completed with the evidence files above. Root independently reviews and integrates; parent integration and product acceptance remain outstanding.
