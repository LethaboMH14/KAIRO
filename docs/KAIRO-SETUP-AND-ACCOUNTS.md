# KAIRO development setup and accounts

Checked 21 October 2026. Provider limits below are documentation snapshots; account balances are separately identified as live observations.

## What is ready

- Node 24.18.0, npm 11.16.0, Python 3.11.9, Git, uv, Google Cloud CLI and Azure CLI were already installed.
- The studio now has installed, locked React, TypeScript, Three.js, React Three Fiber, Drei, Express, Vite and Google's authentication library.
- Blender **4.5.14 LTS** is installed portably under `tools/blender/`. The archive was downloaded from Blender's official release server and matched its official SHA-256. Running `--version` confirmed the executable works. System PATH was not changed.
- The CC0 RobotExpressive guide and Blender Classroom source were downloaded; the classroom archive was extracted. Source URLs, authors, licences and hashes are in `assets/manifest.json`.
- A real Google Cloud speech sample was generated at `assets/generated/kairo-voice-check.mp3`.
- Local shared coordination is active through `coordination/bus.py`. No Claude session is assumed to be present.

The currently running room is code-authored. The downloaded classroom is available as a Blender reference/asset source; it has not been converted into the running web scene. The animated robot is a temporary premade guide, not the intended realistic human teacher.

## Google Cloud: live verified state

The user selected a separate project. Created **KAIRO Access**, project ID `kairo-access-20261021`.

- Existing Google CLI login works, and the console browser is signed in.
- The new project is linked to the existing open billing account.
- Enabled: Cloud Run, Artifact Registry, Cloud Build, Vertex AI, Text-to-Speech, Cloud Storage, Firestore and the budget API (along with provider-required dependencies).
- A tiny `gemini-3.5-flash-lite` request returned `READY.` on Vertex. A Standard-C speech request returned a valid MP3. These establish live model/speech access, not educational correctness.
- The billing console showed **$299.97 remaining, 14 days left, ending 4 November 2026** at the time of inspection. The console also showed $0.03 gross account cost and matching savings for the displayed month; this is not attribution of that total to this task. Usage reporting can lag.
- Created and verified a **$30 monthly KAIRO-only development alert**, counting usage before credits, with thresholds at 50%, 90% and 100%. It is an alert, not a hard spending cap.
- No paid-account upgrade, GPU instance, production database or public deployment was performed.

Use the existing account; no new Google account is needed. The billing console's Upgrade button was not used. The trial expiry is close enough to plan the next development milestone around it rather than assume another 90 days.

