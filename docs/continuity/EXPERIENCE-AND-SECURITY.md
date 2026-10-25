# Learner continuity and production path

22 October 2026. Implementation owner: codex-continuity-20261022-a. Current app is a local development application, not an authenticated multi-user service. The following separates this delivery from production gates.

## Experience direction

The user's supplied reference determines the palette: warm paper #f5f0e5, ivory #fffcf5, olive #526044, deep green #263d32, muted green #566455 and restrained brass (dark text #7b5823, decorative #a8894d). An alternate sage background stays within that family. Georgia gives headings a familiar book-like character; system sans-serif handles controls and body text without downloading fonts. The shared stylesheet no longer requests Google Fonts; older studios retain their existing local fallback stacks. Body copy is 16px with generous leading and bounded line length. Layout has a prominent next step, three distinct learning actions, saved reading and preferences; mobile collapses the same hierarchy. No avatar placeholder or fabricated skill score is used as decoration.

New route `/home` is intentionally additive. Existing studios remain available, with a small home link above them; their full visual migration awaits measured review. Copy names actions and outcomes: Open my material, Save reading copy, Download with notes, Save my goal. Engineering formulas and provenance belong beside relevant learning actions, not in generic navigation. Safety and source limitations remain where a learner makes a decision. This is the first implemented pass, not acceptance of every production screen.

## Delivered continuity

- An open lesson can be explicitly saved as a text-only reading copy: chapter text/examples, source title, revision, source passages, warning and save time. Five copies maximum, bounded aggregate storage. Copies do not include quiz answer keys, conversations, credentials, full original documents or cloud responses beyond the saved lesson itself.
- `/home` reads those copies, accepts separate reading notes and exports Markdown. A chosen goal and two reading themes are visible device memory. No hidden learning-style/ability inference or model training occurs here. No memory is injected into prompts or uploaded.
- The opt-in **production-build** service worker caches `/home` and static JS/CSS dependencies. No API/private/source/upload/voice response caching. Other studios/models/video are not downloaded as an offline pack. Static cached assets are used first; the home document uses network with a four-second fallback. On reconnect no submissions, sync, applications or paid requests are replayed.
- Clear reading memory removes this feature's storage/cache/worker; existing lesson profile, notes and teacher preferences remain separately managed. Copies are not encrypted account vaults: people with access to the browser can read them. No shared-device isolation is claimed.
- Device connectivity is only a browser signal, not proof the server or Google is reachable. Downloaded files remain the fallback if browser storage is unavailable or evicted. No accurate offline-ML/teacher claim is made from a cache.

Service workers require a secure context (with local development exceptions), and browser storage is quota/eviction dependent: [MDN service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [MDN Cache](https://developer.mozilla.org/en-US/docs/Web/API/Cache). Checked 22 October 2026.

## Next product increments

1. Device tests: cache installation, service-worker update, browser restart, airplane mode, quota failure, deletion, shared-device handling, 320px/reflow, keyboard/screen reader, slower network and high text zoom. Current automated VM tests are not browser acceptance.
2. Move reading copies/notes into versioned IndexedDB transactions with explicit storage estimate, crash recovery, multi-tab conflict detection and export-before-eviction. Keep revision-bound notes; never silently replace learner work.
3. Offline practice: ship a versioned authored rubric and task pack, retain first attempts/help and stable IDs, queue only private study events, then sync with conflict resolution and user-visible receipt. External actions must never enter a generic retry queue.
4. Optional device speech only after checking actual local availability. Small local retrieval over chosen source passages can precede local LLM inference; measure device memory, battery, download size, language coverage and hallucination before choosing a model. A fallback can stay useful without pretending to answer new questions.
5. Learner memory: editable “what I want you to remember” records with source, consent, scope, expiry, provenance and per-item forget. Separate preferences, factual self-reports, practice evidence and conversation summaries. Request-specific retrieval only. Cloud sync requires authenticated user isolation and deletion across replicas/backups, not just a frontend delete button.
6. Common app shell, consistent action vocabulary, accessible theme tokens, useful empty/error states and gentle interruption/resume across studios. Finish one end-to-end flow before extending every domain.

## Secure development lifecycle

Use [OWASP ASVS 5.0](https://github.com/OWASP/ASVS) for verifiable requirements, with [OWASP LLM risks](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf) for model/tool boundaries. Checked 22 October 2026. These are design inputs, not an OWASP compliance certification.

| Boundary | Existing evidence / this delivery | Required production gate |
|---|---|---|
| Local browser → app API | `studio/server.mjs` checks loopback host and same origin; server binds loopback. New worker skips API requests and auth headers. | Real authentication, CSRF/session protection where applicable, HTTPS configuration and browser/API tests before any public bind. Local host checking is not authentication. |
| User → data object | Current browser profile is device-local. Reading memory uses explicit schema projection and bounded fields. | Server-side owner/tenant checks on every object and operation; enforce role plus object ownership, uniqueness, foreign keys, immutable source revisions and transactional writes. RBAC alone does not stop another learner's ID being supplied. |
| Uploaded document/web → model | Existing source review, exact citations and tool mocks provide bounded foundations. | Treat extracted text/retrieved pages as untrusted data; prompt-injection evaluations, retrieval isolation, output schemas and server-owned action scopes. Never let a source grant permissions or supply shell commands. |
| Model → external action | Mock grant engine has revocation/idempotency boundaries but executes nothing. | Real isolated workers, allowlisted destinations/resources, least privilege, deadlines/cancellation, per-action consent, redacted receipts and no retry after ambiguous submission. No host terminal exposed to generated text. |
| Source/notes → screen/export | React renders saved text; reading packs have no HTML execution. | Contextual escaping, restrictive reviewed content rendering, CSP/headers tested on deployed origin, download review, malicious PDF/HTML/image fixture suite. |
| Offline device → sync | This delivery has no sync or external action queue. | Per-user encrypted transport/storage using managed key custody, scoped tokens outside browser persistent storage where architecture permits, version conflicts, revocation, consent and deletion. Authentication expiry must not turn private caches into a cross-user data leak. |
| App → Google/providers | Existing explicit speech consent and bounded provider routes; new memory stays local. | Per-user/budget rate limits, request deadlines, provider outage recovery, secret manager, log redaction, retention controls, abuse handling and auditable costs. |
| Build/dependencies | No new dependency in this delivery. | Inventory/licences/SBOM, pinned reproducible releases, dependency and secret scanning, source/code review, isolated CI, upgrade/rollback testing and incident process. |

Release evidence must cover authorization negatives, tenant separation, injection/SSRF/path traversal, upload limits, rate/compute abuse, poisoned retrieval, broken tool permissions, accessible failure states, backup restore and delete. Set a small measurable acceptance gate for each feature; passing a local build is not release acceptance. A full system threat model needs the actual hosting/auth/data-retention design; this is a scoped design record, not that completed assessment.

## Post-quantum cryptography

The names requested are ML-KEM (key establishment), ML-DSA and SLH-DSA (signatures). They address different cryptographic jobs; “ML” here does not mean machine learning. See NIST [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) and [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final). Checked 22 October 2026. No post-quantum library or custom cryptography was added.

First inventory TLS, signing, tokens, storage encryption, key lifetimes and provider support. Use maintained managed/platform implementations and reviewed migration options when justified by data lifetime and threat model. Do not put KEM/DSA code in UI controls or claim it fixes weak authorization, injection, compromised devices or leaked API keys. Quantum computing is not required to run these algorithms; local machine-learning adaptation is a separate product decision.
