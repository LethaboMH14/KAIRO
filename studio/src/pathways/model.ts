import {collectArtifacts} from '../evidence/model.ts';
export const evidenceLevels = {unknown:0,self:.25,artifact:.5,reviewReported:1} as const;
export type EvidenceLevel=keyof typeof evidenceLevels;
export type Evidence={level:EvidenceLevel;note:string};
export type Criterion={id:string;label:string;weight:number;task:string;resource:string;resourceLabel:string};
export const roles=[
 {id:'graduate',title:'Explore banking graduate work',subtitle:'Analysis, customer needs and teamwork',source:'https://firstrand.wd3.myworkdayjobs.com/en-GB/FRB/job/Johannesburg/FNB-Graduate-Programme_R46834?q=graduate',reference:'FNB R46834',deadline:'2026-08-31',status:'closed',context:'Historical graduate advert. Relevant final-year BSc/Commerce background and academic transcript are separate entry conditions; your eligibility has not been checked.',criteria:[
  {id:'analysis',label:'Analytical problem solving',weight:2,task:'Investigate a synthetic stock discrepancy. Show calculations, competing explanations and the limits of your conclusion.',resource:'/practice',resourceLabel:'Open the working shop case'},
  {id:'customer',label:'Understand a customer need',weight:2,task:'Write five clarifying questions for a fictional shop owner. Turn the answers into three testable acceptance criteria.',resource:'/sources',resourceLabel:'Choose your course material'},
  {id:'delivery',label:'Planning, records and team delivery',weight:1,task:'Keep a task log, document your contribution and produce a short handover another person can follow.',resource:'https://learn.github.com/',resourceLabel:'Explore GitHub learning'}]},
 {id:'analyst',title:'Explore business analysis',subtitle:'Requirements, processes and useful questions',source:'https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/Randburg/Business-Analyst-1_R37730',reference:'FNB R37730',deadline:null,status:'unverified',context:'Historical employer excerpt describes requirements work. Full eligibility and current availability were not established. This is a preparation route, not an open-vacancy recommendation.',criteria:[
  {id:'elicitation',label:'Elicit and validate requirements',weight:2,task:'Interview a fictional client from an authored brief. Separate stated needs, assumptions and unanswered questions.',resource:'/sources',resourceLabel:'Review a source or assignment'},
  {id:'specification',label:'Translate needs into solution requirements',weight:2,task:'Map the stock-handling process and write acceptance criteria for damage records, including an exception case.',resource:'/practice',resourceLabel:'Inspect the working shop case'},
  {id:'communication',label:'Explain the requirement decisions',weight:1,task:'Create a one-page handover linking each proposed feature to the need it addresses. This is KAIRO practice guidance, not an extracted mandatory criterion.',resource:'https://www.theforage.com/',resourceLabel:'Explore provider job simulations'}]},
 {id:'data',title:'Explore data quality and analytics',subtitle:'Data flows, root causes and clear findings',source:'https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/Data-Analyst-II_R48624',reference:'FNB R48624',deadline:'2026-04-28',status:'closed',context:'Historical experienced-role example, not a graduate opening. Full professional experience requirements must be reviewed on a current advert.',criteria:[
  {id:'quality',label:'Investigate data quality and root causes',weight:2,task:'Use synthetic transactions with duplicates and missing values. Explain which totals are reliable and which need investigation.',resource:'https://www.postgresql.org/docs/current/tutorial-sql.html',resourceLabel:'Read the official SQL tutorial'},
  {id:'flows',label:'Understand data sources and flows',weight:2,task:'Draw the path from a source record to a report. Write a reproducible SQL check at each transformation.',resource:'/',resourceLabel:'Open the computer science studio'},
  {id:'findings',label:'Communicate improvement proposals',weight:1,task:'Present one data-quality finding, evidence, likely impact and a cautious recommendation. Explain what you cannot conclude.',resource:'/sources',resourceLabel:'Build from your own source material'}]}
] as const;
export type RoleId=typeof roles[number]['id'];
export type PathwayState={version:1;roleId:RoleId;evidence:Record<string,Evidence>;goal:string};
export const PATHWAY_KEY='kairo-role-preparation-v1';
export const PATHWAY_ARTIFACT_LINKS_KEY='kairo-pathway-artifact-links-v1';
export type PathwayArtifactLink={version:1;roleId:RoleId;criterionId:string;runId:string;artifactVersion:string;scenarioVersion:string;title:string;source:'browser-local profile';linkedAt:string};
export type ArtifactLinkStatus={link:PathwayArtifactLink;artifact:import('../evidence/model.ts').PracticeArtifact|null;reason:string|null};
const MAX_LINKS_JSON_LENGTH=32_000;
const isCanonicalLinkTime=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
export function initialPathway():PathwayState{return {version:1,roleId:'graduate',evidence:{},goal:''};}
export function parsePathway(raw:string|null):PathwayState{
 if(!raw)return initialPathway();const v=JSON.parse(raw);
 if(v?.version!==1||!roles.some(r=>r.id===v.roleId)||typeof v.goal!=='string'||v.goal.length>1000||!v.evidence||typeof v.evidence!=='object'||Array.isArray(v.evidence))throw Error('Unsupported preparation record.');
 const allowed=new Set<string>(roles.flatMap(r=>r.criteria.map(c=>c.id)));const evidence:Record<string,Evidence>={};
 for(const [id,value] of Object.entries(v.evidence)){
  const e=value as Evidence;
  if(!allowed.has(id)||!e||!Object.hasOwn(evidenceLevels,e.level)||typeof e.note!=='string'||e.note.length>1200)throw Error('Invalid evidence record.');
  evidence[id]={level:e.level,note:e.note};
 }
 return {version:1,roleId:v.roleId,evidence,goal:v.goal};
}
export function coverage(criteria:readonly Criterion[],evidence:Record<string,Evidence>){
 let earned=0,total=0,unknown=0;const rows=criteria.map(c=>{
  const e=evidence[c.id];const level=e&&Object.hasOwn(evidenceLevels,e.level)&&e.note.trim()?e.level:'unknown';
  total+=c.weight;earned+=c.weight*evidenceLevels[level];if(level==='unknown')unknown+=c.weight;
  return {...c,level,points:evidenceLevels[level]};
 });
 return {percent:total?Math.round(100*earned/total):null,unassessed:total?Math.round(100*unknown/total):100,rows,next:[...rows].sort((a,b)=>(b.weight*(1-b.points))-(a.weight*(1-a.points))).filter(r=>r.points<1).slice(0,3)};
}
export function parsePathwayArtifactLinks(raw:string|null):PathwayArtifactLink[]{
 if(!raw)return [];if(raw.length>MAX_LINKS_JSON_LENGTH)throw Error('Saved practice links are too large to read.');const v=JSON.parse(raw);
 if(v?.version!==1||!Array.isArray(v.links)||v.links.length>100)throw Error('Saved practice links could not be read.');
 const links:PathwayArtifactLink[]=[];const seen=new Set<string>();
 for(const item of v.links){
  const role=roles.find(r=>r.id===item?.roleId);
  if(item?.version!==1||!role||typeof item.criterionId!=='string'||!role.criteria.some(c=>c.id===item.criterionId)||typeof item.runId!=='string'||!item.runId||item.runId.length>100||typeof item.artifactVersion!=='string'||!item.artifactVersion||item.artifactVersion.length>120||typeof item.scenarioVersion!=='string'||!item.scenarioVersion||item.scenarioVersion.length>120||typeof item.title!=='string'||!item.title||item.title.length>200||item.source!=='browser-local profile'||!isCanonicalLinkTime(item.linkedAt))throw Error('Saved practice link is invalid.');
  const key=`${item.roleId}:${item.criterionId}:${item.runId}`;if(seen.has(key))throw Error('Saved practice links contain a duplicate.');seen.add(key);links.push({version:1,roleId:item.roleId,criterionId:item.criterionId,runId:item.runId,artifactVersion:item.artifactVersion,scenarioVersion:item.scenarioVersion,title:item.title,source:'browser-local profile',linkedAt:item.linkedAt});
 }
 return links;
}
export function createPathwayArtifactLink(roleId:RoleId,criterionId:string,artifact:import('../evidence/model.ts').PracticeArtifact,linkedAt:string):PathwayArtifactLink{
 const role=roles.find(r=>r.id===roleId);if(!role||!role.criteria.some(c=>c.id===criterionId))throw Error('Choose a criterion in the selected role.');
 if(!artifact||typeof artifact.runId!=='string'||!artifact.runId||artifact.runId.length>100||typeof artifact.title!=='string'||!artifact.title||artifact.title.length>200||typeof artifact.artifactVersion!=='string'||!artifact.artifactVersion||artifact.artifactVersion.length>120||typeof artifact.scenarioVersion!=='string'||!artifact.scenarioVersion||artifact.scenarioVersion.length>120||artifact.source!=='browser-local profile')throw Error('Choose a replayable practice artifact.');
 if(!isCanonicalLinkTime(linkedAt))throw Error('A canonical UTC link time is required.');
 return {version:1,roleId,criterionId,runId:artifact.runId,artifactVersion:artifact.artifactVersion,scenarioVersion:artifact.scenarioVersion,title:artifact.title,source:artifact.source,linkedAt};
}
export function createPathwayArtifactLinkFromProfile(roleId:RoleId,criterionId:string,profile:unknown,runId:string,linkedAt:string):PathwayArtifactLink{
 const matches=collectArtifacts(profile).filter(item=>item.runId===runId);
 if(matches.length!==1)throw Error(matches.length?'This run ID is ambiguous in the current profile. Resolve the duplicate records before linking.':'This run is no longer available or no longer passes replay checks. Refresh the list and choose a current practice record.');
 const artifact=matches[0];
 return createPathwayArtifactLink(roleId,criterionId,artifact,linkedAt);
}
export function resolvePathwayArtifactLink(link:PathwayArtifactLink,artifacts:readonly import('../evidence/model.ts').PracticeArtifact[]):ArtifactLinkStatus{
 const matches=artifacts.filter(a=>a.runId===link.runId);
 if(matches.length!==1)return {link,artifact:null,reason:matches.length?'This run ID is ambiguous in the current profile. Resolve the duplicate records before linking.':'This run is no longer available or no longer passes replay checks.'};
 const artifact=matches[0];
 if(artifact.artifactVersion!==link.artifactVersion||artifact.scenarioVersion!==link.scenarioVersion||artifact.title!==link.title||artifact.source!==link.source)return {link,artifact:null,reason:'The saved run title or version changed. Review the current artifact before linking it again.'};
 return {link,artifact,reason:null};
}
export function deadlineState(deadline:string|null,today:string){return !deadline?'unknown':today>deadline?'closed':'recheck';}
export function pathwayMarkdown(state:PathwayState,artifactLinks:readonly ArtifactLinkStatus[]=[]){
 const role=roles.find(r=>r.id===state.roleId)!;const score=coverage(role.criteria,state.evidence);
 return `# KAIRO role preparation\n\n${role.title}\nEmployer reference: ${role.reference}\nSource: ${role.source}\nSource checked: 2026-10-21\nAvailability: ${role.status}; deadline ${role.deadline||'unverified'}\n${role.context}\n\nGoal: ${state.goal||'Not entered'}\n\n## Evidence coverage\n\n${score.percent}% KAIRO coverage; ${score.unassessed}% unassessed weight. All entries, including reported reviews, are user-entered and unverified. Not an employer/ATS score or hiring prediction.\n\n${score.rows.map(c=>{const linked=artifactLinks.filter(row=>row.link.roleId===state.roleId&&row.link.criterionId===c.id);return `### ${c.label}\nWeight: ${c.weight} (KAIRO rubric)\nLevel: ${c.level}\nEvidence note: ${state.evidence[c.id]?.note||'Not supplied'}\n${linked.length?`Linked practice:\n${linked.map(row=>row.artifact?`- ${row.link.title}; run ${row.link.runId}; artifact ${row.link.artifactVersion}; scenario ${row.link.scenarioVersion}; source ${row.link.source}; inspect at /evidence`:`- Unavailable: ${row.link.title}; run ${row.link.runId}; ${row.reason||'Review this saved link.'}`).join('\n')}\n`:''}Next task: ${c.task}\nResource: ${c.resource}\n`;}).join('\n')}\n## Portfolio and CV preparation\n\nDescribe only work you actually completed, your contribution, data provenance, tools, results and limitations. Link inspectable artifacts. Do not call a simulation employment or claim a certificate you have not earned. Use standard headings and selectable text, then check the actual employer's instructions. No guaranteed ATS pass.\n\nPrivate draft. Nothing was submitted or independently assessed.\n`;
}
