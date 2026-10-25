# KAIRO: learning, studios, evidence and cloud experience

24 October 2026 SAST. Root codex-lms-research-20261024-d, Codex gpt-6 / effort unknown. This package turns official-source product research and current source review into a concrete build order. It does not certify a 'best' product, invent user research or change the selected identity.

## Main decision

Build a stable learning workspace with an adaptable activity area. The learner should always know **what I am doing, where this came from, what KAIRO is doing, what is saved and what I can do next**. Adapt explanations, examples and supported activities inside that workspace; do not continually regenerate its navigation or give a model unrestricted UI control.

The distinctive KAIRO mechanism is **source → prediction → interactive change → observation → explanation → selected evidence**. Keep this chain linked while switching between reading and a supported studio. Employer presentation comes from chosen evidence after privacy and persistence work, not an automatic public feed.

## Read the concrete plans

- [Cloud services, agent boundaries and 3D choices](CLOUD-AND-AGENTS.md): Google tool/service matrix, decisions, rejected alternatives and real limitations.
- [Learner flow, layout, words, font and task states](LEARNER-FLOW.md): current code ownership, proposed screens/actions, failure copy and user-testing plan.
- [Explorable proposed workflow](learner-workflow.html): standalone HTML built with Archify. Deterministic showcase delivery passed all nine checks with zero composition errors/warnings; hashes and receipt are in diagram-delivery.json. Browser behaviour and perceptual visual review were not performed under the standing restriction. This diagram describes a proposed joined experience, not hosted implementation.
- [LMS comparison](../lms-patterns-20261024/README.md): Moodle, Canvas, Classroom/Notebook, Khan Academy, Coursera and Linear patterns.
- [Profile comparison](../profile-patterns-20261024/comparison.md), [sharing proposal](../profile-patterns-20261024/proposal.md): LinkedIn, GitHub, Behance, Credly/Open Badges and Handshake, with explicit verification/privacy differences.
- [Parallel contract](../../coordination/briefs/lms-wave-20261024/CONTRACT.md): bounded ownership and acceptance criteria published before work.

## Reference map by field

Representative established products/standards, not a universal ranking, endorsements or copied visual designs. Links below lead to reviewed official sources; design transfers are KAIRO proposals. The child research packs include detailed per-product capabilities and caveats.

