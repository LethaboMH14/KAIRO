# KAIRO: 3D worlds, avatars, generation and tool integration

Research checked 21 October 2026. This is an engineering recommendation, not a finalized architecture or a claim that the listed tools have been installed or benchmarked. Sources below are primary documentation, repositories and original research. No reference image was attached to this particular request, so the visual direction is interpreted from the existing KAIRO brief.

## Recommendation

Build KAIRO around a browser-based interactive runtime, a prepared studio/asset library, and a World Composer that produces validated scene and lesson descriptions. Add image/text-to-3D services for missing assets and optional new environment shells. Separate the environment's appearance from each object's valid actions and the lesson's factual correctness.

There is no single direct replacement for Remotion that guarantees a photorealistic, scientifically correct, fully interactive learning studio from one prompt. The relevant combination is **3D runtime + asset creation + animation + simulation + lesson orchestration**. Codex, Claude or Qwen can author code and plans and invoke tools; an engine still renders every frame.

Prepare the reusable infrastructure and beautiful spaces ahead of time. Generate the content and composition for the learner at runtime. This supports the full six-studio ambition while avoiding a wait for asset generation every time someone asks a question.

## Checking the pasted recommendations

| Tool / claim | What was verified | KAIRO decision |
|---|---|---|
| Meta WorldGen is an open-source framework ready to install | The original research is real, including layout planning and navigation. Meta's published announcement explicitly describes it as research not available to developers. No usable Meta release was established in this review. | Research reference; do not make it a dependency or confuse unrelated repositories named WorldGen with Meta's system. [Announcement](https://www.meta.com/blog/worldgen-3d-world-generation-reality-labs-generative-ai-research/), [paper](https://arxiv.org/abs/2511.16825). |
| Spline AI produces interactive web scenes | Spline has AI-assisted creation, a runtime, code integrations and GLB export. However GLB export excludes states/events/interactivity, physics and several rendering features. | Good for authored interactive scenes in its runtime; assess integration before making it the shared KAIRO engine. A GLB needs behaviours rebuilt in our runtime. [Code export](https://docs.spline.design/exporting-your-scene/web/exporting-as-code), [GLB limits](https://docs.spline.design/exporting-your-scene/files/exporting-as-gtlf-glb). |
| Thrixel MCP connects coding agents to 3D generation | Its documented tools generate, inspect, edit, optimize and download assets. Some workflows expose named parts. Generation uses provider credits. | Strong candidate for a development-time asset pipeline; evaluate one multipart teaching object before adoption. [MCP documentation](https://www.thrixel.com/docs/mcp). |
| Image Blaster creates worlds from an image | The original Neilson repository is an MIT-licensed Claude skillset combining World Labs and FAL; it outputs static environment splats, dynamic object meshes and sound. Its under-five-minute claim is the author's example, not a KAIRO benchmark. | Useful experiment for reference-to-room workflows; underlying API services and output terms remain separate from the code licence. [Original repository](https://github.com/neilsonnn/image-blaster). |
| Rosebud generates playable 3D projects | The provider offers natural-language 3D game creation. | Useful rapid prototype route. Test code/asset export, extensibility and integration before choosing it for a long-lived product. [Provider page](https://rosebud.ai/3d-game-maker). |
| Rodin WorldGen supplies accurate physical weights automatically | Hyper3D advertises image-to-world creation using editable assets, plus model-generation APIs. This review did not establish the pasted claim that weights/masses are accurate enough for engineering simulation. | Candidate visual asset source. Independently specify and validate physics, units, materials and domain parameters. The pasted phrase “Seam Ready” is not a verified guarantee. [WorldGen](https://hyper3d.ai/features/worldgen), [API](https://hyper3d.ai/features/api). |

## Frameworks and additional tools worth considering

| Layer | Candidate | Why it is useful / tradeoff |
|---|---|---|
| Main runtime | [Three.js](https://threejs.org/) + [React Three Fiber](https://r3f.docs.pmnd.rs/) + [Drei](https://github.com/pmndrs/drei) | Recommended initial direction: React-integrated scenes, object events, loaders, controls and HTML overlays. We own the application state and teaching interactions. |
| Alternative web engine | [Babylon.js](https://www.babylonjs.com/) | A broader engine with extensive built-in tools; worth a short comparison if editor, physics and engine features dominate the build. Choose one main engine. |
| Editor-first web engine | [PlayCanvas](https://developer.playcanvas.com/) | Browser scene editor, engine, animation, physics and strong splat tooling. Attractive when visual scene authoring matters more than a React-first implementation. |
| Asset authoring | [Blender](https://www.blender.org/) + Python / Geometry Nodes | Build modular rooms, geometry, rigs, materials, lighting and exports. Reproducible scripts can make variations without remodelling every room. |
| Agent-controlled Blender | [MCP for Blender](https://github.com/ahujasid/mcp-for-blender) | Community integration for manipulation, materials, code execution and visual inspection. Development tool, with one owner of the Blender session. Not an official Blender Foundation server. |
| Prompt/image-to-object | [Meshy](https://docs.meshy.ai/en), [Hyper3D](https://hyper3d.ai/features/api), [Thrixel](https://www.thrixel.com/docs/mcp) | Fill asset gaps; test geometry, part hierarchy, costs and export. “Generated” does not mean ready for disassembly or educational validation. |
| Open-weight object generation | [TRELLIS.2](https://github.com/microsoft/TRELLIS.2) | Candidate for controlled asset experiments. Repository prerequisites currently specify Linux and an NVIDIA GPU with at least 24 GB memory; not a lightweight default Windows dependency. |
| Open world-generation research | [HY-World 2.0](https://github.com/Tencent-Hunyuan/HY-World-2.0) | Published code/weights for multimodal world generation. Investigate its own licence, component licences, compute and output usability; “public code” does not establish unrestricted rights. |
| Generated environment | [World Labs Marble](https://docs.worldlabs.ai/) | Prompt/image/video/coarse-structure world creation. Good for spatial shells and atmosphere; independently establish editable teaching objects and behaviours. |
| Splat rendering | [Spark](https://github.com/sparkjsdev/spark), [PlayCanvas SuperSplat](https://developer.playcanvas.com/) | Bring captured/generated environments into a web experience. A static splat alone does not provide separate gears, valves or anatomical structures. |
| Animation | [GSAP](https://gsap.com/docs/v3/), Three.js AnimationMixer | Timed camera moves and object transitions; skeleton animation and clip blending for characters. Prefer one master lesson/audio clock for synchronization. |
| Physics | [React Three Rapier](https://github.com/pmndrs/react-three-rapier) | Rigid bodies, collision and joints. Circuits, physiology, material processing and economic behaviour still need their own domain calculations. |
| Asset optimization | [glTF Transform](https://gltf-transform.dev/) | Inspect, simplify and compress assets. Preserve independently selectable parts while optimizing; merging everything destroys useful interactions. |
| Maximum-fidelity route | [Unreal + MetaHuman](https://dev.epicgames.com/documentation/en-us/metahuman/metahuman-documentation) | Strong option for high-end environments and digital humans. A cloud-streamed implementation would add GPU cost, streaming latency and bandwidth; evaluate separately from the initial browser route. |

The “hyperrealistic” result comes from geometry, textures, physically based materials, lighting, animation and art direction. Smoothness comes from measured frame time, efficient rendering, loading, animation blending and device-specific quality. An LLM brand or a larger prompt cannot guarantee either.

For the initial runtime, target 60 fps on a named reference laptop, with an adaptive lower-quality mobile mode. Treat that as an acceptance target, not a current result. Budget texture memory, draw calls, shadows and post-processing; use instancing and levels of detail where useful. [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

## Premade spaces, models and people

Yes, we can reuse complete rooms as well as modular pieces. A marketplace room normally supplies visual assets, not lesson logic, characters' reasoning, accessible controls or domain simulation.

| Source | What to look for | Reuse boundary |
|---|---|---|
| [Blender demo files](https://www.blender.org/download/demo-files/) | The Classroom scene by Christophe Seux is a concrete ready-made starting point, listed as CC0. | Optimize and convert for browser use; a Cycles showcase scene is not automatically a performant interactive web scene. |
| [Poly Haven](https://polyhaven.com/license) | Realistic props, materials and HDRI lighting. | Assets are CC0; record source links anyway. |
| [ambientCG](https://ambientcg.com/) | PBR surfaces, HDRIs and models. | Assets are CC0; useful for a coherent material library. |
| [Fab](https://www.fab.com/) | Environment kits, rooms, characters, animation and industrial props. | Check each listing's licence, supported engine, source files and redistribution permissions. A Unity/Unreal package may need substantial conversion. |
| [Blendkit / BlenderKit](https://www.blenderkit.com/our-mission/) | Premade scenes and assets directly in Blender. | Inspect the individual asset licence and availability; free access and unrestricted redistribution are different. |
| [Sketchfab Court Room example](https://sketchfab.com/3d-models/court-room-0e1ff96464a84607b719ad25f674b2df) | A concrete downloadable courtroom candidate surfaced in search. | Licence inspection did not succeed in this review, so it is a lead, not an approved asset. Check suitability for the intended South African setting. |
| [Z-Anatomy](https://github.com/z-anatomy) | Anatomical structures and reference ecosystems. | Track dataset/model attribution and share-alike conditions separately from application code licences; review the actual package selected. |
| [Kenney](https://kenney.nl/assets) | Modular low-complexity kits and interaction prototypes. | Useful for performance tests or lightweight mode; its common visual style may not meet KAIRO's main realism target. Verify the selected pack. |

Maintain an asset manifest: stable ID, source URL, author, licence, attribution, modifications, format, scale, part names, rig/blendshapes, permitted actions, collider, file size, and validation status. Rooms also need named placement anchors for teacher, board, demonstration table, source screen and student viewpoint.

### Avatar approach

The flagship teacher should be an actual rigged 3D character in the scene. It needs facial morph targets, a body rig, gaze, idle/listening/explaining/pointing clips, and animation transitions. Teaching gestures should refer to real object positions; a generic pointing clip alone does not aim a hand correctly.

- [Avaturn](https://docs.avaturn.me/) is a realistic avatar-creation candidate; inspect the exported rig, facial controls, plan and licence before choosing a teacher asset.
- [Mixamo](https://www.mixamo.com/) supplies reusable body animations and character motion; facial speech synchronization remains a separate job.
- [three-vrm](https://github.com/pixiv/three-vrm) supports a standardized avatar route with Three.js. Appearance depends on the chosen model; VRM is not itself a realism generator.
- [Azure Speech visemes](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme) can provide timed mouth/facial information. Verify the exact voice/language's supported output and map it to the teacher's facial rig.
- [LiveKit Agents](https://docs.livekit.io/agents/) is a candidate for real-time conversation and interruption. Its [avatar-provider integrations](https://docs.livekit.io/agents/models/avatar/) commonly produce video tracks; that is a different integration from controlling a 3D teacher's skeleton in our renderer.

Sign language needs validated signing, including handshapes, motion, facial expression and language grammar. Lip sync or ordinary gesture animation does not deliver it. Plan a reviewed signing-content track separately.

## What KAIRO should generate from supplied information

Three generation modes can share the same runtime:

1. **Compose immediately from known parts:** choose a studio, bring in approved assets, populate a board, create a diagram and attach an existing simulation. This is the primary product flow.
2. **Create new assets asynchronously:** a missing device or room is generated/imported, checked, optimized and added to the library. The learner can start a grounded explanation while this runs.
3. **Create new behaviour through development:** a genuinely new simulator or unsupported interaction becomes a separately reviewed implementation. Do not run arbitrary LLM-generated code in the learner's main browser session.

A reference image helps with camera, composition, lighting and style. It cannot reveal hidden internals, exact dimensions or correct mechanics. A manual, CAD asset, labelled diagrams and verified parameters improve technical fidelity.

For example, a motor chapter can select Engineering Studio, mount a multipart motor, highlight the stator, animate a prepared rotor, display a source citation, and connect a slider to a verified mathematical model. A photograph alone should not be presented as proof that KAIRO has recovered that motor's real internals.

Use a typed `WorldSpec` containing: scene template ID, approved asset IDs, placement anchors, camera presets, allowed actions, simulation ID/parameters, source IDs, lesson timeline, assessment, accessibility alternatives and quality tier. The model emits data; validators and the runtime decide what can execute.

## MCP, web search, videos and visualization

Yes. KAIRO's backend can host an MCP client and call external or custom servers. It can also expose a custom KAIRO MCP server for developer clients. MCP standardizes tool access; it does not automatically provide web search or rendering. [Official server guide](https://modelcontextprotocol.io/docs/develop/build-server), [registry](https://registry.modelcontextprotocol.io/).

Keep two tool groups separate:

- **Development:** Blender control, asset generation, repository work, browser verification. These help us build and review KAIRO.
- **Application:** search, retrieve sources, find relevant videos/assets, run approved simulations, update learning progress and request scene changes. These run through the user's scoped KAIRO session.

| Need | Existing option | Proposed custom KAIRO adapter |
|---|---|---|
| Current information | [Brave Search MCP](https://github.com/brave/brave-search-mcp-server) or [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) | `search_sources(query, domains, freshness)` returning URLs, excerpts and retrieval timestamps. |
| Read a source | [Firecrawl MCP](https://github.com/firecrawl/firecrawl-mcp-server) | `retrieve_source(url)` with document identity and citation spans. |
| Browser interaction / verification | [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) | Development/integration test tool; application browsing would need a separate isolated session and narrow permissions. |
| 3D generation | Thrixel, Meshy or Blender integrations above | `request_asset(spec)` returns a job ID; only checked outputs enter the approved library. |
| YouTube search | YouTube Data API through our adapter | `find_video(query)` returns metadata and embeddability information; `show_video(video_id, start_seconds)` requests an approved player. |
| Search visualization | Our own renderer and templates | `compose_visualization(source_ids, template, data)` for a concept map, comparison, timeline, process graph, chart or supported 3D illustration. |
| Lesson/scene actions | Custom KAIRO server | `highlight_object`, `focus_camera`, `set_parameter`, `run_simulation`, `show_source`, `record_assessment`. All schema-checked and scoped to the current lesson. |

The tool server does not draw into the browser directly. The backend validates its output and sends a scene event over the application connection; the frontend updates the runtime. Keep API keys on the backend, allowlist tools/actions, bound cost and request duration, and treat retrieved text as untrusted source material. Retrieval must preserve the distinction between what the uploaded source says and new external information.

### YouTube inside the space

Use the [official IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) for playback, pause, seek and events. An iframe can sit in a spatially positioned HTML panel or accessible overlay aligned with the studio screen. Keep playback controls usable and pause the teacher when needed.

Do not assume a YouTube iframe is a raw video stream suitable for a WebGL texture. Embedding is also different from downloading, transcription and redistribution. The official [caption download method](https://developers.google.com/youtube/v3/docs/captions/download) requires permission to edit the video, so it does not provide transcripts for every public video. For lesson grounding, use authorized transcripts, user-supplied material or a separately verified permitted ingestion route. Handle unavailable, private, age-restricted or embedding-disabled videos with a normal link fallback.

### Visualize an arbitrary search

The model should choose from an expanding visualization grammar: comparison table, concept graph, sequence, timeline, annotated model or scenario. Data and citations populate those templates. A search about a CPU request can become a traced process through a prepared computing scene; a search about university costs may be clearer as a chart. The choice of 2D or 3D follows the question.

## Time estimates

These are planning estimates for one experienced developer/technical artist using agents, an existing runtime, available services and suitable assets. They are not measured KAIRO timings. Work adds up; the first room also pays for infrastructure.

| Deliverable | Reusing a suitable asset/reference | Creating substantially from scratch |
|---|---|---|
| Room blockout and camera layout | 1–4 focused hours | 0.5–2 working days |
| Attractive browser-ready room, lighting and navigation, without teaching logic | 1–3 days | 1–3 weeks |
| One bounded interaction, such as a selectable multipart device and exploded view | 1–3 days after usable model exists | 1–3 weeks including modelling/part cleanup |
| Rigged teacher playing speech, lip sync and a small gesture set | 2–5 days | 2–6 weeks for custom character/rig/animation work |
| One narrow grounded lesson connected to scene actions, questions and assessment | 3–7 days after the shared runtime exists | First integrated vertical slice: approximately 2–4 weeks |
| One polished studio with recovery, accessibility alternatives and device QA | Approximately 2–6 weeks with substantial reuse | Often 6–12+ weeks depending on domain |

A generated preview may arrive in minutes; that excludes retries, cleanup, correctness checks, interaction programming and integration. Once templates exist, aim to compose a new supported lesson in tens of seconds to a few minutes and reuse its cached result. That is a target to benchmark, not a promise. Generation of missing assets stays a separate background job.

Six studios with real interactions are a multi-stage programme. Reusing a room can remove days of environment modelling, but courtroom dialogue, validated anatomy and engineering simulation still require different work. A short competition demo can demonstrate a bounded slice; it cannot establish all six studios as finished.

## Build sequence and decisions to prove

1. Pick visual references and define the studio/teacher art direction before committing to assets. No supplied reference image was available for visual inspection in this turn.
2. Compare one browser scene in R3F and, only if needed, Babylon/PlayCanvas. Measure actual performance on a reference laptop and phone.
3. Prepare a lecture shell, reusable anchors and a rigged teacher. Evaluate a multipart teaching asset from an existing source against one generated alternative.
4. Define `WorldSpec`, source/lesson schemas, simulation contracts and typed scene actions. Separate the asset catalogue from learner records.
5. Connect one unfamiliar source to a complete lesson; add interruption, captions, contextual questions, source references and saved assessment.
6. Add web search, an embedded video and a source-backed visualization through narrow adapters.
7. Demonstrate transfer to a second studio, then expand domain capability and asset coverage across the remaining studios.

Track cost per generated asset, storage/transfer, model calls, voice minute and completed lesson. Open-source code does not make GPU inference or hosted search free. Do not assume cloud credits cover unrelated providers. Do not select a paid generation workflow before checking its current price and a bounded experiment budget.

## Coordination delivered in this project

`coordination/bus.py`, its README, behavioural tests, root AGENTS.md and CLAUDE.md establish a local cooperative protocol. It records actual/self-reported model and effort, task scopes, active owners, progress, blockers, messages and evidence. Transactional claims reject overlap; they do not stop a noncooperating editor. Claude must join from this folder and follow the protocol. No Claude session or MCP provider was installed or automatically launched by this work.
