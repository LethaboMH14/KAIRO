# Media input adapter contract

Date: 2026-10-22  
Agent: `codex-luna-connectivity-copy-20261022-a` (gpt-6-luna, low)  
Task: `MEDIA-INPUT-001`  
Status: API approved by root and implemented in the isolated media-input adapter.

## API

Proposed and root-approved export:

```ts
parseYouTubeReference(input: unknown):
  | { ok: true; videoId: string; startSeconds: number }
  | { ok: false; error: string }
```

Success returns only a validated 11-character video ID and a whole-number start offset. An absent offset becomes `0`. The adapter does not create an iframe URL or a media panel descriptor; the later UI integration can pass these validated values to the existing `mediaPanelDescriptor` along with its own learner-facing title/context fields.

## Accepted input

- Bound the original string to 2,048 JavaScript characters and 2,048 UTF-8 bytes before URL parsing.
- Accept only HTTPS URLs on exact `youtube.com`, `www.youtube.com`, `m.youtube.com`, or `youtu.be` hosts; no credentials and no nondefault port.
- For YouTube hosts, accept only `/watch` with exactly one `v` parameter. For `youtu.be`, accept one path ID. IDs must match `[A-Za-z0-9_-]{11}`.
- A `v` parameter on a `youtu.be` link is rejected because the short-link path is the sole ID source.
- Reject fragments, unsupported paths/protocols/hosts, duplicate `v`/`t`/`start` fields, and simultaneous `t` plus `start` fields.
- Parse only whole seconds, optionally followed by `s`, in the range 0–604800 inclusive. Reject minute/second strings and all other timestamp forms.
- Ignore unrelated tracking parameters. They are never copied to the result or forwarded to the player.

All failures return the error variant; malformed or missing IDs never produce a usable reference. The adapter has no network, frame, server, or `reference-core` imports and makes no claim that a URL is playable, available, safe, cited, or evidential.

## Existing boundary

`studio/src/media-panel/presenter.ts` currently validates IDs with the same 11-character alphabet, restricts starts to 0–604800 seconds, and constructs a fixed `youtube-nocookie.com` embed URL. This adapter is a separate parser for user-supplied URL text; it must not alter or bypass that presenter boundary. The reference is still unverified user input.

## Validation

Focused tests cover accepted watch and short URLs, default and explicit seconds, bounds, malformed/missing IDs, URL length and UTF-8 byte bounds, host/protocol/port/credentials/path/fragment rejection, duplicate and conflicting control parameters, and tracking-field discard. `node --test tests/media-input.test.mjs` from `studio/`: 6 passed, 0 failed. A strict check scoped to the new parser passed with `--strict --skipLibCheck`. The project-wide strict TypeScript check was also run, but currently fails in unrelated `src/character/RehearsalStage.tsx:38` with TS2304 (`Html` is not declared there; reported twice). No parser diagnostics were reported by that project check; the character path is outside this task. No fetch, iframe, metadata, availability or provider API test is in scope.

## Scope limit

Root released the aggregate-snapshot hold before implementation; the aggregate 208-test run and strict build were reported passing. This adapter does not add or connect a route, call a provider, mount a player, or verify video availability. UI integration remains a separate root-owned task.
