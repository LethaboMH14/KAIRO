# Luna handoff: controlled studio action UI

**Date:** 26 October 2026  
**Worker:** `codex-luna-studio-action-ui-20261026-a` (Codex, `gpt-6-luna`, low)  
**Task:** `STUDIO-ACTION-UI-20261026-A`  
**Branch:** `codex/studio-action-ui-20261026-a`, based on root-owned interaction contract v1 branch `codex/studio-interaction-contract-20261026` (PR #126; rebase onto main before publishing).  
**Contract:** `studio/src/kairo-interaction-contract/types.ts`; read-only dependency, not modified.

## Judging and learner need

- **Product / Usability:** a learner in a motor/pump or lesson context needs one understandable route to a scoped KAIRO action, a bounded model action list and a response that can be read, sourced and controlled.
- **Creativity / Presentation:** contextual KAIRO actions and an action arc support the selected studio direction and selected C identity without replacing navigation.
- **Intelligence:** capability labels, explicit scope confirmation and source controls make the supplied context visible; this UI does not claim model correctness or mastery.
- **Impact / Sustainability:** keyboard, touch, disabled-reason and reduced-motion alternatives preserve the same actions; no device, language or energy result is inferred from code tests.

## Changed files

- `studio/src/studio-action-ui/KairoActionMenu.tsx`: controlled action selection, explicit available scope and confirmation. A context-key change resets the draft; disabled actions/scopes show reasons; confirmation is guarded against repeated callback emission.
- `studio/src/studio-action-ui/StudioActionArc.tsx`: labelled maximum-five shortcut list, desktop fan layout, phone list; selection closes the controlled arc; Escape restores focus.
- `studio/src/studio-action-ui/TeachingCard.tsx`: plain-text content, capability labels, source callbacks and externally controlled read/pause/stop controls.
- `studio/src/studio-action-ui/studio-action-ui.css`: C palette, Manrope, Lucide, 150–180ms restrained transitions and `prefers-reduced-motion`; phone sheet has one-column action/scope controls, touch-size targets and sticky confirmation.
- `studio/tests/studio-action-ui.test.mjs`: actual component Vite SSR checks.
- `docs/studio-action-ui-20261026/README.md` and `evidence/`: acceptance notes, test report and synthetic screenshots.

Temporary local harness and optimizer cache are not deliverables and should be removed before commit; the harness is not part of the app.

## Acceptance evidence

- `node --test tests/studio-action-ui.test.mjs`: **1/1 passed** against actual Vite SSR modules.
- `npx tsc --noEmit -p tsconfig.json`: **passed**.
- Synthetic local browser interaction check: **passed** at 1440×1000 and 390×844 using Chromium 1217 and local Vite only. It exercised action/scope gates, unavailable/busy states, single callback and payload, context reset, Escape/focus restoration, arc close-on-choice, read/pause/resume/stop/source callbacks, reduced motion, five action limit, mobile list and no horizontal overflow. No page/console errors. Metrics/screenshots are in `docs/studio-action-ui-20261026/evidence/validation.json`.
- `npm run build`: **passed** after using the authorized isolated worktree write access for `tsconfig.tsbuildinfo` and `studio/dist`; Vite transformed 2,354 modules and completed. The normal large-chunk advisory remains; the UI package is unmounted.

Screenshots show a synthetic fixture with fictional rotor/source labels, not the app route, model, teacher asset, lesson data or service. They establish viewport presentation only, not human or device acceptance.

## Integration contract and remaining work

This package is **unmounted** and has no request, provider, route, source-store, teacher, lesson revision, persistence or narrator ownership. Root owns the interaction controller and v1 types. The host must:

1. Supply current owner-authorized context and available actions/scopes; reject stale context-key results and cancel prior work on source/selection/route changes.
2. Keep the KAIRO menu, model arc and teaching card mutually exclusive as appropriate; replace one contextual card rather than stacking. The independent UI components cannot coordinate across host surfaces.
3. Drive narration controls from the one shared teacher state, stop obsolete narration on card/context replacement, and retain source labels/revision integrity.
4. Map only allowlisted part IDs and preserve the usable reading/list fallback on low-data or failed-3D devices.

No app build/deploy, human/device/language/learning validation, model invocation, source change or additional dependency is part of this delivery. Root review and host integration remain the next gate.
