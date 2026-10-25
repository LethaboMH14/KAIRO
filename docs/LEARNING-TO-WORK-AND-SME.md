# KAIRO: learning that produces useful evidence and next actions

Decision brief, 21 October 2026. User direction: keep the full studio/teacher ambition, invest equally in learning quality and practical logic, connect education to employer needs and work opportunities, and help SMEs act on real operational problems. This document specifies the next product layers; it does not claim they have all been implemented.

The core journey is **understand a source → practise a concept → solve a realistic task → explain and improve the work → preserve credible evidence → pursue a relevant opportunity or help a business**. The same teacher and source context should continue through that journey. A learner should not have to re-enter their background at every step.

## What would make this meaningfully better

The distinctive mechanism is the connection between understanding and action. A learner clicks a confusing stock formula, sees the consequence on a shelf, reconciles a discrepancy, produces a readable handover and a tested spreadsheet/API, then sees which parts address a real role requirement or SME brief. The employer requirement is visible, the task rubric is visible, and the resulting work is inspectable. The avatar guides that process; its visual appeal is not the evidence of learning.

More features alone will not establish better education, employment or SME outcomes. We will measure retention, transfer, independent task performance, portfolio quality, application accuracy and business task outcomes. Interviews and job offers depend on employers and other conditions beyond the product. Avoid guaranteed-employment language and claims that an app replaces accredited education or professional supervision.

## Learning mechanics to build

1. **Diagnose the exact difficulty.** Ask a brief concept question and a confidence question before teaching. Keep source errors, unfamiliar vocabulary, arithmetic mistakes and conceptual misunderstandings distinct. An OCR uncertainty should trigger source review rather than a confident lesson.
2. **Use a small concept graph.** Each concept has prerequisites, source spans, worked examples, common mistakes and related practical tasks. Begin with a reviewed graph for stock reconciliation and API/SQL; do not manufacture an entire qualification graph automatically.
3. **Teach, then fade assistance.** Show a worked example; ask the learner to explain a step; offer a partially completed task; then change the numbers/context and ask for independent work. A teacher can point, draw or animate a template when it addresses a specific misconception. Do not add motion while the learner is reading a dense passage.
4. **Require transfer.** A familiar multiple-choice item is not enough. Ask the learner to apply the principle to a new record, describe the decision and identify uncertainty. Correct arithmetic with an unsupported accusation should not pass the stock-control judgement rubric.
5. **Give actionable feedback.** Explain the mismatch, cite the evidence, offer the smallest useful hint and allow retry. Record first attempt, hint level, latest attempt and independent reassessment separately. Do not inflate the record by overwriting the first failure with a final correct answer.
6. **Revisit later.** Schedule recall and a changed-context task after a delay. Compare a simple transparent scheduler before fitting ML. Let learners inspect, override and clear inferred recommendations. Never treat a learning-style label or inferred emotion as ability.
7. **Make access a first-class route.** Reading, keyboard operation, captions, transcript, reduced motion and low-bandwidth diagrams must complete the same task. Local-language output must retain technical terms and source anchors; translation quality needs fluent review. SASL requires a separate validated linguistic pathway.

