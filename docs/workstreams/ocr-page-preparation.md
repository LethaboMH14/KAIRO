# Local first-page preview preparation

Four mapped local sources produced four private first-page PNG previews: two PDF renders and two re-encoded PNG previews. The unresolved planned scan candidate was not opened or replaced. The previews and their source mappings remain in the private evaluation area and are not embedded or linked here.

Before processing, each source was checked against the prior private identity record. PDF page canvas bounds and PNG header dimensions were checked before raster allocation or decode. PDF output scale was reduced as needed to fit the declared limits. Every source identity remained unchanged after processing.

The run used pypdfium2 5.6.0 and Pillow 12.3.0. Limits were four inputs, 8 MiB per source, 20 seconds per metadata/render subprocess, 1.5 maximum PDF render scale, 2,200 maximum preview edge, 4 megapixels, 3 MiB per output, and 8 MiB total output. The actual output batch was 562,432 bytes.

This work prepared previews only. It did not OCR, extract text, transcribe, identify question categories, verify answers, or produce gold data. Page images still require separate human review; no accuracy or source-correctness claim follows from successful rendering.
