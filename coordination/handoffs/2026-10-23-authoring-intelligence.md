# Authoring intelligence research handoff

Date: 23 October 2026 (Africa/Johannesburg)  
Agent: `codex-authoring-intelligence-20261023-a`; Codex, model/effort `unknown` because the client does not expose those settings.  
Task: `AUTHORING-INTELLIGENCE-001`; claimed before edits.  
Scope: `docs/authoring-intelligence-20261023/` and this handoff only.

## Delivery

- Added `docs/authoring-intelligence-20261023/README.md`: a staged parse → goal → retrieve → outline → generate → deterministic validation → propose/approve → render → assess → adapt/save flow; provider/task matrix; proposed lesson JSON and prompt-data record; induction-motor worked example; evaluation fixtures and measures; seven-criterion learner need/acceptance/evidence/gap map; primary-source links.
- No source, package, product, browser, cloud, model, schedule, or installation action was taken. Research used official provider documentation and primary learning-science sources; no app tests were run because this is a documentation/research package.

## Evidence and decisions

The local-code evidence is linked and summarized in the package: isolated lesson quality planner (9/9 recorded tests), material planner (7/7 recorded tests), deterministic adaptive policy with an explicitly unvalidated 24-hour default, and the unmounted AI gateway prototype with per-request cancellation/current-revision/consent/price checks. The package does not present those recorded package checks as route, browser, learner, or release acceptance.

The proposed exchange keeps model output in `draft/proposed` state, checks exact source revision and quotes in application code, routes calculations through reviewed deterministic functions, renders only allowlisted components, and leaves approval with a person. The motor example follows the existing squirrel-cage three-phase induction motor and distinguishes synchronous field speed from shaft speed. No learning-style diagnosis, trained model, measured educational outcome, quality score, production readiness, or provider price/latency comparison is claimed.

Relevant official references are linked in the package: Google Gemini structured-output limits and Vertex sample/error documentation, Google prompt-injection notes, the repository's AIML adapter plus official AIML gateway overview, IES/AERO/EEF instructional guidance, and a 2025 stepwise worked-example retrieval study. Google JSON structure does not establish semantic correctness. Current model/region/price/cancellation entitlements remain unverified for any future live comparison.

## Judging criteria

| Criterion | Learner need | Observable check | Evidence in this delivery | Remaining gap |
|---|---|---|---|---|
| Product | Keep source, draft and saved lesson tied to the same version | A source revision change invalidates pending/generated claims | Proposed staged exchange and exact-revision gate, grounded in existing source workspace/planners | No integrated state machine |
| Creativity | Turn a difficult idea into an example plus learner action | Induction-motor example has worked steps then changed-context practice | Existing motor model/calculator and linked evidence | Proposed lesson needs subject review |
| Usability | Understand what is proposed and recover from failure | Draft, approve, reject, missing evidence, timeout and local fallback states are explicit | Flow, failure table and data examples | No UI or learner testing |
| Sustainability | Bound model/provider cost and preserve local path | Each task has cap, consent, deadline and explicit fallback | Existing unmounted gateway behavior documented | No production durable budget ledger/provider measurements |
| Impact | Practise and resume with honest evidence | First attempt, help, revisions and uncertainty remain explicit | Existing adaptive schema/policy and proposed eval protocol | No pilot/outcome evidence |
| Presentation | See which source supports each statement | Every factual claim maps to a reviewed quote/locator or visible unknown | Existing material citation gate and proposed contract | No generated lesson approval/render integration |
| Intelligence | Apply models to flexible language and deterministic code to verifiable facts | Bad citation, unit, stale result or unknown renderer component is rejected | Existing isolated planner, gateway and formula function plus proposed gates | No integrated validator or provider eval corpus |

## Checks and remaining work

The handoff and design package were read back via filesystem output; no tests were run. Root synthesis should treat this as a proposal and independently verify interfaces before integration. If an implementation task follows, it needs separate claims for any source/runtime paths and a small synthetic fixture suite plus route/browser/accessibility acceptance defined by its owner.

## Independent review correction (23 October 2026)

Root review identified two stale/incorrect statements; this follow-up corrects them in the research package.

- Provider attribution now points to [AI/ML API documentation](https://docs.aimlapi.com/), matching the repository endpoint `api.aimlapi.com`. The prior `docs.ai.ml` link was a different domain and is removed. The provider's Gemini 3 Flash Preview model page documents a model-specific JSON Schema response format, in addition to older JSON mode. This is not general evidence for every model or KAIRO configuration; exact-model schema fields, entitlement, region and cost still require verification. Current adapter code itself remains on `json_object` mode.
- Integration scope is now traced to source call sites. `lesson-plan-quality` is called by `journey-integration/model.ts` and used by `LessonEntry.tsx` for reviewed-lesson entry gating. `material-lesson-plan` is called by `SourceWorkspace.tsx` for the planning panel. These packages are integrated in those bounded roles, while the proposed multi-step authoring state machine is not implemented. `adaptive/policy.ts` and `adaptive-bridge/adapter.ts` have no production call sites in `studio/src`; current profile recommendations instead use `profile/model.ts` through `LessonWorkspace.tsx` and `ProgressPage.tsx`.

No runtime changes or tests were made. The research package now distinguishes these current integrations from the still-proposed architecture and reports current adaptive recommendations without attributing them to the isolated policy module.
