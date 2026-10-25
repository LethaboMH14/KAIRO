# Account cookie security route checks — 24 October 2026

## Need and judging relevance

Private account material needs clear origin boundaries, revocation-aware identity checks, non-leaking authentication failures, and session cookies that stay out of JavaScript-visible response bodies. This evidence supports **Product** (private account journey behaves as claimed), **Usability** (sign-in/reset/logout states remain usable), and **Sustainability** (security boundaries are executable and repeatable).

## Method

The tests import and mount the actual `createAccountRouter` and `sessionGuard` from `studio/server/account/routes.mjs` in Express, then send HTTP requests to an ephemeral loopback server. Admin Auth and REST fetch are deterministic injected doubles. All identity data uses fixed synthetic values; no real identity provider/network request is possible through the injected `fetchFn`.

## Evidence

Command: `node --test --test-reporter=spec studio/tests/account-cookie-security.test.mjs`
Result: 8/8 passed, 24 October 2026.

Coverage: bad and missing mutation origins; generic provider failure; HttpOnly/Secure/SameSite cookie and token-free JSON; stale `auth_time`; hashed status scope; `verifySessionCookie(..., true)` and revoked/disabled rejection; password reset anti-enumeration across provider outcomes; logout revocation and cookie clearing after success or failure.

## Limits

This is route-level synthetic evidence. It does not establish deployed TLS/cookie behavior, real Firebase revocation/disabled-account behavior, rate-limit effectiveness under load, broader CSRF behavior through a browser, POPIA/legal compliance, or hosted reviewer access. No runtime/auth code changed.
