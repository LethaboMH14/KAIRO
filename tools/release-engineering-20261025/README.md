# KAIRO release acceptance — Issue #11 (25 October 2026)

This is a **versioned, fail-closed review aid** for a human release engineer, not an automatic release system. GitHub is the remote coordination ledger; this directory owns no application source, cloud resources, IAM, CI workflow, branch protection or local SQLite claims.

## Run

```sh
node --test tools/release-engineering-20261025/release-gate.test.mjs
node tools/release-engineering-20261025/release-gate.mjs tools/release-engineering-20261025/PR-LEDGER.json
```

Exit codes: `0` = all *recorded* checks satisfied, **still not release approval**; `1` = evidence is incomplete/failed; `2` = corrupt/inconsistent ledger. Node 22 was used for the isolated focused test. CI's Node 24 full app baseline must be run against the exact proposed integration commit, not inferred from historical handoffs or a stacked child branch. The checker is offline and never queries GitHub to authenticate records: recheck each URL/commit/status and code before promoting a pending gate to pass. Do not use the checker itself as independent review.

## Human release checklist (no automatic merge/deploy)

1. Freeze **observed main SHA**, candidate PR heads, base branches, stacking/dependencies, changed paths, current issue and local-bus claims. Coordinate any shared contract edits. Never silently force-push or merge into main.
2. Independently inspect each PR diff and dependency chain. Flag new permissions, network requests, provider consent, private data exposure, skipped tests, routing/schema drift, third-party licence problems and user-facing claims unsupported by evidence. Do not confuse doc-only PR #12 with app validation.
3. Record a fresh GitHub Actions `npm ci` + **Node 24** serial `node --test --test-concurrency=1 tests/*.test.mjs`, `npm run build` and Python coordination-bus result at the **actual tested SHA**. Examine failing, canceled and skipped steps and logs, not only green badges. CI for stacked #15/#17 may not validate #1's final main-targeted integration branch. Re-run after integration.
4. Gate tenant security (owner filtering, revision integrity, auth, deletion/recovery, provider consent) separately from happy-path unit tests. Use synthetic records only; do not expose credentials or real learner data. Require independent issue #10 evidence for high-risk changes.
5. Require an authorized full source → extraction/review → cited lesson → KAIRO/read → practice → evidence → resume journey on agreed devices and accessibility paths (issue #5). **Existing browser observation and microphone policy denials remain binding.** Record device/browser versions and permission provenance; absent authorization stays untested.
6. Measure response latency, startup/render/chunk weights and affordable-device fallback against an agreed performance budget. Existing >500 kB 3D warning, repeated Vite test-time prebundle scanner diagnostics and backend reservations are not proof of perf/cost acceptance.
7. Prove source/revision/citation integrity and honest competition claims: synthetic judge users, separate owner workspaces and simulated examples must be labelled. No official marks, institutional integration, public access, language/SASL proficiency, learning impact, signups or partner interest inferred from test fixtures.
8. Verify branch protection **actually enabled**, main HEAD current, current Cloud Run IAM policy explicitly still private, external judge-access method approved, scope conflicts reconciled, judge demonstration and rollback drills evidenced. The README's `kairo-app-00007-snn` is only a documented deployment checkpoint.
9. Require explicit owner approval for integration/staging; then separately re-evaluate release candidate, permissions, costs and deploy approval. No operation here stages, merges or deploys.

## Snapshot: PRs inspected on 25 Oct

| PR | Branch relationship | Github Actions for PR head | Acceptance truth |
| --- | --- | --- | --- |
| [#1](https://github.com/LethaboMH14/KAIRO/pull/1) | draft → main | [40157365360](https://github.com/LethaboMH14/KAIRO/actions/runs/40157365360) **failed**: 728/746 pass, 18 fail, build skipped; bus pass | Retrieval primitive is standalone, not wired to generation/UI. Parent needs green integration CI and tenant review. |
| [#12](https://github.com/LethaboMH14/KAIRO/pull/12) | open → main | No PR-head Actions run observed | Documentation/worker packet; neither acceptance nor active workers. |
| [#15](https://github.com/LethaboMH14/KAIRO/pull/15) | draft → #1 branch | [40159022660](https://github.com/LethaboMH14/KAIRO/actions/runs/40159022660) **passed**: 746/746, build, 6 bus tests | Ubuntu Python/OCR CI repair; independently review, verify parent integration and local scope. |
| [#17](https://github.com/LethaboMH14/KAIRO/pull/17) | draft → #15 branch | [40159188644](https://github.com/LethaboMH14/KAIRO/actions/runs/40159188644) **passed**: 750/750, build, bus job | Added Python/OCR regression tests. Logs include Vite dependency scanner warnings despite green suite. |

| [#19](https://github.com/LethaboMH14/KAIRO/pull/19) | draft → main | No PR-head Actions run observed | New synthetic tenant/consent tests, actual file/full Node 24 test pending; issue #10. |
| [#20](https://github.com/LethaboMH14/KAIRO/pull/20) | draft → main | No PR-head Actions run observed | Journey marker tests and denied-browser preflight only, not device/browser acceptance; issue #5. |
| [#21](https://github.com/LethaboMH14/KAIRO/pull/21) | draft → main | No PR-head Actions run observed | Offline read-only GCP preflight; live IAM and cost unverified; issue #8. |
| [#22](https://github.com/LethaboMH14/KAIRO/pull/22) | draft → #1 branch | No PR-head Actions run observed | Unmounted owner-scoped lesson-bundle contract; v2 persistence and route integration pending; issue #3. |
| [#23](https://github.com/LethaboMH14/KAIRO/pull/23) | draft → main | No PR-head Actions run observed | Consented upload controller and synthetic tests; not live mic or validated multilingual listening; issue #7. |
| [#24](https://github.com/LethaboMH14/KAIRO/pull/24) | draft → main | No PR-head Actions run observed | Isolated SQLite index prototype and synthetic benchmark, not Cloud Run persistent index; issue #4. |

| [#26](https://github.com/LethaboMH14/KAIRO/pull/26) | draft → #15 branch | [40159804666](https://github.com/LethaboMH14/KAIRO/actions/runs/40159804666) **passed**: 758/758 Node24 tests, build and bus job | Feature-gated selection state model, not a mounted live picker; issue #16. |
| [#27](https://github.com/LethaboMH14/KAIRO/pull/27) | draft → main | No exact-head Actions observed | Source-anchor/performance diagnostic, NOT observed device performance; issue #9. |
| [#28](https://github.com/LethaboMH14/KAIRO/pull/28) | draft → main | No exact-head Actions observed | Offline signed webhook/dispatch simulation, NOT a live agent runner; issue #13. |
| [#30](https://github.com/LethaboMH14/KAIRO/pull/30) | draft → main | No exact-head Actions observed | Source-dated career evidence gap model only, NOT hiring integration; issue #6. |

This is a historical snapshot of **fourteen external open PRs**, **not live CI status**. This draft PR #25 cannot truthfully include its own changing head SHA in a self-referential static JSON ledger; review #25 independently. PR-LEDGER.json is explicit about what remains pending/failed. Gate categories map to Product/Usability/Intelligence (learner journey and source integrity), Sustainability (CI/performance/cost) and Impact/Presentation (actual judge proof vs. synthetic demonstration). Creativity does not remove safety gates.

## Judge access without changing IAM

**Option A:** trusted owner-operated screen-share, private account stays private; synthetic flows clearly labelled. **Option B:** if separately approved and least-privilege audited, invite specific judges with time-limited IAM/service entry and dedicated fictional account credentials communicated out of GitHub; validate access and revoke on schedule. **Option C:** fully prerecorded synthetic walkthrough with source/revision citations, clearly marked unverified live access. Never change Cloud Run to allUsers, post judge passwords or publish learner data as a quick fix.

**Next unblocked acceptance task:** independently run and review the new eight synthetic owner/revision/provider-consent boundary tests in [PR #19 / Issue #10](https://github.com/LethaboMH14/KAIRO/pull/19) on a real Node 24 checkout; triage any genuine security failures without editing another worker's scope. Its existing PR remains draft; full Node24 CI/build and live tenant lifecycle proof are pending. Separately, Issue #2's tested #15/#17 CI repair still needs approved branch integration into PR #1. Issue #5 already has independent draft PR #20; do not duplicate that worker's scope.
