# Claude CHARACTER-002 handoff (teaching character)

**Status: delivered and verified on 22 October 2026.** The isolated character module, its asset, a standalone rehearsal harness, the rebuild pipeline and the evidence are all in the claimed scopes. No shared router, provider, shell, server, package or lockfile was changed, and the teacher is not yet integrated into `/teacher`.

## Who and scope

- **Session:** `claude-character-20261021-a`, Claude Code, model `claude-opus-5-5`, effort `max` (both shown by the client).
  - It was started by the user from the ENG-001 session after that session completed.
  - On 22 October the finishing work moved to a session handed off from the original, under the same bus identity.
  - The original session then took a separate task under its own identity (`claude-tripo-20261022-a`, CHARACTER-003-TRIPO).
- **Claimed scopes:**
  - CHARACTER-002: `studio/src/character`, `studio/public/models/character`, `design/character`, `docs/character` and this file.
  - CHARACTER-002-TOOLS: `tools/character`.
  - CHARACTER-002-PREVIEW: `.claude/launch.json` (the `character-preview` entry only).
- **Not touched:**
  - shared router, provider, shell, server, package and lockfile files;
  - `studio/src/avatar` and `studio/src/teacher` (AVATAR-001 and TEACHER-001);
  - Engineering files;
  - `design/tripo` and `tools/tripo`.

## Delivered files

| Path | Contents |
|---|---|
| `studio/src/character/TeacherCharacter.tsx` | The component (default export), rendered inside a host's R3F `<Canvas>`. Each frame it restores the clip pose, then runs: clips; torso turn and pointing hand; two-bone arm IK to real targets; forearm twist; head, neck and eye gaze; hair springs; finger correctives; face (expression, visemes or loudness, blink) |
| `studio/src/character/types.ts` | The contract (below) |
| `rig.ts`, `ik.ts`, `cues.ts`, `face.ts`, `springs.ts` | Rig names and capabilities, IK maths, the cue ledger (one terminal event per id), mouth and blink timing, spring chains |
| `Rehearsal.tsx`, `RehearsalStage.tsx`, `lesson.ts`, `useSpeechSample.ts`, `rehearsal.css`, `preview.html`, `preview.tsx` | Dev-only rehearsal: a classroom with a board, desk and easel; camera presets including side and back; captions; keyboard control; a reading view; a test hook |
| `studio/public/models/character/` | `kairo-teacher.glb`, `teacher-portrait.png`, `studio_small_09_1k.hdr`, `audio/*.mp3` with `*.visemes.json`, `CREDITS.txt` |
| `design/character/blender/` | `kairo_teacher.blend` and the scripts that rebuild it (`build_all.ps1` and its stages), plus the build gates `glb_inspect.py`, `hair_clearance.py`, `clip_check.py` and `validate_glb.mjs` |
| `design/character/textures`, `comparison`, `rig` | Textures, the base comparison, the face probe |
| `docs/character/` | `README.md` (integration guide, credits, limits), `verification.md`, `rig-selection.md`, `checks/` (unit tests, browser check, report), `screenshots/`, JSON evidence |
| `tools/character/` | Rhubarb Lip Sync 1.14.0 (MIT), and a separate `package.json` for glTF-Transform 4.5.1 (MIT) and gltf-validator (Apache-2.0) |
| `.claude/launch.json` | The `character-preview` entry (Vite on port 4183) |

## Interface (final)

Interface v1 is accepted with the revisions published earlier; `studio/src/character/types.ts` is the source of truth.

- **`cue`:** one of the following, each with an `id`:
  - `idle`, `listen`, `explain` or `acknowledge`;
  - `point` with a `targetId` and an optional `contact` of `'auto'` or `'never'`;
  - `move` with an `anchorId`. It returns `unsupported` with reason `locomotion-not-delivered`.
- **`targets`:** each has an `id`, a `position` and an optional `normal`, in the host canvas's world space. The host may move or rotate the parent group.
- **`audio`:** an `AudioInput` (`energy`, `playing`, `paused`, `time`, optional `visemes`), or a ref to one, so loudness never re-renders React. `visemes` use Rhubarb shapes A–H and X, and only real timings for the exact audio may be supplied.
- **Other props:**
  - `expression`: `neutral`, `encouraging`, `curious` or `focused`;
  - `reducedMotion`;
  - optional `lookAt` (`'camera'` or a position);
  - optional `url`.
- **Callbacks:**
  - `onReady({ assetId, rigVersion, capabilities })`;
  - `onCueState({ id, state, reason? })`.
- **Optional `instrument`:** measurements about four times a second, for rehearsal and tests only. It reports pointing, gaze, head, mouth, blink and springs. It gained `hands` (wrist and fingertip positions) in this round; the addition is backward compatible.
- **Rules:**
  - Every cue id gets one `accepted`, then at most one terminal event: `completed`, `interrupted` or `unsupported`. A cue that is interrupted reports that before the new cue is accepted.
  - A completed point does not change the board. The host performs its allowed action, then sends `acknowledge`.
  - Reduced motion gives static teaching states, with no sway, springs, saccades or glides.

