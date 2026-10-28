# KAIRO studio action UI

Implementation package for the root-owned studio interaction contract v1. This package supplies controlled presentation components only; the host owns context construction, requests, persistence, cancellation and narration state.

## Acceptance focus

- **Product / Usability:** one action menu requires an available action, explicit available scope and confirmation; the local studio arc is bounded to five labelled shortcuts and retains a conventional touch/keyboard list; one card displays source-linked or prepared content with externally controlled reading controls.
- **Creativity / Presentation:** the selected KAIRO identity, Manrope and C palette remain visible in a restrained, local action surface; the arc is a shortcut rather than navigation.
- **Intelligence:** UI labels reflect supplied capability states and context; the components make no model, mastery, simulation or learning-gain claim.
- **Impact / Sustainability:** disabled reasons and a reduced-motion/mobile list preserve alternatives; these code checks do not establish device, human, language or energy acceptance.

## Files and evidence

- `studio/src/studio-action-ui/KairoActionMenu.tsx`, `StudioActionArc.tsx`, `TeachingCard.tsx`, `studio-action-ui.css`: controlled components and styles.
- `studio/tests/studio-action-ui.test.mjs`: actual Vite SSR module checks for gates, busy states, unavailable reasons, unique IDs, five-action cap and safe text.
- `evidence/`: synthetic local browser checks and screenshots, when present. The temporary browser harness is not part of the shipped package.

## Limits / integration

Components are unmounted. No route, shared provider/controller, teacher actor, model gateway, source adapter, lesson store or narrator behavior was changed. Host integration must supply allowlisted contexts and current request state, abort stale work on context/source changes, replace rather than stack cards, and keep narrator controls synchronized across classroom and studio. The UI's `busy` prop is presentation state; it is not an authorization or cancellation boundary.

No human/device/language validation or production deployment is claimed. See the Luna handoff for the exact interface and checks.
