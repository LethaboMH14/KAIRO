# Canvas finance red-team handoff

**Session:** `codex-canvas-finance-review-20261024-a` (Codex, exposed model `gpt-6`; effort `unknown`, not exposed).  
**Bus task:** `CANVAS-FINANCE-REVIEW-20261024-001`; the exact evidence and handoff paths were registered/claimed successfully before editing. Previous specialist-review task remains active under its existing owner and was neither edited nor cleared.

## Delivered

- `docs/canvas-finance-review-20261024/README.md` contains the independent finance review, calculation detail, 16 material risks, proposed model identities/reconciliation checks, evidence boundaries and next steps.
- Root model areas `tools/business_model/` and `docs/business-canvas-20261024/` were inspected; no files were present at those paths at review time. No root-owned forecast, workbook, plan or canvas field was changed.
- Primary input evidence was `coordination/briefs/business-canvas-20261024/MODEL-CONTRACT.md` and `docs/canvas-cost-research-20261024/README.md`; judging context came from `docs/judging-cloud-20261023/JUDGING-MATRIX.md`, README and the KAIRO product brief.
- After root published its model, a second exact-scope task (`CANVAS-FINANCE-REVIEW-20261024-002`) read only `tools/business_model/model.py` and `docs/business-canvas-20261024/model-results.json`; current reconciliation is added to the review README. No root files were edited.

## Criterion, need, acceptance and result

- **Sustainability:** identify cost/cash/VAT/support failure cases before the pricing story. **Product:** avoid proposing a flat offer that hides voice-heavy cost or confuses buyer/learner revenue. **Usability:** expose clear inclusive/exclusive price and recovery/refund assumptions. **Intelligence:** calculations recompute from transparent units.
- **Need:** learner and buyer must understand the price, usage limits, and what happens under costly voice/retry or delayed procurement.
- **Acceptance check performed:** Decimal arithmetic independently recomputed call costs and the memo’s upper stress, R49 price/VAT/processor-fee arithmetic, and annual seat cash vs monthly earning; listed specific formulas and missing evidence. Found the typical AI model subtotal should be `$0.004660`, not the cost memo’s `$0.0034525`, for its listed inputs. Typical model+voice subtotal becomes `$0.244660`; upper case and one-full-retry total reconcile to `$0.611905` and `$1.223810`.
- **Remaining:** no model workbook existed to reconcile. No demand/traction, margin, profit, learning-outcome or buyer claim is supported. No bank model was tested or replicated.

### Root-model addendum

- Executed the actual `DRIVERS`, `units`, `forecast`, and `summary` functions in a Python review namespace without invoking `main()` or writing outputs. Base/Downside/Upside recomputations match the currently saved JSON summary values within `1e-7`.
- Actual base scenario outputs include: R76,843.59 month-24 revenue, R6,883.09 month-24 operating, R388,307.54 funding need / R465,969.05 with 20% buffer, negative R275,205.93 month-24 cash, R216,000 receivables, R437,500 deferred revenue. Downside cash funding need R743,781.16 and month-24 loss R33,141.24. These are hypothetical model outputs only.
- Current stored Monte Carlo: 5,000 runs, fixed seed 20261024, `negative_month24_fraction=0.9434`; model itself labels it conditional on arbitrary planning priors, not commercial-success probability.
- New findings: monthly reach compounds without an explicit unique-person/TAM saturation bound; VAT timing assumes same-period VAT removal for consumer receipts and a separate invoice/collection bridge for institutional invoices; onboarding fee is recognized in contract month without evidence of service-delivery schedule; `funding_need` uses staged cash founder draws while `operating` includes full founder replacement labour; paid/free infrastructure per-user reserves remain provisional; payment refunds/fee timing and 15%/50% cohort migration are model assumptions, not identity-deduplicated enrollment evidence.
- The memo’s corrected `$0.004660` typical model loop is consistent with the root model’s `$0.00932` bundle as two loops. No need to change the earlier arithmetic finding. Root source's `checks()` and saved output demonstrate arithmetic identities and reproducibility, not tax correctness or calibrated demand.

## Checks and limitations

- Read-only local review; no browser/network, external accounts, cloud/provider calls, screenshots, billing mutation, installs, deployment, app edits, or chat messages.
- SARS threshold: local cost memo says R2.3m/rolling 12 months from 1 Apr 2026 and R120k voluntary; it cites official URLs and flags legislative status. This review could not independently retrieve an official current SARS source because the task prohibits browser access. The threshold is therefore memo-derived/unverified here, not legal/tax advice; no historical R1m figure was introduced. Root model stores 15% as conservative registered-vendor planning, not actual registration.
- Rates and workload counts remain research inputs/assumptions, not measured telemetry or invoices. ZAR/USD unit economics need an explicit dated FX input. Product regions do not prove data residency. Support, refunds, CAC, conversion, churn, founder hours, procurement and revenue schedules remain unmeasured.
- Do not mark financial viability, institutional demand or app acceptance from this review. Parent should independently review before integration or competition-facing claims.

## Reproduction

Recompute listed values with Python `decimal.Decimal` using the source memo’s formulas:

```text
input tokens = 3500 + 2*1200 + 4*500 = 7900
output tokens = 1500 + 2*400 + 4*120 = 2780
model USD = (7900*.15 + 2780*1.25)/1_000_000 = .004660
typical voice USD = 8000*30/1_000_000 = .24
typical subtotal = .244660
upper model USD = (15000*.15 + 7724*1.25)/1_000_000 = .011905
upper voice USD = 20000*30/1_000_000 = .60
upper + full retry = 2*(.011905+.60) = 1.223810
R49 VAT-inclusive ex-VAT = 49/1.15 = 42.60869565...
R49 output VAT = 49 - 49/1.15 = 6.39130434...
R49 card fee incl. fee VAT = (49*.032+2)*1.15 = 4.10320
250*R420 annual seat cash = R105000; even monthly service revenue = R8750
```

Bus task is completed with this handoff and the evidence README; claim release is recorded by completion. No root implementation/integration was performed.
