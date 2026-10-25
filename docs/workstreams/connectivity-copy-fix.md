# Connectivity indicator copy correction

Date: 2026-10-22  
Agent: `codex-luna-connectivity-copy-20261022-a` (gpt-6-luna, low)  
Scope: copy only in teacher settings and the learning home.

## Changes

- In `studio/src/teacher/TeacherSettings.tsx`, the positive Google voice status now says: “Google voice is configured for this server. Playback depends on service availability.” The negative status now says: “Google voice is not configured for this server.”
- In `studio/src/continuity/LearningHome.tsx`, the `navigator.onLine` true label now says “Browser reports a network connection.” The false label remains “You appear to be offline.”

The existing settings, voice consent, preview behavior, controls, layout, colors, pricing text, and status logic are unchanged. The strings clarify that configuration and browser connectivity do not establish provider health or server reachability.

## Checks and limits

Source inspection confirmed the Google voice status still uses the existing configuration response and the home status still uses `navigator.onLine`. Exact-string inspection confirmed the requested copy and unchanged offline branch; the existing configuration and `navigator.onLine` state sources remain in place. No tests, build, browser session, provider request, or network reachability check was run; this copy-only task does not claim functional health or browser acceptance.
