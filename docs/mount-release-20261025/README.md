# Mounted private release — 25 October 2026

Root session codex-mount-release-20261025-d, exposed model/effort unknown. User explicitly authorized mounting and deployment. Canonical bus owns MOUNT-RELEASE-061 and MOUNT-ENTRY-062; no prior claims taken over. Reviewable source: PR79, runtime commit 630e85f3b71620691e527866a951a0262dcf793c.

## Changes and learner acceptance

Product/Usability/Presentation: actual classroom lesson entry now renders the reviewed readiness component with chapter goals, evidence titles/locators, coverage notes and editing. Existing validated resume, reading-first entry and stop-before-enter semantics are retained. Source changes, missing/ambiguous citations and empty steps prevent entry. The prepared activity links and existing KAIRO narrator remain unchanged; v2 draft record/picker packages are not promoted by this release.

Product/Impact/Intelligence: curated opportunities now call the reviewed freshness inspector after normalizing existing date formats. Complete fresh metadata is distinguished from missing requirements, unknown deadlines, stale or invalid metadata. Existing closed/discovery-only decisions remain authoritative. Descriptive learner text invites checking the original provider; this is not live website retrieval, eligibility, role matching or employment prediction.

Sustainability: repaired explicit hosted allowlist to include owner-retrieval, reviewed source catalog and freshness import closure. Stage: 146 files, 71,311,541 bytes; credentials/private records excluded. Node24 production build and static closure validation passed; existing large-chunk warning remains. No browser/device observation or permission change.

## Evidence checkpoint

- Final local unrestricted serial tests: 837 total, 836 pass, one failure: Windows lacks Tesseract executable. No skips. The separate initial sandbox run had localhost EACCES failures and is not acceptance evidence. Log: tests-unrestricted.txt. Clean Linux CI on exact source must pass before traffic update; Docker installs Tesseract explicitly.
- Build: build.txt; staging validation: stage.txt; source file hashes: tools/ai-release-20261025/stage-evidence.json.
- Cloud Build 67826672-121b-4372-9b7b-48de6eb96f44 succeeded. Image digest sha256:9128193fc207f27602c83491d9a4851bc2230d720a9bbfc17b3cf3dad4d2c7c4 in existing africa-south1 repository.
- Before-release service revision kairo-app-00007-snn. IAM snapshot iam-before.json has no allUsers binding. Runtime identity kairo-app-runtime@kairo-access-20261021.iam.gserviceaccount.com. Deployment will update only the image, preserving service settings and IAM.
- verify-live.mjs uses only existing synthetic judge accounts, checks private ingress, Firebase session requirement, both account-specific spaces, reviewed source/lesson identity, opportunity freshness, cross-owner denial and static delivery. No new users, uploads or paid model calls. This is API/static delivery validation, not browser interaction or measured learning benefit.

## Final deployment and validation

Cloud Run revision **kairo-app-mount25d** now serves 100% of traffic, confirmed by service-after.json. Existing IAM bindings are unchanged and include no allUsers member; unauthenticated public ingress was denied in live checks. Previous revision kairo-app-00007-snn is retained for rollback. Runtime image is the digest recorded above.

Clean Linux CI on runtime commit 630e85f3b71620691e527866a951a0262dcf793c passed **842/842 app tests**, zero skips, production build, and **6/6 bus tests**. https://github.com/LethaboMH14/KAIRO/actions/runs/40210095187 . Local Windows results remain separately recorded; Linux CI resolves the missing local OCR executable gate, not a claim that Windows is fixed.

Post-deploy verify-live.mjs passed **18/18** checks, zero failures and zero model calls; see live.json. Both engineering and informatics synthetic accounts sign in, open their private spaces and reviewed lessons, receive opportunity freshness, and cannot fetch the other account's lesson. Static classroom entry is served. This does not constitute browser/phone, camera, narration audio, learning-gain or employment validation.

App: https://kairo-app-747226582754.africa-south1.run.app . Existing authorized private access is required before Firebase account sign-in; the URL is not publicly accessible. No public IAM, schedule, GPU training, Firebase rules, paid model routing or new infrastructure was activated. Kaggle remains unused for this release.
