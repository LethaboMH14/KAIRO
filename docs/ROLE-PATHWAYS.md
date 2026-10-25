# Role preparation: first learner-facing slice

Open http://127.0.0.1:4176/pathways or choose Explore roles from My progress. This is a local preparation tool, not a live job board or application service.

Three routes use verified FNB employer sources: graduate work (R46834), business analysis (R37730 excerpt) and data quality (R48624). The two adverts with known dates are closed as of 21 October 2026; the other route's current availability/full eligibility is unverified. No currently open vacancy is asserted. Basic eligibility and supporting documents stay separate from skill coverage. Resources/tasks are KAIRO-authored preparation, not employer-endorsed training or universally mandatory selection criteria.

Learners choose a direction and goal, add evidence notes, choose a self-reported level and inspect coverage/gaps. Weights 2/2/1 and evidence points 0/.25/.5/1 are disclosed KAIRO rubric choices, not hiring probabilities. A nonempty note is required before a selected level contributes. Unknown means unassessed, not unable. Even reported independent reviews are unverified: no external reviewer identity, artifact fetch or evidence authentication exists yet. Do not interpret the percentage as an independently assessed ability score.

Next tasks follow weighted gaps and connect to the existing shop case, source workspace, CS studio and official/provider learning resources. A learner can inspect existing lesson/case counts without automatically turning practice into verified skills. Completed work still needs an inspectable artifact and a valid assessment.

Save explicitly stores a separate versioned record in browser localStorage under kairo-role-preparation-v1. There is no auto-save. Navigation/reload loses unsaved edits. Unsupported saved records are not overwritten; the save control stays disabled and the new draft can be exported. Browser storage is editable and is not authenticated production persistence. No secrets or confidential records belong in evidence notes. Export produces a Markdown preparation record with sources, closure status, notes, task links and honest CV/portfolio guidance; it is not a generated ATS-certified CV.

Implementation: studio/src/pathways/model.ts, RolePathways.tsx and pathways.css; route in StudioRouter.tsx; entrypoint in profile/ProgressPage.tsx. No server/API/package/lockfile change. Claude Engineering paths were untouched.

Validation: TypeScript/Vite production build passed (existing large shared Three chunk warning); all 29 app tests passed, including five new pathway policy tests. Browser rendered the actual route and source/closure notices. Selecting artifact with no note showed a warning and no points; adding an explicitly synthetic browser-test note changed coverage to 20%, with 60% unassessed. See the handoff for the final browser save/reload/export check status. No live employer submission was attempted.

Browser save/reload and export checks also passed: the test record survived reload, was restored to a blank state, and the downloaded KAIRO-graduate-preparation.md was read to confirm the source/closure/self-report limits. Evidence is in coordination/briefs/AVATAR-AND-PATHWAYS/app-verification.json.

Full follow-on architecture, role discovery, AI teamwork, hackathons, CV/profile work, tool broker, sandboxed terminal and workspace panels: coordination/briefs/AVATAR-AND-PATHWAYS/FNB-ROLE-AND-TOOLS.md. Those capabilities remain separately scoped work.
