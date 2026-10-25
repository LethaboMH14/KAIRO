// Pure learner-side state for a future reviewed multi-source picker.
// The server MUST independently verify auth/owner, immutable revisions and
// citation ranges. Browser state is not a security boundary.
const ID=/^[a-f0-9]{24}$/;
const REV=/^[a-f0-9]{64}$/;
const MAX=8;
const REQUEST=/^[a-zA-Z0-9_-]{8,100}$/;
const PROVIDERS=new Set(['google','groq','openrouter','aiml']);

function shape(value){
  return value && typeof value==='object' && !Array.isArray(value);
}

export function reviewedChoice(source){
  if(!shape(source)||!ID.test(source.id||'')||source.reviewed!==true||
     !REV.test(source.revision||'')||!Array.isArray(source.reviewedPages)||
     source.reviewedPages.length<1||source.reviewedPages.length>100)return null;
  return {sourceId:source.id,revision:source.revision,
    title:typeof source.title==='string'&&source.title.trim()
      ?source.title.trim().slice(0,120):'Untitled reviewed source'};
}

export function selectedRefs(selected){
  if(!Array.isArray(selected)||selected.length>MAX)throw new TypeError('Select up to eight sources.');
  const refs=[],seen=new Set();
  for(const item of selected){
    if(!shape(item)||!ID.test(item.sourceId||'')||!REV.test(item.revision||'')||
      seen.has(item.sourceId))throw new TypeError('Saved selection contains an invalid or repeated source.');
    seen.add(item.sourceId);refs.push({sourceId:item.sourceId,revision:item.revision});
  }
  return refs;
}

export function toggleReviewedSource(selected,source){
  const refs=selectedRefs(selected);
  const candidate=reviewedChoice(source);
  if(!candidate)throw new TypeError('Check and save this source before selecting it.');
  const index=refs.findIndex(ref=>ref.sourceId===candidate.sourceId);
  if(index>=0){
    if(refs[index].revision!==candidate.revision)throw new TypeError('The source changed. Review it again before selecting.');
    return selected.filter((_,i)=>i!==index).map(x=>({...x}));
  }
  if(selected.length>=MAX)throw new TypeError('Choose no more than eight reviewed sources.');
  return [...selected,candidate];
}

export function checkSelectedSources(selected,currentSources){
  const refs=selectedRefs(selected);
  if(!refs.length)return {ok:false,sourceRefs:[],problem:'Choose at least one reviewed source.'};
  if(!Array.isArray(currentSources))return {ok:false,sourceRefs:[],problem:'Current source status is unavailable. Refresh your material.'};
  const latest=new Map();
  for(const source of currentSources){
    if(!shape(source)||!ID.test(source.id||''))continue;
    if(latest.has(source.id))return {ok:false,sourceRefs:[],problem:'The source list is inconsistent. Refresh your material.'};
    latest.set(source.id,source);
  }
  for(const ref of refs){
    const record=latest.get(ref.sourceId),candidate=reviewedChoice(record);
    if(!candidate||candidate.revision!==ref.revision){
      return {ok:false,sourceRefs:[],problem:'A selected source is unavailable or has changed. Open and review it again.'};
    }
  }
  return {ok:true,sourceRefs:refs,problem:null};
}

// A verified server capability flag is required; this code must not call the
// existing v1 /generate endpoint with multi-source arguments.
export function prepareSelectionRequest({selected,currentSources,multiSourceApi=false,mode='local',consent=false,goal='',provider='google',providerConsent=[],requestId,fallback}={}){
  if(multiSourceApi!==true)throw new TypeError('Multi-source lessons are not yet available in this workspace.');
  const ready=checkSelectedSources(selected,currentSources);
  if(!ready.ok)throw new TypeError(ready.problem);
  if(mode!=='local'&&mode!=='cloud')throw new TypeError('Choose local reading or consented cloud processing.');
  if(typeof goal!=='string'||goal.length>1000)throw new TypeError('The study goal is too long.');
  if(mode==='cloud'){
    if(consent!==true)throw new TypeError('Choose cloud processing consent first.');
    if(typeof provider!=='string'||!PROVIDERS.has(provider)||!Array.isArray(providerConsent)||
       providerConsent.length<1||providerConsent.length>2||new Set(providerConsent).size!==providerConsent.length||
       providerConsent.some(x=>!PROVIDERS.has(x))||!providerConsent.includes(provider)||
       (fallback!==undefined&&(!PROVIDERS.has(fallback)||!providerConsent.includes(fallback))))
      throw new TypeError('Explicit consent to every selected provider is required.');
    if(!REQUEST.test(requestId||''))throw new TypeError('A valid cloud request ID is required.');
  }
  return {schemaVersion:2,sourceRefs:ready.sourceRefs,mode,goal,
    ...(mode==='cloud'?{consent:true,provider,providerConsent:[...providerConsent],requestId,
      ...(fallback!==undefined?{fallback}:{})}:{})};
}
