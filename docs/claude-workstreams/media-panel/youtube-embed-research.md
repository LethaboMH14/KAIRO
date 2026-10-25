# Official YouTube embed rules: research note (C3)

Checked 2026-10-22 by claude-c3-media-panel-20261022 (Sonnet 5.5, effort unknown). Quotes were returned by a page-fetch summariser, not read in a browser. Re-verify each before shipping. Pages change.

## Quoted spans

| Topic | Quote | Source |
|---|---|---|
| Captions on | `cc_load_policy` "causes closed captions to be shown by default, even if the user has turned captions off." | https://developers.google.com/youtube/player_parameters |
| Caption language | `cc_lang_pref`: captions in the specified language "when the player loads." Without `cc_load_policy`, they "won't display by default." | same |
| Interface language | `hl` "Sets the player's interface language." | same |
| Clip start | `start` "causes the player to begin playing the video at the given number of seconds from the start of the video." | same |
| Clip end | `end`: "the time, measured in seconds from the start of the video, when the player should stop playing the video." | same |
| Origin | "you should always specify your domain as the `origin` parameter value." | same |
| JS API | `enablejsapi=1` "enables the player to be controlled via IFrame Player API calls." | same |
| Related videos | `rel`: "After the change, you will not be able to disable related videos." (cannot be fully removed) | same |
| Minimum size | "Embedded players must have a viewport that is at least 200px by 200px." | same; also https://developers.google.com/youtube/terms/required-minimum-functionality |
| Autoplay | "If you enable Autoplay, playback will occur without any user interaction with the player." | same |
| EU consent | "for end users in the European Union, you must comply with the EU User Consent Policy." | same |
| Pause | `pauseVideo` "Pauses the currently playing video." | https://developers.google.com/youtube/iframe_api_reference |
| Seek | `seekTo`: "If the player is paused when the function is called, it will remain paused." | same |
| Position | `getCurrentTime` "Returns the elapsed time in seconds since the video started playing." | same |
| State | `onStateChange` "This event fires whenever the player's state changes." | same |
| Hijack guard | Include `origin` "as an extra security measure". | same |
| Captions module | The `captions` module "handles closed captioning in the player." Options via `getOption`/`setOption`. | same |
| No overlays | "You must not display overlays, frames, or other visual elements in front of any part of a YouTube embedded player" | https://developers.google.com/youtube/terms/required-minimum-functionality |
| No modification | "You must not make changes to the YouTube player that are not explicitly described by the API documentation." | same |
| No copies | Prohibits "download, import, backup, cache, or store copies of YouTube audiovisual content" without approval (III.E.1.a). | https://developers.google.com/youtube/terms/developer-policies |
| No scraping | Prohibits "directly or indirectly, scrape YouTube Applications or Google Applications" (III.E.6). | same |
| No track separation | Prohibits "separate, isolate, or modify the audio or video components of any YouTube audiovisual content" (III.I.7). | same |
| Attribution | "must make clear to the viewer that YouTube is the source of the relevant content" (III.F.2.a). | same |
| Privacy-enhanced mode | Prevents "the use of views of embedded YouTube content from influencing the viewer's browsing experience on YouTube"; enabled by switching the embed domain to youtube-nocookie.com; "available only for embedded players on websites." | https://support.google.com/youtube/answer/171780 |

## Consequences for KAIRO

1. **Embed only.** Use the official iframe. Never download, proxy, cache or scrape video or caption files, and never split audio from video. Any transcript text shown must come from the learner's source or a file they supply, not from fetching YouTube captions.
2. **Use `https://www.youtube-nocookie.com/embed/<id>`.** It reduces YouTube personalisation from embed views. It is not a cookie-free or consent-free guarantee: the iframe still loads from Google servers, and the developer policies still require lawful consent. Gate the iframe behind an explicit "Load YouTube player" click (facade) so no request goes to Google before the learner agrees.
3. **Clip start** = `start` parameter or `seekTo`; `end` stops playback. Both take whole seconds. Our provenance record stores why a clip starts there (see contract).
4. **Captions.** `cc_load_policy=1` plus `cc_lang_pref` request captions, but we cannot know a track exists without the Data API. The contract models caption state as `unknown` by default and shows "available" only when a human or trusted source set it. No claim about auto-caption accuracy.
5. **Pause and return.** Reliable pause needs the JS API (`enablejsapi=1`, `origin`, script from `https://www.youtube.com/iframe_api`). That script load is a network call to YouTube, so it also sits behind the consent click. Our buttons sit outside the player rectangle: no overlays in front of it.
6. **Minimum 200x200**; keep 16:9 at a practical width, including on narrow screens.
7. **Related videos at the end cannot be disabled**; warn the learner and prefer `end` to stop on the clip.
8. **Attribution.** Show YouTube as provider plus channel and title as supplied by the lesson author.

## Not verified from official pages (do not assert)

- **iframe `sandbox` attribute.** The fetched pages gave no sandbox requirement. The prototype uses `allow-scripts allow-same-origin allow-presentation allow-popups` and `referrerpolicy="strict-origin-when-cross-origin"` as an engineering choice, not tested against live YouTube in this task. A too-strict sandbox may break the player; test before use.
- **EU User Consent Policy** text, and whether KAIRO needs a consent banner. Needs legal reading; the facade is a consent *step*, not a compliant consent system.
- Caption availability for any given video.
- Behaviour from a `file://` origin (the embed likely limits it). Serve from http://127.0.0.1 for a live test.
- The separate "IFrame Player API terms" were not fetched as a page. The obligations quoted here come from the Developer Policies and required-minimum-functionality pages. The API Services Terms of Service (linked from https://developers.google.com/youtube/terms/api-services-terms-of-service) still need reading by whoever signs off.
