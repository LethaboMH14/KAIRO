# Lesson authoring and rendering research

**Checked:** 23 October 2026. Research only; no packages installed and no product code changed.

## Recommendation

For the current My material flow, keep the planner as a small authored, versioned JSON outline and render it through allowlisted React components. Extend the existing artifact contract only when a concrete authored block is needed; validate exact fields, lengths, counts and source revision before rendering. Render strings as text. Keep citations as source ID + revision + locator + exact quotation whose relation to the reviewed source is checked by the authoring layer. Do not treat the artifact panel's caller-claimed provenance as verified. The current panel accepts only static text/table, caps the serialized value at 128 KiB and presents provenance as “not verified”; it does not sandbox arbitrary HTML/JS.

Now: no new runtime dependency. Reuse the material planner's bounded brief and three-card outline concept, with authored static blocks such as explanation, worked example, question and table added only through a discriminated schema and fixed React renderer. Store/revise authored blocks alongside source revision and authored simulation parameter values, each labelled by provenance. Keep exact-source excerpts separate from simulation values. Export can initially be JSON or a readable Markdown projection; neither implies interchange compatibility with a course platform.

Later: evaluate H5P if educators need a mature catalogue of interactive activities and an interoperable package workflow; evaluate Adapt if the need becomes full responsive courses and SCORM delivery. Consider Tiptap only if free-form rich-text editing becomes a real requirement. JSON Forms can help edit structured schemas, but the current planner has only a few fields, so bringing in a form framework is not justified. Before adopting any, prototype keyboard/screen-reader behavior, mobile layout, package/export, offline operation, source revision retention and hostile-input handling. No option's marketing accessibility claim substitutes for KAIRO-specific checks.

## Comparison

| Option | Licence and cost signal | Fit / integration | Accessibility, safety, citation and offline limits |
|---|---|---|---|
| H5P | H5P says its code generally uses MIT, while noting GPL code in its PHP library; individual content and library licences need checking. Software is free; hosting/support may be paid. | Mature activity authoring and import/export; embedding/runtime and content-type libraries add substantial integration work versus the existing React flow. | H5P publishes a content-type accessibility overview, which implies capability varies by type. Package execution and library updates need a security review. Source revision/citation lineage is not a KAIRO contract. Standalone/self-hosted operation depends on host integration. |
| Adapt | Official framework page describes GPL open source; CLI/Node/Grunt prerequisites and separate authoring tool. | Full course framework with assessments, bookmarking, localization and SCORM, but migration away from KAIRO's React lesson route would be large. | Adapt states WAI AA support, which needs current independent validation. Export is course/SCORM-oriented; no native source-revision contract found. Standalone output can run on web server; authoring tool and build dependencies remain. |
| JSON Forms | MIT. No hosted service required for the open-source renderer. | React/JSON Schema form renderer; good for complex dynamic forms, excessive for the small fixed brief and cards today. | Validation is schema-driven and renderer sets include plain HTML options, but accessibility still depends on chosen renderers and checks. It edits data rather than safely rendering lesson output; citations/revisions/export/offline are application-owned. |
| Tiptap | Core editor is MIT; managed collaboration, AI, history and some advanced capabilities are paid. | Headless ProseMirror-based rich text for React; requires choosing extensions and building KAIRO's UI/schema. More authoring power than the current need. | Framework gives UI control but content rendering/sanitization and schema constraints remain our responsibility. JSON persistence is possible; citations and immutable source revision are not built-in. Core can run in own stack/offline; cloud features add cost and data handling. |
| Lexical (alternative) | Official docs identify an extensible, small optional-package core; confirm exact package licence before adoption. | React-oriented editor framework with plugins/nodes. Still a custom editor project. | Docs describe accessibility as a design goal, not an acceptance result. Custom nodes and serialization need safety/round-trip review; citations/revisions/export/offline remain app-owned. |

## Example outline (authored teaching example)

**Title:** Predict the rotating field speed of a four-pole motor

1. Read the source rule: synchronous speed is 120 times frequency divided by pole count.
2. At 50 Hz and four poles, calculate 120 × 50 ÷ 4 = 1,500 rpm.
3. Change the authored practice parameter to two poles and predict before calculating: 120 × 50 ÷ 2 = 3,000 rpm.
4. Explain why this is rotating-field synchronous speed, not the loaded induction motor's actual shaft speed; induction motors run below synchronous speed because of slip.

**Source citation:** U.S. Department of Energy, *Improving Motor and Drive System Performance: A Sourcebook for Industry*, printed p. 6 (PDF page index 9), gives the formula “Synchronous speed = 120 x frequency (Hz) / number of poles” and 60 Hz field-speed examples of 3,600 rpm (2-pole), 1,800 rpm (4-pole), and 1,200 rpm (6-pole). [Official DOE PDF](https://www1.eere.energy.gov/manufacturing/tech_assistance/pdfs/motor.pdf), checked 23 October 2026.

The 50 Hz / four-pole value of 1,500 rpm above is KAIRO-authored arithmetic derived from the DOE formula (120 × 50 ÷ 4), not an example printed in that cited passage. Likewise, the 3,000 rpm two-pole practice value is derived arithmetic. The DOE source directly supplies the formula and 60 Hz values stated above.

The lesson title, step wording and chosen 50 Hz / four-pole exercise are authored instructional material. The formula and example values above are source-supported. Any later interactive control range, default, animation speed or fault scenario is simulation design authored by KAIRO, not DOE data or a validated equipment simulation. This example does not assert domain-expert or learner validation.

## Evidence and remaining checks

Local code reviewed read-only: `studio/src/artifact-panel/contract.ts`, `studio/src/static-artifact-view/StaticArtifactView.tsx`, `docs/workstreams/static-artifact-contract.md`, `docs/workstreams/static-artifact-view.md`, and `studio/src/material-planner-ui/MaterialPlanner.tsx`.

Observed current contract: strict schema version 1, text/table only, exact projection after validation, bounds on content, no raw HTML/URLs/media or artifact-provided scripts, accessible table caption/headers and keyboard scroll region. Provenance is a claim only. Planner is a controlled short form and static outline, explicitly not a generated lesson; local reading is exact source excerpts and the brief shapes only a cloud request. No product changes or tests were run as part of this research.

Before any extension: define schema with an owner; require source/revision identity on citations and exact quote checks against reviewed revision; label authored parameters; security review renderer and persistence; check current package versions/licences and full transitive licences; keyboard/screen-reader/mobile acceptance; round-trip export/import and offline acceptance. Human subject-matter review remains open.

## Official sources

- [H5P licensing](https://h5p.org/licensing)
- [H5P documentation and import/export](https://h5p.org/documentation)
- [H5P content-type accessibility overview](https://h5p.org/documentation/installation/content-type-accessibility)
- [Adapt Framework](https://www.adaptlearning.org/index.php/adapt-framework/)
- [Adapt guiding principles / GPL statement](https://www.adaptlearning.org/wp-content/uploads/2016/01/Adapt_guiding_principles.pdf)
- [JSON Forms core and MIT licence](https://jsonforms.io/api/core/index.html)
- [JSON Forms validation](https://jsonforms.io/docs/validation/)
- [Tiptap editor overview and MIT core](https://tiptap.dev/docs/editor/getting-started/overview)
- [Tiptap open-source versus platform features](https://tiptap.dev/open-source-to-platform)
- [Lexical introduction](https://lexical.dev/docs/intro)
- [DOE motor source](https://www1.eere.energy.gov/manufacturing/tech_assistance/pdfs/motor.pdf)
