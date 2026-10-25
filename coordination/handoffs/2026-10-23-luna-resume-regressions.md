# Resume start policy and preservation regression handoff

Date: 23 October 2026. Agent: `codex-luna-resume-policy-20261023-a`, Codex `gpt-6-luna`, effort `low` (selected in client and confirmed by user screenshot).

## Scope and result

Implemented the isolated pure `chooseResumeStart(queryStep, saved, chapterCount)` policy in `studio/src/classroom-resume-policy/model.ts`, plus deeper regressions in `studio/tests/classroom-resume-regression.test.mjs`. Existing resume helpers and tests, route, provider, router, packages and configuration were not changed.

The function accepts only canonical safe in-range URL steps; otherwise it uses a validated restored cursor or starts at chapter 0. It always starts in reading mode, only offers 3D for a valid restored preference, preserves recovery messages for stale/invalid/unavailable records even when a valid link selects the chapter, and rejects malformed snapshot states safely. It does not write or access globals/storage.

Tests use the actual `readResume`, `writeResume` and `resumeKey` helpers with synthetic in-memory storage. From `studio`, both required checks passed: 19/19 tests and installed `tsc --noEmit` with no diagnostics. See `docs/checks/luna-resume-regressions-20261023.txt`.

## Integration notes for parent

After the reviewed lesson/source identity is loaded and validated, obtain one `readResume` snapshot, call `chooseResumeStart(queryStep, snapshot, lesson.chapters.length)`, and only then initialize route state. Keep reading active initially. Show an optional 3D action only when `offer3D` is true. Preserve `message` for stale/corrupt/unavailable recovery. Do not write until restore initialization succeeds; use fresh permission snapshots for subsequent saves. Do not label browser-local storage as synced or backed up.

## Acceptance and limits

Targets: Product completeness/polish and Usability clarity/recovery; storage remains device-only. Coverage includes URL precedence/canonicalization, revision mismatch, preservation of unreadable/stale bytes, storage failures, out-of-range records, competing-tab interleaving, successive saves with fresh permissions, envelope fields, unchanged `/learn` key and frozen-input purity.

The in-memory interleaving demonstrates the helper's re-read conflict guard; it is not a browser multi-tab test, and the read-then-write gap cannot be made atomic by this helper. No browser, route, React lifecycle, device, audio, cloud or network acceptance was performed. This isolated package does not mean resume-in-the-app is accepted; parent review and integration remain required.
