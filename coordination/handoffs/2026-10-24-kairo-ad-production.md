# KAIRO-AD-PROD-037 — “When it clicks” advert, first cut v0.1

24 October 2026 · Claude Code desktop · `claude-kairo-ad-20261024-a` · claude-opus-5-5, effort max.
Scope claimed and used: `design/kairo-ad-20261024/`, `docs/kairo-ad-production-20261024/`, this file. No app,
router, provider, package, root-config or cloud files changed. AD-STILLS-036 and KAIRO-BRAND-HERO outputs, the
KAIRO/motor GLBs, brand masters and app source were read only.

## What actually rendered

- `design/kairo-ad-20261024/out/kairo-when-it-clicks-master-1080p30.mp4` (68 MB) and `…-master-web-1080p30.mp4`
  (24 MB, same picture/sound at ≈ 10 Mbit/s) — the creative concept cut.
- `…-silent-1080p30.mp4` (burned-in captions) and `…-review-1080p30.mp4` (permanent status label).
- Stems (`out/stems/`), mix WAV, SRT/VTT, contact sheets, QA JSON.
- Not rendered (stopped for the submission window; code and stills checked): reduced-motion companion and
  entrant-placeholder cut. One command each, ≈ 9 min (see `design/kairo-ad-20261024/README.md`).

## How (editable, offline, deterministic)

`timeline.json` holds all copy and timing. Blender 4.5 EEVEE renders the actual KAIRO GLB (shipped Idle/Explain/
Acknowledge clips via NLA; mouth from Rhubarb cues through the app's own VISEMES table) and the actual induction-
motor GLB (cut variants, one orbit, cage selection, rotor spin). The motor's own section outline
(`motorGeometry.json`) is projected through the first-frame camera so the paper diagram line lands exactly on
the cutaway. A NumPy/OpenCV/Pillow compositor builds every frame from its frame number and pipes to FFmpeg/x264.
Score and FX are synthesised (no samples). `make.py` rebuilds everything; `audio/remux.py` swaps audio only.
No browser, Playwright/CDP or headless screenshotting anywhere; the Remotion renderer was not used for that reason.

## Stand-ins (labelled on screen and in docs)

- **Voice: temporary**, local Kokoro-82M (Apache-2.0) — not KAIRO's Aoede voice, not a person. `gcloud` had no
  active account for the agent; credential files were not read. `voice/generate-voice-aoede.mjs` is ready for the
  user (≈ 140 characters, five requests, no retries), then `make.py --from audio` (re-renders lip sync).
- **Student:** fictional generated stills from AD-STILLS-036. “Dramatisation.” super.
- **Interface:** reconstructed from real app copy (flow labels, “Check the source”, part 6 Squirrel cage, Operate
  caption, operate-mode practice prompt) plus real models. “Interface reconstructed for illustration.” super.

## Checks with actual results

ffprobe 9.0.2 `-count_frames` + FFmpeg null decode + blackdetect + PCM/EBU R128 (`qa/validate.py`), after the final
audio remux, all four files PASS: duration 20.000000 s, 600/600 frames decoded, 1920×1080, 30/1, H.264 High
yuv420p bt709, AAC LC 48 kHz stereo (19.989 s by design), no decode errors, no black segments, 0 clipped samples,
true peak −1.4 dBTP, −13.6 LUFS integrated, tail −107.7 dBFS, final-second change 0.76 (< 1.0). Measured lines:
24 KAIRO words + 11 thought words; chorus ends 2.85 s, KAIRO first speaks at 3.42 s; voice sits 13–27 dB over
music/FX on KAIRO lines and 8–15.5 dB on the thoughts. Details: `docs/kairo-ad-production-20261024/QA.md`.
Visual QA: contact sheets and ≈ 40 checkpoint stills inspected; six defects found and fixed before final encodes.

## Judging criteria served (claims limited to what is shown)

Product — one supported journey (material → cited lesson → motor → practice → kept working). Creativity — the
worries become the path; the diagram line becomes the motor. Usability — one sentence per beat, captions,
silent cut; comprehension untested. Presentation — human open, KAIRO by 3.4 s, proof, brand hold. Intelligence —
source check shown, no invented powers. Sustainability/Impact — not evidenced by an advert; nothing claimed.

## Open / next

1. **User:** decide which cut to submit and confirm eligibility (programme says “record yourself”; fictional
   presenter/synthetic voice unconfirmed; noon vs 13:30 unresolved). Nothing was uploaded or submitted.
2. **User:** `gcloud auth login`, run the Aoede generator; or record entrant lines (CAPTURE-LIST.md E1–E3).
3. **User:** real product captures P1–P6 to replace the reconstructed interface (CAPTURE-LIST.md).
4. Render reduced-motion and entrant cuts; re-render silent to apply the caption/super spacing fix.
5. Human acceptance: one-viewing question, phone speaker, muted viewing (ACCEPTANCE.md).
6. Codex REQ-001 (agency close frame) posted as bus message 132 for v0.2; no receipt assumed.
7. 9:16 only after the landscape master is accepted and the need confirmed.
