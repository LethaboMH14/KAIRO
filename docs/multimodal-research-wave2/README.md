# KAIRO multimodal document and image research — wave 2

Research checkpoint: 23 October 2026. Owner registration: `codex-luna-multimodal-wave2-20261023-a` (Codex; exposed model `gpt-6`; effort not exposed, registered `unknown`). Scope: image/document/material extraction and visual model candidates only. This is a design/evidence package, not an installed or integrated pipeline. Existing public project docs and extractor source were read; no user-uploaded/private learner documents were inspected. No inference, installation, training, browser-app observation or cloud mutation was performed.

## Decision in one page

Build one deterministic, local-first extraction job that produces **typed source blocks with exact source anchors**, coverage and review flags. Keep native/lightweight parsers for born-digital formats; use Docling as the single structured-layout comparator for difficult PDFs, scans, formulas, tables and slide layouts. Do not make a vision LLM the parser of record. Offer a separate, explicit, consented “describe/interpret this figure” operation only after the learner selects a page region and sees the exact image being sent. Preserve raw OCR and vision claims as proposals with their method/model/version; learner review creates a new immutable revision.

Recommended bounded first implementation:

1. Keep KAIRO's current source ID/revision, reviewed text and exact page/slide/cell locators as the durable source of truth. Add an extraction-run envelope and typed `SourceBlock` proposal; do not migrate lesson blocks or source revision semantics in this lane.
2. Test Docling `2.134.0` in a disposable isolated worker, CPU first, against current native parser baselines. Enable only selected OCR dependencies after comparison; do not install all OCR/VLM extras. The official install docs support Windows x86_64 and show separate OCR extras; actual project runtime fit and memory must be measured before choosing production packaging.
3. Use Tesseract 5.5.3 (Apache-2.0 engine; language data has separate terms) as a simple local OCR comparator for clean printed scans; keep current RapidOCR 1.4.4 as the installed baseline from `tools/course_sources/extract.py`. Test handwriting, rotated pages, faint scans and formula symbols; an OCR score is not truth.
4. Use MarkItDown 0.1.9 only as a lightweight readable-text conversion baseline. Its new `markitdown-ocr` vision plugin is an optional model/API path, not a local OCR engine; do not enable it implicitly for a private upload. Compare its flattened output with Docling on tables, notes, formulas and anchors.
5. For free hosted visual experiments, explicitly pin a named free model and provider route; first candidates are OpenRouter `qwen/qwen3.8-27b:free` and `inclusionai/ling-3.0-flash-vl:free`, then compatible filtering with `openrouter/free`. Groq's live vision doc lists `qwen/qwen3.8-27b`, but it is a paid listed tier in the current model table; it is not a free candidate unless the account's actual plan grants free usage. No provider request occurred here.
6. Do not send complete learner material to a hosted VLM. Use local extraction and learner-approved, crop-only synthetic/public evaluation first. If a later explicit cloud action is approved, send only one bounded page crop plus the necessary reviewed text, report provider/model/location/retention, and keep a local path if consent is declined or the service fails.

Acceptance for a first spike: on the fixture matrix below, every emitted block is either (a) verbatim text with a resolvable source locator and extraction provenance or (b) visibly tagged unverified model proposal. Report page/slide/sheet/row/region coverage and all skipped/failed units. There must be no unsupported citation, guessed numeric/formula value, hidden sheet execution, cross-revision mix, silent truncation, or claim that text extraction covered a visual figure.

## Current KAIRO baseline and task boundary

Read-only inspection found `tools/course_sources/extract.py` already extracts a bounded PDF prefix with pypdf, PDF OCR via optional RapidOCR, PPTX slide text from OOXML, DOCX paragraphs/tables via python-docx, XLSX values/formulas as strings via openpyxl, and image OCR if the optional engine is supplied. Its output retains source hash, extractor method, some page/sheet identity, OCR polygons/confidence and marks all extraction `needsReview`. The CLI caps inputs to 1–50 files, 1–10 pages and 0–100 screenshots; the default is two pages. This is a useful honest baseline but the prefix cap is not whole-document coverage, PPTX notes/visual objects are not included in the shown parser, DOCX page number is unavailable, formula/cached-value distinction and cell references are not retained, and no chart/diagram scene interpretation is done.

