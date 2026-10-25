# Consent-gated YouTube media panel

## Status and scope

This is an isolated React component and pure descriptor for a provided YouTube video ID and optional start time. It is not routed into the application. It makes no search, server-side request, API call, download, transcript request or account setup. Root owns any later route/source integration.

## Contract and behavior

`YouTubeMediaPanel` accepts `{ videoId, startSeconds?, title, sourceContext }`. The presenter accepts exactly an 11-character YouTube ID (`A-Z`, `a-z`, digits, underscore or hyphen), a whole-number start between 0 and 604800 seconds, a nonempty title up to 200 characters, and source context up to 1200 characters. It constructs a fixed `youtube-nocookie.com/embed/{id}` URL and the canonical `youtube.com/watch?v={id}` link. A nonzero valid start adds only the `start` parameter. Any invalid field yields visible error text and no URLs.

The initial component render contains no iframe and no embed URL in the DOM. Only the learner's explicit **Load YouTube video** click mounts the fixed iframe. The button is preceded by the provider/network disclosure and an offline-availability note. No autoplay or JavaScript player API is requested. The learner can unmount the player with **Unload video**. Consent is keyed to the exact validated ID and start; changing either returns to the unloaded facade. The source context and title are rendered as ordinary escaped React text. React `useId` gives each panel an independent heading and privacy-description target, including when several panels are rendered together.

The iframe has a descriptive title, lazy loading, strict-origin referrer policy, sandbox and a limited media/fullscreen allowlist. Player controls remain unobstructed. Captions are available only if supplied by YouTube for that video. An iframe error is displayed as a load error; a loaded iframe is not proof that the video can play.

## Privacy and provider caveats

The [official embed parameters](https://developers.google.com/youtube/player_parameters) define the embed format and start parameter; the [developer policies](https://developers.google.com/youtube/terms/developer-policies) and [required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality) govern embedded player use. YouTube describes [privacy-enhanced mode](https://support.google.com/youtube/answer/171780) as a different embed domain. `youtube-nocookie.com` still contacts Google/YouTube when loaded, so this implementation discloses the connection before the user action. The click is a product-level connect step, not a claim of legal-consent compliance or zero tracking.

Embedding can be disabled, the video can be unavailable or changed, and captions may be absent. This module makes no playback, transcript, clip suitability, accessibility or offline guarantee. The iframe sandbox settings are an engineering choice based on the prior official-source review and have not been tested against the live player.

## Verification

`studio/tests/media-panel.test.mjs` checks fixed-origin URL construction, hostile ID and start rejection, exact-load-key behavior, text escaping, invalid metadata, initial React server rendering with no iframe, and unique accessible IDs across multiple server-rendered panels. Focused strict TypeScript validation also passes with dependency declaration checking skipped. No network/player request, browser playback or download is tested here.
