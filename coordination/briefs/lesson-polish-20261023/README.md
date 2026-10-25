# Lesson polish: published interfaces before dependent work

User authorised the next two existing Luna chats on 23 October 2026. Use actual gpt-6-luna/low when exposed; register unknown for unavailable settings. Root retains review, router/provider/profile/auth, server/model calls, cloud deployment and submission integration. Do not spawn more agents. Current teacher identity is KAIRO, Rain only underlying asset provenance.

Independent root rerun of previous deliveries: curriculum 5/5 and chooser 10/10, 15/15 combined. Before production integration root must check original-source locators, canonical source URLs and programme membership. Discovery leads remain separate. A shared first-year label is not proof that all programme mappings have been reviewed.

## Shared proposed contract v1

`LessonPlanInput = {lessonId:string, sourceId:string, revision:string, title:string, objective:string, chapters:Array<{title:string,explanation:string,example:string,citationIds:string[]}>, evidence:Array<{id:string,quote:string,locator:string}>, quiz:Array<{question:string,options:string[],correct:number,explanation:string,citationIds:string[],supportQuote:string}>}`.

This is a structural subset of the existing Lesson shape, no runtime/schema migration. Validate real supplied values, do not infer true comprehension or learner level from it.

`LessonReadiness = { title:string, objective:string, chapterCount:number, questionCount:number, estimatedMinutes:number|null, estimateBasis:string, sourceState:'reviewed'|'changed'|'unavailable', capability:'source-reading'|'prepared-interactive', savedStep:number|null, saving:'device'|'session-only'|'unavailable', notices:string[] }`.

`LessonStartPanel` props: `{summary:LessonReadiness, busy:boolean, onBeginReading:()=>void, onResume?:()=>void, onReviewSource:()=>void, onRetry?:()=>void}`. Each component/package can declare these compatible types locally, no unfinished cross-worker import. Estimates must name a transparent reading-rate assumption and exclude unknown practical task time. No claim that this plan is already integrated. Root reconciles types once both packages are reviewed.

Luna A's pure plan builder can return `{summary, steps:Array<{kind:'read'|'worked-example'|'self-explain'|'check'|'reflect',title:string,prompt:string,citationIds:string[]}>, warnings:string[]}`. Missing worked-example coverage or open assessment must be a warning, not fabricated content. summary sourceState is never guessed: require explicit trusted source identity/review context as a separate function argument and fail closed on mismatch. Luna B tests its panel using clearly synthetic props rather than importing A's implementation.

## Detail checklist (list first, then implement bounded packages)

1. Goal says what the learner can do; beginner/advanced is a preference or tested evidence, not inferred from CV.
2. Source extraction is reviewed, missing/edited pages visible, revision change blocks stale lesson launch.
3. First lesson shows length, source scope, reading/interactive capability and a single next action.
4. Each chunk includes explanation, meaningful example and an explicit action; examples are marked illustrative.
5. Questions distinguish recognition, recall, worked calculation and unverified open reasoning.
6. Hints and retries retain assistance/attempt evidence; don't turn a helped answer into independent mastery.
7. Repeated clicks, partial save, failed local storage and multiple-tab conflicts must not erase earlier work.
8. Stop/route/tab/source changes cancel old requests/narration; no delayed callback restarts a previous lesson.
9. Voice, text translation and signing are separate; unsupported languages and declined consent remain usable text.
10. Reading/drawing fallback preserves same task; keyboard/native controls and captions have actual labels.
11. Simulation limits, source coverage and practice/evidence provenance stay visible without technical jargon.
12. Private work/CV is not publicly shared, cloud-synced or institution-verified by default.

Implementation ownership: A handles pure lesson structure and quality warnings; B handles stateless start/resume and recovery wording. Audit/report other gaps, do not edit outside your scopes. No browser observation, installs, paid calls, cloud mutation, new schedule or deployment. Judging targets: Product completeness and correctness, Usability clarity, Intelligence traceable next step and assistance boundaries. Every handoff needs actual checks and gaps, no perfect-score or outcome claims.
