# Engineering first: one learner, one connected journey

23 October 2026. Root: Codex gpt-6 / effort unknown. This is the scoped product decision and delivery sequence following the user's expanded engineering, curriculum, career and cloud request. Current implementation and targets are distinguished below. Keep selected C, Chalk/Moss/Sage and existing KAIRO avatar. The deleted recurring schedule remains off.

## The story we are building

An adult electrical-engineering learner arrives through an institution invitation or chooses private study. Their confirmed programme, year and modules shape their workspace. They bring a motor passage, review its extraction, and create a cited lesson. They read it or listen with KAIRO, then move into the supported motor studio. KAIRO explains the selected winding or rotor, links the rotating field to a checked calculation, and asks the learner to predict what changes. The learner records their reasoning and completes a small fault scenario. Their private evidence informs a visible next learning step and a source-backed entry-level opportunity. They can resume, export or delete their work. A recruiter sees only a separate explicitly shared portfolio, never the private source/CV by default.

The differentiation is the connection between material, manipulable equipment, explained decisions and evidence. The same learner context travels throughout; a large menu of unrelated rooms does not establish that connection.

## How much to build now

Keep **three existing teaching surfaces**: (1) source classroom with reading, (2) Engineering, (3) existing CS request trace as secondary diversity. Complete **one engineering studio with the motor** before expanding. Pump is the second engineering equipment package only after Claude delivers/releases it and root reviews it. It is not a fourth independent runtime. Do not start new anatomy, court, metallurgy or aeronautics 3D rooms for the first acceptance run. Their curriculum metadata can be researched now without pretending their simulations exist.

Initial curriculum target: one university, Wits as a research default rather than a claim that it is the user's institution. Eight programme tracks to research: electrical, mechanical, aeronautical, metallurgy/materials, civil, construction studies, computer science, information systems. Add physics as a supporting subject map before a separate degree track. Build a small reviewed concept set first: algebra, functions/graphs, calculus, vectors, mechanics, electricity, circuits, fields, materials, programming, data and engineering communication. This is a proposed catalogue target, not eight complete ingested degrees. Exact counts follow authoritative extraction; do not invent course codes or a total module count.

## Account and module rules

Private guest: quickest start is choose a goal or upload supported material. CV is optional, removable and never required to study. Before private cloud processing show what leaves the device. Guest work has an explicit expiry/storage statement and a path to retain/export it. Anonymous access needs real per-user isolation and upload/generation quotas before public release.

Institution: Firebase/Identity Platform proves identity. A university email alone does not prove programme, year, registration or paid access. Server-validated invitations or an authorised roster assigns organisation membership and module enrolments. Learner confirms a displayed context; only an institution administrator can assert institution-verified status. Workplace follows the same boundary with assigned role and training cases. Changes to year/course catalogue produce a visible migration choice, never silently relabel old evidence.

Workspace relevance is not security. Hiding CS from a mechanical learner does not authorise data access. Server-side owner/tenant checks must apply to every source, lesson, file, retrieval query, progress record and export. Programming can still appear when it is an enrolled supporting module.

## Stable proposed interfaces for the next two Luna tasks

`CurriculumModule`: `{ id:string, institutionId:string, catalogueYear:number|null, code:string|null, title:string, studyYear:number, programmeIds:string[], conceptIds:string[], source:{url:string, locator:string, checkedAt:string, evidenceStatus:'original-reviewed'|'discovery-only'}, status:'reviewed'|'needs-review' }`. checkedAt is an ISO UTC timestamp; source URLs must be HTTPS. Reviewed records require a verified year, exact code, original-reviewed status and a nonempty original-edition locator.

`Programme`: `{ id:string, institutionId:string, title:string, qualification:string, sourceUrl:string }`.

`LearnerContext`: `{ mode:'private'|'institution'|'workplace', programmeId:string|null, studyYear:number|null, moduleIds:string[], verification:'self-declared'|'institution-verified' }`.

