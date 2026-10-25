# KAIRO HustleWindow pitch mock

Primary rules source: [user-provided programme](<C:/Users/USER/Downloads/FNB AOTY Hackathon 2026 - Programme.pdf>), PDF pages 3 and 10. [Research and distinctions](RESEARCH.md).

Watch `../../design/hustle-window-20261023/kairo-hustle-20s-mock.mp4`, or open the sibling `index.html` locally for playback and scene buttons. `storyboard.jpg` gives six static keyframes. `voiceover.txt`, `captions.srt`, `timeline.json`, `render_mock.py` and `render-verification.json` preserve the script, timing and reproducible evidence.

## Edit plan

| Time | Picture | Purpose |
| --- | --- | --- |
| 0–4s | You at a laptop; three readable concerns pile up | Recognisable learner frustration |
| 4–7s | Clean KAIRO reveal, engineering learner audience | Name and offer |
| 7–11s | Material, source reference, moving motor diagram | Show how understanding becomes possible |
| 11–15s | Predict, observe, explain; keep working | Practical evidence rather than passive reading |
| 15–18s | Employer visibility and learning rewards, visibly proposed | Short extension toward work readiness |
| 18–20s | KAIRO lockup and “Put knowledge to work.” | Memorable close |

This re-imagines the user's multiwindow montage using three readable pressures rather than forty flashes. The source and motor sequence carry the core offer. The future beat can be removed if the final pitch needs more time for demonstrated product value. An alternative opening that preserves the user's earlier line is “I can read how a motor works. But can I explain it?”; rehearse it against the four-second slot before replacing the present opening.

## Before a submission

1. Replace the illustrated person with the user's recorded footage. The programme says record yourself; it does not establish an AI spokesperson as an eligible substitute.
2. Replace concept screens with actual supported app interaction. Preserve source visibility and show a real motor exercise. No browser observation or capture was performed for this mock.
3. Record the user's voice and rehearse. The offline synthetic guide has time compression, especially the opening and closing; it demonstrates sequence rather than final vocal craft. TTS spells the pronunciation as Cairo internally; visible branding remains KAIRO.
4. Check upload form aspect, file-size and media restrictions. 720p landscape H.264/AAC here is an editing choice, not a confirmed organiser specification.
5. Use Saturday 24 October noon SAST as the conservative internal deadline: programme p3 says noon, while p10 says 13:30. Confirm the conflict with the organiser.
6. Do not imply confirmed FNB rewards, payment, employment, improved marks, accredited skills or measured learning impact. The mock labels employment/rewards as proposed and all screens as illustrations.

## Validation and limitations

Rendered 480 frames at 24fps; decoded metadata confirms 1280×720, H.264, AAC and duration 20.0 seconds. Inspected the generated six-frame storyboard for clipping, brand, source/motor wording and future-feature labels. This does not establish browser/device playback acceptance, speech quality, final upload acceptance or organiser approval. Original drawings, local Manrope and the selected C logo are used; no external stock, unverified avatar portrait, music or paid generation. No deployment, portal write or final submission.

Rebuild from the repository root: `python design/hustle-window-20261023/render_mock.py`. Existing scratch WAV files are inputs; render requires installed Pillow, PyMuPDF and imageio-ffmpeg. HTML playback is local and has no external dependencies or autoplay.