[KAIRO project](https://console.cloud.google.com/home/dashboard?project=kairo-access-20261021), [billing console](https://console.cloud.google.com/billing).

## Azure: live verified state

Azure CLI login can list the enabled **Azure for Students** subscription. An existing SpeechServices resource named `PresenTate` in `francecentral` has SKU **F0**. Other existing AI resources also belong to this account.

No keys were printed, copied into KAIRO or placed in the browser. No existing Azure resource was changed. Azure speech synthesis, subscription balance, expiry and quota remaining were not tested. KAIRO currently uses Google for the live cloud checks and optional guide, so there is no need to depend on an unrelated application's Azure resource or create a second account today.

## Free usage and credit plan

| Service | Verified public allowance / billing distinction | How we use it |
|---|---|---|
| Google Cloud Welcome credit | $300 for the original 90-day trial, subject to eligibility and restrictions. This account's actual remaining time is **14 days**, not 90 new days. | Eligible cloud services in the dedicated project. [Terms and limits](https://docs.cloud.google.com/free/docs/free-cloud-features). |
| Gemini on Vertex | Billed according to model and token use. This account successfully invoked the selected Google model. | Bounded lesson Q&A; no inference server or GPU kept running. Account credit eligibility is distinct from AI Studio billing. |
| Gemini Developer API / AI Studio | Current documentation excludes the Welcome credit from these API costs; free access exists for selected models with model-specific limits. | Not the billing route chosen for this build. No AI Studio prepayment is needed for the running studio. [Billing](https://ai.google.dev/gemini-api/docs/billing). |
| Google Text-to-Speech | Standard voices: first **4 million characters/month**; Neural2: **1 million/month**. Different voice families have different allowances. Billing must be enabled. | Standard voice smoke test succeeded; the current studio narration still uses browser speech. [Pricing](https://cloud.google.com/text-to-speech/pricing). |
| Azure Speech F0 | **5 hours/month** real-time STT; **500,000 neural TTS characters/month**, subject to F0 availability and shared quota limits. | Existing F0 resource discovered, not wired into KAIRO. No guarantee its quota is unused. [Pricing](https://azure.microsoft.com/en-us/pricing/details/speech/). |
| Cloud Run | Request-based free tier includes **2 million requests/month**, with separate compute allowances and regional/network/build/storage considerations. | API enabled for future deployment. Nothing deployed yet. [Pricing](https://cloud.google.com/run/pricing). |
| Firestore | One free database/project; **1 GiB**, **50,000 reads/day**, **20,000 writes/day**, **20,000 deletes/day**. Some features have separate charges. | API enabled; no database provisioned. Local progress currently stays in browser storage. [Quotas](https://firebase.google.com/docs/firestore/quotas). |
| Browser voice / local scene / SQLite | No model-provider account required for these local functions. Device voice availability varies. | The prepared lesson and request trace work without paid inference. |
| Blender / Three.js / CC0 assets | No paid account required for this downloaded setup. Asset-specific rights remain recorded. | Studio development, animation, future classroom conversion. |

The budget alert counts cost before credits so development usage is visible even when promotional credit pays it. The local guide also limits questions to 500 characters, answers to 256 output tokens, six requests per minute and 30 requests per server process. These limits bound this preview; they are not a production billing or abuse-control system.

Do not start a GPU VM merely because credits exist. The current trial restricts GPU VM access; none is needed for this initial browser runtime. Third-party asset services have separate accounts and billing and are not assumed to consume Google credit.

## Accounts you need to create now

**None for the current working build.** Google and Azure are already connected. You do not need to paste an API key into chat or into a frontend file.

Optional later, after a concrete asset experiment is chosen:

| Account | Purpose | Current decision |
|---|---|---|
| [Avaturn](https://docs.avaturn.me/) | Create/export a realistic human avatar. | Optional. Test the export rig, expressions, permitted use and account plan before committing. |
| [Mixamo](https://www.mixamo.com/) / Adobe account | Reusable human body animations. | Optional for the human-teacher pipeline; the current robot already has clips. |
| [Thrixel](https://www.thrixel.com/docs/mcp) **or** [Meshy](https://docs.meshy.ai/en) | Generate a missing multipart teaching asset. | Choose one for a bounded trial; no account was created and no recurring plan was activated. Provider credits are separate from Google Cloud. |
| [LiveKit](https://docs.livekit.io/agents/) | Streaming conversation and interruption at later stages. | Optional later; no hosted LiveKit account is required for this first typed-question flow. |
| GitHub | Remote source control and collaboration. | Connected tools may already provide access; no new repository or public publication was created in this task. |

Do not sign up for every tool in the research list. Most are alternatives, not cumulative dependencies. No free trial quantity for an optional provider is promised without checking the exact selected account's entitlement.

## Start the studio

The verified preview uses `http://127.0.0.1:4174/`. To restart from PowerShell:

```powershell
Set-Location 'C:\Users\USER\Desktop\fnb app of year hackathon\studio'
$env:PORT = '4174'
$env:KAIRO_CLOUD_ENABLED = '1'
$env:KAIRO_AUTH_MODE = 'gcloud'
npm start
```

The built client must exist (`npm run build` rebuilds it). Use `npm run dev` for development, then refresh after changes; HMR is disabled to keep the local preview predictable. To use the prepared lesson without cloud inference, set `KAIRO_CLOUD_ENABLED` to `0`.

The explicit `gcloud` auth mode is a local Windows development bridge using the existing CLI session. Tokens remain in backend memory and are never stored in application source. A real deployment should use GoogleAuth with an attached least-privilege service identity instead. This local, unauthenticated preview is loopback-only and is not ready to expose publicly.

Blender can be opened using the executable path recorded in `tools/blender-install.json`. No browser extension or additional cloud browser setup is needed for the connections verified today.

## Easiest studios and next work

1. **Computer Science Studio:** easiest to make genuinely interactive and checkable. The current slice has an actual API/SQLite trace, scene navigation, a prepared lesson, assessment, saved progress and optional live guide Q&A.
2. **Adaptive Lecture Theatre:** easiest reusable room shell. The original classroom is downloaded; next work is web conversion, material/light optimization, teacher/board anchors and lesson synchronization.
3. **Engineering Studio:** a good next high-impact demonstration after selecting a multipart asset and one validated calculation.
4. **Law and Advocacy:** a room can be reused quickly, but role behaviour, evidence management and assessment take more work.
5. **Anatomy and Industrial/Mining:** credible assets and domain validation dominate the timeline; avoid treating a pretty model as a verified simulation.

Next priorities are the realistic teacher/art direction, classroom conversion, typed scene/lesson contracts, source upload and grounded lesson planning, synchronized speech and scene actions, then search/video adapters and durable learner storage. The six-studio product vision remains intact.
