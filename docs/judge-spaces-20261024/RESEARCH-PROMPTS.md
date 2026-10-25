# Focused research prompts for KAIRO

First attach RESEARCH-CONTEXT.md. Send one prompt at a time. Ask the assistant to preserve implemented/research distinctions, use only primary sources and return uncertainty, interfaces, cost and a bounded test. Do not attach API keys, passwords, private files or the judge credential file.

## 1. Full multimodal extraction

For the KAIRO stack described in the attached brief, design the next ingestion slice for mixed native/scanned PDFs, DOCX, PPTX, XLSX, images and later audio/video. Compare current maintained versions of Docling, Unstructured, Marker, PaddleOCR, relevant Google Document AI processors and one suitable vision model. Verify supported formats, licences, deployment hardware, math/table/image handling and South African region availability. Specify a canonical source schema preserving page/slide/sheet/cell/region locators, original/derived hashes, OCR confidence and coverage. Distinguish extraction from interpretation. Give a 20-file legally reusable benchmark with annotation rubric, expected failure cases, per-format metrics, latency/RAM/cost and exact routing/fallback logic. Recommend only the smallest candidate that improves our current measured gaps.

## 2. Private retrieval and search

Design owner-safe hybrid retrieval for KAIRO: public university curricula, approved technical references, private uploads and freshness-limited job/bursary records. Compare native lexical retrieval plus embeddings/reranking with Vertex RAG Engine, Vertex AI Search and a PostgreSQL/pgvector option. Verify IAM/tenant boundaries, permission filtering before ranking, query injection protections, deletion/version propagation, citations and pricing. Separate Google Search grounding from document acquisition and scraping. Return a source-rights/freshness registry, retrieval API, evaluation questions including cross-owner negative cases, and migration plan without adding an unnecessary database to the pilot.

## 3. Agent orchestration and MCP

For KAIRO's current explicit queue/review/generation workflow, compare a plain typed state machine with current LangGraph, LangChain and CrewAI. Research checkpoint durability, cancellation, retries/idempotency, human review, tool permissions, observability, licensing and hosting cost. Propose tools such as lookup_module, extract_regions, retrieve_owned_spans, draft_lesson and validate_citations with JSON schemas. State what MCP adds versus a normal internal function. No general shell, arbitrary internet fetch or unrestricted HTML execution. Give an end-to-end state diagram, maximum steps/tokens/time, failure states, and one incremental adoption test. Reject frameworks that add more risk/complexity than they remove.

## 4. Editable lessons and adaptive representations

Find a maintained structured-document/editor/rendering kit for our React/TypeScript lesson builder. Compare a small selection of Tiptap/ProseMirror, Lexical, BlockNote, H5P and schema-rendered UI approaches. Check licence, accessible math/tables/diagrams, source-linked blocks, undo/history, collaborative edit requirements, import/export and mobile constraints. Show a lesson JSON schema and example that converts the same cited motor principle into a short explanation, worked calculation, variable graph, prediction task and reading alternative. Explain when to pick each representation and how unsupported generated blocks fail safely. Do not replace the whole LMS merely to get an editor.

## 5. KAIRO teaching behaviour

Research evidence-based tutoring moves suitable for engineering: retrieval practice, worked examples, prediction, self-explanation and graduated hints. Specify observable events and a teacher policy for motor and pump activities, including when to stay quiet, stop narration, ask a question, show a calculation, correct a misconception and admit uncertainty. Separate deterministic simulation truth from generated explanations. Propose a content-validation rubric, accessibility alternatives and a small formative learner study with success/error measures. Do not promise improved learning without evidence.

## 6. Learning analytics and training

