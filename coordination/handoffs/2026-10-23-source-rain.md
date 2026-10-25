# Reviewed source → Rain integration

23 October 2026. Root: `codex-source-rain-20261023-c`, Codex `gpt-6`, effort `unknown` (not exposed). Contract published before dependent work in `2026-10-23-source-rain-contract.md`, bus message 46. No schedule or browser observation was enabled.

## Result and files

- `studio/src/StudioRouter.tsx`: `/classroom?lesson=ID` lazy-loads the source adapter under the existing TeacherProvider. Plain `/classroom` retains the prepared example and Claude's claimed component.
- `studio/src/workspace/SourceWorkspace.tsx`: created and recent saved lessons open **Learn with Rain**.
- `studio/src/workspace/LessonWorkspace.tsx`: links the current lesson/chapter to Rain; leaving now stops the shared TeacherProvider instead of cancelling browser speech alone. Existing practice, annotations, export and progress remain here.
- `studio/src/source-classroom/session.ts`: abortable sequential lesson/source loading, reviewed-revision match, exact quote/locator/offset validation and chapter citation checks. Missing, malformed or changed material fails with a return-to-review message. No unrelated stock lesson substitutes for a failed source lesson.
- `SourceClassroom.tsx`: reading-first lesson, chapter navigation, captions, shared narration controls, stop/pause/resume, source-grounded reading prompt for “I'm stuck”, reduced motion and optional Rain. Chapter/view/interrupt/unmount cancels shared narration; fetches abort on unmount and late results are ignored. Coverage and source-review warnings remain visible. Practice and notes link to `/learn`.
- `RainStage.tsx`: neutral host for the existing TeacherCharacter v1, no stock board, fabricated source anchors or second audio player. Existing audio signal ref drives approximate cloud-energy mouth movement. Browser speech supplies no invented timing.
- `studio/src/source-classroom-ui/`: Luna reading pane and scoped styles, independently reviewed by root.
- `studio/tests/source-classroom.test.mjs`: Luna loader/citation/cursor tests, independently reviewed by root. `source-classroom-review.test.mjs`: root rendered-markup and delayed-source cancellation checks.

TeacherProvider was inspected and explicitly reserved but did not require modification: its active request ID, AbortController and playback disposal already cancel late cloud audio. The change in LessonWorkspace calls that shared stop path. Router/provider ownership was never delegated. No package, lockfile, backend contract, private source record or Claude-owned stage/brand file was edited. The source adapter reuses the selected chalk/moss/Manrope styling without inventing a new logo master.

## Luna review

`codex-luna-source-rain-ui-20261023-a` and `codex-luna-source-rain-tests-20261023-a` registered themselves as `gpt-6-luna` / `low` and claimed disjoint scopes. Read their dated UI/tests handoffs. Root inspected both implementations, checked citation filtering, native keyboard controls, escaped text, revision/offset labels, callback-only UI boundaries and synthetic fixtures. Root added SSR assertions for escaped source markup/current citation/AI-draft label and delayed-source cancellation/failure checks; these run in Node, not a browser. Initial root SSR harness used an incorrect Windows URL path; fixed with fileURLToPath, then passed.

## Actual checks

- Focused root run: **10/10 pass** (7 Luna + 3 root).
- `npm test` in `studio`: **227/227 pass**, zero failures/cancellations/skips. Saved output: `docs/checks/source-rain-20261023.txt`.
- `npm run build` in `studio`: **passed**, TypeScript + Vite, 2,230 modules. Existing large-chunk warning remains (React Three Fiber ~516 kB). SourceClassroom ~10.62 kB JS and ~0.79 kB CSS before gzip, with shared assets/3D in separate chunks; this is not a measured device/download budget.
- Luna UI whole-Studio TypeScript check also passed.
- Root inspected the provider's stale-request/cancellation code; real speech, gesture interruption and model rendering were **not exercised**. Tests establish loader cancellation and static reading markup, not end-to-end voice or device acceptance.
- UI skill CLI and a root-directory npx TypeScript attempt could not resolve npm packages with restricted DNS. No package was installed; local Studio tools supplied the successful checks. No restrictions were bypassed.

## Limits and coordination

Reviewed revision is checked on entry, not live-monitored across concurrent source edits. A changed source requires review and a fresh lesson. The same session keeps its current chapter through reading/3D and interruptions; new persistence was not added. Existing notes/progress remain in `/learn`. This is a reading/narration connection, not arbitrary world generation, new live AI answers, exact-word choreography, microphone conversation, SASL, an official memo or validated learning outcome. Reading is the default even on desktop; 3D is optional and failure leaves text available.

Rain asset/provenance remains the existing delivered asset with its existing independent C1 review limitations; no new rights clearance or device performance claim. Attribution links to shipped credits. No cloud generation/speech call, browser/HTTP screenshot, deployment, downloaded model or automation was run.

Claude's active BRAND-MASTER-001, CLASSROOM-STAGE-001 and SASL-RIGHTS-001 were respected. Message 45 targeted the actually registered Claude owner with our boundary; message 46 published the contract. No acknowledgment arrived through the final inbox check, so no receipt or action is claimed. Claude can later propose reusing its published board/stage interface for source lessons under a new explicit agreement. Existing reference/heartbeat/review claims remain untouched.
