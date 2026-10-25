# KAIRO editable learning kit and architecture

23 October 2026. Five research lanes plus independent root synthesis: two existing chats and three requested gpt-6-luna/low subagents were dispatched; one chat declined its new task and a completed subagent took the intake lane under a separate scope. Actual model/effort is self-reported in bus/handoffs; requested settings do not establish all chats ran Luna. Root: codex-authoring-architecture-20261023-q, gpt-6 / effort unknown.

**Result:** a step-by-step, researched design from file intake through editable lesson blocks, approved structural changes, registered activities, assessment and resumable output. A small offline contract/demo is executable now. The live application has not been migrated to this contract or given a rich-text/layout editor by this task.

Start with [architecture and decisions](ARCHITECTURE.md), [orchestration choices and model exchanges](ORCHESTRATION.md), then [implementation order](NEXT-WORK.md) and [repeatable research/feedback loop](RESEARCH-LOOP.md).

## Parallel findings

| Lane | Deliverable | Key decision / limitation |
|---|---|---|
| A: file intake and retrieval | [Ingestion research](../authoring-intake-independent-20261023/INTAKE-RETRIEVAL-MEMO.md) | Keep bounded current parsers; preserve structure/originals and immutable source history before expanding formats |
| B: editing and layouts | [Editor research](../authoring-editor-20261023/README.md) | Canonical lesson data first; optional Puck composition spike; rich-text editor chosen separately if needed |
| C: teaching and AI | [Intelligence research](../authoring-intelligence-20261023/README.md) | Models propose language/sequence; code verifies structure, quotes and known calculations; humans review correctness |
| D: security and revision safety | [Safety review](../authoring-safety-20261023/README.md) | Exact version-bound approval, strict capabilities, no arbitrary generated execution, durable conflicts/history |
| E: studio integration | [Engineering activity contract](../authoring-studio-20261023/ENGINEERING-ACTIVITY-CONTRACT.md) | Motor calculator is not an externally controllable scene; pump interface remains unmounted/proposed |

Read alternatives as evaluated proposals, not five mutually compatible final schemas. Root's selected immediate contract is the isolated six-block/single-source kit. Later multi-source claims/layout trees need a separately reviewed version.

## Executable output

[Kit instructions](../../tools/lesson-authoring-kit/README.md), [JSON Schema](../../tools/lesson-authoring-kit/lesson.schema.json), [workflow stages](../../tools/lesson-authoring-kit/pipeline.json), [draft prompt](../../tools/lesson-authoring-kit/prompts/draft-lesson.md), [revision prompt](../../tools/lesson-authoring-kit/prompts/revise-block.md).

```powershell
node --test tools/lesson-authoring-kit/contract.test.mjs
node tools/lesson-authoring-kit/demo.mjs
```

Actual result: **12/12 tests passed**, independently rerun by the safety reviewer. [Log](contract-tests.txt). The demo generates [a readable static report](demo/reading-report.html) and source, lesson, proposal, applied and undone JSON files. Data is synthetic and labelled; approval is scripted. No LLM, cloud, learner test, live studio or browser was used.

Test coverage includes exact source offsets/hash/locator, stale source, unreviewed source, fabricated quote, strict unknown-field/type/ID rejection, calculator bounds, invalid answer options, input size, changed proposal/base, explicit result digest, cancellation-at-commit, undo-after-edit rejection, detached state and escaped hostile text. One deliberate fixture proves semantic answer-key mistakes can still pass structural validation: human/domain review remains essential.

JSON Schema is a prevalidation specification, not proof an external validator/provider implements every constraint. Runtime additionally checks cross-field relationships and source hashes. The key-sorted local digest is not claimed RFC 8785 compliance or authenticated approval. No runtime persistence, source history, multi-tenant authorization, studio dispatcher or source entitlement is created by this spike.

## Formats and tool choices

