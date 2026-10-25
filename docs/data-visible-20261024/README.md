# Data and visible extraction integration

24 October 2026 SAST. Root codex-data-visible-20261024-b; exposed model gpt-6, effort unknown. Published interfaces: coordination/briefs/data-visible-20261024/CONTRACT.md.

BigQuery is not currently used by the application. Firestore is the private hosted progress foundation; Cloud Storage holds explicit private source copies; the full source/lesson workspace remains local. The data catalogue distinguishes teaching references, curriculum metadata, engineering examples, extraction fixtures and optional research datasets from private learner data. No dataset size alone establishes an intelligent product or learning benefit.

## What changed in My material

New non-image document uploads invoke the tested native extraction adapter rather than the old four-page prefix path. The app retains up to 100 native blocks for review, within 48,000 characters and 64 KiB of extracted UTF-8 text. Text omitted from review is counted. The byte cap leaves room for original and corrected text in the existing revision-store size limit. Content hashes are checked before accepting extraction; unrelated-file output cannot become the saved source.

The coverage panel separates native units found/tried/extracted from sections and characters ready for review. Unknown total remains unknown; reported skips, failures and omissions are visible. A skip report can summarize many units, so it is not a percentage. PDF comparison uses the actual page locator, including when a preceding page did not yield native text. A labelled section dropdown replaces a potentially huge row of page buttons.

Images retain the existing local OCR path. A PDF with no or insufficient readable native text falls back to the separately labelled first-four-page OCR preview. Native-text PDFs with skipped scanned pages report the missing content; this wave does not provide whole-file OCR or diagram/figure interpretation. Legacy imported course files and previously saved sources keep their old extraction; re-upload to use the new path.

Reviewed-source cloud copies now support up to 100 sections, the same 48,000 reviewed-character ceiling and unchanged 220 KiB snapshot limit. Revision hashing, explicit consent, immutable GCS write/read-back and deletion checks remain intact. Extraction metadata and original files are not silently added to the cloud copy. Lesson generation remains limited to the first 12,000 reviewed characters and says so; it is not a whole-book understanding claim.

## Data roles

| Data | Current use | Next justified use |
|---|---|---|
| Learner-supplied sources | Local extraction, human review, exact cited lesson inputs; optional explicit cloud processing/copy | Account-scoped material migration with the same source/revision boundary |
| Official curriculum metadata | Ten reviewed Wits module records and programme leads in a registry; not a full degree corpus or mounted enrolment system | Course/year onboarding and module-specific environments after registry integration |
| Public teaching material | Official discovery links and rights metadata, not an acquired full-text knowledge base | Edition-specific rights-cleared engineering/calculus packs with citations, learning objectives and practical checks |
| Engineering datasets | Research candidates only | Explicitly labelled practice experiments; do not treat synthetic machining or restricted bearing data as verified real motor/pump telemetry |
| Extraction fixtures | Generated public/synthetic PDF, DOCX, PPTX, XLSX and text used in automated tests | Separate permitted figure/OCR/formula evaluation with adjudicated answers |
| Learner attempts/progress | Local practice records and a separately tested hosted private progress API | Opt-in minimal evaluation events; a trained predictive model needs a defined outcome and held-out learner evaluation |
| Speech/SASL data | Research links and language capability matrix only | Lawful pretrained baselines and qualified speaker/signer evaluation before training or product claims |

See `../data-catalogue-20261024/catalog.json` and `DATA-ARCHITECTURE.md` for source-specific local status, licence evidence and adoption decisions. Publicly accessible is not synonymous with commercially reusable. Do not train on uploaded material by default.

## Where BigQuery fits

BigQuery would hold a separate, minimal analytics dataset for questions such as where users abandon extraction/review, which hints precede independent success, cost per completed lesson and extraction failures by format. It would not replace Firestore point reads, store binary uploads or make private content a shared training corpus. No analytics export, BigQuery dataset or ML training job was created in this wave.

Google lists Johannesburg `africa-south1` for BigQuery. Keep dataset/job/storage colocation explicit; remote model locations are separate. Use dry-run estimates and per-query `maximumBytesBilled` plus project/user quotas. Query allowances do not cover all storage, transfers or ML and are shared according to the selected billing arrangement. Official references: [locations](https://docs.cloud.google.com/bigquery/docs/locations), [pricing](https://cloud.google.com/bigquery/pricing), [query cost controls](https://docs.cloud.google.com/bigquery/docs/best-practices-costs).

Any proposed learning-event export excludes source text/files, CVs, free-text answers, names, emails and audio/video. Session pseudonyms are not automatically anonymous. Purpose, consent, retention, access and deletion must be decided before collection. Start with descriptive/rule baselines; no learning gain, employment outcome or future behaviour prediction is established by these fixtures or public datasets.

## Verification and remaining integration

Focused actual upload/review/lesson/cloud-copy tests: 13/13. Includes a real generated seven-page PDF, seven-section text, page-seven evidence anchors, UTF-8 byte bounds, stale-safe reviewed snapshots and unrelated-file rejection. Full regression suite: 562/562. Worker component SSR checks: 4/4. TypeScript/Vite build passed; existing large Three.js bundle warning remains. Final palette rebuild and preview receipt are recorded in their evidence files.

No private learner sources, model calls, browser observation or cloud resource creation were used for this integration. Native text is not semantic correctness or visual understanding. Public hosted login UI and account-scoped source/lesson migration remain separate work; this local workspace must not be exposed as a multi-user API. The schedule remains off.
