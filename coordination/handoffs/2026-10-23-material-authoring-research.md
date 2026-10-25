# Lane C handoff: material authoring research

**Date:** 23 October 2026  
**Owner/session:** `codex-material-research-20261023-c`  
**Client/model/effort:** Codex / gpt-6.1-sol / unknown  
**Scope:** `docs/material-authoring-research-20261023/` and this handoff only. Product code read-only.

## Criterion, need and acceptance evidence

- **Sustainability:** prefer a reusable, bounded authored lesson contract that adds no dependency now. Learner need: create and reuse a source-linked lesson without losing which source revision supports it. Acceptance check: an authored JSON outline validates into fixed React renderers, keeps exact source ID/revision/locator/quote, and can be projected to a readable export. **Evidence:** dated comparison and DOE source-linked example in `docs/material-authoring-research-20261023/README.md`; existing artifact validator and planner reviewed. No schema extension implemented.
- **Product / Intelligence:** make the source-grounded rule and the authored practice action legible, while distinguishing source facts from simulation settings. **Acceptance check:** a motor outline cites DOE's formula and asks a learner to vary pole count; all interaction settings are labelled authored. The memo supplies this example. **Gap:** no domain-expert or learner validation.
- **Usability:** keep editing short and preserve a static reading path. **Evidence:** existing planner is a bounded controlled outline and current renderer supports accessible static text/table. **Gap:** no browser/device/screen-reader testing in this research.

## Findings

Recommendation: retain the existing planner and strict static artifact pattern; extend only via a versioned discriminated JSON schema and allowlisted React renderers when an actual block need exists. Do not install H5P, Adapt, JSON Forms, Tiptap or Lexical now. H5P/Adapt solve much larger course-authoring/interoperability needs; JSON Forms is overpowered for current fields; rich-text editors leave source lineage and output safety to KAIRO. The report records official links, licence/cost signals, integration, accessibility, safety, citation, export and offline limitations.

Correction after independent review: DOE sourcebook printed p. 6 (PDF page index 9) gives 60 Hz examples (2-pole 3,600 rpm; 4-pole 1,800 rpm; 6-pole 1,200 rpm), not 50 Hz examples. The memo now attributes only the formula and these printed values to DOE. Its 50 Hz / 4-pole 1,500 rpm and 2-pole 3,000 rpm practice figures are explicitly labelled KAIRO-authored arithmetic derived from the formula. Evidence checked against the official PDF passage (page index 9 / lines 449–464 in primary-source extraction) on 23 October 2026. No product files changed.

Concrete source checked: DOE sourcebook printed p. 6 states the formula and 60 Hz examples. Memo separates those source-supported statements from authored teaching steps, derived 50 Hz practice arithmetic, and any future simulation controls.

## Files and checks

- Added `docs/material-authoring-research-20261023/README.md`.
- No source, dependency, configuration or test files changed. No tests run. No install, browser observation, page capture, cloud request, paid service or download performed.
- Official documentation was searched/read online on 23 October 2026; all citations are direct source URLs in the memo.

## Limits and next step

This is a research recommendation, not approval to change shared contracts or product runtime. The artifact panel's provenance is explicitly unverified and it does not implement sandbox isolation. Any future schema/runtime expansion needs its own claim and review. Browser/device/screen-reader checks and subject-matter review remain open.
