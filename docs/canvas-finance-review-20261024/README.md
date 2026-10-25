# Independent KAIRO canvas finance red-team

**Date:** 24 October 2026  
**Owner/session:** `codex-canvas-finance-review-20261024-a` · Codex · model exposed as `gpt-6`; effort setting not exposed (`unknown`).  
**Scope:** independent review only. Root-owned `tools/business_model/` and `docs/business-canvas-20261024/` were read where present and not edited. No app, cloud, billing, package, portal, browser or external account was touched.

## Judging need and acceptance

**Criteria:** Sustainability (credible costs, cash, and resilience), Product (an affordable useful learner offer), Usability (clear price/recovery terms), Intelligence (calculations trace to explicit units and evidence). **Need:** a learner or institutional buyer must understand what the proposed price buys and what happens when paid voice, usage, refunds, or procurement create a high-cost or delayed-cash case.

**Observable acceptance:** an independent reviewer can recompute example unit costs; identify whether a displayed price includes VAT; distinguish recognised revenue from cash and output VAT; see the downside when voice/retries/support rise; and find every unobserved demand, cost, and tax input labeled as an assumption. This is a desk review, not evidence of demand, a tax opinion, a validated forecast, or a bank stress test.

## Scope and source basis

Read `coordination/briefs/business-canvas-20261024/MODEL-CONTRACT.md`, `docs/canvas-cost-research-20261024/README.md`, `docs/judging-cloud-20261023/JUDGING-MATRIX.md`, the KAIRO README/product brief, and root-owned model paths if present. No files were found under `tools/business_model/` or `docs/business-canvas-20261024/` at review time; only the cost research README supplied scenario inputs. Accordingly, this report cannot reconcile a root workbook, scenario model, or nine final canvas fields.

The cost memo is dated 24 October 2026 and cites vendor/SARS URLs, but this task disallowed browser/network access. No local dated official SARS source text or PDF was found. Its R2.3m rolling-12-month compulsory VAT threshold effective 1 April 2026 and R120k voluntary threshold are therefore **reported from the memo, not independently verified here**. Do not replace them with historical R1m or treat this report as current legal/tax advice. Obtain a current SARS source and professional tax review before public pricing or registration decisions.

All figures below are reproducible arithmetic against inputs in the cost memo, not usage telemetry or sales forecasts. USD service rates, exchange/tax applicability, vendor changes, billing-account eligibility, and final ZAR pricing remain unverified. Calculations keep full precision until display.

## Independent calculations

### Typical loop correction

Using the memo’s exact workload and Global list rates (`$0.15/M input tokens`, `$1.25/M output tokens`):

| Call group | Input | Output | Recomputed cost |
|---|---:|---:|---:|
| Lesson | 3,500 | 1,500 | $0.002400 |
| Two passage-help calls | 2,400 | 800 | $0.001360 |
| Four KAIRO questions | 2,000 | 480 | $0.000900 |
| **Model subtotal** | **7,900** | **2,780** | **$0.004660** |
| 8,000 narrated characters at $30/M | — | — | $0.240000 |
| **Variable subtotal** | — | — | **$0.244660** |

The research memo reports model cost `$0.0034525` and total `$0.2435`; the displayed call-level expressions do not sum to that model subtotal. This review’s `$0.004660` corrects the arithmetic from the memo’s stated inputs, not the inputs themselves. It still excludes many cost categories listed below.

### Upper stress check

The memo’s high case totals 15,000 input and 7,724 output tokens, so model cost is `(15,000 × .15 + 7,724 × 1.25)/1,000,000 = $0.011905`. Twenty thousand narrated characters add `$0.60`; total `$0.611905` (memo rounds to `$0.6119`). A full retry of each modeled call and fresh synthesis doubles this to `$1.223810`. This is a per-loop illustration, not a controlled cap; non-modeled expenses and concurrent abuse remain outside it.

### VAT and payment illustration

