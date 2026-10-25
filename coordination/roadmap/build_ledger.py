"""Create the initial execution ledger; never run over an existing reviewed ledger."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
areas=[
('Teacher avatar',[
'Finish Claude Rain export and optimise the browser asset',
'Finalise appearance, clothing, hair, materials, facial expressions and articulated hands',
'Connect finished character to voice and lesson systems',
'Improve speech alignment beyond approximate audio-driven jaw motion',
'Point reliably toward actual board/model targets',
'Add interruptible teaching gestures, listening, acknowledgement and gaze',
'Add authored walking with foot contact and reviewed touch/IK behaviour',
'Support alternate appearances independently of ethnicity/voice/personality',
'Validate device performance and lightweight fallback']),
('Conversation and language',[
'Add consented microphone input and speech recognition',
'Implement interrupt, clarify, pause, resume and return-to-lesson turn taking',
'Ground teacher responses in selected passage, object and mistake',
'Research and test South African voices, accents and languages',
'Review translations and pronunciation with speakers',
'Keep captions/transcripts/text controls equivalent to voice',
'Build separately reviewed SASL translation and performance pathway']),
('Documents and interactive reader',[
'Evaluate extraction/OCR on authorised coursework, scans, screenshots, tables, equations and MCQs',
'Improve original-page/extracted-text comparison and uncertainty display',
'Handle long documents, multiple sources and conflicts',
'Improve editable layout and annotations',
'Complete explain/simplify/translate/read/define/visualise/practise/bookmark/notes actions',
'Preserve page references, corrections and source revisions end to end',
'Add supported cloud import plus retention/deletion controls',
'Separate student answers from authoritative answer keys']),
('Adaptive learning',[
'Diagnose prerequisite gaps and specific misconceptions from observed evidence',
'Generate appropriate objectives and lesson plans from baseline',
'Use worked examples, faded assistance and independent practice',
'Add delayed recall and changed-context assessments',
'Adapt difficulty, pace and explanation from demonstrated outcomes',
'Let learners override recommendations and change goals',
'Assess open-ended answers with transparent rubrics',
'Evaluate lesson/citation accuracy across disciplines',
'Do not infer fixed learning styles or ability from clicks/time']),
('Shared studio system',[
'Build World Composer selecting supported environments/interactions',
'Connect lessons, teacher cues, boards, cameras and model actions with validated interfaces',
'Preserve lesson state across environments',
'Provide diagram/reading fallback for unsupported topics',
'Build supported photo/manual-to-model Reality Mode']),
('Individual studios',[
'Complete integrated Engineering browser acceptance',
'Add reviewed Engineering faults, experiments and equipment',
'Obtain qualified Engineering content review',
'Expand CS to executable coding, SQL, debugging, algorithms and systems tasks',
'Integrate finished teacher and richer adaptive lessons into lecture theatre',
'Build sourced Law cases, courtroom roles, arguments, objections and rubrics',
'Obtain licensed Anatomy models, layers/interactions and qualified review',
'Build bounded Industrial/mining scenarios and validated calculations']),
('Credible evidence',[
'Add substantial role-specific practical tasks',
'Execute/inspect real queries, spreadsheets, code, designs, reports and calculations',
'Preserve first attempts, assistance, revisions and individual contribution',
'Introduce independent assessment and reviewer identity',
'Version artifacts and rubrics',
'Add consented optional recordings and accessible demonstrations',
'Support controlled private evidence sharing',
'Separate practice, reviewed competence, provider certificates and recognised qualifications']),
('Work simulations and AI teams',[
'Create coherent fictional organisations and licensed public/synthetic datasets',
'Add realistic briefs, incomplete requirements and changing constraints',
'Add clearly labelled AI client/teammate/manager/reviewer roles',
'Include handovers, incidents, deadlines and communication tasks',
'Prevent AI teammates from secretly completing assessed learner steps',
'Support supervised SME/volunteer briefs',
'Confirm host/institution recognition before calling an activity WIL']),
('Career discovery and matching',[
'Fetch current original-employer adverts including FNB',
'Check deadlines, qualification, experience, location and documents',
'Separate mandatory criteria from preferences',
'Match inspectable evidence to individual criteria',
'Explain gaps and recommend specific preparation tasks',
'Help uncertain learners compare several plausible directions',
'Connect resources/projects/simulations/credentials/experience into editable paths',
'Evaluate matching usefulness and fairness']),
('CV, portfolio and applications',[
'Generate truthful tailored CVs and motivation letters',
'Export readable DOCX and text-extractable PDF',
'Check headings, extraction order, dates, missing facts and evidence relevance',
'Build project case studies and digital portfolio',
'Draft LinkedIn headline/About/skills/Featured content from confirmed facts',
'Implement supported autofill and attachment workflows',
'Require appropriate destination/data/action permission',
'Track submission receipts, uncertain outcomes and feedback',
'Prevent duplicate applications',
'Keep applicant in control of live assessments and declarations']),
('Opportunities and experience',[
'Integrate verified internship/graduate/bursary/learnership/volunteer/WIL sources',
'Verify aggregator notices against original providers',
'Add hackathon dates/eligibility/team preparation/contribution records',
'Support permissioned networking and follow-up drafts',
'Track expiry, amendments and duplicates',
'Resolve provider/domain identity before accepting personal information']),
('Permissioned tools and panels',[
'Implement app-owned tool broker and MCP integrations',
'Add bounded web search/fetch with provenance',
'Run code/terminal in isolated workers with scoped files/network/runtime/budget',
'Implement cancellation/revocation/audit/error recovery',
'Build document/browser/video/artifact/tool-output workspace panels',
'Embed supported YouTube videos with relevant timestamps',
'Provide supported browser handoff for non-embeddable sites',
'Sandbox generated HTML/interactive explanations',
'Generate motion explainers and optional Remotion exports',
'Keep provider identity visible for login/upload/submission']),
('Commerce and SMEs',[
'Guided shop/product scans and confirmed inventory mapping',
'Separate observed, ledger and verified quantities',
'Record/reconcile sales, deliveries, damage and waste',
'Build cash-flow/costing/quoting/reporting tools',
'Add supplier comparisons and proposed orders',
'Provide sourced tender discovery and requirement checklists',
'Support owner-approved practical projects with confidentiality boundaries']),
('Production and reliability',[
'Implement authentication and per-user permissions',
'Add durable database and private object storage',
'Add cross-device progress, backups, export and deletion',
'Run bounded background extraction/render jobs with recovery',
'Measure provider quotas/cost and enforce usage limits',
'Recheck Google credits/expiry and Azure access before dependence',
'Choose evaluated API versus hosted/local model workers',
'Separate application API credentials from developer subscriptions',
'Deploy authenticated pilot environment',
'Optimise low-end phones, bundle size/loading and weak networks',
'Complete keyboard/screen-reader/contrast/reduced-motion/device checks']),
('Proof and competition',[
'Complete pending integrated Engineering interaction checks',
'Obtain domain review of educational content',
'Run learner usability and independent learning/transfer evaluation',
'Measure operating cost and failure rates',
'Test institutional/learner purchasing proposition',
'Verify current judging rules and map claims to working evidence',
'Rehearse dependable end-to-end demonstration',
'Prepare pitch, demo backup, technical docs and honest limitations',
'Keep bus/handoffs/capability status current'])]
assert len(areas)==15
packages=[
 dict(id='W1',worker='evidence',task='LUNA-EVIDENCE-001',status='in_progress',areas=[7,9,10],deliverable='Replay-derived unverified practice-artifact foundation',evidence=[],review=None),
 dict(id='W2',worker='tools_policy',task='LUNA-TOOLS-001',status='in_progress',areas=[12,14],deliverable='Mock consent/revocation/idempotency policy foundation; no real execution',evidence=[],review=None),
 dict(id='W3',worker='adaptive',task='LUNA-ADAPTIVE-001',status='in_progress',areas=[3,4,15],deliverable='Versioned transparent adaptive-practice policy',evidence=[],review=None),
 dict(id='W4',worker='worksim',task='LUNA-WORKSIM-001',status='queued',areas=[8,13],deliverable='Synthetic service/data work scenario and deterministic assessment',evidence=[],review=None),
 dict(id='W5',worker='integration',task='LUNA-EVIDENCE-UI-001',status='waiting_dependencies',areas=[7,8,9],deliverable='Learner-facing work/evidence workspace using reviewed modules',evidence=[],review=None)]
backlog={'version':1,'created':'2026-10-22','rule':'An item stays unfinished until its own acceptance is evidenced; narrower work packages do not auto-complete parent outcomes.','areas':[]}
for number,(title,items) in enumerate(areas,1):
 backlog['areas'].append({'id':number,'title':title,'status':'unfinished','items':[{'id':f'{number}.{index:02}','title':title,'status':'open','evidence':[],'reviewer':None} for index,title in enumerate(items,1)]})
if (ROOT/'backlog.json').exists():raise RuntimeError('Ledger already exists; update deliberately, do not overwrite')
(ROOT/'backlog.json').write_text(json.dumps(backlog,indent=2),encoding='utf8')
(ROOT/'wave-status.json').write_text(json.dumps({'checked':'2026-10-22','capacity':{'totalSlots':4,'rootReviewers':1,'maxConcurrentWorkers':3,'requestedWorkers':5},'packages':packages},indent=2),encoding='utf8')
print('Created 15 areas and',sum(len(a['items']) for a in backlog['areas']),'unfinished original-scope items.')
