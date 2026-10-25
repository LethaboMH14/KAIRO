# KAIRO Kaggle training lane — actual, verifiable workflow

This is an **authored synthetic baseline** for an educational source-relevance classifier with a held-out TOPIC split, compared against an explicit lexical threshold. Source code is not data from learners, employers or institutions. Small perfect scores on 4 held-out synthetic pairs are meaningless evidence of learning outcomes or production retrieval quality. This script demonstrates a real fitting/evaluation *pipeline*, NOT a validated retriever.

## Local/CI smoke
Python 3.11+ with scikit-learn==1.8.0. Run from this folder:
```
python -m pip install scikit-learn==1.8.0
python -m unittest -v test_training.py
python train.py
```
`train.py` explicitly reports that its execution environment was not verified as Kaggle; a Kaggle worker must attach authenticated kernel URL, version, run status and output/logs separately.

## Kaggle setup — private and permission-scoped
Official docs: https://www.kaggle.com/docs/notebooks and https://github.com/Kaggle/kaggle-cli/blob/main/docs/kernels.md.

1. Connect or authenticate a Kaggle account **only via approved credential management** (never in GitHub files/issues/PRs). The connected ChatGPT GitHub tool does **not** imply Kaggle authorization.
2. Copy `kernel-metadata.example.json` to ignored `kernel-metadata.json`; replace `REPLACE_WITH_YOUR_KAGGLE_HANDLE` using verified account identity, keep `is_private:true`, `enable_internet:false`, `enable_gpu:false`. Do not publish/upload private coursework or identifiable learner records.
3. Confirm current package availability and notebook scheduling/quota on the authenticated Kaggle account.
4. Run `kaggle kernels push -p tools/kairo-kaggle-lab` only after account, licence and code review. Inspect `kaggle kernels status YOURHANDLE/kairo-relevance-baseline`, kernel logs and generated outputs. Do not claim a Kaggle run before real status/output evidence.
5. Kaggle notebooks support scheduled reruns on time or dataset updates, **when the account permits it**; configure through the Kaggle notebook Settings only after reviewing data/licence, workload and quotas. Scheduling a notebook runs that notebook, NOT another ChatGPT worker.
6. Before promoting any model, replace synthetic toy records with lawful, independently reviewed, appropriately split data; record licences, purpose/consent, held-out test by source/learner, data contamination, important language/coverage groups, calibration, regression cases, accuracy vs lexical baseline, device/latency/cost and safe rollback. No deployment without owner approval.

**Why CPU first:** basic TF-IDF and small classifiers do not need a GPU. Kaggle accelerator limits vary by account/capacity. Using GPUs unnecessarily wastes quota.

## Next real experiments (coordinator assigns)
- Compare source-context reranker vs existing owner-scoped lexical retrieval on genuinely labelled, rights-cleared technical passages with no document leakage.
- Evaluate retrieval quality and error costs in English and permissioned South African language passages; record untranslated vocabulary failures.
- Only after robust evidence consider assisting lesson selection, never claiming mastery, diagnosing a person or making employment predictions.
