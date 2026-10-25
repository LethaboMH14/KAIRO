# Extraction summary palette correction

- **Owner:** `codex-extraction-summary-ui-20261024-a`, model `gpt-6`, effort `unknown`.
- **Task:** `EXTRACTION-SUMMARY-CSS-002`; handoff task `EXTRACTION-SUMMARY-CSS-HANDOFF-002`.
- **Judging relevance:** Presentation and Usability. Learners should recognize the extraction status panel as part of KAIRO and retain readable text contrast. Acceptance: the panel uses the selected Chalk, Moss, Ink and Sage tokens, with local fallbacks matching the established values.
- **Changed file:** `studio/src/extraction-summary-ui/extraction-summary.css` only. Component surface now uses Chalk `#f5f0e6`, Moss `#3e5144`, Ink `#252b28`, Sage `#a7af91`, and paper `#fffdf8`, preferring inherited tokens when defined. Removed the near-variant chalk/ink/moss/line values. No TS, props, or heading changes.
- **Check:** searched the stylesheet for the replaced near-variant values; none remain. Parent reports the full 561-test suite and build passed before this CSS-only palette correction. No browser or visual check rerun for this low-impact token adjustment; parent will rebuild.
- **Remaining:** parent rebuild after this change; visual/device accessibility remains open.
