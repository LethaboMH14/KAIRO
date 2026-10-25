# Studio loading and model budget audit handoff

Owner: `codex-luna-studio-loading-audit-20261022-a` (Codex, `gpt-6-luna`, low)
Task: `STUDIO-LOADING-AUDIT-001`
Status: documentation-only audit complete; root review requested.

## Delivered

- `docs/workstreams/studio-loading-audit.md` — route/lazy-load map, exact public asset byte lengths, configured DPR/shadows/fallbacks, source anchors, bounded optimization proposals and explicit limits on performance claims.
- `docs/workstreams/studio-loading-audit.json` — machine-readable audit with route assets, raw byte counts, static observations, proposals and build identity boundary.

The audit statted eight specifically selected public paths under `studio/public/models`; five are used by current Studio routes and three are isolated provisional character preview assets excluded from the route budget. Binary bodies and private paths were not read. No runtime code, dependencies or assets were changed. No test/build/browser or performance benchmark was run.

## Build identity and remaining step

The audit records the latest successful checkpoint available at inspection: 2026-10-22T08:09:11.034Z, 177 passing tests, build exit 0, `index.html` SHA-256 `fa4302857d6ce66cbd20fca39ca044c58f282c947b0a101004d0c1377c36cc57`. Its source report says `currentBuildConfirmed: false`; it is only a historical reference and does not identify today's working tree. Root's current aggregate is still pending. Once root publishes its completed build identity, append that new hash/time to the audit without changing the old checkpoint attribution.

## Source findings for root

- The classroom file is 15,346,684 bytes; the routed teacher rig 11,262,664 bytes; the engineering motor and HDR total 5,895,603 bytes. These are raw filesystem lengths only.
- `/lecture` and `/learn` share the same nested-lazy LectureScene and classroom file; `/engineering` uses a nested-lazy MotorScene and has a 2D drawing fallback; `/practice` uses code-authored 3D geometry with no external model file.
- The root Computer Science `App` is statically imported by `StudioRouter`, but `App` already lazy-loads `Scene`; the Robot GLB is used by that scene. A possible further split is lazy-loading App itself, subject to emitted-chunk comparison.
- The last successful aggregate recorded the large lazy OrbitControls chunk warning (>500 kB minified). Its current state remains unverified until the pending build identity is available.

No fps, load time, GPU memory, transfer, mobile-capability or user-perceived performance result is claimed. No active Claude character asset was edited.
