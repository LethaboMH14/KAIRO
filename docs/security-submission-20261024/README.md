# KAIRO SSDLC and HustleWindow submission pack

24 October 2026. These are prepared artifacts for the user; **nothing has been submitted to Sonke**. Two delegated research/test packages were independently reviewed. Browser observation remains restricted; no real learner uploads or camera input were used.

## Fill the five SSDLC fields

Use [the combined paste-ready text](SSDLC-PASTE-READY.md), or copy each field from its separate plain-text file:

1. [Security Requirements / Risk Assessment](01-risk-assessment.txt)
2. [Threat Modelling & Design Review](02-threat-modelling.txt)
3. [Development / Secure coding](03-secure-development.txt)
4. [Security Testing](04-security-testing.txt)
5. [Assessment & Secure Integration](05-secure-integration.txt)

The field names match the original screenshot saved in references/. The original launch/security slides and programme pages are also saved there. Their instructions are reference evidence, not evidence of KAIRO defects or permission to interact with the portal.

## What was actually done

- Investigated actual account, private API, storage, import, model and deployment paths.
- Reproduced email-rotation bypass of the original authentication/recovery rate limiter; fixed independent account/client/process limits, expiry and Retry-After. The security change is on IAM-private revision **kairo-app-00006-885**, at100% traffic.
- Final full regression **692 passed, 0 failed**;13 new adversarial cases plus7 extractor cases. Earlier focused account run20/20. Test files exercise real modules with narrowly mocked external services; they are not source-string assertions.
- Fresh live synthetic-account/API checks **18/18** pass: ownership, session/cookie/origin/worker/enrolment boundaries and IAM privacy. These are bounded API checks, not a hosted load/credential attack.
- npm audit reported **0 known advisories** in the checked npm dependency tree; CycloneDX production npm inventory saved. This does not cover Python/OS/image advisories or unknown vulnerabilities.
- Cloud configuration read-only evidence confirms enforced bucket public-access prevention/uniform access, zero user-managed runtime keys and the existing one-instance resource cap. Runtime Auth/Firestore roles remain broad enough to require further reduction/isolation review.

## Read the review and what remains

[Threat model/findings](kairo-threat-model.md) prioritises fixed and residual risks, including parser/runtime isolation, distributed abuse controls, broad permissions, deletion/retention, supply chain, AI misinformation and audit events. [Test and operations plan](TEST-AND-OPERATIONS-PLAN.md) lists exact tests run and future staging penetration-test gates. [Framework/PQC research](../security-frameworks-20261024/README.md) maps OWASP API/ASVS/LLM, NIST SSDF, MITRE ATT&CK/ATLAS and cryptographic migration guidance.

No claim of all vulnerabilities found, independent penetration-test certification, legal compliance, operational SOC, live-model injection immunity or end-to-end quantum-safe cryptography. The private security release keeps existing IAM restrictions; it does not resolve judge browser-access provisioning.

## HustleWindow

[Verified requirement interpretation and the recommended 37-word pitch](HUSTLE-WINDOW-DECISION.md) contains the original programme evidence, source-linked creative examples and a20-second shot/voice plan. [Delegated research alternative](../hustle-submission-20261024/README.md) includes a38-word founder/KAIRO option; the root recommendation is37words. Both are proposals, not finished videos. Word counts are checked; actual voice timing/footage remain pending.

The original programme explicitly requests a20-second recorded sales video and says record yourself. Its noon and13:30 deadlines conflict. Work to **Saturday24October12:00 SAST** internally until organisers/portal clarify. Traffic-light driver is the attention metaphor, not a reason to film in traffic. Aspect ratio, file limits and AI presenter eligibility remain unconfirmed. The public livestream page did not resolve those details. No video has been uploaded.

## Evidence

- RELEASE-STATUS.json: final status and counts.
- full-tests-final.txt: authoritative692-test result; earlier logs remain with their original scope.
- adversarial-before.txt / adversarial-after.txt: initial weakness and focused regression. Initial oversized-header status expectation was corrected to distinguish Node431 from Express401; no protection was weakened.
- live-api-check.json / cloud-config.json: dated fresh live API and configuration evidence.
- npm-audit.json / sbom-production.cdx.json: advisory report and npm inventory.
- image-revision.json / source-hashes.json / stage-evidence.json / deploy.txt: artifact/release records, no secret values.
- pitch-count.json: exact37-word root spoken-column count; no measured rehearsal claim.

Security supports Product and Sustainability through privacy and bounded failure, Usability through recoverable account controls, Intelligence through constrained model output, and Presentation through evidence-backed claims. Impact and commercial/learning outcomes still need validation; security framework names are not substitutes for that evidence.
