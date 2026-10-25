# Proposal: private learner evidence, chosen sharing, employer view

This is a design proposal for root review. It is not a runtime contract or an integration request to another package.

## The learner path

### 1. Keep preparation private

The proposal is private-by-default, but current KAIRO browser-local preview data is held in the shared app-host/browser storage and is not isolated to an authenticated learner account. Do not tell a learner “only you can see this” or imply confidentiality on a shared host. Until owner isolation is implemented and verified, describe the state accurately: **“This preparation is saved in this browser. It may be visible to others who use this device or app workspace. Nothing has been sent to an employer.”** If the current storage audience is unknown, say so and avoid storing sensitive material there. Reserve “Only you can see this” for a future authenticated audience after isolation has been verified.

An audience-unshared preparation state is not encryption, account isolation, or confidentiality on a shared device/host. The future private default may combine learner notes, course/module context and saved practice records only after the actual storage audience is explained. A learner may draft a project story without creating a shareable view. Private progress is not an opportunity application.

Proposed future copy, permitted only after authenticated access and owner isolation are verified: **“Only you can see this preparation here. Nothing has been sent to an employer.”** If account or hosting settings have a different audience, state that audience before the learner starts.

### 2. Turn one activity into a clear evidence item

For each item, show:

- what the learner says they did, with their contribution separated from team/project claims;
- the source/project/run link, scenario or source revision, relevant dates and what can actually be reopened;
- a claim label and human-readable explanation of that label;
- course/module context as learning context only, not proof of enrolment or completed credit;
- role-criterion context as a separate optional alignment, not a course equivalence;
- a short reflection on evidence, assistance/hints where recorded, limits and next task.

The learner can edit their narrative, but editing an artifact or its system-generated replay/credential details must not rewrite the original record. If an item cannot be reopened or its version cannot be matched, keep it out of any proposed share and label it unavailable/stale instead of silently removing or upgrading it. This does not make its current browser-local storage confidential.

### 3. Select exactly what to share

An employer view should not be created from the full profile. The learner explicitly selects individual projects/artifacts and separately selects whether to include a display name, contact method, module context, learner narrative and links. Each piece begins unchecked. Do not include quiz history, raw answers, source documents, private notes, grades/GPA, personal identifiers, application history or all saved progress by default.

Before confirmation, show a reviewer-like preview of the actual fields and records, audience/recipient, whether links are public or downloadable, current expiry, and a one-step cancel/back path. Name the specific employer or use an explicitly labelled “anyone with the link” choice; never suggest that link possession equals employer identity verification.

Consent must be a separate, deliberate action after the preview; it must not be bundled with uploading a source, signing in, creating a progress record or applying to an opportunity. A learner can leave without sharing. Log only the minimal grant/expiry/revocation metadata needed to enforce the share; do not create engagement tracking or viewer analytics without a separate purpose and consent.

### 4. Employer view: inspectable, limited and honest

The recipient view should show only the items selected for that share. For each item, display claim level, claim author/issuer, what was checked, what was not checked, relevant dates, source/run version, and accessible text description. Make original artefact links open in a new context only when the learner chose them and audience permissions allow it. Do not include a “ready to hire” score, combined employability score, implicit ranking, or inferred competency from course completion.

Current KAIRO has a browser-local practice portfolio and role-preparation export. Its own labels say practice is unverified and not accredited. This proposed employer view is **not implemented**. In particular, no audience-scoped link, employer authentication, expiring share, or revocation service was confirmed in this review.

## Claim vocabulary and evidence levels

These are proposed labels for plain-language display, not a score scale:

| Label | What the record can support | What it cannot support |
|---|---|---|
| **Learner-described** | The learner wrote a description or selected a skill/role label. | That the project, skill or role was independently checked. |
| **Practice record** | A saved practice/simulation item exists. If the app replays its event sequence, say **“scenario rules replayed consistently”** and identify the scenario version. | The learner's identity, unaided work, real workplace performance, or general competence. Local timestamps/history can be edited. |
| **Review reported by learner** | The learner says a named or unnamed reviewer reviewed the work; show whether review details were supplied. | That KAIRO confirmed the reviewer, employer, rubric, result or relationship. Do not label “verified review.” |
| **Issuer credential verified** | A digital credential's issuer/proof and status were verified with an identified trust policy at a timestamp; show issuer, achievement criteria, issue date, expiration/revocation status and verifier limitations. | That the issuer is universally trusted, that a credential is current if check has gone stale, or that its criteria imply broader skills. This level is future work; no credential verifier is claimed. |

