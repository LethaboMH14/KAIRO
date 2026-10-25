# Review of core blueprint consistency with speech evidence

**Review date:** 22 October 2026  
**Reviewer/session:** `codex-speech-review-20261022-c` / Codex / `gpt-6-luna` / low effort  
**Scope:** read-only review of `docs/blueprint/core/ARCHITECTURE.md`, `TEACHING-CONTRACT.md`, `DATA-AND-API.md`, `CLOUD-RUNBOOK.md`, `DELIVERY.md`, and `ACCEPTANCE.md`, against the speech-cloud research and the checked Rain CHARACTER-002 evidence.  
**Result:** no critical contradiction found in the reviewed claims. Root/core files were not edited.

## Evidence by area

| Core file | Review result | Evidence and limit |
|---|---|---|
| `ARCHITECTURE.md` | Consistent. It distinguishes the stable Rain v1 contract from the future teaching adapter, separates STT/TTS/translation/SASL capabilities, places speech behind locale/voice/mode-specific capability checks, and requires an audio clock, cancellation epoch and source-grounded actions. | Lines 12, 49–53, 71, 83–84 and 98. The timing numbers at line 98 are explicitly proposed pilot targets, not Rain performance claims. The existing Rain implementation only has Rhubarb mouth shapes for three sample audios and live energy fallback; the architecture describes later work rather than claiming that it is already integrated. |
| `TEACHING-CONTRACT.md` | Consistent. It correctly separates word-boundary and viseme tracks, binds timing to the exact audio hash, warns that Google SSML timepoints do not guarantee a chosen voice returns them, requires per-locale/provider verification, and treats Rhubarb as a mouth-shape estimator rather than exact word alignment. Interruption semantics preserve the heard prefix and committed board state. | Lines 29, 33–49, 54–61, 65–85. Azure viseme IDs are not copied to Rain without mapping. The contract remains explicitly proposed (`kairo-teaching/1`), not a deployed API. |
| `DATA-AND-API.md` | Consistent. It separates received/corrected transcript, generated response, heard prefix, audio hash and timing tracks; uses idempotent event IDs and usage reservations; requires tenant-scoped quotas and explicit consent for speech bundles. | Lines 14, 19, 25, 32, 41–44, 51 and 55. These are proposed semantics, not live schema claims. |
| `CLOUD-RUNBOOK.md` | Pricing and account caveats are consistent with the repaired speech blueprint: V2 STT first tier $0.016/min; V1 60-minute/$0.024 row distinguished; Chirp TTS allowance is not treated as current account balance; $30 bounded experiment allocation is an engineering limit; spend-cap eligibility/latency does not create a speech hard cap. | Lines 3, 7, 37–54. The 100 learner-hour example assumes mic capture for 10% of session time (600 STT minutes = $9.60) and $135 TTS before an eligible allowance. Adding the explicitly labeled $80 engineering allowances produces $224.60. Its $50/$20/$10 allocations are not provider quotes. This differs by assumption from the speech document's separately stated full-mic example ($96 STT) and named-model token estimate; the examples are not contradictory because both state their distinct workload assumptions and exclusions. |
| `DELIVERY.md` | Consistent. Stages remain conditional on review, provider capability probes, exact-audio timing and separate language validation. The adult pilot, engineering durations, future work and SASL authorship are clearly planning assumptions, not deployed features. | Lines 3, 9–21, 23–35. CHARACTER-002 is labeled closed, matching the current verification evidence; Rain integration and mobile acceptance are still future work. |
| `ACCEPTANCE.md` | Consistent. It tests stale timing tracks, word/viseme capability distinctions, interruption races, mic revoke, unavailable local-language voices, consent/cost/provider failures and SASL review, and distinguishes real-device/audio acceptance from headless checks. | Lines 17, 22–30, 35–37, 46–47, 61–67. These are acceptance cases rather than claims that those tests have run. |

## Cost comparison: why two totals differ

The core runbook's $224.60 is a gross **planning example**, not a vendor quote: $135 for 4.5M TTS characters before a monthly allowance + $9.60 V2 STT for 600 submitted minutes + $80 in labeled engineering allocations. The speech blueprint's $204.81–$239.66 example prices a different assumed workload: 6,000 STT minutes, TTS with/without an unused allowance, 1,000 modeled Q&A turns, plus a stated 1 vCPU/0.5 GiB Cloud Run assumption. Its exact upper arithmetic is `$96 + $135 + $1.815 = $232.815` subtotal, then `+$6.84 = $239.655`, rounded to $239.66. It excludes several services and is explicitly not a complete cloud quote. There is no arithmetic inconsistency when those separate assumptions are retained.

## Limits of this review

- Review was source-only. No runtime, browser, provider, billing or deployment checks were run.
- It does not validate provider locale/mode availability, native-speaker quality, timing accuracy, current account entitlement, Cloud Run regional usage or exact billed SKU. Those remain execution gates.
- No language or model claim should be upgraded from “listed/candidate” to “validated” based on these core documents.
