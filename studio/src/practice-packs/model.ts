export type Criterion={id:string;label:string};
export type RoleSource={id:string;title:string;url:string;capabilities:string[]};
export type Revision={id:string;summary:string};
export type Choice={id:string;label:string;disposition:'defensible'|'unsafe';demonstrates:string[];rationale:string};
export type PackStep={id:string;title:string;prompt:string;hint:string;revision?:Revision;choices:Choice[]};
export type PracticePack={id:string;version:string;title:string;fictionalOrganization:string;fictionalNotice:string;roleSources:RoleSource[];criteria:Criterion[];steps:PackStep[]};

const discoveryBa='https://careers.discovery.co.za/job/Sandton-1-Discovery-Place-Business-Analyst-GP-2196/1447995633/';
const discoverySupport='https://careers.discovery.co.za/job/Sandton-1-Discovery-Place-Service-Consultant-Digital-Support-GP-2196/1448356033/';

function freezeDeep<T>(value:T):T{
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  Object.freeze(value);
  for(const child of Object.values(value as Record<string,unknown>))freezeDeep(child);
 }
 return value;
}

const authoredPacks:PracticePack[]=[
 {
  id:'fictional-requirements-uat',version:'1.0.0',title:'Conflicting requests: progress reporting',
  fictionalOrganization:'Northstar Study Circle (invented fictional organization)',
  fictionalNotice:'All people, requests and data in this scenario are invented. This is authored practice, not a Discovery or FNB assessment or endorsement.',
  roleSources:[{id:'discovery-business-analyst-2026',title:'Discovery Business Analyst role page',url:discoveryBa,capabilities:['eliciting and translating business requirements','business process modelling','solution design and testing/UAT','stakeholder engagement and incident analysis']}],
  criteria:[
   {id:'clarify-purpose',label:'Clarify the purpose and intended audience'},
   {id:'protect-data',label:'Avoid exposing identifiable learner data without an agreed basis'},
   {id:'incorporate-revision',label:'Reflect the learner representative’s revised requirement'},
   {id:'separate-audiences',label:'Keep personal learner access distinct from group reporting'},
   {id:'trace-uat',label:'Connect UAT checks to the revised requirement'},
   {id:'accessibility-check',label:'Include an accessibility check'},
   {id:'escalate-policy',label:'Leave unresolved policy questions visible and owned'}
  ],
  steps:[
   {id:'scope-request',title:'Clarify the request',prompt:'A fictional sponsor asks for a progress export to plan coaching. The audience, purpose, fields, retention and privacy rules have not been agreed. What do you do first?',hint:'Separate the business question from the requested format. Identify who needs which information and what must be confirmed before any personal data is shared.',choices:[
    {id:'ask-and-record',label:'Ask the sponsor and learner representative to confirm purpose, audience, fields and retention; record what is still unknown before drafting.',disposition:'defensible',demonstrates:['clarify-purpose','protect-data'],rationale:'This makes the need and audience explicit before committing to a data design. Keep the open questions visible in the notes.'},
    {id:'bounded-proposal',label:'Offer a provisional group trend plus a learner’s own progress view, with no personal export; ask the stakeholders to confirm the audience and privacy rules before approval.',disposition:'defensible',demonstrates:['clarify-purpose','protect-data','separate-audiences'],rationale:'A bounded option can help the discussion while leaving approval and unresolved privacy details with the stakeholders.'},
    {id:'export-identifiable',label:'Prepare a named learner-by-learner progress export immediately so the sponsor can decide how to use it.',disposition:'unsafe',demonstrates:[],rationale:'Do not create or share identifiable learner records before the purpose, audience and approved handling rules are established. Clarify the request first.'}
   ]},
   {id:'revised-requirement',title:'Incorporate a revised requirement',prompt:'Update the draft requirement or pause it safely. The fictional learner representative has added an accessibility need; group-level handling rules remain undecided.',hint:'Keep learner self-access and sponsor reporting as separate audiences. A documented pause with an owner and questions is a valid outcome when policy is missing.',revision:{id:'requirements-revision-2',summary:'The learner representative requests accessible access to each learner’s own progress. The sponsor still wants group trends. No small-group suppression threshold, audience approval or retention period has been agreed.'},choices:[
    {id:'separate-own-and-group',label:'Revise the requirement into an accessible learner self-view and a separate group trend for the sponsor. Exclude personal exports and assign an owner to confirm small-group handling and retention before release.',disposition:'defensible',demonstrates:['incorporate-revision','separate-audiences','escalate-policy'],rationale:'This incorporates the new need while preserving the unresolved rules as release conditions rather than inventing them.'},
    {id:'pause-for-owner',label:'Pause the detailed specification. Record the revised learner need, keep personal exports out of scope, and ask the policy owner to settle audience, retention and small-group handling.',disposition:'defensible',demonstrates:['incorporate-revision','protect-data','escalate-policy'],rationale:'Pausing is reasonable when decisions belong to an accountable owner. The unanswered questions stay in the record.'},
    {id:'send-named-report',label:'Meet both requests with a named report sent to the sponsor and leave the accessibility work for a later phase.',disposition:'unsafe',demonstrates:[],rationale:'This exposes personal records without approved handling and drops a stated accessibility need. Revise or pause the requirement instead.'}
   ]},
   {id:'uat-plan',title:'Choose a UAT and release path',prompt:'The fictional team needs a UAT plan. The small-group policy is still not defined. Which next step is defensible?',hint:'Trace each test to a requirement. Use invented test accounts, check both audiences and assistive access, and do not sign off while a required policy is unresolved.',choices:[
    {id:'test-and-gate',label:'Test with synthetic learner and sponsor accounts; verify accessible own-progress access, group-only output and traceability. Keep release blocked until an owner defines and approves the small-group rule.',disposition:'defensible',demonstrates:['trace-uat','accessibility-check','separate-audiences','escalate-policy'],rationale:'This defines useful UAT while keeping the unknown policy as a visible release gate.'},
    {id:'pause-signoff',label:'Ask the policy owner to define the small-group rule first; document the planned synthetic role/accessibility tests and withhold UAT sign-off until the rule is testable.',disposition:'defensible',demonstrates:['trace-uat','accessibility-check','escalate-policy'],rationale:'A test plan can be prepared, but sign-off should wait until the missing policy has an owner and a testable rule.'},
    {id:'email-test-rows',label:'Email sample named learner rows to the sponsor so they can approve the layout before UAT.',disposition:'unsafe',demonstrates:[],rationale:'Use synthetic test data and role-appropriate views. Do not email identifiable learner records to resolve a layout question.'}
   ]}
  ]
 },
 {
  id:'fictional-digital-support',version:'1.0.0',title:'Digital support: account access and an inaccessible upload control',
  fictionalOrganization:'Northstar Study Circle (invented fictional organization)',
  fictionalNotice:'All people, incidents and data in this scenario are invented. This is authored practice, not a Discovery or FNB assessment or endorsement. Never enter real account details, passwords, one-time codes or documents.',
  roleSources:[{id:'discovery-digital-support-2026',title:'Discovery Service Consultant: Digital Support role page',url:discoverySupport,capabilities:['troubleshooting digital platforms','guiding users through digital tools and account security','logging, tracking and resolving technical incidents']}],
  criteria:[
   {id:'protect-secrets',label:'Do not request or record passwords or one-time codes'},
   {id:'safe-recovery',label:'Use an approved recovery route or escalate verification uncertainty'},
   {id:'safe-diagnosis',label:'Troubleshoot with synthetic or non-sensitive details'},
   {id:'accessibility-path',label:'Address the screen-reader barrier or escalate it'},
   {id:'redacted-record',label:'Keep the incident record free of secrets and unnecessary personal data'},
   {id:'communicate-next-step',label:'Explain whether the case is resolved or who owns the follow-up'}
  ],
  steps:[
   {id:'account-access',title:'Respond safely to an access problem',prompt:'In this invented training case, a learner cannot sign in to Northstar Study Circle. They offer to read out a one-time code so you can try signing in for them. What is your next step?',hint:'The support worker should not handle secrets. Use the organization’s approved verification and recovery route; if it is unclear, pause and ask the designated owner.',choices:[
    {id:'approved-recovery',label:'Tell the learner not to share the code or password. Use the approved verification and self-service recovery steps, then record only the non-sensitive issue and outcome.',disposition:'defensible',demonstrates:['protect-secrets','safe-recovery','redacted-record'],rationale:'Support can guide recovery without collecting authentication secrets. Keep the incident record limited to necessary non-sensitive facts.'},
    {id:'escalate-verification',label:'Do not accept any secret. If the approved verification route is unavailable or unclear, explain the pause and escalate to the account-support owner.',disposition:'defensible',demonstrates:['protect-secrets','safe-recovery','communicate-next-step'],rationale:'Escalating an unclear verification path is safer than improvising an identity check.'},
    {id:'request-code',label:'Ask the learner to share the one-time code or password so you can sign in on their behalf.',disposition:'unsafe',demonstrates:[],rationale:'Never request or accept a password or one-time code. Use approved recovery or escalate without handling the secret.'},
    {id:'bypass-check',label:'Skip identity checks so the learner can get back to the lesson faster.',disposition:'unsafe',demonstrates:[],rationale:'Do not bypass account verification. Use the approved recovery route or escalate.'}
   ]},
   {id:'upload-accessibility',title:'Respond to the updated case',prompt:'The fictional learner now says the screen reader does not announce the upload control. Choose a safe diagnostic or escalation path; there is no real file to inspect.',hint:'Confirm only the technical context needed to reproduce the issue. A synthetic file, an accessible alternative and a named follow-up owner can help without collecting the learner’s document.',revision:{id:'support-case-update-2',summary:'The scripted case update adds a screen-reader barrier at the upload control. The cause is unknown; no browser defect or user error has been established.'},choices:[
    {id:'reproduce-synthetically',label:'Ask which screen reader and browser are in use, reproduce with a synthetic test account and empty test file, and record the control/step without account secrets or document contents.',disposition:'defensible',demonstrates:['safe-diagnosis','accessibility-path','redacted-record'],rationale:'A controlled reproduction gathers technical context without using private credentials or the learner’s document.'},
    {id:'offer-and-escalate',label:'Offer the approved accessible submission route, record a redacted incident summary and escalate the control issue to the accessibility/support owner.',disposition:'defensible',demonstrates:['accessibility-path','redacted-record','communicate-next-step'],rationale:'An accessible alternative and clear owner keep the learner informed while the cause remains unresolved.'},
    {id:'disable-assistance',label:'Ask the learner to turn off the screen reader and send the real document so you can test the control.',disposition:'unsafe',demonstrates:[],rationale:'Do not remove an accessibility aid or collect a real document for this practice case. Use a synthetic reproduction or escalate.'}
   ]},
   {id:'close-or-escalate',title:'Record the outcome',prompt:'The cause is still uncertain unless the learner confirms that an accessible route worked. What should the incident record and next step say?',hint:'Do not label an incident resolved without confirmation. A safe escalation includes an owner and a clear next update, without guessing at the cause.',choices:[
    {id:'resolve-after-confirmation',label:'If the learner confirms the accessible route works, record that confirmation and the non-sensitive steps. Otherwise keep the case open; do not claim a fix.',disposition:'defensible',demonstrates:['redacted-record','communicate-next-step'],rationale:'Resolution is conditional on confirmation. The note reports what was observed rather than guessing at the underlying cause.'},
    {id:'keep-open-escalate',label:'Keep the case open, state that the cause is unknown, name the accessibility/support owner and give the learner a clear next update point.',disposition:'defensible',demonstrates:['redacted-record','communicate-next-step','safe-diagnosis'],rationale:'This preserves uncertainty and gives the learner a concrete next step without overstating resolution.'},
    {id:'guess-and-close',label:'Close the incident as a browser error without confirming the cause or an accessible route.',disposition:'unsafe',demonstrates:[],rationale:'The scripted evidence does not establish a browser cause or successful resolution. Keep it open or close only after confirmation.'}
   ]}
  ]
 }
];

