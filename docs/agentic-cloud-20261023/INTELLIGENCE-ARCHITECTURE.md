# KAIRO: intelligence that produces useful, checkable learning

Research refreshed 23 October 2026 against primary documentation. This is a selected architecture and implementation sequence, not a claim that the whole pipeline is installed. The isolated provider lab is implemented; the live app still uses its existing Google path. Existing source/history/editor work is the foundation, not a replacement for format, model and human evaluation.

## The experience to build next

A learner brings motor slides, a photographed circuit, a worksheet and a short lecture recording. KAIRO identifies which sections describe the same concept, shows extraction coverage and uncertain text, and asks one useful question about the learner's goal. It proposes a short lesson with a cited explanation, a labelled diagram, a worked calculation and a practical prediction. The learner can choose a simpler explanation, change the reading arrangement, or open the registered motor activity. KAIRO explains what changed and why; accepting a proposal creates a version, and undo remains available. Practice tests the concept and preserves the actual attempt, assistance and source—not a fabricated employment credential.

The memorable mechanism is **one claim, several useful views, one source trail**. Selecting a claim can highlight its page/slide/cell/timestamp, its explanation, its diagram label and its relevant practical control. A side-by-side “what stays the same / what changes?” view makes representation changes teach the underlying idea rather than decorate it. This requires explicit anchor mappings and supported scene adapters; a model saying it moved the motor is not an interaction.

## Stage-by-stage architecture

| Stage | Tool / structure and intelligence decision | Output and acceptance |
|---|---|---|
| 1. Admit upload | Backend signature/MIME/size/ZIP/pixel/duration limits; content hash; private owner-scoped object. Models do not decide security admission | Quarantined original, rights/consent, hash, format, explicit size/coverage limits; corrupt/unsupported files explain recovery |
| 2. Classify and route | Deterministic format registry first; model can label content type later. Separate born-digital, scanned, audio and spreadsheet branches | Selected extractor/version/options; never pretend every extension is supported |
| 3. Extract structure | Docling as the main structured candidate; retain current native parsers as lightweight baselines. Office XML, image OCR and ASR use appropriate adapters | Document tree with paragraphs/headings/tables/formulas/figures/notes/transcript segments; original anchors, not only Markdown |
| 4. Review uncertain material | OCR/ASR confidence where available, missing-layout/table warnings and visible partial coverage; learner corrects extracted text | Immutable reviewed revision and lineage to original; uncertain handwriting/diagram output is not an answer key |
| 5. Normalize | A canonical `SourceDocument` with typed blocks, locators, offsets, bounding boxes/cell ranges/time intervals and extraction provenance | Every teaching quote resolves to exact reviewed text plus original location; no invented printed page number for a DOCX paragraph |
| 6. Sort and connect | Rules for exact module/course/year codes and source versions; then model-generated topic labels with evidence and confidence | Suggested collection, duplicates and related concepts, reversible grouping; never silently enroll a learner based on topic similarity |
| 7. Index and retrieve | Exact metadata/owner filters, lexical BM25 plus multilingual embeddings, optional reranker; retrieve tables/figures with surrounding explanation | Bounded evidence bundle with source IDs/revisions/locators. Cross-user and unrelated-module results must be excluded before ranking |
| 8. Build lesson brief | Goal, current module, preferred presentation/language and recent demonstrated difficulties; no fixed “learning style” diagnosis | Small editable brief. Defaults reduce questions; preferences are distinguishable from observed evidence |
| 9. Plan | Model proposes objectives, prerequisites, sequence, evidence IDs and representation plan; typed schema and supported registry constrain it | A reviewable lesson plan with coverage/missing material, not an opaque stream of tool chatter |
| 10. Compose teaching | Separate explanation/example/diagram/chart/practice tasks sharing the same evidence. Use the smallest measured-capable model per task | Draft lesson blocks and representation specifications; exact quote checks plus semantic review, not JSON validity alone |
| 11. Verify | Existing draft-domain constraints, source quote/offset checks, units/calculators and unsupported-claim checks; human reviews pedagogy and answer meaning | Before/after preview, warnings and cited support. Invalid content is rejected, not silently repaired into a passing answer |
| 12. Commit | Learner applies the specific proposal against its base source/draft version; compare-and-swap and an approval-bound digest | New version, undo/history; obsolete, cancelled or tampered proposals cannot commit |
| 13. Teach in context | Reading/keyboard/captions plus one shared KAIRO narrator; registered activity/scene capabilities only | A real selected/highlighted/changed scene control with a receipt, or an honest reading/diagram alternative |
| 14. Practise and adapt | Domain-checked questions; assistance history; deterministic mastery rules first. Model explains feedback tied to evidence | Actual attempts and reasons for next step; personal reflection is ungraded and self-directed practice is not verified competence |
| 15. Keep and resume | Saved edited blocks/quotes/working, stable identity, explicit sync/offline states and immutable source revisions | Reopen the same content after restart, handle conflicts, export/delete; two-user isolation is a cloud release gate |
| 16. Learn from use | Consented event measurements and opt-in quality feedback; evaluation set kept separate from training | Measured grounding, task completion and usefulness. No invented learning improvement, job outcome or engagement score |

