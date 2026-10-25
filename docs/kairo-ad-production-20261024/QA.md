# QA — KAIRO “When it clicks” v0.1

Produced by `design/kairo-ad-20261024/qa/validate.py` (raw results: `design/kairo-ad-20261024/qa/validation.json`).
Each file was probed with **ffprobe 9.0.2** (`-count_frames`, i.e. a full decode of the video stream), decoded again
in full by **FFmpeg** to a null sink (errors captured), scanned with `blackdetect` (≥ 92 % of pixels below 8 %
luma for ≥ 0.05 s), decoded to PCM for clipping and tail checks, and measured with `ebur128` (true peak).
“Final-second change” is the largest mean absolute difference between consecutive frames in the last second at
192×108 (film grain averages out at that size); under 1.0 means the end card is holding still.

| Cut | Result | Duration (s) | Frames decoded | Video | Audio | Size | LUFS-I | True peak | Clipped | Tail RMS | Final-second change | Black segments |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| master | PASS | 20.000 | 600 | h264 High 1920×1080 30/1 yuv420p | aac 48000 Hz ×2 | 68.0 MB | -13.6 | -1.4 dBTP | 0 | -107.7 dBFS | 0.763 | 0 |
| master-web | PASS | 20.000 | 600 | h264 High 1920×1080 30/1 yuv420p | aac 48000 Hz ×2 | 23.8 MB | -13.6 | -1.4 dBTP | 0 | -107.7 dBFS | 0.69 | 0 |
| silent | PASS | 20.000 | 600 | h264 High 1920×1080 30/1 yuv420p | aac 48000 Hz ×2 | 67.0 MB | -13.6 | -1.4 dBTP | 0 | -107.7 dBFS | 0.967 | 0 |
| review | PASS | 20.000 | 600 | h264 High 1920×1080 30/1 yuv420p | aac 48000 Hz ×2 | 66.7 MB | -13.6 | -1.4 dBTP | 0 | -107.7 dBFS | 0.753 | 0 |

All cuts pass every automated check.

Audio stream length is 19.989 s (937 AAC frames of 1024 samples) by design, so audio never extends the 20.000 s
video; the score is silent from 19.85 s. The MP4 container reports exactly 20.000 s.

## Measured voice placement (temp voice)

| Line | Speaker | Start | End | Measured speech (s) | Text |
|---|---|---|---|---|---|
| c1 | Student thought | 0.18 | 1.23 | 1.05 | Will I pass? |
| c2 | Student thought | 1.12 | 2.35 | 1.23 | Where do I start? |
| c3 | Student thought | 1.62 | 2.85 | 1.23 | Can I prove it? |
| k1 | KAIRO | 3.42 | 4.48 | 1.06 | Meet KAIRO. |
| k2 | KAIRO | 5.12 | 7.26 | 2.14 | Bring your material. Check the source. |
| k3 | KAIRO | 8.30 | 11.14 | 2.84 | Explore the motor. Practise explaining why. |
| k4 | KAIRO | 12.45 | 13.96 | 1.51 | Keep work you can show. |
| k5 | KAIRO | 17.72 | 19.50 | 1.78 | KAIRO. Put knowledge to work. |

Mix (before AAC): integrated -13.6 LUFS, true peak -1.5 dBFS,
LRA 6.0 LU. Placement problems found by the audio build: none.

## Visual inspection done

- Contact sheets (one frame per second) for every cut: `design/kairo-ad-20261024/qa/contact-sheet-*.png`, inspected.
- Before encoding: QA stills at checkpoints across all six beats (`design/kairo-ad-20261024/qa/stills/`), inspected
  and corrected (crash in 5.0–5.75 s, missing ✓ glyph in Manrope, connector crossing text, card/motor overlap,
  caption/super collision, reduced-motion motor match). This stood in for a separate moving proof clip.

## Not checked by machines

Phone-speaker intelligibility, comprehension after one viewing, voice quality and taste, colour on other displays,
and organiser format acceptance. See ACCEPTANCE.md.
