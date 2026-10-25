# Lesson editor, layout and artifact tools — lane B research

**Checked:** 23 October 2026. **Scope:** read-only product inspection and official documentation research. **No package install, spike, runtime change or browser observation.**

## Recommendation

**Immediate:** keep the current KAIRO-owned React renderer and controlled planner; define the editable lesson/layout JSON and migrations first. Run a future, isolated **Puck** spike only for arranging an allowlisted set of React lesson blocks (reading, cited explanation, diagram, prepared studio panel, practice). Puck's MIT React editor, configurable components/slots, permission controls and serializable data align with the app's React 19 setup. It is not a rich-text lesson editor and its iframe viewport is a preview feature, not evidence of responsive or phone acceptance. No evidence currently justifies adding Puck to production.

For editing long passages, first test whether the existing controlled fields are sufficient. If a real need for block-level prose editing appears, evaluate **BlockNote core** or **Tiptap core** in a separate spike. BlockNote provides a more ready-made block editor; its core is MPL-2.0 while named XL packages (including multi-column, AI and exporters) use GPL-3.0 or commercial licensing for closed source. Tiptap core is MIT and headless, so it gives more control but requires KAIRO to build the editor chrome and citation interaction. Do not combine Puck + BlockNote until two independent acceptance cases prove both are needed.

