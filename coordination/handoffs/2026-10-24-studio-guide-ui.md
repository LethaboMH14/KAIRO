# StudioGuide UI handoff — 24 October 2026

Owner: `codex-studio-guide-20261024-c` (Codex, actual model `gpt-6`; effort `unknown`). Task `STUDIO-GUIDE-UI-001`.

## Need and judging criteria

The learner needs one clear teaching presentation alongside the motor/pump task: current context, KAIRO's readable response, useful next actions, accessible reading controls and inspectable evidence. This work targets Product (contextual guidance beside the task), Usability (plain actions and visible text), Presentation/Creativity (one contextual KAIRO panel and host visual slot), Sustainability (stateless component), and Intelligence (bounded authored guidance and sources with no predictive claim).

## Changed files and interface

- `studio/src/studio-guide-ui/StudioGuide.tsx`: default `StudioGuide`, typed props per `docs/experience-connected-20261024/CONTRACT.md`, with actual `CoachIntent` and `CoachResponse` types.
- `studio/src/studio-guide-ui/studio-guide.css`: responsive chalk/moss presentation, visible keyboard focus and reduced-motion treatment.
- `studio/tests/studio-guide-ui.test.mjs`: actual Vite SSR component and callback tests.
- `docs/studio-guide-ui-20261024/README.md` and `CHECKS.txt`: target, evidence and limits.

The visual slot is supplied by the root integration; without it the component uses a KAIRO-labelled neutral portrait placeholder. The response text is visibly marked for reading/captions. Source disclosures render only absolute HTTPS links without URL credentials and use `target="_blank" rel="noreferrer"`. All four intents and read/pause/stop/access events delegate to caller props. The guidance remains authored and deterministic through the existing coach model.

## Evidence

`node --test tests/studio-guide-ui.test.mjs` from `studio/`: 6 passed, 0 failed. See `docs/studio-guide-ui-20261024/CHECKS.txt`.

## Remaining gaps and next step

Root integration still owns context wiring, shared teacher playback/status and access behavior, and providing the optional avatar. This handoff does not establish full build, browser/device behavior, camera use, voice/language availability, human usability, learning benefit or release acceptance. No dependencies or host files were changed. Root should independently review the component, mount it through the agreed host slot, and run integration checks.
