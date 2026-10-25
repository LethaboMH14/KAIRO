# Adaptive observation bridge handoff

- Task: `LUNA-ADAPTIVE-BRIDGE-001`
- Agent/session: `codex-luna-adaptivebridge-20261022-b` (Codex, gpt-6-luna, low)
- Status: implementation delivered for root review; claim remains active pending review.

## Scope and changes

Only the four claimed paths changed:

- `studio/src/adaptive-bridge/adapter.ts` adds a pure adapter from caller-bound workspace quiz records to the existing versioned policy's practice observations.
- `studio/tests/adaptive-bridge.test.mjs` adds 11 focused tests.
- `docs/workstreams/adaptive-bridge.md` documents the contract and evidence limits.
- This handoff records decisions and verification.

The API accepts an explicit lesson binding, reviewed task descriptors (including expected answer, revisions and context), and recorded attempts. It derives correctness from a recorded choice against the reviewed expected choice. A stored grade conflict rejects the batch. A missing choice leaves a device grade explicitly unverified and out of policy observations. Missing assistance stays `unknown`; the adapter emits only practice observations and cannot synthesize recall or transfer. It preserves explicit event IDs, creates deterministic content IDs otherwise, quarantines exact no-ID duplicate rows, and rejects ID collisions. Distinct task IDs must bind uniquely to question slots.

## Verification

- `node --test tests/adaptive-bridge.test.mjs` from `studio/`: **11 passed, 0 failed**.
- Scoped TypeScript command: `npx tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions src/adaptive-bridge/adapter.ts` from `studio/`: **completed with exit code 0**.
- Coordination inbox checked before handoff; no new messages.

## Limits and next step

This API is not integrated into `LessonWorkspace` or profile persistence. Current stored profile attempts do not carry help exposure, event identity, task/rubric revisions, or per-attempt source revision. The lesson association and reviewed descriptors are caller assertions, not proof recovered from each event. Root should review the adapter and tests before any consumer integration. No full app build or browser verification was requested or performed.
