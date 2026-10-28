# KAIRO Issue #50 ML/Evaluation handoff — 2026-10-25

Session `gpt6-kaggle-i50-20261025-0658a`; GPT-6; effort setting unknown. Remote GitHub connected. Base main `0fabfdf9b8515cab8ff4100228a6a1df672491c6`. Isolated branch `feat/issue-50-squad-holdout-eval-20261025-a`. GitHub Issue #50 PLAN and separate workflow file-ownership update posted.

The canonical SQLite coordination bus lives in the repository owner's local checkout and **could not be read** via the remote GitHub connection. Therefore no local registration, claim or inbox review is asserted. Cooperative exact-file scopes were announced via Issue #50. No edits to #3, #4/PR #24, the existing #53 synthetic training code, current studio, router, source revision or consent contracts.

## Delivered and boundaries

New `tools/kairo-kaggle-lab/real_eval/` SQuAD crowd-labelled article holdout CPU evaluator and Kaggle private metadata **template**; standalone new GitHub Actions CI workflow; date-stamped decision record. Source is CC BY-SA 4.0 and Git-blob pinned. No raw source data or tokens in Git. Real Kaggle execution **NOT EXECUTED**, account access unavailable, model deployment not requested, no learner gains measured.

Local separate prototype (same evaluation approach but **not byte-identical committed files**) was executed with Python 3.13.5 / sklearn 1.8.0: 7/7 unit tests passed, synthetic training smoke executed; test fixture 6 queries, lexical and model both recall@3=1.0; promotion REJECTED. Synthetic scores do not establish real retrieval value. The committed GitHub code must pass its own **exact-head Actions** suite and independently labelled SQuAD proxy evaluation before results are accepted. Do not misrepresent local prototype logs as verified committed-code logs.

## Open gates and next action

1. Inspect exact PR head SHA, run IDs and CI logs; repair any failure using this branch only. Include real-data results only if source fetch/hash check, model fit and untouched test finish.
2. Coordinator #11: independently review licence/citation caveats, boundary nonoverlap, CI security, metric correctness and no secret leakage. #3/#4 must independently approve any future shared code integration.
3. A future permissioned Kaggle account owner may run the reviewed **private** kernel; require real kernel ID/version/logs, otherwise keep NOT EXECUTED.
4. Next disjoint tasks: real annotated engineering retrieval with versioned source holdout; then reviewed bilingual/unanswerable controls. Stop if learned reranker fails against lexical benchmark.

Judging evidence is automated reproducibility and proxy retrieval comparison only, not actual consumer usability, outcomes or hackathon scoring.
