# Review of C3 media panel contract and prototype

Reviewer: claude-engineering-20261021-a (Opus 5.5, effort unknown). Task REVIEW-C1-C3, 22-23 October 2026.
Reviewed: `docs/claude-workstreams/media-panel/` (contract, research note, HANDOFF.md) and `design/claude-workstreams/media-panel/media-panel.html`, owner claude-c3-media-panel-20261022 (Sonnet 5.5).
Gate: Opus review gate in `coordination/roadmap/CLAUDE-DELEGATION.md`.

## Verdict: accepted as a design contract; the prototype's live path is broken and must not be copied

The research note is sound. The contract compiles and the privacy-first shape (no request before consent) holds. But the prototype's live YouTube path destroys its own player, which the owner never ran, and several rules in the contract are comments only.

## 1. Research note: 24 of 26 quoted spans verbatim

Method: `checks/quote-check.mjs` fetches the five cited official pages and matches every double-quoted span after whitespace and quote normalisation only. Result in `checks/quote-check.json`.

- 24 spans are verbatim on the page the note cites. The four section numbers (III.E.1.a, III.E.6, III.I.7, III.F.2.a) are correct; I rebuilt them from the page's nested list structure.
- Two spans are truncated, both with the page's own punctuation replaced by a full stop:
  - "won't display by default." The page continues ", but will display in the specified language if the user opts in".
  - "If you enable Autoplay, playback will occur without any user interaction with the player." The page continues "; playback data collection and sharing will therefore occur upon page load." That dropped clause is the one that supports the consent facade.
- Five statements on the cited pages that matter to this feature are missing from the note:
  - API clients "must provide identification through the HTTP Referer request header" (required-minimum-functionality). Without it the player shows error 153 (iframe_api_reference; support.google.com/youtube/answer/171780). The note lists `file://` behaviour as "not verified"; the official pages answer it: no Referer means a blocked player. Any `file://` or `no-referrer` page will fail.
  - "We recommend 16:9 players be at least 480 pixels wide and 270 pixels tall."
  - A player with controls "must be large enough to fully display the controls without shrinking the viewport below the minimum size."
  - Autoplay data-collection clause (above).
- Not verified here: the sandbox attribute (the note says so itself), EU consent law, caption availability, and the API Services Terms. I agree with the note's own "Not verified" list.

## 2. Contract: type-checks, but its invariants are comments

`tsc --strict` on the contract alone: exit 0 (HANDOFF said it was never type-checked).

`checks/contract-probe.ts` marks eight states the contract's comments forbid. TypeScript accepted all eight (unused `@ts-expect-error` at each line):

- `availability: "yes"` or `"no"` with `basis: "none"` (comment: "none only with unknown")
- negative, fractional, or end-before-start seconds
- empty `reason`
- empty `videoId` (the prototype's own video preset ships `videoId: ""`)
- empty provider `label` and `attribution`

One invariant is enforced by types: a model-suggested clip cannot be confirmed by the model (`confirmedBy` allows only lesson-author or learner).

Repair for whoever integrates: make `CaptionInfo` a discriminated union (`{availability:"unknown";basis:"none"} | {availability:"yes"|"no";basis:Exclude<...,"none">}`) and add a `parseMediaPanelEntry` validator as the single gate, with tests. Constants like `noNetworkBeforeConsent: true` are documentation, not enforcement; the test must be behavioural (see section 3).

## 3. Prototype: headless Edge 155, no request left this machine

Method: `checks/media-panel-check.mjs`. Every request is paused through DevTools; YouTube hosts are held or answered by a local stub, anything else is failed, and the browser also resolves every host except 127.0.0.1 to NOTFOUND. The video ID is the synthetic `sim_test_00`. 22 requests were seen: 18 to 127.0.0.1, 4 to YouTube hosts, none sent. This does not test the real player.

32 of 48 checks pass. Passed:

- No request beyond 127.0.0.1 on load, offline play, presets and the consent stage. YouTube hosts (`www.youtube.com` script, `www.youtube-nocookie.com` embed) are requested only after "Agree and load player".
- The embed request carries a Referer (`http://127.0.0.1:4187/`). With a `file://` origin it would not.
- All controls reachable with Tab, 3px focus outline; "Return to lesson" moves focus to the lesson.
- Author-supplied text renders as text (an `<img onerror>` title stayed inert).
- No console errors in any scenario. Consent stage fits at 390 and 1280 px.

Failed (16):

| # | Finding | Evidence |
|---|---|---|
| F1 | **The live player destroys itself.** The iframe's `load` handler calls `setStatus("ready")`, which calls `render()`, which rebuilds `#body` and replaces the iframe with an empty `<div id="yt">`. The same happens on "Return to lesson". `YT.Player` is also bound to the removed node, so `onStateChange` and `pauseVideo` cannot work. This would happen against real YouTube too. | `checks/media-panel-report.json`; screenshots 06 and 07 (empty black box, status "ready") |
| F2 | **Player below the 200x200 minimum at narrow widths.** The iframe is 329.5 x 174 px at 390 and 800 px viewports. The `.player` box is 200 high but has 12px padding and a 1px border, so its content is 174. The 200px rule applies to the player viewport, not its container. 1280 px passes (466 x 250.8). | report, screenshot 05 |
| F3 | **Keyboard focus is lost.** Pressing Enter on Play/Pause or "Load YouTube player" re-renders the panel and focus drops to `<body>`. "Show media beside lesson" only scrolls and leaves focus on itself. | report |
| F4 | **Phone overflow.** At 390 px device width page content is 406 px wide (16 px sideways scroll). The panel is 389.5 px against a 358 px grid column. | report |
| F5 | **Contrast.** `.sim` text on the dark player is 3.29:1 in light mode. In dark mode the primary buttons (`Return to lesson`, `Apply`) are white on `#7fb0ff`, 2.2:1; the `:root[data-x]` rule meant to fix this is dead. Both below 4.5:1. | report |
| F6 | **Prototype validation is weaker than the contract.** Accepted without error: captions "no" with basis "none"; availability "maybe" (the panel prints "undefined"); a model confirming its own suggestion; provider kind "vimeo"; embed host `www.youtube.com`. Negative start, end before start, empty reason and empty label are rejected. | report |

HANDOFF.md's statement that only "yes with a basis other than none is accepted" is true but understates F6.

## 4. Repairs and remaining checks

Repairs (owner, or Codex when integrating): fix F1 first by updating text nodes in place and never replacing `#yt`/the iframe after creation; size the iframe, not its wrapper, to 200 px minimum; move focus deliberately after each render; fix the overflow and the two contrast failures; use the contract as the single validator.

Remaining checks that need the user's agreement because they contact Google: one live play with a real video ID served over `http://127.0.0.1`; `pauseVideo`, `onStateChange`, `start`/`end` against the real player; sandbox flags (the prototype uses `allow-popups`; the shipped component in `studio/src/media-panel` does not, and that was not reviewed here); screen reader pass.

## 5. Note on the shipped component

`studio/src/media-panel/` (owner codex-luna-media-panel-20261022-c) already exists and was outside this review. F1, F2, F3 and the Referer requirement should be checked against it.

## Evidence

- `checks/quote-check.mjs`, `checks/quote-check.json` (page SHA-256s and fetch times)
- `checks/contract-probe.ts`
- `checks/media-panel-check.mjs`, `checks/media-panel-report.json`
- `screenshots/review-c3-01` to `-08`
- Prototype SHA-256 recorded in the report.
