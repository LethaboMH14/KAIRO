# Speech/cloud blueprint handoff

- **Owner/session:** original research `codex-speech-cloud-20261022-a`; pricing repair `codex-speech-cloud-pricefix-20261022-b` / Codex / `gpt-6-luna` / low effort.
- **Tasks:** `BLUEPRINT-SPEECH-001`, plus pricing correction `BLUEPRINT-SPEECH-PRICE-FIX-001`; both scoped to `docs/blueprint/speech-cloud` and this handoff.
- **Status:** research/planning delivered and pricing correction applied; no app/runtime/shared contract code changed.
- **Research cut-off:** 22 October 2026.

## Evidence files

- `docs/blueprint/speech-cloud/README.md` — recommendation, Rain state, capability matrix, proposed event architecture, interrupt/cancellation behavior, cost model and gates.
- `docs/blueprint/speech-cloud/catalog.md` — exact managed services, HF model/dataset IDs, card metadata, licenses/gating, SASL research and compute implications.
- `docs/blueprint/speech-cloud/evaluation.md` — native-speaker/Deaf-led evaluation design, consent, metrics and decision rules.

## Decisions and correction notes

1. The current Rain verification is CHARACTER-002 build 6, 3,424,844 byte asset, 77 joints, 31 face shapes, five clips, 229,366 triangles. It has `AudioInput.visemes` for Rhubarb shapes A–H/X and exact timings for **three** sample audios; live speech without supplied timings uses an amplitude fallback. Word boundaries are a separate need. Existing cue contract verified interruption exactly once; real provider stream cancellation is not tested. See `docs/character/verification.md`.
2. Google STT V2 current locale table lists `tn-Latn-ZA` as `long` and `short` in EU/US; `zu-ZA` `chirp_3` rows exist and the Chirp 3 language page labels Zulu Preview. Do not conflate STT locale availability with TTS voices. Google TTS Chirp 3 HD supports streaming audio, while synchronous SSML supports only selected tags in Preview and streaming requests do not support SSML. No SA-local Google TTS voice was confirmed in this check.
3. Azure currently lists `zu-ZA` STT and `zu-ZA-ThandoNeural` / `zu-ZA-ThembaNeural`; its feature matrix lists `en-ZA` visemes but not `zu-ZA`. SDK word-boundary/viseme events must be verified per chosen locale/voice, especially isiZulu.
4. HF connector succeeded during this turn. `pocket_polyglot_mzansi_50M_6langs` is CC BY-NC 4.0 (not commercial), 49.3M parameters. Swivuriso model cards list MIT, but the dataset is gated and CC BY 4.0 metadata; its card limits the corpus to ASR and forbids TTS/voice generation. `SunflowerASR-51` is a gated 1.5435B model with Apache-2.0 metadata and includes Setswana/Zulu. Individual model/dataset and upstream terms still need legal review.
5. SASL is a separately authored/reviewed signed-language product capability. UCT reports a research corpus of 5,047 government/politics sentences; research record does not grant product rights or establish broad educational quality. Rain gestures are not signing. Proposed first slice is human-signed, Deaf-reviewed and rights-cleared authored content.
6. **Pricing correction (important):** the original handoff/draft incorrectly used the V1 Standard without-data-logging rate/free tier for a V2 STT recommendation. This is fixed in the current evidence files. The current public V2 Standard recognition row is $0.016/min through 500,000 minutes/month/account (then progressive lower rates); it has no 60-minute free tier. V1 separately has a $0.024/min no-data-logging row after 60 free minutes. Actual V2 `chirp_3` Preview or `short`/`long` locale-model SKU billing still needs verification. TTS Chirp 3 HD is $30/M characters after the first 1M under its current allowance. Existing account credit and Azure F0 quota data in setup docs are historical as of 21 Oct, not refreshed. Read-only `gcloud`/`az` metadata attempt failed because CLI attempted to write session/log files outside workspace-write roots; no escalation/mutation or credential output. The new Google spend-cap eligibility page does not list speech APIs; spend caps have service/project scope and latency, so app limits and per-API quotas remain necessary.
7. Current `studio/server/google.mjs` uses the exact model ID `gemini-3.5-flash-lite`; setup records a successful small request through the Vertex/Agent Platform publisher endpoint. Current global Agent Platform list price is $0.30/M input and $2.50/M output tokens; non-global $0.33/$2.75. For the 100-learner-hour example, the provider inference subtotal is $202.65–$232.815 ($202.65–$232.82 rounded to cents): maximum `96 + 135 + 1.815 = 232.815`. Adding one-instance Cloud Run compute ($2.16–$6.84) gives $204.81–$239.655 ($204.81–$239.66 rounded): maximum `232.815 + 6.84 = 239.655`. Storage, egress, translation, reply audio and other variable infrastructure remain excluded; it is not a full quote. A proposed $30 gross-cost engineering cap for first experiments is separately labeled as an engineering limit, not a quote or verified balance. Parent relayed that the user broadly authorized existing cloud credits/resources; after live read-only entitlement checks, tests may proceed within the $30 cap without asking again. No paid call was made in this task.

