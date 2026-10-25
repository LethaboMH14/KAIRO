# From scattered sources to a curated, retrievable learning system

This is a concrete extension of the existing [data/API plan](../core/DATA-AND-API.md), [learning/model operations](../core/MODEL-AND-LEARNING-OPS.md) and [bidirectional SASL design](../experience/SASL-BIDIRECTIONAL.md), not a replacement schema or permission to edit another owner's runtime. The full production platform is not yet built.

## Verified current inventory

Filesystem metadata inspected 23 October 2026; no private text copied into this document or the new public research registry.

| Existing location | What it holds | What it does not establish |
|---|---|---|
| `data/private/course-sources/inventory-summary.json` | Older inventory: 537 course files and 2,091 unclassified screenshots | All files extracted, classified, licensed for reuse or reviewed |
| `data/private/course-sources/extracted/` | Current 26 JSON documents, 108 chunks, exact source/page/offset information; none has a literal `reviewed:true` flag in that record format | Absence of that field is not an educator assessment; some extraction is bounded to sampled sections |
| `tools/course_sources/source_index.py` | Bounded lexical matching over local chunks, exact excerpt offsets, `needsReview` and untrusted-instruction labels | Hybrid embeddings, a production tenant-aware index or a validated answer engine |
| `tools/course_sources/mcp_server.py` | Local source catalogue/search/chunk tools | Automatic connection to every chat or inheritance of developer connectors by KAIRO |
| `tools/course_sources/public_sources.json` | Dated official education discovery links and reuse cautions | A downloaded licensed corpus |
| `data/private/app-workspace/sources/` | 6 app source records; 3 marked reviewed | A complete subject curriculum or external expert validation |
| `data/private/app-workspace/lessons/` | 3 saved lesson records | Independently validated lesson quality, full module coverage or mastery |
| `studio/server/workspace/routes.mjs` | Local JSON source/lesson storage, bounded extraction jobs, source review, generation routes | Production PostgreSQL, multi-tenant authorisation, durable distributed jobs or general RAG |
| `data/public/opportunities/fnb-current-review.json` and `rmb-preparation-matrix.json` | Dated employer research/preparation snapshots, including live-status caveats | Fresh active vacancies, endorsed job-fit scores or offers |
| `docs/blueprint/speech-cloud/` | Provider/model/language research | Working support for every listed language or a trained voice model |
| Character/engineering provenance, `studio/public/models/`, source assets | Existing visual runtime assets and attributions | A universal licensed library of anatomy, machinery, environments or signing |

The old capabilities JSON has historical “planned” entries that predate implemented lesson work. Read current code/handoffs rather than treating that one file as a complete current feature registry. Conversely, a “completed” development task is not validated learner/employment performance.

## What to compile, separately

| Collection | Essential record fields | Retrieval/use |
|---|---|---|
| Knowledge and curriculum | Author/institution, edition/module/year, canonical URL, retrieval date, licence/permission, revision/hash, page/time/bounds, language, review | Source-grounded explanation and prerequisite checks |
| Visual assets and environments | Creator, exact asset version/hash, mesh/part IDs, units, pivots/targets, LOD/bytes, textures, licence/attribution, anatomical/mechanical review | Pick a supported room/model, not any attractive image |
| Lesson/visual templates | Domain, prerequisites, goal, evidence coverage, parameters/units, valid ranges, source anchors, reading equivalent, review/rubric | Compose a known useful teaching interaction |
| Tasks and cases | Author, original/partner status, public/synthetic data provenance, task version, rubric, hidden answer access, allowed help, transfer variants | Practice and collect honest evidence |
| Employers and roles | Employer/legal entity, original posting, role/version, exact essential/preferred requirements, location, dates/expiry, verification | Explain evidence gaps and recommend preparation |
| Courses, credentials and simulations | Provider, programme ID/link, skill mapping, prerequisite/eligibility, current cost, certificate type/verification, licence/access | Recommend a route; do not clone proprietary courses |
| Speech/languages | Locale, provider/model/version, voice, licence/consent, pronunciation tests, cost, supported timing type, device/download budget | Capability-aware speech choice |
| Signed content/models | SASL/domain/variant, performer consent, reviewers, clips/keypoints/model hashes, signer-disjoint evaluation, permitted use | Reviewed signing output or bounded recognition |
| Learner memory | Learner-confirmed goal/preferences, observation provenance, purpose/retention, correction/deletion controls | Personalise pace and next action without inferring protected traits |
| Learning events | Task/source version, attempt, help, outcome, timing context, opt-in/session policy, uncertainty | Evaluate adaptation; keep raw behaviour distinct from ability |

