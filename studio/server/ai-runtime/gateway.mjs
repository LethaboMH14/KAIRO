import {createHash,randomUUID} from 'node:crypto';
import {configuredProviders,completeExternal,ProviderUnavailable} from './providers.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const fail=(message,status)=>{const e=new Error(message);e.status=status;throw e;};
export function createModelGateway({repository,googleLesson,googleHelp,googleRetrieval,env=process.env,clock=()=>Date.now(),external=completeExternal}){
 if(!repository?.get||!repository?.put)throw new TypeError('A durable owner repository is required.');
 const status=()=>({providers:configuredProviders(env).map(({id,name,model,configured})=>({id,name,model,configured})),semanticRetrieval:env.KAIRO_SEMANTIC_RETRIEVAL==='1',usage:'Conservative daily reservations; provider billing may differ.'});
 async function reserve(uid,key,amount){
  const day='ai_usage_'+new Date(clock()).toISOString().slice(0,10).replaceAll('-','');
  for(let i=0;i<6;i++){const old=await repository.get(uid,'progress',day),v=old?.value||{reserved:0,requests:{}};if(v.requests[key])return;
   const cap=Number(env.KAIRO_AI_DAILY_MICROUSD||1000000);if(!Number.isSafeInteger(cap)||cap<0||v.reserved+amount>cap||Object.keys(v.requests).length>=64)fail('Today’s AI allowance is used. Reading remains available.',429);
   try{await repository.put(uid,'progress',day,{reserved:v.reserved+amount,requests:{...v.requests,[key]:amount}},{...(old?{version:old.version}:{create:true})});return;}catch(e){if(e.status!==409)throw e;}
  }fail('Another request is updating your allowance. Try again.',409);
 }
 async function run({uid,requestId=randomUUID(),revision,payload,provider='google',consent=[],fallback,signal,validate,isCurrent=async()=>true,perform}){
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(requestId)||typeof uid!=='string'||!uid||!revision||typeof validate!=='function')throw new TypeError('An owner, request and reviewed revision are required.');
  if(!Array.isArray(consent)||consent.some(p=>typeof p!=='string'))throw new TypeError('Provider consent must be an explicit list.');
  if(JSON.stringify(payload).length>50000)throw new TypeError('AI input exceeds the limit.');
  const allowed=configuredProviders(env).filter(p=>p.configured),candidates=[provider,...(fallback&&fallback!==provider?[fallback]:[])];
  if(candidates.length>2||candidates.some(p=>!allowed.some(x=>x.id===p)||!consent.includes(p)))throw new TypeError('Choose an enabled provider and explicitly consent to each provider.');
  const fingerprint=hash({revision,payload,candidates}),key='ai_req_'+hash(requestId).slice(0,48),old=await repository.get(uid,'progress',key);
  if(old){if(old.value.fingerprint!==fingerprint)fail('Request ID belongs to different content.',409);if(old.value.status==='complete'){if(!await isCurrent())fail('The source changed. Regenerate from the current revision.',409);return old.value.result;}fail('This request already started. Use a new request after checking your saved work.',409);}
  const record=await repository.put(uid,'progress',key,{fingerprint,status:'started',revision,startedAt:new Date(clock()).toISOString()},{create:true});
  const combined=signal?AbortSignal.any([signal,AbortSignal.timeout(60000)]):AbortSignal.timeout(60000);
  let cancelled=()=>{};
  try{
   for(const name of candidates){combined.throwIfAborted();if(!await isCurrent())fail('The reviewed source changed.',409);
    const config=allowed.find(p=>p.id===name),amount=name==='aiml'?Number(env.KAIRO_AIML_RESERVATION_MICROUSD):name==='google'?20000:1;
    await reserve(uid,key+'_'+name,amount);
    try{
     const abort=new Promise((_,reject)=>{cancelled=()=>reject(combined.reason);combined.addEventListener('abort',cancelled,{once:true});if(combined.aborted)cancelled();});
     const work=perform?perform(combined):name==='google'?(payload.task==='retrieval'?googleRetrieval({...payload,signal:combined}):payload.task==='lesson'?googleLesson({...payload,signal:combined}):googleHelp({...payload.context,signal:combined})):external({provider:name,model:config.model,payload,signal:combined,env});
     const raw=await Promise.race([work,abort]);combined.throwIfAborted();if(!await isCurrent())fail('The reviewed source changed.',409);
     const result={value:await validate(raw),provider:name,model:payload.task==='audio'?'whisper-large-v3-turbo':payload.task==='retrieval'?'gemini-embedding-001':name==='openrouter'&&config.model==='openrouter/free'&&typeof raw.__providerModel==='string'?raw.__providerModel:config.model,revision};
     combined.throwIfAborted();if(!await isCurrent())fail('The reviewed source changed.',409);
     await repository.put(uid,'progress',key,{fingerprint,status:'complete',revision,result},{version:record.version});return result;
    }catch(e){if(!(e instanceof ProviderUnavailable)||name===candidates.at(-1))throw e;}finally{combined.removeEventListener('abort',cancelled);}
   }
  }catch(e){await repository.put(uid,'progress',key,{fingerprint,status:'failed',revision},{version:record.version}).catch(()=>{});throw e;}
 }
 return {run,status};
}