Assume solely for illustration: consumer price `R49/month` **VAT-inclusive if registered**, standard-rate 15%, and the memo’s Payfast rate `3.2% + R2.00 ex VAT`, with 15% VAT on provider fees. Then ex-VAT sale revenue is `49/1.15 = R42.6087`, output VAT is `R6.3913`, processor fee including its VAT is `(49×0.032 + 2)×1.15 = R4.1032`, and cash after that fee before refunds is `R44.8968`. If one typical voice loop from the memo is served, subtracting only the `$0.24466` cost is not valid until a dated ZAR/USD rate is supplied. Do not compare ZAR price directly to USD cost. If R49 is instead VAT-exclusive, the learner invoice is R56.35 and output VAT is R7.35. A canvas that does not specify inclusive/exclusive basis can overstate net yield or confuse learner checkout.

### Annual institutional invoice timing

The contract’s sensitivity candidate `R35/seat/month ex VAT`, `250` seat minimum, annual price `R420/seat`, and `R6,000` onboarding imply `R105,000` annual seat invoice before VAT and `R6,000` separate onboarding, if all 250 seats are contracted and invoiced. At delivery over 12 months, the seat revenue run rate is `R8,750/month`; receiving the R105,000 upfront is cash timing, not R105,000 of month-one earned revenue. VAT, contract start, cancellation/refund rights, seat activation, collection timing, and onboarding recognition require accountant-reviewed treatment. No actual buyer, signed order, payment, or accepted price is evidenced.

## Material risks and concrete model fixes

1. **Price basis and VAT can be mixed.** The contract calls R49 VAT-inclusive if registered, while the research contribution formula defines `P` as VAT-exclusive. Store `price_display`, `vat_status`, `rate`, and `price_ex_vat` separately. For registered taxable supplies calculate `P_ex = P_inc/(1+r)` and output VAT `= P_inc-P_ex`; for unregistered scenarios, do not label any amount collected VAT. Add threshold-crossing sensitivity only after the current SARS rule and taxable-supply definition are verified. Zero-rate/exempt treatment must not be presumed for education.
2. **Typical AI cost arithmetic is understated.** Recomputed model subtotal is `$0.004660`, `$0.0012075` above the memo’s `$0.0034525` (about 35% higher); full voice loop is `$0.244660`. Replace only after input-level formulas are independently checked against billing-token semantics. Vary tokens/output and call counts; do not imply model per-call caps limit monthly spend.
3. **Voice-heavy users can overwhelm flat subscriptions.** Under memo assumptions, narration alone costs `$0.24` per typical loop and `$0.60` at 20k characters; retries can reach `$1.20` voice cost in upper stress. Model per-paid-user distribution and voice inclusion rate, a bounded allowance, overage/opt-in policy, and text/device alternative acceptance. A free-tier allowance must not be the long-run unit cost.
4. **Retries and abuse are correlated cost shocks.** Doubling the high example produces `$1.22381` variable cost per loop, before storage, compute and support. Add independent retry count by failure category, retry storms/in-flight duplication, compromised account, rate-limit bypass and service-incident scenarios; record budget ceilings as operator controls separately from user quotas.
5. **USD vendor cost vs ZAR revenue/FX is absent.** Never subtract USD loop costs from ZAR price. Add dated FX assumption and e.g. ±10/20/30% sensitivity (explicitly hypothetical) plus vendor price and tax changes; report gross margin only once the whole billable path is allocated. Keep service region and billing SKU explicit.
6. **Fixed payment fee is regressive and payment methods differ.** With R49 and memo Payfast assumptions, fee including fee VAT is R4.1032 (~8.4% of gross); at R35 it is `(35×.032+2)×1.15=R3.588` (~10.25%). Model payment success/failed attempts, refund fee retention, payout fees and invoice/PO handling separately; do not apply a consumer card fee to institutional receivables.
7. **Seat and B2C revenue can double-count learners.** Sponsored cohort learners may also appear as consumer subscribers; module enrollments are not unique customers. Define mutually exclusive paying customer/seat cohorts and revenue owner, deduplicate each learner-month, and count B2C only when separately paid. Run zero institutional contracts and delayed procurement/collection cases.
8. **Annual contract cash is not monthly earned revenue.** A R105k annual seat invoice is cash/receivable timing; illustrative revenue is R8,750/month over 12 months if service is delivered evenly. Model deferred revenue, contract liability, start/renewal/cancellation/refund terms, invoice collection lag, bad debt and annual renewal independently. Do not front-load all annual fees into month one revenue.
9. **Refunds, chargebacks and credits are missing from contribution.** Add paid-customer refund probability/amount, nonrefundable processing fee, chargeback/admin cost, service-credit liability and when credit is redeemed/expired. Report gross receipts, refunds, fee leakage, output VAT, net cash and revenue separately; legal validity of expiry terms needs review. No expiry value may be counted as revenue before valid recognition.
10. **Founder labour and support are excluded.** Add role-specific hours for onboarding, educator QA, support, moderation, recovery, accessibility, source-rights review and billing disputes × an explicitly assumed loaded replacement hourly rate. Show cash burn with unpaid founder draw separately from economic contribution including replacement labour. Never claim profitability merely because founders currently draw no salary.
11. **Acquisition, conversion, retention and churn are unobserved.** No CAC, funnel, conversion, paid retention, churn or willingness-to-pay sample is present. Keep these fields null/assumption ranges, not benchmark-derived forecasts. Sensitize activated→paid conversion, free-user costs, monthly churn, referral/paid acquisition mix and cohort size; calculate CAC from attributable acquisition spend and deduplicated new paid users, not signups or enrolment totals.
12. **Institutional procurement timing is unsupported.** Security/privacy review, purchasing windows, budget approval and invoice delays can shift revenue while fixed labour and cloud bills continue. Model months-to-sign and days-sales-outstanding with explicit ranges and zero-win case; validate by interviews/records before claiming likely sales.
13. **Cost omissions and free credits can fake margin.** Research excludes OCR, worker/Cloud Run, database, storage/soft-delete, egress, logs, auth, rights, accessibility, security, content work and support. Free quotas/credits expire and do not establish durable zero cost. Add every billable path using dated SKU + actual telemetry/export; until then label contribution “incomplete subtotal,” not gross margin or break-even.
14. **VAT threshold statement is not independently current-checked here.** The local memo itself cites R2.3m from 1 Apr 2026 and notes a legislative amendment status caveat. Without browser permission or local official source evidence, retain this as a memo citation requiring SARS confirmation. Include rolling 12-month taxable supplies and voluntary-registration branch only after tax adviser validates legal applicability.
15. **Demand and price points are hypotheses, not public facts.** R49 consumer, R35 seat, 250-seat minimum and onboarding R6,000 are sensitivity candidates in the contract, not evidence of willingness to pay or signed pipeline. Label all as assumptions; require consented learner/buyer interviews, objections, sample/date and offer test before adoption. Zero demand remains a required downside.
16. **Bank stress language can overstate rigor.** FNB/FirstRand public reporting may inform scenario discipline only. Do not claim proprietary bank-model replication, regulatory capital stress compliance, calibrated Monte Carlo success probabilities or a startup guarantee. A conditional scenario/seeded simulation remains a sensitivity tool until inputs and outcomes are observed and calibrated.

