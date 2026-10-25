# Repeatable research -> feedback -> evidence loop

Use this for each later KAIRO subsystem without reopening the entire product every time.

1. **Name one observable user task.** Who is doing what, with which material, on which device? Write a successful outcome and a realistic failure/recovery. Include the relevant judging question, without predicted marks.
2. **Inspect what exists.** Trace actual route/import/API/data boundaries, ownership and current evidence. Separate implemented, isolated prototype, research, device-tested and learner-tested.
3. **Write the uncertainty.** For example: “Can this composer preserve exact citation metadata through split/reorder/export?” Research a measurable question rather than “best framework”.
4. **Bring back primary evidence.** Official docs/licence files, pinned versions, relevant API examples, source publication dates, limits and contradictory evidence. AI search responses and demos are leads, not guarantees.
5. **Choose against alternatives.** Compare reuse existing code, one small dependency, larger framework and defer. State costs after credits, licence/data obligations, migration/undo and rejected options. Choose the smallest complete path, not the most impressive tool list.
6. **Publish the interface.** Input/output schema, identity/revision rules, authority, size/unit bounds, cancellation/error behavior, source provenance, ownership and acceptance fixtures. Get dependent owners to read it; do not infer bus messages were received.
7. **Run an isolated vertical spike.** Public/synthetic fixtures, exact files, no secret/private data. Prove a full round trip and a failure case. No production manifest/provider migration hidden inside research.
8. **Independent review.** Try stale versions, fabricated citations, semantic wrong answers, invalid units, hostile markup, resource bounds, inaccessible controls, failed saves and unsupported topics. Green structural tests do not settle domain truth or usability.
9. **Return a concrete feedback request.** Show the actual artifact/change, explain behavior and open decisions. Distinguish user preference from source correctness and missing technical evidence. Preserve accepted choices and narrow the next question.
10. **Integrate incrementally and remeasure.** Version the contract, preserve old work, add appropriate tests and a handoff. Observe device/learner behavior only through permitted methods. Promotion needs the relevant evidence; repeated brainstorming is not implementation progress.

Reusable research prompt:

> For KAIRO subsystem [name], help [user] complete [task]. Current implementation/evidence: [links]. Missing behavior: [specific gap]. Constraints: [identity/access/privacy/licence/cost/runtime]. Trace every step input -> tool/method -> AI or deterministic/human decision -> validated output -> failure/recovery. Verify official current sources. Recommend one smallest complete approach and one alternative; list KAIRO-owned work separately from library features. Propose exact interfaces and representative fixtures. Challenge claims in the supplied feedback. Do not assume installation, paid calls, deployment, browser observation or perfection is authorized. Return evidence, unresolved questions and a bounded next implementation package.

Workflow files here are project documentation/prompt data. They do not install agent skills, grant tools permissions, start background agents or invoke models automatically.
