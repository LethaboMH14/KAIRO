# Issue #9 studio acceptance worker — 25 October 2026

**Session:** `gpt6-issue9-studio-20261025-0542-a`. Client ChatGPT, GPT-6, effort setting **unknown**. Branch `worker/issue-9-studio-acceptance-20261025-a`, base main `20183faf31fe30bc68e2fc70cb339e7fd24fce79`. GitHub Issue [#9](https://github.com/LethaboMH14/KAIRO/issues/9), plan comment [6393086911](https://github.com/LethaboMH14/KAIRO/issues/9#issuecomment-6393086911). Remote connector access only; owner canonical checkout and live SQLite bus **not accessible or checked**. No claim or takeover made in bus.

## Ownership and changed files

Only these four previously nonexistent paths (no shared interfaces touched):
- `studio/tools/studio-acceptance.mjs` — offline frame metric + accessibility trace evidence gate; static pump anchors CLI. Initial commit `5ab9f18b9320fc19039e91189cf4cfdfaef2bf0b`.
- `studio/tests/studio-acceptance.test.mjs` — nine focused cases including existing 16 real pump registry anchors. Commit `1968c5e87a30dd20f7519199966f76a3772015ad`.
- `docs/studio-acceptance-20261025/README.md` — source/provenance review, unauthorised-boundary warnings, review budgets and human/device plan. Commit `efc6b12f504b14b6c6c0c5970542202dcbdea743`.
- This handoff.

**No** `studio/src`, `studio/public`, assets, provider/router, global CSS, lockfile, workflow, package, IAM, cloud or SQLite file was changed.

## Implemented and observable result

Node-only command `node studio/tools/studio-acceptance.mjs --json <trace>` rejects unknown/sensitive fields, invalid sample counts/types and falsely passing missing manual checks; emits explicit metric p50/p95/max/slow fraction/stalls, status and process exit. Anonymous trace input capped at 128 KiB. Missing input: `UNMEASURED` exit 2; synthetic: `SYNTHETIC_ONLY` exit 2; failed metric/check: `FAIL` exit 1; malformed data: `INVALID_EVIDENCE` exit 1; sufficiently filled pass: **`PASS_SELF_REPORTED`**, never independently validated. `--anchors` loads current `pump-lab/layout.ts` and audits 16 namespaced, readable 2D/3D anchors. This only validates data, not rendered highlighting.

## Actual checks (do not overclaim)

Isolated file-mirror prototype in temporary sandbox `/mnt/data/kairo-issue9-work`, **Node v22.16.0**, no full checkout or `node_modules`:
- `node --test --test-concurrency=1 /mnt/data/kairo-issue9-work/studio/tests/studio-acceptance.test.mjs`: **8/8 pass**, TAP duration ~92.6 ms. This prototype mirrors the core logic but is not byte-identical to the branch and lacks the branch's extra real-source layout import/test. Do not cite as 9/9 or official branch gate.
- `node /mnt/data/kairo-issue9-work/studio/tools/studio-acceptance.mjs --json`: `UNMEASURED`, **exit 2**.
- Four synthetic/local JSON trials: `SYNTHETIC_ONLY` exit 2; 120x60ms intervals `FAIL` exit 1 (p95 60ms, 100% slow frames); deliberately mislabelled 120x16.7ms fixture `PASS_SELF_REPORTED` exit 0 (**not device proof**); extra private ID `INVALID_EVIDENCE` exit 1. This tests classifications, not browser performance.
- **Not run:** Node 24 baseline, `npm ci`, `node --test --test-concurrency=1 tests/*.test.mjs`, `npm run build`, branch's nine-test file, branch's `--anchors` command and actual browser/phone/GPU/assistive tech. No network cloning in sandbox (DNS failure), no Node 24 there; do not reuse older handoff 741/741 as this branch's result.

## Source inspection and boundaries

Reviewed the 25 October integration and architecture, current #9, main commit, open issues/PRs, engineering/pump scene/teacher sources, and current character/engineering asset manifests. New character manifest+credits contain CC-BY Rain lineage, synthetic speech and Poly Haven HDR; earlier Oct 22 audit reflects older GLB bytes. No binary hashes recomputed. Prior CHARACTER-002 ownership is documented; current live claim cannot be read, so asset changes stay blocked pending owner release/confirmation. Engineering model is project-authored with recorded source geometry counts; pump lab is procedural illustrative physics. Existing narrator stop/cancellation and 2D/Reading fallback are code-reviewed, not device-observed. No walking, physical contact, signer-confirmed SASL, exact lip sync or actual learning-gain claim.

## Review and NEXT

Coordinator: reconcile live local bus scopes, review branch diff/runbook and run Node 24 dependency install, full serial suite/build; use permitted device profiles (phone/laptop/desktop) to collect actual frame and keyboard/Reading/anchor/cancel checks if authorisation changes. Validate 16 source anchors, test real highlighting and reference integrity, plus contrast/zoom/screen reader and engineering-domain review. Do not merge/deploy solely from self-reported report.

**Next unblocked backlog action within #9:** independent source-only motor part anchor/label parity audit using the existing `motorContent.ts` + model geometry registry, confined to new test/tool files; no app/asset edit needed. Alternatively issue #5 can review the offline accessibility acceptance checklist within its own scope. All new production UI fixes await device evidence and coordination.
