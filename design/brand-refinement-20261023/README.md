# KAIRO — selected C, refined with A

**User direction, 23 October 2026:** C is selected for now. Preserve its warmth, typography, material depth and abstract cover graphics; explore A's distinctive spatial symbol as support. This is refinement of the chosen direction, not a fourth unrelated brand or a request to choose all over again.

Open [the refinement gallery](index.html). Two image-generated applied studies are paired with actual outlined vector artwork and exact-size reproduction studies.

## Identity hierarchy

1. **Primary:** the KAIRO serif wordmark. Use it alone where the name and editorial tone should lead: documents, headers, notebook covers, signage.
2. **Secondary:** the A-derived architectural passage symbol. Two planes open a negative-space channel: a visual interpretation of moving from knowledge into possibility/action. It is a design metaphor, not an established meaning of the name.
3. **Combined lockup:** use deliberately on introductions, posters and formal branding. Do not force two large marks into every corner.
4. **Graphic language:** oversized cropped symbol contours/open passage lines for covers and quiet backgrounds. This is supporting artwork, not an additional logo.
5. **Material treatment:** raised lettering, emboss/deboss or restrained foil may add depth. The core mark stays flat and recognizable; shadows/metallic effects are not required parts of it.

## What is actually editable

- `vectors/kairo-wordmark-forest.svg`, `kairo-wordmark-ivory.svg`: transparent, fully outlined letters, no font dependency.
- `vectors/kairo-symbol-forest.svg`, `kairo-symbol-ivory.svg`: flat two-path geometry, transparent.
- `vectors/kairo-horizontal-forest.svg`, `kairo-horizontal-ivory.svg`: horizontal symbol/name pairing.
- `vectors/kairo-stacked-forest.svg`: stacked study.
- `vectors/kairo-passage-pattern.svg`: cropped architectural contour study.
- `vectors/kairo-vector-proof.svg`: flat design/palette review plate.
- `vectors/kairo-reproduction-proof.svg`: actual 16/24/32/48/64/96 px symbol placements, 96/160/320 px wordmark-width studies and inverse treatment.

The serif base is **Cormorant Garamond, weight 600**, from the [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond). Its SIL Open Font License and copyright are included in `fonts/OFL.txt`; source font is bundled locally, not installed globally. Glyphs are outlined with fontTools and pair spacing adjusted in `build_vectors.py`. This is licensed font-derived lettering, **not a claim to an original bespoke typeface**, and not a perfect tracing of the generated C image. Font SHA256 and geometry metadata are recorded in `vector-manifest.json`.

## Colour and background use

| Token | sRGB | Use |
|---|---|---|
| Parchment | `#F3ECDD` | Warm light surface, inverse symbol/thread on dark surfaces |
| Forest | `#1E332A` | Main logo/text, dark background, document covers |
| Olive | `#626B4D` | Teacher clothing, secondary field, restrained supporting text |
| Sand | `#CEBEA3` | Quiet material/background/pattern support |
| Ochre | `#B39356` | Small accent or material direction; not default fine text on parchment |

Computed contrast for intended flat colour tokens on parchment: forest **11.43:1**, olive **4.79:1**, ochre **2.47:1**. These are mathematical sRGB ratios, not measurements of generated images, fabric or print. A logo is not automatically subject to normal text contrast rules, but adjacent product text still needs accessible colours. Avoid ochre for small body text; keep the main logo forest/ink or ivory/white according to background.

- Cream shirt/paper: forest mark.
- Olive/charcoal shirt or forest field: parchment/cream inverse mark.
- Ordinary printer/photocopy: one-ink outline master, no essential deboss/foil detail.
- Small app tile/favicon: symbol, rather than squeezing the five-letter wordmark into 16px.
- Embroidery: start with icon only; choose thread/size after a real sample. Fine serif wordmarks may require a larger width or textile-specific optical version.
- Teacher model: the selected direction does not automatically alter texture/rig files. A separate claimed character task must test UVs, folds, mipmaps, distance and light.

No CMYK, spot-ink/Pantone or foil specification is inferred from screen RGB. Obtain process-specific proofs from the printer/embroiderer before production.

## Files and observed checks

- `C-led-refined-identity.png`: applied identity overview, generated from the actual vector proof plus the earlier C atmosphere reference.
- `C-led-material-study.png`: paper/cloth/detail material study using the same references.
- `vector-proof.png`: direct render of actual SVG artwork; no AI reconstruction.
- `reproduction-proof.png`: direct render of actual-size SVG study.
- `prompts.json`: full built-in image_gen briefs and reference roles.
- `reproduction-verification.json`: 10 SVGs parsed, no external links/scripts; 7 logo masters have no text/font dependency; hashes and token contrast calculations.

Mockups may contain typography or symbol variations caused by generation; the SVGs are the geometry source of truth. Root inspected the generated boards and actual vector render. Actual-size proofs are review material, not proof of human recognition, textile stitching, phone rendering or print survival. Next refinement should focus on symbol optical balance and fine-serif behaviour at small sizes; trademark screening and final selection still need their own work.

Rebuild locally with `python design/brand-refinement-20261023/build_vectors.py` and `python design/brand-refinement-20261023/build_reproduction.py`. These use the downloaded font and installed fontTools only; no network or application changes.