Design a cold-start learning model for KAIRO without fixed 'visual/auditory learner' diagnosis. Compare transparent rules/Bayesian knowledge tracing or logistic baselines with tabular models, relevant knowledge-tracing methods and time-series forecasts. Check whether Chronos is appropriate for our event volume rather than assuming it predicts exact mastery time. Identify public datasets, licences, mismatch with SA engineering learners, consent requirements and label definitions. Specify learner-level temporal splits, leakage prevention, calibration, missingness, uncertainty, fairness and an educationally valid target. Give a Kaggle experiment within a proposed 30 GPU-hour upper bound, with CPU baseline and hard stop; do not assume the user's actual quota. Explain what must be learned from real consented pilot data before deployment.

## 7. Career pathways and skills evidence

Research a role-alignment system linking current public job requirements, module content and learner evidence. Compare embedding retrieval, reranking, structured requirement matching and a constrained explanation model. Verify ESCO/O*NET and South African employer data reuse terms. Design a criterion-level evidence view with verified/self-reported/unassessed status, dated job/source provenance and missing skills. Cosine similarity must not become an exact employability percentage. Give evaluation labels, temporal holdout, subgroup checks, expired-advert handling and a learner-choice-preserving recommendation policy.

## 8. South African listening and voice

Find current pretrained ASR, translation and TTS options for English with South African accents, isiZulu, isiXhosa, Afrikaans, Sesotho and Setswana, verifying each language/model rather than inferring coverage. Compare Google supported services with appropriate Hugging Face/author checkpoints and browser/CPU candidates. Check licences for weights, code, training data and voice cloning, especially XTTS and MMS. Give exact model IDs, format/sample-rate contracts, code-switching/noisy-audio evaluation sets, WER/CER/semantic measures, speaker consent and latency/cost. Do not state a text LLM produces speech or animates the rig by itself.

## 9. SASL scope and data

Research South African Sign Language specifically, separately from ASL/BSL. Find valid licensed datasets, community/Deaf expert participation routes and pretrained temporal recognition/translation research. Distinguish isolated signs, fingerspelling, continuous signing, text-to-gloss and understandable signed output with facial/non-manual features. Verify all suggested model repository IDs. Explain why MediaPipe landmarks or a general video classifier do not establish translation. Propose a truthful bounded first capability and evaluation by fluent SASL users; do not generate supposed SASL signs as a substitute for linguistic validation.

## 10. On-demand model hosting and credits

Audit our best no-24/7 hosting route for one chosen extraction or speech model, not a different GPU for each studio. Compare managed model API, CPU batch, Cloud Run GPU, supported Vertex scale-to-zero Preview, manually stopped Compute Engine and an HF endpoint. Verify exact hardware/regions/quota, minimum CPU/RAM, model weight memory/quantisation/context overhead, cold-start behaviour, idle billing, build/storage/egress and stopped-VM disk costs. Use 10/100/1000 daily requests with explicit durations/tokens. Show formulas and sensitivity rather than a single false-precision total. Check actual Ollama/Groq/OpenRouter free restrictions and account privacy policies. Distinguish alerts-only budgets from eligible spend-cap enforcement; do not assume any credit balance or expiry.

## 11. Student-specific university experience

Verify and extend our selected Wits Mechanical Engineering year-three and UP programme 07130173 year-two module examples using official 2026 yearbooks only. Return exact codes, programme/year/semester/credits/prerequisites, source locators and unknowns. Identify shared modules by exact institution/code/year/version; thematic similarity alone must not merge assessment requirements. Map each module to reading/graph/2D/3D/practice with a reason and label KAIRO-created enrichment. Suggest a complete judge journey for each fictional identity without inventing enrolment, grades, timetables or university endorsement. Explain tenant/institution/course/owner access boundaries.

## 12. Research integration review

Review the attached KAIRO implementation brief and all returned research. Rank the next five implementation slices by learner value, judging evidence, dependency risk, time to demo and ongoing cost. For each identify current code boundary, exact input/output schema, which model/tool does what, retained provenance, failure/cancel/retry path, owner/permission check, meaningful acceptance evidence and rollback. Produce a claim ledger separating working features, tested prototypes, proposed services and unsupported assertions. Prefer one complete learner flow over a catalogue of integrations.
