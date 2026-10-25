# KAIRO Lean Canvas: cost, price and scale evidence

**Research date:** 24 October 2026. **Scope:** incremental cost for one reviewed source → generated lesson → reading/KAIRO → practice → saved evidence loop, with recurring and institutional economics kept separate. **Audience:** Sustainability, Product and Intelligence judging criteria. **Need:** a learner can convert reviewed material into a usable, attributable lesson without making variable service costs opaque. **Acceptance:** each listed rate links to an official current source; all workload volumes and nonpublished costs are explicitly assumptions. **Evidence:** repository configuration, dated pricing pages, and arithmetic below. **Gap:** no customer usage distribution, billable export, support/refund history, institutional purchasing study or validated willingness-to-pay exists in this pack.

## Current implementation boundary

The deployed app runs in `africa-south1`, with one CPU/1 GiB Cloud Run service, max one instance, zero minimum instances, concurrency 8 and 300-second request deadline. It uses Firestore, a Johannesburg private Storage bucket, Cloud Tasks in `europe-west1`, Vertex AI generative calls at `global`, and Google speech. Source-level default model is `gemini-3.5-flash-lite` in `studio/server/google.mjs`; deployment environment may override it, and no live environment was queried for this research. The code caps source lesson response at 4,500 output tokens; KAIRO guide at 256; passage help at 1,100. Lesson prompt selects at most 12,000 reviewed source characters according to the connected release. App quotas are not billing hard stops.

**Correction (24 October):** the first draft mistakenly used the Gemini 3.5 Flash-Lite Flex/Batch price as if it applied to this synchronous `generateContent` path. The code does not request Flex/Batch. The official page's **Standard** table lists Global standard prices of **US$0.30/M input tokens and US$2.50/M output tokens**. Flex/Batch prices are separately listed at $0.15/$1.25; they are not applied in the calculator. No free model quota or trial credits are deducted. [Official model pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) · [Model card](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash-lite)

## Rate card (USD unless explicitly ZAR)

Rates were read 24 October 2026 from official vendor pages; prices are list values and can change. Taxes, exchange conversion, negotiated pricing and billing-account-specific discounts are excluded.

