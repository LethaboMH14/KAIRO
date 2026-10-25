# Google tooling, agentic lessons and spatial learning

Research checked 24 October 2026 SAST. Recommendations below are design/architecture decisions proposed for KAIRO, not installed services, a deployment receipt or pricing quote. Primary documentation links support capabilities; the choice and tradeoffs are our analysis. Cloud naming changes quickly: verify exact API/version/region before implementation.

## What helps with layout?

**Stitch** is Google's design-assistance tool. It can help explore screens, carry design rules via DESIGN.md and connect design/code workflows. It is separate from Google Cloud runtime services. Use it with KAIRO's existing C palette and actual states rather than regenerating the whole brand. Generated screens still need real data, authorisation, source integrity and tested interactions. [Google's Stitch description](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/).

**Document AI layout parsing** means document structure extraction, not designing an LMS screen. It can retain elements such as headings and tables across supported PDF/Office formats. Limits differ: DOCX nested tables, PPTX hidden slides and XLSX multiple-table detection have restrictions. Candidate Gemini parser versions differ from stable versions; some use global routing. This is a potential optional escalation for difficult imports, not evidence we understand every file/image. [Layout parser](https://docs.cloud.google.com/document-ai/docs/layout-parse-chunk), [regions](https://docs.cloud.google.com/document-ai/docs/regions), [pricing](https://cloud.google.com/products/document-ai/pricing).

The region documentation does not list africa-south1 for Document AI. Therefore the existing Johannesburg storage/backend does not imply Johannesburg document processing. Require a processor/version/region decision, disclosed processing destination, measured synthetic evaluation and per-user page limit before enabling private-document use. Review price units for the chosen processor; no blanket free-all-formats claim.

**A2UI** is an open declarative UI protocol created by Google, not an LMS product. Its component catalogue pattern is a useful model for agent-selected activities without executing generated code. Evaluate an adapter to KAIRO's existing validated block model; don't replace that model merely to adopt a protocol. Pin a supported specification/renderer and test custom activity compatibility. [A2UI](https://a2ui.org/), [concept](https://a2ui.org/introduction/what-is-a2ui/).

## Smallest useful cloud stack

| Piece | Proposed KAIRO use and time saved | Tradeoff, fallback and acceptance gate |
|---|---|---|
| Existing Identity Platform | Account identity; root mounts login/session and implements revoked/disabled-account policy | Identity alone does not isolate material. Test two accounts, refresh, logout and stale response handling before public access |
| Existing private Cloud Run | Server/API and bounded extraction/model adapter; retain one deployment path initially | Runtime minutes/CPU and cold starts cost money; keep limits and deterministic reading fallback. Do not mount global local workspace as multi-user |
| Existing private GCS | Owner-scoped original files, versioned derivatives and static assets with rights manifests | Server validates owner before issuing short-lived object access; signed links are bearer access until expiry. Never log or publish them. [Signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls) |
| Existing Firestore | Owner-scoped source metadata, jobs, immutable review/lesson revisions and progress | Server IAM clients require server authorisation logic; client rules are not a substitute. Keep conditional writes/isolation tests. [Server security](https://docs.cloud.google.com/firestore/native/docs/security/iam) |
| Cloud Tasks candidate | Durable background imports/evaluations with retry and dispatch limits | Delivery can repeat; idempotent handlers and durable cancellation state required. No guaranteed completion latency: don't use as the live speech/scene-control loop. [Tasks](https://docs.cloud.google.com/tasks/docs/dual-overview) |
| Workflows later | Explicit multi-service orchestration if imports span several long-running services | Extra state machine and per-step costs; don't also run the same job logic in multiple orchestrators. [Workflows](https://docs.cloud.google.com/workflows/docs/overview) |
| ADK or LangGraph evaluation | A bounded agent workflow with typed state, tools, human checkpoints and traceable outputs | Choose one after the same resume/cancel/cost test. ADK aligns with Google agent deployment; LangGraph aligns with the existing JS orchestration proposal. In-memory checkpoint examples are not durable production storage. [ADK](https://adk.dev/), [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence), [Cloud Run agents](https://docs.cloud.google.com/run/docs/ai-agents) |
| Optional Document AI | Escalate difficult layout/OCR after local extraction and explicit consent | Processor/region/price gates above; human review remains. Keep source page/region anchors and partial-coverage disclosure |
| Existing model adapters | Lesson proposal, cited explanation, translation; route by consent, capability, availability and budget | JSON/schema/citation validation is separate from semantic accuracy. No silent paid fallback; free-tier eligibility is account/provider-specific |
| Static hosting decision | Single-origin Cloud Run frontend initially; Firebase Hosting is an alternative for static assets | Adding hosting now introduces origin/routing decisions. Compare measured asset delivery and cost before splitting. [Firebase Hosting](https://firebase.google.com/docs/hosting) |
| BigQuery later | Minimal consented learning-event aggregates and evaluated descriptive analysis | Not source storage, transactional progress or automatic intelligence. No collection currently enabled; raw material/answers/audio excluded. Define retention, deletion and query byte caps first |
| Classroom / LTI later | Enter KAIRO from institutional assignments instead of asking a learner to reconstruct their course | Classroom add-ons need eligible Workspace licences and publication/review; LTI needs actual platform deployment/role checks. [Classroom add-ons](https://developers.google.com/workspace/classroom/add-ons), [LTI Advantage](https://developers.imsglobal.org/lti-advantage-overview) |

Existing foundation claims above come from the dated hosted-foundation handoff and code, not a fresh cloud configuration audit in this research wave. Full learner UI/private source migration remains incomplete. No new resource has been provisioned by this document. Cloud budget alerts should complement hard app quotas: budgets generally notify rather than cap usage. [Budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## Agent decisions through the real task

| Stage | Deterministic boundary | Where model judgment helps | User-visible result / failure |
|---|---|---|---|
| Receive file | Authenticate, authorise owner, byte/type/hash/expansion checks, immutable original | Classify content only after permission and safe parsing | File accepted or exact supported alternative; previous work remains |
| Extract | Format adapter, page/slide/cell locators, coverage and bounded OCR | Interpret selected diagrams/tables when a vision-capable route is explicitly enabled | Extracted text, visual regions and unknowns separately; no 'complete' from nonempty text |
| Review | User corrections create new immutable reviewed revision | Suggest uncertain regions and relationships | Compare source/interpretation, accept/edit; model suggestion never overwrites original |
| Plan | Validate block IDs, prerequisites, citations, allowed activity types and asset rights | Choose explanation sequence, example and practice suited to stated goal/observed attempt | Editable proposal: 'Why this activity?' based on goal/evidence, not hidden reasoning |
| Compose | Renderer accepts allowlisted blocks/controls; simulator computes numerical output | Suggest a known studio action or accessible equivalent | Reading/diagram/3D options; unsupported scene action becomes plain explanation |
| Practise | Record attempt, hint use, settings and output with revision | Give bounded feedback and propose next task | 'Try a smaller step because…'; no unsupported mastery/hiring score |
| Save/share | Owner-scoped conditional write, export and explicit audience selection | Summarise selected evidence without adding achievements | Accurate saved/failed status; private by default; sharing revocable |

MCP is an adapter interface, not permission to expose every tool. Proposed agent tools: read reviewed source spans; inspect current lesson/scene state; calculate field speed; propose draft patch; select known highlight; retrieve approved reference metadata. Session identity and owner scope are injected by server, never accepted from a model argument. Publishing, sharing, deleting, paid generation and enrolling/applying are separate user actions. Uploaded text cannot grant tool permissions. Tool receipts describe inputs/outputs/status, not hidden chain-of-thought.

A proposed durable job identity includes ownerId, sourceId, reviewedRevision, goalHash, workflowVersion and idempotencyKey. Events contain sequence, stage, state, completed/total when known, errorCode and recoverable action. A retry reuses the same operation identity; an intentional new lesson uses a new identity. Cancel persists a terminal intent, stops work where possible and discards late results without destroying the original. This is a proposal, not the current stop-waiting implementation.

## Spatial references and deliberate choices

| Reference | Documented feature worth studying | KAIRO interpretation and rejected shortcut |
|---|---|---|
| PhET | Research-led simulation design and learner interviews; their research distinguishes conceptual learning from equipment skills | Use one changeable variable and a clear prediction question. Run think-aloud sessions; do not borrow PhET learning-effect claims. [Research](https://phet.colorado.edu/en/research) |
| Labster | Simulation entry through a school portal/account and student progress dashboard | Give a task/learning objective and return point before opening a room; proprietary content is not a free asset library. [Student guide](https://help.labster.com/en/articles/3016151-student-labster-101-getting-started-with-labster) |
| Spatial | Templates, content/model upload, hosted spaces and voice/text interaction | Reusable room templates are useful; a multiplayer world adds moderation, cost and navigation load. Defer it until a real collaborative task justifies it. Marketing outcome numbers are not KAIRO evidence. [Education](https://www.spatial.io/education) |
| React Three Fiber | On-demand rendering, asset reuse and adaptive performance techniques | Keep the existing Three/R3F stack. Stop rendering when safe/idle, lazy-load rooms, provide reading mode. Animations still require proper invalidation. Measure on target devices. [Scaling](https://r3f.docs.pmnd.rs/advanced/scaling-performance) |
| H5P | Authored branching activities with choices/feedback/endings | Evaluate a content adapter for structured scenarios; don't install a second entire LMS or execute arbitrary untrusted packages. Audit hosting, licences and accessibility per content type. [Branching scenario](https://h5p.org/branching-scenario) |

KAIRO's proposed twist is a persistent 'evidence trail': the source passage, prediction, changed variable, observation and explanation remain linked even when the learner switches between reading and 3D. A studio unlock is tied to a supported objective, not a decorative reward. Motor/pump authored packs can seed this after mounting and subject review; arbitrary uploaded content does not yet create a valid simulation.

## Decisions and rejected alternatives

1. Keep a stable React shell and current validated lesson-block model; evaluate declarative agent composition behind it. Reject unrestricted generated HTML/JS as the default lesson runtime.
2. Keep Three/R3F; no Babylon/Unity/WebXR rewrite for this flow. Revisit only for a measured missing capability.
3. Keep one server-authorised data path first. Reject mixing client direct database access with server ownership rules without a tested policy.
4. Build one durable import/lesson workflow before a swarm of agents. ADK/LangGraph choice requires a small comparable spike; installing both is not intelligence.
5. Prioritise account/source privacy and truthful extraction over a public social feed, VR lobby or BigQuery dashboard. The latter are not prerequisites for an excellent private learner experience.
