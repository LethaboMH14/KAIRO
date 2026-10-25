export const languages=['English','Afrikaans','isiZulu','isiXhosa','Sesotho','Setswana'];
export function resolvePassage(document,request){
 if(!request||!['source','lesson'].includes(request.kind))throw new TypeError('Choose a source or lesson passage.');
 if(!['explain','translate'].includes(request.action))throw new TypeError('Choose explanation or translation.');
 if(request.revision!==document.revision)throw new TypeError('This source version changed. Open and review the current text again.');
 let content,locator;
 if(request.kind==='source'){
  if(!document.reviewed||!Array.isArray(document.reviewedPages))throw new TypeError('Save the reviewed source text first.');
  if(!Number.isInteger(request.section)||request.section<0||request.section>=document.reviewedPages.length)throw new TypeError('Choose a known source section.');
  const page=document.reviewedPages[request.section];content=page.text;locator=page.locator;
 }else{
  const evidence=document.evidence?.find(e=>e.id===request.evidenceId);if(!evidence)throw new TypeError('Choose a known lesson citation.');
  content=evidence.quote;locator=evidence.locator;
 }
 const {start,end}=request;
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>content.length||end-start>1200)throw new TypeError('Select 1–1,200 characters from the displayed passage.');
 const selection=content.slice(start,end);if(!selection.trim())throw new TypeError('Select readable text.');
 if(request.action==='translate'&&!languages.includes(request.language))throw new TypeError('Choose an available translation language.');
 if(request.question!==undefined&&(typeof request.question!=='string'||request.question.length>300))throw new TypeError('Keep the question under 300 characters.');
 return {selection,context:content.slice(Math.max(0,start-1400),Math.min(content.length,end+1400)),action:request.action,language:request.action==='translate'?request.language:'English',question:request.question||'',provenance:{kind:request.kind,id:document.id,revision:document.revision,locator,start,end,evidenceId:request.evidenceId||null},citationId:'P1'};
}
export function validatePassageHelp(raw,context,model='gemini-3.5-flash-lite'){
 if(!raw||typeof raw.text!=='string'||!raw.text.trim()||raw.text.length>2400)throw new TypeError('The teacher returned an unreadable response. Try a shorter passage.');
 if(raw.citationId!=='P1'||typeof raw.anchorQuote!=='string'||raw.anchorQuote.length<8||raw.anchorQuote.length>700||!context.context.includes(raw.anchorQuote))throw new TypeError('The response did not retain a valid source anchor. Try again.');
 return {text:raw.text.trim(),anchorQuote:raw.anchorQuote,citationId:'P1',action:context.action,language:context.language,translationDraft:context.action==='translate',provenance:context.provenance,model,grounding:'Selected reviewed source and nearby context. A source anchor supports checking, not independent fact verification.'};
}