export const practicePacks:readonly PracticePack[]=freezeDeep(authoredPacks);
export function getPracticePack(id:string):PracticePack|undefined{return practicePacks.find(pack=>pack.id===id);}

export type EventKind='choice'|'hint'|'revision'|'reflection';
export type PracticeEvent={kind:EventKind;at:string;stepId:string|null;attempt:number|null;choiceId?:string;advances?:boolean;demonstrated?:string[];hintId?:string;hintText?:string;revisionId?:string;revisionText?:string;text?:string;feedback?:string};
export type PracticeRun={runId:string;packId:string;packVersion:string;startedAt:string;stepIndex:number;events:PracticeEvent[];reflection:string;feedback:string;notice:string};
export type Action={type:'choose';choiceId:string}|{type:'hint'}|{type:'reflect';text:string};
const MAX_ACTIONS=120,MAX_REFLECTION=1000,MAX_RUN_ID=64,MAX_CHOICE_ID=80;
const slugPattern=/^[a-z0-9][a-z0-9._-]{0,63}$/;
const timestampPattern=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

function validTimestamp(value:unknown):value is string{
 if(typeof value!=='string')return false;
 const match=timestampPattern.exec(value);if(!match)return false;
 const [,ys,mos,ds,hs,mis,ss,fraction='0']=match;
 const year=Number(ys),month=Number(mos),day=Number(ds),hour=Number(hs),minute=Number(mis),second=Number(ss),millisecond=Number(fraction.padEnd(3,'0'));
 if(year<1||month<1||month>12||hour>23||minute>59||second>59)return false;
 const date=new Date(0);date.setUTCFullYear(year,month-1,day);date.setUTCHours(hour,minute,second,millisecond);
 return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day&&date.getUTCHours()===hour&&date.getUTCMinutes()===minute&&date.getUTCSeconds()===second&&date.getUTCMilliseconds()===millisecond;
}
function frozenRun(run:PracticeRun):PracticeRun{return freezeDeep(run);}
function notice(run:PracticeRun,message:string):PracticeRun{return frozenRun({...run,notice:message});}
function eventCount(run:PracticeRun):number{return run.events.filter(event=>event.kind!=='revision').length;}
function attemptCount(run:PracticeRun,stepId:string):number{return run.events.filter(event=>event.kind==='choice'&&event.stepId===stepId).length;}
function append(run:PracticeRun,events:PracticeEvent[],stepIndex=run.stepIndex,reflection=run.reflection,feedback=''):PracticeRun{return frozenRun({...run,stepIndex,events:[...run.events,...events],reflection,feedback,notice:''});}

