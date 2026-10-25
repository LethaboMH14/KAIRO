# Live synthetic provider results — 23 October 2026

Root codex-provider-live-20261023-t; Codex / GPT-6 / effort unknown. User entered keys locally and confirmed Groq Free-plan entitlement. Keys were used only in backend requests and never printed. No learner document, saved lesson, browser observation, public deployment or schedule was involved.

## Requests and results

| Attempt | Actual returned model / configuration | Result |
|---|---|---|
| OpenRouter 1 | `openrouter/free`, 1200 output-token ceiling | Response rejected as incomplete. Original harness did not retain enough metadata to identify selected model or cause; do not infer them afterwards |
| OpenRouter 2 | `dots-studio/dots-3-note-preview:free`, 1200 ceiling | Rejected: `finish_reason=length`, null content; 15.539 seconds. Provider-reported completion1200/reasoning1379 are internally inconsistent, so these counters are not a reliable cost calculation |
| Groq 1 | `openai/gpt-oss-20b`, 1200 ceiling | Completed in1.222 seconds, reported394 prompt/492 completion/342 reasoning tokens. JSON and exact-quote checks pass, but manual source-grounding review rejects the unsupported added slip/ideal-motor discussion |
| OpenRouter 3 | `dots-studio/dots-3-note-preview:free`, explicit4000 ceiling | Completed in27.430 seconds, reported193 prompt/2714 completion/2605 reasoning tokens. JSON/exact quote pass. Root review found the short explanation consistent with the fixture, but it omits the useful explicit reminder that rotor speed is not supplied |

All four requests used the same synthetic motor passage and lesson task. OpenRouter follow-ups were deliberate diagnostic/configuration comparisons announced to the user, not automatic retries. No paid model or fallback was selected. Groq Free-plan status is user-confirmed, not an independently audited billing entitlement. The initial 1200 and follow-up4000 ceilings are not identical conditions: this is an exploratory result, **not** a fair latency benchmark or a general model ranking.

## Why this matters

Groq's draft said: “In an ideal motor they would be the same, but in real motors the rotor lags a little because of slip.” The supplied source does not establish those claims or motor subtype. An exact supporting quote elsewhere in a paragraph does not prove every explanation sentence follows the source. Do not publish this draft as verified source-grounded teaching. Do not “fix” grounding with a brittle ban on the word slip; improve claim-level evidence/review and evaluate varied held-out fixtures.

The successful OpenRouter response described field versus rotor speed without adding the unsupported slip discussion. Its reasoning budget was much larger than the final answer, making this particular reasoner a weak default for a simple interactive rewrite unless broader testing justifies it. Try capability-filtered smaller/non-reasoning models in a separately bounded comparison. A single completed fixture is not educational validation.

## Harness correction

`tools/provider-lab/lab.mjs` now retains sanitized returned-model ID, finish reason, content type, timing and bounded token counters on incomplete responses. It does not retain raw provider diagnostic text, hidden reasoning or credentials. A programmatic optional `maxOutputTokens` allows256–4000, default1200; CLI default remains1200. No automatic retry or paid fallback was introduced. Output-budget comparison runner is `openrouter-long-sample.mjs`; it makes exactly one request when explicitly run with the local env file.

`node --test tools/provider-lab/lab.test.mjs`: **12/12 pass**, including diagnostic redaction and pre-dispatch allowance bounds. Existing app files and provider consent route were not changed; no new full-app suite/build is claimed. The prior525/525 application gate remains a separate checkpoint.

## Next application integration

Use Groq/OpenRouter through the existing server task-router policy after adding explicit provider consent and durable quotas. Begin with one “propose a simpler explanation” action; show the supporting source and before/after, validate current revision and require acceptance before saving. Keep a useful local-reading failure path. Add sentence-level source support and a representative quality evaluation before allowing unattended lesson creation. Keep one KAIRO narrator independent of the text model provider. Model availability, account quota and repeated latency still require current measurement.
