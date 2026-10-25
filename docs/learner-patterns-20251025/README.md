# Learner pattern events and synthetic baseline

**Date:** 25 October 2026  
**Owner:** `codex-pattern-events-20261025-a` · Codex · model reported as exposed `gpt-6`; effort `unknown` (not exposed).  
**Scope:** versioned event validation and an offline synthetic-only CPU evaluation. No profile, adaptive-policy, lesson-host, router, provider, database, account or app runtime integration.

## Judging need and acceptance

**Criteria:** Intelligence (inspectable and leakage-tested baseline), Product (practice evidence retains exact lesson/source/task/rubric revision identity), Usability (missing or unknown evidence is not silently treated as failure or success), Sustainability (dependency-free CPU path). **Learner need:** any future pattern-based suggestion must use the right reviewed source/revision and must not misrepresent absent, helped, or synthetic evidence as mastery.

**Observable acceptance:** exact event allowlist rejects private/free-text additions; malformed/missing fields fail closed; current and future outcomes do not enter an attempt’s predictors; training and evaluation learners and source revisions are disjoint; missingness is counted separately; the generated baseline can be reproduced locally from a fixed seed. This package does not establish useful real-learner prediction, mastery, learning gain, fairness, clinical or ability inference, or production suitability.

## Event contract

`studio/src/learner-pattern-events/index.ts` defines `LearnerPatternEvent` with `schemaVersion: 1` and the published fields: `eventId`, `lessonId`, `sourceRevision`, `conceptId`, `taskId`, `taskRevision`, `rubricRevision`, `occurredAt`, `correct`, `helpExposure`, `contextKey`, and `assessmentKind`.

- Required identifiers are bounded opaque tokens; timestamp must be a valid UTC ISO timestamp.
- `correct` is boolean; `helpExposure` is `none | hint | worked-example | unknown`; `assessmentKind` is `practice | recall | transfer`.
- Exact keys are enforced. Extra values such as `learnerId`, email, raw answer, name or profile are rejected. The validator makes a new allowlisted object and does not mutate caller input.
- Batch validation rejects duplicate event IDs and more than 500 records. It validates only shape; it does not claim the caller is authorized, the event is true, or the source is authentic.
- `contextKey` must be an opaque identifier token. Never put a learner name, answer, free text, device ID or other identifying data in it.

The existing [`studio/src/adaptive/policy.ts`](../../studio/src/adaptive/policy.ts) is read as the reference for help exposure, assessment kind, revision identity and honest heuristic wording. It remains unchanged. The package does not connect events to the learner profile or policy runtime.

## Synthetic-only model/evaluation

`tools/learner-patterns-20251025/evaluate.py` uses Python standard library only. It generates 160 synthetic learner groups and 24 synthetic source revisions, 16 scheduled attempts per synthetic learner, then labels 2,399 observed events from a known artificial mechanism. 161 attempts are intentionally unobserved and are not mislabeled incorrect. 242 observed events carry explicit `helpExposure: unknown`.

The split uses deterministic hash assignment independently for learner groups and source revisions. Rows crossing those assignments are excluded rather than reassigned. The emitted evaluation has 577 training rows, 611 evaluation rows, and 1,211 excluded crossing rows; the report asserts no learner or source-revision overlap. Synthetic grouping metadata exists only in the test harness envelope and is never added to the minimized event contract.

The standard-library logistic baseline predicts the next attempt using strictly prior history for the same synthetic learner and concept, explicit current help-exposure category, and assessment kind. It excludes current correctness, IDs, source/task/rubric identity, timestamp, context, and synthetic group identifiers from feature columns. Feature standardization is fit on training rows only. For held-out synthetic learners, test-history updates use only outcomes from earlier evaluation-partition events for that same held-out learner/concept; current and future outcomes cannot enter current features. This is an online synthetic demonstration, not a claim about real prediction.

Fixed-seed result is saved in [`evaluation.json`](evaluation.json): 611 synthetic evaluation rows; accuracy at 0.5 = 0.5810; Brier = 0.2360 vs constant training-prevalence Brier = 0.2401; log loss = 0.6646. These descriptive scores are generated from the same synthetic mechanism, with modest separation from a simple baseline; they are not held-out real-world performance. They do not show learning, mastery, causality, fairness, product value, or user benefit.

## Reproduction

No package installation or external calls are needed. From the repository root:

```powershell
python tools/learner-patterns-20251025/evaluate.py --output docs/learner-patterns-20251025/evaluation.json
Set-Location tools/learner-patterns-20251025
python -m unittest -v test_evaluate.py
```

From `studio/` run the validator suite and a scoped TypeScript check:

```powershell
node --test tests/learner-pattern-events.test.mjs
node_modules/.bin/tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions src/learner-pattern-events/index.ts
```

The evaluation SHA-256 (`5f7061e2f283bec9f6bbf542dd58856036838cd2c066e8c495fefbe4f77e4d6b`) fingerprints canonical generated event-envelope JSON for seed `20261025`. The generator and training are deterministic on the same Python implementation; no actual or private learner records are read.

## Evidence and limitations

- Validator suite: 6/6 Node tests pass, including unknown vs absent help, extra-data rejection, malformed identity/time/enums, duplicate IDs, batch bound and immutability.
- Synthetic baseline suite: 4/4 Python unit tests pass, including repeatability, learner/source disjointness, cross-row exclusion, current-label/ID leakage guard, and missingness accounting.
- Targeted TypeScript check for the new validator: passes using the installed Studio TypeScript compiler; global project build was not run.
- No browser/headless browser, camera, microphone, real learner record, cloud/model/paid call, install, deployment, or automated schedule was used.
- Test scores are synthetic by design. No prediction/effectiveness/learning or device acceptance claim is made. Root review and any future real-data governance, opt-in, retention, fairness and offline/online evaluation gates remain open.

## Next steps

Root may independently review the event schema and synthetic method before considering a separate authorized integration task. If real learner-event research is ever proposed, require privacy/legal/consent review, purpose and retention limits, revision-safe collection, missingness/fairness audit, learner/source-disjoint evaluation, baseline comparison, and prospective validation before making predictions visible. This event validator and training harness do not authorize collection or profile updates.