## Recommended reconciliation schema

For each scenario/month keep separate rows/fields: unique paying users, free active users, sponsored seats, completed lesson loops, model tokens by route, retries, synthesized characters, other cloud meters, support/onboarding hours, price basis, output VAT, fees and fee VAT, gross billings, refunds/credits, cash collections/payments, receivables, deferred revenue, earned revenue, FX, fixed costs and founder cash draw/replacement-cost labour. Validate identities:

- `gross billings = earned revenue + deferred revenue movement` only after the accounting policy/contract schedule is defined; taxes/agency amounts tracked separately.
- `cash receipts = collections of current/prior receivables - refunds/chargebacks`, not revenue by default.
- `net contribution = earned ex-VAT revenue - variable provider/payment/refund cost - allocated human service`; show fixed costs and founder labour separately.
- all unique learner-month cohort counts are nonnegative and B2C plus sponsored counts do not overlap.
- explicit zero-demand/no-contract case produces zero earned sales and still includes fixed operating costs.

## Evidence and remaining gaps

- **Local evidence inspected:** model contract (24 Oct), cost research (24 Oct), published judging matrix and product context. No root model files existed at the scoped path when inspected.
- **Reproducible independent arithmetic:** Decimal recomputation against memo inputs: typical model `$0.004660`, typical model+voice `$0.244660`; upper `$0.611905`; upper after one full retry `$1.223810`; R49 VAT-inclusive breakdown and Payfast fee; institutional annual-seat timing example. See source inputs above.
- **Official external evidence:** cost memo lists official vendor and SARS URLs, but none was retrieved in this browser-denied task. Rate freshness/SARS threshold remains unverified independently.
- **Missing:** a live/reconciled workbook, actual billing export/telemetry, current FX quote, full run-cost meter, support/refund data, founder hours and loaded rates, CAC/funnel/cohort/churn, buyer interviews, procurement evidence, tax/accounting advice, and signed contracts.
- **No validation claim:** no bank model was inspected; no customer traction, profit, margin, learning benefit, or willingness to pay was established.

