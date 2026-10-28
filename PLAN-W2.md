# Plan: KAIRO wave 2: language, voice questions, plainer copy, fewer requests
_Round 2: revised after Codex rounds 1–2 (see PLAN-W2-REVIEW-LOG.md)_

## Goal
Make KAIRO usable by someone who prefers another South African language or would rather speak than type, and make the main screens easier to read. Do this without overclaiming translation quality or voice support. Base: branch `claude/wave2-20261028` from `claude/improve-loop-20261028` @ 31225e0 (PR #147 under review, so nothing is pushed to that branch). Worktree `C:\Users\USER\Desktop\kairo-wave2`. Shared contract, caveat rule and per-lane brief fields are as in wave 1 (`../kairo-improve-loop/PLAN.md`).

Facts found in the code:
- There is no i18n layer. All UI strings are inline JSX.
- The sidebar and mobile tab navigation live in `src/kairo/AppShell.tsx` (2985 bytes). The step rail lives in `src/learning-flow-ui/FlowRail.tsx` and `src/learning-flow/LearningFlow.tsx`.
- Cited passage help already exists. `src/teacher/SourceReader.tsx` POSTs `/passage` with `{question, language, action, consent:true}`. It has a 300-char question `<input>` whose placeholder is shop-specific ("Why do deliveries increase this value?").
- `src/ai-personalisation/ListeningQuestion.tsx` is an existing component, used in StudioCompanion. It covers recorded-audio upload, Groq transcription, an editable transcript, confirm, and `onQuestion(text)`. It opens no microphone.
- `src/reasoning-classroom-host/ClassroomReasoningPractice.tsx` has live dictation via `createGroqReasoningTranscriber`. PR #146 (open) hides that dictation when Permissions-Policy blocks the microphone.
- `/api/account/status` is fetched separately by `AccountBoundary.tsx`, `AccountPage.tsx` and `AppShell.tsx` (2–4× per page).

## Approach — four lanes, serialized where they share files

Every lane:
- Claims its exact files on the canonical bus before editing. A lane is unstarted until its claim succeeds.
- Records criterion/subquestion, learner need, evidence files and remaining gaps in `docs/improve-loop-20261028/wave2/<lane>.md`.
- Reports automated checks, browser checks and human-language evidence separately.

Order: **W4 → W1** (both touch `AppShell.tsx`); W2 and W3 run in parallel with them.

**W4 — one account-status request per page (Haiku, low).** Sustainability. Files: new `src/account/status.ts`, `src/account/AccountBoundary.tsx`, `src/account/AccountPage.tsx`, `src/kairo/AppShell.tsx` (status fetch only).
- Routing was verified as full document loads (plain `<a href>`, with no client router). The guarantee is one request per document lifetime, using a module-level memo. `getAccountStatus()` memoizes the parsed result (or an in-flight promise) for the page lifetime.
- It never attaches a caller's abort signal to the shared request. It keeps the `response.ok` check. On failure it clears the memo so a retry refetches.
- Callers keep their own unmount guards.
- Check: 1 request per document on `/`, `/sources`, `/account`. A failure followed by retry refetches. Sign-in and sign-out (which reload the page) show the right state.

**W1 — interface-language foundation, reviewed languages only (Luna, medium).** Usability, Sustainability. Files: new `src/i18n/` (`LanguageProvider.tsx`, `catalogues/en.ts`, `catalogues/af.ts`, `catalogues/zu.ts`, `REVIEW-NEEDED.md`), `src/kairo/AppShell.tsx` (after W4), `src/learning-flow-ui/FlowRail.tsx` (label rendering only), `src/learning-flow/model.ts` (add step keys only), `src/learning-flow/AccessDialog.tsx` (picker).
- One `LanguageProvider` (React context) holds the choice. It persists to `localStorage['kairo.uiLanguage']` with try/catch and also listens to `storage` events, so every surface updates live.
- Scope (exact list): the 5 destination labels (translated by `key` from `kairo/navigation.ts` at AppShell render; on phones this same `.ka-sidebar` element is restyled by `kairo.css` into the bottom tab bar, so one render covers both); Voice language & camera; Settings & access; For educators; Account & private material; Skip to content; and the rail step labels, which get a stable `key` added in `flowFor()` in `src/learning-flow/model.ts` (added to W1's files) and are translated by key at FlowRail render.
- Accessible names follow the visible label. Status text, notes and everything else stay English.
- `<html lang>` stays `en`. Each translated string renders inside `<span lang="af|zu">`, and a fallback string has no span.
- **Honesty gate:** the picker lists only catalogues whose `meta.reviewed===true`, plus English. Today the af/zu drafts have `reviewed:false`, so learners see English only, with the line "Afrikaans and isiZulu menus are drafted and waiting for a fluent reviewer."
- Reviewers can preview drafts in context with `?preview-language=af|zu`. Preview mode shows a fixed banner, "Draft translation preview — not reviewed", and is not persisted.
- `REVIEW-NEEDED.md` gives each key with its English source, draft, context and a reviewer name/date column.
- Picker: a labelled native `<select>`; each option is named in its own language with `lang`; help text is linked by `aria-describedby`.
- Check:
  - default and English output are identical to before;
  - preview af/zu changes exactly the listed labels with `lang` spans and no 375 px overflow;
  - the banner shows in preview mode;
  - the picker works by keyboard.
  - Flipping a catalogue to reviewed in a test makes it selectable and persistent across reload.

**W2 — recorded voice question in source lessons (Haiku, medium).** Usability, Intelligence. Files: `src/teacher/SourceReader.tsx` only. Confirm PR #148's file list does not include it first; if it does, W2 waits.
- Mount the existing `ListeningQuestion` (it does its own Groq availability check, shows an unavailable message, and carries consent, retention and unverified-language notices) under the question input, with the visible title "Upload a recorded voice question".
- `key` it by `sourceId:revision:start-end` so any passage or revision change remounts and cancels it.
- `onQuestion(text)`: if the question field is empty, fill it. Otherwise show an inline choice, "Replace my typed question" or "Keep mine".
- Never auto-send.
- Replace the shop placeholder with "e.g. Why does this step matter?".
- No live microphone (that waits for #146).
- Check: renders in a source lesson; the unavailable message shows locally; replace/keep works; changing the passage resets it.

**W3 — plain-language pass (Haiku, low).** Usability, Presentation. Files: `src/workspace/SourceWorkspace.tsx` (upload limits paragraph), `src/source-classroom/SourceClassroom.tsx` (bottom footnotes), `src/material-planner-ui/MaterialPlanner.tsx` (outline intro).
- Upload, visible: "PDF, Word, slides, Excel, text or a photo — up to 8 MB. KAIRO reads up to 100 pages or slides and keeps up to 48,000 characters for review. Scans and photos: first four pages only. Always check the text against your original." (Verify the 100-unit and 48,000-character limits against the code.) Verify the formats and the 8 MB limit against the server limits first. Detail goes in "Limits and details".
- Planner intro: "This is a plan, not the lesson yet. Your choices decide what KAIRO focuses on." Keep the cloud/local sentence visible.
- Classroom footers: each visible line is at most 25 words. Keep the CC-BY attribution, the voice limitation and the microphone line visible. Extra detail goes in "About voice and sources".
- Check: a fact-by-fact mapping table (old fact → where it now lives) in the evidence file; no fact dropped; Flesch reading-ease before and after.

## Key decisions & tradeoffs
1. **Menus only for languages.** Translating lesson or caveat text without fluent review would breach the honesty rules. Draft labels are visible in the picker itself.
2. **Drafts are gated:** af/zu drafts ship for reviewer preview only. They become learner-selectable only after a named fluent reviewer signs off in REVIEW-NEEDED.md.
3. **Upload-based voice questions now; live microphone later.** This reuses a reviewed component and avoids conflicting with #146.
4. **No new "live answer" work.** Cited passage help with a question already exists via `/passage`. The gap is configuration on hosted, not code.

## Risks / open questions
- W1 and W4 both touch `AppShell.tsx`, so they are serialized: W4 claims, finishes and releases before W1 claims.
- Bus claims: none of these paths should be under the released stale claims. Verify `learning-flow-ui/FlowRail.tsx` and `AccessDialog.tsx` are not claimed by another active task.
- The natural-voice PR #148 touches `src/teacher/*`. W2 edits `SourceReader.tsx`. Check #148's file list; if it overlaps, W2 waits or rebases.
- Draft translations could be wrong in ways the team can't judge. Mitigations: the label, a reviewer file, and English one click away.

## Out of scope
Translating lesson content, caveats or KAIRO guidance; live microphone push-to-talk; SASL; other languages beyond af/zu drafts; deploy.