export function initialRun(packId:string,runId:string,startedAt:string):PracticeRun{
 const pack=getPracticePack(packId);
 if(!pack)throw new Error('Unknown practice pack.');
 if(typeof runId!=='string'||runId.length>MAX_RUN_ID||!slugPattern.test(runId))throw new Error('Run ID must be a short lowercase identifier.');
 if(!validTimestamp(startedAt))throw new Error('Start time must be a real UTC calendar timestamp.');
 return frozenRun({runId,packId,packVersion:pack.version,startedAt,stepIndex:0,events:[],reflection:'',feedback:'',notice:''});
}

function applyAction(run:PracticeRun,action:Action,at:string):PracticeRun{
 const pack=getPracticePack(run.packId);
 if(!pack||run.packVersion!==pack.version)return notice(run,'This scenario version is unavailable; the action was not recorded.');
 if(!validTimestamp(at))return notice(run,'The action needs a valid UTC calendar timestamp.');
 const lastAt=run.events.at(-1)?.at??run.startedAt;
 if(Date.parse(at)<Date.parse(lastAt))return notice(run,'The action time moved backwards, so it was not recorded.');
 if(eventCount(run)>=MAX_ACTIONS)return notice(run,'This practice run reached its action limit. Export the record before starting another run.');
 const step=pack.steps[run.stepIndex];
 if(action?.type==='reflect'){
  if(run.stepIndex!==pack.steps.length)return notice(run,'Finish the scenario steps before adding a reflection.');
  if(typeof action.text!=='string'||action.text.trim().length===0||action.text.length>MAX_REFLECTION)return notice(run,`Reflection must contain 1–${MAX_REFLECTION} characters. It is saved without assessment.`);
  return append(run,[{kind:'reflection',at,stepId:null,attempt:null,text:action.text.trim(),feedback:'Reflection saved without assessment.'}],run.stepIndex,action.text.trim(),'Reflection saved without assessment.');
 }
 if(!step)return notice(run,'The scenario is complete. No further choices are available.');
 const attempt=attemptCount(run,step.id)+1;
 if(action?.type==='hint'){
  const hintsThisAttempt=run.events.filter(event=>event.kind==='hint'&&event.stepId===step.id&&event.attempt===attempt).length;
  if(hintsThisAttempt>=2)return notice(run,'You have used both hints for this attempt. A retry begins a new attempt and keeps this help history.');
  const hintId=`${step.id}-hint-${hintsThisAttempt+1}`;
  return append(run,[{kind:'hint',at,stepId:step.id,attempt,hintId,hintText:step.hint,feedback:step.hint}],run.stepIndex,run.reflection,step.hint);
 }
 if(action?.type!=='choose'||typeof action.choiceId!=='string'||action.choiceId.length>MAX_CHOICE_ID)return notice(run,'Choose one of the listed options.');
 const choice=step.choices.find(option=>option.id===action.choiceId);
 if(!choice)return notice(run,'That choice is not part of this scenario step.');
 const advances=choice.disposition==='defensible';
 const chosen:PracticeEvent={kind:'choice',at,stepId:step.id,attempt,choiceId:choice.id,advances,demonstrated:advances?[...choice.demonstrates]:[],feedback:choice.rationale};
 if(!advances)return append(run,[chosen],run.stepIndex,run.reflection,choice.rationale);
 const nextIndex=run.stepIndex+1,nextStep=pack.steps[nextIndex];
 const generated:PracticeEvent[]=[chosen];
 if(nextStep?.revision)generated.push({kind:'revision',at,stepId:nextStep.id,attempt:null,revisionId:nextStep.revision.id,revisionText:nextStep.revision.summary});
 return append(run,generated,nextIndex,run.reflection,choice.rationale);
}

