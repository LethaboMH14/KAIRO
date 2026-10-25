# Connectivity-state audit handoff

- Agent/session: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low)
- Task: `CONNECTIVITY-STATE-AUDIT-001`
- Scope: read-only source audit; wrote only the claimed workstream record and this handoff.
- Evidence: `docs/workstreams/connectivity-state-audit.md`
- Confirmed findings: (1) App.tsx “Live AI” is backed by a config-only health flag; (2) App.tsx can display a delayed guide answer after question/stage changes; (3) LearningHome “Device connected” uses `navigator.onLine`; (4) TeacherSettings “Cloud voice is enabled” is backed by the same config flag, not a live provider check.
- Reviewed and found bounded: explicit explain/translate consent and error states; stale-response guards in SourceReader; speech error and active-request handling; offline support limited to a cached reading shell and saved reading copies.
- Checks: source line review only; no runtime, browser, network, private values, tests, build, deployment, or code changes.
- Recommendation: root can take a separate exact-source claim to adjust configuration wording and invalidate/label guide answers when the question or stage changes. No cloud or Engineering ownership was modified.