Do not put all categories into one undifferentiated vector store. A 3D pivot is structured scene metadata, a vacancy deadline is a dated field, and a source passage is searchable text. Some records should be queried relationally, not generated from memory.

## Ingestion pipeline

1. **Discover:** collect original URL and small factual metadata. Check ownership/access and site/API terms. Discovery does not grant copying or training rights.
2. **Acquire only permitted content:** exact selected files, size/type bounds, licence text and performer/data consent where relevant. Keep an immutable raw hash/object. Private coursework remains in the learner's scope, not the shared public corpus.
3. **Extract:** existing PDF/Office/OCR pipeline; add layout/tables/equations and time-coded transcripts where the source permits. Do not execute document macros, formulas or downloaded scripts. OCR uncertainty is retained, not rewritten into confident facts.
4. **Normalise:** language/module/skill/topic tags, page/time coordinates, units, terminology and stable structure IDs. Preserve the original and provenance for every derivative. Duplicate by content hash, not only file name.
5. **Review:** rights and factual/domain review separately. Human-corrected text creates a new version; it does not overwrite a cited old one. Never let an LLM's own “approved” label authorize publication.
6. **Index:** exact identifiers and metadata + full-text search first. Add embeddings/hybrid ranking when a benchmark demonstrates value; chunk by meaning while preserving formulas/tables/source offsets. Permission/status filters apply before returning/ranking private results.
7. **Publish a versioned pack:** only eligible items and capabilities; include sources, assets, review, licence, objectives, task/rubric, timing support and reading alternative. Distinguish discovery-only records from approved usable content.
8. **Maintain:** check volatile deadlines/access/prices on use, content changes by hash/etag where available, scheduled review only when separately authorised, withdrawal/deletion propagation to raw/derived/index/cache/downloads. The cancelled 30-minute work automation stays cancelled.

## Practical storage architecture

**Now:** keep existing private files untouched. This package adds `catalog.json` and a real local `research-registry.sqlite` with FTS5 **over public research metadata only**. It can search leads and deny unapproved RAG/training purposes. It contains no downloaded anatomy, waveform, course, sign video or private learner chunk. It is a staging tool, not the application auth boundary.

**Production target already proposed:** PostgreSQL for versioned entities, relationships, review and ownership; object storage for exact raw/derived files and large assets; full-text plus an evaluated pgvector option for content retrieval; bounded asynchronous extraction/render/embedding jobs; a separately scoped learner/event store and redacted operational telemetry. Do not deploy an extra vector database/knowledge graph just because a diagram can include one. Pin a viable embedding model and measure language retrieval before creating all vectors.

A graph of `topic → prerequisite → lesson → task → evidence → role requirement` can initially use ordinary relationship tables. Structure IDs (for example an anatomy term) bridge models and lessons only when an actual mapping is reviewed. A graph/embedding connection is not proof that two concepts or skills are equivalent.

## How a request becomes a lesson

Example: “I don't understand why closing stock is 23.”

