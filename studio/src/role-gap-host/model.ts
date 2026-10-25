export type RoleRequirement={id:string;label:string;kind:string;sourceLocator:string;sourceExcerpt:string};
export type RoleProgramme={requirementsReviewed?:boolean;id:string;title:string;provider:string;url:string;checkedAt:string;availability:string;availabilityNote:string;requirements:RoleRequirement[];suggestedProjects:Array<{id:string;title:string;requirementIds:string[];boundary:string}>};
export type LinkedWork={roleId:string;requirementId:string;requirementText:string;sourceUrl:string;checkedAt:string;runId:string;scenarioVersion:string;linkedAt:string;reason:string};
export type WorkArtifact={runId:string;scenarioVersion:string;title:string};
export const ROLE_LINKS_KEY='kairo-role-requirement-links-v1';
export async function persistRoleLink({storage,expectedRaw,link,withLock}:{storage:{getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void};expectedRaw:string|null;link:LinkedWork;withLock:((work:()=>Promise<string>)=>Promise<string>)|null}):Promise<string>{
 if(typeof withLock!=='function')throw Error('This browser cannot coordinate safe practice-link writes. Keep your work and use a supported browser.');
 return withLock(async()=>{
  const raw=storage.getItem(ROLE_LINKS_KEY);
  if(raw!==expectedRaw)throw Error('Requirement links changed in another tab. Earlier links are protected; reload before saving.');
  const current=parseRoleLinks(raw),next=[...current.filter(l=>!(l.roleId===link.roleId&&l.requirementId===link.requirementId)),link],saved=JSON.stringify({schemaVersion:1,links:next});
  storage.setItem(ROLE_LINKS_KEY,saved);return saved;
 });
}
export function parseRoleLinks(raw:string|null):LinkedWork[]{
 if(raw===null)return [];
 const value=JSON.parse(raw);
 if(value?.schemaVersion!==1||!Array.isArray(value.links)||value.links.length>100)throw Error('Saved requirement links could not be read.');
 const seen=new Set<string>();
 return value.links.map((link:LinkedWork)=>{
  if(!link||['roleId','requirementId','requirementText','sourceUrl','checkedAt','runId','scenarioVersion','linkedAt','reason'].some(key=>typeof link[key as keyof LinkedWork]!=='string'||!link[key as keyof LinkedWork].trim()||link[key as keyof LinkedWork].length>1000))throw Error('Invalid saved requirement link.');
  const key=link.roleId+':'+link.requirementId;if(seen.has(key))throw Error('Ambiguous saved requirement links.');seen.add(key);
  return {...link};
 });
}
export function makeRoleLink(role:RoleProgramme,requirementId:string,artifacts:WorkArtifact[],runId:string,at:string,reason='Learner-selected reference; relevance needs review'):LinkedWork{
 const requirement=role.requirements.find(r=>r.id===requirementId),matches=artifacts.filter(a=>a.runId===runId);
 if(!requirement||requirement.kind!=='skill')throw Error('Practice cannot establish a degree, experience threshold or other formal condition.');
 if(matches.length!==1)throw Error('Choose one current, unambiguous practice record.');
 if(typeof reason!=='string'||!reason.trim()||reason.length>600)throw Error('Explain why this practice is relevant in up to 600 characters.');
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(at)||!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)throw Error('A valid link date is required.');
 return {roleId:role.id,requirementId,requirementText:requirement.label,sourceUrl:role.url,checkedAt:role.checkedAt,runId,scenarioVersion:matches[0].scenarioVersion,linkedAt:at,reason:reason.trim()};
}
export function roleGapRows(role:RoleProgramme,links:LinkedWork[],artifacts:WorkArtifact[]){
 return role.requirements.map(requirement=>{
  const link=links.find(l=>l.roleId===role.id&&l.requirementId===requirement.id);
  const matches=link?artifacts.filter(a=>a.runId===link.runId&&a.scenarioVersion===link.scenarioVersion):[];
  const current=!!link&&requirement.kind==='skill'&&link.requirementText===requirement.label&&link.sourceUrl===role.url&&link.checkedAt===role.checkedAt&&matches.length===1;
  return {id:requirement.id,label:requirement.label,sourceTitle:`${role.provider} — ${requirement.sourceLocator}`,sourceUrl:role.url,checkedAt:role.checkedAt,
   evidenceStatus:current?'linked' as const:link||requirement.kind!=='skill'?'needs-review' as const:'missing' as const,
   evidenceLabel:current?`${matches[0].title} — learner-selected practice link, not verified competence. Relevance: ${link!.reason}`:link?'The linked record or requirement changed. Recheck it.':null,
   nextActionLabel:requirement.kind==='skill'?'Choose practice or a learning step':'Review this condition'};
 });
}
