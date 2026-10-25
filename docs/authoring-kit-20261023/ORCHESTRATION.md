# Orchestration choices and exchange boundaries

Primary documentation checked 23 October 2026. Recommendation: preserve the current Node/Express adapters and explicit task state for this slice; use a framework only after a measured missing requirement. None of these packages was installed, benchmarked, hosted or called.

| Candidate | Documented role | KAIRO use case / decision |
|---|---|---|
| [Google Genkit](https://genkit.dev/docs/js/overview/) | TypeScript flows, model/tool integrations, structured generation, developer tools, evaluation and observability; current docs include Express and React/Vite integrations | Best Google-oriented spike candidate if repeated flows/evaluation/tracing need a common toolkit. It does not supply KAIRO citations, lesson schema, source history, cost authorization or a document editor. Verify chosen plugin/model/region, package licences and telemetry redaction first. |
| [LangGraph JS](https://docs.langchain.com/oss/javascript/langgraph/overview) | Low-level stateful orchestration combining deterministic and model-driven steps; durable execution, streaming and human-in-the-loop patterns | Candidate when actual long-running workflows/checkpoints/interrupt/resume justify it. Checkpoint backend, identity, history retention and approval freshness remain application work. No need to adopt LangChain wholesale to use it. |
| [Google ADK](https://adk.dev/) | Agent/tool and sequential/parallel/graph workflow concepts, evaluation and deployment integrations | Candidate for later permissioned multi-tool assistance. A short source-to-lesson job does not require a team of autonomous in-app agents; each tool expands permissions and cancellation/evaluation scope. Development research workers here are distinct from agents running in the user's app. |
| Existing explicit code | Current Google fetch adapter, source validation, generation limits and isolated gateway | Smallest immediate path. Add a persisted bounded job/approval state machine rather than hiding errors in a generic retry loop. Higher manual maintenance, but fewer new dependencies and clearer review boundaries. |

Model exchanges are typed requests, not unrestricted conversation between agents. A proposed record:

```json
{
  "taskId": "server-issued-id",
  "taskKind": "revise-selected-blocks",
  "ownerScope": "authenticated-owner-from-session",
  "sourceRef": {"id": "24-hex-id", "revision": "64-hex-revision"},
  "baseLessonDigest": "64-hex-content-digest",
  "briefRevision": 3,
  "selectedBlockIds": ["worked-example-one"],
  "outputContract": "kairo-authoring-proposal/1",
  "status": "queued",
  "deadlineMs": 45000,
  "attemptLimit": 1
}
```

This is illustrative transport documentation, not an accepted runtime schema or genuine identity record. The server derives ownership, provider, price, permissions and model from policy; imported content cannot set them. Private source text is separate bounded task input, never a URL token, log field or client-selected file path.

Allowed transitions proposed: queued -> extracting/drafting -> validating -> awaiting-review -> committing -> complete. Terminal alternatives: cancelled, stale, rejected, failed. Human review does not keep a model request running. Resume reconstructs the exact approved source/lesson version. Retried transport uses an idempotency key and never double-commits or silently double-charges an admitted task. Charge reservations may remain after cancellation because a provider can still bill work already sent.

One cancellation signal/request generation must fence model response, queued speech, scene commands and pending commit. A late result is not allowed to resurrect a cancelled lesson. Actual Provider and stage lifecycle adapters still need their separately owned tests. The isolated kit tests only cancellation at its synchronous apply boundary.

For cost estimates use input_tokens × current_input_rate + output_tokens × current_output_rate, plus OCR/pages, storage, egress, job CPU and any speech/media costs. Reserve worst-case bounded output before sending and reconcile reported usage. No model name, account balance, free allowance or vendor price here is a verified spending authorization. Set the production ledger in a durable transaction, not memory counters that reset on restart.

Telemetry should measure task kind/version, durations, sizes, error category, cancellation/stale rejection, provider/model version and actual usage. Redact prompts, passages, CVs, voice and learner answers by default. Source quote validity, semantic review, answer-key quality and learner outcomes remain separate evaluations; a successful trace is not educational acceptance.
