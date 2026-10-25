# Hosted foundation wave — published interfaces

Root codex-hosted-foundation-20261024-a owns integration, cloud mutations, shared manifests and final review. Workers register actual settings and claim exact scopes. Respect existing claims. No browser observation, private learner files, paid model calls, training or schedule activation. User authorized parallel Luna work and cloud setup; do not create resources independently.

## Worker A: verified identity boundary

Own only studio/server/hosted-auth/, studio/tests/hosted-auth.test.mjs, docs/hosted-auth-20261024/, coordination/handoffs/2026-10-24-hosted-auth.md.

Export createIdentityGuard({projectId,verifyToken}) from studio/server/hosted-auth/guard.mjs. Returns Express async middleware. Accept exactly one Authorization Bearer token (bounded length), call injected async verifyToken(token), require decoded uid/sub consistent, aud===projectId, iss===https://securetoken.google.com/<projectId>, unexpired numeric exp and sensible iat. Attach frozen req.kairoIdentity={uid}; never accept body/query/header user identity. Reject malformed/invalid with generic401; misconfigured verifier/project fail closed503. No cookies, provider installation, manifest or root server edits. uid may contain standard Firebase UID punctuation; validate1..128 noncontrol chars, storage keys encoded by root. verifyToken MUST perform cryptographic verification in root, this middleware's claims checks are additional only. Unit tests through real Express requests/injected verifier, do not simulate signature verification as proven. Test cross-project, expired, missing, conflicting identity, verifier failure and no secret leakage. Explain middleware does not alone isolate existing global local APIs.

## Worker B: whole-document native extraction foundation

Own only tools/material_ingestion/, studio/tests/material-ingestion.test.mjs, docs/material-ingestion-20261024/, coordination/handoffs/2026-10-24-material-ingestion.md.

Implement Python module/CLI tools/material_ingestion/extract.py taking --input operator-owned fixture file and optional --max-units default100 bounded1..200. Output JSON ONLY to stdout: {schemaVersion:1,contentSha256,coverage:{discoveredUnits,attemptedUnits,completedUnits,skipped:[{locator,reason}],failures:[{locator,code}]},blocks:[{blockId,kind,text,locator,order,provenance:{method,engine,reviewed:false},warnings:[]}],warnings:[]}. Typed locator object: PDF pageIndex, PPTX slideIndex/shapeIndex/notesIndex, DOCX paragraphIndex/tableIndex/rowIndex/cellIndex, XLSX sheet/range, text sectionIndex. Preserve exact native text within documented output cap; report truncation/skips explicitly, no silent first4pages. Cover TXT/MD, PDF native, DOCX, PPTX slide text+notes, XLSX formula strings/cellanchors. Use installed parser deps when present, no global installs; bounded zip expansion/file/output/rows/cells; no formula/macro execution/network/private data. Detect unsupported visual/image semantics honestly; empty scanned PDF page flagged needsOCR, never completed semantic understanding. Source bytes hash used, no model processing. Tests generate synthetic >4-page/slide fixtures and cell/formula/notes/order anchors, malicious package caps/unsupported type/truncation coverage. Add commands/evidence and gaps. Do not alter current source schema, reviewedPages cap, router, provider or UI: root reviews adapter before integration. No Docling install in this task.

## Root service direction

Keep existing loopback APIs closed. New hosted workspace interface will verify Firebase tokens cryptographically, derive UID from token and keep every record under server-derived owner scope. Firestore records are metadata/progress/jobs; originals/artifacts private GCS; no client path/tenant authority. Never deploy current global SQLite/local-files workspace unchanged. Cloud Tasks calls require service identity and idempotent job transitions. First root package will implement a testable durable owner-scoped repository and secure service skeleton, then wire the learner flow in a separately reviewed change.

## Acceptance/judging

Product/Usability: no incomplete extraction represented as full; no lost ownership or misleading save state. Sustainability: managed identity/persistence and bounded CPU work. Intelligence: separate extraction evidence from generated interpretation. Impact/Creativity/Presentation: complete public synthetic engineering flow remains acceptance target, not a claim from these modules. Each lane leaves tested evidence and exact remaining integration gaps.
