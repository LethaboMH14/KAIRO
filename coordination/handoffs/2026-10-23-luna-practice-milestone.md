# KAIRO practice milestone card — handoff

Worker: `codex-luna-practice-card-20261023-f`, Codex / `gpt-6-luna` / low. Task `PRACTICE-MILESTONE-001`, claimed paths: `studio/src/practice-milestone-ui/`, `studio/tests/practice-milestone-ui.test.mjs`, `docs/practice-milestone-ui-20261023/`, this handoff.

## Judging target / outcome

Product correctness and Usability through an honest practice record; Impact through clearly bounded self-directed evidence. Need: learners can understand what happened, whether help was used, and what to do next without mistaking practice for credential or saving confirmation.

`PracticeMilestoneCard.tsx` is stateless and accepts the published attempt/progression/busy/callback props with local types. It preserves host-supplied outcome and assistance, labels correct assisted attempts as help-used, renders unscored reflection as not scored, preserves unknown assistance, rejects invalid progression rather than clamping, and uses callback-gated controls with direct busy guards. Timestamp fallback is explicit. No scoring, persistence, sharing, fetching, model call, narration or IDs. A decorative C-compatible star is static; no XP, mastery percentage, level, employability or certification claim.

Root review follow-up fixed the correct/unknown case: the outcome line says help was used only for a known hint or worked-example state. Unknown assistance remains unknown in both the detail and outcome line.

`docs/practice-milestone-ui-20261023/README.md` contains the source-only mapping audit. It reviewed the current attempt/event sources and notes that missing assistance is unknown, open response is unscored, rubric completion is not certification, and save callback is not save evidence.

## Verification

- `node --test tests/practice-milestone-ui.test.mjs` from `studio/`: exit 0, **10/10 passed** after the wording correction. Vite middleware SSR loads and renders the actual TSX; element callbacks are invoked directly. Fixtures are clearly synthetic.
- `.\node_modules\.bin\tsc.cmd --noEmit` from `studio/`: exit 0, no diagnostics.
- No browser/device, learner, educational outcome, cloud, install, route or release acceptance is claimed.

Parent owns integration and any mapping from existing practice events to the supplied attempt contract; do not infer missing assistance or provenance. A callback only requests host action; host must separately report whether saving succeeded.
