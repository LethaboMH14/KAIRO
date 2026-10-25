# KAIRO truth graph and competitive challenge lab

**Version:** 2026-10-25 draft. No live KAIRO learner observation, competitor test, device recording, or external user feedback is claimed here. This specifies a repeatable, permissioned evidence workflow; any sample data MUST be marked synthetic.

## 1. Product truth graph: connect every assertion to what was actually shown

A *claim* is any user-facing promise, investor/deck statement, sales number, judged feature or architectural capability. Each material claim must resolve to an owner, definition, data/source, code/version, evaluation result, competing explanation and next action.

**Suggested JSON claim record, source-controlled in an evidence registry (do not put identities of interviewees or private transcripts in public GitHub):**

```json
{
  "claimId": "LEARNER-CITATION-001",
  "statement": "A reviewed source quote in KAIRO links to the exact current source revision",
  "audience": ["learner", "judge", "lecturer"],
  "type": "testable-product-behaviour",
  "status": "hypothesis-pending-exact-commit-verification",
  "userJob": "Check whether an explanation actually comes from my material",
  "alternatives": ["Gemini Notebook", "manual source checking"],
  "sources": [{"issuer":"KAIRO source code", "path":"studio/server/owner-retrieval/corpus.mjs", "revision":"RECHECK-LATEST"}],
  "implementation": {"repository":"LethaboMH14/KAIRO", "commit":"RECHECK-LATEST", "routes":[]},
  "evidence": [],
  "judgingCriteria": ["Product", "Intelligence", "Usability"],
  "risks": ["stale version", "wrong owner", "OCR error"],
  "counterEvidence": [],
  "decision": "unverified",
  "nextIssue": null
}
```

**Source evidence schema per item:** claimId, issuer/URL, publication date, event/reporting date, retrieved date, population/denominator and unit, original excerpt <=25 words for nonlyrical protected pages, report page/table, limitations, contradictions and owner. For a quote/recording: consent, permitted scope, redaction and retention owner, not public interview raw bytes.

**Verification states:** `proposed`, `source-supported`, `code-implemented`, `isolated-test-passed`, `exact-head-ci-passed`, `independent-reviewed`, `real-device-observed`, `external-user-observed`, `buyer-validated`, `blocked`, `withdrawn`. These are dimensions, NOT a single ordered score: a well-tested code helper is not a measured outcome. Keep `unknown` rather than filling gaps with plausible prose. A feature can meet its scoped merge gate with code/test/review while its broader impact claim remains pending.

**Graph edges:** `problem → root-cause hypothesis → user job → design mechanism → source/citation → implementation path/commit → test fixture → CI run → human task observation → cost measurement → judge criterion → public claim`. Each link has owner and status. If a cited source changes, recalculate every dependent claim; if a feature is altered, invalidate its previous exact-head technical evidence. No single screenshot establishes educational correctness.

### Merge, launch and funding decisions from the graph

- **Merge:** no unresolved relevant red regression, confidentiality issue, wrong-source citation or reviewer critical finding; traceable code/test proof for altered behaviour; scoped source-to-outcome linkage, current commit and rollback.
- **User-visible pilot/demo:** real allowed task, permitted screenshots/recording when applicable, accessible alternative, domain review and failure path; otherwise label unavailable or fallback.
- **Commercial promise/investment:** no fabricated traction, unaudited cloud bills, national-population-as-TAM, invented learning effect, implicit government/FNB affiliation or unverified payment/role matching.

## 2. Competitive challenge lab: same task, fair comparison

**Question:** Is KAIRO better for the learner's actual task than the combination of free/low-friction methods they already use?

**Comparator set (check dated official availability and terms):** Google Gemini Notebook (formerly NotebookLM), PhET, Khanmigo, Quizlet, university LMS/tutorial/lecturer, a public how-to video and an ordinary AI chat. PhET may beat KAIRO at specific simulations; Gemini Notebook may beat KAIRO at source search; a human tutor may beat every AI tool at diagnosing confusion. Record their strengths and weaknesses fairly. No vendor affiliation implied.

**Controlled, permissioned protocol:**
1. Select one *openly licensed or authorised* engineering/IS source of manageable size; record source hash, precise concept and objective. Use identical content wherever supported and mark unsupported features as `not available` rather than silently changing question.
2. Define independent learner starting condition, accessible device/network and allowed tools. Use the same questions, input time budget, prerequisite assumptions and expected domain-correct answer. Do not force a comparator through capabilities it does not claim.
3. Ask participants to predict a cause/effect or trace, find citation evidence, try a change, complete a novel unassisted explanation, save and resume. Include wrong OCR / loss of connection variant only where safe and supported.
4. Capture permitted actual event timestamps, steps, user mistakes, recovery, independent task success, redacted screen recording/screenshot (if allowed), bytes transferred, response latency, accessibility barriers and billable provider cost; do not infer from hypothetical generated mockups.
5. Two reviewers inspect the recordings/results without being told which product should win where feasible. Record failure and user preference; disclose small sample and order/learning effects.
6. Findings produce a **KEEP / SIMPLIFY / FIX / INTEGRATE EXISTING / STOP** product decision and an issue with exact owner, reproducible test and affected judging criterion. Repeat after implementation; the comparison is a feedback loop, not a marketing chart.

