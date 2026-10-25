# Worker A extraction edge-case evidence handoff

- Owner: `codex-ingestion-edgecases-20261024` (Codex, model `gpt-6`, effort `unknown`).
- Task: `INGEST-EDGECASES-001`.
- Criteria: Product, Intelligence and Usability. Need: trustworthy native import with source ordering/locators before lesson creation.
- Changed: `studio/tests/ingestion-edgecases.test.mjs`, `docs/ingestion-edgecases-20261024/README.md`.
- Tests invoke the actual `tools/material_ingestion/extract.py` through the configured OCR virtualenv path and create temporary synthetic DOCX/XLSX/PPTX fixtures under OS temp; cleanup is in `finally`.
- Checks: from `studio/`, `node --test tests/ingestion-edgecases.test.mjs` passed 4/4; from repository root, `node --test studio/tests/ingestion-edgecases.test.mjs` passed 4/4. Initial root-cwd failure came from harness cwd path resolution, fixed with `fileURLToPath(import.meta.url)`.
- Assertions cover DOCX top-level interleaving and exact cell locators, formula-only sparse XLSX sheet/ranges and no inferred computed value, PPTX slide and speaker-note locators/order, and DOCX nested-table omission with the declared warning. Existing `studio/tests/material-ingestion.test.mjs` additionally covers blank PDF pages and broader PPTX notes cases.
- No product/extractor edits, browser observation, private data, or network calls. Fixtures are small synthetic documents cleaned in `finally`.
- Gaps: synthetic checks do not prove semantic correctness, visual/chart comprehension or human/device usability. Nested table omission is a documented boundary, not a defect under the current contract.
- Next acceptance: root reviews evidence; future nested-table support requires separate ownership.
