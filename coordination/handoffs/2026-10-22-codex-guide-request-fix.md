# Guide request race fix handoff

- Agent/session: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low)
- Task: `GUIDE-REQUEST-RACE-FIX-001`
- Scope: exactly `studio/src/App.tsx`, `studio/src/guide-request/`, `studio/tests/guide-request.test.mjs`, `docs/workstreams/guide-request-fix.md`, and this handoff.
- Implementation: the guide request gate invalidates old responses when question, topic, or stage changes; newer requests replace older ones; unmount invalidates pending callbacks. Both late success and late failure are ignored. The rendered answer/error clears on context change and request start.
- Copy: replaced “Live AI” with “Cloud questions are configured for this server session; availability is checked when you ask.” State is named `cloudConfigured`; health endpoint remains the same config-only local probe.
- Interfaces: no server API or payload change; existing POST `/api/ask` request fields are preserved.
- Checks: focused Node suite 6/6 passed; scoped TypeScript check exit 0. No browser, live API call, full build or deployment.
- Remaining: root independent review and aggregate validation.
