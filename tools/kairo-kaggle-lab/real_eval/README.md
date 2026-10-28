# Isolated SQuAD relevance proxy — Issue #50

**Status: no authenticated Kaggle account, no hosted Kaggle run, no application integration, no real learner gains.** This is separate from the eight-topic synthetic sibling `../train.py` in pending PR #53.

### Data provenance, rights and limits

- Original **Stanford Question Answering Dataset v1.1** dev file (not private learner content), `rajpurkar/SQuAD-explorer` immutable commit `eee5fdbf62f8613a7812b03419e6b29617b74fd1`, Git blob `e9a3f913ad1468ebe105b891334ca7b0bc0e2510`. Source URL: https://github.com/rajpurkar/SQuAD-explorer/blob/eee5fdbf62f8613a7812b03419e6b29617b74fd1/dataset/dev-v1.1.json.
- The **SQuAD** dataset card lists **CC BY-SA 4.0**: https://huggingface.co/datasets/rajpurkar/squad. Wikipedia content retains attribution/share-alike responsibilities. Verify authorisation and licence obligations for any new venue; data are ignored locally and are **not committed to GitHub or uploaded to Kaggle**.
- Crowdworkers labelled question/answer spans inside paragraphs. This experiment interprets parent paragraph as a **weak relevance label**, not independently graded KAIRO citations or verified factual truth. The question may be answerable from more than one paragraph. This is a **custom article-disjoint split of the SQuAD dev set**, *not* official SQuAD test results. English only; no human evaluation on South African languages.

### Execute reproducibly (Python 3.11+, CPU, no GPU)

From `tools/kairo-kaggle-lab/real_eval`:

1. `python -m pip install -r requirements.txt`
2. `python -m unittest -v test_run.py`
3. `python run.py --smoke --output outputs/smoke.json` (authored data, smoke only).
4. `python run.py --fetch-public --acknowledge-license --dataset data/squad-dev-v1.1.json --output outputs/real-public-squad-proxy.json` (explicit public network fetch; immutable source Git object verified; never overwrite an existing dataset).
5. To rerun without the network: `python run.py --dataset data/squad-dev-v1.1.json --acknowledge-license --output outputs/real-repeat.json`.

Workflow `.github/workflows/kairo-issue50-relevance-eval.yml` is a **separate public-data CPU job**, triggered on the PR or by manual dispatch, and uploads JSON metrics only. Check actual GitHub Actions run ID, commit, logs and final status. A created workflow does **not** prove a completed execution. No scheduling/paid resources.

### Design and decision rule

- Deterministically shuffle whole Wikipedia **article title** groups, 60/20/20 train/dev/test (seed 5010); require disjoint source titles and SHA-256 paragraph text across groups. Read **only** the pinned public source, validate every labelled answer location.
- Train **StandardScaler + scikit-learn 1.8.0 LogisticRegression** on CPU using six lexical passage-pair features, fitted on training articles only. Candidate generation is deterministic BM25 top 24; training may insert the positive to teach positives when it was absent in BM25, but dev/test **never** insert gold. Freeze model before untouched test.
- Compare lexical BM25 and trained top-24 reranker on exactly the same dev/test query groups: recall@1/3/5/24, exact parent paragraph at rank 1 (weak citation precision proxy), CPU fit time, ranking latency. Default query limits 650/150/200, selected by SHA-256 of question ID. Models cannot retrieve a paragraph absent from BM25 top-24.
- The script always sets `production_eligible:false`. If test recall@3 does not beat lexical, reject promotion; if it wins, mark **REVIEW_REQUIRED_NOT_APPROVED**, still requiring independent domain/tenant/fairness/cost study.
- Cross-owner retrieval **not validated** against KAIRO: issue #4 owns the isolated owner-scoped index, issue #3 owns multi-source API. This experiment does not modify either. Hallucination (no generator), provider token latency/cost (no calls), real-world privacy and multilingual fairness: **NOT MEASURED**. Compute provider spend is zero but CI CPU has an unpriced allocation cost.

### Private Kaggle template — **NOT EXECUTED**

Copy `kernel-metadata.example.json` to ignored `kernel-metadata.json` only in an account actually authenticated and authorised by its holder. Replace account/approved input identifiers; keep `is_private:true`, Internet/GPU off. Attach a **separately rights-verified private dataset** and set `KAIRO_REVIEWED_SQUAD_PATH` to its mounted path. Use the approved Kaggle CLI, never write secrets in GitHub. Example after verification:

- `kaggle kernels push -p tools/kairo-kaggle-lab/real_eval`
- `kaggle kernels status VERIFIED_HANDLE/kairo-relevance-eval`
- `kaggle kernels output VERIFIED_HANDLE/kairo-relevance-eval -p APPROVED_OUTPUT_DIR`

Record actual account identity, kernel URL/version/logs **only if executed**, or state `NOT EXECUTED`. This script does not schedule Kaggle reruns.

### Next small experiments

1. If public proxy is promising, independently labelled, rights-cleared technical **reviewed** passages from KAIRO with article/source revision holdout and cross-owner adversarial tests; discard the learned scorer if recall/citation worsen.
2. Permissioned human evaluation of English plus one South African-language technical query set across entire held-out documents, refusals and query paraphrases; report per-language breakdowns and uncertain labels, no machine-invented acceptance.
