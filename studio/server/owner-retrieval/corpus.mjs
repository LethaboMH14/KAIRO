/** Owner-scoped multi-source evidence selection. Lexical baseline; not a global index. */
import {createHash} from 'node:crypto';
import {selectEvidence} from '../../src/evidence-selection-core/model.ts';
const ID=/^[a-f0-9]{24}$/i, REV=/^[a-f0-9]{64}$/i;
const digest=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
const stale=()=>new TypeError('Selected source unavailable or reviewed revision changed.');
export async function retrieveOwnedCorpus({repository,ownerId,sourceIds,goal='',signal}={}){
 if(!repository||typeof repository.get!=='function')throw new TypeError('Owner-scoped repository required.');
 if(typeof ownerId!=='string'||!ownerId||ownerId.length>256)throw new TypeError('Authenticated owner required.');
 if(!Array.isArray(sourceIds)||!sourceIds.length||sourceIds.length>8||
    sourceIds.some(id=>typeof id!=='string'||!ID.test(id))||new Set(sourceIds).size!==sourceIds.length)
    throw new TypeError('Choose one to eight distinct saved sources.');
 if(typeof goal!=='string'||goal.length>1000)throw new TypeError('Study question exceeds its limit.');
 signal?.throwIfAborted();
 const terms=[...new Set((goal.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).slice(0,64))];
 const candidates=[],inspected=[];
 for(const [order,id] of sourceIds.entries()){
   signal?.throwIfAborted();
   const source=(await repository.get(ownerId,'sources',id))?.value;
   if(!source||source.id!==id||source.reviewed!==true||!REV.test(source.revision??'')||
      !Array.isArray(source.reviewedPages)||source.reviewedPages.length>100)throw stale();
   const revision=(await repository.get(ownerId,'revisions',id+'_'+source.revision))?.value;
   if(!revision||revision.id!==id||revision.revision!==source.revision||
      !Array.isArray(revision.reviewedPages)||digest(revision.reviewedPages)!==source.revision||
      digest(source.reviewedPages)!==source.revision)throw stale();
   const selected=selectEvidence(source,goal,{maxCharacters:6000,maxChunks:6});
   inspected.push({sourceId:id,revision:source.revision});
   selected.evidence.forEach((e,chunkOrder)=>candidates.push({
     e,order,chunkOrder,sourceId:id,revision:source.revision,
     score:terms.reduce((sum,term)=>sum+(e.quote.toLowerCase().includes(term)?1:0),0)
   }));
 }
 candidates.sort((a,b)=>b.score-a.score||a.order-b.order||a.chunkOrder-b.chunkOrder);
 const evidence=[];let chars=0;
 for(const c of candidates){
   if(evidence.length===12||chars>=12000)break;
   let n=Math.min(c.e.quote.length,12000-chars);
   if(n>0&&/[\uD800-\uDBFF]/.test(c.e.quote[n-1])&&/[\uDC00-\uDFFF]/.test(c.e.quote[n]))n--;
   if(n<=0)continue;
   const quote=c.e.quote.slice(0,n);chars+=quote.length;
   evidence.push({...c.e,id:c.sourceId+'-'+c.revision.slice(0,12)+'-'+c.e.id,
     sourceRevision:c.revision,quote,end:c.e.start+quote.length});
 }
 for(const {sourceId,revision} of inspected){
   signal?.throwIfAborted();
   const latest=(await repository.get(ownerId,'sources',sourceId))?.value;
   if(!latest||latest.revision!==revision||!Array.isArray(latest.reviewedPages)||
     digest(latest.reviewedPages)!==revision)throw stale();
 }
 return {evidence,selection:{method:'multi-source-lexical',semantic:false,
   searchedSources:inspected.length,selectedSources:inspected,candidateChunks:candidates.length,
   selectedCharacters:chars,
   limitation:'Only explicitly selected, current reviewed sources were searched. This is bounded lexical retrieval, not an indexed semantic corpus or factual verification.'}};
}