**Measurement definitions:** `task_completed` = correct, independently attempted answer against reviewed rubric + clear source citation, not just pressing a button. `time_to_useful_work` = start to independently inspectable attempted explanation, including account friction. `cost_per_completed_task` includes failed/retried jobs, premium voice and support as scenarios or measured invoice. `accessibility` = tested interaction parity with text/keyboard/caption route; an automated static scan is not real-user accessibility evidence.

| Test | KAIRO possibility | Stronger alternative to respect | Counterfactual / limit |
|---|---|---|---|
| Find exact claim in a long source | Reviewed citation and page locator | Gemini Notebook source Q&A may be faster | Citation correctness and revision on exact source |
| Manipulate pump / motor variable correctly | Source-linked domain-valid consequence | PhET may have better proven simulation fidelity | Expert-reviewed calculation and meaningful prediction |
| Receive an explanation with feedback | KAIRO contextual guide | Khanmigo and human tutor have learning design advantages | Novel held-out task + assistance tracking |
| Save transferable evidence | Attempt tied to reviewed source, rubric/assistance | LMS portfolio may have formal instructor review | Learner-owned export integrity; never certification |
| Accessibility on phone/low data | Reading-first fallback, captions and small-step navigation | Ordinary static notes and PhET offline may use less data | 360px keyboard, network throttling where authorised |
| Overall willingness to use again | Coherent source→application→evidence | Existing stack has no new signup and zero price | Real return/use, not artificially induced clicks |

**No comparator benchmark may be called 'observed' without actual authorised execution.** Official docs are secondary proof of capabilities, not proof of speed, user preference or KAIRO superiority.

## 3. Independent red-team and investment-committee challenge

Assign a reviewer who was not the author. Their job is to **try to reject** the claim.

- **Learner skeptic:** What would cause the learner to abandon on the first screen? What if they have 10 minutes, a small phone or no login desire?
- **Subject specialist:** Find one wrong formula, misleading relationship, stale source, overconfident explanation or unsupported real-world safety claim.
- **Accessibility reviewer:** Finish same task without mouse, voice and 3D; inspect labels, subtitles, cognitive load and reading parity, not appearance alone.
- **Competing product advocate:** Show a faster/cheaper/easier alternative using the same task and why learner would prefer it.
- **Buyer/investor reviewer:** Where is the first billable pain, procurement sponsor, real budget, retention and cost after credits?
- **Security/privacy reviewer:** What data leaves the account/provider/region? Can source/instructions or account switching leak or modify another person's work?
- **Judge on a borrowed device:** Without preparation, describe purpose, find first action, observe one compelling consequence and explain limitations.

Each critic submits **claim being challenged → reproduction or source → severity/confidence → corrective action → retest criteria**. “Looks great” without contrary evidence is not review. Resolve material concerns before high-impact claims; return low-value features for de-scoping instead of shipping every idea.

## 4. Evidence catalogue and automatic checks

Suggested source-controlled folders, created only after a separate scoped claim:
- `docs/product-proof-20261025/evidence/claims.jsonl`: public non-sensitive claim metadata, no private user information.
- `docs/product-proof-20261025/evidence/observations.example.json`: explicitly synthetic schema fixture, not claimed fieldwork.
- `docs/product-proof-20261025/evidence/benchmarks/`: task definitions, openly licensed input IDs, hashes, scored rubrics and **real** outcome links if available.
- `docs/product-proof-20261025/evidence/pitch-map.json`: 20s/45s/deck statements bound to exact claim IDs.
- `docs/product-proof-20261025/evidence/costs/`: assumption snapshot vs anonymised invoice measurements, time/region/SKU.

A read-only checker should fail when a *published external claim* lacks source date/denominator (if statistical), when source URL resolves only to a dubious secondary paraphrase and no primary source, when exact-code/CI evidence points at a changed SHA, or when the only purported browser evidence is an AI-generated still. It should NOT silently reclassify unknown as passed, and should not force unrelated backend tests to await unstarted human fieldwork.

Owner's new bounded issue: [#42](https://github.com/LethaboMH14/KAIRO/issues/42) if created; otherwise coordinator should create it on reconciliation with existing release gate #11 and issue #39. Check for duplicate implementations before claiming paths.

## 5. Failure and learning loop

At the end of **each real worker session**:
1. Write one supported outcome, one unanswered question and one piece of counter-evidence.
2. File/refresh a relevant scoped defect or hypothesis, avoiding duplicate issues.
3. Propose the smallest experiment that could falsify the claim; specify **observability, owner, acceptance and cost ceiling**.
4. Coordinator ranks learner severity, judging deadline, expected evidence gain, opportunity cost, code dependency and risk. Delegate only after resolving ownership and verifying active capacity.
5. Re-run original task after changes. Keep negative results; change or retire the claim when evidence contradicts the proposition.

Never claim that existing prompts alone make ChatGPT sessions persistent or that a GitHub issue comment is a worker invocation. An approved event-driven runner or manually started worker session is required.
