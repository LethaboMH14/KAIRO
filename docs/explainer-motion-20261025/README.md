# Fast, source-grounded explainer clips

**Status: local engineering prototype and research only.** This evaluates short deterministic explanatory clips, not a KAIRO playback feature or production architecture. The lesson claim source is the existing [`motor.json`](../../studio/src/studio-teaching-host/packs/motor.json) pack. This clip contains no teacher/avatar, voice, provider request, imported figure, or purported measured machine state.

## Decision

Use structured scene data whose claims point to source IDs, then render deterministic frames from that data and encode locally. For the first proof, Python + Pillow + the already installed `imageio-ffmpeg` binary produced MP4 quickly, reproducibly, without a browser, headless renderer, install, cloud call, GPU or model. Keep captions, source labels and editable timing in the storyboard. FFmpeg should be treated as a codec/encoding layer with per-build licensing and codec review.

For future in-app interactive 3D, stay with the existing React/Three.js/R3F runtime and connect its selected, source-reviewed context to the shared teacher service. For a polished reusable React video authoring system, evaluate Remotion separately, but its common server render uses browser infrastructure and its product is source-available under a conditional license; it is outside this proof. Motion Canvas is a promising TypeScript presentation/timeline tool but exports rendered frames and ordinarily depends on browser canvas. Manim is a strong Python choice for precise equation-led lecture animations; Blender is for geometry/asset shots that genuinely benefit from 3D. Neither needs to replace the app runtime for a two-dimensional explanatory insert.

Generative video is not the authority for equations, variable-dependent outcomes, or citations. Official Veo documentation describes model-generated 4–8 second shots, 24 fps, native audio, watermarking and request latency from 11 seconds up to 6 minutes. Current posted per-second API rates imply about $0.40, $0.80, or $3.20 for an 8-second 720p request on Lite, Fast, or Standard respectively, before retries; those are estimates derived from the posted rates, not a quote or authorization to spend. A generated shot might later supply reviewed atmosphere, while deterministic source-linked overlays remain authoritative.

One specific local-video candidate is Wan2.2 TI2V-5B. Its model card states Apache-2.0 for the weights, 720p/24 fps, and says the single-GPU example needs at least 24 GB VRAM (e.g. RTX 4090). It claims five seconds at 720p can take under nine minutes on one consumer GPU without specific optimization. That is the publisher's claim, not a KAIRO benchmark, and does not justify “instant” video. No weights were downloaded or run. Mercury is a diffusion language model for text, not a video generator. A text model such as Gemini with structured JSON output could draft storyboard records for a deterministic renderer, but source-ID and citation checks plus human content review would still be required. No model calls were made.

## Comparison

