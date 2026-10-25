# Fast cited explanations: implementation and next architecture

Research date: 25 October 2026. Primary documentation and reference pages were read; no browser observation or video-playback inspection was performed. Reference selection is a design comparison, not a claim of an objectively highest-rated video.

## What code-to-video actually does

A coding assistant can write scene scripts, React/TypeScript compositions, SVG/Canvas motion, Python/Manim or Blender scripts. The renderer makes frames; FFmpeg encodes them. JavaScript/TypeScript and Java are different languages: KAIRO already uses React, TypeScript and Three.js, so Java is not necessary for this workflow. Arbitrary model-generated code must not run in the learner app or rendering service. Accept validated storyboard data that selects reviewed templates instead.

The live app's existing Flash-family lesson model can supply structured planning; a fast text diffusion model such as Mercury is another candidate planner, not a video model or a measured KAIRO speed improvement. Provider availability, price, consent and latency must be tested through the server gateway before enabling a new model. No Mercury call was made. [Mercury paper](https://arxiv.org/abs/2506.17298), [Gemini Flash-Lite model card](https://deepmind.google/models/model-cards/gemini-3-5-flash-lite/).

## Three output lanes

| Lane | Use | Actual status / limit |
| --- | --- | --- |
| Cited animated reading | Any reviewed lesson with bounded exact excerpts; pause, next, reading-only and shared narrator | React component implemented and root mounting; no video-generation request, no claim of semantic visual understanding |
| Prepared native teaching clip | A reusable motor relationship or other approved diagram with known equations | Real silent captioned 8-second motor MP4 rendered and inspected: 720×404, 12fps, 96 decoded frames; measured render14.178s, 79,179 bytes. No KAIRO voice/avatar, measured shaft speed or validated physical simulation |
| Generated footage | Optional illustrative scenes/cinematic ad or a scene that genuinely benefits from visual generation | Research only; not in the default lesson-response path, no paid generation or large weights downloaded |

An inference: deterministic templates are the better initial default for checkable equations and editable text. They let the system validate numbers and citations rather than hoping those survive image/video synthesis. This is an engineering decision, not evidence of improved learning outcomes.

## Tools and fit

- **React + SVG/Canvas + Three.js/R3F:** reuse current UI and 3D models for interactive explanations. Parameter changes update deterministic scenes. Readable alternatives remain required. [Three.js examples](https://threejs.org/examples/).
- **Remotion:** React frame-based compositions, embedded Player and MP4 rendering. Useful for product/deck videos and template exports. Rendering/licensing/infrastructure are separate concerns; do not assume an automated SaaS video feature is free because a coding subscription exists. No Remotion browser render was executed under the standing restriction. [Player](https://www.remotion.dev/docs/player), [rendering](https://www.remotion.dev/docs/render), [licensing](https://www.remotion.dev/docs/license/pricing).
- **Motion Canvas:** TypeScript/JSX programmatic explanatory animation with audio-oriented sequencing; its JSX is not simply a React DOM component. Evaluate authoring/render dependencies before adopting another runtime. [Official site](https://motioncanvas.io/).
- **Manim / Blender:** reviewed math/science timelines and 3D scenes, rendered natively in a controlled worker. Better suited to reusable templates than unrestricted one-off code execution. [Manim quickstart](https://docs.manim.community/en/stable/tutorials/quickstart.html), [Blender Python API](https://docs.blender.org/api/current/).
- **Pillow + FFmpeg:** native CPU diagram frames and encoding. This wave produced a real proof without a browser; PyAV inspected streams because standalone ffprobe was absent. The FFmpeg build/distribution licence still needs review if binaries are redistributed. [FFmpeg legal guidance](https://ffmpeg.org/legal.html).
- **Veo / open video diffusion:** optional asynchronous generation, not an instant response guarantee. Google's API documentation lists latency varying from seconds to minutes; the Wan2.2 5B card reports a five-second 720p output taking under nine minutes on its example consumer-GPU setup. These are vendor/model-card claims, not measurements here. Check current supported model IDs, regions and pricing rather than copying deprecated preview names. [Veo docs](https://ai.google.dev/gemini-api/docs/veo), [Wan2.2 card](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B).

## Where clips fit in the lesson

1. Learner reviews extraction and chooses a learning objective; incomplete extraction remains visible.
2. Retrieve only authenticated, reviewed, revision-bound excerpts. Carry locator, quote offsets and source identity.
3. Planner returns bounded storyboard JSON: objective, source refs, ordered scenes, caption/transcript, template ID, allowed numeric variables and assumptions. It cannot supply executable code or arbitrary external asset URLs.
4. Validate citations/offsets, template allowlist, numeric units/ranges, scene/duration/byte limits and language/consent. Reject unsupported representations; offer cited reading instead.
5. Show a low-cost text/diagram preview first. Produce an MP4 only when explicitly requested or preparing an approved reusable lesson asset.
6. Shared KAIRO narration is requested separately, with actual provider consent and approved voice. Narration timing/captions must be aligned using generated audio durations; do not claim the current silent proof has this.
7. Private artifact cache key includes owner, source revision(s), objective, storyboard/template version, language, voice version and export options. A shared cache is appropriate only for public approved template material. Never share private coursework across learners.
8. Cancellation stops local waiting and suppresses late results. Backend job cancellation is a separate confirmed state; already-sent provider work may finish. Invalidated revisions cannot be served as current.

## Frequency, latency and cloud

Do not regenerate on every hover, variable tick or question. Use interactive parameter updates for those. Offer a clip at a new difficult concept, after a learner asks for visual help, or when a meaningful revision changes the explanation. Default is learner-controlled, not autoplay. Reuse valid prepared clips; private generated clips require owner-filtered reads and retention/deletion.

Current native proof took14–22seconds across two local rendering runs; those runs differ in output options and are not a controlled speed comparison. No universal latency promise is justified. Proposed acceptance targets must be measured: first readable preview time, p50/p95 planning/render latency, cancellation behavior, cache-hit rate, bytes delivered and cost per completed export.

Existing Cloud Run, Cloud Tasks and private Storage provide a possible job foundation. A future render service should be private, bounded and separate from interactive requests, with least-privilege artifact access, job idempotency, resource/time quotas and lifecycle cleanup. Reuse them only after a scoped implementation and cost/privacy review; no new GPU, cluster, Cloud Run render service or scheduler was provisioned here. Kubernetes/Terraform are not prerequisites for this bounded release; existing Terraform planning is not an applied deployment.

## Visual reference patterns

[3Blue1Brown's calculus series](https://www.3blue1brown.com/lessons/essence-of-calculus/) illustrates a useful pattern: one question, a changing visual relationship and a precise mathematical statement. Motion Canvas and Three.js examples show progressive construction and controlled camera/state changes. Remotion examples show reusable frame/timeline composition. Adopt explanatory structure, readable pacing and restraint; do not copy their assets, style wholesale or assert equivalent quality from this proof.

Remaining acceptance: authorised phone/keyboard/assistive-technology checks, domain review of new diagrams, native-language terminology/caption review, voice sync, actual learner comprehension studies, runtime cost/latency measurement and any separately consented video-model benchmark. These cannot be replaced by passing schema tests.
