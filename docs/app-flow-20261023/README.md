# KAIRO connected app delivery

APP-FLOW-001, 23 October 2026. Canonical journey: **Home → choose/review material → Rain or reading → practice → saved working → resume**. Existing supported studios remain reachable through Studios. Local development remains loopback-only until authenticated durable hosting is ready.

## Open the connected app

Fresh production preview: [KAIRO Home](http://127.0.0.1:4188/). Use this address rather than an old pinned preview tab. The new root opens Home; the previous root CS scene is `/computer-science`.

1. Choose **Try the guided example**. This opens a public authored stock-control passage in My material; it does not send private text to a model.
2. Check the extracted passage, confirm review, then **Save reviewed text**.
3. Choose **Create local reading lesson**, or explicitly consent and choose **Generate cited lesson**. Local reading makes no model call. AI generation uses the configured Google service and validates its citations/questions before saving.
4. Open **Learn with Rain**. Read, choose **Show Rain in 3D**, start narration deliberately, search within the source, or open consented cited passage help.
5. Choose **2 Practise**. Answer a question, inspect the supporting quotation and retry. KAIRO explains the next-step rule from recorded attempts.
6. Choose **3 Keep my work**. Add notes, download the lesson/working, save a reading copy or apply the supported stock case. **My work** lists lesson working and the existing workplace portfolio.
7. Reopen the lesson from Home. The chapter is restored from the revision-aware cursor, while reading starts safely without automatically downloading 3D or playing speech. Notes and attempts restore separately; corrupt/conflicting saved records are protected.

## Available now

| Capability | Implementation and limits |
|---|---|
| One KAIRO identity/navigation | Selected C outlined artwork, chalk/moss/sage/graphite palette, local Manrope, desktop sidebar/mobile navigation and shared settings |
| Connected source lesson | Original review/revision checks, one loaded lesson across Learn/Practise/Keep-my-work, exact citations and source search |
| Rain and access | Optional real Rain model, reading-first, captions, reduce motion, one shared narrator, stop on tab/chapter/view/leave, explicit voice consent |
| Recovery | Luna's six-state component independently reviewed and integrated for loading, unavailable/changed source, room and storage/conflict recovery. No browser/AT certification |
| Resume and work | Existing reviewed helper integrated; no default overwrite on bad restore; study notes/attempts saved with a compare-before-write conflict check; Markdown export with citations; no auto-speech |
| Studios | Authored Rain room, Engineering and CS trace reachable. Pump lab remains unintegrated while its owner task is active |
| Retrieval | Dependency-free lexical ranking over the current validated lesson only. No web search, vector/model embedding claim or invented answer |
| Intelligence | Transparent support rule plus actual local logistic fitting/evaluation code. At least 50 attempt observations, temporal holdout of at least 10 and baseline-improvement gate before any experimental estimate. No learner model/accuracy result invented |
| Google models | Existing cloud lesson/passage adapters, now environment configurable and with truthful model metadata and service status. One real public-example generation succeeded |
| Commercial direction | Educator pilot proposition page, with measured-value/rights/support/cost requirements. No checkout, customers, revenue or validated willingness to pay claimed |

## Verification actually performed

- `npm test`: **279/279 passed** after integration, including the corrected failed-resume regression and late rejected-resume-after-replacement case. [Output](tests.txt).
- `npm run build`: TypeScript/Vite passed. Existing large React Three Fiber chunk warning remains. [Output](build.txt).
- Root local/API check: source created, reviewed, local lesson generated/reloaded; Google generated a cited 3-chapter/2-question lesson from the public synthetic example. [API evidence](api-verification.json). No private material was sent; no real speech call was made.
- Impeccable mechanical detector returned no findings for the checked shell/source route. [Output](design-check.txt). This does not establish actual visual layout, responsive/keyboard/screen-reader behavior or device performance.
- The programme was extracted, and pp3/10 rendered/visually checked. [Submission requirements](PROGRAMME.md). The original PDF remains unchanged.

## Current boundary and next work

No browser observation, model interaction in a browser, new user account, public deployment, checkout, Firebase/Cloud SQL/Storage provisioning, billing upgrade or reminder was performed. This delivery is a connected local product slice with a verified optional model call, not a hosted multi-user release. The new Google call may consume existing project quota/credits; precise gross cost/balance was not measured.

Next release work is protected judging access on a live host, owner-authorized durable source/lesson storage, privacy/retention and resource/abuse controls. Then authorized real-device/real-audio/accessibility and consenting learner/educator evaluation. Domain acceptance, reviewed local-language quality, SASL, learned prediction/learning gains, traction and paid demand remain separate evidence gates. Green automated/API checks do not fill them in.

The parent handoff lists all owned scopes, decisions and actual checks. The deleted recurring schedule stays off; no other active owner's claims were cleared.
