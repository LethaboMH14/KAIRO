# Wits curriculum metadata package — continuation handoff

Date: 23 October 2026. Current session `codex-luna-curriculum-20261023-c`; registered client Codex, actual exposed model `gpt-6`, effort `unknown` (not exposed). Current task/claim: `CURRICULUM-CATALOG-VERIFY-001`, returned `ok:true` for both task creation and claim. Exact claimed scopes are the original four paths: `studio/src/curriculum-catalog`, `studio/tests/curriculum-catalog.test.mjs`, `docs/engineering-journey-20261023/curriculum-evidence`, and this handoff.

## Coordination correction

The live canonical bus did not match the earlier blocker note: when this session checked, `CURRICULUM-CATALOG-001` already existed as **complete** under `codex-luna-curriculum-20261023-b`, and `CURRICULUM-REVIEW-001` was complete. No active curriculum path claim was present. Since task IDs are unique and complete tasks cannot be reclaimed, this continuation used the separate follow-up task ID `CURRICULUM-CATALOG-VERIFY-001`; it did not alter bus storage or impersonate the prior owner.

## Changes and evidence

- `studio/src/curriculum-catalog/model.ts`: kept the published Programme/CurriculumModule shapes and made validation stricter for unique IDs, clean required strings, well-formed credential-free HTTPS URLs, exact UTC timestamps, programme/institution membership, reviewed-record prerequisites, and institution/year/exact-code identity. Validation returns a clone without mutating its input.
- `studio/src/curriculum-catalog/registry.ts`: removed the synthetic “common first-year engineering” qualification. The 9 shared Year I rows now point to five actual 2026 Wits BSc (Eng) branch programme identities (EFA06, EFA01, EFA03, EFA05, EFA08). ELEN2003A remains specific to Electrical EFA03 Year II. Its source-derived tags capture fields, electromagnetic induction and energy conversion as conceptual motor preparation, not a motor-course equivalence.
- `studio/tests/curriculum-catalog.test.mjs`: 6 tests cover the actual validator and imported registry, source-year/course identity, shared-record reuse, institution/year/code separation, same-title/different-code synthetic data explicitly labelled as test-only, unknown code/year review status, URL and programme alignment rejection, timestamp validation, and input immutability.
- `docs/engineering-journey-20261023/curriculum-evidence/README.md`, `verify_source.py`, `verification.json`, and `checks.txt`: document source integrity, exact locators, research method, counts, reproducer and limits.

The research copy is `docs/luna-unblock-20261023/wits-ebe-original.pdf`, verified at 373 pages, 2,054,987 bytes and SHA-256 `7feff6501eddc6a5e5925233c4fce41fad39885a513875e2b459d5caa3039dc3`. The official source URL and download receipt are recorded in its adjacent `download.json`.

Nine exact current Year I rows are shared in the verified tables for Aeronautical, Civil, Electrical, Mechanical, and Metallurgy and Materials Engineering. PDF/printed locators: pp.42–43/40–41; pp.46–47/44–45; pp.48–49/46–47; pp.52–53/50–51; and pp.54–55/52–53, respectively. The current Year I math sequence is MATH1048A/MATH1049A. MATH1042A/MATH1043A occur in admission/articulation and current prerequisite-alternative contexts; they were not promoted to Year I rows. ELEN2003A appears in Electrical EFA03 Year II at PDF p.48/printed 46. Its detailed syllabus at PDF p.294/printed 292 names electro-magnetic induction, coupling, transformers, power and energy conversion, and electrical fields.

## Checks and status

- From `studio/`: `node --test tests/curriculum-catalog.test.mjs` — **6/6 passed**.
- From `studio/`: `node_modules/.bin/tsc.cmd --noEmit` — **exit 0, no diagnostics** in the final run. The earlier separate signing/browserDeps TypeScript problem was not present in this run; no signing file was edited.
- From repository root: `python docs/engineering-journey-20261023/curriculum-evidence/verify_source.py` — **exit 0**, asserting PDF hash/size/page count, exact nine course rows across all five branch tables, and the Electrical Year II and detailed syllabus locator/content.

Registry counts: **10 reviewed module records**, **0 discovery-only module records**, **8 discovery-only programme-page leads**, and 5 actual programme records supporting the verified shared rows. The eight target pages are not full degree reviews; the registry does not claim the learner is enrolled. It contains no credit claims or guessed module equivalence.

## Judging need and remaining gaps

- **Product:** grounds a small relevant curriculum in a 2026 original syllabus; acceptance evidence is the exact identity/year/branch and syllabus assertions above. Broader degree coverage remains open.
- **Usability:** keeps exact plain course titles and codes; discovery links remain visibly separate from reviewed module records. No chooser or route integration is part of this package.
- **Intelligence:** uses original-edition provenance and a narrow source-supported concept mapping for motor preparation. It does not claim motor coverage, learning gains or predictive skill.

The PDF stays a root-owned research copy and is not bundled or represented as licensed courseware. Only metadata is stored; no learner records, LMS content, course body, credits or redistribution rights are included. Verification used installed PyMuPDF text extraction, not page-image visual QA. No browser, network/cloud API, screenshots, real audio, install, deployment or app integration was performed. Root should independently review this package before integration; no in-app enrolment, browser/device or learner acceptance is claimed.
