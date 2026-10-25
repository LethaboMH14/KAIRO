# Studio coach package — 24 October 2026

## Purpose and learner need

Learners in the Engineering and Pump Lab studios need a small, context-aware next step when they inspect a model, make a prediction or explain an observation. The coach provides authored prompts that help them use evidence without taking over the task.

## Judging criteria and acceptance

- **Product:** relevant bounded help for both current studios. Acceptance: motor responses distinguish rotating field speed from rotor/shaft speed; pump responses disclose the teaching model's illustrative status.
- **Creativity:** the learner predicts before checking. Acceptance: predict prompts request a prediction before a value or reading.
- **Usability:** keyboard-operable native controls and a reading alternative. Acceptance: semantic buttons, live narration status, source links, and callbacks that the shared provider owns.
- **Intelligence:** transparent contextual rules. Acceptance: deterministic authored intent responses; no forecast or learned-adaptation claim.

## Implemented behavior

`coachFor` takes only the contracted public context and returns a bounded authored response with prompt, citations and scope. Pump coach never reads case IDs, true causes, repairs or simulator state. It asks for the next gauge/section, expected observation, and competing explanations. Motor help cites the existing engineering content pack and keeps field speed distinct from rotor speed.

`CoachPanel` receives its response and speaking state as props. It exposes Explain, Hint, Predict and Check actions plus read, pause and stop callbacks. It owns no provider, speech clock, route, scene, storage or network behavior. KAIRO is the learner-facing teacher name.

Pump guidance links to the vetted pack's primary references: the US Department of Energy handbook operating-point section and Hydraulic Institute pages on pump curves/affinity rules and system operating point. The pack records that item-specific reuse licences were not confirmed; only citations and summaries are used. The links support general concepts, not validation of this model's coefficients. The model itself remains explicitly illustrative and not reviewed by a qualified engineering specialist.

## Evidence

- Actual coach model and React panel loaded through Vite SSR: `studio/tests/studio-coach.test.mjs`, 7/7 passed on 24 October 2026.
- Tests cover motor speed distinction and source links, all prompt intents, absence of hidden pump labels, invalid/bounded learner context, accessible SSR output and narration callback delegation.
- Scoped TypeScript check for the coach model and panel passed with `tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --types vite/client`. A prior full-project TypeScript run did not return within bounded waits and remains unconfirmed.

## Remaining gaps

Root must mount the panel around the shared TeacherProvider and supply only non-secret, non-hidden studio context. No browser, device, narrator/audio, SME or hosted acceptance was performed. The package does not validate pump behavior, establish learning gains, or provide real equipment diagnosis.


## 24 October review follow-up

Pump source links now use only the DOE and Hydraulic Institute URLs from `docs/engineering-pilot-packs-20261024/centrifugal-pump-pressure-flow.json`; there are no internal `/docs` or `/assets` paths that could fail on the hosted app. The panel heading reads “Learn with KAIRO”. Check-intent copy says it is a reflection prompt and does not mark the learner's answer. The updated focused suite passes 8/8.
