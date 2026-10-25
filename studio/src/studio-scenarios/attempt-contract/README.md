# Prepared studio → local review contract (Issue #49)

**Status: implemented standalone boundary, not integrated.** This isolated module gives the five existing *draft PR* studio activities a common, minimal, read-only review shape. It intentionally does **not** store attempts, call an API, fetch private sources, validate a learner's answer, issue a grade or prove the source belongs to the signed-in learner. The current production StudioRouter and account flow are unchanged.

## Contract

`createLocalReview({activity, session, localSessionId?, sourceClaim?})` in `local-review.mjs` supports:

| activity | Producer PR | Input |
| --- | --- | --- |
| `pump-what-if` | #55 | Pure pump challenge `State` plus caller's safe `localSessionId` |
| `http-request` | #57 | `TraceSession` |
| `binary-search` | #58 | `Session` |
| `sql-join` | #60 | `Session` |
| `bfs-path` | #62 | `Session` |

It checks the *published metadata contract*: exact known model/source revisions, expected prepared scenario IDs, two-attempt cap, distinct scenario keys, stable local attempt IDs, and local-only status. Pump input additionally checks the challenge schema and explicit prepared-only provenance. It returns only the activity, model, prepared reference revision, local session ID, scenario keys, attempt timestamps where available and a clearly **unverified** state. Scores, raw predictions, answers, trace text and explanations are never copied to the output.

Optional `sourceClaim` has **exactly** `{sourceId,revision,lessonId,currentRevision}` using the existing 24-hex ID / 64-hex revision formats. It rejects a mismatch, but both revision values originate from browser-side inputs. The output therefore marks `ownerVerified:false` and `revisionVerifiedByServer:false`; it does **not** establish that the material was genuinely reviewed, owned, or unchanged server-side.

```js
import {createLocalReview} from './local-review.mjs';
const review=createLocalReview({activity:'binary-search',session:localBinarySearchSession});
// review.resultStatus === 'local-unverified'
// review.serverVerified === false; review.replayVerified === false; review.score === null
```

## Trust boundary and acceptance

This is a **sanitising metadata adapter**, not a replay validator. A malicious caller can construct a structurally plausible local attempt; the adapter cannot prove an attempt happened or that the recorded result is correct. A future authenticated server endpoint must independently validate Firebase identity, source/lesson owner and immutable revision, relevant consent and source provenance, and **replay the canonical scenario action log with the appropriate model version** before writing a saved learning record. Only a server-authorised record may be called verified. Do not allow browser-generated `serverVerified`, `score`, `ownerVerified` or `evidenceStatus` values to elevate trust.

Before integration, the coordinator must reconcile the canonical local SQLite bus, resolve draft PR #55/#57/#58/#60/#62 interfaces against main and assign a separate exclusive scope for the route, host and server. Human keyboard/screen-reader/mobile review remains required for any learner-visible wiring. The module is intentionally independent of all five PRs, so it can be reviewed on today's main without merging them first.

Run focused regression with Node 24:

```bash
cd studio
node --test tests/studio-attempt-contract.test.mjs
```

Full serial app regression and TypeScript/Vite production build are GitHub CI release gates; a green Node test is not user/device acceptance.
