# Hosted identity guard — implementation evidence

**Judging criteria:** Product and Usability (authenticated learner ownership), Sustainability (a reusable hosted identity boundary), and Intelligence (separating verified identity from client supplied claims).

**Need:** A learner's saved progress must be associated with the account proved by the bearer token, not a `uid` submitted in a request body or query.

**Implemented:** `studio/server/hosted-auth/guard.mjs` exports `createIdentityGuard({ projectId, verifyToken })`. It requires a bounded single Bearer authorization value, calls the injected verifier, checks `uid`/`sub` agreement, project audience and issuer, expiration and issue time, then attaches a frozen `{ uid }` object as `req.kairoIdentity`. All malformed or rejected tokens receive a generic 401. Missing verifier/project configuration fails closed with generic 503.

**Automated evidence:** Run `cd studio; node --test tests/hosted-auth.test.mjs`. The actual Express application is exercised using synthetic request/response streams because this environment denies loopback TCP. The injected verifier returns synthetic claims or rejects; these tests do not verify JWT signatures, Firebase keys, revocation, provider configuration, deployed behavior, or user ownership in a persistence layer.

**Limits and next acceptance:** The root service must supply a Firebase Admin cryptographic verifier and mount this middleware only on hosted routes, then derive every storage key from `req.kairoIdentity.uid`. The middleware does not alone isolate existing global local APIs. Existing SQLite/local workspace routes remain unsuitable for multiple hosted users until separately migrated and reviewed. No cloud resource, deployment, billing, or browser action was performed. Human/device and hosted integration checks remain open.
