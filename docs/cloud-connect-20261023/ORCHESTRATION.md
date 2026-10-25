# Workflow decision: typed state first, LangGraph when durable jobs are ready

Research decision dated 23 October 2026. No orchestration framework installed or mounted by this package.

KAIRO needs admission checks → extraction → coverage assessment → anchored retrieval → lesson proposal → citation validation → human review → revision-checked publication → practice/evidence. AI proposes interpretation and teaching representations; deterministic code controls permissions, source identity, quotas, allowed activity types and writes. OCR transcripts and visual interpretations remain distinct evidence types. Missing pages must remain visible rather than being silently summarized away.

## Choice and trade-offs

**Prefer a bounded LangGraph JavaScript spike for the durable workflow.** Its explicit state and node/edge control fit the existing Node application and mixed deterministic/model steps. It supports persistence and human interrupts and does not require adopting LangChain. It adds checkpoint schema, migration and operational complexity; existing working route functions should remain until a measured replacement passes fixtures. [Official overview](https://docs.langchain.com/oss/javascript/langgraph/overview).

**Use LangChain selectively for useful provider/tool adapters.** It supplies a higher-level agent framework and integrations, but installing it does not establish grounding, access control or model quality. Avoid replacing a small working gateway just to add a framework. [Official overview](https://docs.langchain.com/oss/javascript/langchain/overview).

**CrewAI is an alternative for Python research/analysis flows.** Flows provide structured state, persistence and human feedback; it is not accurate to dismiss it as lacking durable workflows. A second Python orchestration authority would add serialization, deployment and ownership boundaries to this Node-first application. Keep any experimental crew read-only relative to canonical lesson versions. [Official Flows documentation](https://docs.crewai.com/en/concepts/flows).

## Required contracts before mounting

- Persist job ID, source revision, parser/model version, coverage, consent, budget reservation and output provenance. Store secrets outside checkpoints.
- Each model call receives only permitted anchored context. Uploaded instructions are source data, never authority to invoke tools or reveal credentials.
- Use bounded, schema-validated tools: inspect source metadata, retrieve anchored blocks, propose lesson blocks, request a supported studio activity, and evaluate a response against cited evidence. No arbitrary shell, arbitrary URL fetch, SQL or unrestricted MCP access for learner-driven agents.
- Require explicit human approval before publication or external writes. Apply compare-and-swap against the source/draft revision; stale proposals cannot overwrite current work.
- Make side effects idempotent. LangGraph interrupt resumption restarts the node; effects before the interrupt may run again. Place approval before commit and deduplicate every external write/model budget charge. [Interrupt documentation](https://docs.langchain.com/oss/javascript/langgraph/interrupts).
- Test cancellation, missing pages, provider refusal, malformed output, rate limits, retries, stale revisions and duplicate resumes. Do not announce a complete lesson when coverage fails.

## Model and training boundary

Start with pretrained extraction/OCR, vision, ASR, translation and embeddings evaluated on representative fixtures. A model being listed by a provider is not evidence of account entitlement, latency or subject accuracy. Named free candidates need current metadata checks and synthetic evaluation; do not silently fall back to paid models. Free-plan Groq access and paid-listed token prices are separate concepts.

Kaggle's reported 30 GPU hours are user-reported availability, not verified quota or hardware. Spend training time only after a specific baseline failure, licensed labels and held-out evaluation exist. Do not train on uploaded learner material without consent. SASL requires SASL data and qualified signer review; ASL models or fingerspelling recognition are not a substitute for continuous SASL interpretation. The language/ML chat's dedicated research package remains under its own claim and must be independently reviewed before implementation.