export function transition(run:PracticeRun,action:Action,at:string):PracticeRun{
 const verified=replayRun(run);
 if(!verified)return notice(run,'This run history is invalid, so the action was not recorded.');
 return applyAction(verified,action,at);
}

function sameEvent(left:PracticeEvent,right:PracticeEvent):boolean{return JSON.stringify(left)===JSON.stringify(right);}
export function replayRun(snapshot:PracticeRun):PracticeRun|null{
 if(!snapshot||typeof snapshot!=='object'||!Array.isArray(snapshot.events)||snapshot.events.length>MAX_ACTIONS+practicePacks.length)return null;
 let replay:PracticeRun;
 try{replay=initialRun(snapshot.packId,snapshot.runId,snapshot.startedAt);}catch{return null;}
 if(snapshot.packVersion!==replay.packVersion)return null;
 let index=0;
 while(index<snapshot.events.length){
  const original=snapshot.events[index];if(!original||!validTimestamp(original.at))return null;
  let action:Action;
  if(original.kind==='choice'&&typeof original.choiceId==='string')action={type:'choose',choiceId:original.choiceId};
  else if(original.kind==='hint')action={type:'hint'};
  else if(original.kind==='reflection'&&typeof original.text==='string')action={type:'reflect',text:original.text};
  else return null;
  const next=applyAction(replay,action,original.at);
  if(next.events.length<=replay.events.length)return null;
  const emitted=next.events.slice(replay.events.length);
  if(index+emitted.length>snapshot.events.length)return null;
  for(let offset=0;offset<emitted.length;offset++)if(!sameEvent(emitted[offset],snapshot.events[index+offset]))return null;
  replay=next;index+=emitted.length;
 }
 if(!Number.isInteger(snapshot.stepIndex)||snapshot.stepIndex!==replay.stepIndex||snapshot.reflection!==replay.reflection||snapshot.feedback!==replay.feedback)return null;
 return replay;
}

