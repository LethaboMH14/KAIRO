# Youth employment and higher education: evidence and hackathon opportunities

Research cutoff: 5 October 2026. Rankings below are reasoned judgments, not estimated chances of winning. Statistics describe different populations and cannot be added together.

## What the evidence supports

| Finding | Population, period and caveat | Primary source |
|---|---|---|
| Official unemployment was 33.6%; approximately 8.5 million unemployed versus 16.7 million employed. Youth unemployment (15–34) was 47.4%. | Q2 2026; unemployment rate uses the labour force denominator, not every young person. | [NYDA statement, 12 August 2026](https://www.gov.za/news/media-statements/nyda-notes-serious-concern-latest-quarterly-labour-force-survey-qlfs-q2-12) and [Stats SA QLFS Q2 2026](https://www.statssa.gov.za/publications/P0211/P02112ndQuarter2026.pdf) |
| 36.4% of about 10.4m people aged 15–24 were outside employment, education and training. For ages 15–34, the count was 9.518m and rate 45.4%. | Q2 2026. NEET is a different concept from unemployment; some NEET people are not seeking employment. | [QLFS, printed pp. 8, 83–84](https://www.statssa.gov.za/publications/P0211/P02112ndQuarter2026.pdf) |
| Among 15–34-year-olds, NEET prevalence was 54.0% in North West, 52.7% in Northern Cape and 51.1% in Eastern Cape; the largest counts were Gauteng 2.216m and KwaZulu-Natal 2.108m. | Q2 2026. Prevalence and total affected population suggest different pilot choices. Provincial prevalence does not identify a particular neighbourhood's bottleneck. | [QLFS tables 7c–7d](https://www.statssa.gov.za/publications/P0211/P02112ndQuarter2026.pdf) |
| About 1.5m people aged 5–24 reported not attending education because of fees; 73% of this group had completed matric. Around 30% of non-attendees cited fees. | 2024 data, reported 24 February 2026. Self-reported tuition affordability; excludes transport, accommodation and lost earnings. The denominator is not all matriculants. | [Stats SA education expenditure analysis](https://www.statssa.gov.za/?p=19198) |
| NSFAS recorded 218,043 incomplete first-time applications awaiting documents, out of 893,847 applications: approximately 24.4% (our calculation). | Snapshot on 2 January 2026, **not today's unresolved backlog**. Financial eligibility and institutional acceptance are separate. Missing parental consent and parent/guardian information were prominent. | [NSFAS official statement](https://www.gov.za/news/media-statements/nsfas-concludes-all-funding-decisions-2026-and-mop-payments-2025-02-jan-2026) |
| By 5 February, over 180,000 submitted outstanding documents had contributed to 50,000 additional approvals. 21,483 applications still lacked documents; 85,662 were in verification after documents had been submitted. | Later administrative snapshot. These are different workflow states, not numbers to sum with January's figure. Common form problems: missing signatures/dates/mandatory fields and the wrong person signing. | [SAnews reporting NSFAS CEO, 5 February 2026](https://www.sanews.gov.za/node/79439) |
| 109,761 of 546,685 assessed continuing university students did not meet progression criteria; 4,945 had outstanding results. At TVETs, 79,461 of 210,989 did not meet criteria and 4,025 remained under review. | NSFAS February 2026 administrative data. These are funding progression assessments, **not national dropout rates**. Appeals and later results can change outcomes. | [Same NSFAS briefing](https://www.sanews.gov.za/node/79439) |
| DHET projected about 235,000 first-year university spaces and 170,000 first-time TVET spaces for 2026. | September 2025 readiness statement; planned places, not final enrolment or current vacancies. An app cannot create university seats or scholarship budgets. | [Minister's official statement](https://www.gov.za/news/media-statements/minister-buti-manamela-state-readiness-2026-academic-year-15-sep-2025) |

Strong distinction: unemployment is the largest broad burden; incomplete evidence and application workflows offer a much tighter, measurable software intervention. The national unemployment figure does not prove that another matching algorithm creates jobs.

## Evidence about mechanisms, beyond large numbers

**Credible skills evidence has causal support.** A Johannesburg randomized evaluation involving 6,891 work-seekers (2015–18) found that publicly shareable skill certification increased employment by 5.2 percentage points at 3–4 months and weekly earnings by 34% relative to the comparison group. This supports testing trustworthy information as a bottleneck. It does not establish that AI-generated certificates, video portfolios or our proposed app reproduce the effect, nor net job creation at national scale. [Original AER paper, 2022](https://www.aeaweb.org/articles?id=10.1257/aer.20200961); [research-team institutional summary](https://mbrg.bsg.ox.ac.uk/mind-and-behaviour-projects/impact-providing-information-about-job-seekers-skills-employment-south).

**Search cost is real, but search activity is not employment.** A Soweto randomized evaluation of 1,082 work-seekers found transportation support increased search activity without increasing employment overall. This is a useful rebuttal to assuming more applications or free taxi rides solve unemployment. [J-PAL evaluation](https://www.povertyactionlab.org/evaluation/transport-subsidies-and-job-matchmaking-south-africa).

Harambee reported in 2024 that 41% of respondents in its network cited data shortages as a reason for not applying. It also summarized a study whose participants faced potential monthly search expenses of R1,467, including R700 transport. These are network/study findings, not nationally representative current averages. Use them to motivate user interviews, not claim every unemployed person spends this amount. [Harambee analysis](https://www.harambee.co.za/young-people-want-to-work-not-wait/).

## Existing products constrain novelty claims

- **SA Youth/Harambee:** job discovery, applications, support and zero-rated access already exist. Zero-rated means network charging arrangements; it does not mean working with no signal. Off-platform applications can still require data. [Official SA Youth explanation](https://sayouth.mobi/View/ViewContent?cmsId=4e73dmbrjvtshr35zsscwapjxq).
- **JOBJACK:** local store-level jobs, mobile profiles/CVs, readiness courses and data-light access; JobFIT combines behavioural assessments and operational/local hiring signals. A generic AI CV, assessment and nearby-job matcher is weak differentiation. [Employer product](https://www.jobjack.co.za/); [job-seeker product](https://www.jobjack.co.za/job-seekers).
- **FundiConnect and SA Bursaries:** career guidance, institution information and bursary discovery are established. A scholarship search chatbot needs a more concrete advantage. [FundiConnect](https://fundiconnect.fundi.co.za/about/); [SA Bursaries](https://www.zabursaries.co.za/).
- **Government CAS:** CACH was discontinued from the 2026 academic year as the Central Application Service became the broader route. Avoid pitching a replacement for an obsolete service as new. [Official government news, January 2026](https://www.sanews.gov.za/node/79086).

These are desk-research comparisons, not an exhaustive patent/product novelty search.

## Four ambitious ideas, ranked within these two tracks

### 1. OpenDoor: a camera that turns a funding obstacle into a completed next step

**Problem statement:** A learner can qualify academically and financially yet remain stuck because family evidence, consent forms, deadlines and admissions depend on one another, across languages and devices. Help them produce a correct, reviewable application packet and an affordable study route before the opportunity closes.

**Distinctive mechanism:** A versioned rules graph links each institutional requirement to its source, required evidence, responsible person and deadline. Local OCR checks legibility and missing fields; a guided camera overlays the exact incomplete box. The learner hears a short explanation in isiZulu or English, fixes the issue, and sees the downstream route unlock. A case packet records what was checked, what remains uncertain and what still requires official verification. The product's promise is fewer preventable submission errors, not approval.

**Wow demo:** In airplane mode, scan a synthetic NSFAS consent form with one signature and no date. The app highlights those precise fields, explains the parent/guardian requirement aloud, and produces a corrected-document checklist. Scan corrected evidence and watch the application dependency graph change from blocked to ready for review. Reconnect, export the packet and show a handoff to the official channel. Use synthetic data and label the official submission step; no imaginary NSFAS API integration.

**Beyond a checklist:** The same engine evaluates total study feasibility: subject requirements, published fees, housing/transport costs and funding status. Ask “What changes if I commute from home?” and it recalculates an explainable pathway. A deterministic solver handles rules; AI extracts draft rules for human approval and translates explanations. It must distinguish eligibility from funding probability and from admission.

**MVP:** One current form family, two institutions, five real published funding opportunities, two tested languages, offline document inspection and packet export. For hackathon reliability, human-reviewed audio in both languages can be cached; do not claim general offline STT without demonstrating it on the target phone.

**Falsifiable bottleneck:** Do 15 target users actually fail or hesitate on these fields, and does the intervention reduce errors in a blinded form-completion task? Measure correct first submissions and time to complete, not chatbot messages. Kill or narrow if users need funding itself rather than help completing requirements.

**Why ranked first:** Strong current evidence of a specific preventable failure; personal stakes; demonstrable CV, speech and offline behaviour; no employer marketplace needed on day one. Risk: branded as another bursary finder unless the live demo visibly resolves a real document dependency. Expansion beyond student finance is possible after proving this wedge.

### 2. ProofShift: show the work you can do before someone demands experience

**Problem statement:** Young people may have practical skills from family businesses and informal work, while an employer sees an empty CV and cannot inspect those capabilities cheaply.

**Distinctive mechanism:** Employers publish short, job-relevant simulated challenges with transparent rubrics. Applicants complete them offline using real objects or captured artifacts and explain choices in a supported language. CV/OCR helps annotate evidence; a human reviewer signs the assessment. A portable evidence card contains task, date, rubric, artifact references and exact verification level. Cryptographic signing establishes who attested to it, not that the underlying claim is true. No blockchain required.

**Wow demo:** A candidate receives a randomized mini stocktake: count six products, reconcile a till-like ledger and catch one mismatch. The phone captures and annotates the work. An employer opens the same evidence card via QR and can see how the result was reached. Change a source artifact and signature verification fails. Show how a learner can retake only the missing skill.

**MVP:** One retail inventory task designed with a real employer; one reviewer; two languages; offline capture and later sync. Human review is required for claimed competency. Never infer honesty, personality or employability from a face, accent or body movement.

**Falsifiable bottleneck:** Would three employers shortlist a candidate because of the artifact? Compare blinded employer decisions on CV only versus CV plus evidence. If employers refuse to trust or pay for this evidence, it is just another profile.

**Why second:** Memorable physical demo and credible research supports the information mechanism. Larger competitor overlap and assessment validation burden than OpenDoor. Make the evidence worker-owned and usable outside one recruitment platform. Trials involving actual productive work need an employer-funded structure, not unpaid free labour disguised as assessment.

### 3. Route2Degree: find the path a family can actually finish

**Problem statement:** A list of institutions and bursaries leaves families to reconcile incompatible entry criteria, funding timing, commuting costs and what happens if funding is delayed.

**Distinctive mechanism:** Scan a results statement; locally calculate institution-specific requirements; build a verified graph of university, TVET, learnership and bridging routes. Show three viable pathways with evidence-linked assumptions, full costs and contingency plans. Counterfactual controls make tradeoffs visible: changing home location, funding status or one subject result recomputes the path. Include care obligations and travel feasibility without using them to quietly exclude the user.

**Wow demo:** A seemingly affordable distant acceptance becomes unworkable after transport and deposit timing are included. The user changes one constraint; an attainable alternative and its exact application steps appear. A visible funding delay simulation identifies the first month of shortfall. All demo amounts beyond published fees must be labeled assumptions.

**MVP:** One region, three institutions, two common qualification routes, official data snapshots, local calculation, source dates, document checklist. No nationwide stale scraper.

**Falsifiable bottleneck:** Can families and an admissions adviser validate the recommendations and find a feasible route they previously missed? Report detected incompatibilities and completed applications; long-term completion improvement requires follow-up.

**Why third:** High relatability and credible constraints. Competition from guidance platforms and ongoing data maintenance. Could be OpenDoor's second phase rather than a second product.

### 4. FirstShift: make an actual interview and first month financially reachable

**Problem statement:** An interview invitation is not an accessible opportunity if repeated travel and the first month's commute exceed the applicant's available cash.

**Distinctive mechanism:** Employer commitments drive the app: consolidate assessment into one visit, issue a confirmed invitation, attach an employer-sponsored transport option, and show route/time/cost and take-home earnings after unavoidable costs. A lightweight scheduler groups interviews around actual transport windows and caring commitments. A payer dashboard shows completed attendance and unused support, with minimal personal data.

**Wow demo:** A recruiter adds a late shift; the candidate's otherwise “nearby” opportunity becomes unreachable because last transport is earlier. The system proposes a feasible shift or employer transport commitment and recalculates the candidate's remaining income. This reveals why kilometres alone are an inadequate job match.

**MVP:** One employer, two real route corridors, explicitly sourced/manual fares and timetables, invitation confirmation and simulated voucher redemption. No claimed live taxi network or guaranteed route safety.

**Falsifiable bottleneck:** Can committed employers reduce interview no-shows and first-month quits? Track sponsored journeys, successful attendance and retention. Do not use application count as success. Kill if employers will not change interview design or support travel.

**Why fourth:** Concrete inclusion benefit, but partners and reliable route data are the hard part. Transport-subsidy research cautions that improved search access alone does not create jobs. Best as a module attached to real hiring demand.

## Recommendation to the lead researcher

Of these two tracks, **OpenDoor is the strongest hackathon wedge**. It couples a precise, documented administrative failure with a dramatic camera-and-voice offline demo. **ProofShift** is the strongest employment concept if a real employer will help define and review one task before the event. Combine education and employment only through one coherent transition journey; a six-feature “youth super app” weakens evidence, testing and the pitch.

Suggested narrow pitch: **“You should not lose a year of education because one form is wrong. OpenDoor catches the blocker, explains it in your language, and helps you complete the next step—even without a connection.”** This is a product proposal, not an evidence-backed claim that every incomplete application is an error or that all errors can be prevented.
