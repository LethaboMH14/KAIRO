# Local OCR sample manifest status

The private evaluation manifest records five candidates from the existing OCR evaluation plan. This is metadata reconciliation only: it did not open, copy, render, extract, or OCR any original coursework. It creates no reference transcription or answer key and makes no accuracy claim.

Four candidates currently resolve to inventory records: two PDF candidates and two screenshot candidates. The planned scanned-MCQ candidate does not resolve to a record in the current inventory snapshot, so it remains explicitly unavailable. No replacement was inferred or selected.

All entries retain source role `unknown`, local-only disposition, and a human-review requirement. The inventory has no verified original-content hash field for these entries, so hashes are null and marked unverified. Page selections and counts for PDF candidates are prior-extraction snapshots; original page bounds have not been checked. The screenshot entries map to single-raster inventory records, but the original images were not opened for this task.

The private manifest contains inventory IDs and local source-path mappings. Do not copy those mappings, source names, source text, personal identifiers, or OCR outputs into public reports. The next review task must confirm each candidate and its page bounds before any rendering, OCR, or transcription. Current-user local study authorization remains limited to this workspace; this manifest does not authorize sharing or original-file modification.
