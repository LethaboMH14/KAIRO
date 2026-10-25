# KAIRO Access: South African market and learning evidence

**Prepared:** 24 October 2026 · **Status:** evidence and testable proposition, not market validation.  
**Criteria served:** Product (need and alternatives), Impact (access and learning hypotheses), Sustainability (buyer/channel/economics), Usability (low-bandwidth and learner control).

## Decision proposition

Start with **adult undergraduate learners in engineering and information systems / computing**, initially at public universities, using their own or openly licensed material to make one difficult concept teachable: review extracted source text, correct it, inspect an editable cited lesson, explore an appropriate model or reading alternative, attempt practice, save working and resume. The initial test is a **single module/cohort pilot**, not a national consumer launch. Engineering is the best first wedge because the existing motor/pump activities make a concrete variable → consequence → explanation loop demonstrable. Information Systems is a nearby second cohort, not evidence that all disciplines are served.

The urgent user job is not “get another AI summary.” It is: *I have a specific course source and a concept I cannot connect; help me check what the source says, make the relationship understandable, practise it, and return to my working.* This need is plausible from the product challenge and learning literature but **frequency, willingness to return, efficacy and willingness to pay are unmeasured**. Avoid claiming KAIRO prevents dropout or improves grades.

## Users, buyers and beachhead

| Role | Initial hypothesis | Need / adoption hurdle |
|---|---|---|
| Primary user | Adult engineering or computing/Information Systems undergraduate learner, especially someone facing a difficult prerequisite or technical concept | Wants a clear explanation grounded in assigned material, a chance to try, and saved working; needs a phone-tolerant, interruptible reading path. Interview learners before asserting prevalence. |
| Secondary user | Tutor, lecturer, learning-support or student-success staff member | Wants a reusable, reviewable activity and visibility into where learners struggle; must not be asked to trust unvalidated AI output or expose private student material. |
| Economic buyer (first plausible) | Faculty teaching/learning innovation unit, tutoring programme, academic development/student success function, or a funder underwriting a bounded pilot | Buys a scoped supported cohort/service with instructor review, data controls and measurable task outcomes. Budget, procurement, privacy review, content rights and LMS integration are unknown. |
| Later payer | Institution-wide license / supported module package; possibly a learner subscription only after affordability and repeat use evidence | No price, payer conversion, institutional contract, checkout or tenancy is validated. Do not put speculative subscriptions in the base case. |

**Why adult learners first:** the existing product is oriented to tertiary module selection and source-based study; it avoids school/minor safeguarding and curriculum claims. Engineering and computing have bounded concepts with inspectable calculations/traces. The same source-to-practice loop should be tested against Business and Management only after reviewing sources and activities there. A first test should recruit through a course tutor, academic support office, student society or an opt-in course announcement; these are proposed channels, not secured partners.

### Sourced scale context, not TAM

