# KAIRO tool action policy demonstrator

Status: local mock policy only, researched 22 October 2026. This module does not execute commands, access files, contact networks, or call MCP servers. It is not a sandbox, connector, production authorization system, or evidence that a host action is safe.

## Boundary

MCP's HTTP authorization is transport authentication and authorization: an MCP resource server validates bearer tokens and scopes. That does not itself express a user's consent to a particular KAIRO action, destination, document version, or payload. KAIRO's application-level grant here is a separate mock gate for one named tool/action and exact scope. Real integrations would need their own transport authentication, server-side identity binding, independent consent UI, policy enforcement, sandboxing, auditing, and recovery semantics.

MCP tool descriptions and source content are untrusted data. Text from a web page, document, or tool result cannot mint a grant or authorize a request. A calling UI must separately obtain explicit user consent and present the exact action and target before calling `authorize`.

## Plain JavaScript API

Import `createPolicyEngine` and `PolicyError` from `studio/server/tools-core/policy.mjs`.

```js
const policy = createPolicyEngine({ clock: () => Date.now(), limits: {} });
const grant = policy.mintGrant({
  userId, tool, action, destination, resource, allowedFields,
  documentVersions, expiresAt, uses,
});
const intent = policy.createIntent({
  userId, tool, action, destination, resource, fields,
  documentVersions, idempotencyKey,
});
const preview = policy.request(intent); // inert; no authorization or side effect
const ticket = policy.authorize(preview.requestId, grant.id, userId); // explicit consent boundary
const receipt = policy.execute(ticket.ticketId, { outcome: 'succeeded' }); // mock ledger only
```

`action` is one of `read`, `execute`, `upload`, `publish`, or `submit`; each is a distinct grant. Scope comparison is exact for user, tool, action, destination, resource and document-version map. Every intent field name must be in the grant's field allowlist. Grants have an expiry, revocation bit, and finite use count. Authorization and mock execution both re-check expiry, revocation, user and scope. A ticket therefore does not outlive later revocation.

Idempotency is scoped to user and key. Resubmitting the same intent returns its existing preview/ticket; using the same key for changed intent fails independent of object key order. `outcome_unknown` is terminal: repeated `execute` returns its receipt without re-running anything. `cancel` only cancels queued mock tickets. The module accepts no executor callback and performs no I/O. Capacity and payload bounds, including aggregate nested byte accounting for primitives, keys, and container structure, fail closed; the ledger omits all raw intent field values, regardless of nested shape or type. Intent fields and document versions must be plain objects; malformed inputs and non-safe-integer clock values fail with `PolicyError` before state mutation. Authorization and execution capture a single validated timestamp before mutation and reuse it for grant expiry checks and ledger records.

## Limits and next work

This in-memory demonstrator does not make concurrent processes safe, persist grants, establish identity, protect a UI from spoofing, validate real destinations, or isolate a future worker. A real action system needs a separate architecture and review: authenticated identity from trusted server context; atomic durable usage/revocation; exact human-readable preview and confirmation; per-tool schemas; resource-specific authorization; idempotent connector semantics; isolated workers; SSRF and path controls; secret handling; and operator-visible audit/recovery.

## Primary sources checked 22 October 2026

- [MCP Authorization, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization): HTTP transport-level authorization, OAuth resource-server role, token/scopes and security considerations.
- [MCP Tools, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/tools): model-controlled tool calls; protocol does not mandate a UI pattern, while recommending a human ability to deny and confirmation prompts.
- [MCP Security Best Practices, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices): confused deputy, token passthrough, SSRF and other implementation risks.

The protocol's bearer token proves access at the transport boundary; this demo's per-action grant is an application consent concept. Neither one substitutes for the other or for an actual execution sandbox.
