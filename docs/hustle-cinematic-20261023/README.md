# KAIRO cinematic pitch package

- [Full cinematic treatment](TREATMENT.md): 20-second script, accumulation system, camera/sound, real-asset plan, accessibility and seven-criterion map.
- [References and installed skills](REFERENCES.md): credited craft examples, no unsupported highest-ever ranking, exact official skill provenance.
- [Independent Luna review](LUNA-REVIEW.md): both deliveries found, 15/15 focused tests, runtime integration absent and a reproduced check-count discrepancy.

Artifacts in `../../design/hustle-cinematic-20261023/`:

- `kairo-cinematic-storyboard.png`: generated six-shot concept mock, built-in image generation. `image-prompt.txt` preserves the exact prompt.
- `kairo-cinematic-20s-camera-mock.mp4`: updated 20-second camera animatic with captions and offline scratch voice. It moves the camera over stills; the character/motor are not performing animation.
- `index.html`: native local video player and scrub buttons; static storyboard and transcript remain available without starting video. No external dependencies/network/autoplay.
- `timeline.json`, `captions.json`, `voiceover.txt`: precise shot and caption timing. Caption objects follow the installed Remotion caption schema for later authoring.
- `render_camera_animatic.py`: offline FFmpeg generator using installed imageio-ffmpeg. Rebuild from root with `python design/hustle-cinematic-20261023/render_camera_animatic.py`. Scratch narration WAVs are retained inputs. Video composition changes do not edit the original image.
- `verification.json` and `video-check-frame.png`: actual timing/codec/full-decode evidence and an extracted practice shot for artifact QA.

The image's people/companion are fictional generated staging. Use the real presenter and existing authored KAIRO character in the final version. Concept environments and a five-star-style display are not validated skills, mastery, SASL or production product behavior. Employer/rewards beat is clearly NEXT / PROPOSED, with no partnership confirmed. Final voice, audio mix, real 3D/product shots, human/phone playback review and upload acceptance remain open. No browser observation was performed. No deployment, paid API call, portal write or schedule recreation.

Validation: 480 planned/rendered video frames at 24fps, 1280×720 H.264/AAC, reported duration exactly20.0s; full FFmpeg decode passed. Inspected generated contact sheet and extracted practice frame. An initial concatenation added AAC priming overhead (20.02s); fixed by assembling PCM audio once and normalising final video timestamps before encoding. These are local artifact checks, not final submission acceptance.
