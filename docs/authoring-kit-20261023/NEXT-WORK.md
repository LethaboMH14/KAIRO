# Implementation sequence after research

Proposed next work; these scopes are not claimed or dispatched for implementation by this research task. Check current bus before any change. Research completion does not authorize deployment, installs or billing.

| Order | Work and ownership | Concrete acceptance before moving on |
|---|---|---|
| 1 | Root: freeze source snapshot, lesson block and expected-version API contract; reconcile existing chapter/quiz records | Old lessons remain readable against their original source; two concurrent edits cannot overwrite silently; unsupported schema leaves original data untouched |
| 2 | Root backend + separate Luna display package: retained-original review, access controls and deletion policy; PDF/image comparison component | Current original/extraction page agrees; OCR corrections retain source locations; unavailable original is explicit; private files never become public static assets |
| 3 | Root: draft store and versioned adapter; Luna: stateless block editing controls under frozen props | Add/edit/delete/split/reorder via keyboard; undo; refresh recovers acknowledged save; quota/write failure preserves draft and export |
| 4 | Separate isolated Puck composition spike, only if native template controls are insufficient | Two allowlisted layouts, content/citations survive round trip, no duplicate WebGL/narrator mount, keyboard/mobile tests later authorized; no main manifest changes before evidence review |
| 5 | Root: selected-block model proposal and diff/approval integration | Correct request/source/brief versions; no silent changes; exact approved content committed; refusal/timeout/cancel/stale output preserve current work; bounded cost and provider consent |
| 6 | Root: motor/pump activity adapter, shared teacher and evidence integration | Actual declared inputs/results, units and assistance records; reading/diagram parity; one active heavy scene; stop/unmount/resume tested; pump case values labelled authored |
| 7 | Independent domain and learner/device review when permitted | Review numeric/question correctness; observe real start-to-resume tasks, keyboard/phone/audio; record actual failures and completion, no inferred learning gain |
| 8 | Root: authenticated, durable, budgeted staging deployment preparation | Owner isolation, transactional store, object retention/delete, secrets, cost cap, rollback and real reviewer access; deploy only within explicit authorized scope |

## First complete acceptance story

A learner brings an allowed public motor passage, compares its original page, corrects extraction and saves a revision. They choose a goal and get an editable draft. They shorten one explanation, move the worked example before practice, preview a proposed change and approve it. The lesson shows an exact source passage beside a prepared motor diagram. They predict 50 Hz/four-pole field speed, check a validated calculation, explain field-versus-shaft limits, attempt a changed-input problem, save their working and resume that exact version. An unsupported document/topic still produces useful source reading without invented simulation capability.

## Quality gates, not a perfection promise

| Criterion | Need and acceptance evidence | Current result / open gap |
|---|---|---|
| Product | Complete edit -> approve -> read/practise -> save/resume | Isolated edit contract/demo; live editor/store/adapter still required |
| Creativity | Source-grounded activity and inspectable layout choice | Concrete motor/pump design; not broad automatic world generation |
| Usability | Clear next action, reversible edits and recovery | Contract safeguards; real editor/keyboard/phone observation open |
| Sustainability | Replace editor without losing canonical lessons; bounded provider cost | No-dependency kit and staged candidates; actual operating cost unmeasured |
| Impact | Reading works without avatar/3D; equitable meaningful practice | Designed alternatives; learning/access benefit not measured |
| Presentation | Truthful source, origin, calculated/simulated labels | Static demo and explicit limitations; live accepted demo pending |
| Intelligence | Purposeful model tasks plus verifiable rules and explained adaptation | Proposed task routing and tested structural checks; semantic/ML validation open |

Use finite acceptance fixtures and defect severity to decide readiness. No architecture can guarantee absolute perfection or every future file/task. Capture failures, add a representative fixture, fix the owner layer and independently recheck affected behavior.
