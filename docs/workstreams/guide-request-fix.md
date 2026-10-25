# Guide request race and readiness copy fix

Date: 2026-10-22  
Owner: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low)  
Task: `GUIDE-REQUEST-RACE-FIX-001`

## Change

The Computer Science guide request now carries a generation token for its question/topic/stage context. Context changes synchronously invalidate in-flight success and error results, clear the displayed answer/error, and reset the pending indicator. Starting a newer request supersedes an older request, and unmount invalidates pending callbacks. The `/api/ask` route, request payload, authorization behavior, and UI form contract are unchanged.

The readiness state is now named `cloudConfigured`; the successful status copy says cloud questions are configured for this server session and that availability is checked when asked. It makes no live-provider claim. A failed/non-OK local health request leaves the action disabled as before.

## Changed files

- `studio/src/App.tsx`
- `studio/src/guide-request/request-state.js`
- `studio/tests/guide-request.test.mjs`
- `docs/workstreams/guide-request-fix.md`
- `coordination/handoffs/2026-10-22-codex-guide-request-fix.md`

## Checks

- `node --test tests/guide-request.test.mjs` from `studio/`: **6 passed, 0 failed**. Cases cover late answers after stage/topic changes, late errors after a question change, an older request settling after a newer request, unmount invalidation, and current-context answer/error delivery.
- Scoped TypeScript check for `src/App.tsx`: `node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --target ES2022 --module ESNext --moduleResolution Bundler --allowSyntheticDefaultImports --skipLibCheck src/App.tsx` from `studio/`: **exit 0**.

No browser, live API/provider call, full app build, deployment, or shared configuration change was performed. Independent root review remains pending.

## Review follow-up: autoplay and Strict Mode

Root review found that routing automatic stage advances through the manual selector stopped playback after one stage. The transition now has two explicit paths: automatic ticks consume an autoplay step and preserve `playing` until the final stage; manual stage selection changes the guide context while preserving the current play/pause choice. The explicit Play/Pause control remains the playback intent control, and pausing on the last stage no longer resets the scene. Added transition-helper coverage for all four stages, explicit pause, manual selection while paused/playing, and gate reuse after Strict Mode's simulated effect cleanup. See the follow-up handoff for results.


## Strict project TypeScript follow-up

The project-configured strict check found that the JavaScript helper import had no declaration and left the request callback untyped. Added `request-state.d.ts` with the real context, stage state, discriminated request events, gate methods, and async request callback signature. No `any`, suppression, or compiler-option change was introduced. `npx tsc --noEmit -p tsconfig.json` from `studio/` now exits 0; the focused behavior suite remains 9/9.