export type CriterionCheck={criterionId:string;label:string;status:'demonstrated-in-selected-choice'|'unresolved'};
export type PracticeExport={format:'kairo-practice-pack-export-v1';provenance:{fictionalScenario:true;unverified:true;independentAssessment:false;employerEndorsement:false;reflectionAssessed:false;note:string};scenario:{id:string;version:string;title:string;fictionalOrganization:string;fictionalNotice:string};roleContext:RoleSource[];record:{runId:string;startedAt:string;status:'practice-sequence-complete'|'practice-in-progress';currentStep:string|null;events:PracticeEvent[];checks:CriterionCheck[];reflection:string}};

export function exportRun(snapshot:PracticeRun):PracticeExport{
 const replay=replayRun(snapshot);if(!replay)throw new Error('This practice history does not replay, so it cannot be exported.');
 const pack=getPracticePack(replay.packId)!;
 const demonstrated=new Set(replay.events.filter(event=>event.kind==='choice'&&event.advances===true).flatMap(event=>event.demonstrated??[]));
 const currentStep=pack.steps[replay.stepIndex]?.id??null;
 return freezeDeep({format:'kairo-practice-pack-export-v1',provenance:{fictionalScenario:true,unverified:true,independentAssessment:false,employerEndorsement:false,reflectionAssessed:false,note:'This is learner-authored formative practice in an invented scenario. Selected choices replay through the authored rules; no employer assessment, verified skill, credential or job outcome is asserted.'},scenario:{id:pack.id,version:pack.version,title:pack.title,fictionalOrganization:pack.fictionalOrganization,fictionalNotice:pack.fictionalNotice},roleContext:pack.roleSources.map(source=>({...source,capabilities:[...source.capabilities]})),record:{runId:replay.runId,startedAt:replay.startedAt,status:replay.stepIndex===pack.steps.length?'practice-sequence-complete':'practice-in-progress',currentStep,events:replay.events.map(event=>({...event,demonstrated:event.demonstrated?[...event.demonstrated]:undefined})),checks:pack.criteria.map(criterion=>({criterionId:criterion.id,label:criterion.label,status:demonstrated.has(criterion.id)?'demonstrated-in-selected-choice':'unresolved'})),reflection:replay.reflection}});
}

export function currentStep(run:PracticeRun):PackStep|null{return getPracticePack(run.packId)?.steps[run.stepIndex]??null;}
