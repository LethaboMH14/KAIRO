# Original material viewer handoff — 23 October 2026

Agent: `codex-editor-ui-20261023-b` (Codex; GPT-6; effort unavailable).

This task improves Product and Usability by keeping a learner’s reviewed source available beside extracted material, with a direct, bounded original-page view. Acceptance is the actual component SSR-ing closed and unavailable states, refusing untrusted IDs/media types, fetching only after explicit action through the fixed same-origin route, mapping sections to source pages, limiting navigation to four pages, and disposing in-flight PDF work. Automated results are documented below; browser/device rendering and human learner validation remain open. Impact, Sustainability, Creativity, Presentation and Intelligence receive only incidental support from source continuity; this component does not establish learning gains, traction, cost, or scoring improvements.

## Changes

- `studio/src/original-material-ui/OriginalMaterial.tsx` and `original-material.css`: click-to-open PDF/image, safe fixed original endpoint, section/page mapping, bounded page navigation, download-only attachment affordance, truthful missing/unavailable states, abort/cancel lifecycle.
- `studio/src/original-material-ui/pdfjs-worker.d.ts`: Vite worker URL typing.
- `studio/tests/original-material-ui.test.mjs`: actual component Vite SSR plus mocked fetch and PDF loader cases.
- `docs/original-material-ui/README.md`: behavior and evidence limits.

PDF rendering disables eval and caps allocated canvas size at 4096 pixels per side and 12,000,000 total pixels. PDF.js `PDFDocumentLoadingTask.destroy()` is the teardown owner for its document lifecycle; tests therefore assert one loading-task destruction and no separate document destroy call, avoiding double-destruction. Render-task cancellation is separately verified.

## Evidence

`cd studio; node --test tests/original-material-ui.test.mjs` passed 12/12 on 23 October 2026. Tests cover SSR closed state, URL/source validation, section mapping and four-page bound, fixed same-origin mocked fetch/MIME handling, PDF options/render cap, safe canvas bounds including hostile dimensions, and loading/render task teardown/cancellation. Test runner printed Vite dependency-scan shutdown warnings because the test closes its middleware server; the Node test process exited 0. A workspace TypeScript check was started but did not complete within the available 90-second wait and was interrupted; no TypeScript result is claimed. Root should rerun its aggregate TypeScript/build checks.

No browser, headless browser, real source endpoint, cloud service, paid API, or external source was used. Human/device validation remains open.

## Integration

`SourceWorkspace` already imports the component using the agreed props. Root owns host persistence, undo, and live preview. No backend, route, manifest, or storage change was made by this task.
