# KAIRO Evidence X-Ray — isolated first wave, 25 October 2026

## Session and ownership
- Worker: `gpt6-kairo-evidence-xray-20261025-a`, GPT-6; effort level not exposed. Original scope claim: issue #89.
- Starting head `main@1997ba9f046f6d4122169cb26a72e89cc60befd1`, isolated branch `feat/evidence-xray-20261025-gpt6a`.
- Remote GitHub connector only. **Owner's live canonical SQLite bus is NOT remotely readable and no local claim was made.**
- Exclusive new paths: `studio/src/evidence-xray-20261025/**`, `studio/tests/evidence-xray-20261025.test.mjs`, this handoff. PR #52/source-selection, server, lesson routes, shared styles and studio-context owners remain untouched.

## Real functionality
- New `core.mjs` and typed `core.d.mts`: strict reviewed source IDs/SHA256 revision/excerpt ID/UTF-16 offsets/character bounds, duplicate refusal, 1–8 owned references, deterministic cycle-safe concept/evidence graph and deterministic two-round curated exercises.
- `prepared-pump.mjs`: original KAIRO-authored, **synthetic, prepared** centrifugal pump teaching notes. Three exact teaching excerpts; eight curated concepts (one intentionally unsupported) and two preauthored evidence-answer challenges. SHA256 of the three authored page records is checked in tests. **This is not a real learner upload, engineering certification, or outside technical peer review.**
- `EvidenceXRay.tsx` + **locally scoped** `EvidenceXRay.css`: source quote lens, provenance/range labels, responsive HTML/SVG constellation, visible unsupported link, keyboard button navigation, text list fallback, readable excerpt list, deterministic prediction/feedback/second challenge, local-unsaved label, enhanced-contrast and reduced-motion styles. Auto-extracted concept maps and answer-key certification are NOT implemented.
- `getAuthenticatedPreview`: read-only `POST /api/workspace/bundle-preview`, using `credentials: same-origin`, `cache:no-store`, local-only body, owner-bound server check and strict v2 preview parsing. `refreshAuthenticatedCatalog` and `checkCurrentSources` provide revision and revoked guard support. Unreviewed actual owner excerpts can be explored **only** after an authorized preview; they cannot auto-populate prepared concepts or quiz keys.
- Development-only **runnable** Vite entry: `cd studio && npm ci && npx vite --host 127.0.0.1 --port 4189`; open `http://127.0.0.1:4189/src/evidence-xray-20261025/demo.html`. It mounts the actual React component for the original offline prepared case; it does not read private owner content or require network services after installation. No production learner route is mounted.
- Navigation: Tab into graph nodes, Arrow keys move through nodes, Enter/Space activates; map/list toggle; choosing source/idea sends focus to the appropriate panel; returning to graph restores focus; moving to the next answer shifts focus only after React renders the new challenge.

## Risks / explicit limitations
- Reviewed auth and revocation must always be enforced by the existing server; browser catalog checks are not a security boundary. UI integrating a private source preview MUST inject a fresh authenticated catalog snapshot and handle source changes; no durable entitlement or lazy raw-text read is added.
- Source offsets certify a match to the *server-returned excerpt* and are guaranteed against archived reviewed pages by the upstream `prepareOwnedLessonBundle`. Client cannot independently inspect private original surrounding page text, which is deliberately not returned.
- Fictional/example graph relations are manually curated and not asserted as peer-reviewed engineering guidance. Off-demo extracted arbitrary claims always return **"Not established by the selected sources."**
- No user-save, score, mastery status, model call, hosted run, cloud change, recording or production deployment.
- Browser observation/screenshot restricted under existing repo policy. **No real browser/keyboard/screen-reader/phone evidence is claimed.** Confirm permission first; do not silently bypass it. Visual CSS review is not an observed screenshot.

## Test plan and evidence boundary
- Focused `cd studio && node --test tests/evidence-xray-20261025.test.mjs` covers source SHA/quotes, two rounds, cycle/disconnected graph, invalid or duplicate evidence, cross-owner/revoked/stale catalog, HTTP status failures, no provider-call fields, bounded deterministic graph performance and failed JSON.
- Required exact-head gates before merge: `node --test --test-concurrency=1 tests/*.test.mjs` under Node 24, `npm run build`, `python -m unittest coordination.test_bus`. Inspect GitHub Actions for **actual results**, not the prior main count. Any failure must be repaired before review.

## Judging alignment
- Product: action connects excerpt→concept→verified-as-curated-answer→second attempt; private preview is reading-only until separately integrated.
- Creativity: source-context spatial graph, relationships open actual citations; visible uncertainty rather than decoration.
- Usability: semantically labeled panels and controls, focus return, list/fallback/zoom/reduced-motion styles; **human/device evidence open**.
- Sustainability: no paid inference, bounded graph and no new runtime deps. Hosting cost not measured.
- Impact: hypothesis that evidence inspection helps learning, no human-tested gains.
- Presentation: dev-only prepared truthful demo; no live hosted route or accepted screenshot.
- Intelligence: explicit curated answer key; no automatic source-veracity certification, model evaluation or invented mastery.

## Required next integration
Coordinator to independently review actual PR diff, exact-head Actions, authorized UI/browser evidence. Assign separately scoped `SourceWorkspace` / `StudioRouter` auth-route owner to feature-gate mount on a synthetic account and adopt the read-only /catalog→/bundle-preview adapter; re-fetch current reviewed catalog before private evidence access, show stale/revoked 409 recovery. Do not mount or release without distinct scope claim and full journey/accessibility tests.
