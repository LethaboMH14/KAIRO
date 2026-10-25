import {retrieveBalancedBundle} from './balanced-retrieval.mjs';
import {Router,json} from 'express';
import {randomBytes} from 'node:crypto';
import {prepareOwnedLessonBundle,parseLessonSelection} from '../owner-retrieval/lesson-contract.mjs';
import {createLessonV2Record,verifyLessonV2Record,saveLessonV2Record} from '../lesson-v2/record.mjs';
import {buildLocalBundleLesson} from '../bundle-lesson-local/plan.mjs';
import {hash,validateLesson} from '../workspace/model.mjs';
import {createModelGateway} from '../ai-runtime/gateway.mjs';
import {generateSourceLesson,generatePassageHelp} from '../google.mjs';
import {learnerPreferences} from '../ai-runtime/curator.mjs';
import {validatePassageHelp} from '../workspace/passages.mjs';
import {requestSignal} from '../ai-runtime/service.mjs';
const ID=/^[a-f0-9]{24}$/;
const problem=(message,status=409)=>Object.assign(new Error(message),{status});
export function createBundleLessons({repository,gateway=createModelGateway({repository,googleLesson:generateSourceLesson,googleHelp:generatePassageHelp}),reserveGlobal=async()=>{}}={}){
 const mapped={get:(uid,kind,id)=>repository.get(uid,kind==='lessons'?'progress':kind,kind==='lessons'?'bundle_'+id:id),put:(uid,kind,id,value,options)=>repository.put(uid,kind==='lessons'?'progress':kind,kind==='lessons'?'bundle_'+id:id,value,options),remove:(uid,kind,id,options)=>repository.remove(uid,kind==='lessons'?'progress':kind,kind==='lessons'?'bundle_'+id:id,options)};
 async function read(uid,id,signal){if(!ID.test(id||''))throw new TypeError('Choose a valid multi-source lesson.');const saved=await mapped.get(uid,'lessons',id);if(!saved)throw problem('This lesson is unavailable in your account.',404);await verifyLessonV2Record({repository:mapped,ownerId:uid,record:saved.value,signal});return{record:saved.value,version:saved.version};}
 async function reserveCreation(uid,signal){
  const key='bundle_daily_'+new Date().toISOString().slice(0,10).replaceAll('-','');
  for(let attempt=0;attempt<4;attempt++){signal?.throwIfAborted();const old=await repository.get(uid,'progress',key);const count=old?.value?.count||0;if(!Number.isSafeInteger(count)||count<0||count>=30)throw problem('Your daily multi-source lesson allowance is used. Continue an existing lesson.',429);try{await repository.put(uid,'progress',key,{count:count+1},old?{version:old.version}:{create:true});return;}catch(e){if(e.status!==409||attempt===3)throw e;}}
 }
 async function create(uid,request,signal){
  const parsed=parseLessonSelection(request);if(parsed.schemaVersion!==2)throw new TypeError('Choose reviewed sources for this lesson.');
  const bundle=await prepareOwnedLessonBundle({repository:mapped,ownerId:uid,request,signal,retrieve:retrieveBalancedBundle});await reserveCreation(uid,signal);let content,model,servedBundle=bundle;
  if(parsed.mode==='local')content=buildLocalBundleLesson(bundle);
  else{
   const prefs=learnerPreferences((await repository.get(uid,'progress','learner_preferences'))?.value);
   await reserveGlobal('generation',100);
   const result=await gateway.run({uid,requestId:parsed.requestId,revision:bundle.bundleRevision,provider:parsed.provider,consent:parsed.providerConsent,fallback:parsed.fallback,signal,
    payload:{task:'lesson',goal:parsed.goal,evidence:bundle.evidence,sourceRefs:bundle.sourceRefs,bundleRevision:bundle.bundleRevision,curation:{...prefs,goal:parsed.goal||prefs.goal,reason:'Use your confirmed preferences and the selected reviewed sources. Output needs review.'}},
    validate:raw=>validateLesson(raw,bundle.evidence),isCurrent:bundle.isCurrent});
   if(!parsed.providerConsent.includes(result.provider))throw problem('The responding provider was not approved.');
   content=result.value;model=result.model;servedBundle={...bundle,request:{...bundle.request,provider:result.provider,fallback:undefined}};
  }
  signal?.throwIfAborted();return await saveLessonV2Record({repository:mapped,ownerId:uid,bundle:servedBundle,content,model,id:randomBytes(12).toString('hex'),signal});
 }
 async function sources(uid){const entries=await repository.list(uid,'sources',{limit:100});return entries.filter(x=>x.value?.reviewed===true&&ID.test(x.value.id||'')).map(({value:s})=>({id:s.id,title:s.title,revision:s.revision,sections:s.reviewedPages?.length||0}));}
 async function work(uid,id,signal){const lesson=await read(uid,id,signal);const item=await repository.get(uid,'progress','bundlework_'+id);if(item&&item.value.bundleRevision!==lesson.record.bundleRevision)throw problem('Your saved work belongs to another source revision.');return{...lesson,work:item?.value||null,workVersion:item?.version||null};}
 async function saveWork(uid,id,input,signal){
  const current=await work(uid,id,signal),r=current.record;
  if(!input||input.bundleRevision!==r.bundleRevision||input.version!==current.workVersion)throw problem('Saved work changed. Reload before saving.');
  if(!Number.isSafeInteger(input.step)||input.step<0||input.step>=r.chapters.length||typeof input.notes!=='string'||input.notes.length>12000||!Array.isArray(input.answers)||input.answers.length>r.quiz.length)throw new TypeError('Check your chapter, notes and practice choices.');
  const seen=new Set();const answers=input.answers.map(a=>{if(!a||!Number.isSafeInteger(a.question)||a.question<0||a.question>=r.quiz.length||seen.has(a.question)||!Number.isSafeInteger(a.choice)||a.choice<0||a.choice>3)throw new TypeError('Check each practice choice.');seen.add(a.question);return{question:a.question,choice:a.choice,correct:a.choice===r.quiz[a.question].correct};});
  const value={schemaVersion:1,lessonId:id,bundleRevision:r.bundleRevision,step:input.step,notes:input.notes,answers,updatedAt:new Date().toISOString(),assessment:'Source-linked practice; not verified mastery or a credential.'};
  signal?.throwIfAborted();const saved=await repository.put(uid,'progress','bundlework_'+id,value,current.workVersion?{version:current.workVersion}:{create:true});await read(uid,id,signal);return{work:value,workVersion:saved.version};
 }
 async function edit(uid,id,input,signal){const old=await read(uid,id,signal);if(input?.version!==old.version)throw problem('This lesson changed. Reload before editing.');
  const content=validateLesson(input.content,old.record.evidence);
  if(hash(content.quiz)!==hash(old.record.quiz)||content.chapters.length!==old.record.chapters.length||content.chapters.some((c,i)=>hash(c.citationIds)!==hash(old.record.chapters[i].citationIds)))throw new TypeError('Edit wording only. Keep practice questions, chapter order and source citations unchanged.');
  const next={...old.record,...content,reviewWarning:'You edited this lesson. Source citations are preserved; educational correctness is not independently verified.'};
  await verifyLessonV2Record({repository:mapped,ownerId:uid,record:next,signal});
  signal?.throwIfAborted();const saved=await mapped.put(uid,'lessons',id,next,{version:old.version});try{await read(uid,id,signal);}catch(error){try{await mapped.put(uid,'lessons',id,old.record,{version:saved.version});}catch{}throw error;}return{record:next,version:saved.version};
 }
 async function help(uid,id,input,signal){
  if(input?.consent!==true||input.provider!=='google'||!Array.isArray(input.providerConsent)||input.providerConsent.length!==1||input.providerConsent[0]!=='google'||typeof input.question!=='string'||!input.question.trim()||input.question.length>300||!['motor','pump'].includes(input.studio))throw new TypeError('Choose source processing consent, a question and a supported studio.');
  const allowed=input.studio==='motor'?{frequencyHz:[0,1000],poles:[2,16],supply:null}:{speedRpm:[0,10000],valvePct:[0,100]};
  if(input.variables!==undefined&&(!input.variables||typeof input.variables!=='object'||Array.isArray(input.variables)||Object.entries(input.variables).some(([key,value])=>{if(!Object.hasOwn(allowed,key))return true;if(key==='supply')return typeof value!=='string'||!/^(normal|swap-[UVW]{2}|open-[UVW])$/.test(value);const range=allowed[key];return typeof value!=='number'||!Number.isFinite(value)||value<range[0]||value>range[1]||key==='poles'&&(!Number.isInteger(value)||value%2!==0);})))throw new TypeError('Choose supported studio variables within their ranges.');
  const {record}=await read(uid,id,signal),preferences=learnerPreferences((await repository.get(uid,'progress','learner_preferences'))?.value);
  const terms=(input.question+' '+String(input.selectedLabel||'')).toLowerCase().match(/[a-z]{3,}/g)||[];
  const evidence=[...record.evidence].sort((a,b)=>terms.filter(t=>b.quote.toLowerCase().includes(t)).length-terms.filter(t=>a.quote.toLowerCase().includes(t)).length)[0];
  const context={action:'explain',language:preferences.language,selection:evidence.quote,context:evidence.quote,question:input.question,scene:{kind:input.studio,selected:String(input.selectedLabel||'').slice(0,160),variables:input.variables||{}},lesson:{title:record.title,objective:record.objective},provenance:{kind:'bundle',id,revision:record.bundleRevision,sourceId:evidence.sourceId,sourceRevision:evidence.sourceRevision,evidenceId:evidence.id,locator:evidence.locator}};
  await reserveGlobal('passages',100);const result=await gateway.run({uid,requestId:input.requestId,revision:record.bundleRevision,provider:'google',consent:['google'],signal,payload:{task:'help',context},validate:raw=>validatePassageHelp(raw,context),isCurrent:async()=>{try{await read(uid,id,signal);return true;}catch(e){if(signal?.aborted)throw e;return false;}}});
  if(result.provider!=='google')throw problem('The responding provider was not approved.');return{...result.value,model:result.model,provider:result.provider};
 }
 async function list(uid,signal){const items=(await repository.list(uid,'progress',{limit:500})).filter(x=>x.value?.schemaVersion===2&&ID.test(x.value.id||'')&&x.value.bundleRevision).slice(0,100),lessons=[];for(const item of items){signal?.throwIfAborted();try{const result=await read(uid,item.value.id,signal);lessons.push({id:result.record.id,title:result.record.title,available:true});}catch(error){if(signal?.aborted)throw error;lessons.push({id:item.value.id,title:String(item.value.title||'Earlier lesson').slice(0,120),available:false});}}return{lessons,catalogLimit:100};}
 const router=Router();router.use((req,_res,next)=>/^\/bundle-(sources|lessons)(\/|$)/.test(req.path)?next():next('router'));router.use(json({limit:'96kb'}));router.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 const route=fn=>async(req,res)=>{const uid=req.kairoIdentity?.uid;if(!uid)return res.status(401).json({error:'Sign in to use your private lessons.'});try{await fn(uid,req,res,requestSignal(req,res));}catch(e){if(!res.headersSent&&!res.destroyed)res.status([404,409,429].includes(e.status)?e.status:e instanceof TypeError?400:503).json({error:e instanceof TypeError||[404,409,429].includes(e.status)?e.message:'This lesson could not finish. Your reviewed material remains available.'});}};
 router.get('/bundle-sources',route(async(uid,_req,res)=>res.json({sources:await sources(uid),providers:gateway.status().providers.filter(p=>p.configured).map(p=>p.id)})));
 router.get('/bundle-lessons',route(async(uid,_req,res,signal)=>res.json(await list(uid,signal))));
 router.post('/bundle-lessons',route(async(uid,req,res,signal)=>res.status(201).json(await create(uid,req.body,signal))));
 router.get('/bundle-lessons/:id',route(async(uid,req,res,signal)=>res.json(await work(uid,req.params.id,signal))));
 router.post('/bundle-lessons/:id/work',route(async(uid,req,res,signal)=>res.json(await saveWork(uid,req.params.id,req.body,signal))));
 router.post('/bundle-lessons/:id/help',route(async(uid,req,res,signal)=>res.json(await help(uid,req.params.id,req.body,signal))));
 router.post('/bundle-lessons/:id/edit',route(async(uid,req,res,signal)=>res.json(await edit(uid,req.params.id,req.body,signal))));
 return{router,create,read,work,saveWork,edit,sources,help,list};
}
