# Data and visible extraction handoff

Root codex-data-visible-20261024-b; Codex gpt-6, effort unknown; tasks DATA-VISIBLE-015 and NATIVE-MOUNT-016. Read rules/status/inbox, respected active claims, published worker interfaces before dependent changes. Requested gpt-6-luna/low workers; use actual worker registrations as evidence rather than infer effective settings from request.

Changed root paths: workspace/routes.mjs, workspace/native-extraction.mjs, workspace/types.ts, workspace/SourceWorkspace.tsx, cloud-library/store.mjs and tests/native-extraction.test.mjs; docs/data-visible-20261024. Worker UI is a separate stateless extraction-summary subtree; data catalogue is docs/data-catalogue-20261024. Root reviewed real files and mounted the panel.

New non-image uploads use bounded native adapter (100 units), validate source hash, retain <=100 review sections within 48k characters/64KiB extracted UTF8, show unknown/skipped/failed/omitted coverage. Native-PDF comparison uses actual locator page number. Existing image OCR preserved; PDF with insufficient native text uses labelled four-page OCR fallback. Cloud reviewed-text snapshot accepts100sections/48kchars under existing220KiB ceiling and hash/consent/write-precondition rules. AI lesson input remains first12k reviewedchars. Existing saved/imported material not retroactively re-extracted.

Evidence: focused actual HTTP upload→review→lesson/citation and cloud-copy suite13/13; full562/562; worker actual component SSR4/4; TypeScript/Vite build passed. See docs/data-visible-20261024/README.md, verification.json, focused-tests.txt, full-tests.txt, build.txt and preview-health.json. No browser/device/audio validation, private material or model requests.

Dataset catalogue distinguishes current metadata/synthetic fixtures from unacquired references, research-only or rights-restricted datasets. BigQuery is not mounted/provisioned by this wave; its proposed role is minimal consented analytics, separate from Firestore/GCS/cited retrieval. No claims of big-data training, learning efficacy, employment prediction or continuous SASL. Root-reviewed catalogue records edition-specific OpenStax rights and noncommercial dataset limits.

Remaining: client login and owner-scoped source/lesson migration; full structured material review/search beyond bounded text; OCR/diagram interpretation with provenance and fixture evaluation; goal-relevant retrieval instead of first12k prefix; hosted end-to-end engineering journey. Keep current local APIs private, C identity/KAIRO/reading/cancellation, browser restriction and schedule off. No Claude receipt assumed.

Judging: Product and Usability through real longer-file flow and honest coverage; Sustainability through bounded local work and managed-storage compatibility; Intelligence separates extracted evidence from interpretation. Impact/Creativity/Presentation still need learner-visible outcomes and human evaluation.
