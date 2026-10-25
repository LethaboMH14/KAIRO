# In-app source workspace

Routes: `/sources` and `/learn?lesson=<id>`.

The source workspace connects the private extraction pilot to a learner-facing path. Select an extracted course document, paste text, upload a supported file, or try the authored shopkeeper sample. Uploads run through the existing Python extraction/OCR environment; processing is local and bounded to 8 MB, four pages/slides/sheets, and displayed text limits. The original course files are not modified.

Review each extracted section against your original, correct errors, check the acknowledgement and save. Citations use the reviewed text, mark corrections and retain section/page locators. DOCX sections are not invented page numbers. Empty/unreadable material cannot proceed.

Generate either:

- A local extractive reading lesson, which makes no cloud request and includes source recognition rather than subject mastery assessment.
- A Vertex lesson, after explicitly selecting the cloud checkbox. Up to 12,000 source characters and the learning goal go to the configured Google project. Three short chapters and two questions are requested; validated output permits 2–5 chapters and 1–4 questions. The preview permits one generation at once, 10 seconds between starts and twelve calls per server lifetime.

Both paths save immutable lesson snapshots and source citations privately in `data/private/app-workspace`, outside public assets and ignored by Git. JSON API responses omit original filesystem paths. IDs resolve only known private records; uploads use random local filenames, fixed executable arguments, timeout and size limits. The local API binds to loopback and checks origin/Host. It is not an authenticated multi-user public service and must not be publicly deployed as-is.

The studio uses the existing classroom with a dynamic board, chapter navigation, reading connection map, source inspection, browser narration, formative practice, personal notes and Markdown download. Reading view avoids loading the classroom model until selected on small screens or reduced-motion devices. Camera changes and motion controls remain available in spatial view.

Practice mistakes open supporting evidence and explain the change in help. Progress, notes and explicit lesson-format choice are saved in this browser under the lesson ID, with storage failures reported. This is transparent rule-based support, not a trained learner model or prediction of future outcomes. The exported record includes attempts, source revision, exact supporting excerpts and a clear non-accreditation label.

## Citation guarantees and limits

The backend rejects unknown chapter/question citation IDs, repeated answer choices and a practice supportQuote not found exactly in a cited passage. It validates structure and lengths. These checks establish traceability; they do not prove every paraphrase, inference or answer is correct. Student submissions and OCR remain uncertain sources. No official memo or external fact-checking is inferred. Sources are treated as data; document instructions do not grant tools or execution.

## Runtime

Use the installed `tools/course_sources/.venv-ocr/Scripts/python.exe`. Run `npm run build`, `npm test` from `studio`, then start the local server with the documented Google environment settings when cloud lessons are desired. Python OCR has no GPU requirement. Upload OCR can take up to two minutes; the UI polls a bounded job, reports errors and offers text paste recovery.

Google's [structured JSON documentation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/generativeaionvertexai-gemini-controlled-generation-response-schema-2) informed the constrained response schema. Credentials stay in the server process. There is no new automatic web search, YouTube fetching, avatar integration or MCP host installation in this change.