| Field | References | Pattern KAIRO should evaluate | Why / what to avoid |
|---|---|---|---|
| Institutional LMS | [Moodle](https://docs.moodle.org/501/en/Student_progress), [Canvas](https://community.instructure.com/en/kb/articles/660896-how-do-i-add-prerequisites-to-a-module) | Clear module/activity requirements and concrete next step | Do not confuse a completed action with mastery or invent a human gradebook |
| Assignment entry | [Google Classroom](https://developers.google.com/workspace/classroom/add-ons), [LTI Advantage](https://developers.imsglobal.org/lti-advantage-overview) | Enter the correct lesson/course from the institution | Course roles must be trusted; licence/publication and platform integration work remain |
| Grounded material | Google Notebook/Gemini Notebook, detailed links in LMS memo | Source selection and inspectable support passages | Citations can resolve while an explanation is still wrong; preserve semantic review |
| Practice and course study | Khan Academy and Coursera, official comparison links in LMS memo | Attempt-specific feedback, resumption and visible learning sequence | No imported efficacy claims, fabricated grades or completion-to-employment leap |
| Interactive science | [PhET](https://phet.colorado.edu/en/research), [Labster](https://help.labster.com/en/articles/3016151-student-labster-101-getting-started-with-labster) | Predict, explore, explain and return to a defined objective | Simulation does not establish hands-on equipment competence |
| Spatial environments | [Spatial](https://www.spatial.io/education), existing Three/R3F | Reusable room templates and meaningful object interaction | Don't add a multiplayer lobby before a task needs collaboration |
| Scenario authoring | [H5P](https://h5p.org/branching-scenario), [BlockNote](https://www.blocknotejs.org/docs/features/blocks), [Tiptap](https://tiptap.dev/docs/editor/extensions/functionality/uniqueid) | Structured editable blocks, stable identities and branching feedback | Existing KAIRO block schema stays canonical; evaluate one editor adapter. Feature availability/licences are component-specific; no all-free-stack assertion |
| Agent-selected interfaces | [Google A2UI](https://a2ui.org/) | Allowlisted component catalogue rendered by the client | Protocol adoption is optional; permissions and correctness still require server enforcement |
| Design iteration | [Google Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/), existing KAIRO C tokens | Explore actual journey states with current design rules | A generated screen is not backend integration or tested usability |
| Task organisation | [Linear](https://linear.app/docs/creating-issues), [Notion](https://www.notion.com/en-gb/help/intro-to-workspaces) | Stable navigation, draft continuity and explicit operation states | Avoid turning study into a project-management dashboard |
| Professional identity | LinkedIn, [GitHub pins](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile) | Curate a few inspectable examples and explain own contribution | Social endorsement, stars and activity are not verified skill |
| Portfolio stories | Behance, official sources in profile memo | Problem, contribution, artifact and evidence as a readable story | Do not copy public-by-default publishing into private learner work |
| Credentials | Credly, [Open Badges](https://www.1edtech.org/standards/open-badges) | Issuer, criteria, evidence, dates and real verification status | A badge icon or practice log is not an issuer-verified qualification |
| Student opportunities | Handshake, official sources in profile memo | Role interests, controlled visibility and dated original adverts | No implied institutional network, employer partnership or hiring guarantee |

## Better product logic

**Differentiate identity, learning context and audience.** Account identity answers who may access a record. Institution/course/module/year answers which content is relevant. Roles answer what actions are allowed in an organisation/course. Sharing audience answers who may see selected evidence. One email domain, a selected course or a CV cannot establish all four.

Proposed access roles: learner owns private work; a human instructor may see assigned submissions only through a real course relationship; a reviewer sees explicitly submitted evidence; an employer sees only consented selected records; an organisation admin provisions membership without automatic access to every private note. KAIRO's avatar is an AI teacher, not an institutional assessor. Build and test actual grants before exposing these roles.

**Start from a goal, then reduce uncertainty.** A guest can upload/paste or try an authored motor example. An enrolled learner can arrive with a trusted module context. A working learner can choose a task. Keep the first useful activity quick; make CV/profile enrichment optional and explain its use. Do not infer a fixed learning style or ability from a brief preference questionnaire.

**Keep curriculum and skill evidence separate.** Exact institution/version/module codes remain source-linked; cross-code equivalence is a reviewed mapping, not name similarity. A role requirement maps to evidence tasks with a documented rubric. Show 'evidence not yet available' instead of a made-up employability percentage. Subsequent recommendations can explain recorded attempts/hints, with learner override.

**Make adaptation reversible.** Before changing lesson structure, show a proposed patch: which block changes, why from the stated goal/current attempt, source support and any new cost/processing. Accept, reject, undo and compare versions. Never lose a typed answer when the activity representation changes. Existing draft schema/validator is the starting point; richer chart/scene blocks need their own versioned contract.

**One saved-work story.** Sources/lessons currently live in the local app-host workspace; notes/progress in browser storage; hosted private progress is a separate narrow backend. Current account forms and proposed profile sharing do not join those stores. Integration must explicitly choose local versus account scope, show migration preview/conflicts and protect earlier work through cancellation/retry.

## Build order and acceptance gates

| Order | Root integration | Bounded Luna support after publishing interface | Acceptance evidence |
|---|---|---|---|
| 1 | Mount session/account with honest scope and revoked/disabled policy | Session lifecycle and stale-result tests | Sign-in/refresh/sign-out/switch never leaks old state; real two-account checks |
| 2 | Owner-scoped sources, reviews, lessons and progress | Repository isolation/export/delete fixtures | Cross-account read/write/delete/export denied; migration explicitly chosen; no global local API exposed |
| 3 | Durable import and truthful partial coverage | Current four new extraction cases plus missing visual/scan evaluation | Recoverable jobs, actual cancellation semantics, no false 'fully understood', retained original/revision |
| 4 | Editable lesson and pre-send source selection preview | Citation/patch/undo/conflict regression cases | Exact citations, immutable source version, reversible edits, clear cloud consent |
| 5 | Mount one motor teaching pack and permitted scene bridge; then pump | Objective/scene-state/allowed action tests and engineering content review | Predict→change→observe→explain→saved evidence works in reading and studio |
| 6 | Curated profile preview and explicit share grants | Public/private preview, expiry/revocation and claim-level tests | No unselected/private record leaks; evidence labels truthful; links safe |
| 7 | Evaluated recommendations and fresh opportunities | Baseline rules, dates, cost and outcome evaluation fixtures | Explainable next action beats baseline on actual task metric before predictive claims |

No new cloud purchase, deployment, model call, live profile publication or browser observation occurred in this wave. Research does not authorise those actions on its own. Existing user authorisation governs later concrete deployment, with project scope/cost and evidence checks.

## Evidence from this wave

Two requested gpt-6-luna/low workers self-registered their actual effective settings; two existing Luna chats received explicit follow-ups. Worker A added four actual Python extractor tests; root caught and returned an initial cwd-dependent path error, then reran the corrected module. Worker B added four actual selector/draft validator tests. Root combined run: **8 tests, 8 passed, 0 failed/skipped**; see focused-tests.txt. No runtime product source/manifests changed, so no new production build/deployment claim. Previous build/test receipts remain dated prior-wave evidence.

Tests confirm DOCX paragraph/table order and locators, explicit nested-table omission, sparse formula-only XLSX coordinates without evaluation, PPTX slide/notes locators, edited/repeated source identity, UTF-16 offsets, late goal evidence, no-match fallback, stale revision and fabricated support-quote rejection. They do not prove diagram understanding, factual entailment, educational correctness, account isolation or user acceptance.

Root also returned an overstrong 'Only you can see…' privacy sentence in the profile proposal for correction; local shared host/browser storage cannot support that claim. The chat corrected it, and root checked the revised wording. Future private-by-default sharing remains gated on actual isolation and access grants.

## Judging evidence and remaining gaps

| Criterion | This wave's contribution | Still needed |
|---|---|---|
| Product | Extraction/citation regression evidence; concrete connected build gates | Hosted private complete journey |
| Creativity | Source-linked prediction→studio→evidence mechanism | Mounted supported interaction and learner response |
| Usability | Specific state/actions/copy/font/navigation proposal | Human/device/accessibility tasks; hypotheses not findings |
| Sustainability | Small cloud stack, bounded jobs/cost gates, phased institutional integration | Measured cost/session and buyer interviews |
| Impact | Guest/local alternatives, reading parity and private evidence design | Consenting learner trials and observed outcomes |
| Presentation | Coherent journey and inspectable work story | Truthful live demonstration and final video/deck |
| Intelligence | Tested source relevance/citation boundaries and controlled agent composition | Semantic/domain evaluation; held-out data before ML forecasts |
