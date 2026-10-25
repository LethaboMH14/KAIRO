# B4 handoff: offline language/listening evaluation fixtures

- Owner: `codex-luna-language-listening-eval-20261025-b4` (Codex, GPT-6, effort unknown)
- Task: `LANG-LISTENING-EVAL-20261025-B4`
- Criteria: **Impact** (inspect before learner data collection), **Usability** (clear task fixture contract), **Intelligence** (reproducible mechanical metric with explicit limits).
- Need: a reviewer needs a small offline contract for later approved comparisons, while learners and signers need their data and language capability claims protected from unsupported inference.
- Acceptance evidence: five synthetic starter rows validate; tests cover strict schema, duplicates, synthetic-only status, SASL unavailable, Unicode normalization, WER/CER behavior, null hypotheses and empty references. Run: `node --test tools/language-listening-eval/test.mjs`.
- Changed files: `tools/language-listening-eval/validator.mjs`, `tools/language-listening-eval/fixtures.json`, `tools/language-listening-eval/test.mjs`, `docs/language-listening-eval-20261025/README.md`.
- Decisions: every fixture is `synthetic: true`, `humanReviewed: false`, `status: "not-run"`, and has `hypothesisText: null`; WER/CER are mechanical only and never establish accuracy. SASL remains unavailable and has a separate signer-review protocol.
- Checks and results: `node --test tools/language-listening-eval/test.mjs` passed 6/6; `git diff --check` passed. Checks ran in the isolated B4 worktree at `C:\Users\USER\Desktop\fnb app of year hackathon\.worktrees\language-listening-eval-20261025`.
- Gaps: no model output, learner data, provider integration, human/signer review, language-quality validation, device acceptance or production capability change. Future comparison requires a separately approved data, consent, privacy, provenance and review protocol.
- Publication: commit `50ee878` on `codex/language-listening-eval-20261025`, pushed to `origin`; draft PR [#110](https://github.com/LethaboMH14/KAIRO/pull/110) targets `main`.
