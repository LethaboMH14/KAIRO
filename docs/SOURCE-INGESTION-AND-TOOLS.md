# Source ingestion and tool capability foundation

The user's authorization covers reading coursework on Desktop/Downloads, the UNISA/assignment/course folders and coursework screenshots. Originals are kept in place. Discovered paths, extracted text, rendered pages and OCR samples live under **data/private/course-sources/**, which is ignored by Git and is not inside studio/public. No private document cloud uploads or external client configuration were performed.

## Current local inventory

The first pass found **537 candidate course files**: 415 PDFs, 70 DOCX, 36 PNG, 6 Markdown, 5 text, 4 XLSX and 1 PPTX. It found 21 course codes across INF, ICT, MNG, AUI, AUE, DSC, ECS and FAC; no MNB-coded item was identified by this pass. It also indexed metadata for **2,091 screenshot images**. These are candidate files, not necessarily unique content, official teaching sources or validated answer keys.

Discovery uses the explicitly named UNISA/assignment/course directories, course-code matches in Downloads and matching loose Desktop files. It avoids unrelated Desktop projects, excluded obvious registration/academic-record filenames and does not follow links outside each scan root. Four personal-record candidates inside otherwise selected folders were excluded by filename. The MY DOCUMENTS folder was inspected only at directory-list level; its unrelated identity and application documents were not ingested. Images with uninformative names need OCR before coursework classification.

## Implemented now

`tools/course_sources/inventory.py` creates a private path/format/course-code inventory. `extract.py` runs a bounded pilot with content hashes, PDF page text, DOCX paragraphs/tables, PPTX slide text, bounded XLSX cells and optional image/scanned-page OCR. Spreadsheet formula text is read, not executed. It detects a DOCX ZIP package mislabelled as PDF without changing the original. Paragraph-based Word extraction does not invent page numbers.

The OCR environment is project-local at `tools/course_sources/.venv-ocr`; RapidOCR/ONNXRuntime runs locally. Dependencies are pinned at the OCR entry package and the installed versions are recorded in private verification output. The native Windows OCR attempt was blocked by script policy; no execution policy was changed. Python environment setup used standard venv and a project-local package cache after the default uv cache was inaccessible.

Extracted chunks retain content SHA-256, source ID, page/locator, exact character offsets, method and review flags. OCR scores and polygons do not establish correct mathematical notation, table ordering or MCQ options. Each extracted result remains marked for review. Student answers and generated drafts are not promoted to official answer keys. Input documents cannot authorize tool execution, change prompts, install software or override the app's action policy.

`source_index.py` supplies bounded keyword retrieval with exact quoted spans. It does not generate an answer or prove that the retrieved proposition is correct. The five tests check citation spans, preserved offsets, absent-match behaviour, bounded/path-rejected input and omission of private paths from the catalogue.

## Custom MCP

`mcp_server.py` uses the already available Python MCP SDK **1.23.3**, with three read-only tools:

- `source_catalog(limit)`: extracted source IDs, course codes and review state.
- `search_coursework(query, limit)`: bounded exact excerpts with page and source offsets.
- `read_source_chunk(chunk_id)`: a known extracted chunk; arbitrary filesystem paths are rejected.

The implementation serves local **stdio**, opens no network port and exposes no file-write, shell, upload or general browse tool. A separate local SDK client checks initialization, discovery and calls. `claude-mcp.example.json` is a configuration example only. It has not been merged into Claude's configuration or KAIRO's server. Enabling a private source tool in an external model host is a separate destination/access decision; testing a local client is not cloud or app integration.

