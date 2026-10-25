# Luna 2 — accessible classroom recovery package

## Outcome and judging questions

Usability: easy to use with a clear next action when something fails. Product: polished, truthful behavior. Impact: learning remains available without 3D/voice and without losing earlier work.

Deliver a small **stateless** component and focused checks, not a route redesign or browser audit. Use the selected chalk/moss/Manrope context, native controls and plain learner wording. Do not draw another logo or edit shared brand CSS.

## Startup and exact scope

Read AGENTS.md, coordination/README.md, product/experience startup documents, judging matrix, source-rain handoff, current SourceClassroom and source-classroom-ui, plus the local fixing-accessibility skill if available. Register a unique identity such as `codex-luna-classroom-recovery-20261023-<suffix>` with actual exposed model/effort, then status/inbox. Create `CLASSROOM-RECOVERY-002` if free and claim only:

- `studio/src/classroom-recovery-ui/`
- `studio/tests/classroom-recovery-ui.test.mjs`
- `docs/checks/luna-classroom-recovery-20261023.txt`
- `coordination/handoffs/2026-10-23-luna-classroom-recovery.md`

No SourceClassroom/provider/router/teacher/experience CSS, root config/manifests/lockfiles, other workers' tests, source lesson schema, existing shared components or roadmap edits. Parent owns integration and error classification.

## Published props v1

Default export `ClassroomRecovery` from `studio/src/classroom-recovery-ui/ClassroomRecovery.tsx`:

```ts
type RecoveryKind = 'loading' | 'lesson-unavailable' | 'source-changed' |
  'room-unavailable' | 'storage-unavailable' | 'resume-conflict';
type ClassroomRecoveryProps = {
  kind: RecoveryKind;
  lessonId?: string;
  sourceId?: string;
  detail?: string;
  onRetry?: () => void;
  onContinueReading?: () => void;
};
```

No effects, provider import, storage, network, timers, speech, camera, document mutation or persistence. Parent chooses kind and handles actions; no assumption that retry succeeded. detail is optional **plain untrusted text**, rendered escaped and length-bounded (e.g. 500 characters), never injected HTML/Markdown. Use sensible default messages that do not depend on a server stack trace. Do not show a fake working button when its callback is absent.

## Required states / actions

| Kind | Message purpose | Allowed next action |
|---|---|---|
| loading | Checking the saved lesson and reviewed source | status announcement; link to My material; no claim that source was validated yet |
| lesson-unavailable | The lesson could not open; earlier material was not deliberately deleted | Retry only if callback supplied; My material; no auto-fallback to unrelated stock lesson |
| source-changed | Reviewed words changed; prepare from current revision | Review material using valid sourceId, else My material. No “continue with stale citation” or “verified” label |
| room-unavailable | The room could not load; same lesson text can still be used | Continue reading callback if supplied; do not imply lesson text is loaded if parent hasn't said so |
| storage-unavailable | This device cannot read/save your place; learning can continue in this session | Continue reading if supplied; valid lesson link to practice/notes for existing export. Never claim cloud backup or that every earlier record was preserved if unknown |
| resume-conflict | Another saved place changed; avoid overwrite | Retry/re-read if supplied; continue reading if supplied. No automatic reset, delete or replace |

Links: constant `/sources` plus structured optional IDs only, validated as 24 lower-hex characters before constructing `/sources?source=ID` or `/learn?lesson=ID`. Invalid IDs produce safe generic link/omit the contextual action; no raw href props, external URLs or arbitrary javascript/data routes.

Accessibility: native section with a heading; one appropriate role (status for loading/informational, alert for blocking failure); no nested competing live regions or repeated assertive announcements; visible focus via scoped styles; meaningful button/link names; no icon-only control; no focus trap/auto-focus or simulated progress percentage. Controls should be at least 44px and responsive with wrapping text. No animation is needed. Avoid duplicate hard-coded DOM IDs if multiple notices render.

## Checks

Use installed React + react-dom/server + Vite Node SSR. Follow existing SSR tests with fileURLToPath, configFile:false, middlewareMode:true, ws:false, appType:custom and close in finally. No HTTP listener/browser/headless/device/cloud/audio call. Do not add jsdom/axe/renderer packages without parent agreement.

Meaningful tests: all six messages/actions/roles; default generic material link; optional callbacks absent means no dead action; escape `<script>`/attribute-looking detail; invalid IDs cannot create unsafe links; valid IDs preserve context; multiple component instances avoid repeated IDs; actual returned element callback invokes supplied function once when called. Static markup checks can verify names/roles/actions and text escaping, not keyboard focus order, screen-reader speech, contrast conformance or touch behavior. Record those remaining manual checks rather than claiming WCAG certification.

Run `node --test tests/classroom-recovery-ui.test.mjs` and installed `.\node_modules\.bin\tsc.cmd --noEmit` from studio. Save actual output/counts/exit codes. If SSR cannot honestly execute a check, report its limit; do not use production source-string assertions as a replacement.

## Handoff and acceptance

Own evidence/handoff must state criteria addressed, actual settings, changed paths, props, checks, limits and parent wiring map. No route/UI integration acceptance yet. Parent claims SourceClassroom and integrates states without mounting a second narrator or losing chapter/source. Source-loader typed error classification is a parent decision, not a new worker-owned API. Browser/device/screen-reader testing remains pending and the prior browser denial is not bypassed. Complete own bus task with real evidence, check inbox and publish the handoff for independent review.
