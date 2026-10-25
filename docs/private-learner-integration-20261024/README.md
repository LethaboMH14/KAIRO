# Private learner workspace HTTP integration evidence

These focused tests mount the actual `createLearnerWorkspace` Express router with a fixed synthetic test identity middleware. A bounded in-memory repository double implements owner partitioning and compare-and-swap versions; it uses no learner data, Firebase, GCS, model provider or network service. Tests send HTTP requests through a loopback-only ephemeral server and stub extraction at the route's actual IO boundary.

Coverage includes:

- Learner A creates and reviews a source, retrieves goal-based evidence, generates a local cited lesson, and saves a draft. Learner B cannot read A's source or lesson.
- A later reviewed source revision rejects the stale review expectation and old-revision lesson generation. A stale draft expected version receives 409.
- Source, lesson, draft, and a queued import job remain available when the router is recreated over the same repository state.
- A synthetic text upload moves from queued to ready through `processImport` and becomes a readable source.
- Cancellation before extraction avoids calling the extractor. Cancellation while the extractor is pending marks the job cancelled and prevents source publication.

Command: `node --test studio/tests/private-learner-integration.test.mjs` — 2/2 passed. The first sandboxed attempt could not connect to loopback (`EACCES`); rerunning the same command with permission to access only its own local ephemeral server passed. No browser, real cloud, private material, external identity provider, or runtime edits were involved.

This provides automated Product evidence for private source-to-lesson continuity and Sustainability evidence for data/job restoration across router recreation. The learner need is to keep and resume their own work without exposing it to another account. Live Firebase/GCS integration, deployed auth-cookie behavior, browser/device access, human review, and full end-to-end release acceptance remain open for root.
