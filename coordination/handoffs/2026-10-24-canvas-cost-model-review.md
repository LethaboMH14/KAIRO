# Independent review: KAIRO business model arithmetic

Reviewer: `codex-luna-canvas-costs-20261024-a` (gpt-6.1-sol, effort unknown). Read-only review scope requested by root: `tools/business_model/model.py` and `docs/business-canvas-20261024/model-results.json`; this handoff is the only file written. Criteria: Sustainability, Product and Intelligence. Buyer/learner need: a plausible, transparent operating model for the complete source-to-resume loop. Acceptance: check provider rate arithmetic, cohort/revenue accounting and counterfactual labels; all outputs remain assumptions rather than demand evidence.

## Blocking issue

**P1 — seasonal calendar is one month ahead.** `forecast()` comment says month 1 is November 2026, but `calendar=(10+m)%12+1` maps `m=1` to December and `m=2` to January. The CSV confirms month 1 and 2 have low-season multipliers 0.65, while the model should use November 1.0, December .65, January .65; June/July's .85 should occur at months 8/9, not 7/8. Use `((10 + m - 1) % 12) + 1` for Nov=11. This shifts B2C reach, new paid/free additions and related monthly revenue/cost/cash timing; regenerate all cases/stresses/counterfactuals/results and correct affected summaries after fix. Annual season-factor totals may cancel over a full year absent growth, but reach grows monthly, so total B2C output will not be identical.

## Reconciliations that passed read-only review

- Model rate arithmetic is internally consistent with the corrected source note: typical bundle is 7,900 assumed input and 2,780 output tokens, yielding `(7900×0.30 + 2780×2.50)/1e6 = $0.00932` at Standard Global rates. Four monthly bundles × 1.1 duplicate-success factor × R20/USD gives R0.82016. The specific inputs remain assumptions, not app telemetry.
- Base seven whole new institution cohorts occur at months 6, 9, 12, 15, 18, 21 and 24; because 12-month contracts renew at 18, 21 and 24, there are 10 annual seat invoices by month 24. With 250 seats × R35 × 12 = R105,000 each, billed value is R1,050,000. Seat-month recognition through month 24 is R612,500; unearned balance R437,500 matches `deferred24`. Month-24 licenses = 1,750. This is not a duplicate-revenue error: yearly revenue is recognized monthly while annual receipts/invoices are separate.
- Base month-24 AR R216,000 equals two new/renewed 250-seat annual invoices (R210,000) plus R6,000 onboarding, assuming one-month invoice-to-collection lag. Revenue rows use VAT-exclusive consumer and institution revenue; annual invoice/collection timing and deferred balances are kept separate.
- Consumer and institutional unit costs/contribution arithmetic checked against model formulas. Payfast card fee uses 3.2% + R2 plus expected R2 refund fee on 3% of charges, with 15% VAT on provider fees. Paid voice at 2,500 chars/month and Chirp 3 HD $30/M after allowance is correctly multiplied by 1.1 duplicate factor and R20/USD.
- Distinguish `first_operating_positive` (a first monthly P&L crossing, not sustained break-even) from cash break-even. Funding need is the minimum cumulative modeled cash balance; 20% buffer is arithmetic on that scenario need, not a risk-calibrated reserve.

## Boundaries and nonblocking risks

- Base assumes seven *new* 250-seat contracts in 19 months plus three renewals, not seven customers or evidenced pipeline. The scenario is intentionally hypothetical. In the cohort months, `migrate` removes up to 15% of cohort seats from consumer paid learners; free counts also subtract half the cohort seats. This is a modeled overlap rule, not a measured conversion or independently verified learner identity reconciliation. Keep scenario counts and migration assumptions visible.
- VAT cash timing is simplified: consumer revenue is net of VAT as if tax is remitted in the same cash period; institutional `vat_float = (collected-invoice)*rate` models output VAT paid on invoice before receiving invoice cash, then VAT collected with later receipts. This is a coherent conservative accrual-timing proxy but not a VAT-return calendar or tax opinion; label timing assumption and reconcile to actual tax periods/cash VAT schedule before a financing requirement is used.
- Current Cloud Run default rates and per-active-user `infra_paid_usd` / `infra_free_usd` reserves are not a cloud billing export. Keep provisional, replace using Johannesburg SKU/billing export; do not assert the model's R1,000 etc per month represents measured platform cost.
- Onboarding includes domain setup/review labour budget but not demonstrated content-rights, educator QA, caption/accessibility, institutional procurement or founder time beyond separate replacement labour. Price and workload validation remain open.
- Monte Carlo outputs are conditional on arbitrary priors; the recorded disclaimer appropriately says they are not probability of commercial success. Label these as sensitivity distributions, not predictive confidence intervals or traction forecasts.
- No-demand and no-institution tests are counterfactual arithmetic. The single-cohort price tests and seasonality are assumptions; none evidence willingness to pay or university procurement timing.

## Handoff

Fix the month indexing first, rerun the root pipeline, then review regenerated JSON/CSV deltas. Keep registered/unregistered VAT as separate scenarios if the outputs feed a plan; keep seven cohorts and all seats explicitly hypothetical. I did not edit model files or results and did not run the root model because it writes those files.
