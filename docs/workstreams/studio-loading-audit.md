# Studio 3D loading and public asset budget audit

Audit observation: 2026-10-22 09:32:22 UTC. Scope is source and public file metadata only. I inspected route/lazy-load code and statted eight specifically identified files under `studio/public/models`; no model or private data was opened. No browser, build, asset conversion or runtime change was performed.

## Build identity boundary

The latest successful aggregate checkpoint available at audit time is the 08:09:11.034 UTC record in `docs/continuity/heartbeat-0809.json`: 177 tests passed, Vite build exited 0, and `studio/dist/index.html` SHA-256 was `fa4302857d6ce66cbd20fca39ca044c58f282c947b0a101004d0c1377c36cc57`. That record explicitly says `currentBuildConfirmed: false`. The root's newer aggregate build is pending, so this is a historical reference identity only; it does not identify or close the current working tree. Current source paths below were inspected at the audit observation time. Add the next build/index hash only from root's completed aggregate record.

## Route-to-asset map

Sizes are exact filesystem byte lengths from `Get-Item`, not compressed HTTP transfer sizes. A route entry means its source mounts the referenced loader when that 3D component is mounted; it is not a network trace or a claim that every learner necessarily fetches the asset.

| Route / studio | Loading path | Public 3D asset(s) | Bytes | Configured rendering / fallback |
|---|---|---|---:|---|
| `/` Computer Science | `StudioRouter` statically imports `App`; `App` lazy-loads `Scene`; `Scene.Teacher` calls `useGLTF` when mounted | `studio/public/models/RobotExpressive.glb` | 463,988 | Canvas shadows; DPR 1–1.5; antialias; continuous loop except reduced-motion demand loop. Suspense loader and `SceneBoundary` diagram alternative. |
| `/lecture` | Router lazy-loads `LectureStudio`; it lazy-loads `LectureScene` | `studio/public/models/classroom/classroom.glb` | 15,346,684 | DPR 1–1.5; antialias; continuous loop except reduced-motion demand loop. Canvas has no `shadows` prop; meshes opt out of casting and mark receive-shadow, while the two lights do not set `castShadow`. Suspense label and `RoomBoundary` reading alternative. |
| `/learn` | Router lazy-loads `LessonWorkspace`; lesson's `Room` lazy-loads the same `LectureScene` | Same classroom file (shared route asset) | 15,346,684 | Same LectureScene configuration and reading alternative as `/lecture`. |
| `/engineering` | Router lazy-loads `EngineeringStudio`; its `MotorScene` is separately lazy and is mounted when 3D view is selected | `studio/public/models/engineering/induction-motor.glb` (4,213,408); `studio/public/models/engineering/poly_haven_studio_1k.hdr` (1,682,195) | 5,895,603 combined | DPR range 1–1.5 initially, with `PerformanceMonitor` lowering the cap to 1 on decline; shadows; demand loop. Model errors switch to the 2D drawing; the environment has a generated-lightformers fallback. A separate “Unpacking the motor…” overlay is shown while not ready. |
| `/teacher` | Router lazy-loads `TeacherSettings`; it lazy-loads `AvatarStage`; `TeacherAvatar` calls `useGLTF` | `studio/public/models/teacher/teacher.glb` | 11,262,664 | DPR 1–1.5; shadows; directional shadow map 1024×1024 and one-frame contact shadows. Loading label and 2D board/teacher controls remain available on failure. |
| `/practice` | Router lazy-loads `PracticeStudio`; it lazy-loads `ShopScene` when spatial view is selected | No external model file referenced; scene geometry/textures are authored in code | 0 external model bytes | DPR 1–1.5; shadows; demand loop; antialias. Suspense/loading copy and evidence-button/desk fallback. |

Source anchors: `studio/src/studiorouter.tsx:2-29`, `studio/src/App.tsx:5, 135`, `studio/src/Scene.tsx:70, 135`, `studio/src/lecture/LectureStudio.tsx:4, 38`, `studio/src/lecture/LectureScene.tsx:8, 68`, `studio/src/workspace/LessonWorkspace.tsx:13`, `studio/src/engineering/EngineeringStudio.tsx:14, 351-364`, `studio/src/engineering/MotorScene.tsx:156-160, 173, 505-525`, `studio/src/engineering/motorModel.ts:5-6`, `studio/src/teacher/TeacherSettings.tsx:8, 14`, `studio/src/avatar/AvatarStage.tsx:10, 21`, `studio/src/avatar/TeacherAvatar.tsx:10`, `studio/src/practice/PracticeStudio.tsx:9, 39`, and `studio/src/practice/ShopScene.tsx:25`.

`/teacher` uses the existing `studio/src/avatar/TeacherAvatar.tsx` model path. The isolated `studio/src/character` rehearsal preview refers to separate `studio/public/models/character/*` assets, but no `/character` route is registered in `StudioRouter`. Those active character-workstream assets are provisional and excluded from the measured route budget; they were not edited.

The motor's imported sidecar `studio/src/engineering/motorGeometry.json` declares 33 meshes and 188,573 triangles. That is source metadata, not a runtime performance measurement or a fresh validation that the model file matches the sidecar.

## Static findings and bounded proposals

1. **Keep route-owned model bytes behind the existing scene boundaries.** The classroom is 15.35 MB, the teacher rig 11.26 MB, and the motor plus HDR 5.90 MB as stored. The existing nested lazy imports and 2D/read-only alternatives are useful boundaries. Preserve them; no evidence here says their first-screen request timing is correct in every browser.
2. **Profile the emitted JavaScript before reshaping chunks.** `StudioRouter` statically imports the Computer Science `App`, while `App` already lazy-loads `Scene`; the model and scene module are therefore behind their own lazy boundary. Consider making the root `App` lazy behind the root-path branch to keep its page-specific UI code out of the common entry, then compare emitted route chunks and verify direct navigation to every route. The last successful aggregate also reported a minified lazy `OrbitControls` chunk over 500 kB; its current status must be rechecked against the next build identity.
3. **Try offline model variants behind parity gates.** The classroom and teacher GLBs are the largest routed models; compare candidate GLB compression/LOD variants and the engineering HDR at lower resolutions using byte reports, then validate animations, material appearance, cutaway/explode interactions, attribution and supported browser decoding before any replacement. No asset was converted in this audit.
4. **Make budgets reproducible.** Add a source-controlled route-to-asset inventory and a build-time public-file-size report, with explicit thresholds approved after baseline. A later browser pass can record first-request timing, transfer size, decode time, GPU/device class and fallback behavior. None of those runtime metrics can be inferred from file length or DPR settings.

No FPS, startup time, memory use, network transfer, mobile capability, or user-perceived performance conclusion is made here. The byte values are raw filesystem lengths only.
