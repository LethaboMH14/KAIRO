# Security test coverage and next acceptance gates

24 October 2026. Final run: **692/692 full-suite tests pass**, including 13 new root adversarial cases and 7 extractor cases. The earlier focused account/adversarial run was 20/20 including existing account tests; the additional process-wide budget check passed in the final aggregate. This is not a count of unique vulnerabilities and is not independent penetration-test certification.

## What ran

| Assessment | Actual evidence | Result and scope |
|---|---|---|
| White-box API abuse assessment | studio/tests/security-adversarial.test.mjs; adversarial-before.txt / adversarial-after.txt | Email-rotation weakness reproduced then fixed; tested actual Express routers/validators with synthetic local HTTP, mocked Firebase and provider. |
| Upload/parser abuse | studio/tests/security-upload-abuse.test.mjs; ../security-upload-tests-20261024/CHECKS.txt | 7 pass: disallowed types, signature mismatches, byte bounds, malformed Office, tiny archive declaring excessive expansion, native-result identity, actual truncated image extraction failure. No large bomb or malware execution. |
| Aggregate regression | full-tests-final.txt | 692 pass; includes prior private owner, revision/CAS, source, output rendering, camera/cancellation tests. Not every test is a security test. Earlier full-tests.txt records691 before the final middleware test was added. |
| Software composition analysis | npm-audit.json | npm audit reported 0 known advisories across its checked dependency tree. Freshness is this scan, not a continuous guarantee. Python/OS/image not covered. |
| Dependency inventory | sbom-production.cdx.json | CycloneDX production npm inventory. Includes package metadata, not a complete deployed-container SBOM or an attestation. |
| Read-only cloud posture | cloud-config.json | IAM remains private, bucket uniform access and public-access prevention enabled, zero user-managed runtime keys, max1 instance, 1 CPU/1GiB; broad runtime roles remain visible. No private objects read or env values exported. |
| Earlier real private API checks | ../experience-connected-20261024/live-judge-accounts.json and live-policy-assets.json | 19 synthetic account checks and 22 policy/pinned-asset checks passed on revision00005. Their earlier timestamp/revision must not be silently relabelled as a new run. |
| Fresh private API checks | live-api-check.json | 18 checks pass on the security release: synthetic sign-in/cookie flags/no-store, assigned curricula, owned lessons, cross-owner denial, invalid/missing sessions, origin denial, protected enrolment, worker-call denial and IAM privacy. No live rate flood or model request. |

No ZAP, Burp, Nuclei, Gitleaks or container vulnerability scanner was run in this wave. A custom regex search or green unit suite is not a substitute for those tools. No live adversarial model prompt was sent; deterministic projection/citation enforcement was tested. Browser restriction precludes browser DAST and real-device checks.

## Scoped next penetration-test plan

Before a wider assessment, use a separate synthetic staging workspace, defined revision and dedicated least-privilege accounts A/B. Inventory actual APIs and selected roles; use an allowlist of KAIRO-owned endpoints. No FNB, Google platform, LinkedIn or other-user targets. Keep low request rates, no real private uploads, no bulk account creation, no persistent exploitation, and stop on unexpected data, 5xx bursts or operator request. Current authorized work already covers local non-destructive cases; any broader third-party target or destructive/load test needs a separately agreed scope.

