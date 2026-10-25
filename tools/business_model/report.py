"""Generate consistent human-readable results and plain portal copy from reviewed files."""
import json, math, re, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from model import OUT, ROOT, CASES, units, forecast
r=json.loads((OUT/'model-results.json').read_text())
fmt=lambda x:f'R{x:,.0f}'
u=r['cases']['Base']['units'];b=r['cases']['Base']['summary']
parts=['# KAIRO economics and stress tests\n',
'''24 October 2026. This is a pre-revenue decision model, not a validated business forecast, valuation, tax filing or guarantee. The decision-relevant starting position is **no verified paying customers/contracts**. The illustrative Base case assumes successful sales that have not happened. Read the nine-field canvas with these limitations.

## How the value becomes revenue

The learner gets a specific, checkable concept-to-practice task. The potential institutional buyer pays for a scoped supported cohort and reviewed module fit, subject to purchasing/privacy approval. The proposed R35/seat/month ex VAT is a hypothesis about that service, not a price justified simply by student enrolment. The R49 individual plan competes with free study tools and existing lecturer support; its usefulness, affordability and repeat demand must be tested. Do not sell an unlimited AI/voice subscription at these prices.

The 20–40 learner research pilot is **not** a 250-seat contract. It can test the product and buyer proposition without committing to the 24-month commercial cost base. No institution, FNB, funder or employer has been verified as a customer in this model.

## Unit economics — illustrative Base usage

All monetary calculations retain precision until display. R20/USD is a budgeting assumption, not a quoted market exchange rate. Provider list rates exclude allowances/free credits. A separate 15% reserve is added to USD cloud costs for possible vendor/import taxes, with no assumed recovery. Actual invoice/tax treatment may differ.

| One paid consumer month | Calculation / budget | Amount |
|---|---|---|''',
f'| Gross displayed price | Proposed, incl VAT if registered | R49.00 |',
f'| Net revenue | 49 × (1 − 3% refunds) / 1.15 | R{u["net_consumer"]:.2f} |',
f'| Model bundles | 4 × $0.00932 × 1.1 billable duplicate factor × 20 × 1.15 | R{u["llm"]:.2f} |',
f'| Premium voice | 2,500 chars × $30/M × 1.1 × 20 × 1.15 | R{u["voice"]:.2f} |',
f'| Cloud reserve | $0.10/active user × 20 × 1.15, NOT invoice-measured | R{u["infra"]:.2f} |',
f'| Human support | 2 minutes / 60 × R120/hour, fully loaded budget | R{u["support"]:.2f} |',
f'| Payment/refund fees | (49 × 3.2% + R2 + 3% × R2) × 1.15 | R{u["fee"]:.2f} |',
f'| **Variable cost** | Above expense lines | **R{u["consumer_cost"]:.2f}** |',
f'| **Contribution before shared costs** | Net revenue minus variable costs | **R{u["consumer_contribution"]:.2f}** |',
f'\nThis is {u["consumer_contribution"]/u["net_consumer"]:.1%} contribution margin on net revenue under assumed usage, not a verified accounting gross margin. Refunds reduce revenue; refund processing cost is separately included, not deducted twice. Full usage cost is incurred even for an expected refunded customer. Settlement costs are shared once monthly in the forecast. Failed collections/chargebacks need separate provider evidence and an allowance before billing goes live.\n',
f'Free active user: R{u["free_cost"]:.2f}/month at 0.25 cloud bundles, $0.03 infra reserve and 0.25 support minutes. Institutional active learner: R{u["inst_active_cost"]:.2f}/month at two bundles, the same average premium voice, $0.10 infra reserve and one support minute. At 60% active usage, R35/contracted seat leaves R{u["inst_contribution"]:.2f}/licensed seat/month before shared/acquisition costs. All these usage distributions are assumptions.\n',
'''## Published inputs versus budgets

| Input | Rate / status | Source or next check |
|---|---|---|
| Gemini 3.5 Flash-Lite Standard Global | $0.30/M input and $2.50/M output tokens, checked 24 Oct 2026 | [Google pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing). Flex/Batch discounts do not apply to the current synchronous path. |
| Lesson/help bundle | 7,900 input and 2,780 output tokens across 7 calls → $0.00932 | Workload assumption; matched rate arithmetic. Actual languages/token wrappers vary; sample token usage. |
| Premium narration | Chirp 3 HD $30/M characters after allowance | [Google speech pricing](https://cloud.google.com/text-to-speech/pricing). Whole monthly voice budget, not per lesson. |
| Domestic card collection | Payfast 3.2% + R2 ex VAT; R2 refund; R8.70 monthly payout budget ex VAT | [Payfast](https://payfast.io/fees/). Proposed gateway, not integrated/contracted. |
| Standard VAT | 15%; current SARS page says R2.3m compulsory / R120k voluntary threshold subject to conditions | [SARS](https://www.sars.gov.za/tax-rates/other-taxes/), [registration](https://www.sars.gov.za/types-of-tax/value-added-tax/register-for-vat/), [Sept 2026 transition note](https://www.sars.gov.za/businesses-and-employers/my-business-and-tax/vat-connect-issue-21-september-2026/). Conservative model assumes registered from outset; not a statement about actual registration or educational exemption. |
| OCR, compute, auth, original/derived storage, DB, egress, logs, task retries | PROVISIONAL combined reserve: $0.10/paid active or $0.03/free active month, increased in downside | Not an official composite rate. Replace with Johannesburg SKUs and measured call seconds/bytes, object/index/backup/retention growth, auth billing method and actual invoice. [Detailed rate research](../canvas-cost-research-20261024/README.md). No cloud bill was fetched. |
| Fixed/shared budget | R45k/month economic cost in Base, plus R2.5k acquisition | R30k replacement engineering/founder, R8k educational QA, R4k ops, R3k privacy/security reserve. Assumptions, not salary survey/quotes. |
| Per-new-cohort cost | R8k sales/procurement + R4k delivery onboarding | Assumes sales allowance covers a won cohort's purchasing work. Monte Carlo separately charges failed scheduled sales attempts. Not measured CAC. |
| Initial setup | R25k | One-time device/legal/setup planning allowance; not an asset inventory or invoice. |

R8k QA includes repeatable content review and a basic rights/asset review allowance, not unlimited specialist authoring. R4k operations is a planning envelope for baseline hosting/monitoring/backup/accounting/admin. R3k security/privacy is a reserve, not a quote for external penetration tests, insurance or compliance certification. Support labour is fully loaded as an assumption; employment taxes/benefits/contractor VAT have not been individually costed. Foreign tax reserve and local input-credit conservatism do not replace an accountant's assessment. Actual personnel status, annual raises and step costs require a new costed plan.

## What must be capped

Proposed average voice is 2,500 premium characters/month; test an included ceiling of 8,000, with clear learner notice and reading/device voice choice. This ceiling is a **commercial design proposal**, not an implemented entitlement. It must cover a person's whole paid month, not reset per lesson. Cache only where authorised and useful, meter by account and globally, and stop duplicate synthesis on replay where possible. Device voices/languages vary and are not an equivalent-experience guarantee.

At 8,000 chars every month, direct premium voice cost including the duplicate/tax assumptions is R6.07; at 80,000 it is R60.72. A R49 consumer plan cannot cover the latter before any other expense. AI output caps and a provider budget alert are not hard monthly billing stops.

Existing private pilot quotas (including generation/upload/help/voice limits) are safety limits, not service capacity for 1,750 seats. Before commercial sale: enforce tested entitlements, bounded imports/file size/page counts/retention, queue limits, concurrency/cost load tests, failure recovery and independent account/tenant isolation. Current default pipeline is not priced for unlimited videos, vision, large archives, premium specialist models or GPU training. Reprice those separately.

## Commercial scale versus small pilot

Institution proposal: R35 × 250 seats × 12 = R105,000 annual licence ex VAT; R6,000 onboarding → R111,000 ex VAT (R127,650 incl standard VAT if applicable). Licence revenue is R8,750/month, not R105,000 earned immediately. Onboarding revenue is recognised once at completion/start in this model; contract acceptance/work spanning periods needs deferred recognition instead. Buyer should receive a bounded module/allowance/support scope and renewal/cancellation terms before paying.
''']
parts+=['\n## Twenty-four-month cases — not actuals\n','| Case | Y1 earned revenue | Y2 earned revenue | Month 24 operating* | Peak cash deficit | Cash +20% buffer |','|---|---:|---:|---:|---:|---:|']
for name,d in r['cases'].items():
 s=d['summary'];parts.append(f'| {name} | {fmt(s["year1_revenue"])} | {fmt(s["year2_revenue"])} | {fmt(s["month24_operating"])} | {fmt(s["funding_need"])} | {fmt(s["funding_with_20pct_buffer"])} |')
