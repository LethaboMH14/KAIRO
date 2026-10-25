# Editable material and lessons: connected implementation

23 October 2026. Root integration: Codex, exposed model GPT-6, effort unknown. Luna implementation packages were independently reviewed; actual worker registrations are in their handoffs. No browser observation, cloud inference or public deployment was performed in this package.

Runtime: Node 24 or newer; verified here on 24.18.0. The backend imports the same TypeScript draft-domain module used by the client and uses built-in SQLite. The package engine now reflects this runtime requirement rather than promising older untested Node compatibility.

## Try the flow

1. Open **My material**. Upload supported material or paste text. For a new file, explicitly choose **Keep this upload on this computer** if you want original-page comparison later. Previous deleted upload bytes cannot be recovered.
2. Open the original PDF/image on demand alongside extracted text. Correct extraction, check the source and save the review. Saved uploads now appear in the material list.
3. Create a lesson. Choose **Shape the actual lesson**, or **Shape this lesson** from an existing source classroom.
4. Edit explanations and examples, reorder or split teaching blocks, add an ungraded reflection, and choose reading, split or practice-focus layout. Watch the real reading preview update. Exact supporting quotes stay attached.
5. Save manually or allow automatic saving. Undo/redo works within the session. Earlier saved versions can be restored into a new version. Export/import supports a bounded KAIRO editable-lesson JSON document for the same original lesson.
6. Choose **Make my learning copy**, then **Learn with this copy**. The published copy uses the full edited document in the existing Learn / Practise / Keep-my-work journey and shares KAIRO's narrator.

## Integrity and privacy decisions

- Source reviews and draft versions use a local SQLite store with immutable history and compare-and-swap. A stale tab receives a conflict; it cannot silently replace newer work. Failed saves preserve the open draft and pause automatic retries.
- Published edits get a new lesson ID. Existing native questions, attempts and resume records are retained under their original lesson. Scored question wording, options, key and supporting quote cannot be rewritten in this editor. Personal reflections are ungraded.
- Older lessons load their exact retained source snapshot and validate citation offsets against it. Revisions lost before this implementation cannot be reconstructed.
- Retained originals use private generated filenames, byte/hash checks, signature admission and safe response headers. Removal deletes original bytes while keeping reviewed text/history. This is not malware scanning, tenant isolation or a production authentication system.
- PDF.js **6.4.299**, Apache-2.0, is pinned in the manifests. Its worker is bundled locally and loaded only after an explicit open action. Preview is limited to the first four pages, with canvas allocation bounds and cancellation. Office/text files use an attachment download rather than an inline page renderer.
- Edits are not factual verification. Layout selection arranges existing cards; it does not generate arbitrary executable HTML, new simulations or 3D worlds. No new model is trained or invoked by editing.

## Acceptance evidence and judging relevance

| Criterion | Learner or buyer need and observable check | Evidence / remaining gap |
|---|---|---|
| Product | Complete review → edit → publish → reading/practice path; exact historical source remains readable | Actual route, domain, store and host tests; manual end-to-end acceptance remains open |
| Creativity | Reshape teaching while keeping source anchors and a useful live preview | Real block editor and full-document reading renderer; no novelty claim against all competitors |
| Usability | Recover work, know whether it saved, avoid conflicting overwrites | Save failures, conflicts, undo/redo and cancellation tests; keyboard/phone/learner evaluation pending |
| Sustainability | Save without paid inference or a new service dependency for every edit | Built-in SQLite and pinned PDF.js; hosted multi-user operating costs not measured |
| Impact | Let learners check and adapt explanations in a reading alternative | Source-linked edited reading; no learning gain or accessibility certification claimed |
| Presentation | One demonstrable material-to-learning-copy story | Built client and reproducible flow above; no screen capture or approved demo footage created |
| Intelligence | Preserve evidence and assessment meaning through structural edits | Domain/provenance/citation validation; adaptive AI restructuring and prediction remain future work |

Check outputs and the final handoff in this folder record the final counts. Mocked hooks/SSR and synthetic HTTP tests exercise actual implementation modules, but do not establish real PDF canvas, device voice, mobile performance or educational quality.

Final gate: **525/525 tests pass**, including 9 actual-host tests and the 3 copy-out tests. `npm run build` (TypeScript plus Vite) exits 0. The final local server was restarted at port 4188 and `/api/health` returned `ok:true`; only that backend health endpoint was observed. File hashes and commands are recorded in `verification.json`. The pre-existing large-chunk build warning remains.

## Next bounded work

Human review should exercise a real PDF, phone layout, keyboard navigation, narration interruption and a complete published-copy practice attempt. Then add targeted AI rewrite proposals through the validated action contract, showing source support and a before/after review before applying. Broader source-library search, richer annotations, arbitrary artifact authoring, tenant authentication, deployment and employer evidence sharing remain separate work.