## Multimodal input kit

**Docling** is the preferred structural spike because its documented outputs use one document model across formats. Current official support includes PDF, DOCX/PPTX/XLSX, image formats, CSV/HTML, audio with ASR extras and video audio extraction. Legacy DOC/XLS/PPT require LibreOffice. Do not assume support in KAIRO until the selected version and fixtures pass. [Supported formats](https://docling-project.github.io/docling/usage/supported_formats/), [audio pipeline and FFmpeg requirement](https://docling-project.github.io/docling/usage/processing_audio_media/).

| Material | Selected approach | Preserve / do not invent |
|---|---|---|
| PDF text | Current pypdf baseline; Docling layout/table/formula spike | Page, reading order, quote offsets, table/figure positions; real preview and coverage |
| Scanned PDF / photo | Existing RapidOCR baseline; compare Docling OCR and optional GraniteDocling on hard fixtures | Bounding boxes, orientation, confidence if supplied; uncertain digits/units flagged |
| DOCX | Native parser baseline plus Docling structure | Heading/paragraph/table IDs and comments where supported; paragraph ID is not a printed page |
| PPTX | Slide tree/text/tables/notes, figure extraction and optional visual understanding | Slide number, notes separate from visible text, object position and source attribution |
| XLSX / CSV | openpyxl/CSV reader and Docling tables; DuckDB/pandas only for validated bounded analysis if needed | Sheet/cell/range, formula text versus cached value, units, hidden-sheet warnings; never execute macros or arbitrary formula code |
| DOC/XLS/PPT | LibreOffice conversion in isolated worker, then structured parser | Both original and converted hash/version; conversion warnings; no claim of perfect layout parity |
| WAV/MP3/M4A/etc. | FFmpeg decoding and local faster-whisper or consented Groq Whisper | Timestamp segments and language/transcription confidence if supplied; source audio can disagree with transcript |
| Video | Audio transcript first; scene/keyframe sampling as separately evaluated visual branch | Timestamp/keyframe correspondence and limited sampling coverage; transcript alone is not full video understanding |
| HTML/EPUB/transcript | Parse as untrusted content, strip executable behavior, respect access rights | URL/title/retrieval time/section or timestamps; no “scrape anything in real time” promise |
| Unsupported/encrypted/corrupt | Explicit failure or user-approved conversion | Ask for a supported copy; do not claim “any file” or fill unread material with model guesses |

[Microsoft MarkItDown](https://github.com/microsoft/markitdown) is a useful lightweight conversion comparator and has MCP support. Prefer it when readable text conversion is sufficient; compare structure loss against Docling before selecting it for engineering diagrams or worksheet tables. Avoid installing multiple full stacks merely because they support the same extension.

## Which models do what, and where they sit

| Task | First candidate / deployment | Decision |
|---|---|---|
| Fast sorting, brief and simple explanation | Groq GPT-OSS 20B, hosted API | Test measured schema/grounding/latency; explicit Free-plan entitlement, never assume every Groq account is free |
| More difficult planning / critique | Groq GPT-OSS 120B candidate; later Google/AIML comparison | Promote only if it improves measured quality over the cheaper/smaller candidate; not every task needs the largest model |
| Free cross-model experiments | `openrouter/free` or a named current `:free` model, hosted API | Router selects a compatible free model; record actual returned ID. No mixed paid fallback. Availability and privacy vary by provider |
| Document vision | GraniteDocling-258M candidate, local/private extraction worker | Apache-2.0 model card; compare layout/table/formula anchors. Its English label does not establish all-language OCR quality |
| Speech recognition | faster-whisper local worker; Groq `whisper-large-v3` / turbo after consent | Compare terminology and South African accents/languages with actual recordings; speed is not transcription accuracy |
| Semantic search | BGE-M3 pretrained candidate, local/private worker | MIT model card; multilingual embedding candidate with measured retrieval fixtures. Do not equate multilingual label with every required language passing |
| KAIRO speech | Existing selected Google voice/runtime | Keep one narrator across model providers, preserve text/stop/caption alternative and voice consent; switching LLM does not require a different character voice |
| Mastery / next activity | Transparent rules over actual attempts first | Existing rules remain explainable. A future learned model needs real consented labels and held-out evaluation |

Primary sources: [Groq current models](https://console.groq.com/docs/models), [strict output support](https://console.groq.com/docs/structured-outputs), [OpenRouter free router](https://openrouter.ai/docs/guides/routing/routers/free-router), [GraniteDocling card](https://huggingface.co/ibm-granite/granite-docling-258M), [BGE-M3 card](https://huggingface.co/BAAI/bge-m3), [faster-whisper](https://github.com/SYSTRAN/faster-whisper). Schema/quotation checks are not semantic truth checks. Review provider data policies before sending real learner material; this turn's live-test fixture is synthetic only.

**Training**: no foundation-model training is needed for the next release. Use pretrained extraction, embeddings and ASR, then benchmark. Later fit a small calibrated classifier/ranker on consented, clearly labelled examples for concept tagging, representation selection or next-step recommendation. Split evaluation by learner/source/time to prevent leakage; compare a simple rules baseline, report sample size/calibration/error by subgroup and keep predictions visibly tentative. Run CPU baselines locally; only schedule cloud training after data rights, experiment budget and acceptance metrics exist. Fine-tuning an LLM is justified only by recurring measured failures that better retrieval/prompt/schema design cannot solve; no GPU endpoint is provisioned tonight.

## Agent tools and MCP

MCP is a transport and tool contract, not the intelligence itself. KAIRO's app must host and authorize its own tool layer; tools connected to Codex/Claude are development tools and do not automatically become learner capabilities. Start with internal typed functions; expose the same narrow functions through MCP only when another trusted client needs them. The existing private course-source MCP is a development baseline, not a multi-tenant public learning service.

| Proposed runtime tool | Authority and useful outcome |
|---|---|
| `materials.inspect`, `materials.extract`, `jobs.status/cancel` | Owner-derived IDs only; format/coverage status, bounded extraction and cancellation |
| `knowledge.search`, `sources.read_anchor` | Owner/module-filtered retrieval and exact page/slide/cell/timestamp evidence |
| `lesson.plan`, `lesson.propose_patch`, `lesson.validate` | Version-bound, source-grounded proposals with a preview; no automatic publication |
| `lesson.apply_approved` | Server verifies actual user approval, exact proposal/base version and permission; a model cannot approve itself |
| `representations.list`, `representations.render_preview` | Registered reading/concept-map/chart/worked-example templates; no arbitrary executable HTML |
| `activities.list`, `activities.run_calculation` | Supported deterministic motor/pump calculations, bounds and receipts; absence of a scene adapter stays unsupported |
| `scene.propose_action` | Allowed part IDs/parameters only, validated against the mounted scene's actual capabilities; no fabricated scene changes |
| `practice.propose_questions`, `practice.record_attempt` | Separate drafting/review from actual submitted attempts; key and assistance integrity preserved |
| `profile.read_learning_context`, `profile.propose_goal` | Minimal necessary preferences/course context; no model access to the entire CV or other users |
| `media.narrate`, `media.render_template` | Existing voice consent plus bounded trusted animation templates; one narrator and stop control |
| `opportunities.search_official` | Later: dated employer/funding evidence, expiry and source links; no automatic applications or social-platform scraping assumed |

External candidates: Docling MCP for conversion; a dedicated read-only institutional Drive connector only after per-user consent; a retrieval MCP exposing owner-filtered anchors; a citation-aware research connector restricted to approved public sources. Never expose a general shell, arbitrary filesystem/SQL, cloud-admin or billing MCP to the learner agent. Treat MCP tool results and uploaded text as untrusted data; validate OAuth audiences, scopes, outbound destinations and tool arguments. [Docling MCP](https://docling-project.github.io/docling/usage/mcp/), [MCP security guidance](https://modelcontextprotocol.io/specification/latest/basic/security_best_practices).

## Orchestration and representations

Keep the current React/Node app. The immediate provider lab uses native fetch and existing validation, avoiding an SDK/framework migration just to switch endpoint. Once jobs need pause/resume, retries and human approval across restarts, evaluate **LangGraph** with a durable checkpointer; its store and thread checkpoint serve different purposes. **PydanticAI** is an alternative for typed Python worker agents. Select one orchestrator after a bounded comparison, not both. Do not mistake in-memory checkpoints for crash-safe production state. [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence).

Build a `RepresentationPlan` union around trusted templates: reading cards, concept nodes/edges, ordered comparison rows, chart data sourced to cells, equation parameters with units, a registered studio activity or a motion storyboard. Existing lesson draft schema remains authoritative until a separate migration is published. Representation suggestions do not add arbitrary properties to that schema.

For diagrams, use controlled React/SVG components and optionally React Flow for editable node graphs. For data, fixed chart components consume validated tables. For engineering, existing Three.js/R3F scenes need explicit capability adapters and validated calculators. For short explanatory motion, compare parameterized Remotion templates with Manim; never run unreviewed model-generated Python/JavaScript. Remotion has specific commercial licensing conditions, so do not describe the entire stack as unrestricted open source. Browser-based rendering/recording remains subject to the user's existing observation restriction; no headless renderer was run in this task. [Remotion parameterized video docs](https://www.remotion.dev/docs/parameterized-videos), [license terms](https://www.remotion.dev/docs/license).

## Routing, fallback and evaluation

Route by task, input modality, validated feature support, provider consent, privacy policy, current availability and quota—not just a model name. Persist a request ID and reservation before dispatch; bound steps/tokens/time; propagate cancellation to every stage and check again at commit. A 429/timeout may offer a separately consented compatible fallback; invalid citations must fail validation, not trigger a provider race until something passes. Never silently send material to another company or switch to a paid model. Existing local reading is the immediate failure path.

Benchmark public/synthetic fixtures for: clean PDF, scan, table, diagram, slide notes, mixed-script text, spreadsheet formula versus cached value, terminology-heavy audio and ambiguous/missing information. Score extraction anchors/coverage, JSON validity, quote validity, unsupported-claim rate, instructional clarity, latency, actual tokens/cost and cancellation. Include prompt-injection/foreign-source/stale-revision cases. Keep human educational review separate from automated schema checks. Record returned model ID and fixture hash so a free-router test is reproducible enough to interpret.

## Next connected product work

See NEXT-WORK.md for ordered learner problems and acceptance checks. Ship one joined motor use case before spreading effort across all six envisioned studios. The app currently routes Engineering and the lesson workshop; a standalone pump package is not proof of a mounted, source-controlled pump interaction. Broad career/bursary/employer/incentive features remain a separate evidence-led stage after learning, privacy and resume work reliably.