## Assets and licences

- **Teacher:** credit "Rain Rig (CC) Blender Foundation | studio.blender.org", CC-BY 4.0; show it wherever the teacher appears. `CREDITS.txt` ships beside the GLB.
  - The teacher is modified for KAIRO: reshaped face and figure, recoloured skin and eyes, KAIRO-authored locs, clothing and clips.
  - The `.blend` keeps Rain's CloudRig rig UI text (GPL).
- **Other assets:**
  - HDRI: Poly Haven `studio_small_09`, CC0.
  - Voices: Google Cloud Text-to-Speech Chirp 3 HD output (AVATAR-001), synthetic.
  - Mouth timings: Rhubarb Lip Sync 1.14.0 (MIT).
- **C1 audit:** `2026-10-22-claude-asset-audit.md` listed missing provenance for the GLB, HDRI, audio and visemes. `docs/character/asset-manifest.json` now records the hash, licence and origin of each shipped and source file.

## Checks (actual results; details in `docs/character/verification.md`)

- **Asset:** `kairo-teacher.glb`, 3,424,844 bytes, SHA-256 `5C3AACB1CB7DF2A729AB763306420255EA37404D3B8CCD2B2602EA27B19EE6AF`. It has 77 joints, 31 face shapes, 30 hand correctives, 5 clips and 229,366 triangles.
- **Build gates:** the rebuild stops if any fails.
  - Structure: pass.
  - Hair clearance: 0 of 11,027 hanging-loc vertices and 0 of 872 face-framing vertices inside the clothes, body or head.
  - Elbow twist about its own axis: 4.3° at most, against a 10° limit.
  - Khronos validator: 0 errors.
- **Unit tests:** 15 of 15 pass, and the studio typecheck exits 0.
- **Browser check:** 38 of 38 pass in headless Edge on Intel UHD Graphics.
  - Pointing: contact pointing lands 1.3 cm from the target; ray pointing is 0° off.
  - Arms return to within 3 mm of the idle pose after pointing.
  - Mouth: jawOpen reaches 0.517 in phoneme-timed mode and closes to 0 on pause and stop.
  - Reduced motion: the head moves 0.00 mm.
  - Board: advances 0 → 2 through two allowed actions.
  - Layouts and fallbacks pass.
  - The console shows only the expected missing-model entries.
- **Performance:**
  - median frame rate: 25.5 fps idle in the classroom, 22.5 fps on the face camera while speaking, 23.9 fps after the lesson;
  - 67–82 draw calls;
  - about 459,000 triangles per frame, because the shadow pass draws her twice.

## User feedback addressed in the last round

- **Skin, face and glutes:** lighter skin; an inviting neutral face; more glute volume, now reviewable with the new side and back cameras.
- **Hair:**
  - no hair through the cheeks (gated);
  - a bare patch at the back of the head, now filled;
  - locs that zig-zagged and passed through the collar, now draping clean.
- **Clipping in the teaching run:**
  - procedural rotations piling up on constant clip tracks;
  - skin showing inside the collar;
  - arms folding and elbows turning the wrong way while explaining.

  All three are fixed, and each fix is measured in the build or browser check.

## Limits

- Hair clearance is checked in the bind pose only. At runtime the spring colliders keep the locs clear, but strong poses can still bring a loc near the shirt.
- Performance is measured on one laptop GPU only. Phones are not measured and would need a lighter level of detail.
- Voice start-up (4–7 s from click to audio over two runs) was measured only in headless Edge with muted audio. Most of it is AudioContext start and fetches.
- Lip sync is phoneme-timed only for the three pre-analysed samples.
- There is no walking: `move` is unsupported.
- The hands make teaching gestures, not SASL.

## Next steps

1. **Walking to the board** (the user asked for this):
   - an authored walk cycle with start, stop and turn steps;
   - the body moved at the stride's own speed, so planted feet don't slide;
   - a check that measures foot slide;
   - then `move` to anchors can be offered.
2. **Integration into `/teacher`** by the owners of `TeacherProvider` and the router, with review.
3. **Live-speech lip sync:** a server-side Rhubarb pass or a provider viseme stream. Prefetch audio and timings to cut start-up.
4. **Phones:** a lighter level of detail, lower pixel ratio and no shadows on low tiers, measured on a real phone.
5. **SASL:** signing must be authored and reviewed with Deaf users.
6. **Interaction layer** (the user's ideas):
   - gestures and board writing timed to the speech;
   - tap a board item to have her point and explain it;
   - she glances at what the learner hovers;
   - her voice positioned in space.

## Coordination notes

- The delegation proposal in bus messages 22 and 23 was not acted on from this session.
- The Tripo exploration began separately at the user's request (CHARACTER-003-TRIPO, `claude-tripo-20261022-a`). Its outputs are review candidates only and do not replace this teacher.
