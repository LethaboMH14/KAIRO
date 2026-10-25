# KAIRO provider capability lab

Node 24+, no new npm packages. This is an isolated server-side experiment; it does not silently switch the application's existing Google generation/consent path. AIML's earlier isolated adapter remains at studio/server/ai-gateway/aiml.mjs for later separately budgeted integration.

1. Copy `.env.example` to `.env.local` **in this directory**. The repository already ignores `.env.local`; never paste real keys into chat, screenshots, VITE variables or frontend code.
2. Add `GROQ_API_KEY` and/or `OPENROUTER_API_KEY`. For Groq, confirm the account is on the Free plan before setting `KAIRO_GROQ_FREE_PLAN_CONFIRMED=1`. The lab cannot verify account entitlement or prevent an upgraded provider account charging its normal price.
3. From the project root:

```powershell
node --env-file=tools/provider-lab/.env.local tools/provider-lab/lab.mjs status
node --test tools/provider-lab/lab.test.mjs
node --env-file=tools/provider-lab/.env.local tools/provider-lab/lab.mjs sample groq --consent
node --env-file=tools/provider-lab/.env.local tools/provider-lab/lab.mjs sample openrouter --consent
```

Each sample command makes at most **one** inference request using the built-in synthetic motor passage, a 1200-token ceiling, 45-second timeout, no retries and no provider fallback. Do not run a sample until you want to send that synthetic text to the selected provider. No learner material or local document is read. Both provider keys were absent during implementation; no live model benchmark is claimed until a real result is recorded. `status` makes zero network calls and reports configuration only.

OpenRouter permits only `openrouter/free` or a specific `:free` model. The router chooses a model supporting the requested feature; returned model ID is recorded. Named free variants and feature availability change. No paid model is placed in a fallback list. Groq uses approved strict-JSON-output GPT-OSS model IDs; change these only after a current capability check.

The result includes elapsed time, actual reported model, a validated representation proposal and an exact-source-quote check. This does not prove that every explanation sentence is true. Human review must score grounding, clarity, omissions and instructional usefulness. No tool call, code, scene mutation or lesson save is executed. Provider errors are sanitized; responses are bounded; abort-ignoring late results are rejected.

The next application integration must extend the existing task router's provider allowlist and durable quota ledger, expose separate consent and provenance, and accept proposals through the source-bound draft action/review contract. Do not mount this CLI directly as a public endpoint or treat the existing memory-only budget router as distributed spending enforcement.
