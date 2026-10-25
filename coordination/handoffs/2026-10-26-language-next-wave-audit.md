# Existing chat D handoff: language/listening audit

- Owner: `codex-luna-language-next-wave-audit-20261026-a` (Codex, GPT-6, effort unknown)
- Task: `LANG-NEXT-WAVE-AUDIT-20261026-D`
- Criteria: Usability, Impact, Intelligence.
- Learner need: safe recording consent and cancellation, clear typed alternative, editable transcripts, and language claims that match checked evidence.
- Acceptance: actual component/service/adapter tests cover consent revoke, stale result, empty and oversized input, invalid/unverified language, edit/reconfirm, route leave and typed alternative; source audit names concrete defects and limits.
- Exact owned paths: `docs/language-next-wave-audit-20261026/`, `studio/tests/listening-next-wave-audit.test.mjs`, this handoff.
- Application sources were read-only. No runtime, provider, host or router files changed.
- Findings: replacement audio inherits the prior consent checkbox; empty files are sent by the UI though service/adapter reject them; cancellation status can imply stronger remote cancellation than guaranteed; transcript retention duration/delete affordance is unclear in listening flow. Detailed paths, lines and repair proposals are in `docs/language-next-wave-audit-20261026/README.md`.
- Positive evidence: transcript source/locale and request phase gates reject stale/mismatched results; editing resets confirmation; typed path remains available; route leave aborts; language labels stay unverified; shared narrator uses the existing KAIRO TeacherProvider.
- Checks: `node --test studio/tests/listening-next-wave-audit.test.mjs` passed 11/11 with synthetic-only fixtures, injected transcriber/fetch, and local loopback only. `git diff --check` passed.
- Base: `origin/main` `63927423958830e63397a944e639202c392b9708`.
- Publication: commit `dacb79f` on `codex/language-next-wave-audit-20261026`; draft PR [#121](https://github.com/LethaboMH14/KAIRO/pull/121) targets `main`.
- Gaps/root action: root reviews/owns all production repairs. No provider-side cancellation guarantees, retention policy, browser/device, language-quality, SASL or learner evidence claimed.