The current Node source model (`studio/server/workspace/model.mjs`) hashes the source JSON/reviewed pages and creates evidence slices that retain source ID, revision, locator and offsets. This lane proposes a separate extraction adapter output only. Parent owns server/runtime and any route/schema integration. Root's published cloud contract explicitly defers initial cloud copies to reviewed source snapshots; this research does not recommend whole-document cloud analysis or automatic upload.

## Proposed normalized extraction contract

Keep a stable extraction envelope distinct from lesson content and from the immutable source revision:

```ts
type ExtractionRun = {
  schemaVersion: 1;
  sourceId: string; sourceRevision: string; contentSha256: string;
  startedAt: string; completedAt: string;
  extractor: { name: string; version: string; optionsHash: string };
  coverage: { discoveredUnits: number; attemptedUnits: number; completedUnits: number;
             skipped: Array<{ locator: Locator | null; reason: string }>;
             failures: Array<{ locator: Locator | null; code: string }> };
  blocks: SourceBlock[];
};

type Locator =
 | { kind: 'pdf-region'; pageIndex: number; printedPage: string | null; bbox: [number,number,number,number]; pageSize: [number,number] }
 | { kind: 'docx'; part: string; paragraphIndex?: number; tableIndex?: number; rowIndex?: number; cellIndex?: number }
 | { kind: 'pptx'; slideIndex: number; shapeIndex?: number; notesIndex?: number; bbox?: [number,number,number,number] }
 | { kind: 'xlsx'; sheet: string; range: string }
 | { kind: 'image-region'; bbox: [number,number,number,number]; imageSize: [number,number] }
 | { kind: 'media-time'; startMs: number; endMs: number; keyframeMs?: number };

type SourceBlock = {
  blockId: string; kind: 'heading'|'paragraph'|'list-item'|'table'|'formula'|'figure'|'chart'|'transcript';
  text: string; locator: Locator | null; parentBlockId: string | null; order: number;
  provenance: { method: 'native'|'docling'|'ocr'|'vision-proposal'|'asr';
    modelOrEngine: string; version: string; confidence: number | null; reviewed: boolean };
  warnings: string[];
};
```

Rules:

- Bind `sourceId`, source revision and byte hash before work begins. Re-check before commit; cancelled or stale jobs can produce no reviewed revision.
- `pageIndex`/slide indices are zero-based internally; display one-based. Printed page labels are separate, optional source data, never inferred from PDF index.
- Store extractor polygon coordinates with declared origin and page dimensions, and convert to pixels only at display. No geometry means `locator:null` and lower grounding precision.
- Keep original text, normalized text, cell formula text and cached display value as separate fields where relevant. Never execute spreadsheet formulas/macros. Hidden sheets/rows are surfaced in coverage metadata and not silently merged into learner material.
- Extraction, OCR and VLM output starts `reviewed:false`, `needsReview:true`. Only user correction/review creates a new reviewed source revision. A model cannot establish enrolment, answer keys or official correctness.
- Store a supported item's original source locator and hash; do not put textbook bodies, private LMS material, originals or learner records in public fixtures/model prompts.
- Model-vision outputs are `figure`/`chart` proposals with the page/crop anchor, prompt template ID and actual returned provider/model. Never label a scene caption as OCR, or model-inferred values as extracted cell/axis values.

## Format and method comparison

