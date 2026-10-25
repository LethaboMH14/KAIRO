# KAIRO studio foundation handoff

Agent: `codex-studio-20261021-a`; client Codex; exact model/effort not exposed, recorded `unknown`. Date: 21 October 2026.

## Ownership and changes

BUILD-001 covers studio/, tools/, assets/, the setup/ADR docs, root README/.gitignore and this handoff. Read the current bus status before editing; completion releases occupied scopes.

Implemented a React/R3F room with a CC0 animated robot, real local API/SQLite trace, 2D alternative, prepared explanations, browser narration, assessment/browser-local progress and optional live Vertex Q&A. The full six-studio vision remains unchanged.

Installed locked npm dependencies and portable Blender 4.5.14 LTS. Downloaded the CC0 RobotExpressive model and the official CC0 classroom source. Read assets/manifest.json and tools/blender-install.json. The room is code-authored; the classroom is extracted under assets/reference/classroom/, not yet converted into the web runtime. Large reference/install files are ignored by Git.

## Google Cloud and Azure

User explicitly selected a separate Google project: `kairo-access-20261021`. It is billing-linked with selected APIs enabled. Vertex readiness, an actual in-app guide question and a TTS smoke test succeeded. A $30 project-only gross-usage alert is configured at 50/90/100%; it does not cap spending. Billing UI showed $299.97 remaining, ending 4 November 2026. No account upgrade or GPU deployment occurred.

Azure CLI authentication can enumerate an enabled Azure for Students subscription and an existing F0 speech resource. No existing Azure resource was modified, and no key was retrieved. Azure credit expiry/balance and actual speech execution remain unverified.

## Run and interfaces

See studio/README.md and docs/KAIRO-SETUP-AND-ACCOUNTS.md. The retained local preview is http://127.0.0.1:4174/ (execution session 50851), production client with cloud mode explicitly enabled in its shell. Keep it loopback-only. Earlier duplicate development servers were stopped.

- `GET /api/health`: local runtime and cloud configuration status.
- `POST /api/trace`: validated topic -> real parameterized SELECT -> rows and trace.
- `POST /api/ask`: bounded question/topic/stage -> independently recomputed query context -> Vertex response. No tools or web browsing are exposed to the model.

GoogleAuth supports service identity/ADC. Explicit `KAIRO_AUTH_MODE=gcloud` is a local Windows bridge capturing a fixed CLI token command into backend memory. No credentials are stored in the repository or sent to the browser. A cloud deployment needs least-privilege identity, authentication and durable storage; do not simply expose this preview.

## Evidence and limits

studio/verification.md records passing build, 3 unit tests, API/browser/Vertex/TTS checks and limits. Vite's scene-bundle size warning remains. Initial Canvas unmount errors were fixed and the transition retested without new errors. Mobile layout measurements passed; reliable mobile full-page screenshot capture was unavailable.

Next: choose the realistic teacher art direction, convert/optimize the classroom and define named anchors, then connect a grounded lesson schema to synchronized scene actions. Source upload, automatic lesson planning, search/video MCP adapters and durable learner records are still future work. Use scoped bus ownership for shared contracts and package changes; do not infer release readiness from these checks.

VIS-002 follow-up: the final image review found invisible HTML text on the teaching board. Its content now uses a scene-native canvas texture, with a fresh client build and image check recorded after the repair.
