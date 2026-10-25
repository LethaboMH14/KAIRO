# Practice-to-preparation matrix for two RMB roles

**Checked:** 22 October 2026. This is preparation research, not an eligibility assessment or application feed.

The official indexed advert records are [IT Business Analyst R54418](https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/IT-Business-Analyst_R54418-1) and [Trade Support Specialist R54282](https://firstrand.wd3.myworkdayjobs.com/FRB/job/Johannesburg/Trade-Support-Specialist_R54282-1). Direct Workday page opens returned no readable text. The indexed employer Important Closing Date Note says applications will not be accepted on 23 October 2026 or onwards; the timezone and cutoff hour are not stated. Their live availability is therefore **unknown**, and neither is described here as confirmed open.

The detailed [JSON matrix](../../data/public/opportunities/rmb-preparation-matrix.json) has employer criteria, case IDs/steps, coverage limits, proposed missing project tasks and source-to-claim mappings.

## IT Business Analyst: R54418

The advert requires **at least eight years** of Business Analysis or Business/Systems Analysis experience, demonstrable Market Risk or related risk-domain experience, complex methodology/policy-to-technology requirements work, change delivery through testing/implementation validation, stakeholder delivery across business/risk/data/technology, and a related Bachelor’s/BTech. It separately labels Agile, named frameworks/certification and coaching as preferred/advantageous.

KAIRO’s [`fictional-requirements-uat` pack](practice-packs.md) offers partial, general practice in `scope-request`, `revised-requirement` and `uat-plan`: clarifying a fictional request, revising it after a stakeholder need changes, and preparing synthetic tests while holding a policy uncertainty for an owner. It is a Northstar Study Circle fiction scenario whose context link references a Discovery Business Analyst page. It does not model RMB or Market Risk, and the scenario does not demonstrate professional BA experience or any degree.

Suggested work to address uncovered areas—**proposals only, not completed work or employer requirements**:

- Write a synthetic change brief with three invented stakeholder roles, 10 testable requirements, process/data-flow diagrams, field lineage, decision owners and traceability from requirement to acceptance test.
- Create 30 synthetic position/risk-report rows, seed six labeled defects, and write eight SQL quality/reconciliation checks with expected outputs. Do not implement or claim a production VaR/FRTB control.
- Read the official [BIS market-risk standard](https://www.bis.org/publications/201901-standards-minimum-capital-requirements-market-risk) (the BIS page labels it consolidated and integrated into the Basel Framework, effective 1 January 2022) and [BCBS 239 principles](https://www.bis.org/publ/bcbs239.pdf), then write a sourced glossary and list questions that require a qualified risk owner. BIS’s [2026 BCBS 239 implementation newsletter](https://www.bis.org/publications/implementation-principles-effective-risk-data-aggregation-and-risk-reporting-bcbs-239-principles) adds recent data-governance and lineage context and explicitly says it is informational, not new supervisory guidance.

Even if completed, these artifacts would be portfolio work. They do not prove eight years of experience, professional Market Risk delivery, regulatory implementation or an equivalent qualification.

## Trade Support Specialist: R54282

The advert requires a related Bachelor’s degree, **3–5 years** in technology or production support, experience supporting business-critical enterprise applications/integrations, incident/problem/change/release management, and work with vendors and cross-functional technical teams. Trading-systems exposure is described as ideal. It lists FIX, SQL, Linux/Unix, networking, scripting/automation, monitoring, access controls and resilience under technical/functional skills without explicitly labeling each one mandatory or preferred.

KAIRO’s [`fictional-digital-support` pack](practice-packs.md) offers partial practice in general support behaviors: `account-access` refuses secrets and unsafe verification bypasses; `upload-accessibility` uses a synthetic reproduction or escalates; `close-or-escalate` preserves uncertainty and requires confirmation before calling a case resolved. It is fictional user-support practice, not trading-system troubleshooting, production incident ownership, service restoration, root-cause analysis or enterprise change work. Its source context is a Discovery Digital Support page, not RMB.

Suggested work to address uncovered areas—**proposals only, not completed work or employer requirements**:

- Build a local-only emulator with four invented components and 50 synthetic order/status/market-data events. Seed five known fault types such as stale feed, missing field, duplicate event, delayed response and unavailable downstream service. Do not connect to an exchange, real account or live market feed.
- Write a triage runbook that separates symptom from cause; lists safe checks, severity/impact, escalation owner, communication updates, evidence preservation and rollback/restore decisions. Use 10 simulated incident records and label root-cause ideas as hypotheses.
- Add deterministic schema/timing checks for the seeded faults, test two recoveries, and document a simulated change, UAT checklist, alert rationale and rollback test. A local toy lab is not a FIX certification or production-support experience.

The official [FIX Trading Community protocol reference](https://fixtrading.org/standards/fix-protocol/) explains message structure and workflows; it is reference reading, not a production implementation. [Microsoft Learn’s T-SQL path](https://learn.microsoft.com/en-us/training/paths/get-started-querying-with-transact-sql/) and the [official Python tutorial](https://docs.python.org/3/tutorial/) are public preparation materials for listed SQL/scripting tasks, not proof of proficiency.

Even if completed, these artifacts do not equal the advert’s three-to-five years of technology/production support or financial-markets exposure.

## Evidence boundaries

The current KAIRO cases are structured fictional practice. Their reducer/export labels choices as unverified and not independently assessed; selected choices are not verified skills, grades, credentials or job outcomes. Any future project should be recorded only after it is actually completed and reviewed. This matrix gives no learner fit score, degree-equivalence inference, eligibility conclusion or job-readiness rating. It keeps employer criteria separate from existing practice and from suggested project work.
