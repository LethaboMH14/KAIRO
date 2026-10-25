# Extraction summary UI

This small stateless React panel exposes the native extraction report alongside what is ready for a person to review. It deliberately separates “Text extracted” from “Sections ready for your review” and states that readiness is not checking, understanding or correctness. It does not claim full source coverage when the discovered total is unknown.

## Evidence

Worker B implementation: `studio/src/extraction-summary-ui/ExtractionSummary.tsx` and `extraction-summary.css`.

Automated SSR coverage: `studio/tests/extraction-summary-ui.test.mjs`; run from `studio` with `node --test tests/extraction-summary-ui.test.mjs`. Result recorded in `verification.json`.

The test renders the actual component through Vite SSR and React static markup. It covers native extraction versus review readiness, unknown discovered units, partial results and reported failures/skips, omitted review characters, escaped warning text, and full native extraction with zero review sections.

## Product evidence mapping

- **Product / usable source-to-review journey:** the learner can see how much extracted text is available for review. Acceptance evidence: distinct extraction and review counts render in the actual component. Limitation: root workspace mounting and actual upload behavior are outside this worker scope.
- **Usability / clear status:** unknown totals, skips, failures and omissions are explicit; warning details can be opened. Acceptance evidence: SSR assertions in the scoped test. Keyboard and screen-reader use has not had human/device validation.
- **Impact / honest understanding boundary:** extraction is not presented as comprehension. Acceptance evidence: visible review caveat and zero-review test. No learning outcome is measured by this component.
- **Presentation / clear product language:** KAIRO and plain learner-facing copy are used; no alternate teacher identity is introduced.

## Limits and next acceptance

This panel trusts a validated `ExtractionSummaryData` report supplied by its parent; it performs no parsing, validation, persistence or network access. It has not been mounted into the source workspace or checked in a browser/device. Root integration should map the shared `Source.extraction` object to the exact schema and check the complete upload → review flow.
