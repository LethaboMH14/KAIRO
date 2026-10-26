# Teacher access panel

Date: 26 October 2026

## Purpose and judging evidence

This controlled panel helps an adult learner choose among lesson languages the caller marks available, keep written words visible, reduce interface motion, and switch to typing. It keeps language choice, voice support, and signer-reviewed content as separate capabilities.

| Criterion and subquestion | Learner need and observable check | Evidence here | Remaining gap |
|---|---|---|---|
| Product — does it do what it claims? | Unsupported language selection is blocked and the panel says language choice does not prove voice or translation accuracy. | Six SSR tests cover supported/unsupported values, capability labels, and callback gates. | Caller must supply accurate lesson/device capabilities; no provider is wired here. |
| Usability — clear/simple next action? | A learner can use a labelled native select, captions, “Read instead,” reduced motion, or “Type a question.” | Rendered markup exposes native controls, visible status, focus styles, and 44px targets; fixture includes long labels. | No keyboard, screen-reader, narrow-device, or learner study was completed in this task. |
| Creativity — useful approach? | Learner can select a supported language while keeping reading and typed alternatives nearby. | Controlled interface keeps these routes together without auto-starting voice or network work. | No learner comparison or novelty claim is established. |
| Impact — how much impact? | Access options should be available at the point of need. | Implemented controls and truthful capability text only. | No accessibility outcome, task success, or learning gain was measured. |
| Sustainability — reproducible ownership? | Root can mount a small component without adding a provider or dependency. | Package has no manifest changes and documents its controlled props. | Full app integration/build belongs to root and remains unverified. |
| Presentation — communicate the product? | The learner should understand what each option does and what is unavailable. | Plain labels and explicit listening/sign-language capability statements are in the component. | No competition demo or presentation validation was done. |
| Intelligence — honest system behavior? | Selecting a language must not imply a model, voice, or translation has started. | Component makes no network, speech, microphone, or storage calls; static check covers these APIs. | Provider accuracy and lesson-specific capability data are outside this component. |

## Implemented behavior

- Controlled `TeacherAccessPanel` with native language selection.
- Unavailable languages show their supplied reason and cannot be selected. Unknown, malformed, or duplicate choice data fails closed.
- Captions, read-instead, reduced-motion, type-question, and close actions call only supplied callbacks. Busy state gates changes while leaving close enabled.
- Listening copy only reflects the supplied recorded-file capability and says continuous listening is off. Sign copy only reflects the supplied signer-reviewed content capability; it never claims validated sign translation.
- Embedded component styles use the existing Chalk/Moss/Sage/Copper palette, Manrope-first font stack, visible keyboard focus, responsive one-column reflow, and reduced-motion media rules.

## Checks and evidence

Run from the package worktree:

```powershell
node --test studio/tests/teacher-access-ui.test.mjs
```

Result on 26 October 2026: 6 tests passed, 0 failed. The output is preserved in [ssr-test-results.txt](ssr-test-results.txt).

The browser fixture generator is in the same test file. Generate a temporary fixture with:

```powershell
node studio/tests/teacher-access-ui.test.mjs --write-fixture --fixture-dir docs/teacher-access-ui-20261026/.browser-fixture
```

It bundles the actual component and a synthetic callback harness. No browser callback/keyboard/device acceptance is claimed. The chat browser rejected the local `file://` fixture and a `data:` page under its URL policy, so the fixture was not exercised there and no screenshot evidence exists. Do not treat its generated files as production code.

An isolated `tsc --noEmit --strict` attempt did not complete cleanly: this dependency tree has no `@types/react` declarations and also reports unrelated missing declaration/global errors (`@babel/*`, `ms`, and `GPUTexture`). This is an environment limitation, not a passing typecheck. The suite's TypeScript transpile and SSR checks passed.

## Limits and next acceptance

This package is an unmounted UI component. Root must provide real, current lesson/device capability flags and connect the callbacks to reviewed application state. Still required: typecheck in the supported Studio dependency environment, browser fixture interaction checks at desktop and 390px widths, keyboard/focus review, assistive-technology and human evaluation, and the integrated journey. No traction, language accuracy, learning gain, sign translation, real recording, device support, or production readiness is claimed.
