# Issue #50 — ML decision record (2026-10-25)

**Judging:** Intelligence (source relevance), Product (accurate citations), Sustainability (reproducible CPU cost), Usability (traceable evidence). Learner job: find the reviewed passage that actually supports the requested concept. No acceptance of improved learning is claimed.

**DEFINE:** Can a small lexical-feature-trained reranker improve paragraph retrieval over BM25 without losing exact source matches? Frozen metrics: recall@1,3,5,24 and exact-gold citation at rank 1. Reject if measured test recall@3 fails to beat BM25. No post-test feature tuning.

**VERIFY RIGHTS:** Public Stanford SQuAD 1.1 crowdworker QA/Wikipedia passages, dataset CC BY-SA 4.0 per dataset card, Git blob pinned. User private uploads, PII and consent events explicitly excluded. Publication or Kaggle upload requires separate licence and owner/account review.

**BASELINE / TRAIN:** Deterministic top-24 BM25 lexical retrieval; CPU sklearn logistic regression lexical overlap features, fitted only to title-disjoint train documents. Tiny authored examples are smoke-only. The original shared retrieval path (`studio/server/ai-runtime/retrieval.mjs`) and #3/#4 owners are read-only.

**HOLDOUT:** Source/article title 60/20/20 split; paragraph content SHA256 fence; train positives inserted only for fitting, never in evaluation. A passage may answer multiple questions but only its annotated parent is credited, biasing precision downward.

**ADVERSARIAL / FAIRNESS:** Tests reject forged answer offsets, repeated article titles, cross-group duplicate content, unexpected Git blobs and missing rights acknowledgement. **Not evaluated:** production owner leakage, unsupported-language fairness, hallucinations, refusal validity, independent assessor confidence. English Wikipedia questions poorly represent South African curricula.

**COST:** sklearn CPU-only; no GPU, cloud model calls or network provider charge. Record CPU query ranking time, fit/runtime and CI runner consumption when actual workflow exists. Provider token latency and end-user operational cost not measurable by this harness.

**DOCUMENT / NEXT:** Track exact PR commit, workflow ID/log and actual public holdout values here when GitHub Actions completes. Independent reviewer and integration coordinator #11 must evaluate whether gains justify any follow-on task. No integration, production deployment, Kaggle login or schedule occurs automatically.

**Proposed next tests:** (1) independently human-labelled technical passages under versioned source-revision holdout, (2) authorised bilingual and answer-absent requests with per-group abstention/grounding review. Fail and eliminate candidates that underperform BM25 or violate boundaries.

**Kaggle status: NOT EXECUTED; no authenticated Kaggle identity/kernel/version exists in this session.**
