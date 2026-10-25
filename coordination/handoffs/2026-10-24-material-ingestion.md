# Worker B follow-up handoff: bounded native extraction

Session `codex-material-ingestion-20261024-a` (Codex, gpt-6.1-sol, effort unknown) completed `MATERIAL-INGEST-003` after root review identified remaining adversarial-input bounds and omitted-coverage concerns.

Criteria: Product/Usability need truthful coverage; Sustainability needs bounded local work; Intelligence must distinguish native text from interpretation. The user need is to avoid implying an entire document or its visuals were understood when only bounded native text was extracted.

Changed files: `tools/material_ingestion/extract.py`, `studio/tests/material-ingestion.test.mjs`, `docs/material-ingestion-20261024/README.md`.

Implementation now validates `run(path,max_units)` itself; counts TXT delimiters and retains only the requested sections; parses XLSX worksheet XML cells rather than iterating dense rectangular ranges; maps workbook relationships to worksheet names; preserves formula strings and rejects invalid shared-string indices; reports unknown remaining XLSX coverage as `discoveredUnits: null` after an early cap. PPTX text extraction descends groups and tables, and Office/PDF outputs warn that visual/chart/image semantics are not extracted. DOCX warns that headers, footnotes, comments, nested tables and floating visuals are outside top-level body coverage. Existing file/ZIP/output bounds remain in place.

Validation: `node --test tests/material-ingestion.test.mjs` passed 8/8 within 23 seconds. New fixtures cover XLSX far-corner sparse coordinates and reordered sheet relationships, 22,001 text sections with a two-unit cap, output JSON cap, and direct `run()` rejection for 201 units. Existing synthetic PDF/PPTX/DOCX/formula/malformed package checks also passed. No private files, network/model calls, installs or cloud actions.

Remaining gaps: XLSX reports null discovered count when stopped at the limit, as designed; DOCX tables inside cells and other out-of-scope structures remain explicit warnings. Generic visual warnings do not identify each individual omitted shape. Native text does not establish semantic correctness, OCR, human review, browser/device acceptance, or integration safety.
