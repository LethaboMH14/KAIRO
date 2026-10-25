# Connectivity and saved-reading state audit

Date: 2026-10-22  
Agent: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low)  
Scope: source-only inspection of learner connection indicators, cloud guide/explain/translate/generation/speech states, and offline saved reading. No browser, runtime, or private stored-value inspection.

## Confirmed findings

1. **“Live AI” means configured, not currently reachable.** In `studio/src/App.tsx:37`, the UI sets `cloudReady` from `GET /api/health` only when `r.cloudConfigured === true`. `studio/server.mjs:23` defines that response using `cloudConfigured()`, and `studio/server/google.mjs:13` implements that as the `KAIRO_CLOUD_ENABLED` environment flag. But the same button is described as “Live AI” at `studio/src/App.tsx:112`; the actual Google request can still fail at `studio/server/google.mjs:48-61`, and the route returns an unavailable response at `studio/server.mjs:38-40`. Thus the label is a confirmed overstatement of the readiness probe. The actual request path does show an error and keep the prepared lesson available.

   **Bounded recommendation:** rename the copy to say cloud questions are configured/enabled for this session, or add a real provider-health check before asserting “Live AI.” Keep the existing request-time error handling.

2. **A late guide answer can be shown for a different question or stage.** `studio/src/App.tsx:85-94` sends the current `question`, `topic` and stage, then unconditionally calls `setGuideAnswer(result.answer)` when the request resolves. While pending, the learner can change the stage using controls at `studio/src/App.tsx:102`, or edit the question at `studio/src/App.tsx:112`; neither action invalidates or identifies the in-flight answer. A slow response can therefore be displayed under the changed lesson state. Errors are also shared in `error`, though request failures are surfaced at `studio/src/App.tsx:92`.

   **Bounded recommendation:** associate the response with a request ID or captured stage/question and clear or label the answer when those inputs change. Preserve the current failure message.

3. **“Device connected” is only the browser connectivity hint.** `studio/src/continuity/LearningHome.tsx:13-15` initializes and updates `online` from `navigator.onLine` and its online/offline events. `studio/src/continuity/LearningHome.tsx:23` presents the true branch as “Device connected.” That state does not test whether the local KAIRO server, Google Cloud, or another specific service is reachable. The same sentence does accurately say that new lessons, fresh answers and natural teacher speech need a connection.

   **Bounded recommendation:** change the label to identify it as a browser/network indication (or keep it purely indicative), and rely on per-request errors for actual service availability.

4. **Teacher voice “enabled” also means configured.** `studio/server/avatar/speech.mjs:27` returns `enabled: cloudConfigured()`, where the function is an environment flag (`studio/server/google.mjs:13`). `studio/src/teacher/TeacherSettings.tsx:11,16-17` turns that into “Cloud voice is enabled” and enables the preview button. Actual speech generation may still fail due to provider/auth/quota/network errors (`studio/server/avatar/speech.mjs:16-23,30-36`); `studio/src/teacher/TeacherProvider.tsx:30-41` surfaces those failures. This is a configuration indicator, not a live voice-service check.

   **Bounded recommendation:** describe it as configured for this server session; leave playback failure reporting in place.

## Reviewed paths with no confirmed false-success issue

- The material workspace wraps upload, save-review, explanation, translation, and lesson generation in `run()`, which clears its prior error, shows an in-progress state, and reports caught failures (`studio/src/workspace/SourceWorkspace.tsx:15-24,36-38`; API helper in `studio/src/workspace/types.ts:7-10`). Lesson persistence happens only after successful validation (`studio/server/workspace/routes.mjs:67-80`).
- Explanation and translation require explicit consent and are request-disabled when configuration is off; failed requests display an alert (`studio/src/teacher/SourceReader.tsx:16-18,30-31`; server errors at `studio/server/workspace/routes.mjs:82-89`). Selection changes and source changes increment `requestId`, preventing a late response from replacing the new selection’s state (`studio/src/teacher/SourceReader.tsx:11-12`).
- Speech request/playback errors are caught and displayed, and active-request IDs guard stale narration callbacks (`studio/src/teacher/TeacherProvider.tsx:14,30-41,50-52`).
- Offline support is specifically the `/home` reading shell and static assets, with dynamic studio/model loads left online (`studio/src/continuity/offline.ts:3-5,7-12,23-33`; `studio/public/kairo-offline-sw.js:1,7-16`). The learner copy distinguishes saved reading copies from new lessons/fresh answers/natural teacher speech (`studio/src/continuity/LearningHome.tsx:23-25`). No source evidence found that it promises full application or cloud operation offline.

## Verification and limits

Read source and local coordination instructions only. No tests/build, browser, actual app requests, private browser values, or code changes. This audit reports source-supported semantics, not live service health or observed browser behavior. Root may address the copy and stale-answer issues in a separately claimed source task.
