# FNB pathway and permissioned workbench

Implementation specification, checked 21 October 2026. The accompanying explorer is a review prototype. The first learner-app slice is now /pathways: historical role exploration, user-reported evidence coverage, practical task suggestions, local saving and Markdown preparation export. Live feeds, independent verification, AI team orchestration and external-action services remain unimplemented.

## Evidence and role discovery

Use [FNB careers](https://www.fnb.co.za/careers/index.html) as the employer entrypoint. Its [experienced-hire areas](https://www.fnb.co.za/careers/experienced-hires.html) include technology, data, operations, product and finance. These are exploration categories, not vacancies or entry qualifications.

The official [graduate advert R46834](https://firstrand.wd3.myworkdayjobs.com/en-GB/FRB/job/Johannesburg/FNB-Graduate-Programme_R46834?q=graduate) describes relevant final-year BSc/Commerce backgrounds, academic results/transcript, analytical ability, customer needs, delivery and collaboration. **Its stated closing date was 31 August 2026: closed on this review date.** Cached relative countdowns must never override the absolute date. Use it for historical preparation, not an Apply now card. No verified currently open FNB vacancy is asserted in this pack.

The official [Data Analyst II R48624](https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/Data-Analyst-II_R48624) discusses data flows, data quality/root causes and stakeholders, with database technologies. Its indexed closing date was 28 April 2026. Treat as historical role evidence, not an entry-level promise. [Business Analyst-1 R37730](https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/Randburg/Business-Analyst-1_R37730) describes eliciting/validating requirements and translating them into solution requirements; availability and full eligibility remain unverified. The [graduate careers page](https://www.fnb.co.za/careers/graduates.html) supplies additional programme context. Do not turn a graduate diary into current mandatory selection criteria.

For a Business Informatics learner, explore business/systems analysis, data quality/analytics, software/QA and product/process work. Ask about tasks they enjoyed, practical evidence, qualification stage, access constraints and preferences. Compare several routes and let them choose. A course code alone does not establish mastery. The user's reported hackathon offers are personal context, not independently verified recruitment evidence.

## An explainable evidence score

Label it **KAIRO evidence coverage**, never FNB's score, ATS pass rate or hiring probability. Show the exact advert revision, checked date and requirement text beside every row.

Keep hard gates separate: closing date, qualification/stage, work authorisation, location and required documents. Each gate is confirmed met, confirmed unmet or unknown. A high skills score cannot override a closed advert or an unmet gate. Unknown is not a failed qualification.

Default illustrative rubric: required competencies weight 2, preferred competencies weight 1; programme themes excluded unless explicitly mapped for exploratory practice. Evidence points: unknown 0, self-described .25, inspectable practice artifact .5, independently reviewed task 1. These are KAIRO design choices, not research-derived or employer-approved weights. Multiple copies of one artifact do not increase points. A review must match the specific criterion and retain reviewer/rubric/version; a certificate alone is not a reviewed workplace task.

Coverage = 100 × sum(weight × evidence points) / sum(weights). Also show **unassessed weight**, each row's support level and a separate gate summary. Zero means no supported evidence supplied, not no ability. Show sensitivity to weighting, allow correction and never rank by ethnicity, disability, accent or other protected traits. Fairness and predictive validity remain to evaluate. Do not score this user without their reviewed profile/evidence.

Example: SQL practice artifact (2 × .5), reviewed analysis (2 × 1), self-described communication (1 × .25), unknown testing (1 × 0) = 3.25/6 = **54% coverage**, with 17% unassessed weight. This illustrative four-criterion rubric is not an FNB advert extraction and does not establish eligibility. The interactive demo lets the reviewer change these evidence states.

## One substantive learning/work route

Build a fictional small-business service-quality case using generated customer IDs and synthetic transactions. Mark every file synthetic, give the seed/schema/assumptions, and check licences before substituting public data. Never imply access to bank customer data or inside FNB processes.

1. Baseline: explain a discrepancy, inspect an unfamiliar table and write a short stakeholder question. Preserve first attempt and assistance used.
2. Analyst task: AI product owner supplies an incomplete complaint brief. Learner elicits missing requirements, maps the current process, writes acceptance criteria and identifies privacy boundaries. An AI reviewer challenges ambiguity; its opinion is not external validation.
3. Data task: clean duplicate/missing transaction records, write SQL checks, reconcile totals and document limits. Use actual executed SQL and a held-out task. Export query, data dictionary and test results.
4. Delivery task: design or build a small dashboard/API, write tests, handle a changed requirement and a simulated failed import. Record the reasoning and revision, not just a polished final screen.
5. Communication task: produce a concise recommendation and recorded optional demo. Explain uncertainty and respond to a simulated stakeholder objection. Provide a text route and accessibility controls.
6. Transfer: independently solve a changed dataset/scenario after a delay. Use a versioned rubric, deterministic calculations and independent human review where available. An AI teammate must not secretly complete assessed learner steps.
7. Portfolio: generate an accurate project case study with contribution, tools, data origin, limitations, commit/artifact links and review status. Attach rubric evidence to the relevant role criteria. Let the learner choose what becomes public.

Use free preparation from [Microsoft Learn](https://learn.microsoft.com/en-us/training/), [PostgreSQL's SQL tutorial](https://www.postgresql.org/docs/current/tutorial-sql.html), [GitHub Skills](https://skills.github.com/) and [Forage](https://www.theforage.com/). Verify current content, access, fees and reuse terms at ingestion. No paid exam is required for this route. Estimate learning time only after baseline and available weekly hours; finishing a module is not automatic job readiness.

Each plan item stores criterion/source, prerequisite, baseline, resource, task, artifact, assessment, help used and reassessment date. Skip demonstrated material, revisit errors and allow the learner to change goals. Readiness should improve when demonstrated capability improves, not when videos accumulate.

## Hackathons, experience and digital profile

Add hackathons as an experience route: current official event page, dates, eligibility, team matching, costs, IP/data rules, accessibility and registration consent. Preparation is a scoped brief, team roles, milestones, honest demo and contribution log. Capture collaboration, feedback and reflection whether or not the team places. Keep ongoing practice challenges separate from actual organiser-run events. A private peer-review session, volunteer brief or SME project can serve learners who cannot attend an event. Host and institution approval are required before calling any activity WIL.

CV drafting uses confirmed facts and relevant terminology supported by evidence, standard headings, readable contact details, selectable text and simple layout. Offer DOCX and text-extractable PDF; inspect extraction/order, dates, missing information and project links. Never invent employment, grades, certificates or achievements. Do not stuff invisible keywords or promise to bypass ATS. Actual employer instructions take precedence over generic templates.

Digital profile support drafts headline, About, skills, Featured projects and an accessible portfolio from the same evidence graph. Confirm contribution and publication permission. A public portfolio is optional; private shareable evidence should work. [LinkedIn API access](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access) is permission/product specific: login access is not universal profile editing or applying. Use supported APIs or a user-led workflow within provider rules; publishing or messaging needs exact content/destination consent. No bulk unsolicited outreach.

## A permissioned tool layer, not unrestricted host access

KAIRO Core should expose a server-side tool broker with typed schemas and an allowlisted capability registry. MCP is a connector protocol, not automatic permission to access every resource. Pin server versions, review source/licence, authenticate each user and validate tool inputs/outputs. Follow the [MCP authorization specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-06-18/basic/authorization.mdx) for supported remote transports; OAuth alone does not implement product action consent.

Grant a task-scoped capability with user, tool, action, named resource/destination, allowed files, permitted fields, budget, expiry and revocation. Record request → preview → approval where required → execution → observed receipt. Read-only public research, private document analysis, command execution, upload, publication and final application are different capabilities. Never pass cloud credentials, host cookies or unrelated files to generated artifacts. Untrusted web/document content is data and cannot expand tool scope.

Terminal tasks run inside a disposable per-project container or constrained remote worker, with quotas, timeout, restricted mounts/network, no host shell access by default and no cloud metadata credentials. Show commands/diffs when useful; require fresh approval for destructive actions, new installations outside the scope or changed destinations. Stop/revoke kills queued work and the worker. Preserve useful outputs and redacted logs. Mock the execution interface before enabling real tools. API charges and model access are separate from the user's Claude/Codex app subscriptions.

For the UI, build a **Workspace panel** supporting source/document, studio, video, sandboxed HTML artifact, browser handoff and task output. Keep the teacher and lesson state consistent across panels. Artifacts use an isolated origin/sandbox with no host privileges and declared capabilities. Persist source versions and provide readable alternatives. Remotion can render an optional video; it is not required for an interactive diagram or permissioned browser.

Use the [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) for supported embeds and the [required player functionality](https://developers.google.com/youtube/terms/required-minimum-functionality). Keep controls, attribution, client identity and playback consent. Show a verified timestamp relevant to the lesson; do not download/redistribute clips without rights. No API key is needed for a known public embed; search/discovery APIs have separate configuration and quotas.

An ordinary web app cannot embed every website: CSP/frame restrictions, login and provider rules apply. Offer an external-browser handoff where needed; a future desktop WebView is a separate architectural decision, not an iframe workaround. Hide distracting URL chrome for trusted learning media, but show the real provider/origin, attachment and destination for login, upload, payment and submission. Do not spoof a browser's trusted chrome or proxy around site restrictions.

## First implementation boundary

The next learner-facing slice should be an FNB-oriented **historical-role preparation** view: source/closure status → criterion rows → imported user-confirmed evidence → editable coverage → three prioritised learning/work tasks → downloadable truthful project/CV draft. Use a mock application target to prove field mapping, approval scope, revocation and duplicate prevention. Real job availability, authenticated persistence, real application adapters, shell workers and LinkedIn integration remain separate deliverables.

A strong demo is an unexpected changed requirement: the learner must fix a query or explain an error, the artifact evidence updates, and the readiness reasons change. That demonstrates learning and tool use more clearly than a room full of decorative screens.
