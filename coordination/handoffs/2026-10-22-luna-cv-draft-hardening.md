# Luna repair handoff: CV field size precheck

- **Task:** `LUNA-CV-DRAFT-HARDENING-001`
- **Owner/session:** `codex-luna-fnb-roles-20261022-a`
- **Model/effort:** `gpt-6-luna` / `low`
- **Scope:** `studio/src/cv-draft`, `studio/tests/cv-draft.test.mjs`, `docs/workstreams/cv-draft.md`, this handoff.

`validText` now checks UTF-16 code-unit length against the maximum byte bound before calling `TextEncoder`; if within that coarse bound, it still measures exact UTF-8 bytes. Since UTF-8 bytes are never fewer than UTF-16 code units for JS strings, this safely rejects obviously oversized text before allocating its encoded buffer. Ordinary short multibyte text remains subject to the exact byte check.

Verification: `node --test tests/cv-draft.test.mjs` — 10/10 pass; focused TypeScript check — pass. The regression replaces `TextEncoder` with a guard that rejects attempts to encode overlong ASCII, then verifies the model returns `TEXT_TOO_LONG` first.