| Option | Authoring language and typical render path | Speed evidence / cost | License and hardware | Source citations, captions, controls | Fit here |
|---|---|---|---|---|---|
| Python + Pillow + FFmpeg (proof) | Python frames → local FFmpeg H.264 | Measured here: 8-second clip, 720×404, 12 fps, 96 decoded frames; render wall time recorded per variant. No external service cost. | Existing Python packages; no new install. FFmpeg build flags and codecs need review. FFmpeg project license is LGPL by default, but optional GPL parts can change obligations; H.264 patent questions also vary. | Storyboard supplies citations/caption text per scene. Deterministic 2D scene state; controls are rendered output only. | Best low-risk proof for fixed explanations and reviewable claims. |
| Remotion | React + JavaScript/TypeScript; common renderer bundles React and renders via browser infrastructure, then encodes | No local benchmark in this task. Docs provide CLI and SSR APIs, not a guaranteed latency. Local compute plus possible license cost. | Remotion says source-available/proprietary license; free eligibility depends on person/org size and use. Browser/Chromium runtime required for common SSR. No GPU requirement claimed. | React components can display source IDs/captions and can take JSON props. Interactive preview is separate from generated MP4. | Strong template reuse if the team accepts browser renderer, licensing review and measured render cost; excluded from native proof. |
| Three.js / React Three Fiber | JavaScript/TypeScript; WebGL scene in a browser; R3F wraps Three.js in React | Interactive display is frame-loop driven; not a measured video-export latency here. GPU usually useful for complex 3D; no cost for library itself. | Three.js MIT; assess all bundled assets separately. Browser graphics stack and compatible WebGL device. | Custom text overlays and UI are straightforward; user input and scene state are first-class. Citation links still need explicit source contracts. | Best for live studio objects and controls, not the shortest path for a fixed clip. |
| Manim Community Edition | Python scenes; Cairo or OpenGL rendering, FFmpeg video output | Official docs list low-quality preview at 854×480/15 fps and MP4/PNG-sequence output. No measured render time here; avoid assuming preview quality equals final speed. | Community Edition is distinct from legacy 3b1b Manim; Community Edition code is MIT. Python dependencies, Cairo/Pango/LaTeX needs depend on scene. GPU optional for Cairo, relevant to OpenGL. | Strong formula/text choreography. Citations/captions can be authored in scene; no automatic grounding or controls. | Good candidate for math-heavy teacher-authored segments, after small dependency/render trial. |
| Motion Canvas | TypeScript generators and 2D canvas scenes; renders a frame sequence and can hand frames to FFmpeg | Docs expose frame rate/range/resolution settings and frame-sequence output. No local benchmark; browser canvas and encode work determine wall time. | Main repository MIT; exporters and each dependency should be checked. Browser canvas rendering in normal workflow. GPU not required for simple 2D. | Captions/citation labels can be authored with scenes, but source validation remains application code. Timeline controls suit presentation sequences, not learner interaction by themselves. | Promising after an allowed rendering path and local benchmark are established; not used here. |
| FFmpeg directly | CLI/filter graphs and media codecs; not a scene authoring language | Fast at media transforms/encoding, but no project-specific render latency claim here. Local CPU or selected hardware codecs. | LGPL 2.1+ by default; GPL optional components can change license; codecs such as H.264 have separate legal/patent considerations. | Filters can burn subtitles/text, but no semantic source citation model or interactive scene controls. | Use as encoder/transform tool behind a structured storyboard, not the educational authoring format. |
| Blender | Python API + node/scene graph; Cycles/Eevee render then FFmpeg or image sequence | Powerful 3D scene pipeline, but no render-time benchmark here; scene complexity, samples and hardware dominate. | Blender GPL; assets, HDRIs, fonts, add-ons and exports need their own licenses. GPU may help but is not mandatory. | Can render text/source slates; citations must be attached by our content model. Generated clip is not interactive. | Use for authored 3D shots where approved geometry/materials matter, not text-and-formula clips. |
| Hosted generative video (example: Veo) | Prompt/image/video API; asynchronous operation polling | Official Veo docs: 11 seconds minimum to 6 minutes maximum request latency (peak-hours statement); durations 4/6/8 sec at 24 fps. Posted API per-second prices produce estimates above. | Service terms, region, retention and data-use terms matter. Output has SynthID watermark; generated video kept two days per current docs. No GPU procurement locally. | Prompts do not provide reliable exact citations, scientific arithmetic, captions or user controls. Overlays/verification still needed. | Exclude for claims and avoid paid calls. At most reviewed background footage after separate approval. |
| Local video diffusion (Wan2.2 TI2V-5B example) | Python pipeline + model weights; iterative denoising | Model publisher claims five seconds at 720p in under nine minutes; their single-GPU example needs ≥24 GB VRAM. Not measured here. | Model card says Apache-2.0 for weights; pipeline/dependency/assets still need review. No weights fetched or GPU used. | Generated content does not provide dependable citations, formulas, captions or deterministic controls; add verified overlays. | Too slow and hardware-bound for instant clip claims; candidate only for reviewed visual footage. |
| Fast text model as storyboard planner (Mercury / Gemini Flash) | Hosted text API proposes structured scene JSON; local deterministic renderer draws/encodes it | No planner latency/cost measured. Text generation is distinct from video rendering. | API privacy, retention, terms and price require review. No calls made. | Could suggest scene text, but must only use supplied source IDs, pass schema/citation validation and receive human content review. No rendered frames or interactive controls. | Possible authoring aid behind source and timing checks; Mercury itself is not a video model. |

“Java” and “JavaScript” are different languages. None of the short-list pipelines above is a Java media framework: React/Remotion, Three.js/R3F and Motion Canvas use JavaScript/TypeScript; Manim and Blender scripting use Python; FFmpeg is a native multimedia tool. Java would require a separately scoped media library such as JavaCV/JavaFX and has no demonstrated advantage in this comparison.

## Prototype and evidence

The local prototype renders two deterministic MP4s from `tools/explainer-motion-lab/storyboard.json`:

