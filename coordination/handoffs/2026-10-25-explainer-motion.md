# Fast source-grounded explainer motion handoff

## Ownership and branch

Session ID: `codex-luna-explainer-motion-20261025-b`; client Codex; model and effort were not exposed and are registered as `unknown`. Scope: only `tools/explainer-motion-lab/`, `docs/explainer-motion-20261025/`, and this handoff. Isolated branch: `codex/explainer-motion-lab-20261025`, based on main `1997ba9f046f6d4122169cb26a72e89cc60befd1`. No app/runtime/router/provider/manifests were edited.

## Need and judging criteria

Need: learners should get a short clear explanation tied to the exact motor lesson source and see what a value does and does not mean. This work targets Product/Intelligence (source-grounded, bounded claim), Usability/Presentation (short visual/caption variants with citations) and Creativity (show the rotating field concept directly). Sustainability remains exploratory. It is not validated as a learning intervention, production renderer, or in-app feature.

## Research and decision

The decision matrix compares Remotion, Three.js/R3F, Manim Community, Motion Canvas, direct FFmpeg, Blender, hosted generated video and local diffusion across authoring language, render path, latency evidence, cost/license, GPU needs, citation/caption support and controls. It explicitly distinguishes Java from JavaScript: the reviewed web tools use JS/TS, Manim/Blender use Python, FFmpeg is a native CLI; no Java stack was tested.

Prototype direction: structured source-referenced scene data + deterministic local Pillow frames + existing `imageio-ffmpeg` encoder for short 2D explanation segments. Keep interactive 3D in the existing app. Generative video and diffusion remain out for exact claims/citations, unpredictable output and unmeasured cost/runtime. Current Veo docs list 11-second-to-six-minute request latency and per-second pricing. Wan2.2 TI2V-5B's card states Apache-2.0 for weights and claims five seconds at 720p in under nine minutes, with a single-GPU example needing at least 24 GB VRAM. Treat that as a vendor claim, not a local/KAIRO benchmark. Mercury is a diffusion language model for text, not video; Gemini structured output can only suggest scene JSON for separate deterministic rendering. No model was called or downloaded.

## Files and interfaces

- `tools/explainer-motion-lab/storyboard.json`: four 2-second scenes, pinned existing pack ID/source URLs/locators, visible per-scene citation labels, caption strings, total duration/fps/resolution and explicit 1,500 r/min claim boundary.
- `tools/explainer-motion-lab/validate_storyboard.py`: checks bounded duration/fps, source IDs/HTTPS/locators, contiguous timing, captions, visible source refs and claim/audio constraints.
- `tools/explainer-motion-lab/test_storyboard.py`: malformed timing, citations, duplicate IDs, duration and audio tests plus the real storyboard.
- `tools/explainer-motion-lab/render_clip.py`: deterministic Pillow frame drawing, silent FFmpeg MP4 encode, VTT emission, PyAV decode inspection, hashes and bounded output asset manifest.
- `tools/explainer-motion-lab/out/`: two reviewed prototype MP4 variants, `.vtt`, render evidence, source/asset manifest and one closing caption/citation QA still (`preview.png`).
- `docs/explainer-motion-20261025/README.md`: decision, comparison matrix, primary citations, limits and reproduction.

The figure `1,500 r/min` is only synchronous field speed calculated from 50 Hz and four total poles. The clip never calls it shaft speed or shows a measured rotor result. The drawn rotor/field is conceptual; there is no simulation, measurement, or physics validation. There is no KAIRO teacher/avatar or KAIRO voice. Each scene shows a short NPTEL citation; the exact URL, locator and pack's unconfirmed-reuse-license note remain in storyboard metadata. No source figures or wording are reproduced. No provider/model/browser/GPU was used.

## Actual evidence

- `python -m unittest -v test_storyboard.py`: 5/5 passed.
- `python render_clip.py`: success on the final source-cited layout.
- Silent MP4: 720×404, 12 fps, 8.0 seconds, 96/96 decoded frames, no audio streams, 64,057 bytes; SHA-256 `a86cb82a317987a7322037667ea3e1590b2613923968760ab8f586086f905f30`; frame+encode wall time 22.346 seconds.
- Captioned MP4: 720×404, 12 fps, 8.0 seconds, 96/96 decoded frames, no audio streams, 79,179 bytes; SHA-256 `f657f0e72df61aaec332fc1227653fac5d309e9204c828ab2f2a2c2b4518cf47`; frame+encode wall time 14.178 seconds.
- A separate WebVTT track and the scene-by-scene source registry are emitted. Visual QA inspected the closing caption/citation layout in `tools/explainer-motion-lab/out/preview.png`, a locally decoded frame, not a browser.
- The standalone FFmpeg/ffprobe commands and Blender/Manim commands were absent. The local Python install supplied Pillow, PyAV and an `imageio-ffmpeg` bundled binary (`ffmpeg-win-x86_64-v7.1.exe`). Stream properties/frame decoding were checked through PyAV. This is explicitly **not FFprobe evidence**. The bundled binary's configure flags and H.264 distribution/compliance status were not audited; do not claim codec clearance or redistribute based on this work.
- No independent source/content/electrical engineering expert, learner, keyboard/mobile device, hosted generation or runtime integration was tested. Render timings are measurements for this one local run, not an authoring or latency guarantee.

## Root next steps

Review the clip and claim/citation mapping. Root owns any production architecture, mounting/player contracts or app integration. Before integration: source/rights review, human domain/caption check, keyboard/mobile playback, exact FFprobe verification if available, and independent repeatability/runtime benchmark. Do not treat this artifact as user/learning acceptance or a production claim.
