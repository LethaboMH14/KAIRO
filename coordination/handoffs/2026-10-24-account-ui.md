# AccountPanel handoff — 24 October 2026

Owner: `codex-account-ui-20261024-a` (Codex; exposed model GPT-6, effort unknown). Task: `ACCOUNT-PANEL-001`. Exact claimed paths: `studio/src/account-ui/`, `studio/tests/account-ui.test.mjs`, `docs/account-ui-20261024/`, this handoff.

## Delivery

- Added `studio/src/account-ui/AccountPanel.tsx`, a default-exported presentational component with exported props matching the account wave contract.
- Added `studio/tests/account-ui.test.mjs`, using installed Vite SSR to load the real component, server rendering for states/escaping/labels, and an event/lifecycle harness that invokes the component’s actual event callbacks. No browser or headless browser was used.
- Added `docs/account-ui-20261024/README.md` with the judging criterion/subquestion, learner need, acceptance check, evidence and remaining gaps.
- No SDK, network, tokens, storage, route, provider, package or root manifest changes. No credentials or provider errors were logged.

Email is trimmed and validity checked. Sign-in passwords are passed exactly as typed. Sign-up enforces a visible 12-character UI threshold and says server rules are separate. Reset only receives email and always reports neutral “if an account…” copy. Error text uses React text escaping; rejected callbacks without a supplied error show generic copy. Password state clears after successful authentication/reset, on mode changes, on sign-out start and when signed-in status arrives. Pending/loading plus an in-flight ref suppress duplicate callbacks.

## Criterion, need and evidence

**Product** (complete, expected behavior) and **Usability** (clear, accessible account states): learners need a predictable way to enter, recover access and leave an account without implying unsupported data isolation. Acceptance is observable in the 7 actual-component SSR/event tests: mode and state rendering, labels/autocomplete, email handling, exact password payload, reset payload/copy, signup threshold, pending and duplicate guarding, callback rejection handling and sign-out. Focused suite passed 7/7. Scoped strict TypeScript check exited 0. See `docs/account-ui-20261024/README.md` for full evidence and commands.

## Limits and root follow-up

These tests prove component/form behavior only. The callback contract is not live authentication, credential policy, hosted account isolation, or production security. Root still owns account mounting, SDK/session lifecycle, credential policy, cloud identity/revocation, accurate scope labels, route integration and final build. Browser/device keyboard and screen-reader review, hosted identity acceptance, account-switch isolation and learner evaluation remain open. Preserve the denied-browser boundary and do not relabel this callback UI as live auth.

Claim released after recording the evidence. No deployment or schedule changes.
