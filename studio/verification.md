# Foundation verification — 21 October 2026

## Build and tests

`npm run build` passed TypeScript checking and Vite production compilation. The lazy-loaded scene bundle is approximately 1.014 MB / 277 KB gzip; Vite reports a large-chunk warning. This is not a frame-rate benchmark.

`npm test` passed 3 tests:

- real SQLite topic filtering, empty results and finite trace timings
- parameterized input cannot alter the SQL; invalid topic values are rejected
- cloud questions are bounded and validated before provider use

The previous bus's 6 tests belong to the coordination setup, not the application test count.

## Live local API and browser checks

Preview: `http://127.0.0.1:4174/`, built client served by `node server.mjs --production`, loopback only. The retained execution session is 50851 at handoff time. This is a development session identifier, not a durable service.

- Health endpoint returned `ok: true`, `runtime: local-node-sqlite`, and `cloudConfigured: true` after explicit local setup.
- Browser request for `database` returned 2 actual SQLite rows and 4 explanatory stages.
- Browser request for `unlisted` returned 0 rows with an explicit successful-empty-result explanation.
- The assessment showed correct feedback and saved progress; the saved indication remained after reload.
- The 3D room and premade animated robot rendered in the in-app browser and were visually inspected.
- Final visual review found the teaching board's HTML text was not visible. It was replaced with a scene-native canvas texture so the title and request path render on the actual board surface.
- 2D view and return to 3D were exercised. The initial conditional unmount caused React/HTML-portal errors; retaining the Canvas and removing development double-mount fixed the observed transition. No new error-level console messages were recorded during the post-fix transition check.
- At a 390 px viewport, the mobile media query was active, workspace layout changed to flex, and document width did not exceed viewport width. The mobile screenshot backend could not produce a reliable full-page capture; these measurements are not full mobile visual acceptance. The viewport override was reset.
- The live guide answered “Why does the API need a database?” inside the application using the prepared lesson and actual query context. No live web retrieval is implemented.

## Cloud and tools

- Created project `kairo-access-20261021`, verified billing linkage and enabled the selected APIs.
- A separate bounded Vertex smoke test returned `READY.` using `gemini-3.5-flash-lite` (6 reported tokens).
- Google Text-to-Speech returned a 29,952-byte MP3 sample.
- Budget verification showed a KAIRO-only USD 30 monthly alert, excluding credits, at 50%, 90%, 100% actual-spend thresholds. This is not a hard cap.
- Billing browser displayed $299.97 credit remaining and a trial end of 4 November 2026 (14 days remaining).
- Azure CLI listed enabled Azure for Students and an existing F0 SpeechServices resource. Azure credit balance, expiry and speech execution remain unverified.
- Blender 4.5.14 LTS matched the official download checksum and executed `--version` successfully. The official classroom archive was downloaded and extracted, not integrated into the runtime.

## Limits

No public deployment, production authentication, durable cloud learner storage, uploaded-source lesson generation, realistic human lip sync, web/search/video tool runtime, accessibility-user testing, learning-outcome study or frame-rate acceptance was completed. The current interactive slice is a development foundation. Cloud answers require educational review; a successful provider call does not prove teaching quality.
