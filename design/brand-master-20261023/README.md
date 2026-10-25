# KAIRO C pathmark — fitted vector master

**BRAND-MASTER-001** · Claude (`claude-classroom-20261023-a`, Opus 5.5, effort max) · 23 October 2026.
**Status:** editable master built and measured against the user-selected reference. Not yet user-accepted, print/embroidery tested or trademark cleared.

Authority: [selected reference](../app-experience-20261023/assets/brand-reference.png), sha256 `2bfd5fbe…d6390b`, and [BRAND-DECISION.md](../../docs/blueprint/experience/BRAND-DECISION.md). The reserved sharp/serif alternative was not used.

## What the mark is

Two constant-width strokes with rounded construction:

- **Stroke A** runs from the foot, round the open loop of the stem, and out along the long lower leg.
- **Stroke B** is the detached upper arm.

The top edge, the foot and the arm share one angle (28.7°); the lower leg mirrors it at 26.3°.

The two terminals that face the lower leg are cut **parallel to that leg**, which keeps both gaps beside it an even width. The outer terminals are semicircles. This detail was found by measurement, not assumed. A first model with round ends left a 7–8 px wedge at both inner terminals, in the primary *and* the reversed rendering. Left to choose freely, the fit put the foot cut at 26.4° and the arm cut at 27.0°, against the leg's 25.9°.

The wordmark is constructed from stems, chevrons, a bowl and a rounded-rectangle O. It contains no font.

## Measured fidelity

All measurements are in pixels of the reference: the symbol is 198 px wide and the cap height is 46.7 px. The numbers come from `fit/*.json`. IoU here is the shared area of the half-coverage masks.

| Comparison | IoU | Edge error, mean / p95 / max |
|---|---|---|
| Symbol, free fit (every parameter free) | 0.956 | 0.59 / 2.0 / 2.8 |
| **Symbol master** (regularised) | **0.948** | **0.72 / 2.0 / 3.0** |
| Master vs free fit (cost of regularising) | 0.971 | 0.40 / 1.0 / 2.8 |
| Master vs the generated reversed panel, scaled 0.79 | 0.869 | 1.46 / 3.2 / 4.2 |
| Wordmark, free | 0.977 | 0.13 / 1.0 / 2.2 |
| **Wordmark master** | **0.975** | **0.14 / 1.0 / 2.2** |

The reversed panel is a separate generated rendering and differs from the primary one by about 1 px at its smaller scale. The primary rendering is the authority.

SVG round-trip area error is 0.026–0.076%: the files are re-parsed and compared with the geometry in `master/geometry.json` → `checks`. No master file contains `<text>` or a font reference.

## Intentional adjustments

These are recorded changes from the generated picture:

1. One stroke width (30.2) for both strokes, shared angles, and semicircular outer terminals. This costs 0.40 px of mean edge error against the free fit.
2. The A keeps heavier diagonals (12.6 against 11.3 for K/R) and a 0.7 px apex overshoot. Both are standard optical corrections for a pointed A without a crossbar. Forcing the K/R weight on it cut its overlap with the reference from 0.983 to 0.901.
3. The **horizontal lockup is constructed, not measured**: the symbol is 1.4 cap heights tall, centred on the cap height, with a 0.55 cap gap. The stacked lockup keeps the reference's own spacing and its slight optical offset of the symbol to the left.
4. **Micro mark.** Below a 32 px symbol height the master's arm merges with the leg, and at 16 px and under its counter closes. The measured topology is in `geometry.json`. The micro mark has a 0.8× stroke and shortened inner terminals, and stays intact from 12 to 32 px. The app module switches to it below 32 px.

## Files

- `master/`: symbol (moss, graphite, chalk), micro mark, wordmark, stacked and horizontal lockups (moss and chalk), the horizontal lockup with the micro symbol (for lockups under about 55 px tall), plus `pdf/` vector PDFs. The viewBoxes include clear space.
- `applied/`: app icon, favicon, Rain shirt badge, and phone, document, presentation and pattern mockups as SVG. The previews in `proofs/applied-*.png` are drawn from the same drawing list as the SVGs.
- `proofs/`: master overlays on the reference, size ladder, lockups on every ground, header and icon sizes.
- `tools/`: the fits (`fit_symbol.py`, `fit_wordmark.py`), `build_master.py`, `build_applied.py` and `export_outputs.py`. Each script reruns from the project root.
- The app copy is `studio/src/experience/brand/markArt.ts`, generated with source SHA-256 values.

## Use

- **Clear space:** X = one symbol stroke width on every side. For the horizontal lockup, 0.5 cap height.
- **Minimum size:** symbol 32 px or more for the master, micro mark below that. The horizontal lockup is legible at 24 px tall, but use the micro mark in it below 32 px.
- **Colour pairs (WCAG contrast):**

  | Pair | Contrast | Use |
  |---|---|---|
  | moss on chalk | 7.5 | logo and text |
  | chalk on moss | 7.5 | logo and text |
  | graphite on chalk | 12.7 | logo and text |
  | moss on sage | 3.73 | logo only, not small text |
  | sage on chalk | 2.01 | decoration only |
  | copper on chalk | 3.38 | accents and large text only |
- **Rain's shirt:** the badge is chalk on the shirt colour #5B6C54 (4.97:1). Moss on that shirt is only 1.51:1, so it is not used. The 3D badge is symbol-only, because the wordmark would be about 3 px tall in the classroom's wide shot.

## Provenance and licences

The reference is the user-selected image-generated board. Every master path is new geometry constructed by fitting simple strokes to its pixels. Nothing was traced from a font or copied from another mark.

Manrope (SIL OFL 1.1, shipped at `studio/src/experience/fonts/OFL.txt`) appears only as body text in the mockups and is not part of the logo. Tools used: Python 3.11 with numpy, scipy, shapely, OpenCV, Pillow and matplotlib. No paid generation, upload or network call was made.

## Limits

- No similarity or trademark search was done. Selecting a direction is not legal clearance.
- Not physically tested: embroidery, print, photocopy and projection. The small-size checks are rasters, not device screens.
- The user has not yet compared these masters with the reference. Generated-image noise means "precise" here means within about 1 px of the authority picture at its native size.
