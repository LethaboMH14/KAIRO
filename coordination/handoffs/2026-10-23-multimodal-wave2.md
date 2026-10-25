# Multimodal research wave 2 — handoff

Date: 23 October 2026  
Owner: `codex-luna-multimodal-wave2-20261023-a`  
Client/model/effort: Codex / exposed `gpt-6` / effort not exposed (`unknown`)  
Task: `MULTIMODAL-RESEARCH-WAVE2-A`  
Scope: `docs/multimodal-research-wave2/`, `coordination/handoffs/2026-10-23-multimodal-wave2.md` only.

## Delivery

- Added `docs/multimodal-research-wave2/README.md`, an evidence-backed image/document extraction recommendation, current visual model/provider snapshot, typed anchored-block contract, coverage-aware whole-material pipeline, fixture/acceptance matrix, resource/rights limits and judging evidence map.
- No runtime, routes, manifests, tests, private documents, APIs, cloud resources or provider credentials were changed or accessed. No installs, live inference, training, GPU use, browser, screenshot or deployment.
- Official primary source pages were checked on 23 October 2026. Model prices, model availability, limits, endpoint quality, terms and retention can change; recheck before any implementation or upload. The two OpenRouter named free vision endpoints are candidates, not evaluated product choices. Groq Qwen3.8 is not represented as free: the current Groq model page lists paid token rates and separate free-plan rate limits.

## Decision and value

Recommend a local-first, deterministic Docling `2.134.0` isolated comparison against KAIRO's current parsers, retaining current extraction as baseline. Add OCR engine only after identical fixture comparisons. Use MarkItDown `0.1.9` as lightweight text conversion comparator, not the evidence-bearing layout parser. Keep VLM interpretation explicit, crop-only, separately consented and unreviewed. Report full document unit counts and all skipped/failed pages rather than silently processing a prefix.

- **Product:** Exact page/slide/sheet/region identity for a learner's actual material; no unrelated/invented content. Acceptance: every reviewed block resolves to its source revision/locator, plus complete attempted/total counts.
- **Usability:** Learners see plain coverage, retry/review states and uncertainty. Acceptance: incomplete scans/figures cannot masquerade as fully processed; device accessibility still requires observation.
- **Intelligence:** Comparison uses typed evidence, OCR/vision separation and claims tied to coordinates. Acceptance: synthetic engineering/table/chart fixtures expose wrong digits, units, formulas, table alignment and invented connectivity. No model-quality result is asserted here.

## Research limitations and next action

This is research only, not implementation or benchmark. No private/uploaded source was read. No provider image request or customer content was sent. Groq free entitlement, OpenRouter endpoint provider region/retention, app consent copy, target hardware and actual parser RAM/VRAM/latency are unknown. GraniteDocling's parameter count does not establish KAIRO deployment fit. Ling's official weight-license record was not verified; do not assume commercial rights from a free endpoint. Official project-code licenses do not clear every transitive dependency, model, OCR language file or input source.

Next, root should approve a small isolated reproducibility spike, select synthetic or reviewed licensed fixtures, pin parser and model assets, and compare current native extraction vs Docling vs MarkItDown/Tesseract on coverage, exact text, tables, equations, layout anchors, error/abstention, resource use and rights. Do not integrate UI/routes or cloud analysis from this document alone. Root's existing Cloud-wave contract owns orchestration choice and backend/cloud work; this lane does not choose LangGraph, LangChain or CrewAI.

## Reproduction

Research is reproducible by reopening the linked official pages in `docs/multimodal-research-wave2/README.md` and inspecting the local baseline paths listed there. No executable test was appropriate for this docs-only task. The official sources include current release/catalogue pages but those are mutable; this memo records the dated values inspected and requires refresh at implementation.

No browser or headless browser was used. `web__run` search was used for primary public documentation only; no interactive site, account, API or uploaded/private content was accessed. No learner/device/accessibility acceptance is claimed.

## Bus handoff

Registration and exact task claim returned `ok:true` under the owner above. Inbox at task start was empty. The task's exact two scopes have evidence in the README and this handoff; task completion should release both scopes for root review.
