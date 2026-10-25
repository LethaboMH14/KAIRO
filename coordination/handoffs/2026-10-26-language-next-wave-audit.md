# Existing chat D handoff: language/listening audit

- Owner: `codex-luna-language-next-wave-audit-20261026-a` (Codex, GPT-6, effort unknown)
- Task: `LANG-NEXT-WAVE-AUDIT-20261026-D`
- Criteria: Usability, Impact, Intelligence.
- Learner need: safe recording consent and cancellation, clear typed alternative, editable transcripts, and language claims that match checked evidence.
- Acceptance: actual component/service/adapter tests cover consent revoke, stale result, empty and oversized input, invalid/unverified language, edit/reconfirm, route leave and typed alternative; source audit names concrete defects and limits.
- Exact owned paths: `docs/language-next-wave-audit-20261026/`, `studio/tests/listening-next-wave-audit.test.mjs`, this handoff.
- Application sources were read-only. No runtime, provider, host or router files changed.
- Findings: replacement consent and zero-byte preflight defects reproduced against the audit base. Root's canonical working copy now resets consent and blocks empty files (SHA-256 `16B313D1B9852E04F0718E020165093EC6DF20549EAA1AC5AA63620D3BE23E0D`). Tests assert those desired outcomes and pass against that snapshot; root's source edit is not in this branch. Current refreshed `origin/main` `c4b9ab2` lacks the source fix, so two desired-state tests remain red until root integrates it. Cancellation wording can imply stronger remote cancellation than guaranteed; transcript retention duration/delete affordance remains an owner review question. Details are in `docs/language-next-wave-audit-20261026/README.md`.
- Positive evidence: transcript source/locale and request phase gates reject stale/mismatched results; editing resets confirmation; typed path remains available; route leave aborts; language labels stay unverified; shared narrator uses the existing KAIRO TeacherProvider.
- Checks: `node --test studio/tests/listening-next-wave-audit.test.mjs` passed 11/11 against root's canonical source snapshot (hash in report), with synthetic-only fixtures, injected transcriber/fetch, and local loopback only. `git diff --check` passed. Re-run against the PR branch after root's source fix lands.
- Audit base: `63927423958830e63397a944e639202c392b9708`; latest refreshed `origin/main` is `c4b9ab2`.
- Publication: updated tests/docs are on `codex/language-next-wave-audit-20261026`; draft PR [#121](https://github.com/LethaboMH14/KAIRO/pull/121) targets `main`. The desired-state tests await integration of root's source repair from the canonical working copy.
- Gaps/root action: root reviews/owns all production repairs. No provider-side cancellation guarantees, retention policy, browser/device, language-quality, SASL or learner evidence claimed.