Keep renderer/lesson schema validation KAIRO-owned. JSON Schema plus a validator (e.g. Ajv, or Zod's schema support) checks structural constraints; application code must resolve source IDs/revisions and verify exact quote/locator spans. Zod does not create citation truth, revision diffs, undo, or approval history. A schema validator is not a sanitizer or a permissions system.

**Later:** evaluate an explicit, versioned lesson document with content blocks and a separate responsive layout tree. Use Puck only for composition over a fixed component registry; use a rich-text editor only inside approved text blocks. Maintain a KAIRO block schema independent of any editor's internal JSON, with import/export adapters, content-preserving migrations and a read-only renderer. Interactive diagrams/simulation commands remain strict JSON interpreted by allowlisted React components and validated domain adapters. No generated HTML, CSS, JavaScript, iframe URL or arbitrary action may execute in the trusted app origin.

## What the current app establishes

Read-only source inspection covered:

- `studio/src/artifact-panel/contract.ts` and `docs/workstreams/static-artifact-contract.md`: strict artifact-panel v1 projection for text/table, exact field allowlist and size/cell bounds; claimed provenance is displayed as unverified; there is no editor, persistence, URL following, HTML or simulation contract.
- `studio/src/static-artifact-view/StaticArtifactView.tsx` and `docs/workstreams/static-artifact-view.md`: validated text/table renderer uses React text children, rejects invalid payloads as a whole, has table caption/headers and a keyboard-focusable overflow region. It does not establish renderer isolation, broad XSS safety, phone acceptance or resource quotas.
- `studio/src/material-planner-ui/MaterialPlanner.tsx` and `docs/material-planner-ui/README.md`: controlled goal/depth/approach panel and at most three source-linked outline cards; it explicitly calls the preview a planning outline, not a generated lesson. Local reading remains exact excerpts. No editor dependency exists in that path.

The app already has source review, revision-linked evidence and lesson reading. An editor must preserve those boundaries and must not replace the existing source/source-revision authority with editor-originated citation metadata.

## Candidate comparison

| Candidate | What the library actually gives | KAIRO still owns | Fit now and caveats |
|---|---|---|---|
| **Puck** | React visual editor, configured component/field registry, nested slots, multi-column layout support, data migrations, permission toggles, data callbacks and viewport preview in an iframe. Official core license is MIT; official Puck 0.17 notes React 19 support. | Lesson semantics/schema, source and revision integrity, block editor inside text, safe prop validation, keyboard alternatives acceptable to learners, persistent save/CAS, approval/undo policy, mobile testing, renderer security and studio command adapter. | Best scoped layout-composition candidate for a later isolated spike. Limit to a fixed allowlist and static schema. Same-origin iframe preview means app-origin styles/context can be mirrored; it is not a security sandbox. WebGL/3D inside preview may mount another renderer/context; measure before enabling, and prefer a static diagram/placeholder in editor preview. Do not assert the tool itself causes React incompatibility. |
| **BlockNote core** | React-oriented block editor with built-in blocks/UI and block JSON document serialization. Official pricing says core is MPL-2.0 and usable in closed-source commercial apps. | Citation as immutable decoration/metadata, source revision validation, KAIRO-specific paragraph/block grammar, editor authorization, versions/approval, layout composition, safe exports and mobile/AT acceptance. | Stronger ready-made authoring experience for prose/block operations than Puck. Decide whether MPL obligations meet project distribution policy. Do not use XL multi-column, AI, or export modules without the applicable GPL-3.0 or commercial license review. HTML export is explicitly lossy in official docs; preserve native block JSON and test round trips. |
| **Tiptap core** | Headless ProseMirror-based rich-text editor, React bindings, extensions and JSON-oriented document model; official docs say open-source core is MIT. | Most UX, block navigation, contextual citation UI, safe schema, layout canvas, save/version/approval, exact-source checking. History/collaboration and some advanced features are paid/proprietary or depend on platform per official pricing/docs. | Good fallback when KAIRO needs precise custom inline citation controls and wants a small custom surface. More build work than BlockNote; do not infer all Pro features are MIT from the core license. |
| **Lexical** | Extensible editor framework with React bindings and custom nodes; official docs describe reliability/accessibility/performance as design goals. | Blocks/UX, citations, schema validation, persistence/migrations, revision review, layout composition and acceptance. | Viable engineering alternative if a custom editor is justified. A stated accessibility goal is not measured conformance. Verify exact license/version for packages selected and validate custom node serialization. Not a page composer. |
| **dnd-kit** | Low-level drag/drop primitives. Official legacy accessibility guide describes keyboard sensor operation, screen-reader instructions and live state requirements. | Every lesson layout, component registry, keyboard alternatives, instructions, collision behavior, touch behavior, persistence and validation. | Use only if a very small custom sortable list remains after a Puck prototype and the app needs its own direct manipulation. It is not a layout authoring product; the keyboard sensor makes drag possible but doesn't by itself give task-appropriate commands or parity. Check package/repository license and current API before selection; upstream now has a newer documentation track, so avoid implementing against the legacy page by assumption. |
| **H5P** | A broad ecosystem of interactive content types, authoring and export/import/runtime options; code licensing aims at MIT but its official licensing page calls out GPL code in the PHP library and content-type variation. | Mapping to KAIRO source revisions/identity, embedding/runtime boundary, content type review, React lifecycle and CSP, cross-origin policy, offline, custom course data, security updates and meaningful learner evidence. | Useful if adopting a separate H5P-compatible content ecosystem becomes a product requirement. Not an inline editor/layout layer for this existing React course. An iframe is a possible integration boundary, not an automatic incompatibility; assess host/runtime, embedding policy, content type and lifecycle before deciding. Review each content type and asset license separately. |
| **Adapt Framework / Authoring Tool** | Separate responsive HTML5 course framework and authoring environment, with assessment, bookmarking, course theming and SCORM-oriented delivery. Official framework page states GPL and its project site states WAI AA intent for framework v2. | Conversion from KAIRO sources/revisions/evidence, integrating another build/runtime/identity/authoring pipeline, learner data and private sharing rules. | More appropriate for authoring/exporting standalone courses than adding an editor panel to KAIRO. Official pages are old (framework page describes v2.1.3 from 2017; the framework v2 accessibility statement is historical); verify current maintenance/build chain before any pilot. GPL requires policy review. An “AA” project statement is not KAIRO acceptance. |
| **JSON Forms + JSON Schema/Ajv** | Schema-driven forms/rendering across React, Angular and Vue; AJV validation and field error display. JSON Forms project license is MIT. | Lesson authoring semantics, layout editing, citations, text editor, document versioning, safe component registry and identity/authorization. | Useful for complex structured lesson metadata/editor sidebars, likely excess for the current small goal/depth controls. It edits form data; it does not author/render a lesson or verify a quote's provenance. |

### Additional candidates from the supplied research prompt

| Candidate | What it contributes | KAIRO work and limits | Disposition |
|---|---|---|---|
| **Plate** | React rich-text framework built around a headless editor runtime and composable plugins; its official docs offer React installation and an optional shadcn-based UI path. The upstream repository is MIT, but its root licence explicitly allows package-directory licence files to override it. An official Plate template advertises React 19, which is a template signal, not an app-specific compatibility guarantee. | KAIRO still needs to build the exact editor chrome, citation/revision anchors, source validation, paste/import policy, durable history, approvals and small-screen behavior. UI kits and plugin packages can add substantial dependencies; audit each selected package and copied component. No KAIRO React/Vite/SSR or accessibility test was run. | Rich-text alternative to BlockNote/Tiptap if its plugin model is materially useful. Do not add it alongside another editor without a separate acceptance case. |
| **Craft.js** | MIT React framework for building a custom page editor; supplies drag/drop, node-tree and component update/move primitives, while its own project guide says the editor UI is left to the implementer. | KAIRO would own the whole authoring surface, keyboard move controls, mobile layout, schema mapping, validation, persistence and accessibility. Current React 19 support and a maintained-version policy were not established by the official documentation reviewed here; verify exact package/version and React peer range before any spike. | Not smaller than Puck for this bounded need. Keep as a fallback only if Puck’s editor UI is too restrictive and KAIRO is willing to own a custom composer. |
| **React Flow (`@xyflow/react`)** | MIT React node/edge diagram editor with selection, pan/zoom and custom nodes. Official docs describe keyboard focus/selection/movement and ARIA help, plus an example that serializes a flow object. Some advanced examples/features are Pro. | The graph is only diagram state; KAIRO must supply semantic node/edge schemas, labels, source links, domain checks, approved renderers, persistence/versioning, responsive interaction and a non-canvas reading alternative. Its documented keyboard behavior is a useful starting point, not KAIRO accessibility acceptance or WCAG certification. | Consider only for a genuinely editable process/relationship diagram. For a fixed motor or circuit illustration, use an approved static SVG/React renderer rather than introduce a graph editor. |

These candidates do not change the immediate recommendation: retain the current KAIRO renderer/planner and define a library-independent schema before choosing any editor. React Flow is the only additional candidate with a plausible role for an interactive diagram, and that role is separate from lesson prose and page composition.

**Licensing note:** this is a shortlist-level read, not legal advice or a complete transitive dependency audit. Recheck exact package versions, license files and all transitive modules immediately before adoption. Any hosted/editor collaboration service adds its own commercial terms, data residency and retention review.

## Capability boundary matrix

| Need | Candidate contribution | KAIRO-owned acceptance |
|---|---|---|
| Edit explanation, example, prompt | BlockNote block editor or Tiptap; Puck fields can edit simple strings | Preserve stable block IDs, text/source distinction, safe inline marks, validation, unsaved-work recovery and human-readable change proposal |
| Add/remove/reorder/split/merge | Puck component actions; rich-text editor block commands; dnd-kit low-level movement | Keyboard-visible move up/down alternative and announcements; commands preserve citations/IDs and give undo; split/merge marks affected anchors for re-review |
| Layout: reading, side-by-side diagram, lesson/studio | Puck configured components/slots or KAIRO renderer | Fixed approved layout nodes, mobile order, minimum widths, reading fallback and no executable author-provided styles/actions |
| Responsive preview | Puck viewport sizes/iframe; Adapt outputs responsive course; CSS media queries in host | Preview helps author inspect width only. Test actual target phone/tablet/browser with keyboard, zoom, orientation and assistive tech; a viewport label is not device acceptance |
| Citations | Editor can store extension attributes/fields | Resolve source ID + immutable revision, verify exact quote against reviewed text and locator, distinguish generated/authored material, visibly mark stale anchors; reject or flag on revision mismatch |
| Schema validation | JSON Schema/Ajv, Zod, editor node schemas | Exact versioned schema, unknown-field policy, domain checks, cross-field identity, source fact validation, limits, migrations and approval policy |
| Undo/versioning | Puck has editor history APIs; rich editors may expose local history; collaboration suites may sell server history | Define transaction boundary, history retention, compare UI, revision invalidation, independent version IDs, conflict/CAS, restore semantics and audit trail. Library undo alone is not durable version history |
| Persistence/autosave | Editor callbacks/onChange can report mutation | Durable host API, debounced writes with request identity, optimistic concurrency/version token, retry queue, offline state, quota handling, explicit saved receipt. Never blindly overwrite a newer tab |
| Artifacts/interactive content | H5P provides packaged activity types; Puck can compose only components registered in its config | Prefer validated JSON + compiled React renderers. Never execute stored HTML/JS. If sandboxed artifacts are later considered, set origin isolation, restrictive CSP/sandbox tokens, message schemas, resource/time caps and separate domain review |
| Studio controls | None of these should issue arbitrary app commands | KAIRO action allowlist, exact typed schema, bounded numeric ranges, current lesson/studio identity and explicit user gesture; no generated code or direct context mutation |
| Accessibility | Libraries provide semantics/features to varying degrees | KAIRO end-to-end keyboard, focus, screen reader, labels, contrast, zoom/reflow, touch and reduced-motion testing. No vendor badge is inherited as our certification |

## Corrected claims from the supplied AI answer

1. **Puck React 19 claim:** supported by the project’s Puck 0.17 announcement, which says React 19 support was made official. This does not establish compatibility with every app plugin or KAIRO’s particular React Three Fiber canvas lifecycle. Puck’s current docs document multi-column, slot components, data migration and iframe viewports; they do not prove mobile usability or keyboard parity for KAIRO.
2. **“Puck solves accessible reordering”:** not established by the inspected official docs. Puck exposes drag controls and slots; use native move-up/down actions and test keyboard/AT parity in KAIRO. dnd-kit documents a keyboard sensor, but instructions, announcements, order semantics and touch operation remain integration responsibilities.
3. **BlockNote license:** core is MPL-2.0 per official pricing, while XL packages include AI, multi-column and exporters and are GPL-3.0 or commercial for closed-source use. “BlockNote is MPL” without feature/package distinction is incomplete. The AI answer incorrectly implied XL features are merely optional without explaining GPL/commercial consequences; keep XL out of the baseline.
4. **JSON Schema/Zod:** validates data shape and types. A citation `sourceRevisionHash` string that passes schema is still only a string. Citation truth requires app lookup and exact quote check. Diffing, anchor dependency invalidation, approval, undo and durable rollback are separate KAIRO algorithms/state.
5. **Responsive preview:** Puck viewports run in an iframe to simulate widths. That feature can find layout issues, but doesn't prove real phone performance, keyboard usability, font scaling, touch targets, assistive technology or actual renderer behavior. Puck’s data prop is initial-only after mount per docs; an integration must not assume updating it is a controlled form API.
6. **Iframe/sandbox:** neither “iframe equals secure sandbox” nor “iframe is automatically incompatible with React 19/Three.js” is accurate. Puck's same-origin preview can sync host styles, and iframe is configurable; same-origin scripting is not a trust boundary. Embedded H5P or custom artifacts need a purpose-designed origin/sandbox/CSP/message contract. React concurrent lifecycle and GPU context implications need a separate technical spike.
7. **dnd-kit and keyboard:** the legacy official guide documents keyboard sensor patterns, Enter/Return/Space/ Escape and screen-reader instructions; it does not make an entire authoring task accessible automatically. KAIRO should supply explicit buttons to move blocks and ensure reorder result announcement.
8. **H5P/Adapt:** their separate runtimes and content/build models increase integration work, but React incompatibility should not be asserted categorically. H5P licensing is nuanced (MIT aim with GPL code in PHP library, varying content types); Adapt is a distinct GPL course framework with dated published browser/accessibility information. A neutral pilot could test export/embed boundaries later.
9. **Zod/JSON is not an execution sandbox:** never evaluate field values, generated HTML, dynamic imports, SVG scripts or simulation commands. Structural validation cannot sanitize a different output context or grant access.
10. **“Save every 30 seconds”:** no source-backed reason to use this fixed interval was established. A blind autosave timer can lose newer edits, overwrite another tab and mislead learners about durability. Prefer on-change debounce plus version token/CAS and explicit save state, with blur/visibility flush, retry limits, pause/offline and recoverable drafts. A visible manual save is appropriate until reliable host persistence exists.

## Proposed data and change boundary

Keep content and layout distinct so a layout edit cannot rewrite source text. Example only; it is not a production API or new schema commitment:

```json
{
  "schemaVersion": 1,
  "lessonId": "lesson-example",
  "source": {"id": "source-example", "revision": "rev-example"},
  "blocks": [
    {"id": "b-1", "kind": "explanation", "title": "Rotating field speed", "body": "Synchronous speed is 120 times frequency divided by pole count.", "origin": "source-supported", "citations": [{"sourceId": "source-example", "revision": "rev-example", "locator": "page 6", "quote": "Synchronous speed = 120 x frequency (Hz) / number of poles"}]},
    {"id": "b-2", "kind": "worked-example", "title": "An authored 50 Hz calculation", "steps": ["120 × 50 ÷ 4 = 1,500 rpm"], "origin": "authored-derivation", "citations": [{"sourceId": "source-example", "revision": "rev-example", "locator": "page 6", "quote": "Synchronous speed = 120 x frequency (Hz) / number of poles"}]},
    {"id": "b-3", "kind": "interactive", "renderer": "motor-speed-v1", "parameters": {"frequencyHz": 50, "poles": 4}, "origin": "kairo-authored-parameter", "citations": []},
    {"id": "b-4", "kind": "practice", "title": "Predict before calculating", "prompt": "What is the synchronous field speed for two poles at 50 Hz?", "answerMode": "known-calculation", "citations": [{"sourceId": "source-example", "revision": "rev-example", "locator": "page 6", "quote": "Synchronous speed = 120 x frequency (Hz) / number of poles"}]}
  ],
  "layout": {"kind": "sequence", "children": ["b-1", "b-2", "b-3", "b-4"]}
}
```

Motor content above follows the official DOE formula cited by the earlier material-authoring research: the DOE printed page gives the formula and printed 60 Hz values. The displayed 50 Hz result is arithmetic authored by KAIRO, not a quoted source result. The interactive range/default and exercise parameters are KAIRO design, not equipment validation. Keep a source citation as an immutable reference object; an editor may move the block but may not silently edit the quote while retaining verified status.

For “make this shorter” or “add an example,” accept a **proposal transaction**, not an in-place mutation:

1. Capture base lesson revision, source revision, block IDs and selection.
2. Produce a constrained operation list (`replaceText`, `insertBlock`, `moveBlock`, `deleteBlock`) with typed payloads. Reject unknown operations/fields and any executable content.
3. Validate structure, count/length budgets, target IDs, citations, approved renderer, and cross-revision source quotes.
4. Show old/new text and citation changes; preserve unaffected IDs; mark citation-affected blocks for review.
5. User approves or rejects. On approval, submit with base lesson version; server CAS rejects if a different writer advanced it. Never silently retry against fresh data.
6. Store a new immutable draft/version with parent version and actor; offer undo as a new transaction that restores prior values, not destructive erasure of audit history.

Puck undo stack is useful within an active editing session but does not itself provide KAIRO's durable versions, source-aware diff or optimistic concurrency. BlockNote/Tiptap local editor history likewise does not solve course-level rollback. Autosave should wait for real durable API semantics; never imply “saved” before a successful host receipt.

## Staged build choices

### Stage 0 — before editor dependency

- Keep `MaterialPlanner` as the controlled planner and existing KAIRO renderer.
- Publish a versioned block/layout schema with fixed IDs, origin, exact citations and strict unknown-field rejection; define migrations and invalidation rules.
- Add host-owned add/remove/move-up/down and plain text edit controls if needed. Each edit should produce a proposal/transaction and validate against reviewed source. Keep local reading available without editor or cloud.

### Stage 1 — optional Puck spike, isolated

Only if learners/educators need visual composition after Stage 0, create a local experiment in a separately claimed package. Use a tiny config of five approved components (explanation, worked example, diagram, motor panel, practice). Set `iframe` deliberately; compare iframe on/off, initial data behavior, styles, keyboard movement, multiple previews and webGL canvas memory. Use no generated code, external components or Puck publish callback that claims persistence. Convert Puck data -> KAIRO schema through a whitelist mapper; never store raw editor Puck config as canonical lesson. Run dependency/license audit and real accessibility/device test before selecting it.

### Stage 2 — prose block editing, only if required

Prototype BlockNote core and Tiptap core separately using the same KAIRO schema adapter and synthetic source. Measure input latency, emitted JSON, citation editing, keyboard block reorder, paste/import sanitation, SSR/hydration, package size and lossless migration. If BlockNote XL is considered, stop for licensing decision; do not treat XL trial or GPL package as approved production use. Lexical remains a custom UI alternative, not an automatic win.

### Stage 3 — export and interactive content

First implement a deterministic export from the KAIRO schema. For interactive artifact types, add a static strict JSON contract and allowlisted renderer; source/provenance labels remain claims until independently verified. Evaluate H5P/Adapt only where standards-based course export/import is a specific buyer need. Require threat model, origin sandbox and course data mapping before embed.

## Acceptance plan and judging map

| Criterion | Learner need / observable acceptance | Current evidence and gap |
|---|---|---|
| Product | Edit an explanation/sequence and reopen the exact revision without losing citations | Current planner/reading contracts exist; no visual editor, persistent draft/version or editor acceptance |
| Creativity | Compose a cited explanation beside a meaningful reviewed diagram/studio view | Existing supported artifacts/source lesson are separate; layout + lesson integration unbuilt |
| Usability | Keyboard user can add, reorder, undo and understand source changes on phone | Library docs describe primitives only; no KAIRO keyboard, phone, screen-reader or learner test |
| Sustainability | Small schema survives renderer/editor replacement and export | Proposed adapter/schema policy here; no migrations/export acceptance |
| Impact | Learner can edit plain reading content when 3D/cloud fail | Existing reading path supports baseline; no validated impact or editor fallback study |
| Presentation | Demo clearly distinguishes reviewed source, authored example, generated draft and simulation values | Current artifact provenance says “not verified”; new authoring version labels not implemented |
| Intelligence | A proposed edit cites exact current source and explains what changed | Schema validator cannot verify claim; no proposal/diff/source-anchor pipeline |

**Evidence status:** official pages and local source files were inspected on 2026-10-23. No package was installed; no API, spike, benchmark, phone, browser or screen reader was used. Licence/version and maintenance can drift; audit before selection. No ten-point score or learner outcome is claimed.

## Official primary sources checked 23 October 2026

- Puck introduction, core MIT license, viewport feature: https://puckeditor.com/docs
- Puck React 19 release note (0.17): https://puckeditor.com/blog/puck-017
- Puck Slot field / allowlist: https://puckeditor.com/docs/api-reference/fields/slot
- Puck editor, iframe/viewports, initial data and onChange: https://puckeditor.com/docs/api-reference/components/puck
- Puck permissions: https://puckeditor.com/docs/api-reference/permissions
- BlockNote introduction: https://www.blocknotejs.org/docs
- BlockNote current license/pricing split: https://www.blocknotejs.org/pricing
- BlockNote XL commercial license: https://www.blocknotejs.org/legal/blocknote-xl-commercial-license
- BlockNote JSON/native serialization vs lossy HTML: https://www.blocknotejs.org/docs/features/export/html
- Tiptap overview/core MIT and extension tiers: https://tiptap.dev/docs/editor/getting-started/overview
- Tiptap React integration: https://tiptap.dev/docs/editor/getting-started/install/react
- Tiptap pricing / hosted history and collaboration notes: https://tiptap.dev/pricing
- Lexical introduction: https://lexical.dev/docs/intro
- dnd-kit keyboard accessibility guide (legacy docs; verify current package API): https://dndkit.com/legacy/guides/accessibility/
- dnd-kit current docs: https://dndkit.com/
- H5P licensing: https://h5p.org/licensing
- H5P content-type accessibility overview: https://h5p.org/documentation/installation/content-type-accessibility
- Adapt Framework, GPL, dated framework/version information: https://www.adaptlearning.org/index.php/adapt-framework/
- Adapt Framework v2 accessibility qualifications: https://www.adaptlearning.org/index.php/adapt-framework-2-0/index.html
- Adapt guiding principles / GPL v3: https://www.adaptlearning.org/wp-content/uploads/2016/01/Adapt_guiding_principles.pdf
- JSON Forms core and MIT license: https://jsonforms.io/api/core/index.html
- JSON Forms/AJV validation: https://jsonforms.io/docs/validation/
- Zod JSON Schema conversion docs: https://zod.dev/json-schema
- Plate React editor framework: https://platejs.org/docs
- Plate React installation and package choices: https://platejs.org/docs/installation
- Plate upstream MIT licence (package-level files may override): https://github.com/udecode/plate/blob/main/LICENSE
- Plate React 19 template example (not a compatibility guarantee for KAIRO): https://pro.platejs.org/docs/templates/minimal
- Craft.js overview and UI ownership: https://craft.js.org/docs/overview
- Craft.js upstream repository and stated MIT license: https://github.com/prevwong/craft.js/
- Craft.js license file: https://github.com/prevwong/craft.js/blob/main/LICENSE
- React Flow project overview and core MIT license: https://reactflow.dev/
- React Flow keyboard/screen-reader guidance (feature documentation, not certification): https://reactflow.dev/learn/advanced-use/accessibility
- React Flow save/restore example (diagram object only): https://reactflow.dev/examples/interaction/save-and-restore
- React Flow examples catalogue, including paid Pro examples: https://reactflow.dev/examples
