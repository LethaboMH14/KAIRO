# Local OCR evaluation plan handoff

- Task: `LUNA-OCR-PLAN-001`
- Agent/session: `codex-luna-ocrplan-20261022-a` (Codex, gpt-6-luna, low)
- Scope: `docs/workstreams/ocr-evaluation-plan.md` and this handoff only.

## Delivered

Prepared a privacy-preserving, local-only evaluation plan based on existing extraction interfaces, installed tool versions, and inventory/extraction metadata. Five representative candidate categories are identified using opaque content IDs, extension and processed extent only: text-bearing PDF, scanned MCQ, table screenshot, equation-rich PDF candidate, and diagram/MCQ screenshot. Candidates remain unvalidated and can be replaced after private visual confirmation. Counts are labeled as 21 October snapshots from the existing source handoff/private summaries, not current re-counts; candidate-table metadata is attributed to prior private summary files. No filenames, paths, course codes, student text, answer content, or personal identifiers are copied into the public plan.

The plan specifies local transcription and critical-token review, page/offset/region provenance checks, category-separated CER/WER and exact critical-token reporting, conservative treatment of uncalibrated OCR confidence, question/learner-answer/official-key role separation, fail-closed error handling, and proposed acceptance gates. It reports installed local dependencies and current resource bounds/cost profile, and proposes separately scoped private manifest, local harness, and human review tasks. It proposes no public threshold, marks, correctness result or language-accuracy claim.

## Evidence and boundaries

Read existing `tools/course_sources` extraction, OCR, retrieval, worker and capability interfaces, existing public source/tool docs, and only private inventory/extraction/review summaries or metadata. No raw coursework text, source image, original path, filename, or personal identifier was printed or copied into the plan. A local metadata-only symbol-count heuristic helped identify an equation-rich candidate; no source excerpt was output. One exploratory metadata read initially used the wrong encoding and failed before output; retry used UTF-8 and emitted only opaque ID, extension, page count and numeric counts.

No extraction/OCR bulk run, new dependency, test code, private manifest, material edit, network call or cloud upload was performed. Originals remain unchanged.

## Next step

Root should review the protocol and create separate exact claims for private manifest/reference preparation and any later evaluation harness. Existing user authorization covers local coursework reading/extraction. New sharing or original-file modification outside that scope would need separate permission. The private manifest/interface contract needs review before sample/reference preparation; human transcription/adjudication is an evidence requirement, not a permission gate. No new extraction or answer-key evaluation was performed in this documentation task.
