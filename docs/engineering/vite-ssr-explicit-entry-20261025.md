# Vite 7 SSR explicit-entry hypothesis — 25 October 2026

## Scope and problem
Issue #18 remains open. The latest baseline `main@1997ba9f046f6d4122169cb26a72e89cc60befd1` has **21** `Failed to run dependency scan` warnings in the Node24 serial app-test job, with a `throwClosedServerError` stack near SSR fixture teardown; tests and production build still pass. Closed experiment PR #83 awaited request idle but did not reduce the warning count (21 → 21).

The isolated `studio/tests/lesson-editor-ui.test.mjs` fixture invokes Vite `createServer` only to SSR-load `src/lesson-editor-ui/LessonBlockEditor.tsx`. Its previous default optimizer entry discovery crawled unrelated HTML entrypoints. This experiment supplies `optimizeDeps.entries: ['src/lesson-editor-ui/LessonBlockEditor.tsx']`, a documented Vite 7 configuration option. It does **not** set `noDiscovery`, disable scanning, suppress logs, skip tests or alter production configuration. See https://v7.vite.dev/config/dep-optimization-options.

## Acceptance method
1. The existing editor UI SSR tests must still load the real module and exercise their existing assertions. The fixture now asserts that the optimizer entry is the real editor and dependency discovery has not been disabled.
2. Run the repository's complete serial Node24 test suite, Vite/TypeScript production build and Python bus checks on the **exact PR head** in GitHub Actions. Read actual logs, including warnings.
3. Count `Failed to run dependency scan` headers on the exact-head app job and compare with the 21-warning baseline; report first causal stack and any shifted warnings. Do not call a passing test suite a root-cause fix without measured reduction and causal evidence.
4. If warning count remains unchanged or other behavior regresses, close this experiment without merge. If improved, require independent exact-diff review and integrated-main gates under policy #34 before merge.

## Boundaries and judgement
Only a test harness and this diagnostic record change. Product, Creativity, Usability, Impact, Presentation and Intelligence learner outcomes remain **unknown**; Sustainability/CI signal quality is the relevant criterion. This cannot establish an end-to-end source → lesson → studio → attempt → evidence → resume journey. No learner data, recordings, secrets, cloud access, paid calls, production deployment or browser/device acceptance is involved. Canonical SQLite bus is not accessible to this remote session; the issue comment is a cooperative claim only.

**Status:** hypothesis awaiting exact-head CI; no result is asserted here.
