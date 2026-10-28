# KAIRO whole-app information architecture research

| Prepared | 26 October 2026 |
| Owner/settings | Codex `codex-luna-app-ux-research-20261026-a`, gpt-6-luna, low |
| Repository base | `c4b9ab22900bb37d573eaa6c29cb6d3e91a76813` (`origin/main`) |
| Scope | Read-only route/source inventory and design research; no application files changed |
| Status | Research/proposal, not an approved redesign or implementation |

## Purpose and recommendation

The learner's mental model should be one continuous workbench: **choose material → review what KAIRO extracted → learn from cited passages → practise → keep evidence and resume → connect chosen skills to roles or funding**. The app already contains much of this loop, but navigation currently exposes five top-level destinations while important next steps are distributed among pages, in-page links, and separate routes. Some sections also repeat their own brand/header and compete with the shared shell.

Use a small, stable global navigation, then make each page answer four questions in order: **Where am I? What is the useful thing here? What can I do next? What does KAIRO know or not know?** Keep the primary action visible. Put provenance, settings, alternate formats, and advanced controls behind clearly named disclosure or a secondary panel. Never hide a required action behind hover.

The recommendation is a proposal, not a claim that the current app has unified narration, universal responsive/keyboard acceptance, or a fully connected personalized journey. The README's current journey and deployment evidence remain authoritative for implemented scope.

## Evidence and research method

Repository inspection was read-only at the clean `origin/main` base above. Route coverage comes from `studio/src/StudioRouter.tsx`, `studio/src/kairo/navigation.ts`, `studio/src/kairo/AppShell.tsx`, and the page components named in the route table. The source establishes registered paths and the present controls, not usability success.

Comparator research used official product help and product-authored learning articles only, retrieved 26 October 2026. It did not use paid Mobbin, sign-in, or private user accounts. These references document described flows and embedded product illustrations; this is not a fresh hands-on usability evaluation of those products, and no screenshot asset has been copied into this repo.

