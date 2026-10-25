# AccountPanel delivery

`AccountPanel` is a presentational React component for the account boundary. It exports `AccountPanelProps` and accepts the signed-in/loading state, a scope label, pending/notice/error copy and authentication/reset/sign-out callbacks. It does not authenticate, access a provider, persist data, route, or store credentials.

The learner can switch between sign-in and account creation, send a reset request, or sign out when the parent supplies the relevant callbacks. Email is trimmed and checked with the email input validity plus a bounded fallback syntax check. Sign-in password text is passed exactly as entered. Account creation applies a 12-character form check and explicitly labels it as a UI check rather than a server guarantee. Reset only receives email and always uses neutral account-enumeration-safe copy. Callback rejection displays generic local text; an error supplied by the parent is rendered as text and escaped by React.

Password state is cleared after successful authentication/reset, on mode changes, and when sign-out starts; account status becoming signed-in also clears it. The value is held only in component state and is discarded when the component unmounts. Pending/loading and a synchronous in-flight ref guard event handlers and repeated requests.

## Judging evidence and need

- **Product — complete and behaves as expected:** a learner needs predictable sign-in, account creation, reset, loading and sign-out states. Observable check: `node --test tests/account-ui.test.mjs` exercises the actual component callback payloads and state-gated handlers; result was 7/7 passing.
- **Usability — clear and easy to use:** a learner needs labeled keyboard-operable fields, correct autocomplete, visible focus, actionable pending states and reset wording that does not disclose account existence. Observable check: the same actual-component SSR/event suite checks labels, autocomplete, status/error roles, callback suppression, duplicate submit and neutral reset copy; result was 7/7 passing.
- **Sustainability — bounded implementation cost:** this component adds no package, provider, network call or persistent credential store. That is an implementation observation, not evidence of session cost or operational sustainability.

## Scope and remaining evidence

This is a callback form and UI boundary, not live authentication or proof of secure account isolation. Root integration still owns the account host, SDK and session lifecycle, credential policy, cloud identity/revocation, route mounting and the final build. The supplied `scopeLabel` must name only data that root actually scopes to the account; it must not imply local sources are private. Browser/device keyboard and screen-reader checks, hosted identity acceptance, account-switch isolation, and human learner review remain open. No traction, learning effect, privacy certification or deployment claim follows from these tests.

Validation performed from `studio/`:

```text
node --test tests/account-ui.test.mjs
tests 7, pass 7, fail 0

node_modules/.bin/tsc --noEmit --target es2022 --lib es2022,dom,dom.iterable --module esnext --moduleResolution bundler --jsx react-jsx --strict --skipLibCheck --allowImportingTsExtensions src/account-ui/AccountPanel.tsx
exit 0
```