| Input/output | Current app support found | Selected next step |
|---|---|---|
| Pasted text, TXT/MD | Local text extraction/review; upload preview truncates displayed content | Preserve exact text and coverage; Markdown remains data, not executable HTML |
| PDF with text | pypdf text; first four pages in upload path | PDF.js candidate for original-page review once retained-original access exists; page/offset map |
| Scanned PDF, PNG/JPEG | RapidOCR via local ONNX; PDF raster via pypdfium2 | Review confidence/reading order, retain polygons/locations; representative OCR fixtures before new engine |
| DOCX | python-docx paragraph/table extraction, no reliable printed page numbers | Use section/paragraph/table locators, not invented PDF-style pages |
| PPTX | ZIP/XML slide text | Retain slide ordering/layout metadata before diagram promises |
| XLSX | openpyxl read-only formulas-as-text, up to 100 rows ×20 columns per displayed sheet | Preserve cell coordinates/formulas; do not execute arbitrary spreadsheet content |
| CSV, HTML/web, audio/video, YouTube transcripts | Not admitted by current upload extension allowlist | Separate reviewed adapters, rights/SSRF/transcript permissions and limits; never label generally supported now |
| Lesson JSON | Existing fixed chapter/quiz runtime; new bounded block contract is isolated | Versioned adapter/import validation and immutable source bundle before live adoption |
| HTML reading export | This kit generates escaped static reading report only | Not a runnable AI-generated website, sandbox or interactive studio export |
| Interactive diagrams, 3D, MP4 explainers | Existing authored motor/pump assets and prior media foundations | Registered renderer/template jobs separately bounded and provenance-labelled; no arbitrary generated code |

Docling is a justified structured-extraction spike candidate for complex layouts/tables, not an automatic parser replacement or installed model. PDF.js is a viewer/parser, not an OCR or lesson-planning engine. [Docling documentation](https://docling-project.github.io/docling/), [PDF.js documentation and Apache-2.0 notice](https://mozilla.github.io/pdf.js/). Exact parser/model/transitive licences and measured quality need review before adoption. Full candidate/licence matrix is in lane A.

## Critical current-code findings

The upload worker already has 8 MB admission, ZIP entry/expanded-byte limits, image pixel limits and a 120-second parent timeout. Do not claim all parser bounds are missing. It still needs stronger container/type validation and process/resource isolation before public exposure.

The original upload is deleted after extraction. The source projection keeps text/locator/method and drops richer extraction fields. Source review overwrites a mutable current source record, with no immutable historical revision resolver or transactional expected-revision save. Therefore original-page comparison, retention controls, source history and old-lesson survival need storage/API work; installing a viewer alone cannot provide them. The research does not silently change current retention policy.

The live source model already verifies quote membership/IDs and the source-classroom loader checks revision/offsets. Chapter citation membership does not establish entailment; structural checks do not certify learner outcomes or official marking keys. The new kit recomputes native reviewed-source hash but still depends on a trusted loader and authorized owner.

## Independent review corrections

- Filled-in learner goals must still carry depth/activity preferences (fixed in prior integrated material package, retained here).
- Corrected a worker citation pointing at a different AI provider to the user's actual docs.aimlapi.com provider; model-specific capabilities are still unverified in KAIRO calls.
- Corrected stale blanket “isolated/unintegrated” language: readiness/material planners are integrated in specific existing views; new editable authoring orchestration and the adaptive policy/bridge remain separate.
- Rechecked source hash and tightened undo receipt in root spike. Independent reviewer found no critical execution defect within isolated scope, not a production security sign-off.
- Schema now rejects whitespace-only strings; runtime-only cross-field answer-index/quote constraints are explicit.
- Both chats resumed historical curriculum/module tasks after compaction. Root read current turns and reissued the current assignments. The module chooser reservation was released without changes. The curriculum chat completed a separate metadata/validator follow-up (CURRICULUM-CATALOG-VERIFY-001, changed registry/model/tests and evidence); its owner-reported 6/6 tests are not authoring-kit evidence or root acceptance of that separate package. Root preserved those changes and did not expand into their scope. The intake chat subsequently declined continuation, so a replacement subagent was assigned docs/authoring-intake-independent-20261023 under separate ownership. Root requested the declining owner release its unfinished research claim; no foreign claim was cleared by root.

Root and the intended research lanes did not change live app code; the separately resumed curriculum follow-up above is recorded as an exception to the research-only scope. No packages installed, weights downloaded, provider credits spent, cloud deployed, scheduler recreated, or browser observation performed. Remaining human/device/subject review is recorded, not ticked off.
