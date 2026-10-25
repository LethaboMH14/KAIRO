# LUNA-PORTFOLIO-INTEGRATE-001 handoff

Agent `codex-luna-portfolio-integration-20261022-a`, Codex, `gpt-6-luna` / low. Exact scope: evidence workspace UI/helper/tests, portfolio adapter/tests, workstream notes and this handoff.

## Delivered

- Added portfolio download controls to the existing evidence workspace for standalone HTML and JSON, with the correct MIME types and filenames.
- The UI reads the saved profile, passes raw `cases` and the current raw in-memory WorkSim state through `preparePortfolioDownloads`, which delegates replay validation to `summarizeCase` and `exportRun` through `buildPortfolioExport`.
- Incomplete and invalid items are reported in-file by source index and in the UI's accessible alert message. Invalid saved profile data and over-limit input stop the download without writing to storage. Existing Markdown exports remain available.
- The HTML attempt list now shows each simulation attempt's assistance exposure; the shop case remains explicitly unknown.
- Added an integration helper test using actual completed model records through the same helper that UI invokes.

## Checks

- `node --test tests/evidence-workspace.test.mjs tests/portfolio-export.test.mjs` from `studio/`: passed, 6 tests. The integration test runs real completed practice and WorkSim states through the same preparation helper used by the UI and checks JSON/HTML output plus per-attempt unknown assistance.
- `npx tsc --noEmit --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution Bundler --allowImportingTsExtensions --strict --skipLibCheck --jsx react-jsx src/evidence-workspace/EvidenceWorkspace.tsx src/evidence-workspace/portfolio-download.ts src/portfolio-export/model.ts` from `studio/`: passed with no diagnostics.
- No full app build or browser run was performed; root owns the aggregate build and browser validation.

## Boundaries

No automatic save, cloud upload, external application, router change, shared profile-model change or package change was made. Replay consistency does not independently verify learner identity, actions or competence. The current WorkSim state is only included in a download; it is not persisted automatically.
