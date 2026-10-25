# AVATAR-001 handoff

Owner codex-avatar-20261021, Codex; actual model and effort unknown. User authorized continuing the teacher and natural voice implementation. Claude ENG-001 and launcher claims remain untouched.

## Changes

- studio/src/avatar: reusable R3F humanoid, smooth authored teaching poses, expression morphs, audio-energy jaw movement, interactive stock board, camera controls, reduced-motion support, error fallback and responsive rehearsal layout.
- studio/src/teacher/TeacherProvider.tsx: server-generated HD audio playback/chunking, audio signal, explicit consent, pause/resume/stop and cancellation; existing browser speech remains an option. Settings parsing preserves old preferences and validates new voice/provider/consent fields. TeacherSettings renders the working rehearsal and separates voice choice from art direction.
- studio/server/avatar/speech.mjs, server.mjs and server/google.mjs: mounted consented /api/avatar/speech and /voices using server-only Google auth. Fixed allowlist; maximum 1,200 characters and 4,500 bytes/request, 100 attempts and 20,000 characters/process, one synthesis at a time. Cache capped at 16 entries in memory; process limits reset on restart and are not production budget enforcement.
- studio/public/models/teacher: prepared 11.3 MB glTF, source licence/provenance and bone/morph report. Original CC0 MPFB model and source README/licence retained under assets/reference/teacher. KAIRO-authored poses only; no Mixamo clips or Ready Player Me demo avatar. No new npm packages or manifests changed.
- tools/avatar: pinned download recipe, Blender preparation script and live voice/HTTP probes. Use a writable project-local TEMP/TMP for Blender export. Initial sandbox default temporary-image writes failed; rerun with project-local temp succeeded. Blender's optional profile-cache warning did not prevent successful export.

Source commit and hashes are in studio/public/models/teacher/provenance.json. The source author's README explicitly licences this particular MPFB avatar CC0. The model's current identity/clothing is a rehearsal asset, not the finished softly stylised teacher design selected by the user.

## Checks

Final production TypeScript/Vite build and all 24 tests passed after text/cancellation/shadow polish. Eight real HTTP checks passed including consent/size/voice rejection, foreign-Origin rejection, catalogue, actual MP3 generation, cache hit and model delivery. Three 115-character Google Chirp 3 HD samples generated successfully (Aoede UK, Kore US, Puck UK). Only authored stock example and preview text was sent, not private coursework. Data: data/private/app-workspace/avatar-verification.json.

Browser rendered the actual textured humanoid and face view, displayed the pointing pose, advanced the stock board to 32, selected the Google voice, completed playback, paused/resumed and stopped. Audio quality, exact phoneme alignment and frame rate were not graded. Narrow responsive layout was observed. Browser automation timed out during compilation; after the final build it recovered. Reloaded the final bundle and verified the visible rig, voice pause/resume/stop and board transition again. The shared renderer chunk warning remains; modest-device performance still needs measurement. Ground contact shadows now render once rather than every animation frame.

Local preview remains loopback at http://127.0.0.1:4176/teacher, with cloud mode explicitly enabled and gcloud development auth. This is not a deployment. Settings/marks remain browser-origin local.

## Boundaries and next work

The speech is real synthesized MP3; mouth movement is audio amplitude, not provider visemes or forced alignment. The stage renders this mouth signal; passage/chapter narration can use the same voice, but the 3D avatar is not yet embedded across all pages. Pointing is an authored pose toward the board, not an IK hand-contact solver. No walking, arbitrary scene tool execution, generated video, real-world simulation or SASL translation is delivered.

Next: art-direct a licensed/custom MPFB/Blender character toward the approved concept; improve facial/lip timing; add an allowlisted target registry and IK; then authored locomotion paths and lesson-stage integration. Keep appearance independent from voice and maintain accurate accent labels. South African Azure voices need their own reviewed adapter; no existing unrelated Azure resource was changed. Signing requires licensed content and Deaf SASL linguistic validation.