The [IES practice guide](https://files.eric.ed.gov/fulltext/ED498555.pdf), [AERO explicit-instruction guidance](https://www.edresearch.edu.au/guides-resources/practice-guides/explicit-instruction-practice-guide-full-publication), and [EEF self-regulation guidance](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition) inform these mechanisms. Their findings do not establish an effect size for KAIRO. School-oriented guidance must be tested before generalising to tertiary/adult learners.

## Employer requirements become assessable work

Facts and proposed product tasks must stay separate. Source registry: `coordination/briefs/AVATAR-AND-PATHWAYS/sources.json`. The checked examples are a starting sample, not all employers or fields.

| Evidence | Requirement type | Proposed KAIRO practice | Inspectable output |
|---|---|---|---|
| Amazon South Africa SDE job 10447560: programming and algorithm/data-structure experience; project and database/cloud/version-control experience preferred (EMP-AMAZON) | Basic vs preferred criteria explicitly separated | Build a small stock API, implement a data structure, parameterise a query, write tests, diagnose a failed request and explain design choices | Repository commit, tests, assumptions, short design note and demonstration; each rubric row points to actual files |
| Standard Bank technology descriptions include Python/SQL, pipelines, testing and cloud/security (EMP-SB) | Programme focus areas; not all mandatory entry criteria | Reconcile a deliberately messy inventory CSV; design SQL tables, validation and tests; explain data quality and access decisions | Reproducible notebook/query, test report and concise stakeholder handover |
| Transnet lists technical and nontechnical development/WIL routes (EMP-TRANSNET) | Programme and qualification/placement conditions | Engineering fault-isolation explanation or operational reporting task with a supervisor-ready evidence log | Simulated task log clearly labelled; institution/host confirms any actual WIL recognition |
| ECSA professional pathway (PRO-ECSA) | Professional development, not a job advert | Motor operating assumptions, safe conceptual diagnosis, calculation and technical communication | Engineering report plus limits; does not claim real equipment competence or registration |
| SAICA framework (PRO-SAICA and PRO-SAICA-SKILLS) | Professional framework; distinguish entry/post-qualification material | Reconciliation, control weakness, ethical decision and plain-language business recommendation | Workbook, evidence trail, reflection and reviewer rubric; not a CA(SA) credential |

The Amazon source is a specific vacancy page with graduation timing; it must be checked again before offering an application. Standard Bank programme learning areas should not be mislabelled as hiring prerequisites. Specific Siemens requirements remain unverified. FNB sources were subsequently verified and are detailed below. The [DHET report index](https://www.dhet.gov.za/SitePages/HRDPlanningNew.aspx) adds dated sector context, not current vacancies.

For each field, add several direct employer sources, a current professional/occupational framework where applicable, an educator reviewer and a small set of realistic tasks. Law and health tasks need domain reviewers; simulations do not authorise regulated practice. Avoid treating a tech hiring profile as the template for every occupation.

## Evidence portfolio, CV and credential logic

Use a private evidence record that distinguishes **self-described**, **KAIRO-practised**, **independently reassessed**, **externally reviewed**, **provider-credentialed** and **host-confirmed experience**. A completion badge cannot silently move between those categories. Preserve support level, task version, rubric version, source version, relevant output hash/commit, date, assessor identity (when real), limitations and learner reflection. Let a reviewer reproduce the task where practical.

CV generation may improve wording and selection but must trace each claim to user-confirmed facts or a concrete artifact. It must not invent employment dates, scores, proficiency, references, qualifications, salaries or impact metrics. Label an authored or Forage simulation as a project/simulation, not an internship. Offer accessible DOCX/PDF plus a plain format suitable for application forms; validate text extraction and reading order instead of claiming an unknown ATS score.

[Microsoft Learn](https://learn.microsoft.com/en-us/training/student-hub/certifications) provides relevant learning/credential routes. Show preparation, assessment, cost, renewal and prerequisite separately; not every exam is free and a credential is not an employment guarantee. [Forage](https://www.theforage.com/) can complement KAIRO through links to employer-designed simulations. Provider material and model answers are not ours to scrape and repackage by default. The learner completes external assessments themselves.

## Opportunity discovery and verification

Use StudentRoom and SA Bursaries as discovery sources, then follow the original employer/funder. The intended job-simulation service is **theforage.com**. The requested `nasispani.co.za` and `ipsani.co.za` spellings were not verified; a government notice identifies the separate Gauteng job portals for Nasi iSpani. Do not send identity documents or CVs to unresolved domains.

Opportunity types: vacancy, graduate programme, internship, learnership, apprenticeship, WIL, volunteering, bursary, course, credential, supervised project and SME brief. Each card displays publisher, original URL, reference ID, location/remote constraints, dates and timezone, requirements, required attachments, cost, last checked time and verification state. Missing deadlines remain unknown. A live-looking page with an Apply button is not enough to claim an opportunity is still open.

Deduplicate by provider + reference, keeping aggregator notices as secondary links. Preserve amended/withdrawn/cancelled/closed states. Recheck live before preparing and immediately before submission. A mismatch or unreachable primary source pauses submission and shows the reason. Never silently extend a closing date or infer that stale information is current.

Provide match explanations such as “three documented technical criteria have supporting artifacts; two need evidence; the qualification window is not yet confirmed.” Do not invent a probability of being hired or automatically exclude users using inferred protected characteristics. Present explicit provider conditions for user review and keep accommodations separate from skill scoring.

WIL and volunteer routes should expose supervision, institution requirements, hours, expenses, location and host acceptance. [Transnet](https://www.transnet.net/YouthDevelopmentProgrammes) and [forgood](https://www.forgood.co.za/za/en/volunteer) are initial source examples; a volunteering listing is not automatically WIL credit or available to every learner.

## Assisted applications and truthful feedback

Build this as a resumable state machine:

`discovered → primary_source_checked → requirements_reviewed → evidence_matched → pack_prepared → user_reviewed → form_filled → submission_authorised → submitted_with_receipt / outcome_unknown / failed`

The product can save a user-confirmed reusable profile, tailor a CV, draft a motivation letter, map fields, fill supported websites and upload specifically authorised attachments. Before a real external submission, resolve the named recipient/site, opportunity reference, document versions, exact fields, sensitive data and allowed action scope. A bounded user-approved queue can reduce repeated approval prompts; it is not authority to apply to unknown destinations or send every stored document everywhere.

Stop for CAPTCHA, new terms/contracts, signatures/declarations, sensitive-data scope changes and live hiring tests. The user completes those where required. Do not bypass site protections, access private accounts without permission, or disguise automation. Prefer a permitted API or supported user-controlled browser adapter; keep manual handoff when a site has no supported route. No mass blind applications.

After an action, report only observed facts: submitted form, response/receipt, reference number, timestamp, attachment filenames/versions and outstanding steps. A filled form is not a submitted application. A timeout after submission is **outcome unknown**, so check history/receipt before retrying. “No response” is not rejection. “Shortlisted” requires actual provider evidence. Never invent personalised employer feedback. Do not email a portal's general contact mailbox as an alternative application channel.

No applications or CVs were sent while preparing this kit. Browser autofill/application adapters are planned capabilities, not installed site integrations.

## SME problem-solving through the same learning engine

Start with observable workflows rather than a generic business chatbot:

| SME problem | Guided action | Evidence to measure |
|---|---|---|
| Stock discrepancies and ordering | Review records, reconcile, distinguish expected and counted stock, draft reorder scenarios | Time/error rate against a reviewed baseline; unsupported explanations flagged |
| Weak cash visibility | Categorise approved transactions; separate realised cash, receivables and scenarios | Reconciled totals and documented assumptions; forecasts labelled estimates |
| Pricing/quoting uncertainty | Build a cost and margin worksheet; compare scenarios with owner-entered figures | Reproducible calculations and review, not a promise of profit |
| Supplier/tender preparation | Discover a suitable notice, check capacity, dates and documents; prepare a response checklist | Missed requirements, preparation time and source accuracy |
| Poor digital records | Create an inventory sheet, simple website/API or reporting workflow under an approved brief | Working artifact, maintenance handover and owner sign-off |

Use the [official eTenders portal](https://www.etenders.gov.za/) and [CSD guidance](https://ocpo.treasury.gov.za/Suppliers_Area/Central%20Supplier%20Database/). Tender fit includes capacity, cash timing, delivery location, mandatory requirements and amendments; registration alone does not establish eligibility. Bids, declarations, payments and financing agreements need the business owner's review and appropriate authority. Current Sedfa service forms remain unverified after its site timed out; do not promote a development/UAT portal as the public service.

An additional differentiator is a **supervised small-business project route**: the owner supplies an approved problem, a learner practices on synthetic data, a mentor reviews the proposed change, and only then does the owner approve a bounded real implementation. Preserve client confidentiality and explicitly agree ownership, maintenance and credit. This is a proposed pilot mechanism; no SME placements, partners or validated business outcomes are claimed.

## Runtime architecture and data contracts

Keep these modules distinct behind the shared teacher context:

- Source intake: OCR/edit/review, immutable source versions, selected-span citations and deletion.
- Learning engine: concept graph, misconceptions, hint policy, spaced recall and rubric-based transfer tasks.
- Studio adapters: valid actions, deterministic domain calculations, animation templates and accessible equivalents.
- Evidence store: user/profile access control, artifact versions, consent and reviewer identity.
- Opportunity retrieval: allowlisted adapters, public APIs where available, caching, expiry and amendments. No external source instructions become executable tool commands.
- Application assistant: field mappings, attachment scopes, external consent, idempotency and receipts.
- SME workspace: owner permissions, approved datasets and project boundaries.

Suggested production persistence: authenticated relational storage for users/consents/tasks/artifacts; private object storage for uploads; retrieval index with source-level permissions. Current local JSON/browser storage remains a prototype. Do not silently migrate private coursework into cloud training or public assets. ML initially means an evaluated recommendation model over consented learning events; retrieval and prompt orchestration are not training model weights. Provide deletion/export and measure false recommendations and uneven outcomes across access routes.

Proposed contracts should be versioned before implementation: `Requirement(sourceId, kind, statement, requiredOrPreferred, validAt)`; `SkillEvidence(taskId, artifactId, sourceRevision, rubricVersion, supportLevel, assessmentResult, reviewState)`; `Opportunity(provider, reference, sourceUrl, status, deadline, checkedAt, conditions)`; `ApplicationScope(opportunityId, destination, fields, documentVersions, expiresAt, permittedActions)`; `SubmissionAttempt(idempotencyKey, stage, receipt, outcome, timestamp)`.

## Evaluation and delivery sequence

**Next vertical slice:** business-informatics stock task. Reviewed passage → cited explanation → guided example → independent changed-data task → artifact and rubric → compare with employer evidence → prepare an application pack for review. Use a mock application endpoint to test autofill and duplicate protection before any real submission adapter. The first employer mapping is a prototype comparison, not an endorsed partnership.

Then add reviewed engineering tasks after Claude's ENG-001 browser acceptance. Expand law/health/industrial modules only with appropriate reviewers and valid task logic. Build general opportunity infrastructure once, then add one source adapter at a time. Avoid shipping six empty rooms with identical chat widgets.

Pilot design: define baseline and rubrics before recruiting; use comparable topics and starting ability, pre/post and delayed assessments, independent raters where practical, and record hint exposure and attrition. Compare source reading, guided practice and guided practice with avatar where feasible to separate the avatar effect from instruction quality. Predefine primary outcomes and analyse uncertainty, not just average scores. Do not choose a sample size without a power/feasibility discussion.

Track: source-grounding errors; independent first-attempt transfer; delayed recall; reviewer agreement; time/cost/data per useful lesson; keyboard/reading completion; application field/attachment errors; stale/duplicate opportunity rate; observed receipts; actual interview/placement outcomes when voluntarily confirmed; SME task accuracy and owner-reviewed usefulness. Satisfaction and animation smoothness are secondary to learning and reliable action.

The user's focus areas are education, access, employability, practical experience and SME productivity. Their connection is now explicit; official judging weights remain those in the actual published rubric, not invented percentages. Claim an area is addressed by a demonstrated mechanism, and claim an outcome only after measurement.

## FNB roles, work simulations and tool-enabled action

The concrete follow-on specification is [FNB-ROLE-AND-TOOLS.md](../coordination/briefs/AVATAR-AND-PATHWAYS/FNB-ROLE-AND-TOOLS.md). It adds verified FNB employer examples and closure status, role discovery, an explainable evidence-coverage rubric, synthetic practical work with AI teammates, hackathons, truthful ATS-readable CV/profile drafting and task-scoped terminal/MCP/browser-panel architecture. The local explorer demonstrates changed evidence scores and practice feedback; live vacancy ingestion, profile persistence, real submission, shell workers and LinkedIn publication are not implemented by this kit.
