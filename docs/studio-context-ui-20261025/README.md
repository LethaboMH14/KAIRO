# Studio context summary UI

Package B adds a stateless context summary for a future reviewed studio mount. It shows the lesson, selected part, supplied variables, source titles/locators and whether the context is current, changed or unavailable. It does not generate a question, narrate, fetch data or own context state.

The learner need is to know which lesson and studio state KAIRO can use before asking. This supports Product (contextual studio flow), Usability (plain unknown and changed states), Presentation (visible cited basis) and Intelligence (bounded, inspectable context rather than implied omniscience).

Acceptance evidence: `studio/tests/studio-context-ui.test.mjs` server-renders the actual component and checks content/escaping, missing context, disabled and guarded callbacks, unavailable fallback, and unique instance IDs. Run with `cd studio; node --test tests/studio-context-ui.test.mjs`. Human keyboard/device validation and root mounting remain open.