Never treat a self-selected module as institutional enrolment, a course completion as course credit, or a course/module as an employer role criterion. Keep institution identity/status as a separate claim that is only shown when an authenticated institution source actually supports it.

## Role and module taxonomy are distinct

- **Opportunity / role:** the source posting's title, employer as named by that posting, role family, location, opportunity type, requirements, source URL, checked date and stated close date/status. Preserve original source words as bounded quotation only when rights allow; otherwise paraphrase and link. A role may carry role-specific criteria but these are not curriculum module IDs.
- **Course / module:** source-backed institution/course identity, exact module code/title if available, year/term if reviewed, edition/effective date, locator, review status and source URL. Unknown fields remain unknown; don't infer enrolment, passing, or credit equivalence.
- **Skill vocabulary:** optional explicit terms aligned to one or both taxonomies with a stated mapping source and review state. A mapping is a proposal, not identity between the two taxonomies.

Do not show a KAIRO “matched to this job” percentage. At most, a future view can say “You chose to relate this item to this role criterion” and show the learner's note. The learner can remove that alignment without deleting the course or artifact.

## Opportunity freshness and source limits

For each opportunity, store a canonical source URL, title as seen, source, `checkedAt`, `statedClosingAt` if present, `availabilityStatus`, and a short note about what remains unverified. If source lookup is unavailable or old, display **“Availability not checked recently; open the original posting.”** If the advertised close date passes, display **“Stated closing date has passed; check the source.”** Preserve old posting information as historical; don't auto-mark a role open or delete it because it went stale.

This review did not establish a time-to-live threshold for all employers. A follow-up product decision should set any “recently checked” window with users and the actual source refresh cadence. Do not present source `checkedAt` as an official employer review date. KAIRO's current pathways contain historical/closed and availability-unverified adverts and explicitly say to recheck before applying; they are preparation examples, not a live opportunities feed or partnership.

## Revocation, download and access limits

If a future online share exists, provide “Stop sharing” from the same surface. Enforce revocation at the retrieval boundary, make a revoked URL show that it is unavailable, and retain only minimal audit metadata per an approved retention policy. Give the learner a clear warning that a recipient may have saved or copied a downloaded file and KAIRO cannot erase that copy. Expiry should be explicit and reasonable; no endless public link by default. Do not store a token in a query string that leaks into logs/referrers unless a reviewed security design approves it.

These controls require owner-scoped server storage, audience checks, anti-enumeration, an approved expiry/revocation policy, privacy/legal review and tests. They are recommendations, not current functionality.

## Observable acceptance checks for a later implementation

**Product / Impact:** learner can describe one authentic project or practice record without a CV, and can choose a next role-related task without implying a job match or partnership.

**Usability:** after owner-isolated storage exists, in a moderated task a learner can (1) understand the actual storage audience and keep the preparation unshared, (2) select exactly one artifact, (3) preview what the recipient will see, (4) change/cancel the selection, (5) grant consent explicitly, and (6) later revoke access. Record task completion/errors and the participant count; do not invent a success rate.

**Claim integrity / Intelligence:** tests show each rendered claim retains its correct level; course module context does not transform into an employer criterion; learner-reported review does not become verified; a practice artifact states replay/simulation limits; expired/revoked/stale credentials cannot display as current verified; a stale/closed opportunity cannot display as open.

**Privacy / Sustainability:** test authenticated owner isolation before using “only you can see this”; only selected fields/records are available to the intended audience; unselected records, raw course materials, hidden profile fields and other opportunities return no data; revoke/expiry blocks future access; export/delete and access logs follow a reviewed retention policy. A downloaded copy limitation is disclosed.

**No parity claim:** compare against the observed platform features as specific patterns only. Do not claim KAIRO equals LinkedIn, GitHub, Behance, Credly, Open Badges or Handshake.
