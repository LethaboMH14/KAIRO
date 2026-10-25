# Artifact panel contract (proposal)

**Status:** design contract for review; no renderer or sandbox implementation is included.  
**Scope:** backlog items 12.05 (artifact panels) and 12.08 (sandbox generated HTML).  
**Owner/research:** Codex, `gpt-6-luna` / low, 22 October 2026.

## Decision

Start with a versioned, renderer-neutral data envelope and a non-executable set of views. Arbitrary HTML, JavaScript, document URLs and browser navigation are not v1 payloads. A future interactive preview must be a distinct capability with its own reviewed runtime boundary; it must not be enabled by merely changing a MIME type or passing a string to `srcdoc`.

The browser can enforce iframe sandbox restrictions and CSP directives when the application supplies them correctly. Those controls do not provide CPU, memory, wall-clock, output-size or process isolation quotas. The application must bound input and rendering work before it reaches a browser surface. If active code is ever required, a separately controlled worker/process with explicit resource and network policy is still needed; browser sandboxing alone does not provide those controls.

## Proposed envelope

Use JSON-compatible data with a required schema version. Keep payloads typed and bounded; do not accept arbitrary paths or fetch URLs.

```ts
type ArtifactPanelV1 = {
  schemaVersion: 1;
  artifactId: string;       // opaque stable ID, bounded length
  title: string;            // plain text, bounded length
  kind: "text" | "image" | "table" | "document-preview" | "video-reference";
  provenance: {
    sourceId?: string;      // opaque ID, no filesystem path
    sourceRevision?: string;
    page?: number;
    label?: string;         // plain text
  };
  payload:
    | { type: "text"; text: string }
    | { type: "image"; mediaType: "image/png" | "image/jpeg"; data: string; width: number; height: number }
    | { type: "table"; columns: string[]; rows: string[][] }
    | { type: "document-preview"; pages: Array<{ page: number; imageArtifactId: string }> }
    | { type: "video-reference"; provider: "local"; mediaArtifactId: string };
};
```

This is a proposed boundary, not a committed code API. Consumers should reject unknown schema versions and unknown fields or project only an explicit allowlist. Validate all strings, counts, dimensions, encoded bytes and cross-artifact references before allocating/rendering. Any limits must be centralized, documented, and checked both at ingestion and display time. A failure should produce an unavailable panel with a safe reason code, not partially render a truncated payload.

The `document-preview` and `video-reference` variants describe app-managed references to separately validated local artifacts. They do not authorize an arbitrary document URL, native plugin, remote frame, or browser navigation. Initial implementation can omit these variants until a local provider contract exists.

For the first static HTML-like presentation, build DOM nodes from trusted application templates and insert learner/source strings as text (`textContent`). Do not interpolate payloads into HTML strings. If a fixed generated document is placed in an iframe, use `srcdoc` only for an app-authored shell containing validated data rendered as text; set an empty `sandbox` attribute, with no `allow-*` tokens. Keep styles fixed and application-authored. Do not include raw supplied markup, scripts, event-handler attributes, forms, objects, embeds, nested frames, SVG or CSS URL/import values.

If a later interactive artifact is approved, define a separate `interactive-v1` contract and threat review. It should run in a sandboxed frame without `allow-same-origin`, forms, popups, downloads or top navigation. `allow-scripts` is an explicit code-execution capability, not a display option. Opaque-origin messages require special treatment; preferably the static v1 panel has no message channel. Never combine `allow-scripts` and `allow-same-origin` for same-origin content: the child may be able to remove its sandbox and reload. The HTML Standard documents this escape concern and recommends a separate site for potentially hostile content that could otherwise be navigated to directly.

## Browser boundary and limits

The HTML Standard specifies that a sandboxed frame without the `allow-same-origin` token receives an opaque origin; scripts and forms are disabled by default, as are popup creation, downloads and top-level navigation. Tokens selectively restore capabilities. A `srcdoc` document ordinarily inherits the embedding document's origin, but the sandboxed-origin flag changes that to an opaque origin. Relative references in `srcdoc` resolve against the embedding document URL, so a restrictive resource policy and no supplied `<base>` are important.

