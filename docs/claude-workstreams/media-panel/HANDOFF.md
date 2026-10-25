# C3 handoff: media panel contract and prototype

Agent: claude-c3-media-panel-20261022. Client Claude, model claude-sonnet-5-5, effort not exposed (unknown). 22 October 2026. Bus task C3-MEDIA-PANEL, scope: design/claude-workstreams/media-panel and docs/claude-workstreams/media-panel only.

## Files

- `docs/claude-workstreams/media-panel/media-panel-contract.ts`: proposed types (provider identity, caption tri-state, timestamp provenance, passage/video/artifact items, panel props, hard rules). Not imported anywhere; not type-checked with tsc in this task.
- `design/claude-workstreams/media-panel/media-panel.html`: standalone prototype, no build step. JSON-editable entry with passage, video and artifact presets.
- `docs/claude-workstreams/media-panel/youtube-embed-research.md`: quoted official spans with URLs, checked 2026-10-22, plus what is not verified.

## Checks actually run

In the Browser pane (static file snapshot) via script: offline simulated play reached "playing" and the timer advanced; "Return to lesson" paused and wrote the return message; passage and artifact presets rendered; a bad video ID was rejected; the page made 0 resource requests. Not run: layout at phone width, screen reader, keyboard-only pass, tsc on the contract, and the live YouTube embed (needs a real video ID and an http origin, plus the user's agreement to contact Google).

## Limits

- The offline "player" is a timer, not video. Live embed code (nocookie iframe, IFrame API script, `onStateChange`, `pauseVideo`) is written from the docs and untested.
- iframe `sandbox` flags are my choice, not from official pages. Test before use.
- Caption availability cannot be known from the embed; the contract defaults to `unknown`. Only `yes` with a basis other than `none` is accepted.
- Timestamp reasons are authored data. A model-suggested start is shown as unconfirmed.
- The consent click is a step, not legal EU consent compliance. Legal reading is needed.
- All sample text is placeholder, marked `sim_`.

## Proposed integration (Codex decides)

1. Add `MediaPanelEntry[]` to the lesson snapshot next to `Chapter.citationIds`, keyed by chapter index, or as a sibling file so the immutable `Lesson` shape is not changed in place. Passage items should reference existing `Evidence` rather than copy it.
2. Build a `MediaPanel` React component in a new folder under `studio/src` (not claimed here). Keep controls outside the iframe rectangle. Min 200x200, 16:9.
3. "Return to lesson" must pause media and restore `returnTo` plus focus; wire it to the existing "I'm lost here" evidence reader flow.
4. Make caption absence visible and always offer the text passage as the fallback.
5. Authoring: timestamps and reasons set by lesson author or learner; any model suggestion stays unconfirmed in UI until a person confirms.
6. Never proxy, download, cache or scrape YouTube media or captions. Do not fetch YouTube captions for transcripts.
7. Add tests for: validation rules, no request before consent, status transitions.

No router, package or `studio/src` file was touched.
