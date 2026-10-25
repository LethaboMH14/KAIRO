# Learner continuity, real practice and rolling review checkpoint

Owner: codex-continuity-20261022-a, Codex; actual root model/effort not exposed (registered unknown). Date: 22 October 2026.

## Published local checkpoint

Production server was started on http://127.0.0.1:4176. `/home` is the additive learner home, with warm paper and sage themes, a chosen goal, last-lesson link, Learn/Practise/Use routes, saved reading and device-memory controls. `/cases` lazily opens the reviewed requirements/UAT and digital-support authored scenarios. `/evidence` now has readable HTML/JSON portfolio downloads and a learner-copy/palette pass. `/pathways` explicitly links actual replayable saved practice without changing manual coverage, evidence level or eligibility.

These are implemented local features, not a public production release. The browser was not inspected. Do not bypass the prior browser policy rejection using another surface, headless browser, CDP or indirect UI automation. Dialogs, keyboard behavior, visual layout, downloads, storage eviction and real service-worker installation/restart/offline acceptance remain pending.

## Root changes and interfaces

- `studio/src/continuity/`: learner home/styles, explicit device memory, reading-copy projection/export, opt-in static-shell preparation and SaveReading integration.
- `studio/public/kairo-offline-sw.js`: only the home navigation and fixed JS/CSS asset paths are intercepted. API/private/auth-bearing/query/non-GET/external requests are excluded. No submission queue, paid-call replay, original-document cache or implicit cloud synchronization.
- `studio/src/StudioRouter.tsx`: `/home`, `/cases` and a small home-navigation strip. Practice-pack default component contract was approved before consumption; no character integration.
- `studio/src/workspace/LessonWorkspace.tsx`: Save reading copy, honest AI-draft/download wording, and restoration gate that preserves unreadable/unsupported saved study instead of immediately overwriting it with a default session. Blocked restoration also blocks automatic profile-history replacement; the learner can continue and download session notes.
- `studio/src/styles.css`: removed the external Google Fonts request; existing local fallback font stacks remain. No new font or package download.
- `docs/continuity/EXPERIENCE-AND-SECURITY.md`: palette, offline/memory boundary, follow-ons and verifiable production security gates. ML-KEM, ML-DSA and SLH-DSA are researched migration considerations; no custom or post-quantum cryptography was added.
- `coordination/roadmap/`: rolling package state, independent probes and full original checklist. Original 15 areas / 122 outcomes remain distinct from reviewed narrower foundations. Only the previously scoped authored-scenario original item 8.01 is checked; no broad area is complete.

Device memory stores only the chosen goal/theme, explicit reading copies and their separate notes. It is visible, editable/exportable and clearable, not an encrypted multi-user vault or conversation memory. It is not sent to a teacher/model or used for training. Reading copies preserve citations/revision/warnings and exclude quiz answer keys. New provider answers, natural cloud speech and unsaved studio assets still need a connection. Saved reading remains useful without pretending those services are online.

## Review evidence

The frozen published checkpoint and root source hashes are in `docs/continuity/verification.json`; the static asset closure report and matching index hash are in `docs/continuity/offline-build-inspection.json`.

- Final application suite: **124 passed, 0 failed**; published TypeScript/Vite build passed. The existing 532 KB minified lazy Three/OrbitControls chunk warning remains.
- Independent offline-inspection fixtures: **8 passed**. Actual published reading shell: two static assets, **310,411 bytes including HTML**, no missing/unsafe/API/external dependencies or runtime matcher differences. This is static inspection, not browser offline acceptance. Windows denied creating a real symlink/junction fixture; the outside-resolution test used a documented injected mapping.
- Synthetic OCR evaluator: **9 passed** from `tools/course_sources/`; no coursework OCR accuracy was measured. Root returned unrelated-candidate scoring and batch compute-budget defects before acceptance. An initial root invocation from the wrong working directory failed import discovery; the documented directory command passed.
- Broader Engineering/root-probe command: **31 passed, 1 failed**. The Engineering model test module fails to resolve extensionless `./fieldMath` imported by active-owner `motorContent.ts`. Bus message 28 sent the exact failure to claude-engineering-20261022-a. Root did not alter that claim or mask the failure. Do not describe the entire project as green.

Other returned defects included raw extra fields surviving memory writes, fresh timestamps allowing unsafe link affordances, duplicated events becoming extra practice, stale artifact linking, unbounded link versions/dates, compiler narrowing errors, answer-revealing choices, falsely completed download receipts and an outside-root read in the build inspector. Owners repaired their own scopes; root independently reran relevant checks.

## Rolling work and continuation

The user explicitly approved recurring runs after the first scheduler creation was rejected for missing ongoing authorization. Creation then succeeded: automation `kairo-reviewed-build-queue`, ACTIVE, every 30 minutes, same chat. The scheduler reviews/reuses the actual queue and avoids duplicate foreground coordination, notifications for unchanged state, paid/deployment/application actions and policy bypass. It is separate from the pull-based bus and is not evidence that Claude received anything.

After this checkpoint, the next scoped tasks are ProgressPage recovery (waiting for root's checkpoint-finished release) and private OCR sample metadata preparation. Any later source edits require their own review/build before being described as part of the published checkpoint. All Claude character/Engineering claims remain theirs. The old reference-core owner claim remains active; its code repair passed root probes, but no one may steal or release that claim.

Next substantive gates: review the new recovery/sample work; genuine browser acceptance when permitted; character integration only after its reviewed capability handoff; explicit adaptive events in a real lesson; authenticated per-user storage and controlled pilot infrastructure. The security record is a scoped implementation/design reference, not proof of OWASP compliance, tenant isolation, a complete threat model or validated learning/employment outcomes.
