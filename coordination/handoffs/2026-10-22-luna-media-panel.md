# LUNA-MEDIA-PANEL-001 handoff

**Owner:** `codex-luna-media-panel-20261022-c`  
**Model/effort:** `gpt-6-luna` / `low`  
**State:** isolated component ready for root review; route/source integration pending  
**Claimed scope:** `studio/src/media-panel`, `studio/tests/media-panel.test.mjs`, `docs/workstreams/media-panel.md`, this handoff.

## Files

- `studio/src/media-panel/presenter.ts` — validates strict video ID, timestamp and display text; generates only fixed-origin YouTube embed and canonical video URLs; exposes ID/start-key consent helpers.
- `studio/src/media-panel/YouTubeMediaPanel.tsx` — provider/source identification, pre-load privacy and offline notice, explicit load/unload controls, safe iframe attributes, escaped source context, visible validation and iframe errors.
- `studio/src/media-panel/media-panel.css` — local scoped presentation; the player has an unobstructed 16:9 surface with minimum 200px height.
- `studio/tests/media-panel.test.mjs` — pure contract checks and initial React SSR smoke.
- `docs/workstreams/media-panel.md` — API, behavior, official references and limits.

## Decisions and safety

- The browser module does not import `studio/server/reference-core`; its imports are local React and the isolated pure presenter only.
- No iframe exists before an explicit click. It uses a fixed `www.youtube-nocookie.com` URL created from a validated ID, no autoplay and no JS API. A separate canonical YouTube link is visible as a learner-initiated navigation option.
- Exact video ID plus start time keys the load request, and an effect clears stored load intent/errors when that key changes. A changed player target cannot render under a previous target's consent key. No iframe `onLoad` handler claims that the video played.
- No browser, server, router, shared CSS, application shell, pack model, package or manifest changed.
- Repeated panels use `useId` for unique accessible title and privacy disclosure IDs; the disclosure button references its own instance.
- `youtube-nocookie.com` still makes a Google/YouTube request after the click; the click is not a legal-consent-compliance claim. Embedded availability, playback and captions remain unknown. The iframe error callback is not treated as a complete provider-availability check. The sandbox is an unverified engineering choice.

## Checks

- `node --test tests/media-panel.test.mjs` from `studio/`: 6 passed, including a multiple-panel SSR assertion verifying unique and correctly referenced title/privacy IDs while retaining the no-iframe pre-consent boundary.
- Focused strict TypeScript check with `--skipLibCheck` for the panel and presenter: passed.
- Initial React SSR confirms the consent facade contains no iframe or embed URL. Tests make no external network request.

## Remaining work

Root review, later route/source-data integration, and browser playback/accessibility acceptance. No live player or external network request was made as part of this task.
