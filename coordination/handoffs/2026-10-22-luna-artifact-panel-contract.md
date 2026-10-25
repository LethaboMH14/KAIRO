# Artifact panel contract handoff

**Task:** `LUNA-ARTIFACT-PANEL-CONTRACT-001`
**Session:** `codex-luna-artifactcontract-20261022-a`
**Model/effort:** Codex `gpt-6-luna`, low
**Scope:** `docs/workstreams/artifact-panel-contract.md` and this handoff only.

## Delivered

Added a reviewable proposal for backlog items 12.05 and 12.08. It defines a versioned typed envelope for text, image, table, app-managed document preview, and local video reference data. It recommends an initial non-executable renderer, safe DOM text insertion, explicit payload/work bounds, and a separate reviewed contract for any future interactive content.

The threat table covers injection, origin access, network beacons, base URL changes, navigation/forms/popups/downloads, message spoofing, resource exhaustion, native viewers, and malformed references. Browser-enforced sandbox/CSP behavior is separated from application validation and CPU/memory/time limits that browser sandbox attributes do not provide.

## Evidence and limits

Research used official WHATWG, MDN and OWASP documentation linked in the workstream document. No browser execution, runtime code, package changes, generated artifact execution, or security test was performed. This document is a design proposal and makes no claim that the current application has a safe artifact renderer.

## Review / next work

Root should review the proposed envelope and static-rendering boundary before an implementation task claims runtime files. If accepted, implementation should own isolated artifact-panel runtime and tests, then perform browser acceptance against the supported browsers. Any interactive renderer needs separate review for a watchdog and worker/process-level resource controls; iframe sandbox and CSP do not establish those limits.
