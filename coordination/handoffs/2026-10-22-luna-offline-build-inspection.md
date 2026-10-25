# LUNA-OFFLINE-BUILD-INSPECTION-002 repair handoff

Agent `codex-luna-offline-inspection-repair-20261022-a`, Codex, `gpt-6-luna` / low. Repair scope: `tools/offline-inspection/`, `docs/workstreams/offline-build-inspection.md`, and this handoff. Runtime continuity/service-worker files remained read-only.

## Repair

- The inspector now retains source text only after resolving each asset with `realpath` and confirming it remains inside the supplied build root. Runtime-regex comparison and independent discovered-edge comparison consume that checked in-memory text; neither pass reads candidate paths again.
- Added a symlink regression: an outside target contains a unique static import and external resource. The inspector reports the symlink unsafe and neither edge nor external resource leaks into its report.
- Invalid percent encoding is reported as unsafe without terminating inspection.
- The JavaScript scanner reports unrecognized static declarations and declarations exceeding its 200-token search bound. Reports include `unsupportedSyntax`, and unsupported syntax gives the CLI a nonzero exit status. The utility explicitly describes itself as a bounded scanner, not a full parser.
- The symlink behavior test tries to create a real symlink. This Windows environment denies it (`EPERM`), so the passing regression injects the same outside-root `realpath` result and tracks filesystem reads; it confirms the resolved external file is never read. Actual OS-level symlink behavior remains unverified here.
- No current `dist` was inspected. Root will run the corrected inspector against the build after its independent hash/identity check.

## Checks

- `node --test tools/offline-inspection/inspect.test.mjs`: passed, 8 tests, 0 failures, 0 skips.
- Scoped syntax/type checks are not applicable; this is a Node ESM CLI and fixture tests.
- No app build, browser, network call, package install, or runtime edit was made.

## Limits and next step

The scanner only handles recognized static JS forms and regex-discovered HTML/CSS references; dynamic imports and runtime-computed paths remain outside its closure. Fixture results do not constitute browser/offline acceptance. Root should inspect a confirmed build after this repair is accepted.
