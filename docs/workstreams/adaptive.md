# Adaptive practice policy foundation

This is an isolated, deterministic recommendation foundation. It does not change the current practice/profile persistence or connect itself to a route. The policy is versioned as `kairo-practice-policy-v1` and is a transparent product heuristic, not a trained model, mastery score, diagnostic, validated educational outcome, or ability estimate.

## API

`studio/src/adaptive/policy.ts` exports `recommendPractice(observations, request)`. The request names exactly one `conceptId`, the current `source`, `task`, and `rubric` revisions, and an injected ISO timestamp `now`. An optional `minimumRecallDelayMs` makes the delay configurable. Its default is 24 hours; this is a product default, not a research-validated interval.

Each `PracticeObservation` has a stable `eventId`, concept/task identifiers, those three revisions, an `occurredAt` timestamp, boolean correctness, `helpExposure` (`none`, `hint`, `worked-example`, or `unknown`), a `contextKey`, and `assessmentKind` (`practice`, `recall`, or `transfer`). The function is pure and deterministic. Observations for another concept are counted and ignored. Revision mismatches are counted and excluded rather than pooled with current evidence.

The recommendation includes the policy version, action and reason, evidence IDs, a chronological attempt view, the preserved first attempt, invalid event IDs/count, ignored-concept and excluded-revision counts, limitations, and an optional learner choice. A learner choice is reported separately; it cannot change the computed recommendation or become assessment evidence. Invalid learner choices are identified with `learnerChoiceRejected`.

Timestamps must be ISO timestamps with a valid Gregorian calendar date, clock components, and timezone offset. Leap days are checked with the Gregorian leap-year rule; impossible dates such as February 30 are rejected before date parsing. Enum values must be actual strings from the declared set; boxed strings and coercible objects are rejected.

## Decision rules

| Observed trail | Suggested next action |
| --- | --- |
| No eligible evidence, invalid request/history, or only different revisions | Insufficient data |
| Most recent eligible attempt is incorrect | Review the cited source or a worked example |
| Most recent success used a hint, worked example, or unknown support | Fade hints and try an independent task in a changed context |
| Independent success without a qualifying later recall | Offer delayed independent recall |
| Later independent recall succeeds after the configured delay on a different task | Suggest independent transfer in a changed context |

An incorrect first attempt remains visible after retries. Malformed, duplicate, future-dated, or reversed-time observations are reported and cannot promote the remaining partial history. Invalid data does not become evidence. A delayed recall requires an independent success, the configured time gap, and a different task ID; repeating the same task cannot unlock transfer. The next transfer activity is only recommended; the module does not claim it was completed.

This first version uses a transparent rule chain rather than ranking a learner or estimating performance. It does not use disability, ethnicity, clicks, time-on-task, or permanent learning-style labels. It cannot claim mastery from one answer. Source and assessment revision boundaries are explicit; old versions do not count toward current-version recommendations.

## Research basis and limits

The [IES What Works Clearinghouse practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) recommends spacing, retrieval through quizzes, and interleaving worked examples with problem solving. The guide concerns school and college settings and does not establish a KAIRO-specific recall interval or prove this implementation effective. [AERO's explicit-instruction practice guide](https://www.edresearch.edu.au/guides-resources/practice-guides/explicit-instruction-practice-guide-full-publication) describes worked examples and gradual removal of scaffolding. [EEF's metacognition and self-regulated learning guidance](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition) supports modelling and guided practice before independent use. These sources support the broad instructional mechanisms only; their reported findings are not KAIRO outcomes or guarantees for every age, subject, or learner.

The default 24-hour delay is an initial configurable product heuristic. The IES guide supports spaced practice broadly but does not validate this single fixed default for KAIRO. Pilot evaluation should compare independent first-attempt performance, delayed recall, changed-context transfer, and support exposure with reviewed tasks and explicit uncertainty before any efficacy claim.

## Verification and remaining work

`studio/tests/adaptive.test.mjs` uses small authored synthetic records. It covers helped versus independent success, retries and first-attempt retention, delayed recall and transfer, repeated task IDs, unknown help, concept isolation, invalid/future/reversed timestamps, calendar rollover and leap-year cases, strict enum types, revision mismatch, and learner-choice separation. This module remains an unintegrated foundation; no browser flow, persistence adapter, educator review, pilot, or learning outcome is claimed.
