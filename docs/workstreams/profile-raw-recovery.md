# Raw local progress recovery helper

This isolated helper reads exactly `kairo-learning-profile-v1` once and wraps the original string in a versioned JSON envelope. It never parses the stored value, so malformed JSON, whitespace, Unicode, and isolated UTF-16 surrogates are preserved exactly as `rawValue` after parsing the envelope. It does not normalize, project, repair, migrate, write, log, upload, or download anything.

`prepareRawProgressRecovery(storage?)` returns one of `ready`, `missing`, `unavailable`, or `too-large`. A ready result includes a fixed `.json` filename, character/UTF-8-byte counts and serialized envelope. Input is bounded at 1,000,000 JavaScript string units before encoding; serialized output is capped at 6,100,000 UTF-8 bytes to cover JSON escaping plus envelope overhead. Over-limit results do not return raw text.

The value may contain personal data. Any future UI caller must explain that it creates a local copy of the original browser-stored value and require an explicit user action before downloading. This task does not integrate a UI or trigger an automatic export. A recovery copy remains user-editable and has no authorship or tamper-proof guarantee.

## Checks

```powershell
node --test studio/tests/profile-raw-recovery.test.mjs
```

From `studio/`:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

The focused suite passed 4/4, including exact malformed/Unicode/lone-surrogate round trip, one-key/no-write behavior, distinct missing/unavailable/oversize outcomes, and the exact character boundary. Scoped TypeScript exited 0. No UI, browser or full build was included.
