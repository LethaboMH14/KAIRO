# Learning FlowRail — 24 October 2026

## Need and judging criteria

Learners need to know where they are in the path from material to lesson, studio, saved work and next direction, while retaining the module and lesson context. This bounded UI foundation supports **Product** (a coherent journey), **Usability** (clear location and available destinations), **Sustainability** (a reusable stateless component), and **Presentation** (plain, branded stage names). It does not itself connect or validate routes.

## Delivered behavior

`FlowRail` in `studio/src/learning-flow-ui/FlowRail.tsx` accepts a current stage, optional module and lesson labels, and caller-supplied stages. It renders only single-slash app-relative links without control characters or backslashes. The current stage is marked `aria-current="step"`. Items without an accepted destination render as text, with their optional note; the rail does not imply that an absent route works. React renders supplied context and labels as text.

The component has no router, provider, fetch, storage, browser-global access, internal state or package dependency. Its compact CSS uses the selected Chalk, Moss and Ink identity, sentence-case supplied labels, visible keyboard focus and a reduced-motion-aware transition.

## Acceptance evidence

Run from `studio/`:

```powershell
node --test tests/learning-flow-ui.test.mjs
```

Result on 24 October 2026: **4 tests passed, 0 failed**. The actual component is loaded through Vite SSR and rendered with React DOM server. Cases cover safe route links/context, one current step, unsafe or missing destinations becoming noninteractive text, and escaping labels, notes and context.

## Limits and next acceptance

This is component-level automated evidence only. The root integrator must provide real module-aware destinations, ensure they return to the intended lesson/evidence context, place the rail in the connected experience and run the aggregate build. Human, keyboard-on-device, responsive-device and full journey acceptance remain open. No learning, market, or accessibility outcome is claimed from the SSR checks.
