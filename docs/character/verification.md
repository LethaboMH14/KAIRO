# CHARACTER-002 verification

Results from 22 October 2026, after the final rebuild (build 6). Every number below comes from a file in this folder or a command listed here; nothing is estimated.

## Machine and tools

- **Machine:** Windows 11 laptop with an Intel Core i5-1235U, Intel UHD Graphics and 7.7 GB of RAM.
- **Browser:** headless Microsoft Edge driven over the DevTools protocol, using the real GPU (ANGLE on Direct3D 11) at 1440 × 900 and device pixel ratio 1. Audio is muted, but playback timing is real.
- **Load:** the machine used about 4.5% of its CPU before the browser run.
- **Tools:** Node 24, Blender 4.5.14, glTF-Transform 4.5.1 and the Khronos glTF-Validator 2.0.0-dev.3.10.

## Shipped asset

| | |
|---|---|
| File | `studio/public/models/character/kairo-teacher.glb` |
| Size | 3,424,844 bytes (meshopt geometry, WebP colour maps) |
| SHA-256 | `5C3AACB1CB7DF2A729AB763306420255EA37404D3B8CCD2B2602EA27B19EE6AF` |
| Rig | 77 joints, 31 face shapes, 30 hand correctives, 5 clips (`rig-map.json`, `morph-map.json`) |
| Geometry | 229,366 triangles: head 50,540, body 41,964, updo locs 28,410, trousers 23,356, shirt 22,230, hanging locs 18,618 |
| Provenance | `asset-manifest.json` (hash, licence and origin of every shipped and source file) and `studio/public/models/character/CREDITS.txt` |

## Build gates

`design/character/blender/build_all.ps1` stops before deploying unless every gate passes.

| Gate | What it checks | Result |
|---|---|---|
| `glb_inspect.py` (raw and final GLB) | Structure: every textured primitive has the UVs its material samples, no stray actions, morph and joint counts | Pass (`glb-structure.json`) |
| `hair_clearance.py` | In the bind pose, no hanging-loc vertex is inside the shirt or body, and no face-framing loc vertex is inside the head, shirt or body | Hanging locs: 0 of 11,027 vertices inside (build 3 had 259 inside the shirt). Face-framing locs: 0 of 872 inside (`hair-clearance.json`) |
| `clip_check.py` | No elbow or knee twists more than 10° about its own axis in any clip; it also records each joint's travel | Explain 4.3° (was 147°), Acknowledge 2.2° (was 16.7°), Idle 0.7°, Listen 2.5° (`clip-check.json`) |
| Khronos glTF-Validator | Specification conformance | 0 errors on both the raw and the final GLB. The 21 warnings are 18 × `NODE_SKINNED_MESH_NON_ROOT` (skinned meshes sit under the armature node; three.js ignores that parent transform, as the specification requires) and 3 × generated tangent space on the normal-mapped hair. Infos: 17 unused texture coordinates; on the final GLB, also 1 extension the validator does not know (meshopt) (`validator-raw.json`, `validator-final.json`) |

## Unit tests

`node --test "docs/character/checks/*.test.mjs"`: **15 of 15 pass.** They cover:
- two-bone IK reach, overshoot and pole side;
- twist extraction;
- the cue ledger (one acceptance and one terminal event per id, and interruption);
- viseme lookup and cross-fade, the amplitude fallback, and blink timing;
- the spring chain settling without drift;
- the deployed GLB's bones, face, viseme and corrective shapes, clips and UVs;
- the shipped viseme timings.

The studio typecheck (`tsc -p studio --noEmit`) exits 0.

## Browser check

`node docs/character/checks/browser-check.mjs`: **38 of 38 pass** (`checks/browser-report.json`, screenshots in `screenshots/`). The console shows only the two entries the deliberate missing-model scenario produces: the 404 and the load error that triggers the reading view.

