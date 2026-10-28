# Open PR triage, 28 Oct 2026 (read-only)

Method: gh pr list/view/checks on exact head SHA; git merge-base --is-ancestor against origin/codex/midnight-submission-20261026; file-list overlap with #145 (82 files) and pairwise between all PRs. Mergeable=MERGEABLE for all 60 at query time.

Note: origin/main is now 7e94b55 (PR #125 merged), not a2dfc4f; #145 already contains it. CI shown is the 2 required jobs (App tests and production build; Shared bus isolation tests). Green CI is necessary only; the policy also needs independent diff review and UI evidence for user-facing PRs, which this triage did not perform.

Counts: {"SELF":1,"MERGE-CANDIDATE":49,"SUPERSEDED":3,"NEEDS-WORK":6,"STACKED":1}

No two non-#145 PRs share a file, so merge order among candidates does not matter for conflicts.

Recommended first merges: #81, #71, #108, #86, #84 (tests/security guards, small, non-UI). Treat #96/#104 (worker pilot) and #144 (Cloud Run rollout) as security/ops reviews.

| PR | title | head | CI | files | overlap with #145 | verdict | reason |
|---|---|---|---|---|---|---|---|
| #145 | feat: connect cited lessons, reasoning, voice and engineering demo | 49af96c | RED | 82 | 82/82 | SELF (e) | Red CI on exact head: 5+ source-workspace tests fail (SourceWorkspace upload/preview/catalog); contains current main 7e94b55 |
| #144 | Add bounded Cloud Run rollout and model service proposal | 72e6c42 | green (2 checks) | 20 | 0/20 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #143 | Add controlled material review layout | d8dd16d | green (2 checks) | 9 | 9/9 | SUPERSEDED (a) | Ancestor of #145 branch (merge-base check Y); 145 carries later layout edits |
| #142 | feat(studio): accessible fictional pump tank balance with replay (#49) | 3d1cece | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #141 | Add controlled KAIRO teacher access panel | 11bb912 | RED | 5 | 0/5 | NEEDS-WORK (d) | App tests fail: tests/teacher-access-ui.test.mjs |
| #140 | test: reject cloud request-ID collisions without extra lesson allowance | 2aae431 | RED | 2 | 0/2 | NEEDS-WORK (d) | App tests fail: intentional P0 red test (requestId collision allowance) |
| #139 | test(journey): reproduce duplicate saved cloud lesson on same request ID (#16 #46) | 3582fd3 | RED | 2 | 0/2 | NEEDS-WORK (d) | App tests fail: intentional red regression test (duplicate cloud lesson, #16/#46) |
| #138 | feat(studio): fictional pump sensor bias detective with replay (#49) | 3b09c24 | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #137 | feat(studio): isolate pump local replay by verified lesson context (#49) | d016892 | green (2 checks) | 3 | 0/3 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #136 | feat(studio): accessible head-to-gauge-pressure prediction lab (#49) | 2d3a3e0 | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #135 | test(journey): preserve source-linked studio help provenance through resume (#16) | 341d915 | green (2 checks) | 2 | 0/2 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #134 | feat(studio): accessible fictional pump telemetry sampling challenge (#49) | cde928f | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #133 | feat(studio): accessible series-versus-parallel pump reasoning and replay (#49) | 297febf | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #132 | test(journey): red regression for revoked source at practice commit (#16) | 9188273 | RED | 2 | 0/2 | NEEDS-WORK (d) | App tests fail: intentional red regression (revoked source at practice commit, #16) |
| #131 | feat(studio): accessible pump gauge uncertainty reasoning and replay (#49) | e2cf4c1 | green (2 checks) | 5 | 0/5 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #130 | feat(studio): fictional pump shaft-energy comparison and replay (#49) | 305207f | green (2 checks) | 5 | 0/5 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #129 | feat: add controlled KAIRO studio action UI | b210a5f | green (2 checks) | 14 | 14/14 | SUPERSEDED (a) | All 14 files overlap #145; 145 holds same files with newer StudioActionArc/test tweaks |
| #128 | feat(studio): source-linked pump static-head trap and local replay (#49) | 2adf681 | green (2 checks) | 5 | 0/5 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #127 | Add KAIRO presentation state adapter | cb27910 | green (2 checks) | 4 | 4/4 | SUPERSEDED (a) | All 4 files overlap #145; file contents identical to #145 head (empty diff) |
| #123 | Audit role evidence learner journey | 37c05ae | green (2 checks) | 13 | 0/13 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #122 | feat(studio): dependency-order prediction and cycle trace (#49) | 13c3001 | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #121 | Audit listening consent and transcript edge cases | 54bb169 | RED | 3 | 0/3 | NEEDS-WORK (d) | App tests fail: 2 listening-consent/empty-file tests |
| #114 | feat(studio): accessible SQL window rank prediction and replay (#49) | dbe4431 | green (2 checks) | 7 | 0/7 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #112 | feat(studio): accessible PostgreSQL snapshot reasoning challenge (#49) | e47d0f0 | green (2 checks) | 7 | 0/7 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #108 | feat(lesson): owner-scoped v1 read-integrity guard for safe resume (#3) | ff84c9c | green (2 checks) | 3 | 0/3 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #106 | feat(studio): source-backed hydraulic-power reasoning with two local attempts (#49) | a0ebecb | green (2 checks) | 7 | 0/7 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #105 | Propose persisted v2 provider metadata guard | 796a2a8 | green (2 checks) | 2 | 0/2 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #104 | security(#13): paginated attempt ledger and revocation-safe publish gate (stacked on #96) | 89d09b5 | green (3 checks) | 5 | 0/5 | STACKED (e) | Base is review/issue13-paginated-gates, stacked on #96; merge only after #96 |
| #101 | Prototype source-grounded explainer motion clips | 96a0a73 | green (2 checks) | 12 | 0/12 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #97 | feat(studio): opt-in pump phase focus recovery helper (#49) | 6fff0c9 | green (2 checks) | 3 | 0/3 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #96 | feat(#13): guarded GitHub-native Codex worker pilot with fail-closed execution gates | 8c0f251 | green (6 checks) | 6 | 0/6 | MERGE-CANDIDATE | Green, no overlap; but #13 worker/execution gates are security-sensitive: needs independent security review before merge (3 skipped jobs) |
| #94 | feat(lecture): guided source-backed motor field-speed chapter (#90) | 2a6c23b | RED | 8 | 0/8 | NEEDS-WORK (d) | App tests fail (motor field-speed lecture chapter); cause not isolated |
| #93 | feat(studio): six-hour accessible Campus Resilience energy lab (isolated) | 9fc65d4 | green (2 checks) | 9 | 0/9 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #92 | feat(evidence): Evidence X-Ray curated source constellation and local challenge (#89) | 13d9f10 | green (2 checks) | 10 | 0/10 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #86 | feat(security): atomically fence reviewed local lessons on Firestore commit (#46) | 185df58 | green (2 checks) | 3 | 0/3 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #84 | test(studio): pinned pump replay fuzz and forged-action rejection (#49) | f40c181 | green (3 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #82 | test(studio): compose real pump replay into private unverified draft staging (#49) | 54adc37 | green (4 checks) | 5 | 0/5 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #81 | test(ci): fail closed on unreviewed GitHub Actions across workflows (#11) | c869606 | green (2 checks) | 2 | 0/2 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #80 | test(studio): pinned independent pump what-if acceptance gate (#49) | 14858ed | green (3 checks) | 4 | 0/4 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #78 | feat(studio): consented, owner-scoped local pump draft staging (#49) | dae587a | green (2 checks) | 4 | 0/4 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #77 | docs: parallel implementation contracts and independent review | 14e9bca | green (2 checks) | 3 | 0/3 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #76 | feat(lesson): add source-linked readiness panel | f5bad10 | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #75 | test(language): gate language and SASL evaluation metadata honestly | 8379690 | green (2 checks) | 5 | 0/5 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #74 | feat(opportunities): add pure freshness inspector | 241ef36 | green (2 checks) | 4 | 0/4 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #73 | Add extraction edge regression coverage | b2982db | green (2 checks) | 3 | 0/3 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #72 | test(studio): compose pinned pump/attempt/replay/source-link drafts in isolated CI (#49) | 13c6b97 | green (4 checks) | 8 | 0/8 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #71 | fix(lesson): fail closed when reviewed v1 source changes before save (#3) | 444171d | green (2 checks) | 2 | 0/2 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #70 | feat(studio): owner-reviewed v1 lesson link gate for local pump drafts (#49) | 911f23a | green (2 checks) | 4 | 0/4 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #68 | feat(studio): fail-closed pump draft replay audit for future evidence integration (#49) | f2b45fe | green (2 checks) | 4 | 0/4 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #66 | feat(studio): NAND logic prediction and accessible gate-by-gate trace (#49) | 6ae0c55 | green (2 checks) | 7 | 0/7 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #64 | feat(studio): local-unverified attempt review contract for five prepared labs (#49) | d2bafd1 | green (2 checks) | 4 | 0/4 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #62 | feat(studio): accessible BFS shortest-path queue trace and two local attempts (#49) | 9b072dd | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #61 | feat(evidence): read-only claim proof validator with negative tests (#43) | df6245d | green (2 checks) | 5 | 0/5 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #60 | feat(studio): accessible SQL INNER/LEFT JOIN trace and local practice (#49) | d640032 | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #58 | feat(studio): accessible binary-search lower-bound learner trace (#49) | 95bbb0f | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #57 | feat(studio): accessible HTTP request trace with two independent local attempts (#49) | c51789b | green (2 checks) | 6 | 0/6 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #56 | eval(ml): isolated SQuAD article-holdout BM25 vs CPU reranker (#50) | 51d8ae5 | green (3 checks) | 10 | 0/10 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #55 | feat(studio): replayable two-round pump what-if challenge with reading fallback (#49) | a46838a | green (2 checks) | 7 | 0/7 | MERGE-CANDIDATE | issue-49 pump/lab PR: green, disjoint files, no shared files with other PRs |
| #53 | ops: hourly all-worker status watch and Studio/Kaggle worker launch kit | 09e6cb4 | green (3 checks) | 9 | 0/9 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
| #52 | feat(ui): accessible reviewed source picker with private local evidence preview (#47) | d7cc876 | green (2 checks) | 4 | 0/4 | MERGE-CANDIDATE | Green exact-head CI, disjoint from #145 and all other open PRs |