| Material | Current/local baseline | Candidate and role | Anchor and coverage requirement | Key failure / decision |
|---|---|---|---|---|
| Born-digital PDF | pypdf text, existing prefix cap | Docling layout/tree + optional table/formula models; PDF.js remains viewer not OCR | every page index, text item order and boxes when available; full page count vs attempted count | text-only PDF may still contain vector labels or figures; scan detection must be page-level. Do not silently stop after four pages. |
| Scanned PDF | optional RapidOCR 1.4.4 after pypdfium render | Docling OCR engine comparison; Tesseract 5.5.3 local comparator; GraniteDocling image-to-DocTags research candidate | page/region bbox, OCR engine, language, confidence if engine supplies, orientation and page count | handwriting, small units, minus signs, decimal points, exponents, subscripts and MCQ order fail easily; queue for review. |
| Photo / diagram / circuit | RapidOCR text only | Local OCR for labels plus optional VLM region description, separated tasks | image crop bbox and dimensions; quote OCR text independently from interpretation | Vision caption is not an exact transcription or circuit netlist. Require label-to-wire topology review; never infer unreadable values. |
| Chart / plotted graph | likely OCR labels only | Docling chart extraction where supported; VLM can propose chart type/relationships | axes, units, legend and each claimed point should map to pixels; retain raw source image | VLM may hallucinate scales/points. Treat all numbers as unverified until independently read from pixels or source table. |
| Formula / worked solution | parser text may linearize symbols | Docling/GraniteDocling formula item; specialist OCR comparison | exact region + raw OCR + normalized LaTeX/Unicode separately | never silently normalize signs, units, subscript, vector notation or equation numbering. Human check before explanation/use as answer key. |
| DOCX | python-docx paragraphs and tables | Docling structural JSON; MarkItDown readable text comparator | OOXML part + paragraph/table/row/cell IDs; no fake printed page number | headers/footnotes/comments/text boxes/track changes may be missed; fixture should expose coverage. |
| PPTX | current XML slide text only | Docling structure; MarkItDown comparator; extract images separately | slide, shape/order, notes distinct from visible body, bbox; chart workbook relationship | notes are author-supplied but not necessarily shown to learners; keep separate. Preserve speaker notes and chart data lineage. |
| XLSX/CSV | openpyxl read-only baseline | Docling table representation; MarkItDown text comparator | sheet + cell/range; formula text and cached value separately, hidden state | don't execute formulas, external links, macros or recalc. Check merged cells, filters, dates, units, hidden sheets and sparse-range bombs. |
| Audio/video | not within visual package, extraction code has no audio/video path | Docling audio/video support is an option to measure later; keep ASR and frame inspection separate | transcript times, keyframe time, audio track and sample schedule recorded independently | transcript is not visual coverage; sparse keyframes miss events; defer adapter selection to language lane and root. |

### Tool decision

**Docling** is the leading *structured conversion spike*, not a guaranteed parser. Official docs list PDF, OOXML Office, images, CSV/HTML and audio/video options; its `DoclingDocument` has provenance pointers such as page number, bounding box and charspan, and its chunking APIs preserve document hierarchy and can repeat table headers. The current release shown by PyPI at the 23 October research checkpoint is `2.134.0`; pin that only in an isolated experiment, then vendor a full transitive/model/OCR license inventory before adoption. The project code is MIT, but OCR engines, model weights and optional dependencies keep their own licenses. Windows x86_64 is supported in current install docs; optional OCR extras vary, so select one after fixtures. OCR/VLM model downloads occur at first use: no install or model download was done here.

**GraniteDocling-258M** is an interesting low-parameter document image-to-text/DocTags model integrated with Docling. IBM's model card calls it Apache-2.0 and English NLP. Do not assume it is equivalent to Docling's general layout pipeline, multilingual OCR, or chart/formula accuracy. Even if model weight files are small, memory, image tokenization and Docling runtime requirements must be measured on target hardware; no VRAM fit is claimed.

**MarkItDown** is the lightweight comparator when readable text and basic tables are enough. Its core conversion is MIT, newest official release shown is `0.1.9` (21 Oct 2026). Its `markitdown-ocr` plugin is also MIT code but calls a supplied OpenAI-compatible LLM vision client to OCR PDFs/DOCX/PPTX/XLSX; it therefore adds hosted-data disclosure, provider terms, prompt and nondeterministic output, not a private offline OCR engine. It should not replace Docling for evidence-bearing engineering diagrams or precise page/shape/cell anchors without fixture proof.

