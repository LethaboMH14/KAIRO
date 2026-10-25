# Extraction edge-case evidence

Criterion focus: Product, Intelligence and Usability. Learners need source material to retain its order and precise location when imported, so they can check lesson content against the source.

`studio/tests/ingestion-edgecases.test.mjs` adds synthetic actual-extractor cases for interleaved DOCX paragraphs/tables, formula-only sparse XLSX coordinates, PPTX slide/note locators, and explicitly unsupported DOCX nested tables. Checks require exact ordered text and source locators and avoid treating formulas as calculated results.

Run from `studio/`: `node --test tests/ingestion-edgecases.test.mjs`. From repository root: `node --test studio/tests/ingestion-edgecases.test.mjs`.

Result: both commands passed 4/4. An initial root-cwd attempt exposed a test harness path-resolution mistake, corrected by resolving the workspace from the test module URL. Actual XLSX output confirmed `sheet: Forecast` and `range: B2` / `XFD1048576`; PPTX output contains slide shape and notes shape locators. DOCX preserves interleaving and emits a trailing newline in a table cell; assertions capture exact output. Nested table content is omitted and the warning explicitly names nested tables.

Acceptance remaining: fixtures do not establish visual/chart comprehension or learner acceptance. Nested table omission is documented supported-boundary evidence, not a defect under the current extractor contract.
