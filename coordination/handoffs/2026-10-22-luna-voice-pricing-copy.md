# Voice pricing copy handoff

Date: 2026-10-22
Agent: `codex-luna-connectivity-copy-20261022-a`
Model/effort: gpt-6-luna / low
Task: `VOICE-PRICING-COPY-001`

## Scope and changed files

- `studio/src/teacher/TeacherSettings.tsx`
- `docs/workstreams/voice-pricing-copy.md`

## Decisions

Source shows the configured options are Chirp 3 HD (Aoede, Kore and Puck); the server submits those voices to Google Cloud TTS. Its own current caps are 1,200 characters/request, 20,000 characters/process and 100 calls/process. Those app caps are separate from Google’s project quotas.

The learner screen no longer promises a particular monthly free amount or dollar price. It says Google Cloud voice use by this server may incur charges, and that shared project quotas and credits vary. The current pricing link remains. See the workstream note for dated links to Google’s official pricing and quota pages and their relevant findings.

## Checks and limits

Read-only source inspection and live official Google Cloud documentation review completed on 2026-10-22. No billing or quota resources, customer accounts, or provider endpoints were accessed. No tests/build were run; this was copy-only work. No claim is made about the current configured project’s actual charges or remaining quota.

## Next step

Root review. No avatar source, server code, manifests, package files or shared configuration were changed.
