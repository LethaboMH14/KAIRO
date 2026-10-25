# Issue #18 — evidence-first Vite scan warning diagnostics (25 October 2026)

## Verified observation (not a root-cause conclusion)

On GitHub Actions [KAIRO checks run 40164524014](https://github.com/LethaboMH14/KAIRO/actions/runs/40164524014), app job `121082962678` at approximately **05:12:06 UTC**, the first `Failed to run dependency scan` warning lists `studio/index.html` and character, engineering, pump-lab and signing preview entries. The first reported exception is `The server is being restarted or closed. Request is outdated`, with `throwClosedServerError` in Vite's `EnvironmentPluginContainer.resolveId` during `vite:dep-scan`. The job ultimately passed the full Node24 serial suite and production build. The log contained **21 warning headers**, which are not 21 distinct proven root causes.

**Hypothesis only:** asynchronous dependency prebundling overlaps Vite server teardown/restart in an SSR test. Neither the responsible test nor the lifecycle edge has yet been isolated. This change does **not** repair that race, silence logs, disable optimizeDeps, alter app runtime, or treat a green CI job as red.

## Diagnostic helper

`node tools/vite-scan-diagnostics/analyze.mjs <downloaded-github-job-log.txt>` outputs a bounded JSON summary: warning header count, suspected cause category, first error/stack function and relative HTML entries. It strips ANSI and GitHub timestamps, excludes absolute runner paths from the structured report, caps input at 16 MiB and does not send logs anywhere. Input may also arrive through stdin. No logs or learner data are committed.

`node --test studio/tests/vite-scan-diagnostics.test.mjs` exercises deterministic synthetic log fragments; full GitHub Actions Node24 serial tests/build/bus must still run at the PR head. These parser tests are **not** evidence of a fixed Vite lifecycle or actual browser QA.

## Next dependency-ready repair

An independent CI Reliability Engineer should identify the exact test creating/closing the Vite server, capture the first warning and stack under an isolated Node24 reproduction, then amend only its owned lifecycle teardown to await the outstanding scan/server operation. Compare real before/after counts on the same workflow, with no stderr suppression and no blanket dependency optimization disable. Obtain new ownership before changing existing tests, config or shared CI. #46/#47 authenticated source-to-lesson integration remains the higher product priority.