| Service / billing unit | Published rate and region | Cost behaviour / use in this model | Source |
|---|---|---|---|
| Vertex Gemini 3.5 Flash-Lite Standard PayGo input / 1M tokens | $0.30 Global; $0.33 non-global | Per token; prompt, source context and tool wrappers all count. Synchronous code path; standard rate used below. | [Google Cloud model pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) |
| Vertex Gemini 3.5 Flash-Lite Standard PayGo output / 1M tokens | $2.50 Global; $2.75 non-global | Per generated/reasoning token. For lesson generation current code caps at 4,500 output tokens. | [Google Cloud model pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing) |
| Chirp 3 HD speech / character | $30 / 1M characters after first 1M characters per month | Monthly free allowance is conditional and excluded from long-run projection. Markup except `<mark>` and whitespace count; retries/replays that call synthesis count again. Device/browser voice alternative can avoid this paid path where acceptable. | [Google TTS pricing](https://cloud.google.com/text-to-speech/pricing) |
| Cloud Run in Johannesburg | Cloud Run's pricing page lists request-based active-time default rates of $0.000024/vCPU-second, $0.0000025/GiB-second and $0.40/million requests, and identifies Johannesburg in Tier 1. | **Provisional calculator fallback only:** compute a transparent envelope with these displayed default rates; do not call it the Johannesburg landed rate until exact SKU price/currency is checked. Use actual billable seconds and egress from Billing export. Minimum instances change idle economics. | [Cloud Run pricing](https://cloud.google.com/run/pricing) |
| Firestore Standard, Johannesburg | $0.03 / 100k reads; $0.09 / 100k writes; $0.01 / 100k deletes; storage $0.000205479 / GiB-hour; first 1 GiB and daily operation quotas shown on pricing page | Metered operations, indexed reads, metadata/index storage and outbound bandwidth; free allowance excluded from steady-state cost. | [Firestore pricing](https://cloud.google.com/firestore/pricing) |
| Cloud Storage Standard, single region | Johannesburg Standard Storage SKU is listed by Google; the public price page gives operation prices $0.005 / 1,000 Class A and $0.0004 / 1,000 Class B for single-region flat namespace. A current per-GiB-month Johannesburg amount was not exposed in the accessible public price table. | Do not insert a guessed storage $/GiB rate. Compute against current SKU `4EC6-27CA-3AA0` in calculator/export. Store originals/derived objects for actual retention; soft-deleted objects remain billable. | [Google SKU group](https://cloud.google.com/skus/sku-groups/standard-storage) · [Cloud Storage pricing](https://cloud.google.com/storage/pricing) |
| Cloud Tasks | First 1M billable operations/month free, then $0.40 / million through 5B | API calls and push delivery attempts count; tasks chunked at 32 KiB. Treat free band as temporary capacity, not unit-cost zero. | [Cloud Tasks pricing](https://cloud.google.com/tasks/pricing) |
| Firebase Authentication | No per-account price inserted here | Identity Platform/Firebase billing plan and MAU eligibility must be checked against chosen auth configuration; no invoice or exact method here. | [Firebase pricing](https://firebase.google.com/pricing) |
| Payfast card transaction | 3.2% + R2.00 ex VAT per transaction | Only if direct checkout is adopted. Adds transaction fee and VAT on provider fee; refunds R2.00 ex VAT, payout R8.70 ex VAT. Example R100 fee = R5.20 before VAT (R5.98 at 15% VAT on provider fee). | [Payfast fees](https://payfast.io/fees/) |
| SARS VAT | 15% standard rate; compulsory registration threshold R2.3m taxable supplies per rolling 12 months from 1 Apr 2026; voluntary registration threshold R120k subject to conditions | Separate not-registered and registered pricing scenarios; VAT collected is not revenue. Confirm application with tax adviser, including written obligations/exception rules. | [SARS VAT registration](https://www.sars.gov.za/types-of-tax/value-added-tax/register-for-vat/) · [SARS rate](https://www.sars.gov.za/tax-rates/other-taxes/) |

Cloud Run calculator context, exact SKU mapping, exact Johannesburg Cloud Storage rate, Firebase auth plan, and relevant network-egress destinations remain to be reconciled from a modeled invoice. No current cloud bill is represented.

## Reproducible lesson-loop estimate

Use formula, not a claim about current measured users. Assume UTF-8 educational source text, USD list price and no caching. Tokens, narration, storage and call counts below are example workload inputs, not telemetry. At approximately 4 characters per token, the code's 12,000-character source selection is roughly 3,000 tokens; actual tokenization varies by text/language and JSON/system wrappers add tokens.

`LLM = (input_tokens × $0.30 + output_tokens × $2.50) / 1,000,000` for Global Standard PayGo endpoint.

**Typical illustrative loop:** one lesson call at 3,500 input / 1,500 output tokens; 2 passage-help calls at 1,200 / 400 tokens each; 4 KAIRO questions at 500 / 120 tokens each. Model amount = lesson `($0.00105 + $0.00375) = $0.00480`; passage help `($0.00072 + $0.00200) = $0.00272`; guide `($0.00060 + $0.00120) = $0.00180`; LLM total **$0.00932**. Narrate an assumed 8,000 characters once: `8,000 × $0.00003 = $0.24` after monthly free allowance is exhausted. Variable AI+speech subtotal is **$0.24932 per loop**, before extraction/CPU, database, object delivery, logs, support, payment, content, taxes, refunds or labour. The reproducible component table is emitted by [calculator.py](calculator.py) and saved in [scenario-costs.json](scenario-costs.json). Reading/keyboard/browser narration can reduce the premium TTS line to zero for the learner who uses that route; do not imply equal experience without validation.

**Upper stress illustration:** lesson input 5,000 tokens and full code output cap 4,500; four KAIRO questions each 1,000 input/256 output (code output cap); two passage calls each 3,000 input/1,100 output; 20,000 narrated characters. One successful pass: lesson `$0.01275`, guides `$0.00376`, passage help `$0.00730`, model total **$0.02381**; speech `$0.60`; total **$0.62381**. One retry of every model action and one fresh synthesis doubles variable amount to **$1.24762**. See JSON component output. This is arithmetic, not an enforced spend cap. At monthly volume N, multiply; quotas can be exhausted by retries/abuse and do not guarantee a billing ceiling.

**Exclude from unit estimate until measured:** CPU/worker wall-clock and cold starts, upload/download GB, document/parser/OCR paths, DB reads/writes/indexes, object count/retention and soft delete, logging/monitoring, tax and FX, support tickets and educator review, payment attempts/refunds, onboarding and procurement, product engineering, security/accessibility/content rights, learning material authoring, content review and founder opportunity cost. Record retries by failure category; choose a refund/service-credit policy only after pricing and legal review.

For Cloud Run, a temporary proxy (not regional invoice claim) is `vCPU_seconds × $0.000024 + GiB_seconds × $0.0000025 + requests × $0.40/1M`, plus outbound/inter-region egress. For instance 1 vCPU/1 GiB active 60 seconds: proxy = `$0.00159` before requests/egress. Replace with exact Johannesburg Cloud Run SKU/currency from current price calculator or billing export. For Cloud Storage, use actual Johannesburg Standard SKU `4EC6-27CA-3AA0`; this page extraction did not expose its current storage unit price, so no numeric proxy is substituted. Firestore and Storage become retention/read/egress dependent; compute from per-learner object sizes, operation counts and retention rather than assuming free quotas.

## Cost structure, pricing and scalability choices

| Cost item | Type | Scale driver / decision |
|---|---|---|
| Hosted app and extraction worker | Variable compute plus fixed engineering/operations | CPU/RAM seconds, cold-start/idle configuration, extraction document and OCR size, retry time; measure per successful and failed import. |
| Model API | Variable | Prompt context and output tokens, repeated teaching turns, retries, model/endpoint/rate; trim irrelevant source excerpts and offer bounded lesson generation. |
| Premium voice | Variable | Characters synthesized; charge/ration as optional premium voice only if device narration and text alternatives remain useful and accepted. Cache lawful audio where privacy/deletion rules permit; count cache hit rate. |
| Storage and delivery | Variable recurring | Source bytes, derived lesson/audio, retention, soft-delete window, object reads, regional transfer/egress. Retention and deletion policy matter more than one small file's storage. |
| Firestore/Tasks/Auth | Metered / per user / usage dependent | Reads/writes, documents/index size, jobs/retries, configured identity plan. No free tier credited in long-run safety case. |
| Human service | Variable and fixed | Educator QA, onboarding, support, moderation, content rights clearance, accessibility review, recovery and refunds. Cost as paid hours × loaded rate, then add overhead; no wage figure assumed. |
| Payment fees | Per transaction | Payfast card fee is materially regressive on low-value subscriptions because fixed R2 fee; model separately for direct-to-consumer. Institutional invoices/POs have separate admin cost. |
| Product/security/legal/content production | Fixed + stepwise | Engineering, abuse handling, data protection, rights, accessibility, audits, reporting; allocate by active paid accounts, not just API cost. |

**SaaS API vs self-hosted GPU:** remain on paid API for the bounded pilot. Compare hosted-GPU only when usage trace, model quality, data rights and operator capacity exist. Break-even equation: `self-hosted monthly fixed GPU + ops + storage/egress + amortized validation / (API cost per lesson - GPU marginal cost per lesson)`. If denominator ≤0 or GPU quality/latency/residency fail acceptance, no break-even. Self-hosting adds idle capacity, upgrades, patching, observability, model licensing, evaluation and on-call. No model training is proposed: no rights-cleared representative dataset or validated evaluation dataset/labels/holdout is recorded. Any finetuning proposal requires a fresh rights, privacy, leakage, quality and cost gate.

**Possible packaging hypotheses (not recommendations proven by demand):** learner free basic reading/local study + metered fair-use KAIRO, optional paid narrated pack/add-on with explicit character limits, and institution cohort licence with annual seat/usage bands. Subscription value must cover voice-intensive users and human support, not an average free-tier demo. Use institution pricing tests/interviews before adopting; do not add checkout or charge users on this research alone.

## Risks and validation gates

- Trial/free allowances expire, can differ by service, region, model and billing identity; all steady-state cases above charge from first unit except the explicit TTS calculation's no-free scenario. Credits are excluded.
- Model input/output spikes from long prompts and retries; current app token caps are per call, not a monthly spending guarantee. Validate real usage metadata and app-level rate caps.
- Voice quota makes the first million characters look free, then Chirp HD is $30/million. Keep fallback and consider a paid add-on only after accessibility/usability checks.
- Public or shared-device abuse can multiply calls. Daily quotas cap application behavior only and may not halt a bill after compromise or concurrent in-flight work. Need billing budget alerts, keyless least privilege, anomaly detection and operator playbook.
- Single max instance limits capacity; queuing/throttling, slow cold starts and educator support can dominate cost/experience. Measure concurrent imports and voice/guide latencies; no scale claim follows from pilot deployment.
- Educator QA, source permissions, copyright, caption/transcript creation and accessible alternatives can cost more than inference. Budget each through actual role-hours and licensing quotes.
- Account deletion/retention and seven-day soft delete affect storage/privacy; validate lifecycle and user promises before estimating retention.
- University procurement, annual budgeting and security review can delay institutional revenue. Treat delay as a scenario assumption until institution interviews or procurement records establish it; no demand evidence is asserted.
- VAT scenario: registered vendor adds applicable output VAT to taxable supply and may claim eligible input VAT subject to law; not registered vendor cannot present VAT as a collectible line. SARS threshold current FAQ notes legislative amendment not yet promulgated at publication while applications are administered at announced threshold. Seek professional tax review.
- Foreign SaaS API and regional processing terms need privacy/contract review; compute region does not establish every service's processing region. Voice/model are `global` endpoint in current source path.

## Small scenario sheet for the root canvas

For paid learner price P (VAT-exclusive if registered), payment share p (0 for invoice scenario), recurring platform fixed monthly F, monthly lesson loops L, voice inclusion rate v, and human support hours H at loaded cost W:

`monthly contribution before fixed labour = L × (P × (1-p) - C_loop) - F - H×W - refunds - content/accessibility allocation`

`break-even learner-loops = (F + H×W + monthly rights/security/content cost) / (P×(1-p)-C_loop)`

Use separate standard and voice-heavy C_loop; use p from chosen payment method, and add fee VAT scenario. If contribution denominator is ≤0, package/usage allowance is unsustainable. No prices, margin, break-even volume, founder wage, founder labour, institution demand, retention or growth forecast can be grounded by available evidence yet. Root owns the simulation/workbook and should insert its own explicitly labelled volume/price scenarios rather than interpreting this example as a forecast.

## Claim/evidence map

| Judging criterion | Learner/buyer need and improvement | Observable acceptance evidence | Remaining gap |
|---|---|---|---|
| Sustainability | Understand what a completed loop costs and where human/voice-intensive costs sit. | Every provider meter linked; formula includes retries, premium voice, payment and labour; repeat with billing export. | Real cost distribution, support burden, pricing willingness, procurement and contribution margin. |
| Product | Avoid promising unlimited premium capabilities under a cheap basic plan. | Clearly separate local reading from hosted generation and paid narration; test a source-to-resume package. | User comprehension and acceptable feature packaging. |
| Intelligence | Ground usage-based economic scenario in configured model caps and token billing. | Model name, route and caps checked in source; published matching list rate; token assumptions visible. | Production environment override, per-call token telemetry, evaluation of lesson quality per cost. |

