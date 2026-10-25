# Provider and hosting review handoff — 24 October 2026

Owner: `codex-provider-hosting-review-20261024-b2` (Codex; exposed model `gpt-6`; effort `unknown`). Task `PROVIDER-HOSTING-REVIEW-001`.

## Scope and result

Reviewed only provider/hosting/cost claims in the supplied pasted answer against official Ollama and Google sources, plus the local KAIRO architecture handoff and server model configuration. The full claim table, source links, calculations, limitations and three proposed experiments are in [README.md](../../docs/provider-hosting-review-20261024/README.md).

Key corrections:

- Ollama Free includes a small starter allowance, without a numeric amount on its pricing page; `gemma4:cloud` is currently named as a free starter model. Beam is explicitly a limited-time offer.
- Managed Vertex Gemini API calls are token-priced; many other Model Garden models need model registry plus an endpoint and are machine-hour billed.
- Vertex Scale To Zero is a limited Preview, not a universal 15-minute setting. Requests to zero replicas are dropped with 429 and need caller retry.
- Cloud Run GPU L4 cannot run in `africa-south1`; it requires instance-based billing and minimum 4 CPU/16 GiB. The cited `$0.50/hour` is below the public Cloud Run L4 GPU-only default rate, before minimum CPU/memory.
- Gemini 3 Agent Platform Search grounding counts each actual query and includes 5,000 queries/month in aggregate; a user prompt may fan out. Gemini 2.x and Developer API rules differ.
- Alerts-only budgets do not cap spend; eligible service-scoped spend caps now exist but may overshoot, do not stop in-flight work/fixed charges, and were not verified on this project.
- Current credit balance and expiry are unknown. The claimed `$300` and 11 November expiry are not supported by live account evidence.

## Changed files

- `docs/provider-hosting-review-20261024/README.md` — evidence-led verdict table, current KAIRO boundary, arithmetic, proposals, and official sources.
- `coordination/handoffs/2026-10-24-provider-hosting-review.md` — this handoff.

## Checks, decisions and limits

- Read `AGENTS.md`, `coordination/README.md`, KAIRO `README.md`, `docs/KAIRO-PRODUCT-BRIEF.md`, the supplied pasted answer, and `coordination/handoffs/2026-10-24-connected-release.md`.
- Ran canonical bus status and checked this agent inbox. Registered actual exposed settings and claimed these exact scopes before writing.
- Official source review completed 24 October 2026. No tests were requested or run; this is research/documentation only.
- No live billing balance, service configuration, GPU quota/capacity, or spend-cap configuration was inspected. No model calls, cloud changes, purchases, deployment, installs, browser/headless work or schedules were performed.
- Suggested experiments are proposals only, not evidence of latency, quality, savings, relevance or production readiness. Grounding query fan-out prevents treating a fixed prompt count as a strict spend cap. GPU quote depends on selected region/SKUs and the current KAIRO geography would require separate approval.
- Current hosted state is taken from the local accepted-release handoff, not re-probed in this bounded research task. Do not claim parent integration or product acceptance from this review.

## Parent review next steps

1. Review the README's source-linked claims and arithmetic.
2. If a cost forecast is still needed, inspect live project billing credits/expiry, actual spend, model usage, storage classes, service SKUs, and spend-cap scope with the project owner.
3. Execute none of the three proposals until separately authorized; begin with the managed Vertex synthetic baseline. Keep the retrieval experiment gated on query residual and spend-control checks. Defer GPU pending a supported-region/privacy decision and exact price.