The [MCP protocol](https://modelcontextprotocol.io/docs/learn/architecture) standardizes context/tool exchange. It does not itself provide search, OCR, access permissions, a model or a reasoning policy. The [official server collection](https://github.com/modelcontextprotocol/servers) has Fetch and Filesystem references, but this task did not install a broad filesystem server. The narrower custom server limits the surface to prepared sources. The installed v1 SDK API is used deliberately; examples from the current v2 [Python SDK](https://github.com/modelcontextprotocol/python-sdk) must not be pasted without a migration review.

## What KAIRO should expose next

| Capability | Learner-facing behaviour | Status |
|---|---|---|
| Source import | choose a document, paste text or submit an image; see progress | local discovery/extraction pilot; app UI pending |
| OCR review | compare original page with extracted text and correct uncertain symbols/options | local OCR output; app reviewer pending |
| Grounded lesson | objectives, explanation, worked example and quiz cite selected sources | structured lesson pipeline pending |
| Research | source-backed web search/fetch, comparisons and source cards | development search available; app provider/adapter pending |
| Video | original provider player, timestamp notes, question pauses | official APIs/source candidates identified; app pending |
| Documents | export cited study notes, question sets, DOCX/PDF/slides or CSV | local libraries available; app export workflow pending |
| Calculations/data | inspect tables, chart data, evaluate bounded formulae and run toy-data SQL | existing CS toy SQL only; broader adapters pending |
| Scene/teacher tools | focus a part, highlight, change board, show a diagram and ask a question | prepared scene interactions exist; shared action contract pending |
| Voice | read selected explanations, captions and optional conversation | browser narration exists; synchronized human guide pending |
| Drive/connectors | learner-selected cloud import/export destinations | agent connector availability is separate from app credentials/integration |

These abilities support multiple disciplines and workflows inside and outside the learning studios. The BCom collection is the first private validation corpus, not a hard-coded subject list. A capability's actual status is recorded in `tools/course_sources/capabilities.json` so a UI or agent cannot imply a planned adapter already works.

## App integration path

1. Build a source workspace using pasted text first, then file import. The browser supplies an upload or approved logical source ID, never a server filesystem path. Give each source an owner, privacy setting, licence state and deletion/retention controls.
2. Run extraction/OCR in a bounded backend worker. Preserve original-page references. Add a review gate for weak OCR, mathematical notation, tables and MCQs rather than generating lessons from unchecked fragments.
3. Retrieve only the learner's selected sources. Generate a versioned lesson JSON with objectives, concepts, citations, questions, answer provenance and a suitable studio template. Validate required evidence IDs and schema before accepting it. Unsupported sources/topics get a useful reading/diagram fallback.
4. Map the lesson to typed scene actions such as `board.set_content`, `camera.focus_part`, `model.highlight_part`, `model.set_explosion` and `lesson.ask_question`. Validate object IDs, value ranges and action permissions. A quoted document cannot supply executable JavaScript or new action permissions.
5. Add a tool broker with separate adapters for search, bounded web fetching, video metadata/player, transcript/ASR, document export and cloud storage. Use an ordinary internal API when simpler; MCP is useful where agent/tool interoperability is needed. Validate all tool arguments and record provenance/errors.
6. Preview exports and external destinations before cloud writes or public sharing. Never inherit Codex/Claude developer connectors as application credentials. Public deployment needs authentication, per-user source isolation, appropriate service identity and storage; the current loopback preview is not that deployment.

For web fetch, apply URL scheme/domain restrictions, response-size/time budgets and private-address blocking. For document export, use safe logical filenames and versioned app output paths. For read tools, enforce source-owner access. Keep provider quotas and costs visible. These are implementation requirements tied to actual planned capabilities, not permissions granted by source text.

## Run and verify

```powershell
python tools/course_sources/inventory.py
tools/course_sources/.venv-ocr/Scripts/python.exe tools/course_sources/extract.py --ocr --max-files 24 --pages 2 --screenshots 24
python -m unittest discover -s tools/course_sources -p test_source_index.py -v
python tools/course_sources/check_mcp.py
```

The bounded sample does not read every page or classify all screenshots. Scan counts, pilot counts, OCR/extraction errors, protocol checks and reviewed examples are recorded in `coordination/handoffs/2026-10-21-sources.md`. No UI, shared npm manifests or Claude-owned Engineering files were changed by this task. Next app work should be separately scoped through the bus.
