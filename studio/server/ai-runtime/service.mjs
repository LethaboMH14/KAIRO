import {Router,raw} from 'express';
import {randomUUID,createHash} from 'node:crypto';
import {hash,validateLesson} from '../workspace/model.mjs';
import {resolvePassage,validatePassageHelp} from '../workspace/passages.mjs';
import {generateSourceLesson,generatePassageHelp,getToken} from '../google.mjs';
import {createModelGateway} from './gateway.mjs';
import {curateLesson,learnerPreferences} from './curator.mjs';
import {retrieveEvidence,createVertexReranker} from './retrieval.mjs';
import {listOpportunities} from '../opportunities/index.mjs';
import {validateLearnerPatternEvent} from '../../src/learner-pattern-events/index.ts';
import {createGroqTranscriber} from '../listening-core/transcription.mjs';
export function requestSignal(req,res){const controller=new AbortController();if(res.destroyed||req.aborted)controller.abort();const close=()=>{if(!res.writableEnded)controller.abort();};res.once('close',close);res.once('finish',()=>res.off('close',close));return controller.signal;}
export function createAiService({repository,getSource,getLesson,generate=generateSourceLesson,generateHelp=generatePassageHelp,env=process.env,reranker,external,transcribe=createGroqTranscriber({fetchImpl:fetch})}={}){
 const semantic=env.KAIRO_SEMANTIC_RETRIEVAL==='1'?(reranker||createVertexReranker({projectId:env.KAIRO_GOOGLE_PROJECT,getToken,location:env.KAIRO_EMBEDDING_LOCATION||'us-central1'})):null;
 const gateway=createModelGateway({repository,googleLesson:generate,googleHelp:generateHelp,googleRetrieval:semantic,env,external});
 const prefs=async uid=>learnerPreferences((await repository.get(uid,'progress','learner_preferences'))?.value);
 const current=async(uid,source)=>{const latest=await getSource(uid,source.id);return latest.revision===source.revision&&hash(latest.reviewedPages)===source.revision;};
 async function lesson({uid,source,goal,preferences,requestId=randomUUID(),provider='google',providerConsent=['google'],fallback,signal}){
  signal?.throwIfAborted();
  if(preferences!==undefined){const old=await repository.get(uid,'progress','learner_preferences');await repository.put(uid,'progress','learner_preferences',learnerPreferences(preferences),old?{version:old.version}:{create:true});}
  const rawHistory=(await repository.get(uid,'progress','learner_pattern_events'))?.value?.events;
  const history=(Array.isArray(rawHistory)?rawHistory:[]).filter(e=>validateLearnerPatternEvent(e).ok),curation=curateLesson({preferences:await prefs(uid),history,source,goal});
  const meteredSemantic=semantic&&Array.isArray(providerConsent)&&providerConsent.includes('google')&&gateway.status().providers.some(p=>p.id==='google'&&p.configured)?async({query,documents,signal})=>(await gateway.run({uid,requestId:'retrieval_'+hash(requestId).slice(0,48),revision:source.revision,provider:'google',consent:providerConsent,signal,payload:{task:'retrieval',query,documents},validate:scores=>{if(!Array.isArray(scores)||scores.length!==documents.length||scores.some(n=>!Number.isFinite(n)))throw new TypeError('Invalid retrieval scores.');return scores;},isCurrent:()=>current(uid,source)})).value:null;
  const selected=await retrieveEvidence({source,ownerId:uid,expectedOwnerId:uid,goal:curation.goal,semantic:meteredSemantic,signal});
  const result=await gateway.run({uid,requestId,revision:source.revision,provider,consent:providerConsent,fallback,signal,payload:{task:'lesson',evidence:selected.evidence,goal:curation.goal,curation},validate:raw=>validateLesson(raw,selected.evidence),isCurrent:()=>current(uid,source)});
  return {...result,selected,curation};
 }
 async function help({uid,context,requestId,provider='google',providerConsent=['google'],signal,isCurrent}){
  const result=await gateway.run({uid,requestId,revision:context.provenance.revision,provider,consent:providerConsent,signal,payload:{task:'help',context},validate:raw=>validatePassageHelp(raw,context),isCurrent});
  return {...result.value,model:result.model,provider:result.provider};
 }
 const router=Router();
 const route=fn=>async(req,res)=>{const abort=new AbortController();const close=()=>{if(!res.writableEnded)abort.abort();};res.on('close',close);try{await fn(req,res,abort.signal);}catch(e){if(!res.headersSent&&!res.destroyed)res.status([409,429].includes(e.status)?e.status:e instanceof TypeError?400:503).json({error:e instanceof TypeError||e.status===409||e.status===429?e.message:'KAIRO could not finish. Your source and prepared guide remain available.'});}finally{res.off('close',close);}};
 router.get('/ai/status',(_req,res)=>res.json(gateway.status()));
 router.post('/listening',raw({type:['audio/*','application/octet-stream'],limit:'8mb'}),route(async(req,res,signal)=>{
  if(req.get('X-Kairo-Consent')!=='groq')throw new TypeError('Choose to send this audio to Groq first.');
  if(!gateway.status().providers.some(p=>p.id==='groq'&&p.configured))throw new TypeError('Groq listening is not configured. Type your question instead.');
  if(!Buffer.isBuffer(req.body)||!req.body.length)throw new TypeError('Choose a supported audio file.');
  const uid=req.kairoIdentity?.uid||'local',audio=req.body,mimeType=req.get('Content-Type'),locale=req.get('X-Kairo-Language')||'unknown',digest=createHash('sha256').update(audio).digest('hex');
  const result=await gateway.run({uid,requestId:req.get('X-Kairo-Request')||randomUUID(),revision:'audio-'+digest,provider:'groq',consent:['groq'],signal,payload:{task:'audio',digest,mimeType,locale},perform:signal=>transcribe({audio,mimeType,locale,sourceLabel:'uploaded-file',apiKey:env.KAIRO_GROQ_API_KEY,signal}),validate:value=>value});
  res.json(result.value);
 }));
 router.get('/opportunities',route(async(req,res)=>{const profile=await prefs(req.kairoIdentity?.uid||'local');res.json(listOpportunities({now:new Date(),programme:profile.roleGoal||undefined}));}));
 router.get('/preferences',route(async(req,res)=>res.json(await prefs(req.kairoIdentity?.uid||'local'))));
 router.post('/pattern-events',route(async(req,res)=>{
  if(req.body?.consent!==true)throw new TypeError('Choose to save practice patterns first.');
  const uid=req.kairoIdentity?.uid||'local',doc=await getLesson(uid,req.body.lessonId),source=await getSource(uid,doc.sourceId);
  if(!await current(uid,source)||source.revision!==doc.revision)throw new TypeError('Reopen the current source lesson before saving a new pattern.');
  const {question,choice,eventId}=req.body,q=Number.isSafeInteger(question)&&doc.quiz?.[question];
  if(!q||!Number.isSafeInteger(choice)||choice<0||choice>=q.options.length)throw new TypeError('Choose an answer in this lesson.');
  const revision=hash(q),candidate={schemaVersion:1,eventId,lessonId:doc.id,sourceRevision:doc.revision,conceptId:`quiz-${question}`,taskId:`quiz-${question}`,taskRevision:revision,rubricRevision:revision,occurredAt:new Date().toISOString(),correct:choice===q.correct,helpExposure:'unknown',contextKey:'classroom-reading',assessmentKind:'practice'};
  const checked=validateLearnerPatternEvent(candidate);if(!checked.ok)throw new TypeError('Practice event is invalid.');
  for(let i=0;i<5;i++){
   const saved=await repository.get(uid,'progress','learner_pattern_events'),events=Array.isArray(saved?.value?.events)?saved.value.events:[];
   if(events.some(e=>e.eventId===eventId))return res.json({saved:true,duplicate:true});
   try{await repository.put(uid,'progress','learner_pattern_events',{schemaVersion:1,events:[...events,checked.event].slice(-500)},saved?{version:saved.version}:{create:true});return res.json({saved:true,helpExposure:'unknown'});}catch(e){if(e.status!==409)throw e;}
  }const error=new Error('Practice changed in another session. Your device record remains.');error.status=409;throw error;
 }));
 router.post('/preferences',route(async(req,res)=>{const uid=req.kairoIdentity?.uid||'local',old=await repository.get(uid,'progress','learner_preferences');res.json((await repository.put(uid,'progress','learner_preferences',learnerPreferences(req.body),old?{version:old.version}:{create:true})).value);}));
 router.post('/studio-help',route(async(req,res,signal)=>{
  if(req.body?.consent!==true)throw new TypeError('Choose to send this lesson and question for help.');
  const uid=req.kairoIdentity?.uid||'local',doc=await getLesson(uid,req.body.lessonId);
  const terms=String(req.body.question||'').concat(' ',String(req.body.selectedLabel||'')).toLowerCase().match(/[a-z]{4,}/g)||[];
  const ev=doc.evidence?.slice(0,12).map((e,i)=>({e,i,score:terms.reduce((n,t)=>n+(e.quote.toLowerCase().includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score||a.i-b.i)[0]?.e;
  if(!ev)throw new TypeError('Open a source-linked lesson first.');
  const profile=await prefs(uid),language=profile.language;
  const raw=(await repository.get(uid,'progress','learner_pattern_events'))?.value?.events;
  const recent=(Array.isArray(raw)?raw:[]).filter(e=>validateLearnerPatternEvent(e).ok&&e.sourceRevision===doc.revision).slice(-5).map(({correct,helpExposure,taskId})=>({correct,helpExposure,taskId}));
  const variables={};for(const key of ['frequencyHz','poles','speedRpm','valvePct']){const v=req.body.variables?.[key];if(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10000)variables[key]=v;}if(typeof req.body.variables?.supply==='string'&&/^(normal|swap-[UVW]{2}|open-[UVW])$/.test(req.body.variables.supply))variables.supply=req.body.variables.supply;
  const context=resolvePassage(doc,{kind:'lesson',revision:doc.revision,evidenceId:ev.id,start:0,end:Math.min(ev.quote.length,1200),action:'explain',question:typeof req.body.question==='string'?req.body.question:''});
  if(!['motor','pump'].includes(req.body.studio))throw new TypeError('Choose a supported studio.');
  context.language=language;context.lesson={title:String(doc.title||'').slice(0,120),objective:String(doc.objective||'').slice(0,350)};context.learner={roleGoal:profile.roleGoal,pace:profile.pace,recentPractice:recent,limitation:'Learner-authored practice with unknown assistance; not verified competence.'};context.scene={variables,studio:req.body.studio,selectedLabel:String(req.body.selectedLabel||'').slice(0,100),nextStep:String(req.body.nextStep||'').slice(0,100),readings:Number.isSafeInteger(req.body.readings)&&req.body.readings>=0?Math.min(req.body.readings,1000):null};
  const source=await getSource(uid,doc.sourceId);
  if(source.revision!==doc.revision)throw new TypeError('This lesson uses an older source. Open its source revision before asking for new help.');
  res.json(await help({uid,context,requestId:req.body.requestId,provider:req.body.provider||'google',providerConsent:req.body.providerConsent||['google'],signal,isCurrent:()=>current(uid,source)}));
 }));
 return {router,lesson,help,status:gateway.status};
}