1. Resolve current learner session, source revision, selected anchor, language and available device/voice capabilities.
2. Retrieve permitted source spans for the calculation, required prerequisite and a suitable reviewed example. If none is sufficient, ask for material or state the gap.
3. Create a small **lesson specification**: one objective, known prerequisites, cited claims, numerical example with units, misconception to check, chosen presentation, practice/rubric and limits.
4. Select presentation by the task: a stock-flow diagram for additions/subtractions, chart for changing economic variables, a motor cutaway for parts, an event timeline for transactions, or an anatomy route for circulation. Do not force every source into an impressive but irrelevant 3D room.
5. Validate claims/citations, source coverage, arithmetic/units, asset IDs, allowed scene actions and available language/voice. Unreviewed generated code cannot enter trusted app chrome or run on the host.
6. Build the approved speech/visual score. Speak a short chunk, align supported board/point/gaze events to the actual audio clock, and preserve pause/interruption/resume state. Unsupported timing uses honest highlighting/reading; no fake exact-word claim.
7. Observe a response; choose a smaller hint, a different representation or a new transfer example from explicit evidence, then let the learner resume. Preserve help used and uncertainty in evidence.

Store reusable reviewed packs where permitted and cache by lesson/source/model/locale/voice version. A cache hit must still pass current access/revocation checks; it cannot expose another learner's private source or conversation.

## What makes the teacher feel intelligent

The design is **context and state**, not a claim of consciousness. The teacher tracks the selected idea, source, recent answer, actual speaking/listening state and learner's explicit preferences. A controller selects explain/ask/wait/listen/hint/show/practise/check/resume, with concise source-backed content. Timing uses audio playback plus validated event scheduling. It should admit uncertainty and avoid speaking over a learner.

Keep a reviewed library of teaching moves: worked example, prediction before reveal, compare two cases, identify a misconception, hint ladder, retrieval check, changed-context transfer and reflection. Choose the move from task/attempt evidence. Do not infer emotions, intelligence, disability or motivation from camera, voice accent, pauses or a single wrong answer. Gaze/nods are communication cues, not proof of emotion sensing.

## Where ML belongs

- **Retrieval evaluation:** multilingual/technical queries with relevant source-span labels, permission-negative tests and citation accuracy. Compare lexical baseline to embeddings/hybrid; add complexity only for demonstrated gains.
- **Adaptation:** start with transparent rules over attempts, hint exposure, prerequisite evidence and learner choice. Later evaluate knowledge tracing/recommendation models using consented data, held-out learners, calibration and benefit over the rule baseline. Click time alone is not mastery.
- **SASL:** separate consented data, signer-disjoint evaluation and domain/variant labels; no ASL-to-SASL substitution or unrestricted training on discovered videos.
- **Visual/task selection:** measure whether a representation helps learners understand and transfer, not merely whether it is engaging.
- **Fine-tuning:** only after a defined task, permitted training corpus, leakage control, baseline, held-out evaluation and a rollback/version plan. RAG can use fresh sources without retraining the tutor on every document.

Answer keys, held-out evaluation sets and private learner records stay out of general RAG. Do not leak a simulation's model answer into an “independent” assessment and then call the result skill.

## Concrete next queue

1. Root agrees `ResourceRecord`/rights/source-revision/lesson-pack contracts with existing data/API plan. This local registry is a proposed staging format, not a silent production schema change.
2. Luna can classify public metadata/links and check missing fields in an isolated catalogue, without reclassifying unknown rights as approved or touching raw private sources.
3. One worker builds bounded import/review/index functions and tests on synthetic/permitted examples; another creates skill/topic/prerequisite mappings with evidence. Root reviews security and integration.
4. Sonnet builds one studio from STUDIO-BRIEFS.md with a small domain pack and validated deterministic task logic, not a universal scene generator.
5. Root connects retrieved source spans → lesson spec → supported scene template → teaching controller → practice/evidence; validates the complete loop before wider ingestion.
6. Establish a source-review dashboard: discovered / permission pending / acquired / extracted / needs review / approved / published / stale / withdrawn. Show exact blockers and which learner capability depends on each item.

No agent was spawned by this queue. New workers must be actually started, registered and claimed by the coordinating chat. A bus notification does not start a model or deploy a database.
