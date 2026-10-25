# Worker B handoff — Studio coach core and UI

Session: `codex-studio-coach-20261024-b` · Codex · `gpt-6-luna` · low
Task: `STUDIO-COACH-001`

Criterion/subquestion: Product (does the supported studio give useful contextual help?), Creativity (does it invite prediction before checking?), Usability (can learners use controls and reading alternatives by keyboard?), Intelligence (is the next-step policy transparent and evidence-linked?).

Learner need: a learner exploring a motor or pump teaching model needs a manageable question that helps them inspect evidence and explain their reasoning.

Changed files:
- `studio/src/studio-coach/model.ts` — deterministic `coachFor(input)` for motor and pump, cites current packs, marks scope and simulation limits.
- `studio/src/studio-coach/CoachPanel.tsx` — stateless native controls, KAIRO identity, source links, live narration status, callback delegation.
- `studio/src/studio-coach/studio-coach.css` — inherited Manrope/C palette, keyboard focus and narrow layout.
- `studio/tests/studio-coach.test.mjs` — actual Vite SSR module/component tests.
- `docs/studio-coach-20261024/README.md` — evidence and gap record.

Interface: `coachFor` accepts `{studio:'motor'|'pump', selectedLabel?, nextStep?, readings?, finished?, intent}` and returns `{title,text,prompt,sourceLinks,scope}`. `CoachPanel` accepts the contracted response/speaking/paused/status and intent/read/pause/stop callbacks. Root owns all mounting and TeacherProvider wiring. Pump context is intentionally only display-safe selection/step/reading-count/completion context; no fault state is accepted.

Checks: `node --test tests/studio-coach.test.mjs` passed 7/7 (24 Oct 2026). Whole The focused Vite SSR suite passed 8/8 after source/copy revisions. Scoped TypeScript passed with explicit flags for the two package files. A previous full-project `npx tsc --noEmit -p tsconfig.json` did not return after repeated bounded waits; that aggregate result remains unconfirmed. No browser observation, cloud call, private learner data or route integration was used.

Source boundary: motor links are selected from `motorContent.ts` / `docs/engineering/content-review.md`. Pump links now use the vetted pack's primary DOE and Hydraulic Institute references (operating point, pump curves and affinity rules). Internal docs/assets URLs were removed because they are not present in the public served tree. The pack says item-specific reuse licences were not confirmed; citations and summaries only are used. Model coefficients remain illustrative, not measured or qualified-review validated.

Remaining acceptance: root should mount the UI with shared narration, verify it within the connected flow, and confirm coach prompts have no hidden pump state path. Browser/device keyboard and audio checks, engineering SME review and learner evaluation remain open. No forecast, mastery or learning-effect claim is made.


Review follow-up: panel heading changed to “Learn with KAIRO”; pump citations changed to primary DOE/Hydraulic Institute sources from the vetted pack; reflection wording now states it does not mark the answer.
