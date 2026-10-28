# Synthetic schema-v2 bundle security evaluation

## Purpose and judging need

This offline package supports **Product** (a repeatable source/revision gate), **Intelligence** (check integrity boundaries before relying on multi-source records), and **Sustainability** (a small standard-library runner root can rerun against the integrated record module). Learner and product need: malformed ownership, revision, archive, provider or consent state must fail closed before a saved multi-source lesson is trusted.

## Run against the implementation under review

```powershell
node tools/bundle-security-eval/evaluate.mjs `
  --record-module "C:\absolute\path\to\studio\server\lesson-v2\record.mjs" `
  --output tools/bundle-security-eval/results/local-run.json
```

The module path is mandatory and must be absolute. The runner imports the selected module and its adjacent owner-retrieval/workspace modules; it does not substitute a local verifier. Only Node built-ins are used by the runner itself. `--help` prints the usage.

## Recorded synthetic run

`tools/bundle-security-eval/results/pr48-ef53479-synthetic.json` records 15/15 expected outcomes against the actual `record.mjs` at PR48 repair commit `ef53479040e2ac1c21f8219454c35d9f89d2d7f0`. The supplied module SHA-256 is recorded in that result. Cases cover owner mismatch, current revision changes, missing/tampered archived revisions, deleted sources, provider/model and consent rejection, markup-shaped source text kept as data, and cancellation before a repository read.

All fixtures use in-memory synthetic owners, sources, revisions and lesson content. The runner performs zero provider calls and reads no production account or live learner data. It does not run arbitrary source text, instantiate a production service, or alter the imported module. Case results are serialized as a versioned JSON result with each expected and actual outcome.

## Limits

This is a focused behavioral regression check, not a penetration test, security audit, compliance certification, or proof of transactional storage guarantees. The markup-shaped string case only verifies that the record layer preserves the fixture as text without evaluating it; it does not test browser rendering or XSS defenses. The cancellation case covers an already-aborted signal before source reads, not every mid-flight race. Root should rerun the kit against the integrated service and its real repository adapter after mounting. Human review and production security approval remain separate.
