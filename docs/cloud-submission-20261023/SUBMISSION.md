# Submission pack and portal-ready copy

Draft for user review, dated 23 October 2026. Screenshots saved unchanged in screenshots/. They show form fields, not proof that anything has been submitted. Original programme PDF remains C:/Users/USER/Downloads/FNB AOTY Hackathon 2026 - Programme.pdf. No portal action, submission, account change or recurring reminder has been performed.

## Deadlines and exact evidence

Programme p3 requires the 20-second selling video and says record yourself; p3 says Saturday **24 October 12:00**, while p10 schedule says **13:30**. Use **12:00 SAST** as the internal deadline until organisers clarify; do not assume the later time. SSDLC update is Saturday 12:00–12:30 (p9); Lean Canvas Sunday 25 October 12:00–12:30 (p11); progress updates before midnight each day (p3; p8/p10 show 23:00–00:00); final submission Monday 26 October **23:59** (p11). Team profile required even solo (p3).

Slides need user journey, technical architecture, demo URL/account details and usable build/live web app. Judges must be able to test it; app-store publication is not required for the web app (p3). No verified 90-second demo limit was found in the relevant programme requirements; treat 90 seconds as our useful demo edit, not an organiser rule. Do not invent a login/QR or mark hosted processing ready before remote checks. The video's record-yourself instruction is why the initial hustle cut features the actual user; generated actors are optional illustrative support, not an assumed eligible substitute.

## Team profile — replace broad technology claims with this

Team name: **Team KAIRO**. Project: **KAIRO Access**. Location: Virtual. Challenge: Access to higher education. Sector: Education. Favourite song remains the user's selection; listing it does not license that track for an advert.

### Background / motivation

Getting into higher education does not always give a student the support needed to understand difficult material. A learner may have notes and recorded lectures but still struggle to connect an explanation to how a motor works, practise outside a scheduled lab, or know which part to revise next. We are starting with adult engineering learners and a practical question: can their own material become a lesson they can inspect, question and work through?

KAIRO aims to connect source-linked explanations, supported interactive examples and evidence of practice in one simple journey. Reading and drawing remain useful alternatives to voice and 3D. We will test the learning/accessibility benefit with users rather than assume that a convincing avatar proves better outcomes.

### Overview

KAIRO Access is an interactive learning prototype. A learner uploads or pastes supported material, reviews the extracted text, and creates a local reading lesson or a consented AI-generated draft with source citations. KAIRO supports reading/narration, practice questions, notes, export and device-based resume. The engineering example lets a learner inspect a motor, explore its parts and check a supported speed calculation.

Our first complete use case is engineering. Current development connects lessons, supported studios and private practice evidence; programme/module selection, secure hosted identity/storage and the next lesson-quality packages are being integrated. Broader career matching, automatic opportunity feeds, validated skill credentials and signed-language translation remain future work. Current simulations are illustrative educational models, not certified equipment twins or validated professional assessments.

### Technologies actually used

Current application: React, TypeScript, Vite, Three.js, React Three Fiber/Drei, Node.js/Express, local files and a SQLite request-trace example, Python extraction/OCR tools, Blender/glTF avatar and equipment assets, installed Node tests and TypeScript build checks. Optional Google managed text generation and TTS use explicit consent; device speech depends on available voices. MediaPipe hand tracking is an isolated tracking package, not SASL translation. A server-only AIML adapter and bounded routing prototype are tested locally but are not active in the lesson API yet.

Planned deployment: Cloud Run, managed identity, private Cloud Storage, one canonical PostgreSQL store, queued extraction and durable usage limits. Candidate open-weight embeddings/ASR/LLM evaluation are documented but not deployed or fine-tuned. Do not list FastAPI, LiveKit, OpenCV, GSAP, Docker, GitHub Actions, production pgvector, live WebSockets or gaze navigation as implemented merely because they appeared in an earlier architecture idea.

## Lean Business Canvas — exact screenshot fields

### Problem statement (maximum two paragraphs)

Learners can have access to course information yet struggle to apply difficult ideas without a clear explanation and a chance to practise. Engineering students are an initial focus: notes about machines and fields can be hard to connect to parts, behaviour and calculations when guided practical access is limited.

The FNB access-to-higher-education challenge identifies learning/access barriers; our local prototype demonstrates a possible response, not proof of prevalence or learning gains. We need learner interviews and a measured concept-check pilot to validate the problem, preferred workflow and benefit. No unsupported national statistic or invented user sample is claimed.

### Solution and features

Reviewed material → cited reading/AI lesson → KAIRO narration or reading → supported motor exploration → practice and private working → export/resume. Next integration adds relevant programme/modules and a clearer lesson plan. Career/funding feeds and validated skills remain staged extensions. The product cannot automatically create a scientifically validated simulation from any document.

### Unique value proposition

Turn difficult material into something you can read, inspect and practise—with the source still attached. KAIRO connects the explanation to a supported interaction and a record of what the learner actually tried.

### Unfair advantage

No proven defensible unfair advantage yet. Our candidate advantage is a reusable connection between source revisions, reviewed teaching sequences, equipment interactions and evidence, built for the initial engineering use case. A moat would require validated content partnerships, user trust and demonstrated usefulness; no university/bank endorsement is claimed.

### Customer segments

Initial users: adults in university/TVET engineering modules and independent learners revising similar material. Initial buyers to test: university/TVET departments supporting specific modules and employers running introductory technical training. Private subscriptions are a separate hypothesis. No minors pilot or institution-provisioned access is claimed today.

### Key metrics

