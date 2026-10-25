import {createHash} from 'node:crypto';

export class TransientAIError extends Error {}
export function createMemoryBudget(limitMicrousd=13_000_000){
 if(!Number.isSafeInteger(limitMicrousd)||limitMicrousd<0)throw new TypeError('Invalid budget.');
 let reserved=0;const requests=new Map();
 return {get reservedMicrousd(){return reserved;},reserve(amount){if(!Number.isSafeInteger(amount)||amount<0||amount>limitMicrousd-reserved)throw new Error('AI allowance exhausted.');reserved+=amount;},once(id,fingerprint,start){const old=requests.get(id);if(old){if(old.fingerprint!==fingerprint)throw new Error('Request ID already belongs to different content.');return old.promise;}if(requests.size>=1000)throw new Error('Request ledger full.');const promise=Promise.resolve().then(start);requests.set(id,{fingerprint,promise});return promise;}};
}

/** Prototype admission controller. A cloud deployment must inject a durable transactional ledger. */
export function createTaskRouter({adapters,budget,now=()=>Date.now()}){
 if(!budget||typeof budget.once!=='function'||typeof budget.reserve!=='function')throw new TypeError('An explicit budget ledger is required.');
 return function run({ownerId,requestId,revision,payload,candidates,consent=[],signal,validate,isCurrent=()=>true,timeoutMs=45000}){
  if(typeof ownerId!=='string'||!/^[-a-zA-Z0-9_]{1,128}$/.test(ownerId)||typeof requestId!=='string'||!/^[-a-zA-Z0-9_]{8,100}$/.test(requestId)||typeof revision!=='string'||!revision||revision.length>128)throw new TypeError('Owner, request and source revision required.');
  if(!Array.isArray(candidates)||candidates.length<1||candidates.length>2||typeof validate!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>60000)throw new TypeError('Invalid bounded task policy.');
  if(!Array.isArray(consent)||consent.some(p=>typeof p!=='string'))throw new TypeError('Explicit provider consent list required.');
  const snapshot=structuredClone(payload);const encoded=JSON.stringify(snapshot);if(typeof encoded!=='string'||encoded.length>32000)throw new TypeError('Task input too large.');
  const policy=structuredClone(candidates);const grants=new Set(consent);
  for(const c of policy)if(!c||!['google','aiml'].includes(c.provider)||typeof c.model!=='string'||!/^[-\w./:]{1,150}$/.test(c.model)||!Number.isSafeInteger(c.maxCostMicrousd)||c.maxCostMicrousd<1||!Number.isFinite(c.quotedAt)||c.quotedAt>now()||now()-c.quotedAt>86400000)throw new TypeError('Task needs an explicit model and fresh bounded price reservation.');
  const fingerprint=createHash('sha256').update(JSON.stringify({ownerId,revision,snapshot,policy,consent:[...grants].sort()})).digest('hex');
  return budget.once(`${ownerId}:${requestId}`,fingerprint,async()=>{
   const deadline=AbortSignal.timeout(timeoutMs);const combined=signal?AbortSignal.any([signal,deadline]):deadline;
   const check=()=>{combined.throwIfAborted();if(!isCurrent(revision))throw new Error('Source changed; discard this result.');};
   for(let index=0;index<policy.length;index++){
    check();const c=policy[index];if(!grants.has(c.provider))throw new Error(`Consent required for ${c.provider}.`);
    if(typeof adapters[c.provider]!=='function')throw new Error('Selected provider is not configured.');
    budget.reserve(c.maxCostMicrousd); // Reserve before dispatch; failed requests may still be billed.
    let remove=()=>{};
    try{
     const cancelled=new Promise((_,reject)=>{const abort=()=>reject(combined.reason);combined.addEventListener('abort',abort,{once:true});remove=()=>combined.removeEventListener('abort',abort);if(combined.aborted)abort();});
     const raw=await Promise.race([Promise.resolve().then(()=>{check();return adapters[c.provider]({model:c.model,payload:structuredClone(snapshot),signal:combined});}),cancelled]);
     check();const result=await validate(raw,revision);check();return {result,provider:c.provider,model:c.model,revision,reservedMicrousd:c.maxCostMicrousd};
    }catch(error){check();if(!(error instanceof TransientAIError)||index===policy.length-1)throw error;}
    finally{remove();}
   }
  });
 };
}
