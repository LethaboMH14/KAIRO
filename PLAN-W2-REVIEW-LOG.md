# Plan Review Log: KAIRO wave 2
Started 28 Oct 2026 21:35 SAST. MAX_ROUNDS=3. Reviewer: codex gpt-6.1-terra, low, read-only.

## Round 1 — Codex
- **W1 names the wrong label sources:** destination labels live in [navigation.ts](</C:/Users/USER/Desktop/kairo-wave2/studio/src/kairo/navigation.ts:1>), and rail labels come from [model.ts](</C:/Users/USER/Desktop/kairo-wave2/studio/src/learning-flow/model.ts:7>); claim and update those files or translate their keys at the rendering boundary.
- **The mobile-tab check is unsupported by the cited shell:** [AppShell.tsx](</C:/Users/USER/Desktop/kairo-wave2/studio/src/kairo/AppShell.tsx:10>) renders a mobile header, not the stated tab bar; locate and claim the actual surface or correct the acceptance check.
- **Language state has no sharing mechanism:** separate `useMessages()` calls reading localStorage will not reliably update one another immediately; use one shared provider or subscription and test live switching across all surfaces.
- **Setting the whole document to Afrikaans or isiZulu mislabels the English majority:** keep the page’s primary language English and apply `lang` to translated strings, including fallback strings with their actual language.
- **Draft labels alone do not establish usability or translation accuracy:** ship English infrastructure first, or gate draft catalogues behind fluent review and record the reviewer and actual evidence.
- **Picker accessibility is unspecified:** use a labelled native select, identify each language in its own language, expose the draft status and help text programmatically, and test keyboard and screen-reader behaviour.
- **The language promise is too broad:** “Only menus change” overlooks English status text, accessible names, contextual links and rail notes; enumerate exactly what changes and retain accurate language tags.
- **W2 misstates the existing gate:** [StudioCompanion.tsx](</C:/Users/USER/Desktop/kairo-wave2/studio/src/learning-flow/StudioCompanion.tsx:43>) mounts by lesson ID; [ListeningQuestion.tsx](</C:/Users/USER/Desktop/kairo-wave2/studio/src/ai-personalisation/ListeningQuestion.tsx:7>) independently checks Groq and renders an unavailable message; reuse that behaviour or specify a shared capability contract.
- **“Speak your question” suggests live recording:** label the feature “Upload a recorded voice question,” retain the Groq consent, retention and unverified-language notices, and avoid claiming live microphone support.
- **A confirmed transcript can overwrite typed text or arrive after a passage changes:** require an explicit replacement decision when the field is nonempty and cancel or invalidate transcription when source context changes.
- **W3’s visible upload copy omits consequential limits:** keep critical extraction and review limits visible at the point of upload, with supplementary detail expandable; verify every format and the 8 MiB threshold against implementation.
- **W3’s exact-rewrite and no-deleted-sentence checks conflict:** define a fact-by-fact mapping and preserve licence attribution and voice limitations without requiring every original sentence to remain verbatim.
- **W4’s in-flight-only promise cannot guarantee one request:** [AccountBoundary.tsx](</C:/Users/USER/Desktop/kairo-wave2/studio/src/account/AccountBoundary.tsx:10>) waits for status before mounting children, so their requests can start after it settles; share a page-lifetime result or pass the verified session down.
- **W4 leaves cancellation and error semantics ambiguous:** do not attach one caller’s abort signal to the shared request; preserve `response.ok` checks, per-caller unmount guards, retry behaviour and account-change invalidation.
- **W1 and W4 still overlap at file level:** serialize ownership of AppShell and publish the status interface before integration; line-level division does not satisfy the bus’s file claims.
- **The plan omits mandatory task evidence fields and handoff scopes:** add the learner need, criterion subquestion, evidence file, actual result, remaining gap and individually claimed handoff path for each lane.
- **Claim safety is unverified:** the read-only status attempt returned “unable to open database file,” so do not assume claims are free; an implementation owner must check the canonical bus and coordinate any occupied scope.
- **Validation is incomplete:** add browser checks for language, focus, overflow, consent and request counts, plus failure and retry cases; report automated, browser and human-language evidence separately.



VERDICT: REVISE
### Claude's response (round 1)
Accepted all 18. Notable: drafts gated behind review (learner sees English only plus a reviewer-preview URL); html lang stays en with per-span lang; shared LanguageProvider; labels translated at the render boundary by destination key and rail text; W4 page-lifetime memo with invalidate; W2 relabelled as recorded upload, with keep/replace and passage-keyed reset; W3 keeps the critical limits visible with a fact mapping; W4 runs before W1; per-lane evidence files.

## Round 2 — Codex
- `AppShell.tsx` has no mobile tab bar; it has the sidebar and mobile header. Remove the mobile-tab claim from W1’s scope and checks.
- The plan says FlowRail labels are looked up by English text, but `flowFor()` creates those labels in `learning-flow/model.ts`. Add that file to W1’s claimed scope and map stable keys there, or translate at the boundary without text matching.
- W4 says `invalidateAccountStatus()` runs after account changes, but sign-in/sign-out navigate to `/account`, causing a full reload and a fresh module cache anyway. Drop the invalidation requirement or name a real same-page account-change path.
- W2’s `key={selected passage start-end}` does not cover same-offset passage changes across source revisions; include source ID/revision in the key or explicitly reset on context change.
- The upload copy omits critical native processing and review-text limits that the existing visible paragraph states. Keep those limits visible or include them in the mapping and explain why moving them behind details remains clear at upload.
- The app currently uses full page loads between routes, but SPA navigation or future routing would invalidate the module-cache “one request per page” assumption; define the guarantee as one request per document lifetime and verify the routing model.

VERDICT: REVISE
### Claude's response (round 2)
Accepted all 6: the mobile tab bar is the same .ka-sidebar restyled by CSS (clarified); rail keys added in model.ts (claimed); invalidate dropped because sign-in/out reloads the page; the guarantee is per document lifetime, routing verified as full loads; W2 key includes sourceId and revision; upload copy keeps the unit and character limits visible.

## Round 3 — Codex
VERDICT: APPROVED