Measure time to first useful lesson, reviewed-source-to-lesson completion, citation/assessment correctness, task completion, return use and cost per completed session. Pilot target (not achieved): 5–8 consenting adult usability participants, with pre/post concept checks and observed errors. Actual paid users, verified traction and measured learning gains are not yet established. Do not paste that pilot target as a result.

### Distribution channels

Direct invitations to adult learners, module lecturers and student learning-support groups; a tested live demo link and QR once deployed; a small department pilot before broad rollout. No automatic LinkedIn/Instagram scraping or university distribution agreement is in place. Recruiters see only separately authorised public portfolios in a future release.

### Cost structure — figures with assumptions

Planning scenario, not vendor quote: 100 active learners × 4 completed sessions/month = 400 sessions. Assume a variable service allowance of R2/session (R800), R400/month infrastructure allowance, and R300/month operational allowance: **R1,500/month** before labour, tax, support, marketing, legal review or content licensing. At twice the assumed variable cost, total becomes R2,300/month. Measure actual token/audio/storage/egress usage before accepting these figures; no current cloud invoice or exchange-rate claim is implied. Promotional credits reduce cash paid temporarily, not underlying unit cost.

### Revenue streams — figures with assumptions

Price-test hypothesis: optional private enhanced usage at **R79/month**; 25 paying learners would yield R1,975/month gross, not validated revenue or profit. Compare that with measured usage/support cost and conversion, not just the R1,500 scenario. Institution pilot offer to test: **R2,500/month for one bounded module/cohort up to 50 seats**, with explicit usage caps and no outcome guarantee. Essential reading/accessibility remains free in the proposed model. No checkout, signed contract, FNB reward or paid customer exists in the inspected evidence.

## SSDLC — exact screenshot sections

### Security requirements / risk assessment

Protect course uploads, CV/profile information, lesson notes, attempts and voice/camera inputs. Principal risks are unauthorised access across users, unsafe/malicious files and URLs, prompt injection, stale source/lesson results, exposed secrets and uncontrolled API spend. Current local API is loopback-only and is not accepted for public private uploads. Hosted release requires verified identity, per-resource ownership/tenant checks, private durable storage, limits, retention/export/deletion and synthetic two-user negative tests. The pilot is adults 18+.

### Threat modelling and design review

Trust boundaries: browser ↔ API, API ↔ private store/queue, worker ↔ uploaded content, gateway ↔ model provider and optional camera ↔ local tracking worker. Uploaded text/media are data, never instructions authorising tools. Lesson citations bind exact reviewed source revision. External fetches must reject private-network/redirect targets. Provider fallback needs separate consent; camera tracking must not be described as SASL recognition. Use the repository threat model and new architecture for design review; do not claim all proposed controls are deployed.

### Development / secure coding practices

Current evidence includes validated IDs/inputs, parameter-bound SQLite trace, escaped React text, exact source citation checks, source-revision guards, cancellation/stale-result handling, local host/origin restrictions, no keys in client code and scoped worker ownership. New isolated provider adapter has fixed endpoint, bounded response size and no arbitrary tool execution. Hosted owner/auth/storage controls, durable distributed spending limits and Linux parser isolation remain next implementation. Do not claim SOC/ISO/POPIA certification or zero vulnerabilities.

### Security testing

Automated checks cover source/citation validity, resume/corrupt-record preservation, narrator cancellation, controlled rendering, module source filtering, provider consent/fallback/idempotency and stale responses. Signing tests use mocked camera dependencies and hash-pinned assets, not real camera acceptance. Record exact current run from verification.json/tests.txt rather than an old all-green count. Penetration testing, real browser/device/accessibility checks, hostile-file Linux extraction and hosted two-user isolation have not been accepted. Dependency audit/SAST/DAST coverage must be recorded only after real execution.

### Assessment and secure integration

Release is gated on authenticated private uploads, owner-filtered persistence/retrieval, restart durability, limits/retention/deletion, current-source checks, cost admission and rollback. Deploy synthetic fixtures first; a successful build alone does not approve a public learner-data release. Keep optional experimental capabilities labelled and independent. Root reviews worker handoffs and actual test output; no silent weakening of tests or bypass of the type checker.

## Daily progress update — draft for tonight

**Progress selector:** the screenshot does not define what 0–10 means. Suggested **6/10 as a subjective prototype-stage estimate**, not an official score or percentage completed; user should adjust after the current deployment checkpoint.

**Accomplished:** We connected the branded KAIRO source-review, cited lesson, reading/narration, practice, notes/export and resume journey. The engineering example now has contextual part explanations, checked calculations and one shared narrator. The module catalogue/chooser packages passed independent focused review tests, and the signing type issue was fixed and independently checked. We saved the submission forms, prepared a cloud/model architecture and implemented an isolated AIML routing prototype with consent, cancellation and idempotency checks. New Luna packages refine lesson structure and first-start/resume clarity; their actual final status must be checked before submission.

**Challenges:** Public deployment with safe per-user identity and durable private uploads is still outstanding. Full programme coverage and motor-topic mapping need further review. Real device/accessibility, educational benefit and paid demand are not validated. AIML's reported credit is not yet connected through a server secret. The prototype gateway needs a durable transactional allowance store before cloud integration.

**Next focus:** Finish root review/integration of lesson packages; implement hosted identity/ownership, Linux extraction and durable storage; run synthetic two-user and remote restart checks; prepare the real user-led 20-second pitch and a truthful working demo. Update the profile, SSDLC and Canvas to distinguish implemented features from roadmap claims, then submit the nightly progress update manually before midnight.

These paragraphs are ready to review/paste, not already saved to Sonke. Check their date/status before submitting. No schedule has been recreated.
