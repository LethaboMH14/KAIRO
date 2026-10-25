# Vite SSR teardown / dependency-scan investigation — 25 October 2026

Issue #18. Session `gpt6-kairo-chief-20261025-1914-m`. Branch `fix/issue18-vite-ssr-idle-20261025-m`, based on main `1997ba9f046f6d4122169cb26a72e89cc60befd1`. Canonical SQLite bus unavailable remotely. All 37 open PR path lists were checked; none owns `studio/tests/lesson-editor-ui.test.mjs`. This branch touches only that test and this new report.

## Reproducible observation

The full Node24 serial suite in [GitHub Actions #40211052212](https://github.com/LethaboMH14/KAIRO/actions/runs/40211052212) passed 828/828 tests and the production build. Its app job 121222152903 emitted `Failed to run dependency scan` around 16:19:20 UTC immediately after the `lesson-editor-ui.test.mjs` SSR tests. The first stack includes `throwClosedServerError` in Vite's `EnvironmentPluginContainer.resolveId`, triggered by `vite:dep-scan` of the app HTML entrypoints. The run had 21 such warning headers according to the existing diagnostics. These warnings are nonfatal, but not proof of correct Vite lifecycle.

## Hypothesis and narrow correction

The lesson editor SSR test starts a real Vite server, loads a TSX component, then closes the server in a final test without awaiting the request-idle signal. The change adds `await server.waitForRequestsIdle()` immediately before `await server.close()`. This is Vite 7's documented *experimental* static-import-idle API. It **does not** disable `optimizeDeps`, alter app Vite configuration, suppress stderr, skip tests, or modify learner routes. It may not cover a separately scheduled dependency scan; that must be determined from real logs.

Official API: https://v7.vite.dev/guide/api-javascript

## Acceptance and limitations

Compare exact-head Actions against the baseline, using `node --test --test-concurrency=1 tests/*.test.mjs` from `studio`, `npm run build`, and `python -m unittest discover -s coordination -p 'test_bus.py' -v` at root. Inspect the first warning stack and count all warning headers, not downstream esbuild stack lines. Passing tests/build alone do **not** establish the lifecycle repair. If the warnings persist, do not merge as a proven fix: return for repair or treat as an experiment, and identify other Vite SSR server owners. No device/browser evidence or real learner data is claimed; this is isolated CI harness work, not a user-visible learner change. Rollback: revert the two-file commit on a reviewed branch. Judging: Sustainability/reproducibility only; other six criteria remain unknown.
