# KAIRO production started — 23 October 2026

Root codex-production-20261023-n, Codex gpt-6 / effort unknown. User authorised the practical video toolkit, matching KAIRO narration and two continuing Luna chats. No browser observation or public upload. Selected C identity and authored KAIRO character retained.

## Actual outputs

- `design/video-production-20261023/kairo-aoede-20s-production-preview.mp4`: existing concept camera footage with a new natural KAIRO narration track. Exactly20.0s, 480 frames at24fps; full decode passes. It is still a concept, not actual interactive footage.
- `design/video-production-20261023/voice/kairo-narration-17s.mp3`: KAIRO-only narration, with timing gaps for the edit. `voice-cut-20s.mp3` includes a synthetic learner placeholder in the first3seconds, not the user's voice.
- Five raw Google MP3s plus `voice/generation.json`: 187 characters across five successful bounded requests, same `en-GB-Chirp3-HD-Aoede` used as the app's default cloud voice. Public authored copy only; no image, voice reference or private material sent. At $30/million characters, the list-rate character estimate is $0.00561 before allowances/credits; not a verified billing total. No Luma/AIML credit consumed.
- Existing authored teacher is prepared for offline Blender compositing in `kairo-production-stage.blend`; `kairo-production-frame.png` is the proof still. This is not the invented companion in the previous generated storyboard. `blender-verification.json` records the still preparation. `kairo-native-motion-test.mp4` is a real48-frame,24fps,2-second640×360 CPU render of Idle plus camera motion. It is a low-resolution pipeline proof, not final lip-sync/teaching performance. `native-animation-render.json` records render/decode evidence.
- `kairo-production-assets.zip`: downloadable asset pack containing the packed Blender scene, native proof clip, narration, voice edit, logo, credits and continuation briefs. ZIP CRC verified. User account screenshots and any personal face/voice references are excluded.
- `prepare-render-glb.mjs` decodes the shipped model's meshopt compression into `kairo-render.glb` using already installed tools. Original geometry/assets stay untouched. Original source .blend is a source-rig rest pose; use the exported model for the authored Idle/Explain/HandPoint clips. Do not mistake rest-pose source for the web animation output.
- Luma prompt pack and Claude continuation instructions are in this directory. User screenshots are saved in the design package's `references/`; screenshot credit label is99%, not a numeric3,000 balance.

## Voice identity and choice

Inspected `studio/server/avatar/speech.mjs`, `studio/src/teacher/model.ts`, `studio/src/character/lesson.ts`, original MP3s and character CREDITS. Existing voices are Google Chirp3HD Aoede (UK female), Kore (US female) and Puck (UK male); not human recordings. No downloaded South African narrator was found in that inspected set. We did not inspect current browser/localStorage voice preference. Aoede is the configured default, not a claim that we heard the user's currently selected voice.

The new edit reserves0–3s for the learner's own recording or a clearly separate voice. KAIRO alone narrates3–20s. Final tag is “Put knowledge to work” while KAIRO remains on screen; this keeps her pace natural in the2-second closing slot. Slight tempo correction is at most about0.5% for KAIRO; no aggressive speedup. No human listening or final audio-mix acceptance claimed.

South African option to audition later: Microsoft lists `en-ZA-LeahNeural` (female) and `en-ZA-LukeNeural` (male). These are synthetic cloud voices, not downloadable open-source voice weights. An existing Azure F0 resource in setup notes is not a promise of available quota or permission to repurpose an unrelated service. No Azure call, scraped Edge endpoint or new voice clone made. Keep the same approved KAIRO voice in product and advert unless explicitly choosing a change.

Sources checked: [Google voice list](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd), [Google pricing](https://cloud.google.com/text-to-speech/pricing), [Microsoft locales/voices](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support).

## Toolkit and hardware

Verified Intel UHD graphics; no NVIDIA GPU was reported by the hardware query. AdapterRAM is a driver-reported field, not a reliable dedicated-memory budget for integrated graphics. No claim that Wan video generation will run usefully here. Torch presence is not CUDA availability. Heavy ComfyUI/Wan/Chatterbox model downloads are deferred; CPU-rendered Blender and existing FFmpeg form the working local path. Existing portable Blender4.5.14LTS and installed imageio-FFmpeg were reused, no new app runtime dependencies added.

Production commands (from root):

```
node design/video-production-20261023/prepare-render-glb.mjs
tools/blender/blender-4.5.14-windows-x64/blender.exe --background --python design/video-production-20261023/render-kairo-stage.py
python design/video-production-20261023/assemble-voice-cut.py
tools/blender/blender-4.5.14-windows-x64/blender.exe --background --python design/video-production-20261023/render-native-test.py
python design/video-production-20261023/package-assets.py
```

Voice regeneration is a separately billed operation, not required for each edit: set local `KAIRO_AUTH_MODE=gcloud` and run `node design/video-production-20261023/generate-kairo-voice.mjs` only when changing public script text. Never print access tokens. The generator caps its batch at600characters and performs no hidden retries.

## Luma and missing final inputs

The screenshot is evidence of a99% remaining indicator and a board asking for app/audience/assets/format. It does not confirm3,000credits, account tier, export rights, model access, download settings or API balance. [Luma licensing](https://lumalabs.ai/learning-hub/licensing) says Free/Lite generations are personal/non-commercial; credits alone do not establish advert rights. Luma is a preview option until plan rights are verified. No upgrade, API purchase, watermark removal or external upload is performed here.

Final personalised face shots still need the user's supplied clear portrait and recorded opening/performance; no likeness was fabricated. The final edit also needs approved real product shots, actual authored avatar performance/lip sync and a human sound/phone-playback check. Keep roles/rewards proposed and SASL in development; do not add false sign-language gestures or bank partnership. The deleted schedule remains off.

Judging: Presentation and Usability improve through one consistent voice, readable timing and emotional contrast; Product/Creativity use the actual authored character instead of an unrelated generated design. Intelligence/Impact/Revenue remain separate product/evaluation evidence, not claims proved by this advert.
