# Google managed-services comparison — handoff

Date: 24 October 2026  
Session: `codex-luna-google-managed-20261024-a`  
Client/settings recorded in bus: Codex, model `gpt-6`, effort `unknown` (not exposed).  
Task: `GOOGLE-MANAGED-SERVICES-001`, active claim retained by this session. Exact scope: `docs/google-managed-services-20261024/` and this handoff.

## Delivered

- `docs/google-managed-services-20261024/README.md` is the primary-source service-selection memo, including Auth/App Check, Firestore vs Cloud SQL, Cloud Run/Tasks/Jobs, Document AI, Vertex/Gemini, STT/TTS, Secret Manager, budgets/logging/monitoring, Agent Search and RAG Engine.
- It identifies exact plug points, regional/privacy constraints, setup dependencies, free/list-price formulas with zero promotional credits assumed, limits/fallbacks, time saved vs complexity, and now/later/reject recommendations for KAIRO's one-user/small-pilot target.
- It recommends the already parent-selected Firestore Standard `africa-south1` + Identity Platform email/password + GCS + min-zero regional Cloud Run direction; it explicitly rejects duplicate DB/Auth setup, Cloud SQL for the current pilot, default off-region document/model processing, Agent Search/RAG, and unbounded spend.
- Parent reports Firestore default Standard in `africa-south1` with freeTier enabled and Identity Platform email/password initialized. Earlier `CLOUD-FOUNDATION.md` says Firestore inventory was empty. This memo marks the newer state as parent-reported and unreconciled against a live receipt. It does not claim independent cloud verification or make a cloud call.

## Evidence and reproducibility

- Reviewed root-published `coordination/briefs/hosted-foundation-20261024/CONTRACT.md`, the existing dated cloud-foundation/agentic-architecture/next-work docs, and official Google product/pricing/region/limits/security documentation.
- Research method: public official documentation search/read (no browser UI/automation), with direct URLs recorded in the memo. Pricing uses USD list rates, current published free allowances, explicit formulas where instance size/usage is unknown, and excludes temporary credits. No billing account or project was queried.
- This was a docs-only task; no automated code tests were applicable or run. No code, schema, configuration, manifests, cloud resource, service API, model call, private learner file, browser, install or deployment changed.

## Decisions for root review

1. Keep Auth as identity only; root/Worker A must verify token signatures and derive UID, with every repository method enforcing owner authorization. App Check is an optional abuse layer, not Auth or authorization.
2. Use Firestore for bounded metadata and CAS/history state, GCS for originals/artifacts, Cloud Run request-based min-zero in Johannesburg for the hosted service, while retaining SQLite only for local mode.
3. Add Cloud Tasks only when bounded extraction exceeds request time; keep payloads pointer-only and workers idempotent/cancel-aware.
4. Do not create Cloud SQL, Agent Search/RAG or off-region Document AI for this first pilot. Reconsider only on measured schema, retrieval or extraction evidence and explicit cost/privacy gates.
5. Keep model/speech requests consented and bounded. The memo finds no Johannesburg row in the current Gemini generative endpoint listing, no Document AI Johannesburg region, and no Johannesburg Speech-to-Text language/model region. A global model endpoint is not a data-residency guarantee. Afrikaans/other language claims require exact listed voice/model and actual quality tests.
6. Reconcile the new reported Firestore/Auth state with root-owned resource receipts; the memo did not query the live project. Do not treat billing alerts as spend caps or temporary credits as sustainable budget.

## Limits and next steps

This is a researched recommendation, not an implementation, invoice, project-resource audit, privacy/legal determination, two-user isolation test or deployment approval. Root should review the memo against its latest receipts, confirm the exact currently created Firestore/Auth states, use current regional calculators once concrete resource sizes and pilot limits are selected, then integrate only under root-owned scopes. Before real learner material: two-account negative authorization tests, restart persistence, delete/soft-delete retention, job retry/cancel/stale-revision tests, secret/log redaction, explicit provider-region consent and per-user usage caps remain required.

No parent plan, service config, database, provider/router, auth package or extraction worker was edited by this research task.
