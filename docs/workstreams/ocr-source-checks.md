# Local OCR source identity checks

Four mapped local originals were checked against their current inventory metadata: two PDFs and two single-frame PNG images. Their actual page/frame counts were 2, 3, 1, and 1. The selected page numbers fit within those reported bounds. One planned scan candidate remains excluded because its inventory mapping is unresolved.

Before reading bytes, each mapped file's size and modified time matched its current inventory record and stayed stable during the check. Each file was at most 8 MiB. A SHA-256 digest was computed locally and stored only in the private evaluation report; the inventory had no prior content hash to compare, so these are current check digests, not verified baseline hashes.

The installed local tools used were pypdf 5.9.0 to read PDF encryption/page-tree metadata and Pillow 12.3.0 to check PNG type, dimensions, and single-frame metadata. Metadata inspection ran in a child process with a 10-second timeout per file. No PDF text was extracted, and no image pixels were rendered, OCRed, or transcribed. No network, installation, original-file write, or cloud service was used.

These checks establish current file type, inventory metadata agreement, current byte digests, and page-number bounds for the selected candidates. They do not establish source correctness, OCR quality, page content, candidate category correctness, or transcription accuracy. A later reviewed task must handle page rendering, OCR, and human transcription separately.
