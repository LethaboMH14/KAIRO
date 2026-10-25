# KAIRO decision-oriented unit economics (assumption model)

**Status:** illustrative model reviewed/extended on 25 October 2026. NOT billings, paid customers, recorded users, a price quote, forecast, tax calculation or investment return. The earlier Core workbook and full-platform Python model under `docs/business-canvas-20261024/` remain their own historical reference. This tiny Node calculator adds an independently reproducible **cost-per-completed-task plus offer-level contribution and stress test**, rather than replacing the richer workbook.

## Run (from repository root)

```sh
node --test docs/product-proof-20261025/business-model/model.test.mjs
node docs/product-proof-20261025/business-model/scenarios.mjs
```

KAIRO's `studio/tests/product-proof-economics.test.mjs` also imports these tests into the Node 24 serial CI suite so negative pricing/invariant regressions are visible. Full-suite CI is authoritative for the PR; local tests alone do not prove browser/hosted functionality.

## Where the numbers come from

| Input | Hypothesis / interpretation | Source / verification |
|---|---|---|
| R49/month personal (incl 15% VAT if registered) | Pricing hypothesis; actual willingness to pay unknown | `docs/business-canvas-20261024/FULL-PLATFORM-COSTS.md`; verify VAT status with accountant |
| R59 institution Connected, R149 workforce (ex VAT) | Separate candidate offers, neither implemented as a paid contract | Same canvas; do not conflate learner and institution payer |
| $0.30/M input, $2.50/M output | Gemini 3.5 Flash-Lite **Standard Global** list-rate snapshot, NOT verified actual KAIRO model/tier/bill | https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing ; checked 25 Oct 2026; verify latest |
| $30/M premium narration characters | Premium TTS list rate from older KAIRO provider research, *not* proof paid synthesis is active every task | https://cloud.google.com/text-to-speech/pricing ; check tier/character accounting |
| $1.50/1000 OCR pages, $0.016 STT/audio minute | Candidate Google paid OCR/STT Standard rates in previous cost source; workload amounts are hypothetical | `docs/business-canvas-20261024/FULL-PLATFORM-COSTS.md` links Google official price tables; confirm model/path |
| R20/USD | Pure FX budgeting assumption; **not** current foreign-exchange quote | Older economics model; replace with observed bank settlement rate |
| R45,000 Core and R198,000 full-platform monthly shared cost | Budget **hypotheses**, not confirmed team payroll, a cloud bill or financing | Older `ECONOMICS.md` and `FULL-PLATFORM-COSTS.md`; avoid double-counting fixed/shared staff |
| Model 7900 input/2780 output across 7 actions | Example completed study-loop workload, not real sampled tokens | Existing Oct 24 `docs/canvas-cost-research-20261024/README.md` |
| 0.2 OCR pages/task, 0.1 STT minute/task, 625 premium chars/task, 60% active seats, 4 completed tasks/active seat, 2 support mins/active seat | **New scenario assumptions**, chosen to exercise cost categories; never treat as measured KAIRO behaviour | Must be replaced with privacy-approved usage/cost analysis in Issue #38 |
| R0.30 other variable task and R0.20/licensed seat | Pure provisional reserve for infra/storage/egress; potentially incomplete | **NOT** verified regional Cloud Run/GCS/Firestore/Cloud Tasks price |
| 1.1 duplicate/retry multiplier, 15% foreign tax reserve | Stress/foreign taxation placeholders, not observed retry/actual tax | Replace with real provider logs/statement and professional tax advice |
| 3% refunds, Payfast 3.2% + R2, charged fee incl 15% VAT | Consumer processing hypotheses; there is no implemented checkout | Existing business canvas; https://payfast.io/fees/ ; confirm gateway/contract/VAT |

## Scope and critical accounting caveats

- Per-task token cost equals `calls * ((input tokens × input rate) + (output tokens × output rate)) / 1,000,000`. Add voice, OCR, STT then retry factor, FX and reserve. **Do not** apply Flex/Batch rates to synchronous requests unless actual KAIRO path changes and is proven.
- Revenue is booked by contracted seats and price and **does not rise** just because usage rises. Personal incl-VAT revenue is divided by `1+VAT` and a scenario refund fraction is applied. Institution/enterprise nominal ex-VAT revenue is **not** automatically paid cash; contract setup, collections, bad debt and annual-revenue recognition need a separate model.
- Completed tasks are modelled by seat count × active fraction × tasks per active month, **not** observed users; zero sales produces zero earned revenue but full shared overhead.
- Model's `breakEvenLicensedSeats` is a single-offer contribution approximation holding price and usage mix constant; it **does not validate demand or ability to sell that many seats**. Fixed and support costs must be assigned consistently; do not sum full shared R198k across unrelated offers in a portfolio forecast.
- The R45k Core and R198k fuller-platform numbers describe alternative **scope envelopes**, not additive costs. Support by contracted user, custom course authoring, acquiring customers, VAT and cash timing are important unmodelled costs beyond placeholders.
- Generated case values are diagnostics, not finance statements. The `no paid customers` case is intentionally negative, and `heavy-usage-retry` intentionally raises cost with unchanged seat revenue.
- Actual breakeven/payability needs current invoices/SKU/serving tier, provider failure rates, usage measurements and employer/institution commitment. Do not claim free credits make the service permanently costless.

## What to implement next

- Issue [#38](https://github.com/LethaboMH14/KAIRO/issues/38): quantify costs from actual authenticated redacted cloud billing when individually permitted, user-cohort support minutes, practical workload distribution, institution buyer quotes. Review whether model demand, renewal and sales-cycle assumptions are evidence or fiction.
- Issue [#39](https://github.com/LethaboMH14/KAIRO/issues/39): privacy-preserving cost/quality instrumentation at completed-task boundaries with no silent user profiling.
- Issue [#43](https://github.com/LethaboMH14/KAIRO/issues/43): versioned claim→evidence ledger and validator; numerical business claims must link to the actual input/source date.
- Gate any new premium narration/vision/embedding feature on a calculated **cost per completed learning task** and its reading/low-data fallback, not only token price.

**Decision discipline:** If an output shows a loss-making offer, propose a narrower, useful learning task, reliable on-device narration option, usage budget or institutional sponsorship hypothesis rather than hiding the cost or falsely promising a benefit.
