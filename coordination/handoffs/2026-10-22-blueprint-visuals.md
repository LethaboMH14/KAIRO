# KAIRO architecture visuals and logo handoff

- Agent: `codex-blueprint-visuals-20261022-a` (Codex, `gpt-6-luna`, low effort)
- Task: `BLUEPRINT-VISUALS-001`
- Scope: `docs/blueprint/visuals/` and this handoff only
- Status: complete for proposed visual assets; browser, human review and trademark checks remain pending

## Deliverables

- `docs/blueprint/visuals/kairo-target-architecture.architecture.json` — editable Archify target architecture specification.
- `docs/blueprint/visuals/kairo-target-architecture.html` — standalone architecture viewer.
- `docs/blueprint/visuals/README.md` — C4-style context/container, learner use cases, conceptual ERD, interruption sequence and lifecycle, architecture assumptions and current/proposed boundary.
- `docs/blueprint/visuals/logo/kairo-lockup.svg` — horizontal wordmark.
- `docs/blueprint/visuals/logo/kairo-shirt-badge.svg` — compact shirt/patch badge.
- `docs/blueprint/visuals/logo/README.md` — rationale, palette, use guidance, and provisional status.

The visual system uses charcoal, warm cream, muted olive, soft gold and clay. The mark combines an open book, rising passage/gateway, and speech cue. It is original vector artwork; no external assets or paid generation were used. Logo selection is still the user's decision, and no trademark search has been done.

## Design decisions and limits

- Every diagram distinguishes the **proposed future target** from the current local development prototype. This is not a deployed architecture or a security, learning, accessibility or operations acceptance claim.
- The full editable Mermaid pack includes adult 18+ pilot context; gaze/point selection of an exact spoken word; tapping a particular number for context; atomic interruption and stale-turn fencing; small listening nods for typing or speech; a lightweight phone/low-data route; and SASL content authored with and reviewed by Deaf contributors.
- Word anchors and viseme animation remain separate. Exact timing is explicitly unclaimed until measured against actual speech, voice and language combinations. Low-data behavior also needs real transfer measurements.
- Google is shown as the first managed AI candidate, with Azure speech as a candidate adapter. These are not final procurement or deployment selections. 3D is client rendered; the proposal does not assume cloud GPU video.
- The conceptual ERD is a design aid, not a migration-ready schema. Server-enforced tenant isolation, provider consent, retention, object access, audit and tool isolation require implementation review.

## Evidence collected

- Archify `doctor`: ready; renderer and schema checks reported OK.
- Archify `validate architecture ... --quality showcase --json`: passed all 9 artifact checks; composition `pass`; 0 errors and 0 warnings.
- Archify `deliver`: succeeded; specification SHA-256 `37aad6072cee1ee2589a607c863cee91060aa1130c409a22cf9f1793d35c239a` (2,571 bytes); HTML SHA-256 `b65cc9bb972f50fadcb2bf530324b6d32fccf6cb9560ec6e836c7bb893a6d237` (705,228 bytes).
- Python XML parser accepted both SVG files.
- The Archify update checker returned `silent` with reason `cache-unavailable`.
- No browser visual-check, viewport-size review, device test, perceptual review, accessibility audit, or print/stitch test was run. The local HTML is therefore structurally delivered but browser acceptance remains pending.
- The workspace did not expose a Git repository at the supplied working directory, so no Git diff/status could be collected.

## Fresh-chat Claude review prompt

Paste this into a new Claude chat if the user wants an independent design review. This is a prepared prompt only; no message was sent and no Claude activity is implied.

> Review the KAIRO Access proposed architecture and provisional logo as an independent design reviewer. First read `AGENTS.md`, `coordination/README.md`, `README.md`, `docs/KAIRO-PRODUCT-BRIEF.md`, and this handoff. Follow the bus protocol: run status, register your own session with actual model/effort (or `unknown`), read inbox, then claim exact files before editing. Do not change application code, assets, shared contracts, root configuration, or cloud settings. Inspect `docs/blueprint/visuals/README.md`, the delivered architecture HTML and JSON, and the two SVGs. Assess whether the container boundaries and async flow are clear, whether the adult pilot and required accessibility behaviors are represented, whether the speech word-anchor/viseme distinction and timing caveat are sound, and whether the logo is legible at small sizes and suitable for embroidery. Report findings with file/diagram references and concrete recommendations. Do not change these assets; if a change is needed, propose it in a handoff and wait for the user/owner to assign an explicit non-overlapping implementation task. Browser/device or trademark claims require actual verification and must remain pending if not performed.

## Next steps for the parent agent

1. Link the visual pack from the parent blueprint/README if desired, under a separately claimed scope.
2. Ask the user to select or revise the logo direction before applying it to application UI, avatar textures or merchandise.
3. Arrange browser review at the Archify-required desktop sizes and a real mobile/data audit before describing the viewer as accepted.
4. Resolve the remaining architecture decisions and implementation gates in the main blueprint before production claims.
