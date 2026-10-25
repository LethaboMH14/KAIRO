# CLASSROOM-STAGE-001 and BRAND-MASTER-001 — checks actually run

23 October 2026 · Claude (`claude-classroom-20261023-a`, Opus 5.5, effort max). These are implementation checks only. They are not learner, device, audio, accessibility, Deaf-user or release acceptance.

## Automated (final code)

| Check | Result |
|---|---|
| `node --test tests/experience-stage.test.mjs` | **9/9 pass**. Covers:<br>• board anchors and spoiler-free numbers, and board-plane geometry<br>• the writing state machine (landed / timeout / reduced / interrupt)<br>• lesson-event direction (speech keeps the point)<br>• quality tiers: throttled frames and focus loss never lower the tier, while a real 10 fps device is reported; fov fitting<br>• the app mark matching the master files by SHA-256<br>• the badge patch pinned to the teacher GLB SHA-256<br>• the badge mesh: two rings, valid weights, true proportions |
| `npm test` (whole studio, includes the other owners' tests) | Final code: **261/262**. The failure is `narration-cancellation.test.mjs:130`, from another owner's active NARRATION-CANCEL-TESTS-001, against the untouched TeacherProvider; their own record shows the same failure. Earlier run: 249/249. |
| `npx tsc -b` | exit 0 (re-run after the last edit) |
| `npm run build` | **passed** on the final code (including the 001B cue-id fix), 2,240 modules. `ClassroomStage` is 23.60 kB (9.92 kB gzip) and `ExperienceClassroom` 24.97 kB (9.44 kB gzip). The existing R3F chunk warning remains. This is not a download or device budget. |
| Brand scripts | Fidelity, SVG round-trip and small-size topology in `design/brand-master-20261023/fit/*.json` and `master/geometry.json` |

## In-browser inspection

Done in the built-in browser pane against the Vite dev server on 127.0.0.1:4183.

The app window was often minimised, which stops the page drawing. Frames were therefore produced by stepping the page's own React Three Fiber loop at fixed 1/30 s steps and reading the drawing buffer with `readPixels`. No headless browser or CDP route was used. Captures are in [`qa/`](qa/):

| File | Shows |
|---|---|
| `07-final-room-badge-mesh.jpg` | **Final** room framing: shelf, Rain and board all in frame; the record strip and first line; the opaque chalk badge (Rain is mid-blink) |
| `08-final-stuck-neutral-badge.jpg`, `09-final-badge-crop-x4.png` | **Final** "I'm stuck": calm neutral face with an acknowledging nod toward the learner, the line ringed, the smaller step in the caption; the badge enlarged ×4 with its gaps intact |
| `02-step2-written-board-framing.jpg` | "Next step": the line written, the previous line dimmed, the copper highlight, the board framing |
| `03-explain-12-contact-point.jpg` | "Explain 12": Rain turns, looks and touches the 12 inside `20 + 12 = 32`; ringed and explained in the caption |
| `04-explain-22-shelf-ray-point.jpg` | "Explain 22": ray-point to the notebook shelf, "Shelf count 22" ringed (earlier room framing) |
| `01-…`, `05-…`, `06-…` | History: the earlier textured badge, the earlier wide grin for "stuck", and the debug view that proved the badge placement before the switch to an opaque mesh |

Also observed:
- Full tier on this laptop, the badge mesh at 160 vertices and 156 triangles bound to the shirt skeleton, about 45 draw calls and 230k triangles, and no console errors.
- Two real bugs were found and fixed here: throttled background frames caused a false Full → Light downgrade, and the textured badge disappeared after reloads.

## Pending

- Real audio with Rain's mouth and the writing sequence at normal frame rates.
- Phones and tablets, a screen reader, keyboard-only use at 200% zoom, and named low-end GPUs.
- Frame-time evidence for the tier thresholds.
- User acceptance of the brand master.
