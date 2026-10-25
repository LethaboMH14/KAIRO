# KAIRO — “When it clicks” · editable production project

Task KAIRO-AD-PROD-037 · Claude (`claude-kairo-ad-20261024-a`, claude-opus-5-5, effort max) · 24 October 2026.
Status: **first cut v0.1** — playable, offline-rebuildable, not final. Production notes, rights and limits are in
[`docs/kairo-ad-production-20261024/`](../../docs/kairo-ad-production-20261024/README.md).

## Watch

| File | What it is |
|---|---|
| `out/kairo-when-it-clicks-master-1080p30.mp4` | Creative concept cut. Clean picture with small honesty supers; captions as sidecar. |
| `out/kairo-when-it-clicks-master-web-1080p30.mp4` | The master re-encoded at ≈ 10 Mbit/s (≈ 24 MB) for upload limits; same picture and audio. |
| `out/kairo-when-it-clicks-silent-1080p30.mp4` | Silent-readable: same cut with every spoken line burned in. Known v0.1 blemish: the small “Dramatisation” super sits partly behind long captions between 5 and 16 s (fixed in code; re-render to apply). |
| *(not rendered yet)* `out/kairo-when-it-clicks-reduced-1080p30.mp4` | Reduced-motion companion: cuts and fades only (no pushes, orbit, slides, flights or rotor spin), still grain, captions burned in. Code and stills checked; render with `python design/kairo-ad-20261024/compose/build.py --variant reduced --audio design/kairo-ad-20261024/build/mux-audio.wav` (≈ 9 min). |
| `out/kairo-when-it-clicks-review-1080p30.mp4` | Same cut with a permanent “review cut · temp voice · reconstructed interface · fictional student” label, for circulating. |
| *(not rendered yet)* `out/kairo-when-it-clicks-entrant-1080p30.mp4` | Entrant-compatible layout: labelled placeholders where the entrant's own opening (0–3 s) and close (16.5–17.55 s) go; KAIRO section kept. Not submittable until the entrant footage is cut in. Render with `--variant entrant --audio design/kairo-ad-20261024/build/mux-audio-entrant.wav`. |
| `out/kairo-when-it-clicks.en.srt` / `.vtt` | Captions from measured take timings. |
| `out/kairo-when-it-clicks-mix.wav`, `out/stems/*.wav` | 48 kHz/24-bit mix and stems: `dialogue-kairo`, `dialogue-chorus`, `dialogue`, `music`, `fx`. |
| `qa/contact-sheet-*.png`, `qa/validation.json` | One frame per second per cut, and the ffprobe/full-decode/audio checks. |

All cuts: 1920×1080, 30 fps, 600 frames, H.264 High/yuv420p + AAC 48 kHz stereo. This is our production choice,
not an organiser specification.

## How it is built (no browser anywhere)

```
timeline.json            every word on screen, every timing, voice slots, thought bank → edit this first
voice/takes.json         which recorded/synthesised takes are used (temp Kokoro now; Aoede or human later)
blender/render_motor.py  actual motor GLB → build/motor/*.png + exact section-line projection + cage anchors
blender/render_kairo.py  actual KAIRO GLB, shipped clips via NLA, Rhubarb mouth cues → build/kairo/*.png
audio/build_audio.py     places takes, synthesises the original score and FX, stems, mix, Rhubarb cues
audio/captions.py        SRT/VTT + docs/…/TRANSCRIPT.md from measured placement
compose/build.py         deterministic 2D compositor (Pillow/OpenCV/NumPy) → FFmpeg; four variants
qa/validate.py           ffprobe + full decode + blackdetect + clipping/loudness + final-hold → qa/
make.py                  runs the steps in order
```

Rebuild from the project root:

```
python design/kairo-ad-20261024/make.py                    # prepare → motor → audio → kairo → video → qa
python design/kairo-ad-20261024/make.py --only video,qa    # after editing on-screen copy or timings
python design/kairo-ad-20261024/make.py --from audio       # after replacing any voice take (lip sync follows)
```

Audio-only changes (mix, music, effects) can be swapped into finished cuts without re-rendering pictures:
`python design/kairo-ad-20261024/audio/remux.py` (video stream copied bit for bit). The v0.1 masters were remuxed
this way after the music was ducked under the student's thoughts.

Every frame derives from its frame number: no clock reads, no unseeded randomness (film grain is seeded per
frame), no CSS/runtime animation. Blender cameras, rotor spin and mouth shapes are keyed per frame.

### Swap in the final voice

- **KAIRO in the app's own voice (Aoede):** the user signs in (`gcloud auth login`), then
  `$env:KAIRO_AUTH_MODE='gcloud'; node design/kairo-ad-20261024/voice/generate-voice-aoede.mjs` (five lines,
  about 140 characters, no retries), then `make.py --from audio`. The agent could not run this: no active gcloud
  account was available to it, and it did not read credential files.
- **Entrant / actor:** record per [`CAPTURE-LIST.md`](../../docs/kairo-ad-production-20261024/CAPTURE-LIST.md), save
  48 kHz WAVs, point the matching ids in `voice/takes.json` at them, then `make.py --from audio`.

### Caches (regenerable, do not package)

`.cache/tts-venv` (isolated Kokoro environment), `.cache/kokoro` (model files, SHA-256 in `voice/takes.json`),
`.cache/ffmpeg` (ffprobe from the gyan.dev essentials build). `build/` holds rendered plates and intermediates and
can be regenerated by `make.py`.
