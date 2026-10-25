# EXPERIENCE-INTEGRATE-002

Owner `codex-integration-20261023-b`, Codex, model/effort unknown/unknown. 23 October 2026. User authorised stronger frontend/icons, integration of talking Rain/lecture experience and bidirectional signing research/implementation, plus a Claude startup prompt.

## Delivered

- **New application route `/classroom`**, lazy-loaded under the existing TeacherProvider; linked from `/lecture` as **Learn with Rain**. Existing `/lecture`, `/learn`, `/teacher`, engineering and CS routes remain intact.
- `studio/src/experience/ExperienceClassroom.tsx`, `experience.css`, `session.ts`, `fonts/`: selected Chalk/Moss/Sage system, consistent Lucide icons, locally bundled Manrope with OFL. Actual existing Rain room/stage and its world-space pointing targets, authored stock lesson, reading/3D choice, captions, number explanations, pause/resume/read, “I'm stuck” stop/hint, prepared typed questions, source record and local calculation check.
- **Shared narration integration:** no second audio player/provider. Existing browser narration or consented Google speech handles the text. An adapter ref sends actual cloud audio energy/time to Rain; browser mode has no invented viseme timing. Leaving the route stops narration. Voice language/consent/availability errors remain handled by the existing provider. User action is required to start speech; no new paid call was made for verification.
- Phones initially use reading view, with an explicit option to load 3D. Desktop starts in the room. Reduced-motion checkbox and reading fallback on model errors. No measured mobile performance claim.
- Preview `icons.js` adds a coherent local SVG outline set, replacing navigation Unicode glyphs and adding meaningful control icons; CSS improves active navigation, spacing and small interaction feedback. All 112 screen states retained. The signed-language preview now explains both directions and does not start capture.
- `docs/blueprint/experience/SASL-BIDIRECTIONAL.md`: primary-source research, separate sign→confirmed text→speech and speech→transcript→reviewed SASL pipelines, rights/co-design gates, proposed contracts/evaluation, camera/worker lifecycle and five bounded work packages.
- `CLAUDE-START.md`: complete fresh-chat startup prompt with selected brand, current code boundary, independent review then bounded implementation, proposed roles, licences/credits/permissions and evidence expectations. Experience README/core fresh prompts link it.

## Current capability limits

This is an **authored stock lesson** integration, not arbitrary uploaded lessons with Rain. Existing source/lesson workflow is still available via My material. The classroom reuses the existing character teaching-corner stage rather than placing Rain inside the separate premade auditorium geometry. Integrating that room needs anchor/camera/board contracts and visual review; do not claim it happened.

Pointing follows selected lesson controls; it is **not exact-word choreography**. Shared arbitrary speech has no validated word/viseme timing; cloud mode uses existing energy fallback. Three pre-recorded sample files have separate timing, but this route does not pretend those timings apply to other sentences. Browser speech has no audio energy/timing signal here. No validated walk, automatic board-writing timeline or SASL motion is added.

Typed help uses prepared authored responses and a clear out-of-scope explanation, not live LLM answers or a general conversation. No microphone is enabled in this route. The sign panel is an honest unavailable state: no camera/inference/model, transcript conversion or reviewed signed clip is supplied. Camera tracking and translation remain separate future work. No fabricated sign language animation or general accuracy claim.

The prototype’s logo is still a layout reconstruction; Claude has the selected reference and final-master/reproduction task. Font is Manrope with supplied OFL, not custom logo lettering. Rain credit points to existing `/models/character/CREDITS.txt`.

## Primary research

MediaPipe Hand Landmarker Web and Gesture Recognizer primary docs checked 23 October: features/gesture categories are not a SASL language model. Maswao construction repository describes weakly aligned SASL video/text and explicitly notes video licensing/privacy restrictions. No clear blanket grant for source-video training was established. SADiLaR is a discovery lead, not rights clearance. Detailed links and limitations are in SASL-BIDIRECTIONAL.md. No bulk source video or dataset/model weight downloaded; no private source upload or training run.

## Verification actually run

- `npm run build` in `studio`: TypeScript and Vite **passed**, 2,225 modules; existing large-chunk warning remains (~532 kB OrbitControls chunk). New classroom JS ~14.38 kB and CSS ~6.79 kB before gzip, plus separate font and existing lazy 3D chunks. This is not a total room download budget or performance measurement.
- `npm test`: **217 tests passed**, zero failures. Includes three new `experience-session.test.mjs` checks for contextual quantity semantics, out-of-scope authored responses and bounded step/answer handling. Tests printed an existing test-server WebSocket port-24678 warning, but completed successfully. No process was killed or conflicting server reconfigured.
- `node design/app-experience-20261023/verify.cjs`: all **112** local render states, links/assets/journeys and contextual anchors pass; no preview network/microphone/persistence calls.
- Browser visual, real-audio playback, model loading/pointing on actual devices, assistive technology and learner acceptance remain pending. Prior denied browser observation was not bypassed by another surface. No browser/HTTP screenshot or model interaction was run.

## Coordination and next work

Bus proposal message 42 announced exact owned shared files before implementation. Character interface v1 and TeacherProvider untouched. Other active claims left intact, especially reference-core, prior heartbeat roadmap and Claude C1/C3 review. Core plan verification JSON was not rewritten by this task; original check records remain historical. No schedule recreated, new cloud service or public deployment.

Claude should read CLAUDE-START.md and register/check current status. Proposed visual work: precise selected brand master, Rain staging and actual auditorium board/camera/point targets, expressive choreography and measured phone tier. Proposed SASL work starts with rights/evidence and a separate explicitly labelled capture/tracking package before any translation claim. Codex next owns shared timing/session/source integration and permissioned conversation under a separately claimed contract. A message to `all` is discoverable only; no Claude receipt/acknowledgment is claimed.
