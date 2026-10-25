# Agentic intelligence, provider lab, cloud foundation and progress

23 October 2026. Root `codex-ai-cloud-20261023-s`, Codex / GPT-6 / effort unknown. Fresh research and selected next architecture are separated from running capabilities.

- [Detailed sixteen-stage intelligence architecture, input formats, models, runtime tools/MCP and representations](INTELLIGENCE-ARCHITECTURE.md)
- [Next connected user-facing work and reference products](NEXT-WORK.md)
- [Actual cloud foundation, migration and deployment gates](CLOUD-FOUNDATION.md)
- [Paste-ready progress update for the user to submit](PROGRESS-UPDATE.md)
- [Runnable Groq/OpenRouter synthetic provider lab](../../tools/provider-lab/README.md)

## Implemented in this package

The isolated Node lab makes at most one consented synthetic inference request per CLI run, with fixed endpoints, bounded data/output, strict output request, exact-quote validation, cancellation, sanitized errors and no automatic retry. OpenRouter is free-only; Groq requires the user to confirm Free-plan entitlement. **10/10 deterministic tests pass.** Keys were absent when checked; live model quality/latency has not been measured. The current application still uses its existing Google consent path; this lab is not silently mounted into it. The prior source/editor delivery passed 525/525 and its production build; this package does not claim a new full-app test count.

The credentials entry point is `tools/provider-lab/.env.local`, created from the key-free example only if absent. It is already ignored by repository rules. Add keys locally, never to chat, frontend code or a VITE variable. Configure status with `node --env-file=tools/provider-lab/.env.local tools/provider-lab/lab.mjs status`. No API key values appear in the saved status or tests.

Fresh GCP inventory confirms project ACTIVE, billing enabled and required APIs enabled; no pre-existing buckets/Firestore database, and no Cloud Run service in africa-south1. A dedicated runtime identity and empty private Johannesburg bucket were created and verified; final security/creation evidence is in the adjacent JSON files. No compute service, database, public access, secret version or private document migration was created. The app remains local until authentication, owner-scoped durable storage and Linux jobs are integrated and accepted.

Progress text is prepared, **not submitted**. The user explicitly chose to submit manually. No browser observation, screenshot/CDP/headless, paid model inference, recurring schedule or automatic scraper was used.

The public OpenRouter catalog was fetched without credentials or inference: 17 zero-token-price `:free` entries were returned at this checkpoint. A bounded sample with advertised input modalities and supported parameters is saved in `openrouter-free-catalog.json`. Catalog capability is not a successful model test, and the snapshot will become stale. New bucket defaults include a seven-day soft-delete window; see the cloud document before designing learner deletion promises.

## Judging need, evidence and gaps

Product: select a complete source-to-learning architecture and identify hosting blockers. Creativity: one evidence-anchored concept can use multiple registered representations. Usability: explicit partial extraction, consent, progress, failure and reversible proposals. Sustainability: free-only experiments and task-specific models, with cloud costs and missing billing-credit evidence stated. Impact: reading/voice/language alternatives and meaningful practice require real human evaluation. Presentation: updated submission copy and one joined motor story. Intelligence: schema, quote and runtime authority checks plus measured model selection; no prediction, learning gain or employment outcome is fabricated. Tests prove only named lab behaviours, not model quality, tenant security or a deployed product.