- silent, with visual lesson labels and no sentence-caption band;
- silent with burned-in sentence captions.

Both are 8 seconds, 720×404, 12 fps, 96 decoded frames and zero audio streams. Encoder wall times, hashes, file sizes and PyAV stream/decode checks are recorded in `tools/explainer-motion-lab/out/render-evidence.json`; file provenance and the FFmpeg build limitation are in `tools/explainer-motion-lab/out/asset-manifest.json`. The bundled imageio FFmpeg executable was used. A standalone `ffprobe` executable was absent, so stream metadata and decoded frame count were independently inspected with PyAV; this does **not** constitute FFprobe output. The captioned MP4 has burned-in text and a separate `.vtt` track; both variants are silent and include no KAIRO voice. A representative closing QA frame is `tools/explainer-motion-lab/out/preview.png`. The prototype is not a judged user test, device acceptance, learning-efficacy result, video-player integration, or proof of faster-than-human lesson authoring.

The animation uses a simple drawn stator/rotor/field diagram, not an equipment model. It states 1,500 r/min as calculated synchronous field speed for 50 Hz and four total poles. It does not label that value as rotor speed or show any measured shaft result. The drawing is conceptual only, with no simulation, measurement, or physics validation. There is no KAIRO teacher/avatar and no KAIRO voice. Each scene carries the relevant abbreviated source citation on-screen; the storyboard and source manifest contain exact locators and URLs. Source text and figures are not copied. The motor pack itself says those sources' reuse licenses are unconfirmed.

## Reproduction

No package installation is needed in the current workspace. With Python 3.11+, Pillow, PyAV and `imageio-ffmpeg` already present:

```powershell
cd tools/explainer-motion-lab
python -m unittest -v test_storyboard.py
python render_clip.py
```

Both storyboard validation and encoding are local. The renderer does not start a browser, open a preview, call a provider or use a GPU. Output dimensions must be even for the bundled libx264 output path. The binary's exact build options were not audited, so do not distribute this binary or claim codec-license clearance based on this proof.

## Criteria and open checks

Product/Intelligence: a source-linked fixed explanation with a clear calculated quantity boundary. Usability/Presentation: captioned alternative and measured file metadata. Creativity: motion illustrates the actual field-speed idea rather than adding an avatar. Sustainability: deterministic authoring and bounded local dependencies; reusable authoring pipeline not production-integrated. Impact and learning outcomes remain unvalidated. Next gates: human review of the electrical explanation and caption readability, actual keyboard/mobile playback, exact ffprobe run if a tool becomes available, source/reuse rights review, and a separately authorized in-app integration decision.

## Primary references (checked 25 October 2026)

- Remotion rendering and browser SSR: https://www.remotion.dev/docs/render and https://www.remotion.dev/docs/renderer
- Remotion current licensing terms: https://www.remotion.dev/docs/license/pricing and https://www.remotion.dev/docs/license/faq
- Three.js renderer: https://threejs.org/docs/pages/WebGLRenderer
- React Three Fiber first scene: https://r3f.docs.pmnd.rs/getting-started/your-first-scene
- Manim Community output settings: https://docs.manim.community/en/stable/tutorials/output_and_config.html
- Manim Community license and distinction from the original: https://docs.manim.community/en/stable/ and https://github.com/ManimCommunity/manim
- Motion Canvas rendering: https://motioncanvas.io/docs/rendering/ and https://motioncanvas.io/docs/rendering/video/
- Motion Canvas repository license: https://github.com/motion-canvas/motion-canvas
- FFmpeg legal/licensing and codec caution: https://ffmpeg.org/legal.html
- ffprobe output and stream inspection: https://ffmpeg.org/ffprobe.html
- Blender GPL terms and output encoding/rendering: https://www.blender.org/about/license/ and https://docs.blender.org/manual/en/5.0/render/output/properties/output.html
- Diffusers model memory: https://huggingface.co/docs/diffusers/optimization/memory
- Wan2.2 TI2V-5B model card and vendor speed/VRAM/license statements: https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B
- Mercury diffusion language model: https://www.inceptionlabs.ai/blog/introducing-mercury
- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- Gemini API video overview and Veo latency/specifications: https://ai.google.dev/gemini-api/docs/video and https://ai.google.dev/gemini-api/docs/veo
- Gemini API video pricing: https://ai.google.dev/gemini-api/docs/pricing
