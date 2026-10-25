# Wits curriculum metadata evidence

Checked 23 October 2026. This is a bounded metadata sample, not an official course catalogue or learner enrolment record.

## Source and method

The original source is the Wits **2026 Rules and Syllabuses for the Faculty of Engineering and the Built Environment**: [official PDF](https://www.wits.ac.za/media/wits-university/students/academic-matters/documents/EBE_eBook.pdf). Root supplied a local research copy at `docs/luna-unblock-20261023/wits-ebe-original.pdf`; `download.json` records the URL, final URL, byte count and SHA-256. The research copy is root-owned and is not copied into this package, app assets or a distributable bundle.

I extracted surrounding text locally with the already-installed PyMuPDF library. I read the complete Year of Study I tables across the relevant two-page spreads, the Electrical Engineering Year II table and its detailed syllabus, plus the nearby admission/prerequisite material. PDF page numbers below are one-based; printed page labels were read from the original page text. Automated `locator-discovery.json` hits were only navigation hints.

## Reviewed metadata

**10 reviewed module records**: nine exact Year I courses shared by the 2026 BSc (Eng) curricula for Aeronautical Engineering (EFA06), Civil Engineering (EFA01), Electrical Engineering (EFA03), Mechanical Engineering (EFA05), and Metallurgy and Materials Engineering (EFA08); plus one Electrical Year II course. The five programme records are those named branches, not a synthetic “common engineering” qualification. The records share one module identity where the exact institution, catalogue year and code agree.

The common Year I rows are CHEM1051A Engineering Chemistry; FEBE1000A Introduction to the Engineering Profession; FEBE1002A Engineering Analysis and Design IA; FEBE1004A Engineering Analysis and Design IB; MATH1048A Engineering Mathematics IA; MATH1049A Engineering Mathematics IB; PHYS1032A Engineering Physics IA; PHYS1033A Engineering Physics IB; and PHYS1034A Applied Physics I. They appear in the current-year tables at:

- Aeronautical EFA06: PDF pp.42–43 / printed pp.40–41.
- Civil EFA01: PDF pp.46–47 / printed pp.44–45.
- Electrical EFA03: PDF pp.48–49 / printed pp.46–47.
- Mechanical EFA05: PDF pp.52–53 / printed pp.50–51.
- Metallurgy and Materials EFA08: PDF pp.54–55 / printed pp.52–53.

These are the nine common course rows before the separate “one of the following” elective list. This package does not record elective alternatives or credits.

The second-year Electrical record is **ELEN2003A — Electric and Magnetic Systems**, Electrical EFA03 Year of Study II at PDF p.48 / printed p.46. Its detailed syllabus is at PDF p.294 / printed p.292, under the School of Electrical and Information Engineering. The source spells out “electro-magnetic induction”, coupling, transformers, power and energy conversion, and electrical fields. That supports a bounded conceptual relationship to motor preparation (especially induction and energy conversion); it does not make ELEN2003A a motor course or prove that a specific motor lesson is covered by the module.

The 2026 Year I branch tables name MATH1048A and MATH1049A. MATH1042A/MATH1043A are not promoted as current Year I course rows: they appear in BSc graduate admission/articulation lists (PDF pp.40–41 / printed pp.38–39) and as alternatives in the current Electrical prerequisite table (PDF p.82 / printed p.80). This package preserves that distinction and makes no claim that the alternatives are discontinued or historically invalid.

## Discovery leads and gaps

There are **8 discovery-only programme-page leads** in the registry (electrical, mechanical, aeronautical, metallurgy/materials, civil, construction studies, computer science and information systems). They are source navigation targets only; they do not add reviewed module records, represent complete programme coverage, or assert a learner’s enrolment. The three non-BSc(Eng) / outside-this-syllabus targets and all detailed year-by-year curriculum content beyond this sample remain unreviewed. A discovery lead’s URL or topic is not curriculum verification.

Module counts: **10 reviewed**, **0 discovery-only module records** (no incomplete module facts were guessed into a record). The validator supports null code/year only for `needs-review`; tests use clearly named synthetic data to exercise that case. No official equivalence, enrolment, completion, assessment, learning gain or institutional verification is asserted.

## Provenance, rights and limits

The registry stores only factual metadata: exact course code/title, catalogue year, study year, applicable programme IDs, concept tags, source URL, original-edition locator, check time and evidence status. It stores no syllabus body, student record, private LMS content, copied PDF, guessed equivalence or unverified credit. Public access to the PDF does not establish redistribution rights; the original remains outside app/public assets. No claim of courseware licensing is made.

The page review was text extraction, not visual/document-layout acceptance. There was no browser, learner, institutional registrar or subject-matter-expert review. Eight programme pages and the remaining curricula need future source-by-source verification. See `verification.json` and `checks.txt` for reproducible local evidence.
