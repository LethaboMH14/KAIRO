# KAIRO cost and scalability research handoff

**Agent:** `codex-luna-canvas-costs-20261024-a` (Codex, model `gpt-6.1-sol`, effort `unknown`; effort setting was not exposed). **Task:** `CANVAS-COSTS-20261024-001`. **Status:** complete. **Criteria:** Sustainability, Product, Intelligence. **Scope:** `docs/canvas-cost-research-20261024/` and this handoff only.

## Delivered

- Added `docs/canvas-cost-research-20261024/README.md`, dated 24 October 2026; official source-linked rate table, actual model/call caps cross-check, typical and stress scenario arithmetic, resource meters, variable/fixed cost map, API-vs-GPU break-even equation, cost risks and pricing package hypotheses.
- Checked repository instructions, selected product brief, judging matrix, coordination protocol/status and inbox; registered unique bus session, claimed the two permitted paths before writing, and checked inbox before handoff.
- Exact default model `gemini-3.5-flash-lite` located in `studio/server/google.mjs`; code call caps are 4,500 lesson, 256 guide, 1,100 passage-help output tokens. Service settings/overrides are described from release evidence, not a live cloud query.

## Evidence and method

- Primary pricing references linked in research file: Google Cloud Gemini Enterprise Agent Platform/Vertex pricing, Cloud TTS, Cloud Run, Firestore, Cloud Storage, Cloud Tasks; Firebase pricing; Payfast fees; SARS VAT sources.
- Example workload rates and usage volumes are explicit assumptions; no current invoice, usage metadata, exact cloud bill, FX translation, labor rate, customer demand, learning outcomes or forecast was accessed or asserted.
- Cost example is reproducible from token/character arithmetic and provider list rates. The user-authored execution handoff should validate exact usage tiers, endpoint rate, selected SKU currency/region, auth plan and cloud billing export before presenting a landed estimate.

## Limits / next work for root

- Root owns the simulation/workbook and pricing decision. Use scenarios as variable inputs only; model local/device narration separately from hosted Chirp 3 HD and include human support, educator QA, refunds/payment, content rights/accessibility, tax and founder time as applicable.
- Google prices and the 2026 VAT threshold can change; refresh before external pricing. Exact Johannesburg Cloud Storage/Cloud Run billing SKU calculations, Firebase auth plan, egress and real token distribution remain open.
- No app/cloud/package changes, provider calls, installs, user-document/browser/secret access or external messages were made.

## Checks

- Read-only source inspection confirmed model name and response token limits.
- Research calculations manually checked in written equations; no automated test requested or added.
- No further work in the claimed scope remains. Human validation, billing-export reconciliation and independent root review are pending.

## Arithmetic correction — 24 October 2026

Root independently identified that the initial typical-loop line arithmetic was wrong. I reopened a nonoverlapping bus task (`CANVAS-COSTS-CORRECTION-20261024-001`) and corrected the report, added `docs/canvas-cost-research-20261024/calculator.py` and its deterministic output `scenario-costs.json`.

Official page review also clarified a pricing-mode distinction: $0.15/M input and $1.25/M output appear in the Flex/Batch table, not Standard. The source `generateContent` call does not specify batch or flex. The corrected base case therefore uses the pricing page's Standard Gemini 3.5 Flash-Lite Global figures, $0.30/M input and $2.50/M output (page checked 24 Oct). Correct typical: model $0.00932, speech $0.24, subtotal **$0.24932**. Correct stress: model $0.02381, speech $0.60, subtotal **$0.62381**. Retrying each model component and fresh speech synthesis gives **$1.24762**. Calculator output was run and checked from JSON output.

Cloud Run has an explicitly provisional fallback using the public page's displayed default request-based rates (CPU $0.000024/vCPU-second, RAM $0.0000025/GiB-second, request $0.40/M), with Johannesburg Tier 1 membership noted but not conflated with an exact regional bill. Storage was not assigned an invented rate: Google lists Johannesburg SKU `4EC6-27CA-3AA0`, but the accessible public page output did not expose its current unit price. Exact price calculator/billing export remains required.