Use CSP as defense in depth. For an app-authored static preview, a restrictive policy can deny default loads and explicitly permit only the exact data the template needs, while `base-uri 'none'`, `form-action 'none'`, and `object-src 'none'` close common routes. A CSP delivered in a meta element cannot supply framing protections, CSP sandboxing, or reporting; the parent iframe's `sandbox` attribute remains necessary. A response header is preferable where the application controls a response. In a `srcdoc` document, policy and framing details need browser verification before implementation.

Opaque origins serialize as `"null"` in message events and do not identify one unique sender. If a future interactive panel uses `postMessage`, verify `event.source` against that panel's exact `contentWindow`, validate a strict versioned schema and bounded message size, and treat every field as untrusted. `event.origin` reflects the sender origin when it sent the message and may not describe its later state. An opaque-origin target may require `"*"` as `targetOrigin`; that makes exact source-window validation and a minimal channel especially important. Do not use `"*"` as a general shortcut for ordinary origins.

The iframe sandbox and CSP are browser-enforced capability controls, subject to correct configuration and browser behavior. They do not cap CPU time, memory, DOM size, decoding cost or total process usage. They also do not make an unbounded payload safe to parse. Enforce byte, character, row, page, image-pixel, nesting and render-work limits before decoding; provide a wall-clock watchdog and a disposable worker/process if active computation is later introduced. Browser-specific PDF viewers may not be controllable as ordinary sandboxed document content, so prefer an app-managed raster/text preview over embedding an arbitrary PDF viewer.

## Threat cases

| Threat | v1 response | Boundary / open check |
| --- | --- | --- |
| Markup or script injection through title, source excerpt or generated text | Render as text in fixed DOM; reject raw HTML payloads | Validate every rendering path; CSP is defense in depth, not a substitute for context-safe output |
| Same-origin access from preview | Empty iframe sandbox; no `allow-same-origin` | Test deployed frame configuration; never permit the script + same-origin combination for same-origin content |
| Remote resource beacon or data exfiltration | No arbitrary URLs; no nested browsing content; restrictive CSP | CSP blocks only covered browser fetch paths; validate data URLs/media types and test actual CSP behavior |
| Base URL or relative URL rewrite | No supplied markup or URLs; `base-uri 'none'` in fixed shell | `srcdoc` relative URL resolution uses the embedding URL; check all generated references |
| Form submission, navigation, popup, download | No form/link controls in v1; leave sandbox tokens absent | Browser sandbox defaults and tokens must be reviewed on every iframe change |
| Forged or oversized `postMessage` | No v1 message channel; future channel checks source, version, schema and size | Opaque origin reports `"null"`; origin alone cannot identify the sender |
| Large image/table/document causes memory or decode exhaustion | Preflight bytes, dimensions/pixels, counts and aggregate budgets; fail whole artifact safely | Browser iframe sandbox does not provide memory/CPU quotas |
| Infinite loop or costly script in future interactive content | Not allowed in v1; future interactive runtime requires watchdog and separate resource controls | Sandbox constrains capabilities, not execution time or CPU |
| Browser-native PDF/media viewer behaves outside expected iframe controls | Use app-managed bounded previews where feasible | Verify supported browsers; do not claim native viewer isolation from iframe attributes alone |
| Malformed/unknown version or dangling reference | Reject with non-sensitive reason code; no partial output | Keep schema migration explicit and test unknown versions/revisions |

## Validation needed before implementation

Implementation should add adversarial tests for schema/version rejection, byte and pixel limits, malformed references, rendered text containing HTML-looking input, and CSP/sandbox configuration. Browser acceptance must inspect the actual frame attributes and attempt representative blocked operations in supported browsers. Those tests can establish configured behavior for those cases; they cannot demonstrate general resource isolation. Document the browser matrix and keep runtime limits as separate controls.

No runtime changes or browser tests were performed for this contract. This proposal makes no claim that any current panel is sandboxed or that generated artifacts are safe to execute.

## Primary references

- [WHATWG HTML Standard: iframe sandboxing and `srcdoc`](https://html.spec.whatwg.org/multipage/iframe-embed-object.html)
- [WHATWG HTML Standard: origins and `about:srcdoc`](https://html.spec.whatwg.org/multipage/document-sequences.html)
- [MDN: `<iframe>` reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
- [MDN: `Window.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [MDN: Content-Security-Policy response header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy)
- [MDN: CSP `base-uri`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/base-uri)
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