**Tesseract 5.5.3** is an Apache-2.0 OCR engine, and its own repo identifies Leptonica as a BSD-2-Clause dependency. Model/language data (e.g. traineddata) are distinct; audit their repository/license and language quality. It is a valuable offline printed-text comparator, not a semantic diagram interpreter or dependable handwritten/math solution. Existing RapidOCR 1.4.4 should stay the baseline until results justify a replacement.

## Current visual model options (catalogue snapshot, not tested quality)

Prices and listings change. Current at research time; re-query provider/model endpoints at implementation. “Free” means catalogue price says zero, not guaranteed uptime, quota, suitable retention, commercial eligibility of user content or production availability.

| Route | Candidate | Verified catalogue facts | Use / limitation |
|---|---|---|---|
| Groq hosted vision | `qwen/qwen3.8-27b` | Groq's vision/model docs list Qwen 3.8 27B, image and text input, max 3 images per request, 20 MB URL-image limit, 131,072 context; listed model pricing is $0.80/M input and $4/M output. API free-plan limits list 30 RPM/1K RPD/8K TPM/200K TPD at the current checkpoint, but account quota/entitlement and billing need owner verification. The older Qwen3.6 ID is deprecated in favour of 3.8. | Good hosted visual understanding comparison, not free-by-price. One page crop per request, no full course uploads. Stay out of initial workflow pending explicit consent, retention/region review and measured evidence grounding. |
| OpenRouter named free vision | `qwen/qwen3.8-27b:free` | OpenRouter page lists 0 input/output price, 262K context and text/image/video input; Qwen official card labels the weights Apache-2.0. Hosted provider still processes data; per-endpoint terms vary and free rate limits apply. | First named free candidate for OCR-vs-interpretation split and equation/chart challenge fixture. Track exact actual returned model/provider. |
| OpenRouter named free vision | `inclusionai/ling-3.0-flash-vl:free` | OpenRouter page lists 0 token price, 262K context, text/image/video input, tools yes, structured response format no; free endpoints rate-limited. | Second visual candidate; use hand-validated schema post-check because API cannot promise JSON schema response. Weight license was not confirmed from an authoritative model card in this pass; do not infer commercial rights from price/open weights. |
| OpenRouter compatible free router | `openrouter/free` | Router advertises feature filtering (image understanding, tool support, structured outputs) and zero token price. It selects among changing free endpoints; actual selected model must be captured from response metadata. | Useful only as an availability comparison. It reduces repeatability and output comparability; prefer named free model IDs for benchmark. Pin modality requirements and fail closed if no endpoint. Never silently fall back to a paid model. |
| OpenRouter currently free model family | Gemma 4 26B A4B free and 31B free are shown by current catalog as multimodal image input, Apache 2.0 model family, 262K context. | OpenRouter's listing confirms current free variants; official model card/license must be checked for exact served revision. | Optional backup after compatibility and region/privacy checks; not needed in first 2-model spike. |

Groq's live API pricing is not a “free model” claim. It separately displays free-plan rate limits and model prices; user/account state controls actual eligible service. OpenRouter identifies `:free` as rate-limited and says free models are unsuitable for production. Neither means sensitive student documents should be uploaded. OpenRouter's `openrouter/free` model endpoints are dynamically selected; for reproducible evaluation pin model variant plus provider constraints and save the actual model/provider IDs.

## Whole-material pipeline and evidence coverage