A module identity is institution + catalogue year + exact code; unverified code stays null and the record is not enrolment-ready. Same authoritative module reused by programmes can share an ID; similar content across different codes is a concept link, not official credit equivalence. Unknown catalogue year is retained as null research metadata, never guessed to make the record pass. Such records remain needs-review and cannot appear as ready module choices.

`ModuleChooser` is props-only: programmes, modules, context, onChange(nextContext), onStart(moduleId). It shows relevant reviewed modules and clear empty states, no auth/storage/fetch/router. A learner-controlled choice emits self-declared status. It cannot emit institution-verified status. The registry validator stays pure and separate from network discovery. These contracts are proposals for review, not deployed APIs.

## Lesson curation and interaction

1. Ingest allowed PDF/text/image/transcript formats with size/page limits; report unsupported or failed extraction. A video URL is not proof of transcript rights. Retain exact source spans, locator, owner and immutable revision.
2. Learner reviews extraction/OCR before generation. Generate a structured lesson with objectives, prerequisites, short explanation, worked example, misconception, retrieval check and practical transfer. Every factual section must point to supporting passages. Reject invalid citations; show unsupported topics plainly. A model's confidence is not source validation.
3. Choose representation from an allowlist: reading, formula/graph, safe structured interactive component or supported studio adapter. Arbitrary generated HTML/JavaScript is never executed in the application's trusted origin. Motion explainers must use reviewed templates and recorded narration/caption timing; MP4 export is later than an accessible working interactive lesson.
4. Equipment adapters expose validated state and bounded actions. Start with select part / reveal drawing / explain calculation; no LLM-generated physics or arbitrary script. A foreign uploaded lesson does not automatically become a motor simulation. Match it only after reviewed concept coverage; preserve returnLessonId and source revision when linking to practice.
5. Adapt from actual attempts and explain the next choice. Offer text, drawing, captions and interrupted/restartable voice. Do not diagnose a learning style. Use a short formative check and learner preference, not an unsupported fixed learning-style classification.
6. Separate authored content, calculated results, generated cited explanation and unverified learner work in labels. Grade correctness with known solutions where available; open reasoning needs a transparent rubric and human review before credential claims.

Currently source review → generated/local lesson → reading/KAIRO → quiz → notes/export/resume is connected. Motor selection/calculator now has a contextual prepared KAIRO panel and shared narration. Source-to-equipment semantic matching, common practical evidence, programme onboarding and live employer matching still need integration.

## Models and measured intelligence

The current configured Google generation path has a recorded successful synthetic-source lesson request in docs/app-flow-20261023/api-verification.json. Keep actual configured model metadata, cancellation, source checking and per-request caps; do not promise every model alias is available in every region. Use the existing managed model before hosting new GPU weights. Text generation, translation, device speech, Google speech and SASL are separate capabilities. English engineering explanations must not be labelled multilingual translation merely because a voice preference exists.

The current lexical source search is retrieval, not a trained comprehension model. Existing lesson-attempt logistic regression is a limited experimental model with minimum-data and temporal-validation/baseline gates, not validated mastery or employability. Next evaluation set should contain human-reviewed engineering questions, correct calculations, exact citations, invalid-source cases and unsupported-equipment requests. Measure citation validity, answer correctness, refusal/recovery, latency and cost; inspect slices by language and source quality. Only promote a learned skill predictor after enough consenting real examples, held-out evaluation and a meaningful baseline improvement. General model fine-tuning is not the first dependency.

## Career and external information

CV extraction is user-reviewed evidence, not a skill test. Each role requirement maps to a cited original employer posting, publication/closing date and observed skill evidence. Show demonstrated / self-reported / untested separately. Never display a precise job-readiness probability without validation. Assess one electrical scenario, suggest a feasible project and show one verified role source first; then add bursaries, cohorts, certificates and events with location, eligibility, cost/currency and last-checked time. A closed deadline must immediately prevent an 'open' label. Unknown eligibility is not an acceptance prediction.

