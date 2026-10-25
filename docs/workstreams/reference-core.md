# Read-only media and search reference contract

Status: pure, bounded reference validation only; checked 22 October 2026. This module does not search, fetch, download, proxy, crawl, create an iframe element, or execute external content.

## Contract

`parseYouTubeEmbed(url)` accepts only HTTPS watch links on the exact `youtube.com` / `www.youtube.com` hosts or short links on exact `youtu.be`. It accepts one 11-character video ID and at most one numeric start parameter (`t` or `start`, 0–604800 seconds), rejects duplicate/unrecognized parameters and fragments, and constructs a fixed `youtube-nocookie.com/embed/{id}` URL. The result sets `autoplay: false`; no caller-supplied HTML or embed origin is accepted.

Privacy-enhanced mode changes the embed hostname, but loading an embedded player still contacts a third party. It is not a consent, privacy-compliance, or tracking guarantee. A consuming UI must wait for deliberate user action before loading the player and follow applicable policy.

`validateOutwardReferenceUrl(url)` is a strict HTTPS outbound-link validator: it rejects credentials, ports, fragments, non-DNS-looking/local names and IP literals. It returns a canonical URL string for display/navigation. This is not SSRF-safe fetch authorization: no DNS resolution or connection exists here, and DNS rebinding cannot be assessed without a real network boundary. Never use its result to authorize server-side fetching.

`createSourceCard` requires bounded display text, exact original URL, provider, canonical UTC ISO timestamps, and `eligibility: 'unknown'`. `getSourceFreshness` returns `current`, `expired`, or `unknown`; invalid/future checked dates and malformed dates return `unknown`. `canOpenSource` is true only for current metadata. Expiry means the source reference must not be offered as openable; current timestamps do not prove availability, relevance, safety, or eligibility.

Source titles, descriptions, page contents and search results are untrusted data, never instructions or authorization. The reference contract provides no trust in referenced content.

## API and checks

Module: `studio/server/reference-core/references.mjs`. Stable errors are `ReferenceError` instances with a short `code`. Tests: `studio/tests/reference-core.test.mjs` (6 passing targeted cases, run `node --test tests/reference-core.test.mjs` from `studio/`). No app route, provider, package, or live search was added.

## Primary sources checked 22 October 2026

- [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters): documented `/embed/VIDEO_ID` format and player parameters; `autoplay` can cause playback without user interaction.
- [YouTube Player API Reference for iframe Embeds](https://developers.google.com/youtube/iframe_api_reference): IFrame API mechanics and third-party player behavior.
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html): prefer allowlists, do not treat whole user URLs as safe fetch targets, account for redirects/DNS resolution and bind destination validation to the actual connection.
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html): untrusted URLs used in `href`/`src` require validation and context-appropriate handling.

The YouTube docs describe the canonical embed format, not a guarantee that any video can be embedded. Embedding may be disabled, content can change, and playback or external eligibility must be independently checked.
