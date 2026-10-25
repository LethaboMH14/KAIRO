# Browser-local save, export and clear audit

Source-only audit of the KAIRO studio UI and browser persistence code on 22 October 2026. It does not inspect any browser profile, stored record, private folder or credential. The scope is `localStorage`, `sessionStorage`, IndexedDB and Cache Storage in `studio/src` and the public service worker.

## Findings

The application uses `localStorage` for learner and preference records and one named Cache Storage bucket for the opt-in offline reading shell. No `sessionStorage` or IndexedDB calls were found in the searched TypeScript/TSX/JavaScript source. The service worker is explicitly limited to `/home` and static `/assets/*.js`/`.css` GET responses; it excludes API requests, query URLs and authorized requests (`studio/public/kairo-offline-sw.js:1-19`).

The `/home` clear control accurately describes its narrow scope: it removes the reading-memory record and offline shell, while its confirmation and success text explicitly say existing lesson progress is separate and retained (`studio/src/continuity/LearningHome.tsx:26`; `studio/src/continuity/offline.ts:35`). It links to `/progress` for that separate record. This is not a misleading delete claim. The confirmed gap is that no single device-data inventory or clear-all control connects the other browser-local categories listed below. Several categories have individual exports but no in-app deletion/reset; the learner must know which page owns each record or use browser site-data settings. The existing UI never states that the home clear button erases all browser data.

The footer text “Your work belongs to you. Export a copy whenever you need one.” is broader than the actual controls (`studio/src/continuity/LearningHome.tsx:26`). Several saved categories have no export control, including engineering and lecture checkpoint flags, the computer-science completion flag, and teacher settings. Recommend changing this sentence to direct learners to the relevant record page, or covering each saved category with an export/control path before making a broad export claim.

## Key and control map

| Browser storage key / category | What source says is saved | Visible save, export or clear control |
| --- | --- | --- |
| `kairo-device-continuity-v1` | Goal, reading theme, up to five reading copies, and notes (`studio/src/continuity/model.ts:3-6,22-32`). | Save copy from a lesson; `/home` downloads each copy and notes, removes an individual copy, saves notes/theme/goal, and clears this record (`SaveReading.tsx:5`; `LearningHome.tsx:24,26`). No separate export for goal/theme. |
| `kairo-reading-shell-v1` Cache Storage | Opt-in `/home` document and static reading-shell assets only (`studio/src/continuity/offline.ts:2-33`; `studio/public/kairo-offline-sw.js:1-19`). | `/home` “Enable offline reading” saves; “Clear reading memory and offline screen” deletes the named cache and unregisters this app service worker (`LearningHome.tsx:26`; `offline.ts:35`). |
| `kairo-learning-profile-v1` | Up to 50 lesson summaries and 20 workplace case records, including attempts/reflections (`studio/src/profile/model.ts:4-9,56-59`). | `/progress` exports a portfolio; if unreadable, the recovery-only UI offers a raw copy preserving the unreadable profile (`ProgressPage.tsx:18,23-32`; `profile-recovery/RecoveryCopy.tsx:5-18`). No visible clear/delete control. |
| `kairo-study-${lessonId}` | Per-lesson format, answers, notes and progress (`studio/src/workspace/LessonWorkspace.tsx:27,31`). | Lesson page exports lesson, notes, source passages and practice record (`LessonWorkspace.tsx:35,39,47`). No visible clear for this per-lesson key. |
| `kairo-case-draft-${lessonId || 'standalone'}` | Current case's replayable action sequence (`studio/src/practice/PracticeStudio.tsx:19-27`). | Practice page exports the current practice record; “Try a new run” replaces this draft key while the earlier case record remains in the profile (`PracticeStudio.tsx:30-31,34,47`). No direct delete control. |
| `kairo-engineering-progress` | Two correct-answer flags: stationary quiz and field-speed check (`studio/src/engineering/EngineeringStudio.tsx:22,31-39`). | Success text says “Saved in this browser” (`EngineeringStudio.tsx:437,478`). No export or progress clear/reset control is shown. |
| `kairo-lecture-step`, `kairo-lecture-complete` | Current prepared lecture chapter and completion flag (`studio/src/lecture/LectureStudio.tsx:21-22,33`). | Chapter automatically saves; completion is labelled saved in browser. No export or clear/reset control is shown. |
| `kairo-request-lesson` | Computer-science lesson completion flag (`studio/src/App.tsx:36,75`). | Completion badge (“Progress saved”); no export or clear/reset control is shown (`App.tsx:115`). |
| `kairo-teacher-settings-v1` | Teacher appearance and voice/language preferences (`studio/src/teacher/model.ts:1-4`; `TeacherProvider.tsx:11,20`). | `/teacher` offers preference choices and says they save on device (`TeacherProvider.tsx:20`; `TeacherSettings.tsx:18`). No clear/reset-to-default or export control is shown. |
| `kairo-annotations-v1:<kind>:<id>:<revision>:<section/evidence>` | Highlights and starred spans for an exact source/lesson revision (`studio/src/teacher/model.ts:22-28`). | Selected mark can be toggled off; “Export marks” downloads notes (`SourceReader.tsx:11,14-15,28`). No clear-all annotations control is shown. |
| `kairo-role-preparation-v1` | Selected role, goal, evidence levels and learner-authored notes (`studio/src/pathways/model.ts:22`; `RolePathways.tsx:10,13-16`). | `/pathways` saves and exports preparation (`RolePathways.tsx:14,16,27`). No whole-draft clear/reset control is shown. |
| `kairo-pathway-artifact-links-v1` | References linking local practice records to preparation criteria (`studio/src/pathways/model.ts:23`; `RolePathways.tsx:10,15`). | Individual links can be removed and preparation export includes current link status (`RolePathways.tsx:15-16,23`). No clear-all links control is shown. |

## Bounded recommendations for root review

1. Keep the `/home` clear confirmation and result scoped to the reading-memory key and offline shell. Add a short adjacent path to the other local records, with direct links to the available management/export pages.
2. Replace the broad home-footer export promise with wording that points to each record's export control, or add export and deletion/reset affordances for categories that currently only save.
3. Prioritize clear/reset for profile progress, teacher settings, annotations and pathway preparation because those keys hold user-authored or personalized records. Preserve the existing raw-profile recovery copy before offering deletion when progress is unreadable.
4. Make the scope of any future global clear operation explicit and ask for confirmation listing each affected category; the present code has no single operation that removes every key in this map.

No runtime changes, tests, builds or browser/private-data inspection were performed for this audit.
