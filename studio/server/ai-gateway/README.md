# Isolated AI gateway prototype

Root-owned development module, not mounted in server.mjs, not an active fallback for the Google-only consent UI, and not ready for public multi-instance serving.

`createTaskRouter({adapters,budget,now})` accepts an explicit owner/request/revision, bounded immutable payload, at most two exact model candidates with fresh configured price reservations, per-provider consent, current-revision check, cancellation and caller validation. Results retain model/provider/revision. Duplicate owner/request IDs return one result; different content cannot reuse the same ID. Only TransientAIError allows one fallback; cancellation, changed source, invalid citations and missing permission do not. Cancelled or failed requests retain reserved cost conservatively because providers may still bill them.

`createAimlAdapter({apiKey,fetchFn})` is server-only, fixed HTTPS chat endpoint, 4500 output-token limit and 1 MB response cap, JSON parsing only. Exact model capability/price/entitlement still needs verification before use. It neither certifies citations nor reads browser settings. No secrets are in this repository. No live AIML call was made.

`createMemoryBudget(13000000)` illustrates a $13 micro-USD admission ledger. It does not know provider prices/balance or actual invoices. A per-process ledger resets on restart and is not a provider-enforced account cap. Production must inject durable transactional owner/provider usage reservations, bounded concurrency, real price/usage reconciliation and retention/eviction. No automatic billing top-up. Public callers must never choose arbitrary model IDs or cost quotations; server policy supplies those after verified account configuration.

Tests: node --test tests/ai-gateway.test.mjs from studio. Uses synthetic data, injected provider mocks and synthetic secret; no cloud request or cost. Source schema/citation validation must be injected from the real task contract before integration. Reading/local lessons remain explicit fallbacks, not counterfeit AI results.
