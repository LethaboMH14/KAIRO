# KAIRO TeacherAccessPanel handoff

Date: 26 October 2026
Owner: `codex-teacher-access-ui-20261026-a`
Branch: `codex/teacher-access-ui-20261026-a`
Base: `a2dfc4f10499bcd32ac45548fc6767094b26c8d2`

## Scope and judging need

This package improves Product (claims match supplied capabilities), Usability (plain access choices and readable controls), Creativity (language, reading, and typed routes are colocated), and Intelligence (no implied provider action or unsupported language accuracy). It supports the learner who needs a language or reading alternative while working through a lesson. The observable acceptance is that only caller-marked languages can be selected, unsupported capabilities are described plainly, and callback actions are gated by busy state.

## Changed files

- `studio/src/teacher-access-ui/TeacherAccessPanel.tsx` — controlled React panel; no fetch/provider/router/audio/camera/storage calls.
- `studio/tests/teacher-access-ui.test.mjs` — six SSR/source-boundary checks plus a synthetic browser fixture generator.
- `docs/teacher-access-ui-20261026/README.md` — criterion mapping, boundaries, and remaining checks.
- `docs/teacher-access-ui-20261026/ssr-test-results.txt` — actual test result record.

## Decisions

- Keep KAIRO as the teacher name. Separate selected language, recorded-file listening availability, captions/read options, and signer-reviewed content availability.
- Use the native select and ordinary buttons; malformed and duplicate choice data blocks changes. A selected unavailable/unknown language produces a visible error.
- No manifest or shared contract changed. Props follow `CHAT-LANGUAGE-PROMPT.md` as supplied.

## Checks and actual evidence

- `node --test studio/tests/teacher-access-ui.test.mjs`: **6 passed, 0 failed**; see `docs/teacher-access-ui-20261026/ssr-test-results.txt`.
- `tsc --noEmit --strict` was attempted but did not pass because the dependency tree lacks React type declarations and surfaces additional missing `@babel/*`, `ms`, and `GPUTexture` declarations. Do not report a clean typecheck.
- Browser check is open. The in-chat browser URL policy denied both local `file://` and `data:` URLs; no in-chat callback, keyboard, responsive, or screenshot acceptance is claimed. The synthetic fixture generator can produce a page for an authorized HTTP(S) preview supplied by root.
- No human, screen-reader, physical-device, learning-outcome, or production capability validation was done.

## Remaining work

Root should review and mount the component with current, reviewed capability data, run the supported Studio typecheck/build, and perform browser interactions at desktop and narrow widths through an authorized preview. Root owns shared routing/provider/narrator integration, merge, and deployment. This handoff does not claim release acceptance.
