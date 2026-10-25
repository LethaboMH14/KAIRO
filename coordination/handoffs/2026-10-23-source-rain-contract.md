# Source → Rain contract v1

Owner: codex-source-rain-20261023-c, Codex gpt-6, effort unknown (not exposed). 23 October 2026.

Root owns router/provider, source/lesson entry links and `studio/src/source-classroom/`. Claude's active ExperienceClassroom/stage/brand claims stay untouched. `/classroom` retains the authored example; `/classroom?lesson=ID` loads the saved reviewed lesson. IDs only appear in URLs. No new backend schema, paid call or second audio clock.

`loadReviewedLesson(id, load, signal)` in `source-classroom/session.ts` uses injected `load(path, signal): Promise<unknown>`, reads `/lesson/{encoded ID}` then `/source/{encoded sourceId}`, validates IDs and chapter citation references, and rejects unreviewed or changed source revisions. Returns a Lesson. Abort errors propagate. No source text is sent to a cloud service by loading. Source revision is checked on entry; a later concurrent edit is not live-monitored.

`chapterIndex(value, count): number` clamps finite integer cursors; `chapterEvidence(lesson, index): Evidence[]` returns only this chapter's cited evidence; `classroomHref(id, step=0): string` returns the classroom URL with validated ID and bounded nonnegative step. IDs are 24 lowercase hexadecimal characters, as in the workspace server.

Luna UI package owns only `studio/src/source-classroom-ui/` and its own handoff. Default `LessonReading` props: `{lesson: Lesson; step: number; onStep:(step:number)=>void; onRead:(text:string)=>void; onStuck:()=>void}`. Stateless reading pane lists chapter navigation, explanation, example and chapter-specific source quotes with locator, offsets, reviewed revision and edited label. Plain capability labels distinguish AI draft/local excerpts. No provider, router, persistence, network, stock-specific controls or CSS edits outside package. Reuse existing workspace classes; add scoped CSS only if needed.

Luna tests package owns only `studio/tests/source-classroom.test.mjs` and its own handoff. Import session.ts functions above using Node native TS support. Test injected loaders with synthetic public fixtures only: encoded/invalid IDs, sequential source validation, stale/unreviewed/missing citations, abort before/during load, chapter boundaries and exact citation preservation. No browser, cloud, server startup or implementation-mirroring string checks. Wait for session.ts if not yet present.

Root integrates and independently reviews both packages, handles one shared TeacherProvider clock and stop on navigation/view/interrupt/unmount, and builds a neutral Rain stage without the stock board. This is a source-linked reading/narration slice, not a generated world, free conversation, exact-word pointing, SASL or educational acceptance. Existing `/learn` retains practice, notes and passage help. Browser observation remains prohibited; the deleted schedule stays off.
