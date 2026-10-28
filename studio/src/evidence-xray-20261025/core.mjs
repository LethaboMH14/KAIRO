// Evidence X-Ray pure runtime. No storage, providers, source fetching or generated answer keys.
const SID=/^[a-f0-9]{24}$/, SHA=/^[a-f0-9]{64}$/;
const NODE=/^[a-z][a-z0-9-]{1,70}$/;
const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const fail=(message)=>{throw new TypeError('Evidence X-Ray: '+message);};
function string(x,max,name){if(typeof x!=='string'||!x.trim()||x.length>max)fail('Invalid '+name);return x;}
function unique(items,key,label){const seen=new Set();for(const x of items){const value=key(x);if(seen.has(value))fail('Duplicate '+label);seen.add(value);}return seen;}
function refsOf(value){
 if(!Array.isArray(value)||value.length<1||value.length>8)fail('Source references out of range');
 const seen=new Set();
 return value.map(ref=>{
  if(!isObj(ref)||!SID.test(ref.sourceId)||!SHA.test(ref.revision)||seen.has(ref.sourceId))fail('Invalid or repeated source reference');
  seen.add(ref.sourceId);
  return {sourceId:ref.sourceId,revision:ref.revision};
 });
}
function parseEvidence(items,refs){
 if(!Array.isArray(items)||items.length<1||items.length>12)fail('Evidence must contain 1 to 12 bounded excerpts');
 const ownerRefs=new Map(refs.map(r=>[r.sourceId,r.revision]));
 let size=0;
 const parsed=items.map(e=>{
  if(!isObj(e)||!ownerRefs.has(e.sourceId)||ownerRefs.get(e.sourceId)!==e.sourceRevision||
     typeof e.id!=='string'||!e.id.startsWith(e.sourceId+'-'+e.sourceRevision.slice(0,12)+'-S')||
     !/^S[1-9][0-9]*-(0|[1-9][0-9]*)$/.test(e.id.slice(e.sourceId.length+14))||
     !Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<0||
     e.end<=e.start||e.end-e.start!==e.quote?.length||e.end>48000||
     typeof e.edited!=='boolean')fail('Evidence provenance or UTF-16 range does not match');
  string(e.title,120,'source title');string(e.locator,500,'locator');string(e.quote,1400,'quote');
  if(e.quote.includes('\u0000'))fail('Invalid quote text');
  const match=/^.*-S[1-9][0-9]*-(0|[1-9][0-9]*)$/.exec(e.id);
  if(!match||Number(match[1])!==e.start)fail('Evidence ID disagrees with start offset');
  size+=e.quote.length;
  return {id:e.id,sourceId:e.sourceId,sourceRevision:e.sourceRevision,title:e.title,locator:e.locator,
   quote:e.quote,start:e.start,end:e.end,edited:e.edited};
 });
 if(size>12000)fail('Excerpt budget exceeded');
 unique(parsed,e=>e.id,'evidence ID');
 return {evidence:parsed,chars:size};
}
function ensurePreview(value,refs){
 if(!isObj(value)||value.schemaVersion!==2||value.kind!=='reviewed-evidence-preview'||!SHA.test(value.bundleRevision)||!Array.isArray(value.sourceRefs)||value.sourceRefs.length!==refs.length)fail('Unexpected preview envelope');
 for(let i=0;i<refs.length;i++)if(value.sourceRefs[i]?.sourceId!==refs[i].sourceId||value.sourceRefs[i]?.revision!==refs[i].revision)fail('Selected revision changed');
 if(!isObj(value.selection)||value.selection.semantic!==false||
    value.selection.method!=='multi-source-lexical'||!Number.isSafeInteger(value.selection.selectedCharacters))fail('Invalid preview selection metadata');
 if(typeof value.notice!=='string'||!value.notice.includes('not a generated or saved lesson'))fail('Missing unsaved preview notice');
 const parsed=parseEvidence(value.evidence,refs);
 if(parsed.chars!==value.selection.selectedCharacters)fail('Evidence character count changed');
 return {schemaVersion:1,mode:'preview-only',exerciseId:'private-preview',exerciseRevision:value.bundleRevision,
  bundleRevision:value.bundleRevision,sourceRefs:refs,evidence:parsed.evidence,concepts:[],relations:[],challenges:[],
  disclosure:'Private reviewed excerpt preview only. No concept map, factual answer key, lesson save or automatic certification.'};
}
export function validatePrepared(input){
 if(!isObj(input)||input.schemaVersion!==1||input.mode!=='prepared'||
    !NODE.test(input.exerciseId)||!SHA.test(input.exerciseRevision)||!SHA.test(input.bundleRevision))fail('Invalid prepared exercise version');
 const sourceRefs=refsOf(input.sourceRefs);
 const {evidence}=parseEvidence(input.evidence,sourceRefs);
 if(!Array.isArray(input.concepts)||input.concepts.length<5||input.concepts.length>12)fail('Expected 5–12 prepared concepts');
 const evidenceIds=new Set(evidence.map(e=>e.id));
 const concepts=input.concepts.map(c=>{
  if(!isObj(c)||!NODE.test(c.id)||!Array.isArray(c.evidenceIds)||c.evidenceIds.length>12)fail('Invalid prepared concept');
  string(c.label,90,'concept title');string(c.summary,360,'concept explanation');
  unique(c.evidenceIds,x=>x,'concept citation');if(c.evidenceIds.some(id=>!evidenceIds.has(id)))fail('Concept cites unknown source');
  return {id:c.id,label:c.label,summary:c.summary,evidenceIds:[...c.evidenceIds]};
 });
 const nodeIds=unique(concepts,c=>c.id,'concept node');
 if(!Array.isArray(input.relations)||input.relations.length>32)fail('Relations exceed graph limit');
 const relations=input.relations.map(r=>{
  if(!isObj(r)||!nodeIds.has(r.from)||!nodeIds.has(r.to)||!['supported','unverified'].includes(r.kind)||
     !Array.isArray(r.evidenceIds)||r.evidenceIds.length>12)fail('Invalid relation');
  unique(r.evidenceIds,x=>x,'relation evidence');if(r.evidenceIds.some(x=>!evidenceIds.has(x)))fail('Unknown relation evidence');
  if(r.kind==='supported'&&r.evidenceIds.length===0)fail('Supported relations need curated evidence');
  if(r.kind==='unverified'&&r.evidenceIds.length)fail('Unverified relation cannot cite proof');
  return {...r,evidenceIds:[...r.evidenceIds]};
 });
 unique(relations,r=>r.from+'|'+r.to+'|'+r.kind,'relation'); // Cycles are intentional and allowed.
 if(!Array.isArray(input.challenges)||input.challenges.length!==2)fail('Exactly two curated rounds are required');
 const challenges=input.challenges.map(ch=>{
  if(!isObj(ch)||!NODE.test(ch.id)||!evidenceIds.has(ch.answerEvidenceId))fail('Invalid curated answer key');
  string(ch.claim,250,'challenge claim');string(ch.why,480,'curated reasoning');
  return {id:ch.id,claim:ch.claim,answerEvidenceId:ch.answerEvidenceId,why:ch.why};
 });
 unique(challenges,ch=>ch.id,'challenge ID');
 return {schemaVersion:1,mode:'prepared',exerciseId:input.exerciseId,exerciseRevision:input.exerciseRevision,
  bundleRevision:input.bundleRevision,sourceRefs,evidence,concepts,relations,challenges,
  disclosure:'KAIRO-authored, prepared and checked against the quoted teaching example. This is local unsaved practice, not an independent assessment.'};
}
export function makeGraph(activity){
 const concepts=activity.concepts;
 // Stable column/circle geometry independent of viewport: svg viewBox 0 0 960 600.
 const nodes=concepts.map((c,i)=>{
  const n=concepts.length,angle=-Math.PI/2+2*Math.PI*i/n;
  return {id:'concept:'+c.id,type:'concept',label:c.label,x:480+293*Math.cos(angle),y:289+207*Math.sin(angle),evidenceIds:c.evidenceIds};
 });
 activity.evidence.forEach((e,i)=>nodes.push({id:'evidence:'+e.id,type:'source',label:e.locator,x:480+105*Math.cos((i*2*Math.PI)/activity.evidence.length),y:290+90*Math.sin((i*2*Math.PI)/activity.evidence.length),evidenceIds:[e.id]}));
 activity.challenges.forEach((ch,i)=>nodes.push({id:'question:'+ch.id,type:'question',label:'Round '+(i+1),x:75+i*810,y:545,evidenceIds:[]}));
 const edges=[];
 for(const relation of activity.relations)edges.push({id:'relation:'+relation.from+':'+relation.to+':'+relation.kind,
  from:'concept:'+relation.from,to:'concept:'+relation.to,kind:relation.kind,evidenceIds:relation.evidenceIds});
 for(const c of concepts)for(const e of c.evidenceIds)edges.push({id:'citation:'+c.id+':'+e,from:'concept:'+c.id,to:'evidence:'+e,kind:'citation',evidenceIds:[e]});
 for(const ch of activity.challenges)edges.push({id:'question:'+ch.id,from:'question:'+ch.id,to:'evidence:'+ch.answerEvidenceId,kind:'question',evidenceIds:[]});
 unique(nodes,n=>n.id,'graph node');unique(edges,e=>e.id,'graph edge');
 return {nodes,edges};
}
/** Pure roving-focus target shared by real node key handlers and unit tests. */
export function graphFocusTarget(nodes,index,key){
 if(!Array.isArray(nodes)||!nodes.length||!Number.isInteger(index)||index<0||index>=nodes.length)return null;
 const count=nodes.length;
 const next=key==='Home'?0:key==='End'?count-1:
  key==='ArrowRight'||key==='ArrowDown'?(index+1)%count:
  key==='ArrowLeft'||key==='ArrowUp'?(index-1+count)%count:-1;
 return next<0?null:nodes[next].id;
}
export function startAttempts(activity){return {round:0,selectedEvidenceId:null,feedback:null,completed:false};}
export function chooseAttempt(activity,state,evidenceId){
 if(activity.mode!=='prepared'||state.completed||state.feedback||state.round>=activity.challenges.length) return state;
 if(!activity.evidence.some(e=>e.id===evidenceId))return state;
 return {...state,selectedEvidenceId:evidenceId};
}
export function submitAttempt(activity,state){
 if(activity.mode!=='prepared'||state.completed||state.feedback||!state.selectedEvidenceId)return state;
 const challenge=activity.challenges[state.round];const correct=state.selectedEvidenceId===challenge.answerEvidenceId;
 return {...state,feedback:{correct,answerEvidenceId:challenge.answerEvidenceId,chosenEvidenceId:state.selectedEvidenceId,
  why:challenge.why,claim:challenge.claim,unsaved:true}};
}
export function advanceAttempt(activity,state){
 if(activity.mode!=='prepared'||!state.feedback)return state;
 if(state.round===activity.challenges.length-1)return {...state,completed:true};
 return {round:state.round+1,selectedEvidenceId:null,feedback:null,completed:false};
}
export function checkCurrentSources(activity,catalog){
 if(!isObj(catalog)||catalog.reviewedSourcesVersion!==1||!Array.isArray(catalog.reviewedSources)||
    catalog.reviewedSources.length>100)return {ok:false,reason:'Current source status is unavailable. Refresh your material.'};
 const seen=new Set(),map=new Map();
 for(const source of catalog.reviewedSources){
  if(!isObj(source)||!SID.test(source.id)||seen.has(source.id))return {ok:false,reason:'The source catalog is inconsistent.'};
  seen.add(source.id);map.set(source.id,source);
 }
 for(const ref of activity.sourceRefs){const row=map.get(ref.sourceId);
  if(!row||row.reviewed!==true||row.revoked===true||row.deleted===true||row.revision!==ref.revision)
   return {ok:false,reason:'A selected source is unavailable, revoked or has changed. Review and select it again.'};
 }
 return {ok:true,reason:null};
}
export function readPreviewData(payload,sourceRefs){
 const refs=refsOf(sourceRefs);
 return ensurePreview(payload,refs);
}
export async function getAuthenticatedPreview({sourceRefs,goal='',fetcher=fetch,signal}){
 const refs=refsOf(sourceRefs);
 if(typeof goal!=='string'||goal.length>1000)fail('Study goal exceeds 1,000 characters');
 if(typeof fetcher!=='function')fail('Fetch adapter missing');
 const response=await fetcher('/api/workspace/bundle-preview',{method:'POST',credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({schemaVersion:2,mode:'local',sourceRefs:refs,goal}),signal});
 if(!response?.ok){const status=response?.status;throw new Error(status===401||status===403?
  'Sign in to view only your own reviewed sources.':status===409?
  'A source changed or is not authorized for this account. Refresh your selection.':
  'Private evidence preview unavailable. Nothing was saved.');}
 const raw=await response.text();
 if(raw.length>36000)fail('Preview response exceeds limit');
 let parsed;try{parsed=JSON.parse(raw);}catch{fail('Preview response is not JSON');}
 return readPreviewData(parsed,refs);
}
export async function refreshAuthenticatedCatalog({fetcher=fetch,signal}={}){
 const res=await fetcher('/api/workspace/catalog',{credentials:'same-origin',cache:'no-store',signal});
 if(!res?.ok)throw new Error('Sign in or refresh your reviewed material.');
 const raw=await res.text();if(raw.length>55000)fail('Catalog response exceeds limit');
 let data;try{data=JSON.parse(raw);}catch{fail('Invalid catalog');}
 if(!isObj(data)||data.reviewedSourcesVersion!==1||!Array.isArray(data.reviewedSources))fail('Reviewed catalog unavailable');
 return data;
}
/** Repeat owner-scoped catalog checks around the server-verified preview.
 * The server remains the sole authority; this detects stale browser selections
 * and revocations that happen while a preview request is in flight.
 */
export async function loadOwnerEvidence({sourceRefs,goal='',fetcher=fetch,signal}){
 const refs=refsOf(sourceRefs);
 const before=await refreshAuthenticatedCatalog({fetcher,signal});
 const beforeState=checkCurrentSources({sourceRefs:refs},before);
 if(!beforeState.ok)throw new Error(beforeState.reason);
 const activity=await getAuthenticatedPreview({sourceRefs:refs,goal,fetcher,signal});
 const after=await refreshAuthenticatedCatalog({fetcher,signal});
 const afterState=checkCurrentSources(activity,after);
 if(!afterState.ok)throw new Error(afterState.reason);
 return {activity,currentCatalog:after};
}
export const unsupportedClaim=()=> 'Not established by the selected sources.';
