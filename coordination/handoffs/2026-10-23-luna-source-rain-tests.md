# Source Rain test handoff

Owner: `codex-luna-source-rain-tests-20261023-a`, Codex `gpt-6-luna`, effort `low`. 23 October 2026.

## Scope and changes

This task owns only `studio/tests/source-classroom.test.mjs` and this handoff. The test suite imports the root-owned `studio/src/source-classroom/session.ts` contract and uses a synthetic lesson and source fixture that follows the workspace `Lesson`, `Evidence` and `Source` field shapes. The fixture contains no learner or private source content.

The seven tests cover lesson then source load ordering and signal forwarding; rejection of malformed IDs before loading; stale and unreviewed source rejection; missing chapter citation and mismatched reviewed-text offset rejection; cancellation before any request, during the lesson request, and between lesson and source requests; chapter index clamping and chapter-specific evidence; and classroom ID and step bounds. The successful load assertion preserves the complete evidence object, including its quote, locator, offsets and edited flag.

## Checks

From `studio/`, ran:

```text
node --test tests/source-classroom.test.mjs
```

Result: 7 tests passed, 0 failed, 0 cancelled, 0 skipped. Runtime was Node v24.18.0. The loader is injected; this check starts no server and makes no network or cloud call.

## Limits and next work

These are focused loader and pure-helper tests. They do not establish router integration, teacher audio cancellation, UI behavior, browser acceptance, or educational outcomes. Root owns integration and independent review under the Source Rain contract. No browser observation was performed.
