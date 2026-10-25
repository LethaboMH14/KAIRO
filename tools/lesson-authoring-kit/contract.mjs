import {createHash} from 'node:crypto';

// Isolated architecture spike: not imported by the application or a provider.
const ID=/^[a-f0-9]{24}$/, DIGEST=/^[a-f0-9]{64}$/, BLOCK=/^[a-z][a-z0-9-]{0,47}$/;
const MAX_BYTES=131072;
const fail=message=>{throw new TypeError(message);};
function object(v,keys){
 if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))fail('Expected a plain JSON object.');
 if(Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!keys.includes(k)))fail('Unexpected or missing fields.');
 for(const d of Object.values(Object.getOwnPropertyDescriptors(v)))if(!Object.hasOwn(d,'value'))fail('Accessors are not JSON fields.');
}
function str(v,max,label='Text'){if(typeof v!=='string'||!v.trim()||v.length>max)fail(`${label} is empty or too long.`);}
function integer(v,min,max){if(!Number.isSafeInteger(v)||v<min||v>max)fail('Integer outside contract bounds.');}
function array(v,min,max){if(!Array.isArray(v)||v.length<min||v.length>max)fail('Array outside contract bounds.');}
function canonical(v){return Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;}
export function digest(value){return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
export function parseLesson(encoded,source){
 if(typeof encoded!=='string'||Buffer.byteLength(encoded,'utf8')>MAX_BYTES)fail('Lesson exceeds 128 KiB.');
 return validateLesson(JSON.parse(encoded),source);
}
function checkSource(source){
 if(!source||typeof source.id!=='string'||!ID.test(source.id)||typeof source.revision!=='string'||!DIGEST.test(source.revision)||source.reviewed!==true)fail('A trusted current reviewed source is required.');
 array(source.reviewedPages,1,4);
 let total=0;for(const p of source.reviewedPages){str(p.locator,200);str(p.text,16000);total+=p.text.length;}
 if(total>48000)fail('Source exceeds reviewed text budget.');
 if(createHash('sha256').update(JSON.stringify(source.reviewedPages)).digest('hex')!==source.revision)fail('Reviewed source bytes do not match its native revision hash.');
 // The caller still authenticates the source and resolves immutable historical snapshots.
}
function checkCitation(c,source){
 object(c,['page','locator','start','end','quote']);integer(c.page,0,source.reviewedPages.length-1);
 const page=source.reviewedPages[c.page];integer(c.start,0,page.text.length-1);integer(c.end,c.start+1,page.text.length);
 str(c.quote,1400);if(c.locator!==page.locator||page.text.slice(c.start,c.end)!==c.quote)fail('Citation does not match exact reviewed offsets and locator.');
}
function checkActivity(a){
 object(a,['kind','frequencyHz','poles']);
 if(a.kind!=='motor-field-speed')fail('Unsupported activity capability.');
 if(typeof a.frequencyHz!=='number'||!Number.isFinite(a.frequencyHz)||a.frequencyHz<1||a.frequencyHz>400||![2,4,6,8,10,12].includes(a.poles))fail('Unsupported motor field-speed parameters.');
}
export function validateLesson(value,source){
 checkSource(source);object(value,['schemaVersion','id','version','sourceId','sourceRevision','title','layout','blocks']);
 if(value.schemaVersion!==1||typeof value.id!=='string'||!ID.test(value.id)||value.sourceId!==source.id||value.sourceRevision!==source.revision)fail('Lesson/source identity mismatch.');
 integer(value.version,1,Number.MAX_SAFE_INTEGER);str(value.title,120);
 if(!['reading','split-studio','practice'].includes(value.layout))fail('Unknown layout template.');
 array(value.blocks,1,24);const ids=new Set();
 for(const b of value.blocks){
  const type=b?.type;
  const fields=['id','type','title','provenance','citations',...(type==='question'?['prompt','options','correct']:type==='activity'?['prompt','activity']:['text'])];
  object(b,fields);if(typeof b.id!=='string'||!BLOCK.test(b.id)||ids.has(b.id))fail('Invalid or duplicate stable block ID.');ids.add(b.id);str(b.title,120);
  if(!['objective','explanation','worked-example','question','activity','reflection'].includes(type))fail('Unsupported block type.');
  if(!['excerpt','generated','authored'].includes(b.provenance))fail('Unknown content provenance.');
  array(b.citations,0,4);for(const c of b.citations)checkCitation(c,source);
  if(['explanation','worked-example','question'].includes(type)&&b.citations.length===0)fail('This teaching block requires source anchors.');
  if(type==='question'){
   str(b.prompt,450);array(b.options,2,4);b.options.forEach(o=>str(o,350));integer(b.correct,0,b.options.length-1);
   if(new Set(b.options).size!==b.options.length)fail('Duplicate answer options.');
  }else if(type==='activity'){
   str(b.prompt,900);if(b.provenance!=='authored')fail('Simulation parameters must be labelled authored.');checkActivity(b.activity);
  }else{str(b.text,2400);if(b.provenance==='excerpt'&&!b.citations.some(c=>c.quote===b.text))fail('An excerpt must equal its exact source quote.');}
  if(b.provenance==='excerpt'&&['question','activity'].includes(type))fail('An authored task is not an exact excerpt.');
 }
 const encoded=JSON.stringify(value);if(Buffer.byteLength(encoded,'utf8')>MAX_BYTES)fail('Lesson exceeds 128 KiB.');
 return JSON.parse(encoded); // Detached data, no mutation of caller state.
}
export function proposeChange(current,next,source){
 const before=validateLesson(current,source),after=validateLesson(next,source);
 if(after.id!==before.id||after.version!==before.version+1)fail('Changes must preserve lesson identity and increment its version.');
 return {schemaVersion:1,baseDigest:digest(before),afterDigest:digest(after),snapshot:after};
}
export function applyChange(current,proposal,{approvedDigest,signal}={},source){
 signal?.throwIfAborted();object(proposal,['schemaVersion','baseDigest','afterDigest','snapshot']);
 if(proposal.schemaVersion!==1||!DIGEST.test(proposal.baseDigest)||!DIGEST.test(proposal.afterDigest))fail('Invalid proposal envelope.');
 const before=validateLesson(current,source),after=validateLesson(proposal.snapshot,source);
 if(proposal.baseDigest!==digest(before))fail('Lesson changed; review a fresh proposal.');
 if(proposal.afterDigest!==digest(after)||approvedDigest!==proposal.afterDigest)fail('Approve this exact proposal before applying it.');
 if(after.id!==before.id||after.version!==before.version+1)fail('Invalid proposed lesson version.');
 signal?.throwIfAborted();return {lesson:after,undo:{currentDigest:digest(after),previous:before}};
}
export function undoChange(current,receipt,source){
 object(receipt,['currentDigest','previous']);
 const now=validateLesson(current,source),old=validateLesson(receipt.previous,source);
 if(receipt.currentDigest!==digest(now))fail('Lesson changed after this edit; undo must be reviewed again.');
 if(now.id!==old.id||now.version!==old.version+1)fail('Undo requires the immediately previous lesson version.');
 return validateLesson({...old,version:now.version+1},source); // A new revision, never a history rewind.
}
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderReadingReport(lesson,source){
 const checked=validateLesson(lesson,source);
 const blocks=checked.blocks.map(b=>`<section><h2>${escape(b.title)}</h2><p>Origin: ${escape(b.provenance)}</p><p>${escape(b.text||b.prompt)}</p>${b.type==='question'?`<ol>${b.options.map(o=>`<li>${escape(o)}</li>`).join('')}</ol>`:''}${b.type==='activity'?`<p>Planned activity only: ${escape(b.activity.kind)}, ${b.activity.frequencyHz} Hz, ${b.activity.poles} poles. No studio is mounted by this report.</p>`:''}${b.citations.map(c=>`<blockquote>${escape(c.quote)}</blockquote><p>${escape(c.locator)} · source revision ${escape(checked.sourceRevision)}</p>`).join('')}</section>`).join('');
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(checked.title)}</title><body><main><h1>${escape(checked.title)}</h1><p>Offline authoring contract demonstration. Source anchors are checked; teaching correctness and the answer key require human review.</p>${blocks}</main></body></html>`;
}
