# Worker A handoff: private learner workspace HTTP tests

- Session: `codex-cloud-repository-20261024-a` (Codex, GPT-6, effort registered `unknown`).
- Task: `CLOUD-REPO-HTTP-001`; exact scopes: `studio/tests/private-learner-integration.test.mjs`, `docs/private-learner-integration-20261024/`, and this handoff.
- Judging criteria: Product (complete, private source-to-lesson journey and saved work) and Sustainability (durable restoration and cancellable job lifecycle). Learner need: continue reviewed learning work privately across requests and server/router recreation. Observable acceptance: actual Express route HTTP requests through A/B synthetic identity injection, a CAS repository double, and a shared in-memory store.

The tests import and mount `createLearnerWorkspace` from the current root-owned routes. They exercise text source creation, review and exact revision, goal evidence selection, local lesson generation/read, draft save and stale CAS rejection, stale source review/generation rejection, A/B source/lesson isolation, state restoration after router recreation, upload queueing and worker completion, and cancellation before and during extraction. Runtime files and root-owned API contracts were not edited. Only extraction is stubbed at the actual IO boundary; model generation is not called in the local path.

Changed files:

- `studio/tests/private-learner-integration.test.mjs`
- `docs/private-learner-integration-20261024/README.md`
- `coordination/handoffs/2026-10-24-private-learner-integration.md`

Check: `node --test studio/tests/private-learner-integration.test.mjs` passed 2/2 using a test-only loopback ephemeral Express server. The default sandbox denied loopback connections with `EACCES`; the test passed when executed with the permission required for its own local server. No external service or cloud was contacted.

Defects found: no concrete route defect reproduced in these cases. Limits: the repository double models owner partitioning/CAS but is not Firestore; synthetic header identity injection is test-only and is not product authentication; real cloud, cookie/session, browser/device, and learner acceptance remain root-owned and open.
