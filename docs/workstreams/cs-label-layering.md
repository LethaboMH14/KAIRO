# Computer Science scene label layering

## Confirmed issue

The Computer Science scene renders “Application API” and “SQLite database” as drei `<Html>` labels in `studio/src/Scene.tsx`. The studio picker is a fixed `.modal-backdrop` with `z-index: 20` in `studio/src/styles.css`. Drei's default `Html` `zIndexRange` starts at 16,777,271, so scene labels can stack above the picker and remain visible across it.

## Repair

The scene `Html` now sets `zIndexRange={[19, 0]}`, keeping the projected labels below the modal's 20 layer. The labels keep their existing position, scale, text, active styling and `pointerEvents: 'none'`; the scene and modal controls remain unchanged.

## Contract evidence

- Installed `@react-three/drei` is version 10.7.9. Its `web/Html.d.ts` declares `zIndexRange?: Array<number>`.
- Installed `web/Html.js` defaults this range to `[16777271, 0]` and computes the label element's CSS z-index from the supplied range and camera distance.
- Drei's [Html documentation](https://drei.docs.pmnd.rs/misc/html) describes `zIndexRange` as the z-order range and gives `[16777271, 0]` as the default.
- The application picker backdrop uses `z-index: 20` (`studio/src/styles.css`).

## Verification and limits

Passed a file-scoped TypeScript check from `studio/`:

```powershell
node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --target ES2022 --module ESNext --moduleResolution Bundler --allowSyntheticDefaultImports --skipLibCheck src/Scene.tsx
```

No browser, route, or CDP verification was in scope. This source-level repair addresses the reported stacking relation. It does not claim a new integrated browser acceptance result.
