# Evidence gap presentation package handoff — 25 October 2026

## Session and scope

- Agent/session: `codex-evidence-gap-ui-20261025-a`; Codex; actual model and effort unavailable, registered as `unknown` / `unknown`.
- Canonical coordination: `C:\Users\USER\Desktop\fnb app of year hackathon\coordination\bus.py`. Unique session registered; exact task `EVIDENCE-GAP-UI-20261025` claimed before edits. Branch/worktree: `codex/evidence-gap-ui-20261025`, `.worktrees/evidence-gap-ui-publication/`, based on `main@a2dfc4f10499bcd32ac45548fc6767094b26c8d2`.
- Exact owned files: `studio/src/evidence-gap-ui/EvidenceGapPanel.tsx`, `studio/src/evidence-gap-ui/evidence-gap-panel.css`, `studio/tests/evidence-gap-ui.test.mjs`, `docs/evidence-gap-ui-20261025/README.md`, this handoff. The initial requested task had a separate handoff-only path; the additional CSS file is inside the already claimed component subtree.
- Issue #6 asks for role requirements mapped to learner evidence and next study tasks. PR #30 implements a distinct matching/evaluation engine and `RoleEvidence` model UI on an open draft. This package duplicates neither; it is a presentation-only contract proposed by the studio wave brief.

## Need, criteria and implementation

- **Need:** a learner can see what a role asks for, which evidence records are linked or need review, what has no linked record, and what they can practise next.
- **Product:** readable requirement/source/state/action rows make the role-to-evidence path visible.
- **Usability:** source title, safe original HTTPS link, checked date and explicit evidence status sit in each row; invalid/missing provenance and duplicate IDs disable action and say why; empty/oversized states explain the next condition.
- **Impact:** missing evidence is explicitly not framed as lack of ability; linked evidence does not claim competence or employment outcomes.
- **Sustainability:** isolated stateless package; no added package, network, storage, route, shared provider or matching logic.
- **Intelligence:** bounded safe-link/date/duplicate-ID validation gates only a learner-directed callback. No prediction or job matching is performed.
- **Presentation:** KAIRO C mark and chalk/moss/sage colour, plain copy, keyboard focus indication and responsive single-column narrow layout.

The component exports `EvidenceGapPanel(props)` with the exact wave brief interface. It validates source/date/actionability for presentation, renders provider/source data as escaped text, opens the source only when the learner chooses the safe link, and guards `onChooseRequirement`. All inputs remain host-supplied. The host must preserve source lineage/revision, supply current linked evidence accurately, own any persistent changes and validate its own integration contract.

## Checks and limitations

- Environment: Node `v24.18.0`, npm `11.6.0`. `npm ci --no-audit --no-fund` completed in the isolated worktree after an initial unprivileged Windows EPERM; npm's policy left three dependency lifecycle scripts unapproved. No scripts were run manually.
- `node --check tests/evidence-gap-ui.test.mjs` → passed.
- `node --test --test-concurrency=1 tests/evidence-gap-ui.test.mjs` → **7 passed, 0 failed, 0 skipped**. Actual Vite/React server-side rendering confirms source/title/date/state, disabled unsafe or ambiguous rows, XSS escaping and distinct instance IDs. The same exported handler used by the component is exercised for safe, invalid, future-dated, duplicate and unknown IDs.
- `npm run build` → passed: `tsc -b` and Vite `7.3.7` transformed 2,334 modules and completed the production build. Vite emitted the existing large-chunk warning (>500 kB); no build error.
- `.github/workflows/ci.yml` pins Node 24, installs the lockfile and runs `node --test --test-concurrency=1 tests/*.test.mjs`, then `npm run build`. The full repository serial suite remains for PR CI; no result is claimed yet.
- `git diff --cached --check` passed for the five initial owned files before the implementation commit; repeat for follow-up changes before committing.
- No browser/headless observation, microphone/camera, cloud/model calls, paid resources, deployment, schedule or application submission were part of this package.

## Publication gate

The original implementation commit is `ec640deb8443ab09e88ccbbbd11c6752bdb5678b`. After direct authorization in the current chat, branch `codex/evidence-gap-ui-20261025` was pushed to `https://github.com/LethaboMH14/KAIRO` and draft PR [#99](https://github.com/LethaboMH14/KAIRO/pull/99) was opened against `main` and attached to the task. At the first CI snapshot, exact head `cf8f07d6a02e47ec57ef21312aea3ef7677d5c28` had both `App tests and production build` and `Shared bus isolation tests` in progress. This handoff update will be pushed as a documentation-only follow-up; recheck CI at its resulting exact head before reporting final status. No merge, deployment, browser/device observation or learner acceptance is implied.

No FNB partnership, hiring probability, employability/mastery percentage, guaranteed job, live verified vacancy, human learner benefit, browser/device acceptance, or production readiness is claimed. The new component is unmounted and requires root review and adapter contract mapping before integration.

## Root integration boundary

Root should map the reviewed role/evidence contracts to this presentation only after verifying the provider source/date and each linked record ID/revision. Preserve `linked` as record-link state; never turn it into employer approval. Route/storage/auth/provider work remains in separately owned scopes. Review the exact committed SHA and test evidence before any merge decision.
