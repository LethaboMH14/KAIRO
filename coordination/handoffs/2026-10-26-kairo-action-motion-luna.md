# KAIRO action menu and motion research handoff

| Field | Value |
|---|---|
| Date | 26 October 2026 |
| Owner/settings | Codex `codex-luna-kairo-action-motion-20261026-a`, gpt-6-luna / low |
| Task | `KAIRO-ACTION-MOTION-20261026-A` (documentation/research only) |
| Branch/base | `codex/kairo-action-motion-20261026-a` from `origin/main` `c4b9ab22900bb37d573eaa6c29cb6d3e91a76813` |

## Need, criteria, and observable acceptance

- **Learner need:** invoke KAIRO with the exact material/lesson/studio task in view, with short clear choices, stable source anchors, one narrator, and non-blocking reading/practice alternatives.
- **Criteria:** Product, Usability, Creativity, Presentation, Sustainability. No learning outcome or measured accessibility score claimed.
- **Acceptance:** document actual current rig/cues/clip names, route-context actions/scopes, safe requirements and unavailable states, six purposeful proposed motion beats with reduced-motion alternatives, shared narration and cancellation/error semantics, and primary official Rive/Motion/Three/R3F references.
- **Evidence:** `docs/kairo-action-and-motion-20261026/README.md`. Read-only sources at `c4b9ab2`; locally parsed `studio/public/models/character/kairo-teacher.glb` JSON animation chunk: `Idle`, `Listen`, `Explain`, `Acknowledge`, `HandPoint`. Official links accessed 26 Oct 2026.

## Changed paths

- `docs/kairo-action-and-motion-20261026/README.md` — proposed action/scope flow, action availability by page, context requirements, teacher/clasroom compositions, motion state/timing/low-motion behavior, request status/cancel/error and source/device validation plan.
- `coordination/handoffs/2026-10-26-kairo-action-motion-luna.md` — this handoff.

No runtime, provider, route, asset, dependency, manifest, paid tool, or cloud service was changed or installed. No screenshots, tests, build, browser, device, human learner, or language validation were performed.

## Material findings/root review

- `kairo-teacher.glb` has the five authored clips listed; no tablet-hold/seated/writing clip was found in its animation metadata. `lesson.ts` defines an `learner-work` point target labelled as the learner's tablet, which is only a target location. New pose/prop work must be called proposed.
- `move` cue reports unsupported. Existing point requires a real target and supports contact/ray IK; the UI should highlight text when there is no honest world-space target.
- `TeacherProvider` is shared at app root, with stop/pause/status/caption. `StudioCompanion`, source classroom and studio paths reuse it, but not every page uses the same character visualization. `AvatarStage` is a separate rehearsal rig; avoid claiming it's the shipped character.
- Request status, narration and animation cue state must stay separate; no choreographed “thinking” for unmeasured provider latency.
- Future usability acceptance remains keyboard, reduced-motion, no-AI, no-3D, stale-source and phone/zoom review; no evidence on those checks is supplied by this docs package.

## Next step

Root can use this contract to create concepts for a compact KAIRO launcher and modern whiteboard classroom. Before code, choose one visual direction; verify the selected asset/clip availability; and publish any route/provider/interface ownership separately. Prototype the lesson-passage → studio continuity slice first, with text-first fallback and accessible control review.
