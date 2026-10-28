# B3 synthetic bundle-security evaluation handoff — 25 October 2026

## Ownership

- Agent/session: `codex-luna-bundle-lesson-view-20261025-b`; Codex; model and effort `unknown` (not exposed).
- Task: `BUNDLE-SECURITY-EVAL-20261025-B3` (separate task after B1 release).
- Isolated branch: `codex/bundle-security-eval-20261025`, based on `a2dfc4f10499bcd32ac45548fc6767094b26c8d2`.
- Exact scope: `tools/bundle-security-eval/`, `docs/bundle-security-eval-20261025/`, this handoff.
- No production record, route, repository, provider, policy or auth code was changed.

## Delivery

`tools/bundle-security-eval/evaluate.mjs` requires an explicit absolute `--record-module` path and imports that PR48 record module plus its adjacent owner-retrieval/workspace contract. It creates in-memory synthetic owner/source/archive fixtures and uses the actual `createLessonV2Record` and `verifyLessonV2Record` functions; it contains no alternate verifier. The versioned result is `tools/bundle-security-eval/results/pr48-ef53479-synthetic.json`.

**Need/acceptance:** a reproducible Product/Intelligence/Sustainability gate for source integrity and provider-consent checks before multi-source records are used. The runner reports 15 actual cases: 15 expected outcomes passed, 0 failed. It records the imported module SHA-256 and marks all data synthetic, with zero provider calls and zero production accounts/live data. Tested expected rejections include wrong owner, changed or missing current source, missing or tampered archive, unsupported provider/model, missing/mismatched consent and pre-aborted reads. Markup-shaped source remains a string; no text is executed.

## Run and evidence

From the repository root:

```powershell
node tools/bundle-security-eval/evaluate.mjs --record-module "C:\absolute\path\to\studio\server\lesson-v2\record.mjs" --output tools/bundle-security-eval/results/local-run.json
```

Executed against the actual root-owned PR48 repair worktree module at `C:\Users\USER\Desktop\fnb app of year hackathon\.worktrees\pr48-provider-repair\studio\server\lesson-v2\record.mjs`, commit `ef53479040e2ac1c21f8219454c35d9f89d2d7f0`; output module SHA-256 is recorded in the JSON result. Runner exit code was 0, summary 15/15. No provider/network, browser, test account or live data was used.

## Remaining limits

This small synthetic fixture run is not a penetration test, general security review, certification or proof of database race safety. The malicious-looking text case validates only persistence as inert data at the record layer, not browser rendering. Cancellation is tested before repository reads, not at all interleaving points. Root owns rerunning against integrated routes/service/repository after B2/B3 integration and making any release decision. No route mount, deployment or production change occurred.
