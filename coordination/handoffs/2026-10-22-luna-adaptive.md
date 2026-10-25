# LUNA-ADAPTIVE-001 handoff

**Owner:** `codex-luna-adaptive-20261022-a`  
**Client/model/effort:** Codex / gpt-6-luna / low  
**Initial task:** `LUNA-ADAPTIVE-001`  
**Review repair:** `LUNA-ADAPTIVE-002` (same four owned paths)  
**Scope:** `studio/src/adaptive`, `studio/tests/adaptive.test.mjs`, `docs/workstreams/adaptive.md`, this handoff

## Delivered

- Added `studio/src/adaptive/policy.ts`, a pure versioned policy (`kairo-practice-policy-v1`) that recommends source/worked-example review after an incorrect latest attempt, a faded-hint changed-context task after helped/unknown-support success, delayed independent recall after independent success, and changed-context transfer after a qualifying delayed independent recall.
- The request is scoped to one concept and exact source/task/rubric revisions. Other concepts are counted and ignored; revision mismatches are counted and excluded. Malformed, duplicate, future, and reversed-time records are reported and block promotion from partial history. Attempt views and the first attempt remain visible.
- Follow-up repair validates Gregorian calendar dates, clock components, and offsets before calling `Date.parse`, for observations, `request.now`, and learner-choice timestamps. Leap-year rules reject impossible rollovers such as February 30 and non-leap February 29. Enum fields and learner actions require actual strings; boxed strings and coercible objects are rejected.
- Learner choices are returned separately from the computed action and never become evidence. Invalid choices are flagged. The policy exposes its default delay and limits as configurable product heuristics; it does not claim mastery, ability, diagnosis, or learning outcomes.
- Added authored synthetic cases in `studio/tests/adaptive.test.mjs` and public research/contract boundaries in `docs/workstreams/adaptive.md`.

## Checks

- `node --test tests/adaptive.test.mjs` from `studio/`: **13 passed, 0 failed**. Includes rollover, leap-year, request/choice timestamps, and non-string enum regressions.
- `npx tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions src/adaptive/policy.ts` from `studio/`: **passed**.
- The same scoped TypeScript command without `--skipLibCheck` stops on unrelated installed `@types/three` declaration errors (`GPUTexture` missing in `ExternalTexture.d.ts`). The adaptive source checks successfully when ambient library declaration checking is skipped.

## Boundaries and next steps

No consumer, profile persistence, route, browser flow, provider, or app manifest was changed. The current module is a foundation for a separately reviewed adapter. Its 24-hour default is not a validated spacing schedule; KAIRO outcomes still require reviewed tasks and pilot evaluation. Root should review API integration and the full application build.