1. **Admit safely, separate concern:** allowlist exact formats, sniff bytes independently of extension, reject encrypted/unsupported files without bypass, hash bytes and bind owner/source/revision. Bound file bytes, decompressed ZIP entries/aggregate, XML depth, page count, pixel dimensions/total pixels, formula dimensions, audio duration, video duration/frame sample count, CPU/wall time, memory and output bytes. Parse in a no-network least-privilege worker with no browser or shell tools. Model never selects parser permission.
2. **Inventory all units first:** count pages/slides/sheets/objects/media duration and hidden/unsupported units cheaply before extraction. Return `total`, `attempted`, `complete`, `review-required`, `failed`, and `skipped` counts and a per-unit reason. User can choose bounded subset, but status must say e.g. “Pages 1–10 of 84 processed”; do not label it “whole document.”
3. **Route deterministically:** born-digital PDF/native Office/text first; scanned/image pages to OCR branch; each page can mix text and scan. For photos/figures, separate text detector and visual understanding. For audio transcript and video frames, use their own adapters and join only by timestamp. Keep extraction methods on blocks.
4. **Preserve layout and raw outputs:** retain page/slide/sheet order, geometry, headings, table cells/headers, formulas and exact text offsets. Keep raw OCR text and normalization as separate strings. For spreadsheets preserve formula string vs cached display value. For slides keep speaker notes separate from visible slide content. Never evaluate formulas/macros or follow embedded links.
5. **Review uncertainty:** store OCR confidence only if available, with calibration caveat; detect missing/empty pages, unreadable glyphs, table truncation and parser errors. Route low confidence, math/units, handwriting and diagram topology to manual review; do not auto-compose an answer key from them.
6. **Chunk only after structure:** preserve headings/table headers and source references; split oversized text by bounded characters/tokens with overlap, never split table rows where possible. Keep chunk-to-block IDs and source hash. For small sources, exact full-context is simpler; for large sources, index all chunks, retrieve top-k with owner/source/module/revision filters first. Add lexical BM25 and embeddings only after measured retrieval misses; rerank only a small candidate set. Search/index manifests include coverage and parser version.
7. **Retrieve with coverage-aware answers:** evidence bundle contains IDs, exact quotes, locators, block type, method, revision and flags. If requested material has failed or unprocessed sections, surface gap before answer. Query for diagrams includes nearby paragraph/table and crop link; a text quote does not prove the figure was interpreted.
8. **Commit only reviewed snapshot:** corrections produce immutable new revision, source digest and review attribution. Reprocess creates a new run, not overwrite. Recheck source revision at commit and invalidate stale proposals. Delete source, extracted text, image crops, index and backups as one lifecycle; explain retention honestly.
9. **Optional visual model:** learner explicitly selects a figure/crop and confirms the named external service/data transfer. Send only bounded crop + necessary context, with no names/IDs and no whole original; request response as constrained JSON with `observations`, `verbatim_ocr_candidates`, `uncertain`, and pixel-coordinate regions. Validate schema, clamp boxes, compare every text candidate to OCR/selected crop, keep all numbers unverified. Show provider, model, status and deletion/retention policy before action.

## Minimal benchmark fixtures (no user material)

Use only permissively licensed public datasets with reviewed license or manually authored synthetic fixtures. Public academic artifacts still require license/source review; never scrape LMS/login resources. The first pass can use synthetic vector-generated diagrams/documents and official datasets after explicit rights check. Proposed matrix:

| Fixture (make synthetic first) | Required exact checks | Failure examples |
|---|---|---|
| Born-digital 6-page technical PDF with two-column reading order, equations, table, diagram, printed-vs-PDF page mismatch | all page counts; exact strings/offset; bounding boxes within page; table header/cell continuity; formula raw/normalized pair | omitted page, wrong column order, symbol/sign substitution, box outside page |
| 3-page scan (clean, rotated/low contrast, hand-marked) and matching photo | per-page OCR coverage; polygons; confidence fields; orientation; only exact verifiable character checks | decimal/subscript/sign/degree-symbol errors; handwriting visibly uncertain not guessed |
| synthetic circuit/motor diagram with labels and ambiguous wire crossing | OCR label strings checked exactly; scene summary doesn't assert connectivity absent evidence; model claims mapped to region | invented terminal/connection/value; ambiguous crossing treated as connected |
| synthetic graph with misleading units/dual y-axis and tabular ground truth | axis names/units/scale exact; any numeric point within declared tolerance from source coordinates; unknown dual-axis state flagged | hallucinated trend/value, wrong unit/axis, interpolated unmarked point |
| PPTX with 5 slides, notes, chart, empty slide and embedded image | all slides processed; notes separated; slide/shape ID stable; all text/table content mapped | note presented as visible, chart values not linked to workbook, skipped empty slide unreported |
| DOCX with headings, table, footnote, header, image alt text and tracked changes | paragraph/table row/cell identity; unsupported parts named; preserve reading order | page number fabricated, tracked-deleted text shown as final without warning |
| XLSX with hidden sheet, formulas, cached values, merged cells, date, external reference | exact cell/range; formula-vs-cache; hidden sheet status; no formula executed/network request | calculated result invented, hidden data silently exposed, dates/numbers normalized incorrectly |
| injection/hostile-content fixture (public text instructing parser/model to ignore KAIRO) | instruction is retained as source data but cannot call tools, change permissions or alter output schema | uploaded prose alters model/tool authority or triggers network access |

Run baseline and candidate parsers on identical bytes and configuration; hash fixtures. Report page/slide/sheet/region precision/recall for labels and block order, exact text error rates, table cell correctness, formula character accuracy, anchor localization IoU, coverage, unsupported-claim count, abstention quality, CPU/RAM/peak VRAM/wall time, optional model latency/tokens/cost, installation size and license inventory. Double-review all math, circuit topology, axes and engineering claim examples. A JSON-valid result is not a factual correctness result.

## Proposed exact adapter flow

```text
POST /internal/extraction-jobs { ownerSourceId, expectedRevision, selection?, consent? }
  -> validate source/rights/limits; persist job state = queued; reserve idempotency key
  -> inspect bytes -> manifest(all units) -> route per unit -> extract bounded blocks
  -> persist run {sourceRevision, hash, methods, manifest, blocks, warnings}

GET /internal/extraction-jobs/:jobId
  -> {state, counts, unitStatus[], failures[], reviewRequired[]}

POST /internal/extraction-jobs/:jobId/cancel
  -> cooperative cancel all parser/model work; no reviewed commit

POST /internal/sources/:id/revisions
  {expectedRevision, reviewedBlocks, correctionAudit}
  -> server validates exact IDs/locators/source hash, CAS expected revision, immutable new revision
```

These are research sketches, **not routes approved or implemented**. Any OpenRouter/Groq visual request is a separate explicit user action, not an automatic step of upload/extraction. Only server-side credential handling; logs use request IDs and status, never keys, content or private text. Existing host/origin guards and auth ownership requirements remain; don't loosen them to demo a provider.

## Licensing, privacy and resource notes

- Code licenses are not content licenses. Docling repository code MIT, GraniteDocling weights Apache-2.0, MarkItDown and the OCR plugin MIT, Tesseract engine Apache-2.0, Leptonica BSD-2-Clause; transitive dependencies, OCR traineddata, model weights, pretrained sources and input content have distinct rights. Confirm commercial scope and notices for the exact pinned artifacts before shipping.
- Never store/re-distribute book bodies, private learning-platform content, personal notes, student identifiers or uploaded original bytes in fixtures or research docs. Use synthetic/public licensed inputs. Re-check source rights before retention and cloud sync; cloud-reviewed-copy contract excludes original and whole-document analysis by default.
- User-reported Kaggle GPU allowance is not verified by this visual-only lane. Account, quota, hardware, usable dataset, license/consent and notebook runtime all remain unknown. No GPU hour is used or reserved here. GraniteDocling's 258M parameter count alone is not proof of target VRAM or full Docling worker memory.
- Providers can see image bytes, prompts and adjacent context. A free token price says nothing about training/retention, region, deletion, DPA or suitable student privacy. Provider policy/legal review and app consent are release gates. No call was made in this task.
- No extraction means perfect coverage: always show `complete/total`, exact selected subset, failure and skipped reasons, OCR/vision source labels, reviewed state, source link, date, confidence limitations and unresolved licenses.

