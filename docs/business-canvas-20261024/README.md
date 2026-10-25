# KAIRO business canvas and economic decision pack

Prepared 24 October 2026 for the nine fields in the user's Sonke screenshot. **Ready to paste; not submitted.**

**Full-product correction:** the canvas now includes personalised/adaptive learning, multimodal material, skill and role alignment, employer/company training, fresh jobs/funding/NSFAS/bursaries and multilingual/SASL access. Read [the full journey/status audit](FULL-JOURNEY-AND-DELIVERY.md) and [broader pricing/cloud/development costs](FULL-PLATFORM-COSTS.md). The earlier workbook and ECONOMICS.md remain the narrower Core learning scenario, **not the financial model for the full platform**. [Three business skills installed and reviewed](SKILLS-AND-SOURCES.md); no app feature deployment is implied by skill installation.

1. [Nine complete canvas fields](LEAN-CANVAS.md) — two-paragraph problem statement, solution, value proposition, unfair advantage, segments, metrics, channels, costs and revenue.
2. [Plain text per portal box](paste-ready/) — nine separate .txt files without Markdown; field numbers match the screenshot.
3. [Editable financial workbook](../../outputs/01a1663f-fa9a-7fa2-b28a-70ffbb1a7c00/KAIRO-business-model.xlsx) — selected-case assumptions, 24 monthly periods, contribution build, revenue/cash/deferred roll-forward, chart and native price/voice sensitivity.
4. [Economics, simulation, risks and pilot budget](ECONOMICS.md) — published rates vs assumptions, 3 commercial cases, 14 counterfactuals, 5,000 conditional runs, acquisition/retention and stop rules.
5. [Research and product/buyer decisions](RESEARCH-AND-DECISIONS.md) — official South African data, alternatives, learning psychology, public FNB/FirstRand methods, growth logic and judging evidence map.
6. [Machine-readable model results](model-results.json), [all Monte Carlo draws](monte-carlo-draws.csv), [Base](base-forecast.csv) / [Downside](downside-forecast.csv) / [Upside](upside-forecast.csv) monthly outputs.
7. [Formula checks](workbook-checks.json) and [export verification](export-verification.json). Neither means market/tax/product validation or native Excel acceptance.

## Decision

Present the full learning-to-opportunity product while validating the first connected engineering journey. The smaller study and Core prices remain useful tests. New full-service hypotheses include Institution Connected R59/seat/month ex VAT, Workforce R149/employee/month ex VAT, and separately quoted company training. The broader cost envelope is separate and not validated. The earlier R470k Core cash scenario must not be used as the funding request for the whole vision. Read each model's delivery scope before comparing results.

## Review and limitations

Two requested Luna workers supplied market/cost research and independent review. A separate existing Luna chat supplied a finance red team. The other existing chat declined the relayed task, so no buyer-chat delivery is claimed; root and the market worker covered the buyer review. Requested model settings are not proof of actual runtime settings; each session's own bus registration is authoritative.

Root corrected a rate-table mode error, token arithmetic and one-month seasonality shift. Latest root model and report supersede numbers in older review drafts. Added a conservative cloud-tax reserve, explicit unregistered-vendor counterfactual, and sales costs on failed Monte Carlo opportunities. Current export checks match the regenerated Python cases. The artifact process returns code1 after completing export/render/checks; the warning is retained, with separate ZIP/cache/formula verification. Native Excel has not been opened/observed.

Scope limits: no portal submission, cloud/account/payment changes, buyer outreach, deployed entitlements, recruitment, browser observation or new schedule. No guaranteed returns, market adoption, efficacy, compliance, partnership, job placement or official judging outcome. [Current handoff](../../coordination/handoffs/2026-10-24-business-canvas.md).

## Reproduction

Run `python tools/business_model/model.py`, `python tools/business_model/report.py` and `python -m unittest discover -s tools/business_model -p test_model.py` from the workspace. Workbook authoring uses `tools/business_model/build.mjs` with the bundled Node runtime and bundled artifact-tool dependency junction; then run `python tools/business_model/verify_workbook.py`. The root owns these files. No app dependencies were added. Workbook changes do not automatically update the separately dated Python simulation/report.