DHET’s 2024 PSET report (2024 HEMIS data extracted October 2025) reports UNISA enrolment of 371,757 (33.3% of all public university enrolments). Of public university enrolments, 29.9% were SET and 25.5% Business and Management. These are **field-of-study enrolments**, not unique reachable KAIRO users, paying demand or a TAM; SET also includes science and technology beyond engineering/computing. DHET recorded 560,446 TVET enrolment-cycle counts in 2024, down from 564,089 in 2023; annual/semester/trimester cycles can count the same person more than once, so this is not a unique-student count. TVET is a later segment pending fit with occupational/NC(V)/Report 191 content and mobile constraints. [DHET, *Statistics on Post-School Education and Training in South Africa: 2024*, pp. 13, 41](https://www.dhet.gov.za/Information%20Systems%20Management%20Documents/Statistical%20Reports%20and%20Data/Reports/Statistics%20on%20Post-School%20Education%20and%20Training%20in%20South%20Africa%2C%202024.pdf)

For practical reachable-market planning, count **named modules and opt-in cohort opportunities** rather than multiply national students by an invented price. DHET’s system scale only says the category exists. Obtain actual course enrollment and contact permission from a partner before sizing serviceable cohorts. A plausible first design cohort is 20–40 consenting adult learners in one technical module; this is a study-design assumption, not reach forecast.

## Problem evidence and boundary

South Africa has substantial post-school participation but aggregate counts do not show how many learners face a particular learning bottleneck. The product should test whether learners struggle to connect source text to a mental model and to obtain timely, useful practice feedback. Retrieval practice research supports asking learners to recall rather than only reread; feedback helps correct metacognitive errors, including low-confidence correct answers. Multimedia theory supports matching visual and verbal representations while managing limited processing capacity. These findings justify design hypotheses, **not a claim that KAIRO itself improves learning**. [Karpicke & Roediger, 2008](https://doi.org/10.1126/science.1152408); [Butler, Karpicke & Roediger, 2008](https://pubmed.ncbi.nlm.nih.gov/18605878/); [Mayer & Moreno, 2003](https://doi.org/10.1207/S15326985EP3801_6)

Design consequences: keep a short explanation tied to the relevant source; let learners control pace, interrupt, ask for a smaller step and choose reading; prompt a prediction or retrieval attempt before revealing a worked answer; give explanatory, specific feedback and another attempt; avoid decorative movement that competes with the concept. Do not use “learning styles” as diagnostic categories. Learner choice is a usability/agency hypothesis to test, not a neurological matching claim.

Connectivity is a material adoption constraint. Stats SA’s GHS 2024 reports 82.1% of households had internet access of some kind, but only 17.4% fixed internet at home; 75.6% reported mobile internet access. These are household measures and do not mean an individual learner has affordable, reliable data, a suitable device, or access during study. Build a low-bandwidth/readable fallback and measure data/time burden; do not claim offline capability unless delivered and tested. [Stats SA, *General Household Survey 2024*, Table 14.1](https://www.statssa.gov.za/publications/P0318/P03182024.pdf)

Employment context is not a product outcome. Stats SA’s Q4 2025 official unemployment rate (LU1) was 31.4%; this is the unemployed share of the labour force under the QLFS definition, not the share of all young people, students or graduates and not evidence KAIRO creates jobs. Report it only as broader context if necessary; never imply job placement, employability uplift or demand for KAIRO from it. [Stats SA, QLFS Q4 2025 key findings, released 17 Feb 2026](https://www.statssa.gov.za/?PPN=P0211&SCH=74047&page_id=1856)

## Alternatives and positioning

| Alternative | Why learners may choose it | KAIRO’s possible distinction / honest gap |
|---|---|---|
| Lecturer notes, textbook, tutorial, peer/tutor, YouTube | Trusted/course-aligned, familiar, often low-friction; human help can diagnose nuance | KAIRO may connect a learner’s reviewed source to an interactive example and saved attempt. It has not shown it is more accurate or effective. |
| General LLM/chatbot | Fast conversational explanations, broad utility | KAIRO’s source review, citation/revision flow and practice/evidence journey may improve inspectability. It still can err, citations need checking, and general AI is a close substitute. |
| Google Gemini Notebook / NotebookLM experience | Directly answers from notebook sources with citations; increasingly includes conversational/audio features | This is a strong free/low-friction alternative for source-grounded Q&A. KAIRO cannot claim source-grounding novelty. Its hypothesis is the joined lesson → domain interaction → practice → saved evidence workflow. Feature parity and regional availability need date-specific verification. [Official help](https://support.google.com/gemininotebook/answer/16179559?hl=en) |
| PhET simulations | Free, research-based interactive science/math simulations, with offline access and educator use | Excellent substitute for a learner who needs a standalone simulation; no need to recreate broad catalogue. KAIRO’s potential edge is the learner’s own reviewed source and connected practice/evidence, which is not validated as an advantage. [PhET about](https://phet.colorado.edu/bs/about), [free use](https://phet.colorado.edu/bs/help-center/getting-started), [offline](https://phet.colorado.edu/en/offline-access) |
| Course LMS / institution tutoring / commercial homework products | Embedded in workflow, potentially trusted by institution, subject-specific support | KAIRO’s cross-source workflow could complement rather than replace them. Integration, subject coverage, procurement and accessibility are not established. |

**Honest unfair-advantage assessment:** none demonstrated. Existing assets (KAIRO teacher/rig, source extraction and review, cited lesson editor, motor/pump/API activities, save/resume) are an implementation base, not a moat. A defensible advantage would require repeatable, rights-cleared course packs; reviewed domain-specific interaction templates; instructor trust; reliable learner-owned source lineage; and evidence of better task completion/learning at an acceptable total cost. Each is presently a hypothesis or incomplete capability. Open competition and the availability of NotebookLM/PhET make “AI tutor” or “3D is unique” weak positioning.

## Nine Lean Canvas fields

| Field | Evidence-based working entry |
|---|---|
| 1. Problem | Difficult technical concepts in course material are hard to connect, practise and revisit; static notes/answers may not provide an inspectable model plus feedback in one flow. **Local frequency/severity not measured.** |
| 2. Customer segments | Users: adult engineering / computing-IS undergraduates in one supported module. Buyer: faculty teaching/learning support, tutoring/student success unit or pilot funder. Users and payer are distinct. |
| 3. Unique value proposition | “Turn a difficult course source into a lesson you can check, explore, practise and return to.” Promise is product workflow, not proven outcomes. |
| 4. Solution | Upload/choose bounded source → review extraction → edit cited lesson → KAIRO/reading → relevant prepared activity → retrieval practice and feedback → save/resume evidence. Preserve source/version integrity and accessible alternatives. |
| 5. Channels | First: opt-in tutor/lecturer or academic-support referral; supervised module pilot; learner demo/workshop. Later: faculty/teaching innovation procurement and curated course packs. None are signed or validated. |
| 6. Revenue streams | Pilot sponsor/institution pays for a bounded, supported cohort/module package; later annual institution license or per-module service. Learner freemium/subscription is only a research option. No price, conversion, checkout or institutional procurement path verified. |
| 7. Cost structure | Variable: model/token and speech/API usage, file extraction/OCR, storage/egress, support and content review. Fixed/step-fixed: engineering/product, security/privacy, domain authoring, hosting baseline, procurement/accessibility. Cost per learner/session and data cost require metering. Include free credits separately from post-credit run rate. |
| 8. Key metrics | Activation to reviewed source; successful source→lesson completion; citation/source correction rate; practice attempt and second attempt; task completion/time; resume within 7 days; learner-reported usefulness/confusion; instructor review burden; cost per completed learner-session; data transferred; accessibility task success. Do not optimize minutes or streaks as proxies for learning. |
| 9. Unfair advantage | No proven moat. Candidate accumulation: rights-cleared reviewed domain modules, traceable source/revision-to-practice maps, validated interaction patterns, and trust built with course teams. Must be demonstrated and hard to copy; animation/model inventory alone is not enough. |

## Bottom-up pilot sizing (hypothetical, not forecast)

| Scenario | Explicit assumptions | Supported annual revenue arithmetic |
|---|---|---|
| Validation pilot | 1 partner institution × 1 module × 30 consenting learners; sponsor fee **R0** (research/validation assumption) | R0. This is evidence gathering, not commercial viability. |
| Small paid pilot | 2 reachable institutions × 2 modules each × 30 learners/module; assumed annual pilot fee R25,000 per institution (price hypothesis, not quote) | 2 × R25,000 = R50,000 gross annual revenue; excludes VAT/tax, discounts, procurement delay, support and delivery costs. |
| Expanded pilot | 5 reachable institutions × 3 modules each; same assumed R25,000/institution, not learner-scaled | 5 × R25,000 = R125,000 gross annual revenue; reach, willingness to pay and service capacity wholly unverified. |

**Sensitivity:** at 30 learners/module and two modules/institution, the assumed R25,000 institution fee equals R416.67 per learner for the pilot year before costs. If variable model/speech/storage/support cost is R0, R100, R300 per learner (pure scenario inputs), contribution per 60-learner institution is respectively R25,000, R19,000, R7,000 before fixed overhead (formula: 25,000 − 60 × variable cost). At R500 variable cost, contribution is negative R5,000. Root’s separate financial model should replace all hypothetical prices/costs with actual metering and explicitly include low uptake, retries/large files, speech use, cost after credits, support, procurement failure and zero-payment cases. Reachable buyer count is not established; do not label 2/5 institutions SAM until names, access and buying process are evidenced.

## Validation plan and decision gates

1. **Problem discovery (before broad build claims):** 8–12 voluntary adult learners across engineering and computing/IS, plus 3–5 tutors/teaching-support/budget owners. Ask for a recent real difficult concept and current workflow; observe with consent using non-private/open material. Record role, recruitment, date, task, exact paraphrased/quoted evidence with consent, contrary cases and no-show/non-use. This convenience sample estimates neither prevalence nor market size.
2. **Task usability:** 5–8 adult learners try one source-to-resume task on their actual phone/laptop; success means independently reviewing a source correction, finding the cited idea, attempting practice, saving and resuming, and switching to reading. Capture errors/help needed, comprehension check, time/data and accessibility barriers. No browser capture is implied; use authorized study observation and consent process.
3. **Learning pilot:** domain reviewer approves an objective/rubric; compare pre/post equivalent questions and transfer problem, with a delayed check if feasible. Publish sample size, attrition, assignment/comparison design, effect uncertainty, prior knowledge and intervention fidelity. Small uncontrolled outcomes are formative, not causal learning gains.
4. **Buyer test:** show a concrete scoped offer and costed pilot to 3–5 budget owners; ask who signs, which budget, procurement/privacy gates, acceptable evidence, and whether they would commit at stated fee. A positive interview is not a purchase; require an actual paid or formally sponsored pilot before claiming willingness to pay.
5. **Go/no-go:** continue only if learners can finish/recover the workflow, source/citation errors are caught, at least one buyer names a plausible budget and path, and measured per-session cost plus human review effort fits a price hypothesis. Otherwise narrow the subject/task, simplify the product, or stop the proposed segment.

## Ethical retention and growth

Use learner-chosen goals and a visible “resume where you stopped,” not guilt, streak loss, scarcity, public ranking or notifications designed to create anxiety. Ask before reminders; easy opt-out. Do not infer ability, vulnerability, language or career prospects from clicks. Keep progress as learner evidence, not covert surveillance or an employability score. Measure whether a prompt helps a learner return to the task and whether it is welcome; suppress it when not useful. Institution reporting should aggregate and minimize identifiable data, with transparent retention/deletion, purpose limits and review before deployment.

## Evidence register (selected primary / official sources)

1. DHET, *Statistics on Post-School Education and Training in South Africa: 2024*, 2026 release, especially p.13 fields and p.41 TVET definitions/counting caveat. [PDF](https://www.dhet.gov.za/Information%20Systems%20Management%20Documents/Statistical%20Reports%20and%20Data/Reports/Statistics%20on%20Post-School%20Education%20and%20Training%20in%20South%20Africa%2C%202024.pdf)
2. Stats SA, *General Household Survey 2024*, Table 14.1 internet access by type. [PDF](https://www.statssa.gov.za/publications/P0318/P03182024.pdf)
3. Stats SA, *QLFS Q4 2025 Key Findings*, released 17 Feb 2026; LU1 definition/context. [Official page](https://www.statssa.gov.za/?PPN=P0211&SCH=74047&page_id=1856)
4. Karpicke & Roediger (2008), “The Critical Importance of Retrieval for Learning,” *Science*. [DOI](https://doi.org/10.1126/science.1152408)
5. Butler, Karpicke & Roediger (2008), “Correcting a metacognitive error…,” *Journal of Experimental Psychology: Learning, Memory, and Cognition*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/18605878/)
6. Mayer & Moreno (2003), “Nine Ways to Reduce Cognitive Load in Multimedia Learning,” *Educational Psychologist*. [DOI](https://doi.org/10.1207/S15326985EP3801_6)
7. Google, Gemini Notebook official source-grounded chat help (current product documentation; features can change). [Help](https://support.google.com/gemininotebook/answer/16179559?hl=en)
8. PhET Interactive Simulations, official description and free-use/offline documentation. [About](https://phet.colorado.edu/bs/about) · [Use](https://phet.colorado.edu/bs/help-center/getting-started) · [Offline](https://phet.colorado.edu/en/offline-access)

## Gaps / interpretation limits

- The DHET report is system context, not segment-specific willingness to adopt/pay; SET mixes disciplines. Do not substitute the reverse-derived rounded national count for the report’s exact total.
- Employment rates describe labor-market status and cannot support KAIRO job/placement claims.
- Research findings guide activity design but are not KAIRO outcomes; no KAIRO learning evaluation, retention, usability study, traction, signed partner, recurring revenue or price test is available in this work.
- Connectivity figures are household proxies, not individual learner bandwidth, device access or affordability.
- NotebookLM/Gemini Notebook and PhET docs establish competitive alternatives, not head-to-head feature or efficacy comparison; verify current feature availability before presentation.
