# Pump context fence — isolated integration prerequisite (26 October 2026)

Session: `gpt6-i49-pump-context-fence-20261026-0805-x` · ChatGPT / GPT-6 / effort unknown.
Issue: #49. Main inspected: `7e94b557b095188cf80d0a125d6be4967374bd95`.

## Need, impact and observable behavior

The mounted `PumpHost.tsx` currently restores one account-wide pump snapshot and stamps exported local evidence with whichever lesson/bundle ID appears in the current URL. That can misattribute A's work to B when the learner switches lessons in the same account. This is a code-review finding, not a reproduced deployed incident. The learner needs a source-revision-specific local session and clear recovery if the linked material becomes inaccessible.

This NEW-only package provides a reusable, dependency-free and deliberately **unmounted** local storage adapter. It does not change `PumpHost`, routing, CSS, existing model, source-review contracts or authenticated endpoints. Existing account-scoped `learnerStorage` remains the required storage adapter when mounted; this helper never uses raw global `localStorage` or creates an account scope.

- `standaloneContext()` makes a separate unlinked practice namespace.
- `resolveLinkedContext(kind,id,fetchVerified)` accepts only 24-hex server-selected IDs and 64-hex revisions returned by an authenticated, owner-scoped verification callback. It never takes a URL revision. It returns **detached** on a missing/revoked/re-reviewed/inaccessible record or fetch failure; the caller must show the accessible explanation and offer unlinked practice. The helper itself cannot prove the callback is trusted; integration MUST implement the server-side owner/review/current-revision checks before calling it.
- `readSnapshot` / `saveSnapshot` use a context-partitioned versioned envelope, bounded UTF-8 size and an injected **real** `restore`/deterministic replay callback; bad/cross-context/oversized data is blocked and left untouched, not silently migrated.
- `appendEvidence` requires a replay-verified snapshot in the same context, exact session ID and model version match across report/item, simulated provenance and unverified competency status. Evidence remains **local-unverified**, not account-progress, professional competence or authenticated source evidence.
- `readEvidence` checks the context and each entry, caps the record at five, rejects corrupt/oversized data without deleting it. Storage-disabled states return recoverable messages.

## Exact owned paths

1. `studio/src/studio-scenarios/pump-context-fence-20261026/ledger.mjs`
2. `studio/tests/pump-context-fence-20261026.test.mjs`
3. `coordination/handoffs/2026-10-26-pump-context-fence-worker.md`

## Verification and limits

Focused local synthetic tests: `node --test studio/tests/pump-context-fence-20261026.test.mjs`, **Node v22.16.0**, 7/7 pass, 0 skipped. The tests use a deliberately small replay stub, NOT the production pump `restore`; production integration MUST inject `restore` and add a real model/replay end-to-end test. The local container does not have the full KAIRO checkout or Node 24, so **no local full app suite, Vite build, Python bus or real browser/device test was run**. CI results for the new PR must be checked on the exact candidate SHA and recorded separately. No screenshot, private learner data, Kaggle training or deployed service claim.

The canonical owner-local SQLite bus is inaccessible via remote GitHub. Issue #49 PLAN is cooperative, not an atomic local-bus claim. PR #55 owns the original pump-what-if directory and its test. PR #53 remains unmerged, so no Kaggle lane was taken. Independent review and PR #34 conditional merge gates remain open.

## Integration work order (not authorized by this PR)

1. **After explicit host/#46/#5 owner clearance and canonical-bus reconciliation:** use an authenticated owner-scoped GET of the saved v1 lesson or v2 bundle and current reviewed source revision, then call `resolveLinkedContext`; do not pass client URL revision or trust arbitrary JSON booleans. Handle context changes by unmounting/remounting PumpLab with a distinct React key; pass `readSnapshot(..., restore)` only for the verified context. Save with `saveSnapshot(..., restore)` and evidence with `appendEvidence`, displaying their errors. Preserve the original unlinked v1 local snapshot as an unlinked legacy export/recovery only; never relabel it as linked. Do not write to shared host until ownership is granted.
2. **Independent acceptance:** A→B→A and same-bundle refresh in an allowed browser; source revocation/re-review and account change; actual deterministic PumpLab replay, storage-disabled/corrupt recovery; keyboard/focus, 200% zoom, mobile and reduced motion. Add server-side atomic source/work fencing via #46 only in that owner's separate scope.

## Judging criteria

Product: correct per-lesson resume is a prerequisite, not yet integrated. Creativity: source-linked interactive evidence without invented provenance. Usability: explicit recovery messages, no device observations yet. Sustainability: bounded deterministic local-only storage, no paid services. Impact: prevention of misattribution is a design objective; no measured learner benefit. Presentation: no UI or screenshots shipped. Intelligence: simulation provenance/model/session checks, not trained prediction or source-grounded competency. All seven remain subject to review and real-use validation.
