# Avatar runtime increment

Owner codex-avatar-20261021, AVATAR-001. Proposed interfaces before implementation:

- A reusable R3F TeacherAvatar loads a locally served CC0 MPFB glTF, preserving the humanoid skeleton and facial morphs. Gestures are authored locally; no third-party animation rights are assumed.
- TeacherProvider exposes a mutable audio signal (energy, playback position) for mouth animation and speech state for gestures. Audio-energy jaw movement is approximate lip animation, not phoneme-perfect visemes.
- /teacher gains an interactive rehearsal stage with named board targets and an action that changes the board only after a real UI action. Motion and character shape remain independently replaceable.
- POST /api/avatar/speech: explicit cloud consent, bounded text, allowlisted voice, language and pace; server-held Google credentials, in-memory audio cache and request/character limits. Return MP3, not credentials. Browser narration remains an explicit alternative.
- Natural voice options start with Google Chirp 3 HD English voices verified live against the existing project. They are synthetic voices, not actor recordings or guaranteed South African accents. Azure South African voices remain a later separate adapter.

Claude Engineering scopes are untouched. No automatic signing, full application roaming or finished cinematic likeness is claimed by this increment.

## Implemented

The rehearsal now runs at http://127.0.0.1:4176/teacher. It loads the actual humanoid model, supports full-body and face cameras, at-ease/explain/point/listen poses, encouraging/focused/curious facial controls, blink and a reduced-motion setting. The three-step stock board changes both its scene texture and readable HTML state. It is an authored example; it is not an arbitrary generated lesson simulator.

The preparation script uses the existing portable Blender. Source model: TalkingHead commit `2afe6d79779313db8909badebf46f9805a6c7b70`, `avatars/mpfb.glb`. The author's README explicitly assigns CC0 to this specific model; other demo assets have different licences. The original 36.8 MB file is retained under assets/reference/teacher. The prepared model is 11,262,664 bytes, retaining fingers, skinning, selected facial morphs and textures resized to 1024. Provenance and rig report are alongside studio/public/models/teacher/teacher.glb. No TalkingHead runtime or third-party animation clips were installed; KAIRO uses its existing Three/R3F dependencies and authored procedural poses.

Movement uses smooth quaternion interpolation on the skeleton, with a subtle explanatory rhythm and facial morph blending. Pointing is an authored pose aimed toward the rehearsal board, not solved hand-to-surface contact. There is no locomotion or shared DOM/world target registry yet. The rig is suitable for developing the interaction contract but its appearance is not our finished soft cinematic design. The next art pass should refine shape, clothing, hair, materials and expression ranges in Blender/MPFB while preserving the contract. The generated concept picture itself is not a rig.

TeacherProvider now supports consented Google speech across existing narration consumers, including passage and chapter reading. It chunks long narration into bounded requests, plays MP3 audio, supports pause/resume/stop, and exposes a mutable audio signal to the stage. Mouth opening follows real audio energy. It does not estimate phonemes, word timing or sign language. Browser speech remains an explicit option and has no audio-driven jaw animation. Cloud failures do not silently substitute another provider. Cloud requests are server-authenticated; credentials are never returned to the client. Cache is capped at 16 items in process memory, with no audio/text persistence in this endpoint.

## Voices, costs and later choices

Live synthesis succeeded for `en-GB-Chirp3-HD-Aoede`, `en-US-Chirp3-HD-Kore` and `en-GB-Chirp3-HD-Puck`. Each 115-character authored sample produced a nonempty MP3 in about 1.2 seconds during this check; this is one observation, not a latency guarantee. Samples are in assets/reference/teacher. The natural quality comes from [Google Chirp 3 HD](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd), not a real person's recording or voice clone. The app labels UK/US accents honestly. Character identity is independent of voice selection.

[Google pricing](https://cloud.google.com/text-to-speech/pricing) currently lists 1 million HD characters/month free, then $30/million. Billing is required and available quota is shared; current remaining credits were not re-audited. This endpoint additionally limits each process lifetime to 100 synthesis attempts and 20,000 characters (up to $0.60 at the listed overage rate), with one generation at a time and a 1,200-character/4,500-byte request limit. Restarting resets these preview limits; they are not a durable production budget control. Probe scripts make a few separate development calls. No additional account is needed for the verified Google path. The existing local gcloud development auth is not deployment authentication.

South African English and isiZulu can later use [Azure's documented voices](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts), such as Leah/Luke and Thando/Themba. They are not wired into this increment and no existing unrelated Azure resource was modified. Prompt-controlled Gemini TTS is another later option for delivery style. True lip sync should use provider viseme events or evaluated forced alignment with the chosen audio. A signing pathway requires licensed data, a capable rig and Deaf SASL linguistic review; the current finger joints and gestures do not establish signing accuracy.

## Verification

- Final production TypeScript/Vite build and all 24 tests passed after cancellation and shadow polish.
- Eight real HTTP checks: consent, voice and size validation; foreign-Origin rejection; enabled voice catalogue; MP3 synthesis; cache hit; local model delivery.
- Browser: actual textured rig rendered in narrow layout, pointing pose and close-up camera displayed, board advanced from 20 to 32, Google voice consent/selection worked, playback reached “Reading finished”, and pause/resume/stop worked. The final bundle was reloaded and its rig, playback, pause/resume/stop and board transition were checked again. Audio quality was not subjectively graded; phoneme accuracy was not claimed.
- Private coursework was not sent for synthesis during these checks. Only authored example text was used. Persistent narration settings were exercised on the same 4176 origin.
- Shared renderer chunk warning remains. Final art direction, performance across devices, precise finger poses, IK contact, walking and SASL remain outstanding.

Evidence: data/private/app-workspace/avatar-verification.json, studio/tests/avatar.test.mjs, local samples, provenance/rig-report and coordination/handoffs/2026-10-21-avatar-runtime.md.
