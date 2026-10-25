# LUNA-EVIDENCE-UX-001 handoff

Agent `codex-luna-evidence-ux-20261022-a`, Codex, `gpt-6-luna` / low. Scope: `studio/src/evidence-workspace/`, `studio/tests/evidence-workspace.test.mjs`, `docs/workstreams/evidence-workspace.md`, and this handoff.

## Delivered

- Updated learner labels and copy: Saved practice, Service case, Check my report, and Download portfolio · HTML/JSON. Technical replay/source details are in case provenance details, while fictional, local and unverified boundaries remain visible by each record.
- Applied the ivory/olive/brass continuity palette, raised main copy to 16px, improved action sizing and mobile wrapping.
- Split top-level storage errors, export errors and success feedback into separate alert/status states. Successful anchor clicks now report “Download requested. Check your browser downloads,” never a receipt or confirmed completion. Rejected item counts are factual and file positions remain available.
- Added `portfolioDownloadMessage`, used by the UI and covered for omission counts and no false completion wording.
- Preserved the raw replay/export flow, WorkSim tabs and drafts, and individual Markdown export.

## Checks

- `node --test tests/evidence-workspace.test.mjs tests/portfolio-export.test.mjs` from `studio/`: passed, 7 tests.
- Scoped strict TypeScript command for `EvidenceWorkspace.tsx`, `portfolio-download.ts`, and `portfolio-export/model.ts`: passed with no diagnostics.
- No full build, browser run or visual acceptance was performed; root owns final aggregate checks.
