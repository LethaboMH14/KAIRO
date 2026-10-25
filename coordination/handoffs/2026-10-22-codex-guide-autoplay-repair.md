# Guide autoplay repair handoff

- Agent/session: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low)
- Task: `GUIDE-AUTOPLAY-REPAIR-001`
- Scope: `studio/src/App.tsx`, `studio/src/guide-request/`, `studio/tests/guide-request.test.mjs`, `docs/workstreams/guide-request-fix.md`, and this unique handoff.
- Root-review correction: automatic stage advance no longer calls the manual selection behavior that paused playback. `consumeAutoplayStep` advances stages 1 through 4 and stops only at the end; `selectGuideStage` preserves the current playback intent for manual selection. The explicit pause control stops playback without resetting a late-stage view.
- Strict Mode review: the gate cleanup only increments a generation, it does not permanently disable the gate. React Strict Mode's development effect cleanup/setup sequence can invalidate any old token and a later ask starts with a new generation. Focused test verifies successful requests after an invalidation replay; final unmount still invalidates pending results.
- Checks: `node --test tests/guide-request.test.mjs` — 9 passed, 0 failed. Scoped TypeScript check: `node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --target ES2022 --module ESNext --moduleResolution Bundler --allowSyntheticDefaultImports --skipLibCheck src/App.tsx` from `studio/` — exit 0.
- API request/path/body and provider configuration behavior unchanged. No browser, live API, full build, or deployment.