## Judging and acceptance mapping

| Criterion / learner need | Observable acceptance | Evidence now | Gap |
|---|---|---|---|
| Product: “use my actual page/table/diagram without unrelated invented material” | exact source block anchors; per-unit coverage; no unsupported figure values; source revision locked | This handoff proposes the block contract and controlled fixture checks; existing local extraction baseline described by code inspection | Candidate parser outputs have not been benchmarked; no production implementation |
| Usability: “tell me what was read and what needs my correction” | plain status with processed/total and actionable retry; coordinate + reading alternatives; handwritten/formula uncertainty exposed | Exact recovery/status design specified above | Human/device clarity and accessibility not observed |
| Intelligence: “explain the right diagram/table using evidence” | exact text and regions resolve to source; claim-level evaluation; confidence and model limits visible | Current official tool/model capability sources and a synthetic fixture matrix | No live inference or correctness/education measurement |

No traction, learning-gain, image-accuracy, cloud-readiness or device acceptance claims are made.

## Sources (official/primary, checked 23 October 2026)

- [Docling supported input/output formats](https://docling-project.github.io/docling/usage/supported_formats/)
- [Docling installation and OCR engine extras/platform notes](https://docling-project.github.io/docling/getting_started/installation/)
- [Docling chunking and HybridChunker](https://docling-project.github.io/docling/concepts/chunking/)
- [Docling document provenance (`page_no`, `bbox`, `charspan`)](https://docling-project.github.io/docling/reference/docling_document/)
- [Docling source repository and MIT license](https://github.com/docling-project/docling)
- [Docling PyPI release history (2.134.0 listed 6 Oct 2026)](https://pypi.org/project/docling/)
- [IBM GraniteDocling-258M official card (English, Apache-2.0)](https://huggingface.co/ibm-granite/granite-docling-258M)
- [Microsoft MarkItDown releases (0.1.9, 21 Oct 2026)](https://github.com/microsoft/markitdown/releases)
- [MarkItDown OCR plugin definition and model-backed behavior](https://github.com/microsoft/markitdown/tree/main/packages/markitdown-ocr)
- [MarkItDown OCR plugin license](https://github.com/microsoft/markitdown/blob/main/packages/markitdown-ocr/LICENSE)
- [Tesseract official repository/license](https://github.com/tesseract-ocr/tesseract)
- [Tesseract release notes (5.5.3, 24 Jul 2026)](https://github.com/tesseract-ocr/tessdoc/blob/main/ReleaseNotes.md)
- [Groq vision supported models and image limits](https://console.groq.com/docs/vision)
- [Groq model IDs/pricing/context](https://console.groq.com/docs/models)
- [Groq current rate-limit page](https://console.groq.com/docs/rate-limits)
- [Groq Qwen 3.6 deprecation / 3.8 replacement](https://console.groq.com/docs/deprecations)
- [OpenRouter Qwen3.8 27B free endpoint / modalities / context / limits](https://openrouter.ai/qwen/qwen3.8-27b:free)
- [Qwen3.8-27B official Apache-2.0 model card](https://huggingface.co/Qwen/Qwen3.8-27B)
- [OpenRouter Ling 3.0 Flash VL free endpoint and capabilities](https://openrouter.ai/inclusionai/ling-3.0-flash-vl:free)
- [OpenRouter free router and current policy](https://openrouter.ai/openrouter/free/apps)
- [OpenRouter support: `:free` rate limits and account allowance caveats](https://openrouter.ai/support)
- Local context: `docs/agentic-cloud-20261023/INTELLIGENCE-ARCHITECTURE.md`, `docs/authoring-kit-20261023/README.md`, `docs/authoring-intake-independent-20261023/INTAKE-RETRIEVAL-MEMO.md`, `tools/course_sources/extract.py`, `studio/server/workspace/model.mjs` (read-only).
