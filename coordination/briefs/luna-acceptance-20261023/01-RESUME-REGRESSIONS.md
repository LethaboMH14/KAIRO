# Luna 1 — resume start policy and preservation regressions

## Outcome and judging questions

Product: does the lesson behave as expected and feel complete? Usability: is the next action clear after refresh or storage trouble? Sustainability: does the helper remain small, testable and independent of one storage vendor?

Existing `classroom-resume/model.ts` and 13 helper tests were delivered; they are not wired into SourceClassroom. Your task is to supply the **missing deterministic start policy and deeper preservation tests**, not redo that package or claim the route works.

## Read and register

Read the project/product/coordination/experience startup files named in AGENTS.md, judging matrix, this directory's README, `coordination/handoffs/2026-10-23-luna-rain-resume.md`, `coordination/handoffs/2026-10-23-source-rain.md`, `studio/src/classroom-resume/model.ts`, `studio/tests/classroom-resume.test.mjs`, and the current SourceClassroom/session.ts as read-only context.

Register a unique ID such as `codex-luna-resume-policy-20261023-<suffix>`, actual client/model/effort (unknown if not exposed). Run bus status/inbox. Create `RAIN-RESUME-REGRESSIONS-002` if free, and claim exactly:

- `studio/src/classroom-resume-policy/`
- `studio/tests/classroom-resume-regression.test.mjs`
- `docs/checks/luna-resume-regressions-20261023.txt`
- `coordination/handoffs/2026-10-23-luna-resume-regressions.md`

Do not edit existing resume helpers/tests, shared runtime/provider/router, packages/config, coordination roadmap, root judging docs or another worker's paths. Report defects in those files to the parent. A scope conflict is not permission to clear a lock.

## Published interface v1

Create `studio/src/classroom-resume-policy/model.ts`, importing the existing `ResumeResult` type only. Export:

```ts
type ResumeStart = {
  step: number;
  reading: true;
  offer3D: boolean;
  message: string;
  origin: 'link' | 'saved' | 'start';
};
chooseResumeStart(queryStep: string | null, saved: ResumeResult,
                  chapterCount: number): ResumeStart;
```

Pure function: no React, global storage, timers, URL/history mutation, network, source text or dates. `chapterCount` must be a positive safe integer or throw a clear argument error. Validate the supplied result sufficiently that malformed/unknown states cannot yield an unsafe index or 3D mount. Do not mutate inputs.

Precedence:

1. Explicit URL chapter wins only for a canonical nonnegative integer string (`0` or nonzero digit followed by digits), safe integer and less than chapterCount. No spaces, sign, decimals, exponent, Infinity, empty or leading-zero strings. Return origin link.
2. Otherwise a restored result with a valid in-range integer step may restore that step, origin saved.
3. Otherwise step 0, origin start. A stale/invalid/unavailable snapshot never provides a cursor.

Always return reading:true: a saved preference cannot authorize automatic model download or speech. offer3D is true only for a valid restored record whose reading preference is false; it is an invitation, not a download. If the source changed or saved data is unreadable, retain its plain explanation even when a valid link selects a chapter. Keep error/recovery messages concise; do not promise cloud sync or saved credentials. The policy does not authorize writing; parent uses readResume/writeResume permission snapshots separately.

## Tests and fixtures

Use the actual existing read/decode/write functions and a synthetic in-memory storage implementation. Cover:

- Explicit valid link versus saved step, absent link, malformed links (negative, fraction, whitespace, exponent, leading zero, huge value) and out-of-range links.
- Stored chapter changed because source/revision changed; stale record preserved, safe reading starts at 0 unless a valid link overrides.
- Corrupt and unsupported envelopes, storage exceptions and out-of-range saved data never authorize write; original bytes unchanged.
- Saved reading:false only offers 3D; no module creates Audio, fetches, accesses window or starts narration.
- Other-tab write between read and save refuses overwrite. Explain the unavoidable non-atomic gap after a re-read; don't claim locking.
- Two consecutive successful chapter saves with a freshly re-read permission snapshot preserve the second state; an old permission snapshot conflicts as designed.
- Existing `/learn` progress/notes keys are unchanged. Stored envelope contains only allowed cursor/preference/identity fields.
- Frozen-input/snapshot checks for pure policy; no account/source text or learner content.

Do not inspect source strings as proof, copy the existing implementation into tests, or weaken a failing invariant. If a helper has a genuine defect, isolate a minimal reproduction, keep its evidence and notify parent; production/helper edits are outside this claim. New policy tests should execute the real policy. Avoid duplicating all old basic tests; focus on sequence/precedence/recovery risk.

## Checks, completion and root integration

Run from studio: `node --test tests/classroom-resume.test.mjs tests/classroom-resume-regression.test.mjs`, then installed `.\node_modules\.bin\tsc.cmd --noEmit`. Save actual output/exit codes. No dependencies, aggregate deployment, browser or real cloud/audio tests. Test count is a result, not a target.

Handoff includes actual identity, claimed/changed files, API, acceptance mapping, reproduction/limits and integration instructions. Root must first verify reviewed lesson identity, obtain a storage snapshot, choose start, then mount/set state; saving occurs only after restore initialization and only under valid permission. Parent owns state effects and stop-on-navigation wiring. This isolated package does not establish route, React lifecycle, assistive-tech or phone acceptance. Complete own bus task with evidence after checking inbox.
