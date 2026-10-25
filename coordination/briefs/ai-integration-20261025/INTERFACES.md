# AI integration wave contract — 25 October 2026

Root codex-ai-integration-20261025-a owns shared model/curator/retrieval and studio integration. Actual root model gpt-6.1-sol, effort unknown. Every worker registers its actual settings, checks the bus and claims only its listed paths. Existing active claims remain protected. No browser/headless observation, real microphone/camera activation, schedule, credentials in outputs or public IAM changes.

## A / extraction coverage
Worker owns studio/server/learner-workspace/extraction.mjs, ocr.py, new studio/server/extraction-coverage/, studio/src/extraction-coverage-ui/, studio/tests/extraction-coverage.test.mjs, docs/extraction-wave-20261025/, coordination/handoffs/2026-10-25-extraction-wave.md. No routes/router/provider edits.

Preserve extractUpload(bytes,ext) => {pages:[{text,locator,method,...}],limitNote,extraction?}. Add optional coverage:{schemaVersion:1,units:[{locator,status:'text'|'ocr'|'needs-review'|'skipped',reason?}],warnings:string[],visualUnderstanding:false}. Do not claim semantic understanding from OCR. Improve mixed native/scanned PDF coverage without replacing native text, respecting existing four-page OCR/time/pixel/size caps. Use dependency injection or deterministic fixtures. Export default ExtractionCoverage({coverage}: {coverage:unknown}) React component for root to mount. Worker reports exact cases and limitations. No new network/model calls or installs needed for this bounded package.

Acceptance: coverage truthful for mixed/sparse/limited files; original anchors preserved; bounds/cancellation/import invariants unchanged; meaningful tests invoke production helpers. Criteria Product/Intelligence/Usability; learner needs to know what was and was not read.

## B / opportunities
Worker owns studio/server/opportunities/, studio/src/opportunities/, studio/tests/opportunities.test.mjs, data/opportunities-20261025/, docs/opportunities-wave-20261025/, coordination/handoffs/2026-10-25-opportunities-wave.md. No shared router/server/provider edits.

Export listOpportunities({now,programme?,records?}={}) from studio/server/opportunities/index.mjs. Return {records,limitations}. Records use id,title,type:'job'|'bursary'|'internship'|'learnership'|'funding'|'hackathon',provider,discoveryUrl?,officialUrl,checkedAt,closesAt:null|string,requirements:string[],disciplines:string[],status:'open'|'closed'|'unknown',verification:'official'|'discovery-only'. Never infer open from absent deadline. Discovery listings StudentRoom/Graduates24 link to primary source; respect terms and do not implement arbitrary-URL crawling. Include a few public metadata-only verified examples if source evidence permits, otherwise explicitly unknown examples; no invented vacancies. No personal data or full copied articles.

Export default Opportunities({records,limitations}) React component; plain wording, dates/source/unknown visible, safe external links. Avoid CSS global selectors. Root mounts /opportunities and authenticated/public-metadata API. Provide deterministic tests for expiry, deduplication, unsafe URLs and requirement relevance without claiming hiring scores.

Acceptance Product/Impact/Intelligence: learner can inspect original source, freshness and relevance; no automated application, award eligibility or employer endorsement.

## Chat C / language and listening
Only studio/server/listening-core/, studio/src/listening-core/, studio/tests/listening-core.test.mjs, docs/listening-wave-20261025/, coordination/handoffs/2026-10-25-listening-wave.md. Build a bounded injected-fetch transcription adapter and transcript-confirmation state machine with explicit abort/locale/source labels. No real audio/cloud calls or root routes. Frozen pretrained candidate Groq whisper-large-v3-turbo only after official capability review; don't assert every South African language. No camera, audio activation or SASL claims. State-machine result must require learner confirmation before question submission.

## Chat D / pattern-learning evaluation
Only tools/learner-patterns-20261025/, studio/src/learner-pattern-events/, studio/tests/learner-pattern-events.test.mjs, docs/learner-patterns-20261025/, coordination/handoffs/2026-10-25-learner-patterns.md. Define versioned minimized attempt events: eventId, lessonId, sourceRevision, conceptId, taskId, taskRevision, rubricRevision, occurredAt, correct:boolean, helpExposure:'none'|'hint'|'worked-example'|'unknown', contextKey, assessmentKind:'practice'|'recall'|'transfer'. Use existing adaptive policy as reference; do not edit it or profile/lesson host. Deliver validator and synthetic-only CPU baseline/evaluation, learner/source-disjoint split, leakage tests and missingness. Synthetic scores do not prove real prediction. No training on private data or paid GPU.

## Root architecture
Private Cloud Run/Firestore/GCS remain current hosting. Provider gateway adds authenticated owner/revision checks, durable reservations, per-provider explicit consent and bounded transient fallback. Curator uses server-confirmed learner context, reviewed source and bounded history; deterministic adaptive recommendations remain labelled heuristics. Initial retrieval remains traceable keyword retrieval with optional injected semantic scores and fail-closed owner/revision filtering; no fabricated embeddings. Studio questions use current lesson/source plus allowed scene context; model output cannot execute arbitrary code/actions.

Terraform will describe reproducible existing service ownership without applying/importing broad resources blindly. Kubernetes is evaluated as a separately budgeted specialist inference option, not a reason to replace the working Cloud Run deployment. Research-derived choices must document cold starts, spend, region/privacy, licences and fallbacks. Deployment only after tested artefact and read-only cloud preflight; public access remains separately unresolved.