8. Arithmetic-only repair: previous rounded upper totals accidentally used the global model Q&A price while describing the range that included non-global rates. The README, review note and this handoff now use consistent exact upper arithmetic and cent rounding; no research or other scope changed.

## Validation and non-actions

- Read project onboarding/product brief/setup, current character verification/handoff, coordination protocol; registered session and checked inbox at task boundaries.
- Ran read-only provider research using official Google/Microsoft/UCT sources and Hugging Face repository metadata. HF connector returned details for the named repos; no large assets/model weights were downloaded or run.
- No cloud deployment, API call, paid generation, resource mutation, training or account setup was performed.
- No application test/build run: this is documentation/research only and no runtime file was modified.
- No task schedule/automation was created.

## Remaining work for a later implementation/review chat

- Refresh actual Google credit expiry/balance, enabled services, V2 SKU/quota, and Azure F0 quota/region through a safe read-only route that does not expose secrets; current values remain unknown. If eligible, conduct first probes within the proposed $30 gross cap, without asking again. No paid calls until this confirmation.
- Provider probe for exact Google `tn-Latn-ZA` model/mode and `zu-ZA` Preview endpoint; Azure chosen voice's word-boundary and viseme events; local speaker review before product claims.
- Ask code owner to approve a stable `LessonCue` timing/anchor interface before implementation; this note proposes one but did not change shared contracts.
- Confirm live entitlements and quotas read-only, then stay within the proposed $30 gross-cost cap for first experiments. Do not treat published monthly free allowances as verified remaining account credits or universal spending caps.
- Pin exact model/dataset revisions, inspect complete upstream and gated access terms, and secure community/speaker consent before any data use.
- Recruit/compensate native-speaker and Deaf reviewers; define phone/data targets before pilot gates are interpreted.
- Claude review requested for a later fresh chat by user; this artifact does not claim Claude received or reviewed it.

## Sources

See inline source links in the three evidence files. Principal primary sources include [Google STT language table](https://docs.cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages), [Google Chirp 3 TTS](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd), [Google speech prices](https://cloud.google.com/text-to-speech/pricing), [Azure language/feature matrix](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt), [Azure synthesis events](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis), and [UCT SASL translation study](https://open.uct.ac.za/items/fdf2c98d-8f20-4629-9fbe-41421886c94b).

## Root blueprint consistency review

- **Task:** `BLUEPRINT-SPEECH-REVIEW-001` / session `codex-speech-review-20261022-c` / Codex / `gpt-6-luna` / low effort.
- **Scope:** read-only review of the six requested core docs; this handoff and `docs/blueprint/speech-cloud/root-review.md` only were written.
- **Finding:** no critical technical contradiction found across architecture, teaching timing/interruption contract, data/API model, cloud runbook, delivery phases or acceptance cases. The review identifies that the two 100-learner-hour cost figures use different explicit mic/compute/allowance assumptions; they are both illustrative and not in conflict. It also records that the core plan's timing numbers are targets, not measured Rain performance.
- **Validation:** source-only read of the six files, speech research and CHARACTER-002 verification. No runtime/browser/provider/cloud/deployment checks were run. Root core documents remain unchanged.
- **Evidence:** `docs/blueprint/speech-cloud/root-review.md`.
