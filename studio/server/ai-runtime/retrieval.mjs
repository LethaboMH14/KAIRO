import {selectEvidence} from '../../src/evidence-selection-core/model.ts';
export async function retrieveEvidence({source,ownerId,expectedOwnerId,goal='',semantic,signal}){
 if(!ownerId||ownerId!==expectedOwnerId)throw new TypeError('Private source owner does not match.');
 signal?.throwIfAborted();
 const base=selectEvidence(source,goal,{maxCharacters:12000,maxChunks:12});
 if(!semantic||!goal.trim())return {...base,retrieval:{method:base.selection.method,semantic:false,sourceRevision:source.revision}};
 // Rerank only evidence already derived from this owned reviewed revision.
 const candidates=base.evidence.slice(0,8);
 const scores=await semantic({query:goal.slice(0,1000),documents:candidates.map(e=>e.quote),signal});
 signal?.throwIfAborted();
 if(!Array.isArray(scores)||scores.length!==candidates.length||scores.some(v=>!Number.isFinite(v)))throw new TypeError('Semantic retrieval did not return valid scores.');
 const evidence=candidates.map((e,i)=>({...e,rank:scores[i]+1/(i+2)})).sort((a,b)=>b.rank-a.rank).map(({rank,...e})=>e);
 return {evidence,selection:{...base.selection,method:'hybrid-reviewed-source',selectedCharacters:evidence.reduce((n,e)=>n+e.quote.length,0)},retrieval:{method:'lexical-plus-semantic-rerank',semantic:true,sourceRevision:source.revision,scope:'Up to eight lexical candidates from this reviewed source; not a global document index.'}};
}
export function createVertexReranker({projectId,getToken,fetchFn=fetch,model='gemini-embedding-001',location='us-central1'}){
 if(!/^[a-z][a-z0-9-]{4,62}$/.test(projectId)||model!=='gemini-embedding-001'||!/^[-a-z0-9]+$/.test(location))throw new TypeError('Invalid embedding configuration.');
 return async({query,documents,signal})=>{
  if(documents.length>8)throw new TypeError('Embedding candidate limit exceeded.');
  const token=await getToken(),deadline=signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000);
  const vectors=[];
  for(const [i,content]of [query,...documents].entries()){
   deadline.throwIfAborted();
   const r=await fetchFn(`https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`,{method:'POST',signal:deadline,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({instances:[{content:content.slice(0,2000),task_type:i===0?'RETRIEVAL_QUERY':'RETRIEVAL_DOCUMENT'}],parameters:{outputDimensionality:256,autoTruncate:false}})});
   if(!r.ok)throw new Error('Semantic retrieval is unavailable.');
   const v=(await r.json()).predictions?.[0]?.embeddings?.values;
   if(!Array.isArray(v)||v.length!==256||v.some(n=>!Number.isFinite(n)))throw new TypeError('Invalid embedding.');vectors.push(v);
  }
  const q=vectors.shift(),norm=v=>Math.sqrt(v.reduce((n,x)=>n+x*x,0));
  return vectors.map(v=>{const d=norm(q)*norm(v);if(!d)throw new TypeError('Empty embedding.');return q.reduce((n,x,i)=>n+x*v[i],0)/d;});
 };
}
