# Original material viewer

The source workspace can reveal an explicitly retained PDF or image when the learner chooses to open it. PDF pages map to extracted section index + 1 and are bounded to the first four pages. Original downloads remain attachment-only. Missing originals are reported as unavailable; extracted text remains available.

PDF rendering uses the installed PDF.js module with `isEvalSupported: false`, cancels render work on teardown, destroys the PDF loading task, and caps the canvas at 4096 pixels per dimension and 12 million pixels before allocation. The component owns no persistence or network API beyond the fixed same-origin original endpoint already provided by the host contract.

The focused tests load the actual component through Vite SSR and use deterministic mocks for fetch/PDF behavior. They do not establish browser/device rendering or acceptance of a real source file.
