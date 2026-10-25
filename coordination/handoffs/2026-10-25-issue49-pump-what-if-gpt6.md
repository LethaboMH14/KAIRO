# Issue #49 — standalone Pump What-If Studio implementation

**Date:** 25 October 2026, Africa/Johannesburg.
**Session:** `gpt6-studio49-pump-20261025-0657-a`, ChatGPT, exposed model GPT-6; effort unknown.
**Base:** `main@0fabfdf9b8515cab8ff4100228a6a1df672491c6`.
**Branch:** `worker/issue-49-pump-what-if-20261025-a`.
**Remote claim:** [Issue #49 PLAN comment](https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6393685455).

## Scope and ownership truth

New files only: `studio/src/studio-scenarios/pump-what-if/{challenge.ts,PumpWhatIf.tsx,pump-what-if.css,preview.html,preview.tsx}`, `studio/tests/pump-what-if.test.mjs`, and this handoff.

Original local owner machine's canonical SQLite coordination bus is **NOT remotely readable**; no live bus registration/claim performed. This branch's GitHub issue comment is a cooperative claim, not a substitute for local conflict checks. No change to CHARACTER-002, #9/PR #27 instrumentation, pump-lab physics/session, 3D assets, global routes, source or lesson schemas, package/lockfiles, IAM, cloud deployment or provider calls.

## What runs

The isolated Vite developer preview mounts a native React component, using the existing `studio/src/pump-lab/physics.ts` functions directly. From `studio`, run `npm ci` with Node 24, then `npx vite --host 127.0.0.1`; open `http://127.0.0.1:5173/src/studio-scenarios/pump-what-if/preview.html` (default Vite port, change if occupied). **Not an authenticated app route or deployed learner path.**

Round one: a fixed healthy centrifugal pump model at 1200 rpm, passive valve 45% → 85% open; learner predicts direction and numerical after-flow before any measured values are rendered. An existing deterministic operating-point solver provides before/after flow, pump head and valve loss. Learner may inspect a text-based explanation and then writes an ungraded rationale. Round two independently changes valve 90% → 35% open at 1450 rpm. The second result stays hidden until its own new prediction. At end, both attempts and explanations can be inspected.

No WebGL, avatar, speech, sensor, external requests or live equipment is required. Two-dimensional `meter` bars provide redundant numerical text; optional Reading view shows each value in a definition list. Native fieldset/radios, labeled number input, <details> and text entry are keyboard-supported elements, but real screen-reader/zoom/touch validation is pending. Visible errors/status and async local import cancellation with late-result identity fencing are implemented. No fabricated network retry UI because no network is used. Restart is explicit.

Save/resume is **local user-controlled JSON download and import**; a strictly bounded `kairo-pump-what-if/1` action log is replayed with current `kairo-pump-lab-model/1` and rejects stale model version, extra source fields, invalid action order/values, overlong notes and forged result fields. It does **not** authenticate a user, validate owner/review revisions, preserve account progress in Firestore, protect local files cryptographically, or grade mastery. The UI makes this distinction explicit. Do not upload private learner text to external resources. Full connected source→lesson→studio→evidence→resume is a later coordinator-owned integration task.

## Source and content correctness boundary

**Concept anchor, checked 25 Oct 2026:** Hydraulic Institute, *Pump System Operating Point*, https://datatool.pumps.org/pump-fundamentals/combined; opening a passive valve reduces its resistance and alters intersection of the pump and system curves. The existing model formulas and assumptions are in `docs/pump-lab/MODEL.md` and `studio/src/pump-lab/physics.ts`. The computed figures are from KAIRO's illustrative coefficients, **not** measurements and **not validated by Hydraulic Institute**. Direction invariants are checked against the existing model in tests. No domain expert has independently signed off this version.

**UX reference, documentation-only checked 25 Oct 2026:** PhET official inclusive-design interactive-description guidance, https://phet.colorado.edu/be/inclusive-design/features. Compared requirements: provide explicit dynamic descriptions and standard keyboard operations, not merely colorful graphics. We implement textual change/output and native controls. This is **not a hands-on PhET benchmark, WCAG audit or actual AT/device pass**.

## Focused verification and review gates

`studio/tests/pump-what-if.test.mjs` exercises existing-pump matching for both scenarios, monotonic direction, pre-reveal commitments, strict finite/bounds/type validation, nonmutation, independent second round, full replay/roundtrip, version fencing, forged source/citation exclusion, and compiled React SSR/native-control/preview markers. CI runs the repository's Node 24 *full serial* tests, TypeScript production build and Python bus suite.

**Initial evidence status (at file creation):** code/SSR tests and Node 24 production build not yet executed; full CI pending draft PR. Remote-only source was inspected. Sandbox Node 22 had no network or repo dependency installation; do **not** represent earlier main's 741/741 as this branch's tests. Actual exact-head Actions results should be linked in the PR/issue comments when available.

Independent engineering/hydraulics reviewer still needed for assumptions, qualitative teaching accuracy and where the model does/does not apply. Independent a11y/UX reviewer still needed for real keyboard, native zoom 200%, screen-reader, touch and reduced-motion experience. Browser observation/screenshots remain out of scope without permission. No generated or claimed screenshots.

## Product judging and next independent work

Product: one complete bounded task; Creativity: committed prediction then inspected consequence; Usability: 2D/reading/keyboard and recovery contract; Intelligence: deterministic domain model not hallucinated numbers; Impact: inspectable self-reported attempt **without claimed learning gain**. Sustainability and Presentation need real device/user and cost evaluation; judge score unknown.

**Next 1 — coordinator-gated integration:** coordinator checks original live bus/StudioRouter/PumpHost/evidence ownership and authenticates a new mount, revision contract and owner-scoped saved attempt; do not merely save under a fabricated v1/v2 sourceId. Separate PR and explicit reviewer.
**Next 2 — separate Computer Science specialist slice:** source-backed HTTP request/cache/status trace with predict → step → inspect → explain → independent retry, no overlap with main `Scene.tsx` or `App.tsx`; ask coordinator for exact paths and domain reviewer first. Continue next nonduplicate curriculum scenario only after review.

No automatic background worker, auto-merge or deployed preview is implied.