## Next steps for root

1. Fix the typical-call arithmetic in root-owned model only after confirming each token/rate line; rerun tests and workbook reconciliation.
2. Put price basis and VAT status in explicit scenario inputs; have a South African tax/accounting professional review threshold, taxability, VAT timing and contract treatment.
3. Separate cash, output VAT, fee VAT, earned/deferred revenue, refunds and receivables in the 24-month sheet; make seat/B2C cohorts mutually exclusive.
4. Add voice-heavy, retries/abuse, FX shock, free-user cost, human support, procurement delay, churn, zero demand/no-contract and credits-expired cases.
5. Gather measured usage/billing and consented price/procurement research before promoting scenario outputs as forecasts. Keep every result conditional and non-guaranteed.

## Addendum: reconciliation against root model (24 October 2026)

Root's model became available after the initial review. Read-only inspection of `tools/business_model/model.py` and `docs/business-canvas-20261024/model-results.json` was added under a second exact-scope task; neither root file was edited. I executed the actual Python definitions in a no-write review namespace and recomputed `forecast` + `summary` for Base, Downside and Upside. All three summary dictionaries matched the saved JSON within `1e-7`. This is formula reproducibility, not an independent validation of the economic assumptions or Monte Carlo priors. Saved conditional Monte Carlo is 5,000 seeded runs, `negative_month24_fraction=0.9434`; interpretation in the result file correctly says it is **not** probability of commercial success.

### Actual model values independently traced

- Base consumer monthly unit: net consumer receipts/revenue after 3% refunds and 15% assumed VAT removal = R41.33043; cost R12.64236 (fee R4.1722, LLM R0.82016, voice R1.65, provisional infrastructure R2.00, support R4.00); resulting R28.68807 contribution before acquisition and fixed cost. This is a model scenario, not observed margin.
- Base institution per licensed seat/month: seat price R35 ex VAT; active fraction 0.6 × modeled active-learner service cost R6.06008 = R3.636048 expected service cost; model contribution R31.363952 before fixed/sales/onboarding. Every component is assumed; infrastructure reserves remain provisional.
- The `$0.00932` model bundle in `DRIVERS` is exactly two of the corrected `$0.004660` memo loops. With four paid bundles, 1.1 retry multiplier and R20/USD, the model gives R0.82016 LLM cost. No correction is needed to the model’s stated bundle arithmetic from that specific basis.
- `consumer_contribution` subtracts card fees including 15% fee VAT, so it is conservative as a cost if a registered vendor can recover eligible input VAT; whether recoverable and when is not modeled. Keep cash fee and economic expense distinct pending tax/accounting review.
- Base 24-month case in saved JSON: month-24 paid 232.12, seats 1,750, month-24 revenue R76,843.59, month-24 operating result R6,883.09, funding need R388,307.54 (20% buffer R465,969.05), cash at month 24 negative R275,205.93, receivables R216,000, deferred R437,500; first positive operating month 22. All are conditional driver outputs, not a forecast or proof of financing sufficiency. Downside has month-24 operating loss R33,141.24 and cash need R743,781.16; Upside is especially sensitive to unvalidated reach and cohort frequency.
- The No-demand stress explicitly keeps zero revenue while modeling R1,000,000 cash funding need (R1,200,000 with buffer). No-institution, 6-month collection, free-heavy, uncapped 80,000-character voice, FX/retry, no-renewal, double-support and high-churn stresses exist. These are useful sensitivity cases, not empirically calibrated scenarios.

