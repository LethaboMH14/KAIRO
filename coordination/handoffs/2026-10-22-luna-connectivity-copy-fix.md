# Connectivity copy fix handoff

Date: 2026-10-22
Agent: `codex-luna-connectivity-copy-20261022-a`
Model/effort: gpt-6-luna / low
Task: `CONNECTIVITY-COPY-FIX-001`

## Scope and changed files

- `studio/src/teacher/TeacherSettings.tsx`
- `studio/src/continuity/LearningHome.tsx`
- `docs/workstreams/connectivity-copy-fix.md`

## Decisions

Applied the root-approved copy exactly. The Google voice success state now distinguishes server configuration from service availability; its false state says Google voice is not configured for this server. The learning-home online state identifies `navigator.onLine` as a browser report. Its offline copy and all state logic are unchanged. Voice consent, controls, layout, colors, pricing text and existing request handling were not changed.

## Checks and evidence

Read `docs/workstreams/connectivity-state-audit.md` and confirmed its source findings against the targeted source locations. After editing, exact-string/source inspection is the remaining check. No functional tests or build were requested or run. No browser, provider or network health check was run, so no functional-health or browser-acceptance claim is made.

Evidence: `docs/workstreams/connectivity-copy-fix.md` and the changed source files listed above.

## Remaining work

Root review. No interface, API, server, package, manifest or root configuration changes are part of this task.
