# Truthful CV text foundation

**Status:** isolated local text-generation foundation; no route or applicant profile integration. Reviewed on 22 October 2026.

The `studio/src/cv-draft/model.ts` function accepts only explicit applicant facts, each with an allow-listed section, stable local ID and confirmation state. It includes only facts marked confirmed by the applicant, preserves their wording, and labels evidence as applicant-provided and applicant-confirmed. KAIRO does not independently verify whether a fact is true. Unconfirmed facts are excluded and reported. Practice and learning items appear under **Practice and learning (applicant-reported)**; they are not reclassified as employment, qualifications or credentials.

Optional target-role requirements are kept in a separate, visibly unverified field and never copied into the applicant CV text. The output is plain text with section headings, evidence labels and missing-information warnings. It does not infer missing contacts, dates, qualifications, experience or skills; a warning says to add a section only if applicable or leave it out. It provides no ATS score, pass prediction or employment guarantee.

Input, each field and the assembled result have UTF-8 byte limits. A cheap UTF-16 length guard rejects obviously overlong fields before encoding; the model then checks exact UTF-8 byte length. Shape, collection counts, dense list entries and individual fields are validated and copied to a known plain-data projection before aggregate input measurement; custom serialization hooks on caller data are not invoked. Text is constrained to one-line plain prose: control and bidirectional formatting characters, angle-bracket markup, Markdown links/images and selected code/emphasis markup are rejected. Ordinary names such as C++, C#, and Node.js remain valid. This is a formatting boundary for this text output, not a general security guarantee and not evidence that applicant statements are true. The text remains inspectable and should be checked by the applicant before use.

General resume-formatting context from official career-service sources (checked 22 October 2026):

- UC Berkeley Career Engagement recommends a simple format, tailoring to the position description, and concise phrases describing experience: [Resume guidance](https://www.career.berkeley.edu/prepare-for-success/resumes/). This is general career-service advice, not an ATS parser specification or compatibility guarantee.
- Harvard FAS Mignone Center for Career Success recommends specific, clear, fact-based, scannable wording and tailoring/accuracy: [Create impactful resumes and cover letters](https://careerservices.fas.harvard.edu/resources/hes-create-impactful-resumes-and-cover-letters/). This is general career guidance, not proof of employer criteria.

## Interface

`createCvDraft(input)` returns `format: "kairo-cv-draft-v1"`, `draftText`, per-fact evidence labels, excluded-fact reasons, separate optional target requirements, warnings and conservative provenance fields (`independentlyVerified: false`, `atsScore: null`). Invalid, unsupported or over-limit inputs throw `CvDraftInputError` with a stable `code`. No network, model, file, profile, persistence or export side effect is performed here.

## Verification and limits

Focused tests exercise exact wording, C++/C#/Node.js names, explicit practice labeling, target-role separation, unconfirmed exclusion, missing information, malformed/unsupported input, sparse-array rejection, early over-count refusal without invoking custom `toJSON`, pre-encoding rejection of oversized ASCII, markup/control rejection and aggregate input/output limits. The model validates data shape and formatting only; it does not validate factual accuracy, CV quality, ATS behavior, employer preferences or applicant eligibility.