### Revised material findings

1. **Outputs do not establish distinct or unique reach.** Forecast builds monthly `reach = reach_start × (1+growth)^(m-1)` and multiplies by activation/conversion every month without an addressable-market ceiling or explicit overlap/deduplication. This can model repeated exposure as new potential learners and, especially in upside, unbounded cohort growth. Add reachable TAM bounds and a unique-person/cohort definition; test repeat exposure and saturation. The reach and conversion values are labeled unvalidated in source, so retain that label prominently.
2. **VAT cash timing differs by channel and needs an explicit reviewed policy.** Consumer cash uses `net_consumer = price × (1-refund)/(1+vat)`, effectively stripping assumed VAT in the receipt period. Institutional cash adds `vat_float = (collected-invoice)×vat` while receivables/invoices are ex VAT; with a payment lag this moves the VAT portion from invoice month to collection month. Those are distinct timing assumptions. Confirm applicable tax point, filing/payment schedule, any cash accounting eligibility, refund adjustments and recoverable input tax with SARS/accountant; then model output/input VAT and cash dates consistently. Do not characterize current implementation as wrong tax treatment absent that review, but don't present it as verified.
3. **Revenue recognition for onboarding is not evidenced.** `onboard_rev` is recognized in full in the new-contract month while cash collection follows institutional lag and invoice includes the one-off fee. Define deliverable/acceptance/contract performance obligation and recognition timing; schedule deferred onboarding revenue if work spans time. Current logic is a planning convention only.
4. **“Funding need” and fully-costed operating loss answer different questions.** Operating result deducts full replacement labour each month (`founder_replacement`); cash flow instead uses staged founder cash draw (zero for months 1–3, then R15k/R25k, later replacement amount) and an initial setup outlay. Therefore funding need is under the modeled cash-draw schedule, while unpaid replacement labour appears in economic operating loss. Show cash burn, founder draw, replacement-cost loss and any accrued/unpaid labour separately; do not call the cash funding need sufficient for a fully staffed plan.
5. **Infrastructure inputs remain provisional placeholders.** `infra_paid_usd` R0.10 active user-month and `infra_free_usd` R0.03 are expressly PROVISIONAL all-in OCR/auth/storage/egress/DB/log reserves, not invoice-derived. The base result depends on them; report subtotal status, and replace with billing-export-metered costs before claiming margin/break-even.
6. **Consumer receipts, refunds and provider fees need reconciliation to transaction timing.** Code reduces consumer recognized receipts by expected refund fraction, assumes no rebate of original payment fee, adds expected R2 ex-VAT refund fees into a monthly average, and adds VAT on the fee. Stress the timing/volume of failed charges, refunds and chargebacks, actual provider fee-retention rules, payout costs, and refunds after service cost has already been incurred. Reconcile gross charges → refunds → processor fee/refund fee → VAT → cash by month.
7. **Sponsor-to-consumer overlap is only an assumed migration rule.** Contract seats are 250 per cohort; the model migrates up to 15% of paid accounts and subtracts half the seats from free accounts. This prevents some modeled double counting, but it is not based on roster identity or enrollment evidence and does not prove every seat is a unique learner. Document sponsor vs self-pay ownership and deduplicate learner-months in future evidence.
8. **Economic downside remains material even when spreadsheet checks pass.** Base reports positive operating result only from month 22; conditional Monte Carlo reports negative month-24 operating in 94.34% of arbitrary-prior runs. Downside has no positive month and requires modeled cash of about R743.8k. Preserve zero demand/no contract and funding risks; do not phrase base/upside as expected outcomes.
9. **Method check is a reproducibility gate only.** Source `checks()` asserts arithmetic identities (including the two-loop LLM bundle) and the saved JSON reconciles to current source functions. Those do not assert VAT correctness, unique reach, market evidence, scenario realism, result affordability, or whether cash support matches the promised service. Keep the machine checks labeled arithmetic/invariant checks.

The original 16 risks remain relevant. Root should correct the original-review sentence “no root model files existed” only by reading this dated addendum: it was true at initial inspection, and actual model reconciliation was completed later.
