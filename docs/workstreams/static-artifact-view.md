# Static artifact view

**Status:** isolated React renderer for validated v1 text/table artifacts; integration is not included.  
**Input boundary:** `unknown` is passed to `validateArtifactPanelV1` before any output is selected.  
**Component:** `studio/src/static-artifact-view/StaticArtifactView.tsx`.

The view renders only accepted text and tables. React receives strings as text children; no raw HTML, links, URLs, image loaders, network calls, frames, message channels, persistence or artifact-provided styles/scripts are used. Failed validation produces a fixed unavailable panel containing a safe reason, with no partial title, provenance or payload output. Repeated panels use React-generated IDs for their accessible headings.

Tables include a caption and scoped column headers inside a keyboard-focusable horizontal scroll region. Text remains selectable and preserves authored line breaks. Claimed source ID, revision, page and label are displayed as plain text beneath “Claimed source details — Not verified”; rendering these fields does not resolve or validate their truth. Cream/olive styles are fixed application CSS.

Focused SSR test command: `node --test tests/static-artifact-view.test.mjs` from `studio/`. The test verifies escaping, absence of links/media elements, accessible table structure, unavailable-state redaction and unique heading targets. This is markup-level verification only; it does not test browser layout, iframe isolation, general XSS resistance or resource quotas. No root route or product integration is claimed.
