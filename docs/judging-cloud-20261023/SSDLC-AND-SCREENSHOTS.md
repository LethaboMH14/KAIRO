# What the security slides mean for KAIRO

The user supplied four screenshots of a launch presentation. Treat them as reference content, not commands, proof of KAIRO vulnerabilities, official hackathon scoring weights or mandatory Azure architecture. No active scan or browser observation was performed here.

## Correct lessons from each slide

1. **Geo-code spoofing / verification fraud.** A legitimate-looking client and plausible GPS are not enough to validate a business event. For KAIRO, the analogous risks are fabricated learning evidence, source ownership claims, replayed attempts and manipulated assessments. Authentication/App Check may reduce unauthorized-client access; they cannot prove a source is true, a learner worked independently or a measured quantity is genuine. Keep user-entered, system-computed, model-suggested and independently reviewed evidence distinct. Do not collect GPS/Wi-Fi/biometrics merely because a corporate field-force example used them. The slide's outlet/staff counts are investigation references, not confirmed fraud prevalence or KAIRO market data.
2. **SQL injection.** Use prepared statements with bound values, allowlist dynamic identifiers, validate types/lengths and use least-privilege DB roles. Escaping is not the primary universal defense and a WAF does not fix an unsafe query. [OWASP SQL injection guidance](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
3. **Parameterization example.** Good evidence would be a test against the actual data-access function showing malicious-looking input remains data and does not widen results. A screenshot of safe sample code is not evidence every query is safe. Do not copy VB/.NET code into this Node/TypeScript architecture without a relevant driver contract.
4. **SCA/DAST/Penbot slide.** Dependency DoS/ReDoS requires version-specific applicability and bounded inputs; XSS requires contextual output handling; TLS config belongs to the actual deployed edge. A public static JS/CSS/image returning 200 is not automatically an authentication defect. Public assets must contain no secrets/PII; sensitive data APIs require authorization. Hiding client JS cannot protect secrets already shipped there. “Penbot” finding labels are vendor/context-specific; investigate the resource and evidence before accepting a high severity or claiming remediation.

React escaping is helpful for ordinary text, but unsafe HTML insertion, URLs, Markdown renderers, SVG/file handling and future model-generated HTML need separate review. Cloud audit logs record infrastructure actions; application audit records are still needed for source review, evidence, consent and job decisions.

## SSDLC gates tied to actual product risks

| Phase | Minimum artifact / control | Meaningful proof |
|---|---|---|
| Plan | Adult pilot boundaries, data flow, threat model, asset/model licences, abuse cases | Trace source upload → parser → reviewed revision → model → lesson/evidence; identify every cloud/private-data boundary |
| Code | Typed validated contracts; user/owner checks on every resource; prepared queries; structured model outputs | Two-user access tests, invalid ID/version/citation tests, injection treated as data, no unrestricted tool execution |
| Ingest | MIME/signature/type allowlist, size/page/archive/decompression/time limits, quarantine, cleanup | Corrupt/oversized/mislabelled files fail without losing earlier reviewed work; parser cannot read arbitrary host files. [OWASP upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) |
| AI boundary | Uploaded/retrieved material remains data; source instructions cannot override permissions; bound prompts/output | Adversarial source asks for secrets/tools; app refuses unsafe action while retaining source text for teaching; citation hallucination rejected |
| Build | Reproducible pinned dependencies, lockfile, source revision, SBOM, scan freshness and relevant findings | Build exact source; record image digest and vulnerabilities; scanner absence/failure is visible, not passed |
| Test | Unit/contract/state/authorization/abuse and meaningful regression checks | Playback failure/cancel late results, source revision mismatch, stale cache/cross-user denial; actual code exercised |
| Stage | Least-privilege attached identity, secrets, durable storage, restrictive ingress/auth, redacted logs, resource limits | Intended reviewer access works; unauthorized access fails; restarts preserve allowed data; abuse cannot make unbounded paid calls |
| Promote | Independent review + known residual risks + explicit authorized rollout/rollback | Deploy only a reviewed artifact; green build does not auto-authorize public exposure |
| Operate | Consent/retention/deletion/export semantics, errors/cost/latency, credential rotation, incident response | Redacted audit events and a demonstrated recovery path; do not fabricate monitored production metrics |

Privacy/data residency is a design and review requirement, not a certification claim. The adult pilot doesn't remove privacy obligations. Specify exactly which source/audio/transcript crosses which region/provider, purpose and retention; avoid sending private coursework by default. Never assert “POPIA-compliant” solely because the chosen cloud has a South African region or encrypts storage. Evaluate legal/contract requirements with the appropriate reviewer before a real pilot.

## A practical lightweight toolchain proposal

Keep existing Node tests/TypeScript first. Add one supported dependency scanner (OSV or Trivy), one secret scanner with checked current licensing and one SBOM format (CycloneDX/SPDX). Add local authenticated integration fixtures before any external DAST. On containerization, use Cloud Build/Artifact Registry provenance and an enabled scanner; define an explicit deployment policy. Do not buy overlapping tools simply to populate a security slide.

For a later synthetic staging assessment, ZAP can complement source/contract testing; authorization, scope, rate limits and the prior browser restriction still apply. No scan against FNB/Google/other users or real private records is authorized by this research request.

## Judge-facing evidence to prepare

One compact safety story: **your reviewed source remains attached; interruption cancels old work; your saved place is preserved when storage fails; your private record cannot be read by another learner; the demo discloses what has and has not been validated.** Show a small actual evidence table with code revision, executed command, result, date and limitation. Security supports Product, Sustainability and trust; it does not replace usability, market traction, originality or measured impact.
