# Issue #49 — Computer Science binary-search trace handoff (25 October 2026)

Session: `gpt6-kairo-algorithm-trace-20261025-0904-c` • Client ChatGPT • Model GPT-6 • effort unknown.
Base main: `0fabfdf9b8515cab8ff4100228a6a1df672491c6`.
Remote GitHub-only cooperative claim: https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6394685953. The canonical owner's local SQLite coordination bus was **not accessible**; no local bus registration/claim/status or conflict resolution is asserted.

## Product and judging need

**Product, Usability, Intelligence, Impact:** Learners studying computer science should be able to *do* an algorithm step-by-step, not only see a decorative room. The practical task is to predict the **first lower-bound insertion index** in an ascending array, then compare each algorithmic decision with the predicted index and reason through duplicates/absent/empty lists. This is a prepared source-backed conceptual exercise, not a generated lesson from learner material or evidence of improved learning outcomes.

Concept: official Python 3.14 `bisect_left` docs, https://docs.python.org/3.14/library/bisect.html. This defines the insertion point where every item before it is less than the target and every item at/after it is greater than or equal to the target. This exercise deliberately does not claim to execute Python's library or time a real machine.

## Exclusive new scope

- `studio/src/studio-scenarios/binary-search-trace/model.ts`: bounded sorted-list/target validation, deterministic half-open interval [low, high) trace, strict shrinking invariant, duplicate-first and absent insertion semantics, independent two-round local attempt evidence with model/reference revision.
- `studio/src/studio-scenarios/binary-search-trace/BinarySearchLab.tsx`: keyboard-native 2D/reading activity, prediction before reveal, step-by-step comparison, local-only evidence inspection and optional untrusted host callback.
- `studio/src/studio-scenarios/binary-search-trace/preview.html`, `preview.tsx`: isolated Vite preview; no router registration, shared CSS, account persistence or network calls.
- `studio/tests/binary-search-trace.test.mjs`: exhaustive 9 prepared configurations, duplicates/empty/missing, bad preconditions and predictions, no duplicate scenario, source/evidence integrity and SSR markup.
- This handoff.

No edits to existing pump physics or PR #55's `pump-what-if` files, PR #57's `http-request-trace` files, #9/PR #27 acceptance instrumentation, PR #53/#56 Kaggle code, PR #54 runner, StudioRouter, global CSS, shared contracts or production IAM.

## Observable acceptance and evidence boundary

Local focused check, after dependencies installed under Node 24:
`cd studio && node --test tests/binary-search-trace.test.mjs`.
Full CI: `cd studio && node --test --test-concurrency=1 tests/*.test.mjs && npm run build`.
Preview: `cd studio && npm run dev -- --host 127.0.0.1`, open `/src/studio-scenarios/binary-search-trace/preview.html`.

The first round requires an explicit index and explanation before showing any comparison. A distinct second round is required. The callback `onLocalAttempt(attempt)` only emits **local-unverified** practice evidence; host integration must independently authenticate the user, verify owner and source revision, check model version, and prevent client-forged evidence. No claim of account persistence, authenticated source review, device/screen-reader testing, learner gain or production release.

## Review and NEXT

1. Confirm exact-head CI Node 24 and build; resolve any failures on this branch before acceptance. Independent subject review should verify the lower-bound invariant, sorted precondition and duplicate-first semantics against the Python reference; UX/accessibility review should test actual keyboard and screen reader on a real device where permitted.
2. Integrator should separately publish a source-to-studio adapter contract and a secure owner-scoped attempt persistence contract before mounting the scenario in `StudioRouter` or the authenticated lesson journey. No shared-path edits are authorised here.
3. Independent review and conditional merge gates from PR #34 still apply; the draft PR must not auto-merge or deploy.

**Kaggle:** no authenticated Kaggle execution attempted or claimed. PR #53 remains unmerged at this session's planning check; #50's SQuAD proxy PR #56 remains separate, with its own actual GitHub Actions CPU run.