| Priority | Concrete scenario | Pass condition | Tool or method and gap |
|---|---|---|---|
| P0 | Every private verb/route with missing, expired, revoked and wrong-owner session; original blob, history and cancel paths included | No victim data/existence detail or mutation; auth runs before parsing expensive content | Actual authenticated HTTP harness, then a bounded ZAP API scan if browser/network scope allows. Current matrix covers a subset. |
| P0 | Parallel quota requests, lease retry, queue replay and cancellation during extraction | Durable quotas cannot overspend; late output cannot resurrect cancelled work | Deterministic transactional mocks plus synthetic staging concurrency. No saturation test yet. |
| P0 | Wrong task issuer/audience/service-account email, ordinary learner calling worker endpoint | Denied before job processing; replay remains idempotent | Actual OIDC-verifier mocks and staging task identity. Do not attack Google's identity service. |
| P0 | Parser malformed corpus: truncated PDF, Office links/macros, XML external entities, declared expansion, huge image dimensions | Failure bounded in time/output/memory; no outbound network or arbitrary filesystem access; prior data preserved | Unit corpus plus isolated worker/network instrumentation. Current process shares runtime identity; no strong sandbox claim. |
| P0 | Synthetic injection in goals, OCR/table text and documents requests secrets, another owner or tools | No unauthorized action/data; exact citations and output limits hold; semantic failures counted | Fixed adversarial evaluation corpus and consented model runs with request budget. Prompt wording alone cannot pass this gate. |
| P0 | Delete learner/source while job pending; inspect records, objects, soft-deleted copies and allowed backup recovery | User-visible retention semantics match actual behavior, no resurrection after deletion | Synthetic lifecycle fixtures plus provider retention review. Whole-account deletion not implemented. |
| P1 | Reduce runtime Auth/Admin permissions and split parser identity | Sign-in, reset, revocation, imports and ownership still work; parser cannot read unrelated records | Custom-role proof in isolated deployment; rollout/rollback before removing broad roles. |
| P1 | OS/Python/image/software supply chain; secret scan | Fresh digest-bound scan, reviewed applicable advisories, no private credentials in staged/public files | Trivy/OSV or Artifact Analysis; pip-audit; Gitleaks. Record scanner version/feed time and exceptions. Not run here. |
| P1 | XSS/URL/sandbox/header/CSV/formula attacks through every input and export | Text inert, safe links, no active original-document execution, no spreadsheet formula injection in exports | Real render/export tests and later browser DAST. Current React/citation tests are partial coverage. |
| P1 | Offline/session expiry/account switch, camera permission denial and cancellation during speech | No cross-account cached material; camera/audio stop; recovery is clear and earlier work retained | Human/device acceptance or separately authorised browser observation. Pending. |
| P1 | Redacted audit event and alert drill | Operator can reconstruct failed owner access/abuse/consent/job transition without recording content or credentials | Structured event schema, retention and error/abuse alerts; not yet an operational SOC. |

## Minimal incident and promotion runbook

1. Record affected revision, time, endpoint, pseudonymous correlation IDs and symptoms. Do not copy passwords, session cookies, private document content or raw prompts into tickets.
2. Contain the affected feature: pause import/model submission if necessary, retain private IAM gate and revoke compromised sessions or credentials. Preserve source/evidence needed for investigation; avoid blindly deleting records or widening ingress.
3. Assess exposure and who must be informed with the relevant privacy/security owner. Cloud region/encryption alone does not settle legal compliance or notification duties.
4. Reproduce using synthetic fixtures; fix one root cause; run affected tests and full regression when justified. Recheck source/image/dependency evidence for the new revision.
5. Promote only the reviewed private artifact. Roll back to a known revision if behavior regresses; verify data compatibility first. Old revision00005 lacks the new limiter fix, so rollback would reintroduce SEC-01 and requires compensating isolation.
6. Verify recovery, keep a finding/exception record with owner and next review date, and update paste-ready SSDLC text if claims changed. This runbook is prepared; an incident exercise has not been completed.

## Evidence boundaries from supplied launch screenshots

The saved screenshots are in references/. Their lessons translate to KAIRO as follows: parameterize actual database calls; separate learner-entered evidence from verified attainment; test dependency DoS/ReDoS by version and bounded input; escape untrusted output; inspect real transport settings; protect private APIs rather than assuming every public JS/image must be authenticated. The slides do not prove a KAIRO defect or require adopting their Azure/VB architecture. No supplied fraud statistic is reused as KAIRO traction or impact evidence.