parts += [f'''
*Operating is before income tax, debt interest and distributions, with full replacement labour. Base month 24: {b['month24_paid']:.0f} consumer accounts and {b['month24_seats']:.0f} institution seats, {fmt(b['month24_revenue'])} earned revenue. First positive operating month is {b['first_operating_positive']}, with no claim of durable break-even beyond the horizon. Base assumes 100% annual institution renewal and every planned cohort sale succeeds; it is not the most likely outcome. Seven new cohorts (months 6,9,12,15,18,21,24) plus three renewals yield 10 annual licence invoices. Downside assumes later, less frequent contracts and 50% expected renewal. Fractional people/renewal units represent expected values, not actual humans or signed fractions of a contract.

Base outstanding receivables at month 24 are {fmt(b['receivables24'])} ex VAT. Deferred licence revenue is {fmt(b['deferred24'])}: money invoiced for delivery not yet earned. It is an obligation, not a free profit pool. At the modelled variable cost, remaining unearned seat-month delivery alone implies roughly {fmt(b['deferred24']/35*.6*u['inst_active_cost'])} future variable costs, before future shared staff/support changes; preserve delivery resources and contract refund obligations. The model is not a complete balance sheet or statutory tax ledger.

Cash funding need starts at zero cash and tracks the most negative cumulative operating cash flow, then displays an optional 20% cushion. It does **not** mean that amount is secured or sufficient under all events. Cash assumes founder draw R0 months1–3, R15k months4–6, R25k months7–12 and R30k thereafter. Operating always charges R30k replacement labour. This concession lowers cash need; it is not free labour economically. No loan terms, income-tax liability/loss carryforwards, dividends, grant conditions or liquidity beyond month24 are modelled. Obtain those schedules before an investment/funding decision. The upside has taxable-profit potential and cannot be presented as post-tax cash return.

Model cash proxy: consumer receipts after expected refunds and output VAT + institution collections including VAT − institution invoice output-VAT reserve − cash expenses. Consumer collection is assumed immediate; institution VAT is reserved on invoice despite collection delay. Real filing periods, time-of-supply/deposit rules, credit notes and input credits need review; this deliberately simplified channel-specific timing is not a tax opinion.

## Break-even and acquisition discipline

At base unit costs, roughly **{math.ceil(47500/u['consumer_contribution']):,} consumer payers** or **{math.ceil(47500/u['inst_contribution']):,} licensed institution seats** cover R45k shared cost + R2.5k monthly marketing *in isolation*. These omit free users, successful/failed new-cohort sales/onboarding, settlement fees, income tax and additional scale costs. They are contribution break-even lower bounds, not customer targets inferred from market research. Mixed cohorts require the full forecast.

Even the assumed consumer acquisition funnel is weak: first-year R30k marketing divided by all new paid conversions before sponsored migration gives a generous acquisition-cost lower bound of about R265/person. R28.02 monthly contribution implies over nine months just to repay that acquisition cost. The steady-state contribution/churn lifetime-value heuristic is about R400 at 7% monthly churn; it omits discounting, changing behaviour and shared costs, is not validated LTV, and gives no justification to buy paid growth. Some counted converters migrate before self-pay billing, so actual consumer CAC can be worse. Establish cohort-level paid collection and retention before allocating marketing spend.

Institution sales cost R8k/250 contracted seats = R32/seat for a successful cohort in Base, before onboarding and failed opportunities. This is an assumption, not proof that an institutional deal is cheap/easy. Procurement may take months, a budget may disappear and a signed order may never become collected cash. No base revenue from employer commissions, rewards, ads, data sale, live funding feeds or GPU training is included.
''']
parts += ['\n## Counterfactual and edge-case results\n','| Change to Base | Month 24 operating* | Peak cash deficit | Meaning |','|---|---:|---:|---|']
meanings={
'No demand':'Stop rather than spend through the horizon; zero revenue is explicitly possible.',
'No institution contract':'Consumer-only demand assumptions do not cover this team.',
'Six month collection delay':'Same revenue, substantially worse working capital.',
'Free heavy / slow paid conversion':'Free access needs sponsorship or cost limits.',
'Voice cap used every month':'Average use cannot be mistaken for a hard cap.',
'Uncapped voice 80000 chars':'Flat-price unlimited premium narration fails.',
'FX and duplicate billing shock':'ZAR receipts fund USD services; duplicates need containment.',
'No institutional renewals':'New sales alone do not replace retention.',
'Double support / fixed labour':'Human effort dominates the cost assumptions.',
'High churn':'Useful recurring tasks matter more than registrations.',
'Unregistered vendor (eligibility unverified)':'No output VAT charged; supplier fee VAT remains. Eligibility/accounting review required.'}
for n,d in r['stress'].items():parts.append(f'| {n} | {fmt(d["month24_operating"])} | {fmt(d["funding_need"])} | {meanings.get(n,"Small research cohorts do not fund the full commercial team.")} |')
mc=r['monte_carlo']
parts += [f'''
## Five thousand conditional Monte Carlo runs

Seed {mc['seed']}; 24 months each. Parameters are **chosen planning ranges**, not estimated distributions. P10/P50/P90 funding need before buffer: **{fmt(mc['funding_need']['p10'])} / {fmt(mc['funding_need']['p50'])} / {fmt(mc['funding_need']['p90'])}**. Month24 operating P10/P50/P90: **{fmt(mc['month24_operating']['p10'])} / {fmt(mc['month24_operating']['p50'])} / {fmt(mc['month24_operating']['p90'])}**. In {mc['negative_month24_fraction']:.2%} of these chosen-prior runs, month24 operating remains negative. This is a warning about the chosen growth/cost model, **not** an empirical chance KAIRO will fail or succeed. No distribution choice is calibrated from KAIRO sales.

Triangular priors (minimum / maximum / mode): activation .12/.40/.25, paid conversion .02/.14/.08, churn .04/.18/.08, FX R17/R26/R20, monthly voice1000/8000/2500chars, support1/6/2minutes, reach growth .02/.17/.10, renewal .5/1/.9, successful duplicate factor1/2/1.1. Collection lag is chosen from [1,1,2,3,6] months. One common weak-market draw occurs in 30% of runs, reducing conversion by40% and raising churn30%; scheduled cohort win assumptions are40% in that draw and80% otherwise. Sales/procurement cost is paid for scheduled attempts even if they lose; onboarding cost/revenue occurs only for a win. These priors/correlations deliberately make risk visible and are not derived from bank models or a survey. Extreme coupled vendor outage/abuse/legal losses can still be worse.

The workbook has one live selected-case forecast plus a native two-input price/voice sensitivity. The Monte Carlo and deterministic stress table above are a separate dated Python run; editing Excel does **not** update these snapshots. Re-run the scripts and rebuild the report/workbook after changing the model. All 5,000 sampled parameter/result records are retained in monte-carlo-draws.csv.

## A smaller, capped validation budget

One possible four-week, 40-person research pilot budget, all quotes/hours unverified: founder16h × R187.50 = R3,000; domain review10h × R120 = R1,200; privacy/security preparation8h × R250 = R2,000; learner support40 ×10minutes × R120/hour = R800; cloud maximum R500; recruitment/travel R1,000; optional research compensation40 ×R50 = R2,000. Total **R10,500**, plus20% reserve **R12,600**. This is an incremental study budget on the existing prototype, not four weeks of full team salaries or production security certification. Participant compensation must be voluntary, ethically approved where needed and independent of positive feedback; it is not an FNB reward.

Do not commit this spend or recruit people without budget/consent/institution approval. A sponsored research study is not recurring revenue. A later paid pilot requires its own contracted deliverables and costed quote; do not force a 250-seat annual purchase on a small validation group.

## What would make the business more sound?

First collect evidence: a useful repeat task, acceptable device/data burden, measured quality/support/cloud cost and a real budget owner. Then prefer reviewed module reuse, cost-capped voice, reading choices and funded cohorts. Test prices with a real scoped offer; a higher spreadsheet margin at R79 is not willingness to pay. Do not sell institutional features before tenancy, roster/consent, security, metering and support work is costed and accepted. Reduce fixed commitments while testing; require collected funding before increasing capacity. Re-run actuals-versus-plan monthly and preserve a cash reserve for annual delivery/refunds. If the buyer/value/cost gates fail, narrow or stop; adding more features is not the financial remedy.

## Verification and limitations

Sixteen independent behaviour/reconciliation tests cover calendar seasonality, zero demand, seat expiration/renewal, sponsorship billing, immediate/delayed collection, VAT/payment arithmetic, supplier fee VAT when unregistered, failed sales expense, free cost and voice stress. Python scenario cash/revenue/receivables/deferred balances reconcile. Excel's three selected cases match Python on ten headline outputs each, with zero row reconciliation residuals within tolerance; sensitivity's base cell matches the unit model. Native Excel interaction has not been observed. Spreadsheet tool completed export/renders/checks but its process returned code1 after completion; the file is independently inspected for cached results/formula errors and ZIP integrity. Treat that runtime warning separately from the recorded formula checks.

Luna workers independently checked market/cost evidence and the model; a separate Luna chat reviewed finance. Root corrected their detected calendar issue and the rate-table/arithmetic errors, added cloud-tax reserve and failed-sales-attempt costs, and regenerated current results. Older reviewer numbers may therefore differ; model-results.json and this report are the final calculation authority. No mathematical test validates demand, tax treatment, product quality, legal compliance or a guarantee of soundness.
''']
(OUT/'ECONOMICS.md').write_text('\n'.join(parts),encoding='utf-8')
canvas=(OUT/'LEAN-CANVAS.md').read_text(encoding='utf-8')
folder=OUT/'paste-ready';folder.mkdir(exist_ok=True)
for n,title,body in re.findall(r'## (\d+)\. ([^\n]+)\n\n(.*?)(?=\n## |\n---|\Z)',canvas,re.S):
    slug=re.sub('[^a-z0-9]+','-',title.lower()).strip('-')
    (folder/f'{int(n):02d}-{slug}.txt').write_text(body.strip()+'\n',encoding='utf-8')
assert len(list(folder.glob('*.txt')))==9
assert 'R13.31' in canvas and abs(u['consumer_cost']-13.31)<.005
assert abs(u['consumer_contribution']-28.02)<.005
print('Report generated; 9 plain-text portal fields; displayed unit numbers reconcile.')
