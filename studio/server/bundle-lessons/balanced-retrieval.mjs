import {retrieveOwnedCorpus} from '../owner-retrieval/corpus.mjs';
/** Preserve a contribution from every selected source before filling the excerpt budget. */
export async function retrieveBalancedBundle({repository,ownerId,sourceIds,goal='',signal}){
 const selected=[];for(const id of sourceIds){signal?.throwIfAborted();selected.push(await retrieveOwnedCorpus({repository,ownerId,sourceIds:[id],goal,signal}));}
 if(selected.some(x=>!x.evidence.length))throw new TypeError('One selected source has no usable reviewed passage. Review it before continuing.');
 const evidence=[];let chars=0;
 for(let index=0;index<6&&evidence.length<12&&chars<12000;index++){
  for(const item of selected){const e=item.evidence[index];if(!e||evidence.length>=12||chars>=12000)continue;let count=Math.min(e.quote.length,12000-chars,index===0?Math.floor(12000/sourceIds.length):12000);if(count>0&&/[\uD800-\uDBFF]/.test(e.quote[count-1])&&/[\uDC00-\uDFFF]/.test(e.quote[count]))count--;if(count<=0)continue;const quote=e.quote.slice(0,count);evidence.push({...e,quote,end:e.start+quote.length});chars+=quote.length;}
 }
 return{evidence,selection:{method:'source-balanced-lexical',semantic:false,searchedSources:sourceIds.length,selectedSources:selected.flatMap(x=>x.selection.selectedSources),candidateChunks:selected.reduce((n,x)=>n+x.selection.candidateChunks,0),selectedCharacters:chars,limitation:'A bounded source-linked excerpt from every selected source, then additional goal-selected excerpts. This is not full-document understanding or factual verification.'}};
}
