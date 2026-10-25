# KAIRO Product Discovery, Experience, Commercial and Judging Team

**Owner mandate:** The engineering team builds KAIRO; this additional team challenges whether it solves a real learner problem, is meaningfully better than substitutes, is legible to judges and buyers, and can be operated sustainably. Technical sophistication is an input, not a successful outcome. One Chief Engineering Coordinator remains accountable for prioritisation, compatibility, exact-commit verification and **conditional merges** under owner authority in PR #34; no separate competing central coordinators.

## Organisation and real task allocation

| Role | Immediate owned issue | Output and independent critique | Handoff to |
|---|---|---|---|
| **Research & Problem Lead** | [#35](https://github.com/LethaboMH14/KAIRO/issues/35) | Primary-source SA cohort problem report, dated numerators/denominators, three testable causes, 15/45/180s plain language; no invented prevalence | UX, evidence lead, coordinator |
| **Learning Scientist / Subject Reviewer** | Coordinate [#35](https://github.com/LethaboMH14/KAIRO/issues/35) and [#39](https://github.com/LethaboMH14/KAIRO/issues/39) via distinct new files | Motor/IS task correctness and calibrated feedback/rubric, unassisted/assisted outcome distinction, alternative explanation, delayed task study design; do not infer learning efficacy | Engineering/QA; create narrowly scoped subissue if no ownership |
| **Competitive UX & Product Benchmark Lead** | [#37](https://github.com/LethaboMH14/KAIRO/issues/37) | Same-task comparison against Gemini Notebook, PhET, Khanmigo, Quizlet, institution notes/tutors; realistic first-use/low-data barriers, exact competitor regions/pricing dates and actual test evidence where allowed | Engineering UI + product critic |
| **Judge & Demo Proof Lead** | [#36](https://github.com/LethaboMH14/KAIRO/issues/36) | Seven criteria proof room, real permitted judge cold-start test, authentic version-linked visual demo, 20s pitch and fallback; match actual 2026 portal requirements | Coordinator + release |
| **Buyer / Market & Partnerships Lead** | [#38](https://github.com/LethaboMH14/KAIRO/issues/38) | Learner/champion/budget buyer segmentation, neutral interview protocol, procurement/security obstacles, price/offer tests; do not imply FNB/university contact or approval | Financial modeling, GTM |
| **Finance / Provider Economics Lead** | Distinct modeling files under [#38](https://github.com/LethaboMH14/KAIRO/issues/38) | Cost per completed learning task, real rates/region/model SKU vs provisional assumptions, support, voice, OCR/egress/retries, three offer scenarios and price-unit-contribution sensitivity. Validate supplied `business-model/` code and actual billing when explicitly authorised | Buyer, engineer/cloud, coordinator |
| **Truth Graph / Evidence Auditor** | [#43](https://github.com/LethaboMH14/KAIRO/issues/43) | Claim IDs linked to primary sources, exact code/test/device outcomes, risks, judging & pitch assertions; fail-closed validator, explicit negative evidence, no private PII | Judge lead, release |
| **Product Critic / Experiment & Queue Lead** | [#39](https://github.com/LethaboMH14/KAIRO/issues/39) and separate [#44](https://github.com/LethaboMH14/KAIRO/issues/44) only after nonoverlapping path allocation | Break product assumptions, first-user task, cost/adoption and privacy edges; triage observed failures to small reproducible engineering/research issues and handoff; no direct runner invocation | Coordinator/issue owner |

**Supporting reviewers, no new overlapping owners:** QA/security #5/#10, avatar/studios #9, RAG #3/#4/#16/#31, cloud #8, release #11, skills #14, simulated agent runner #13. Use existing experts instead of creating duplicates.

## Decision rights and role boundaries

- **Product owner:** selects ambition, target segments and priorities; provides permission for external contacts, sensitive user studies, paid services and production/public IAM.
- **Chief Engineering Coordinator:** one global delivery owner. Sees all engineering + product proof issues, reconciles remote/local claims, evaluates claims and acceptance, delegates next ready work, can merge applicable verified PRs under PR #34 policy, **cannot grant itself production/cloud billing permission**.
- **Product research lead:** recommends changes to market claims and copy, but cannot attest unperformed fieldwork.
- **Independent review pair:** one engineering reviewer + one user/domain/product critic for material user-experience changes, with recorded real execution and counterarguments. Shared GitHub login is NOT independent identity evidence.
- **Release/judge lead:** rejects unsupported demonstration, no bypass of prior browser/recording denial, no fake external app screenshots.
- **Finance:** cannot convert assumed plans into ARR, invoices, investment valuations or measured margins; must keep unit of billing, time period, refunds and tax consistent.

## Bounded concurrent waves, not '13 chats are now autonomous'

First wave while judging deadline is near: problem proof #35, judge demo #36, competitor desk-baseline #37, cost model #38, and PR review of active engineering features. Allow max ~3 code modification workers plus ~2 independent research threads + 1 reviewer as initial organisational target, not an asserted runtime limit; adjust only after real runner capacity/quotas are known.

Only authorise one exact file/subtree claim per worker in GitHub comment after checking conflicts and existing local bus when available. An issue created is a queued task, not proof a worker has started. New ordinary ChatGPT tabs will not automatically wake when GitHub gets comments. For true unattended dispatch, implement/test #13 with explicit token, quotas, triggers and cost caps.

## Research operating standard

**Every contribution must answer:** (a) who exactly experiences the problem, (b) what they do now, (c) what evidence supports cause/severity/constraints, (d) what alternate explanation could be true, (e) how KAIRO improves the user's task, (f) how we will see real rather than synthetic improvement, (g) what it costs/risks, (h) which of seven criteria moves, (i) what could disprove this, (j) which worker gets the next bounded issue.

Use original source URL, issuer, release and covered year, quote/page/table/denominator, checked date, bias/limitations, and deliberate counter-evidence. Keep raw participant/video/account information out of public GitHub; publish only consent-cleared/redacted evidence or synthetic fixtures. National student counts are not immediate paying customers. Survey internet access is not a data affordability or per-learner device guarantee. Trial learners and buyer LOIs are never invented.

## Outcomes and weekly-style retrospective (only while sessions execute)

- For each accepted PR, research and QA review must update claim state and create **at least one candidate** follow-on experiment/issue, or record with evidence that no follow-up is justified. Do not generate issues solely to satisfy a count.
- Coordinator selects the next *ready* task by learner severity, required deadline, genuine evidence gain, cost-of-delay, integration dependencies and known available scopes. Reject duplicative or unbounded research tasks.
- A critic reviews a leading claim for the exact reason it may be false; a domain expert rejects misleading educational statements; the buyer specialist can reject unaffordable packaging.
- At a real completed test/pilot, record n, task definitions, failure counts, denominator, constraints and negative feedback. Publish a direct recommendation KEEP / IMPROVE / NARROW / STOP with the smallest next action.
- Judge/demo and commercial tracks have different acceptance gates. A narrow tested code improvement can merge under PR #34 even if a paying institution interview is not yet complete; it cannot be sold as proven demand.

## Primary starting references

- `docs/product-proof-20261025/{BUSINESS-CANVAS-V2.md,PROBLEM-TO-PROOF-OPERATING-SYSTEM.md,STAKEHOLDER-STORIES-AND-OBJECTIONS.md,TRUTH-GRAPH-AND-CHALLENGE-LAB.md}`
- `docs/product-proof-20261025/business-model/` for scenario assumptions/tests.
- `docs/judging-cloud-20261023/JUDGING-MATRIX.md` for the seven existing criteria.
- `docs/business-canvas-20261024/`, `docs/canvas-market-20261024/`, `docs/canvas-cost-research-20261024/` for substantial earlier research (don't rewrite without reconciliation).
- Official challenge https://appoftheyear.co.za/hackathon/ and organiser FAQ https://appoftheyear.co.za/faqs/. The programme-specific 2026 submission time must be confirmed with the actual portal.
- Stats SA GHS 2025 https://www.statssa.gov.za/?PPN=P0318&page_id=1854 (85.6% households any access in 2025).
- Google official July 2026 Gemini Notebook notice https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/ (formerly NotebookLM), PhET https://phet.colorado.edu/en/about, Google current Standard Gemini pricing https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing.

All public numbers and official product terms require freshness checks before a pitch or public sale.
