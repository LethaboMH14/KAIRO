# Learner pattern events and synthetic baseline handoff

**Task:** `AI-PATTERN-EVAL-20261025-D`  
**Session:** `codex-pattern-events-20261025-a` · Codex · exposed model `gpt-6`; effort unknown/not exposed.  
**Exact claimed scopes:** `tools/learner-patterns-20251025/`, `studio/src/learner-pattern-events/`, `studio/tests/learner-pattern-events.test.mjs`, `docs/learner-patterns-20251025/`, this handoff.

## Change summary

- Added versioned, strict/minimized TypeScript event and bounded batch validators. The schema adds `schemaVersion: 1` to the published event fields. Extra fields (including learner/profile/raw answer data) fail closed; unknown help is explicit and required-field absence fails closed.
- Added dependency-free deterministic synthetic data generator, learner/source-revision-disjoint split, online history feature extractor, training-only standardization, small logistic CPU baseline, Brier/log-loss/accuracy/prevalence metrics and fixed-seed JSON output.
- Added Node validator tests and Python tests against the actual event validator/evaluation functions. No route, adaptive policy, profile, lesson host, provider, runtime, manifest, database or real data was edited.

## Judging criteria and learner need

- **Intelligence:** demonstrate a reproducible baseline and leakage/missingness controls without calling it predictive efficacy.
- **Product:** preserve lesson/source/concept/task/rubric revision identity for later review.
- **Usability:** distinguish unknown help and absent attempts from incorrect answers; keep scope and limitations plain.
- **Need:** any future learning-pattern suggestion must not combine the wrong source revision or treat missing/private evidence as learner ability.
- **Acceptance checked:** strict event schema, learner/source-disjoint split, history only from prior events, ID/context/current outcome exclusion, generated report and deterministic tests.

## Verification evidence

- `node --test tests/learner-pattern-events.test.mjs` from `studio/`: **6/6 pass**.
- `python -m unittest -v test_evaluate.py` from `tools/learner-patterns-20251025/`: **4/4 pass**.
- `node_modules/.bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions src/learner-pattern-events/index.ts` from `studio/`: **pass**.
- `python tools/learner-patterns-20251025/evaluate.py --output docs/learner-patterns-20251025/evaluation.json`: pass; fixed-seed data fingerprint `5f7061e2f283bec9f6bbf542dd58856036838cd2c066e8c495fefbe4f77e4d6b`.
- Result: 2,399 observed of 2,560 scheduled attempts; 161 unobserved; 242 unknown-help events; 577 train / 611 evaluation / 1,211 cross rows excluded; learner/source disjoint both true; Brier 0.2360 vs constant-prevalence 0.2401, accuracy 0.5810, log loss 0.6646. Synthetic-only, not real prediction or efficacy evidence.

## Limitations and integration boundary

- No browser/device, mic/camera, private/real learner data, network/cloud/model call, install or deployment was used.
- Metrics arise from generated labels produced by the same artificial mechanism. They do not establish real-world predictive ability, learning, mastery, fairness, causal effects or commercial value.
- No runtime storage, consent UX, privacy/legal retention policy, server authorization, profile integration, adaptive recommendation, or collection behavior is implemented. Root must review and authorize any separate integration.
- Existing `studio/src/adaptive/policy.ts` is reference only and was not edited. Event validation establishes structure only, not authorship, authorization, truth or source integrity.

## Reproduction

See `docs/learner-patterns-20251025/README.md` for exact Node, Python and scoped TypeScript commands. The evidence JSON is checked into the claimed docs subtree and can be regenerated with the fixed seed.