| Area | Measured |
|---|---|
| Pointing, contact | The fingertip completes 1.3 cm from the formula and answer targets |
| Pointing, ray | The learner's tablet and the poster both complete at 0.0° from the ray |
| Return after pointing | Wrists and fingertips are back within 1–3 mm of their idle pose |
| Interruption | The first cue gets exactly one terminal event (`interrupted`); the replacing cue completes once; no id got two terminal events or two acceptances |
| Unsupported requests | `move` returns `locomotion-not-delivered`; a missing target returns `target-not-found` |
| Phoneme-timed mouth | jawOpen reaches 0.517, with 5 distinct mouth shapes shown while the sample plays |
| Pause and stop | jawOpen 0, measured on the character's own clock after each click |
| Amplitude-only mode | The jaw opens with loudness and the caption says so |
| Lesson | Runs to the end; the board advances 0 → 2 through exactly two allowed actions, each after a completed point |
| Reduced motion | Follows the system setting; the head moves 0.00 mm over 2.17 s of character time with springs off; pointing reaches a static state in 206 ms |
| Keyboard | Key 2 issues listen, F points at the formula, M switches to the reading view |
| Layouts | Phone 390 px, tablet 820 px and 1920 px all load with no horizontal page scroll |
| Fallbacks | Without WebGL, and with a missing model, the reading view appears with an explanation |

### Performance (Intel UHD Graphics)

| Scenario | Median fps (three 2 s windows) | Median frame | 95th percentile | Draw calls | Triangles per frame |
|---|---|---|---|---|---|
| Classroom, idle | 25.5 (26.4, 17.0, 25.5) | 33.6 ms | 50.5 ms | 82 | 459,508 |
| Face camera, speaking | 22.5 (20.4, 22.6, 22.5) | 49.8 ms | 50.5 ms | 67 | 459,122 |
| Classroom, after the lesson | 23.9 (23.9, 24.7, 22.8) | 33.7 ms | 51.0 ms | 81 | 459,498 |

About 459,000 triangles are drawn per frame because the shadow pass draws the 229,366-triangle teacher a second time. The GLB transferred 3,425,144 bytes in 1.19 s from the local test server.

### Voice start-up

From the Play click until the audio element's clock passed 0.25 s took 3,992 ms in this run (6,671 ms in the previous one). That is in headless Edge with muted audio. A probe of the same flow broke the time down:
- creating and resuming the AudioContext: about 1.6 s;
- fetching the viseme timings: about 1.3 s;
- fetching the MP3: about 2 s.

The probe ran on a busy headless renderer. Start-up was not measured in a normal browser with a real audio device. Fetching the timings and audio when a voice is chosen would remove the network part.

## What this round fixed, and how it was verified

| Problem | Cause | Evidence after the fix |
|---|---|---|
| Head drifted up to 56 mm in reduced motion | three.js only rewrites a bone when its animated value changes, so frozen and constant tracks kept each frame's gaze, IK and spring rotations | Every frame now restores the clip pose first. Head moves 0.00 mm; arms return within 3 mm |
| Bare scalp at the back of the head | The updo locs only covered the front and sides | A half-up back section rises into the bun from a parting behind the ears; side and back screenshots (`c02-camera-side.png`, `c02-camera-back.png`) |
| Hanging locs zig-zagged and went through the collar | A body ray that missed beside the neck pushed locs out; a sideways step where the locs left the head; too little clearance for the fold-down collar | The locs drape smoothly with 5 cm clearance; `hair_clearance.py` reports 0 inside |
| Skin showed inside the collar on top of each shoulder | The neckline was cut below the shoulder ridge | The neckline was raised 3 cm at the back and sides; three-quarter and listen screenshots |
| Arms folded across the body and the elbows turned the wrong way while explaining | Beat keys stacked a second full arm pose on the first (elbow twist 147°); the outward forearm swing was authored at the elbow | Beats now replace the pose and the swing comes from the shoulder; `clip_check.py` measures 4.3° |
| Console `removeChild` exception | The loading badge used a second React root inside the canvas | The badge is now a page overlay; no exception in the report |
| Board actions missing from the test probe | Only the on-screen log recorded them | Actions logged under id `board`; the check counts 2 |
| Side camera looked through the board | The board moved within reach in an earlier round | Side view moved 30° behind her right profile; new back view added |

## Limits

- **Hair clearance:** checked in the bind pose only. At runtime, spring colliders keep the locs out of the neck, back, shoulders and cheeks, but strong poses can still bring a loc close to the shirt.
- **Performance:** measured on one laptop GPU in headless Edge. Phones are not measured; the teacher would need a lighter level of detail there.
- **Voice start-up:** measured only headless with muted audio.
- **Lip sync:** phoneme-timed only for the three pre-analysed samples; live speech falls back to loudness unless real timings are supplied.
- **Walking:** none. `move` stays unsupported rather than offering a sliding walk.
- **Hands:** teaching gestures only, not SASL.
