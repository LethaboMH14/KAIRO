# Language capability notice — 25 October 2026

## Need and judging criteria

Learners need to know whether a language option is unavailable, a draft, or available, whether human review is recorded, and how to continue in the original reading view. That matters before trusting a translation or transcript. This package supports **Usability** (clear state and readable fallback), **Impact** (language access with an immediately usable original-text path), and **Intelligence** (honest limits on model and sign-language claims).

## Delivered component

`studio/src/language-capability-ui/LanguageCapabilityNotice.tsx` exports the default stateless `LanguageCapabilityNotice(props)` interface from the package brief:

- `languageLabel`, `kind`, `availability`, `humanReviewed`, and `busy` describe only the caller-supplied state.
- `onUseOriginal` is available for every kind and guarded while busy.
- `onEditTranscript` appears only for listening and is guarded while busy.
- The selected language is displayed as supplied; this component does not add a supported-language list or infer capability.
- Unavailable SASL copy says translation is unavailable and hand tracking is not sign-language translation. Available/draft SASL without recorded human review says review is required and does not present translation as ready to rely on.
- A human-reviewed state says review was recorded; it does not claim model accuracy or reviewer qualification. Availability is not evidence of quality.
- React-rendered learner text is escaped. `useId` links each section to its own heading and status message. Buttons have keyboard-visible focus treatment and remain legible in the selected KAIRO palette.

This is a presentational component only. It does not capture audio/video, invoke a model, generate translations, recognize signing, mount into the app, or change the listening/teacher runtime.

## Acceptance evidence

Focused tests render the **actual TSX component** through Vite SSR and React `renderToStaticMarkup` for all 36 combinations of kind, availability, human-review flag and busy state. They also check hostile label escaping, repeated-instance IDs, disabled states and the component's actual guarded callbacks across those combinations.

Run from `studio/` after dependencies are available:

```powershell
node --test --test-concurrency=1 tests/language-capability-ui.test.mjs
npx tsc -b
```

The component is not mounted or human/device tested. PR23's language values remain requested-not-validated, and the PR75 evaluation cases remain not-run; this UI does not convert either into language-quality evidence. Keyboard/screen-reader/device acceptance and root service-contract review remain open.

Executed in the isolated worktree with Node `v24.18.0` and the repository's preinstalled dependencies reused through a temporary ignored junction (no installation): focused SSR/callback suite **4 passed, 0 failed**; TypeScript build check `node ./node_modules/typescript/bin/tsc -b` exited **0**. The junction was only local test setup and is not part of the package.