Prefer university pages, original employer ATS, funding organisations, RSS and explicitly licensed APIs. Save source URL, fetchedAt, publishedAt, closesAt, timezone, fingerprint, rights/access policy, extraction confidence and review status. Conditional requests, per-origin throttling, bounded retries, deduplication, changed-content review and a visible stale state are required. Fetchers reject private-network/redirect targets and treat downloaded content as data, never tool instructions. Realtime means a defined checked-at/freshness policy, not a promise to see everything instantly. No watcher or recurring retrieval is enabled by this plan.

LinkedIn's official guidance prohibits unauthorised scraping bots; Instagram platform access must be checked per approved API and account scope. Do not use session cookies, credentials or blocked-site workarounds. YouTube uses permitted embeds/links and available authorised captions; do not rip clips or audio. Learner-pasted links and original employer sites provide useful fallbacks. Research evidence and restrictions: SOURCES.md.

## Commercial and impact test

Private free essential reading/accessibility with capped AI usage; optional paid enhanced usage is a pricing hypothesis. Institution buyer pays for a small module/cohort pilot, seat management, educator review and aggregated outcomes with consent. Workplace buyer pays for reviewed scenarios and training evidence. Keep serving cost per completed lesson, support effort and gross margin scenarios explicit. No checkout or revenue claim until real billing and terms exist.

Gamification rewards completed, checked work and sustained practice without converting assistance into a credential. Public portfolios are opt-in, revocable and distinguish assisted from assessed work. FNB rewards are a partnership proposal, not actual redeemable points or a bank integration. Pilot impact measures: completion, time to first useful lesson, retention, pre/post concept checks and accessibility task success. Recruit participants before claiming traction or improved learning.

## Implementation gates and responsibilities

1. Root reviews/integrates Luna resume and recovery; connect Engineering to the single narrator and contextual explanation. Evidence in this handoff/checks. Preserve current design and all claims.
2. Luna A researches a bounded original-source curriculum registry and pure validation. Luna B builds the props-only module chooser from the published interface. Both can start independently; no router/provider/auth/package changes. Briefs in coordination/briefs/engineering-next-20261023. Root reviews each, then owns profile persistence, module gating and source-to-equipment adapter.
3. Root owns hosted identity plus per-user/tenant durable storage and upload ownership. Use existing cloud runbook, verify current project resources and region/cost before mutation. A loopback filesystem/SQLite server cannot simply be made public. See CLOUD.md for acceptance gates and blockers.
4. Complete one role requirement → assessment → private evidence → next project chain, with a manually checked original source before adding automated feeds.
5. Invite a friend only after two-user isolation, upload/review/generation/delete, restart durability and quota checks pass on the deployed URL. Reading and drawing must succeed when audio/3D/generation fail. Browser/device acceptance remains pending under the standing observation restriction; don't bypass it through another browser or screenshots.

## Seven judging criteria as evidence gates

| Criterion | Specific question / user need | Observable acceptance | Current gap |
|---|---|---|---|
| Product | Complete solution, polish, challenge fit, market need and traction | Stranger completes source → studio → practical → saved evidence and resume | Hosted end-to-end and actual participants |
| Creativity | New, appealing, relevant improvement to learning | One source becomes an inspectable motor explanation and a transfer task | Arbitrary-source equipment mapping and user assessment |
| Usability | Clarity, simplicity, next action | First useful lesson without CV; relevant modules; reading recovery | Onboarding/context gating and device testing |
| Sustainability | Team delivery, next level, revenue path | Isolated ownership, measured unit costs, institution pilot proposition | Paid demand, support cost and retention |
| Impact | Importance and size of problem, usefulness | Consented learner concept checks and accessibility tasks | No measured learning gains or validated indispensability |
| Presentation | Story and social relevance communicated | Honest 90-second journey plus working URL and architecture | Full hosted engineering journey and final submission evidence |
| Intelligence | Analyse inputs/patterns, adapt or predict | Context-aware teaching, checked calculation, cited answers, evaluated next-step rule | Validated longitudinal learning/skill prediction |

Automated checks establish bounded behaviour only. They do not establish traction, device accessibility, educational outcomes, profitability or a guaranteed judging score.
