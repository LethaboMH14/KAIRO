# Guide strict TypeScript fix handoff

- Agent/session: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low)
- Task: `GUIDE-STRICT-TYPES-FIX-001`
- Scope: `studio/src/App.tsx`, `studio/src/guide-request/`, `studio/tests/guide-request.test.mjs`, `docs/workstreams/guide-request-fix.md`, and this unique handoff.
- Fix: added `request-state.d.ts` adjacent to the retained JavaScript helper. The declaration covers context fields, playback state, discriminated request-state events, gate methods, and promise/callback types; App.tsx now resolves the helper import and has a typed `onState` callback under strict project options.
- No `any`, `@ts-ignore`, tsconfig changes, API changes, or dependency changes.
- Checks: `npx tsc --noEmit -p tsconfig.json` from `studio/` — exit 0, no diagnostics. `node --test tests/guide-request.test.mjs` — 9 passed, 0 failed. No unrelated diagnostics remained in this check.
- No full aggregate, Vite build, browser run, or live API/provider call; root owns the repair-triggered aggregate/build rerun.
