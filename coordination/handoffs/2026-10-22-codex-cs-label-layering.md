# Computer Science scene label layering handoff

**Task:** `CS-LABEL-LAYERING-001`  
**Owner:** `codex-device-controls-audit-20261022-a`  
**Status:** Complete; ready for independent root review.

## Change

- `studio/src/Scene.tsx`: set the drei `<Html>` label range to `[19, 0]`, keeping its z-index below the studio picker's `.modal-backdrop` layer at 20.
- `docs/workstreams/cs-label-layering.md`: recorded the confirmed issue, prop contract and verification.

The label's position, styling, displayed text and existing `pointerEvents: 'none'` behavior are unchanged. No App, CSS, route, Engineering, root configuration, manifest or dependency file changed.

## Evidence and checks

- Confirmed labels “Application API” and “SQLite database” are rendered by `Label` in `Scene.tsx`.
- Installed `@react-three/drei` is 10.7.9. `web/Html.d.ts` accepts `zIndexRange?: Array<number>`; installed `web/Html.js` defaults to `[16777271, 0]` and derives CSS z-index from that range. Official reference: [drei Html](https://drei.docs.pmnd.rs/misc/html).
- `.modal-backdrop` is `z-index: 20` in `studio/src/styles.css`.
- File-scoped TypeScript check passed: `node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --target ES2022 --module ESNext --moduleResolution Bundler --allowSyntheticDefaultImports --skipLibCheck src/Scene.tsx` (run from `studio/`).

No test, build, browser, route or CDP run was performed. This source check is not a replacement for integrated browser acceptance.