| Product | Official evidence read | Transferable pattern (not a visual copy) |
|---|---|---|
| Gemini Notebook (NotebookLM) | [Notebook overview](https://support.google.com/gemininotebook/answer/16164461?co=GENIE.Platform&hl=en), [source guide/import](https://support.google.com/gemininotebook/answer/16215270?co=GENIE.Platform%3DDesktop&hl=en), [citations in chat](https://support.google.com/gemininotebook/answer/16179559?hl=en-MY) | Keep a bounded source set explicit; selecting a citation jumps back to its source location; unavailable answers should say when the answer is outside the supplied sources. In KAIRO, preserve reviewed revision anchors and offer the source passage without making a dense citation wall the initial reading view. |
| Duolingo | [Practice tab](https://blog.duolingo.com/guide-to-duolingo-practice-hub/), [lesson path and different practice modes](https://blog.duolingo.com/ways-to-practice-in-duolingo/), [spaced repetition description](https://blog.duolingo.com/spaced-repetition-for-learning/) | Put the next lesson in a clear path and make targeted review discoverable. KAIRO should not copy gamification/XP or claim an adaptive learner model: its present rule suggestions and saved work are a different, narrower mechanism. |
| Linear | [Search and command menu](https://linear.app/docs/search), [keyboard-accessible editor](https://linear.app/docs/editor), [favorites](https://linear.app/docs/favorites) | A consistent quick-jump/search affordance and a keyboard route to frequent actions reduce navigation hunting. For KAIRO, use visible text labels and focusable controls; shortcuts should supplement, never replace, touch/visible controls. |
| Notion | [Sidebar navigation](https://www.notion.com/en-gb/help/navigate-with-the-sidebar), [database views and property visibility](https://www.notion.com/en-gb/help/views-filters-and-sorts) | Let users collapse navigation and tailor which metadata is visible in a view. KAIRO can similarly make source details available on demand while retaining source title/status and the main next action in view. Do not make learner configuration a prerequisite to understanding. |
| LinkedIn Learning | [Learning paths](https://www.linkedin.com/help/learning/answer/a703777/learning-paths-for-individual-subscribers-overview?lang=en), [progress and history](https://www.linkedin.com/help/learning/answer/a700781), [add a completed credential](https://www.linkedin.com/help/linkedin/answer/a704787/adding-learning-certificates-and-skills-to-your-linkedin-profile?lang=en) | Keep in-progress, saved, and completed items separate; distinguish completion evidence from skill claims. KAIRO role links should say a lesson/practice record is learner evidence, not an employer credential or verified qualification. |
| Coursera | [Assignments as course assessments](https://www.coursera.support/s/article/learner-000001563?language=en_US), [preview and module access](https://www.coursera.support/s/article/learner-000002293?language=en_US), [program progress](https://www.coursera.support/s/article/learner-000001520?language=en_US) | Separate ungraded practice from graded/completion rules, make access limits visible near locked content, and keep course-level progress contextual. KAIRO should label its own formative practice as such and not suggest an accredited course or assessment. |

**Access date applies to all comparator links:** 26 October 2026. Product docs may change. Any product-specific detail above is a vendor description, not an independently verified efficacy finding.

## Current route inventory

“KAIRO role” means the current app's explicit teacher/help/citation affordance where present. It does not mean that one consistent narrator is already used in every route. “Phone/keyboard” entries identify what source supports or a proposed acceptance target; they are not device testing.

| Route / state | Primary learner task | Keep visible first | Put on demand | Next action | KAIRO's role | Empty, loading, stale, or error behavior and responsive/keyboard note |
|---|---|---|---|---|---|---|
| `/` and `/home` | Enter a synthetic curriculum/module space or start learning | Student-space identity and modules; curriculum is explicitly a public selection | Curriculum provenance and limits per module | Bring material or open a prepared lesson/activity | Brief welcome and source/module context | Space loading/error is handled before protected studio routes; preserve a plain module list on phone and keyboard. Current route may display a synthetic learner; say so in the first screen. |
| `/saved` | Resume device-saved reading and notes | Latest saved lesson, offline status, “open saved reading” | Source passages, device memory/privacy, theme and goal settings | Continue local reading, annotate, or return to online material | Reading alternative; no live teacher response required | Empty state names how to save a copy. Offline state says fresh lessons/answers/speech need a connection. Keyboard can use textarea/buttons; phone should not force horizontal tables. |
| `/account` | Sign in/out or understand private-material scope | Account state and what stays local/private | Account/session explanation and reset details | Open learning space or My material | Explain account/storage boundary, not lesson content | Loading/account errors should not hide existing local saved copies. No forced sign-in to read an already-saved device copy. |
| `/sources` | Add material, review extraction, choose reviewed sources | File status and clear review/revise decision | Extraction coverage, source locator, revision/freshness and detailed warnings | Save a usable source, then start a lesson | Explain selected passage or next review step only when asked | Empty state asks for supported material; extraction/unsupported-file error must preserve original and offer retry/remove. Keyboard and phone need file input, row selection, and review status in normal flow. |
| `/classroom?bundle={id}` | Read multi-source lesson and keep working | Lesson title/objective, review warning, first cited passage, current source status | Full excerpts/locators, edits, quiz rationale, saved notes | Read → answer practice → save place → optional prepared motor/pump | Read/answer only in current selected lesson context | Missing/stale source must halt confident lesson use and return to My material with a re-review action. Loading/retry status is already present. Use text-first fallback if 3D unavailable. |
| `/classroom?lesson={id}` | Read generated/single-source lesson, ask for help, practise and save | Selected lesson/chapter, source title and one useful next step | Citations, passage context, teacher controls, notes/evidence | Learn, ask KAIRO, answer, save/resume | The explainer for cited lesson content | No lesson/query ID should show an explicit choose/reopen route, not fall through to unrelated authored demo. Phone should order reading before optional media; keyboard has chapter and action controls. |
| `/classroom` (no query) | Explore separately authored stock-control example | Label it as authored example; show one objective and task | Example source record, prepared explanation and limits | Try the practice case or bring personal material | Prepared explanation only, explicitly not live AI | Avoid blending this demo with course-selected work. No microphone conversation is currently enabled on this page. Preserve source disclosure and a reading path. |
| `/lesson-editor?lesson={id}` | Edit the lesson wording while preserving evidence | Editable block, live reading preview, source integrity statement | Block rail and detail/provenance | Publish a new learning copy, then work through it | Read preview or explain selected wording; do not silently edit | If lesson/draft unavailable show status, retry and route to material. On phone, use sequential editor/preview; keyboard must move among block list and fields. |
| `/learn?lesson={id}` | Continue lesson reading/help/notes | Current chapter, passage, selected practice | Full lesson outline, source anchors and saved notes | Continue to practice/evidence | Explain and read current source-linked content | Missing/stale lesson must preserve notes and explain recovery. Keep text alternative first; voice optional. |
| `/studios` | Choose a prepared environment | Available studios and what each activity actually demonstrates | Setup/asset assumptions and source list | Enter a relevant activity or return to lesson | Contextual lesson coach when linked | Empty/unsupported studio should say why and offer reading/practice. Text labels remain visible beside icons. |
| `/engineering?bundle={id}` or `/engineering` | Explore a prepared motor teaching model | Model topic, one key value/variable, selected lesson link if any | Components, assumptions, formulas, reference/citation and control explanations | Change a supported variable, inspect result, return to source lesson | Contextual response grounded to selected lesson/scene; explain illustrative limits | If 3D fails, show the prepared accessible controls/reading fallback; not a blank canvas. Keep current values and control labels keyboard-accessible; phone should prioritize one variable at a time. No implication of uploaded-source validation or live equipment control. |
| `/pump-lab?bundle={id}` or `/pump-lab` | Inspect prepared pump case | Case and variables/reading panel | Definitions, source assumptions, selected lesson/context | Explore a variable and return to lesson | Explain pump variables with current context | No-data state should distinguish unavailable sensor/reading from zero; 3D failure retains text/table path. Keyboard and phone should permit selecting variable and reading result without drag-only interaction. |
| `/computer-science` | Follow a request through an authored system trace | One request, current stage, next action | Stage details, implementation concepts, source/provenance | Advance trace or return to material | Explain current trace step if configured | Show a linear list if animation/canvas cannot load. The route is not currently in the five-item global navigation, so link it from Studios and relevant lessons, not as a sixth always-visible icon. |
| `/lecture` | Work through a prepared lecture activity | Current prompt and transcript/caption/reading option | Board/scene details and teacher controls | Answer, then return to lesson | Teacher for this prepared example | Must offer readable non-3D route and visible play/pause/stop. Keyboard focus/order should track the spoken/visual sequence; no room should block the content. |
| `/practice` | Complete an authored workplace case with evidence | Case stage and current decision; explicit authored simulation label | Evidence record, principle, retry feedback and rubric details | Inspect records → reason → respond → reflect → save/export | Coach the case, not automatic grading of writing | Empty state asks to open case; incomplete steps explain how to continue. A 3D shop has evidence-desk alternative. Phone forms stack; keyboard must reach all records and choice controls. |
| `/cases` | Select/run workplace practice pack | Case choices and progress | Rubric and source material | Begin or resume case | Explain scenario as available | If no pack is configured show an honest empty state and route to My material. Do not send users to Home if they entered from a linked lesson; preserve that link. |
| `/evidence` | Review saved notes, quiz/practice work and exports | Recent evidence with source/lesson identity and status | Event detail, data provenance, export and deletion options | Resume lesson or export personal record | Explain what is/not evidence (e.g. assisted answer vs mastery) | Empty state should say what can be saved and link to a lesson/case. Readable list/table on mobile; status announcement after export/save. |
| `/progress` | See separate practice/session records and manage them | What changed and when, with clear “formative / unverified” labels | Event type, attempts, model/assistance provenance, export/reset | Resume relevant work | Interpret the record's limits, not assign ability labels | No history state should offer a first supported practice. Error should never look like zero progress. Keyboard rows/actions need accessible names. |
| `/direction` | Select or update a learning/work direction (student-space route) | Current goal and the learner's own choice | Source of goal, requirement links, review state | View role gaps/pathways or return to material | Clarify suggestions and uncertainty | Router may show Pathways for a guest and Direction for a configured student space. The same URL doing different jobs risks surprise; make the destination/title and breadcrumb reflect actual content. |
| `/pathways` | Explore source-backed role requirements and linked/missing evidence | Role/provider, source checked status, first actionable next step | Requirement excerpt/locator, availability caveat, evidence mapping | Choose one gap as learning goal or inspect its source | Explain gap wording; never assert competence | Unknown availability remains unknown. Stale source is flagged and action gated. On small screens collapse evidence detail behind explicit “Show source” disclosures. Keyboard order role → requirements → source → goal action. |
| `/cv` | Draft a CV from details the learner chooses to confirm | Draft, selected/confirmed state, privacy reminder | Entry provenance, role notes, import/export session controls | Edit/confirm, download plain-text CV | Suggest wording, not invent facts | Blank state offers one clearly optional example field; no fake experience prefill. Mobile editor before preview; keyboard focusable import confirmation and no hover-only delete/reorder. |
| `/opportunities` | See funding/roles and freshness/eligibility notes | Results state, when checked, date/status and source | Requirements, full source and limitation | Read official source; return to choose a relevant learning goal | Explain source wording only; does not guarantee eligibility/current availability | Bootstrap/loading/errors need specific retry and not “0 results” ambiguity. Unknown/open/closed states must preserve the observed source date. Avoid claim of automated matching. |
| `/teacher` | Set teacher/voice preferences | Current selected voice/language and capability | Device/cloud service scope and unsupported language details | Save preference or return to learning | KAIRO identity and current capability status | Disabled feature explains why, not just disabled control. Phone/keyboard use explicit labels; do not imply SASL when unsupported. |
| `/settings` | Review access, voice/language/camera and local/cloud behavior | Settings categories and present status | Detailed scope, consent and capability notices | Open account/settings section | Clarify who speaks and what a control sends | Avoid one giant settings page; group by task and keep consent next to the action. Screen-reader status shouldn't be hidden in hover popovers. |
| `/for-institutions` | Understand institutional proposal | Plain statement of present product and proposal | Architecture/support/commercial details | Contact/action only if actually configured | None required | Do not style roadmap as existing institutional service. Preserve no-contact/no-partnership truth if form absent. |
| Unknown path | Recover to a known place | Page unavailable and material retained | No diagnostic stack in learner copy | Go Home or My material | None | Preserve meaningful title and keyboard focus on error heading; mobile CTA must remain visible. |

## Proposed global information architecture

### Primary navigation: five stable destinations

Keep the existing five concepts, but model them as destination labels rather than separate product zones:

1. **Home** — resume, modules, one context-aware “next step,” and empty-state entry points.
2. **My material** — add/review sources, build one or multi-source lesson, edit, read and practise. Add a small stepper/breadcrumb for this flow: `Material → Lesson → Practise → My work`.
3. **Studios** — only the prepared environments; each studio says which lesson/source is connected and what is independently authored.
4. **My work** — saved reading, current place, practice/evidence and progress; distinguish device-saved reading from cloud-owned lesson/practice records.
5. **My direction** — role pathways, opportunities/funding and CV draft, subordinate to the learning loop. Don't let this area dominate the learner's first screen.

“Account & private material,” access settings, teacher preferences and institutional information belong in a secondary account/settings area. `Computer science`, `lecture`, `cases`, `practice`, `progress`, `cv`, and `opportunities` remain reachable through explicit in-context links. Avoid adding all of them as top-level icons.

### Page hierarchy and density

- One page title, one short orientation sentence, one visually dominant primary action. Keep body copy to a few lines before the first useful control; do not hide important limits in a footer.
- Source freshness, creator/type, and “review needed” are small visible status labels because they change whether the next action is safe. Locators, excerpts, revisions and technical validation are available in a source-details disclosure.
- Prefer a labelled select for a short mutually-exclusive choice (e.g. source, chapter, language). For a long list, use a searchable, keyboard-operable combobox with a real empty/no-match state. Keep the currently selected item explicit; do not use decorative icon-only dropdowns or make hover the only way to discover it. Test native select behavior on phone rather than replacing it with a custom menu by default.
- Tooltips are for short icon clarification, never the only explanation or access to an action. Trigger on hover **and** keyboard focus; on touch use a visible label or click-to-open disclosure. Use `aria-describedby`/expanded state and let Escape close transient menus.
- Typography should have a small deliberate hierarchy (page title, section title, body, metadata) and consistent line length. Avoid all-caps prose, repeated competing `KAIRO Access` lockups, oversized two-line headings that push controls below the fold, and long introductory copy. Never shrink body text merely to fit metadata; disclose metadata instead.
- Every icon-only action needs an accessible name; primary navigation keeps text labels at desktop and an explicit label or selected caption on phone. Hover-revealed controls also appear on focus and have an always-available touch route.

### KAIRO placement: visible helper, not a second narrator

Proposed persistent pattern: a compact **“Ask KAIRO about this”** affordance on material, reading, studio and practice pages, anchored to current lesson/source/step. Opening it reveals (1) the context KAIRO will use, (2) what isn't available, (3) a small set of question starters, then the user can ask. Keep the message area separate from source text and from controls, keep captions/transcript available, and make stop/close easy. Use one teacher name and consistent response/voice controls. On Home, show KAIRO as a gentle action, not a full-height chat window.

This is a proposed cross-route composition. Existing components vary: source reading, `StudioCompanion`, `StudioGuide`, `StudioContextPanel`, and prepared examples do not prove one standardized implementation or consistent source context.

## Scenarios that the IA must handle

These are proposed acceptance stories to test before calling a redesign usable. Most rows describe a desired outcome, not current verified behavior.

| Scenario | What the learner sees and can do | Honest state/guard |
|---|---|---|
| New learner, no sources | Home offers “Bring material” and a short example; My material says how to add a supported file. | Don't show empty requirements as success, or imply a complete degree curriculum. |
| Source upload unsupported/fails | Preserve file/name and error reason; show allowed types or retry/remove. | Do not silently mark extraction complete. |
| OCR/extraction has low coverage | Show page coverage and recognizable text preview before lesson creation; let user correct it. | Mark what was not extracted; don't infer diagram meaning. |
| Source was changed after lesson creation | Lesson displays stale-source warning, blocks new confident claims/actions, offers My material review and rebuild. | Keep old notes/evidence tied to the prior revision; never silently re-anchor. |
| No AI service configured | Offer local/source-grounded reading lesson and manual practice; tell learner AI explanations/translation are unavailable. | No disabled mysterious button, no pretend loading/request. |
| Learner declines cloud consent | Continue local reading, edit, and supported local lesson actions. | Consent must remain unselected and contextual. No provider request. |
| Low bandwidth or offline | Show saved reading and device notes first; mark new generation/speech/studio features needing network. | Do not conflate `navigator.onLine` with proof the service is reachable; explain retry. |
| No 3D/WebGL or asset load failure | Swap to named, equivalent reading/diagram/control list; preserve variable, value, source and next action. | Never leave a black canvas or make drag/hover essential. |
| Bundle has no available lessons | Explain source revisions changed and offer re-review/refresh. | Do not expose stale lesson as current. |
| Keyboard-only navigation | Skip-link → main title → primary action → content → source details → next step; focus stays visible and menus close on Escape. | Hover tips have focus equivalents. No keyboard trap or icon-only ambiguity. |
| Phone viewport / large text | One-column flow, short labels, stacked controls, sticky nav does not cover final action; optional panels collapse. | Preserve reading size and browser zoom; measure bottom-nav reach and focus visibility. |
| Pathway source says availability unknown | State what the employer page confirms and when it was checked; show learner-chosen project as KAIRO suggestion. | Unknown must not become “open”, eligibility or match score. |
| CV is blank | Provide optional structured entry prompts and clear local/export scope. | Never prefill fictional work or promote unconfirmed claims. |
| Provider request times out | Leave local content in place and show retry/continue-without-AI. | Avoid empty page, duplicate submission and a spinner with no stop. |
| Learner resumes elsewhere | Restore lesson ID, source revision, chapter and saved working where owner-authorized. | If context cannot be restored, say what was recovered and offer safe selection; don't fake memory. |

## Proposed learner journey and page decisions

1. **Home:** card for “Continue [title]” when real saved work exists; one starter action; modules for configured student demo; optional KAIRO helper. Do not load funding/CV into the top visual hierarchy.
2. **My material:** step 1 upload/select → step 2 inspect extraction/status → step 3 choose source(s) + goal → step 4 local vs consented AI. Keep the provider selector and context details visible before consent, but collapsed after successful creation.
3. **Lesson:** focused reader with current chapter, one next action, source freshness at a glance; citation opens its exact excerpt/locator in side panel on desktop and a full-width sheet on mobile. Provide reading and caption alternatives before visual/voice embellishments.
4. **Practise:** one task/question at a time. Put the worked principle behind an explicit disclosure. Save attempts and assistance state accurately; don't visually call a response “mastery”.
5. **Studios:** only show activities relevant to the lesson when relevant links exist. Studio page starts with lesson/source context and current variable. A no-3D fallback shows the same useful information and controls.
6. **My work:** tabs or segmented controls for Saved reading, Lesson work, Practice and Progress. Each item states owner/storage, source/revision, last saved time and next action. Don't collapse everything into an undifferentiated numeric progress score.
7. **My direction:** role/source freshness first, explicitly separate missing evidence from lack of qualification; the learner chooses which gap becomes a goal; link that goal back to a relevant reviewed lesson, then to optional CV draft/opportunities. No score-based employer match.

## Acceptance criteria for a future design/build

Tie to all judging headings without pretending this research passes them:

- **Product:** five-question source-to-work journey can be followed without dead end; stale records route back to review.
- **Creativity:** KAIRO makes one source-backed idea manipulable or observable, with an equivalent 2D/reading path, rather than adding decorative AI chat.
- **Usability:** one primary action per route/state, plain label, keyboard + phone route, hover/touch/focus equivalents; formative learner task test still required.
- **Sustainability:** reuse consistent route/page/empty/error patterns; any user-set defaults have a low-cost path and no new cloud dependency.
- **Impact:** track task completion/failure only with consent and a defined retention plan; no causal learning gain from click-through.
- **Presentation:** the same route sequence tells a clear source → lesson → attempt → evidence story; screenshots stay labeled by actual environment.
- **Intelligence:** explain source/context used and unknowns; transparent rule suggestions remain distinct from predictive models.

### Observable review checklist

- Starting from each of Home, My material and My work, can a new learner identify one next action in under 10 seconds without reading a paragraph?
- Does every source-linked explanation expose source title + review/freshness status, then exact locator/quote on request?
- Can learner finish a supported practice with no 3D, no voice and no AI provider, using visible reading/keyboard controls?
- Can the learner tell which records are on device vs account/cloud, whether they are current, and what is not evidence of competence?
- Do touch/keyboard/screen-reader use reveal every control that a mouse hover reveals?
- Are current technical failures visible as useful status, retry, and fallback without losing unsaved work?
- On phone and large text, can user reach the last action without a fixed footer/nav covering it?

This review did not test those checks against actual devices or human learners.

## Evidence limits and remaining work

- Implemented state is defined by current source routes and their actual UI, not by these proposals. Root integration/release docs continue to determine deployment status.
- No real learner, device or screen-reader study was run here. No impact or learning outcome was measured.
- I inspected repository route code, not the running app UI. The route table is not a visual audit.
- Comparator sources are product-author and help-center material; features/pricing/access can change, and those companies' claims are not independent efficacy evidence.
- Paid Mobbin visual reference access was blocked. No purchase, upgrade, install, contact, application, external account, model call or deployment was made.
- Do not copy comparator color systems, layout assets, mascots, or branded motion. Translate patterns into KAIRO's selected C identity and accessible text-first style.
- Next useful work: root-led concept sketches using this IA; then choose one design direction, prototype two route pairs (My material → Lesson, Lesson → Practise → My work), and run keyboard/phone and adult-learner task tests before broad implementation.
