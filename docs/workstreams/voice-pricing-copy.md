# Google voice pricing copy review

Date checked: 2026-10-22  
Agent: `codex-luna-connectivity-copy-20261022-a` (gpt-6-luna, low)  
Task: `VOICE-PRICING-COPY-001`

## Source findings

- `studio/src/avatar/motion.ts` defines the UI voice choices as Chirp 3 HD voices: Aoede and Puck in English (UK), Kore in English (US).
- `studio/server/avatar/speech.mjs` declares the same voice family and sends requests to Google Cloud Text-to-Speech. The server itself caps each request at 1,200 characters and each process at 20,000 characters and 100 calls. These are KAIRO-side limits, separate from Google Cloud quotas.
- Google’s [official Text-to-Speech pricing page](https://cloud.google.com/text-to-speech/pricing) currently lists Chirp 3 HD pricing per character, with a monthly free usage allowance. It says billing must be enabled and that usage beyond the free allowance is charged. The values can change, so the product screen no longer repeats a fixed free allowance or dollar price. Checked 2026-10-22.
- Google’s [official Text-to-Speech quotas page](https://docs.cloud.google.com/text-to-speech/quotas) says limits may change and lists a Chirp 3 requests-per-minute quota per project. It also notes default limits can vary by project. This public quota is distinct from KAIRO’s narrower in-process caps. Checked 2026-10-22; page reports last updated 2026-10-20 UTC.

## Copy change

The teacher settings screen now reads: “Up to 1,200 characters per request and 20,000 per server session. Google Cloud voice use by this server may incur charges; shared project quotas and credits vary.” The existing pricing link remains and is now labelled “Check current Google Cloud pricing.”

This attributes possible charges to the configured server rather than implying that a learner’s own cloud account pays. The phrase about shared quotas and credits reflects that the app uses a configured project and that the public quota documentation is project-scoped; it does not assert the configured project’s live billing or remaining quota.

## Limits

This was a source and official-documentation review. No billing account, quota resource, provider endpoint, or customer account was inspected or called. No tests or build were run for this copy-only change. Public pricing and quotas are informational and may change; the pricing link is the current reference for users.
