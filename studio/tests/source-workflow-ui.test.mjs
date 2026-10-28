import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup as renderMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
let server,Workspace,sourceWorkflow;

let TeacherProvider;
// SourceReader reads the narration context, so render the workspace inside the real provider.
const renderToStaticMarkup=tree=>renderMarkup(React.createElement(TeacherProvider,null,tree));
before(async()=>{
 server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[{name:'source-workspace-hook-test',enforce:'pre',resolveId(id){if(id==='source-workspace-hooks')return '\0source-workspace-hooks';},load(id){if(id==='\0source-workspace-hooks')return `export const useState=v=>globalThis.__sourceHooks.state(v);export const useRef=v=>globalThis.__sourceHooks.ref(v);export const useEffect=(f,d)=>globalThis.__sourceHooks.effect(f,d);`;},transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/workspace/SourceWorkspace.tsx'))return code.replace("from 'react'","from 'source-workspace-hooks'");}},reactPlugin()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{({default:Workspace}=await server.ssrLoadModule('/src/workspace/SourceWorkspace.tsx'));({default:TeacherProvider}=await server.ssrLoadModule('/src/teacher/TeacherProvider.tsx'));sourceWorkflow=await server.ssrLoadModule('/src/source-workflow-ui/source-workflow.ts');}catch(error){await server.close();throw error;}
});
after(async()=>{await server?.close();});

const page={text:'Synthetic test material explains that a rotating field creates a changing magnetic effect.',locator:'Synthetic page 1',method:'synthetic fixture'};
const source={id:'a'.repeat(24),title:'Synthetic test material',pages:[page],reviewedPages:[page],reviewed:true,revision:'synthetic-revision-1',limitNote:'Synthetic test fixture only.'};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
// Layout components receive panels as element props (not only children), so search every element-valued prop.
const isElement=value=>!!value&&typeof value==='object'&&'$$typeof' in value;
function walk(node,predicate){if(!node||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(item=>walk(item,predicate));if(!isElement(node))return[];return[...(predicate(node)?[node]:[]),...Object.values(node.props||{}).flatMap(value=>Array.isArray(value)||isElement(value)?walk(value,predicate):[])];}
function text(node){if(node==null||typeof node==='boolean')return'';if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node.props?.children);}
function find(tree,predicate,label){const result=walk(tree,predicate)[0];assert.ok(result,label);return result;}
function state(tree,prop){return find(tree,node=>typeof node.type==='function'&&Object.hasOwn(node.props||{},prop),`component with ${prop}`);}
function setGlobal(key,value){Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}

async function setup({scope='account',label='Private account materials',unauthorized=false,selectionUnavailable=false,cancelConfirmed=true,jobs=[],jobResponses={}}={}){
 const keys=['fetch','window','location','document','history','setTimeout','__sourceHooks'];
 const original=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const slots=[],effects=[],calls=[];let cursor=0,tree,waitForPoll=null;
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
 setGlobal('window',{confirm:()=>true,addEventListener(){},removeEventListener(){}});setGlobal('location',{search:`?source=${source.id}`});setGlobal('history',{replaceState(){}});setGlobal('document',{});
 setGlobal('fetch',async(input,init={})=>{
  const url=String(input);calls.push({url,init});
  if(url.endsWith('/catalog'))return unauthorized?new Response('Sign in again…',{status:401}):json({catalog:[],lessons:[],cloudConfigured:true,storageScope:scope,storageLabel:label,jobs});
  if(url.endsWith(`/source/${source.id}`))return unauthorized?new Response('Sign in again…',{status:401}):json(source);
  if(url.includes('/selection?'))return selectionUnavailable?new Response('Preview unavailable',{status:404}):json({selection:{method:'goal-ranked-lexical'},evidence:[{id:'evidence-1',locator:'Synthetic page 1',quote:'Synthetic reviewed passage selected for this goal. <img src=x onerror=alert(1)>',start:4,end:55}]});
  if(url.endsWith('/upload?name=synthetic.txt&retainOriginal=0'))return json({jobId:'queued-job-1'});
  if(url==='/api/workspace/jobs/queued-job-1'&&init.method==='DELETE')return json({cancelled:cancelConfirmed});
  if(url.startsWith('/api/workspace/jobs/')){if(init.method==='DELETE')return json({cancelled:cancelConfirmed});const id=decodeURIComponent(url.slice('/api/workspace/jobs/'.length));return json(jobResponses[id]||{status:'queued'});}
  return json({});
 });
 const nativeTimeout=globalThis.setTimeout;
 setGlobal('setTimeout',(callback,delay,...args)=>{if(delay===1400){waitForPoll=()=>callback(...args);return 0;}return nativeTimeout(callback,delay,...args);});
 setGlobal('__sourceHooks',{
  state(initial){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return[slots[index],value=>{slots[index]=typeof value==='function'?value(slots[index]):value;}];},
  ref(initial){const index=cursor++;if(!(index in slots))slots[index]={current:initial};return slots[index];},
  effect(fn,deps){const index=cursor++,previous=effects[index];if(!previous||!deps||deps.some((value,i)=>!Object.is(value,previous.deps?.[i])))effects[index]={fn,deps,pending:true,cleanup:previous?.cleanup};},
 });
 const render=()=>{cursor=0;tree=Workspace();for(const effect of effects)if(effect?.pending){effect.pending=false;effect.cleanup?.();effect.cleanup=effect.fn();}return tree;};
 const close=()=>{for(const effect of effects)effect?.cleanup?.();for(const [key,descriptor]of original){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}};
 render();await flush();render();await flush();render();
 const editMode=walk(tree,node=>node.type==='button'&&text(node).trim()==='Edit extracted text')[0];if(editMode){editMode.props.onClick();render();}
 return{render,close,calls,slots,json,get tree(){return tree;},get waitForPoll(){return waitForPoll;}};
}

test('actual source workspace keeps account storage labels and hides the local cloud-copy control',async()=>{
 const account=await setup({scope:'account',label:'Your private course library <img src=x onerror=alert(1)>'});
 try{
  const html=renderToStaticMarkup(account.tree);
  assert.match(html,/Your private course library/);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/Stored in your account workspace\./);
  assert.match(html,/File processing runs in Johannesburg\. Queue metadata is handled in Europe\./);
  assert.match(html,/Keep an original with your account for page comparison/);
  assert.doesNotMatch(html,/Private cloud copy|Save private cloud copy/);
  assert.match(html,/Synthetic test material/);
  const local=await setup({scope:'local',label:'Local workspace'});
  try{
   assert.ok(walk(local.tree,node=>typeof node.type==='function'&&node.type.name==='CloudSourceCopy').length,'local pilot retains its separate cloud-copy panel');
   assert.equal(walk(account.tree,node=>typeof node.type==='function'&&node.type.name==='CloudSourceCopy').length,0,'account scope does not render the local-pilot panel');
   assert.match(renderToStaticMarkup(local.tree),/Stored in this local workspace; it is not account sync\./);
   assert.match(renderToStaticMarkup(local.tree),/Keep the original in this local workspace/);
  }finally{local.close();}
 }finally{account.close();}
});

test('actual source workspace previews current goal passages and invalidates after goal or source edits',async()=>{
 const h=await setup({scope:'account'});
 try{
  find(h.tree,node=>typeof node.props?.onBuild==='function','review-to-plan action (MaterialReviewLayout Build lesson)').props.onBuild();
  h.render();
  let planner=state(h.tree,'brief');
  planner.props.onChange({goal:'Explain the synthetic rotating field',depth:'deep',approach:'practice'});
  h.render();
  let preview=state(h.tree,'onPreview');
  await preview.props.onPreview();
  await flush();await flush();
  h.render();
  assert.ok(h.calls.find(call=>call.url.includes('/selection?')),JSON.stringify(h.calls.map(call=>call.url)));
  let html=renderToStaticMarkup(h.tree);
  assert.match(html,/Synthetic reviewed passage selected for this goal\./);
  assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/revision and learning goal/);
  const selectionCall=h.calls.find(call=>call.url.includes('/selection?'));
  assert.ok(selectionCall);
  assert.match(decodeURIComponent(selectionCall.url),/Explain the synthetic rotating field/);
  planner=state(h.tree,'brief');
  planner.props.onChange({goal:'Check one formula',depth:'short',approach:'read'});
  h.render();
  html=renderToStaticMarkup(h.tree);
  assert.doesNotMatch(html,/Synthetic reviewed passage selected for this goal\./);
  assert.match(html,/Preview the reviewed passages selected for this goal/);
  const editor=find(h.tree,node=>node.type==='textarea'&&node.props.id==='source-editor','source editor');
  editor.props.onChange({target:{value:'Changed synthetic source text'}});
  h.render();
  assert.equal(state(h.tree,'onPreview').props.disabled,true);
  assert.equal(state(h.tree,'brief').props.cards[0].citation,null);
 }finally{h.close();}
});

test('a missing passage-preview endpoint leaves local reading available',async()=>{
 const h=await setup({selectionUnavailable:true});
 try{
  find(h.tree,node=>typeof node.props?.onBuild==='function','review-to-plan action (MaterialReviewLayout Build lesson)').props.onBuild();
  h.render();
  await state(h.tree,'onPreview').props.onPreview();await flush();await flush();h.render();
  assert.equal(state(h.tree,'onPreview').props.status,'unavailable');
  assert.equal(find(h.tree,node=>node.type==='button'&&text(node).trim()==='Create local reading lesson','local reading fallback').props.disabled,false);
  assert.match(renderToStaticMarkup(h.tree),/Passage preview is unavailable right now/);
 }finally{h.close();}
});

test('plain-text 401 offers a new account tab while pasted corrections remain in the current view',async()=>{
 const h=await setup({unauthorized:true});
 try{
  find(h.tree,node=>node.type==='button'&&text(node).trim()==='Paste text','paste tab').props.onClick();
  h.render();
  find(h.tree,node=>node.type==='input'&&node.props.placeholder==='e.g. Stock control basics','paste title').props.onChange({target:{value:'My draft title'}});
  h.render();
  find(h.tree,node=>node.type==='textarea'&&node.props.placeholder==='Paste 80–16,000 characters…','paste field').props.onChange({target:{value:'My original pasted corrections remain in this tab.'}});
  h.render();
  const html=renderToStaticMarkup(h.tree);
  const link=find(h.tree,node=>node.type==='a'&&node.props.href==='/account','account recovery link');
  assert.equal(link.props.target,'_blank');
  assert.equal(link.props.rel,'noopener noreferrer');
  assert.match(html,/My draft title/);
  assert.match(html,/My original pasted corrections remain in this tab\./);
  assert.match(html,/Sign in to open account material/);
 }finally{h.close();}
});

test('actual upload stop requests cancellation and reports success only after acknowledgement',async()=>{
 const h=await setup({scope:'account'});
 try{
  const fileInput=find(h.tree,node=>node.type==='input'&&node.props.type==='file','upload input');
  const pending=fileInput.props.onChange({target:{files:[{name:'synthetic.txt',size:20}],value:'synthetic.txt'}});
  for(let i=0;i<10&&!h.waitForPoll;i++)await flush();
  assert.equal(typeof h.waitForPoll,'function','upload reached its queued wait with a server job id');
  h.render();
  find(h.tree,node=>node.type==='button'&&text(node).trim()==='Stop waiting','stop-waiting action').props.onClick();
  await flush();await flush();
  h.waitForPoll();
  await pending;
  h.render();
  assert.ok(h.calls.some(call=>call.url==='/api/workspace/jobs/queued-job-1'&&call.init.method==='DELETE'));
  assert.match(renderToStaticMarkup(h.tree),/The extraction job was cancelled\./);
 }finally{h.close();}
});

test('actual workspace restores catalog jobs after reload and opens the exact ready source while keeping pasted text',async()=>{
 const readySource={...source,id:'b'.repeat(24),title:'Synthetic ready file',revision:'synthetic-ready-revision'};
 const h=await setup({jobs:[{id:'ready-job',name:'Synthetic ready file.txt',status:'ready'}],jobResponses:{'ready-job':{status:'ready',source:readySource}}});
 try{
  h.render();
  assert.match(renderToStaticMarkup(h.tree),/Files still being processed stay here when you return/);
  assert.match(renderToStaticMarkup(h.tree),/Synthetic ready file\.txt/);
  find(h.tree,node=>node.type==='button'&&text(node).trim()==='Paste text','paste input tab').props.onClick();h.render();
  find(h.tree,node=>node.type==='input'&&node.props.placeholder==='e.g. Stock control basics','synthetic paste title').props.onChange({target:{value:'My saved passage'}});
  find(h.tree,node=>node.type==='textarea'&&node.props.placeholder==='Paste 80–16,000 characters…','synthetic paste body').props.onChange({target:{value:'A learner passage that must remain available after opening a completed file.'}});h.render();
  const panel=state(h.tree,'jobs');
  assert.equal(panel.props.jobs[0].status,'ready');
  panel.props.onOpenJob(panel.props.jobs[0]);await flush();await flush();h.render();
  assert.ok(h.calls.some(call=>call.url==='/api/workspace/jobs/ready-job'));
  assert.match(text(h.tree),/Synthetic ready file/);
  assert.match(text(h.tree),/Version synthet/);
  assert.equal(find(h.tree,node=>node.type==='input'&&node.props.placeholder==='e.g. Stock control basics','retained paste title').props.value,'My saved passage');
  assert.equal(find(h.tree,node=>node.type==='textarea'&&node.props.placeholder==='Paste 80–16,000 characters…','retained paste body').props.value,'A learner passage that must remain available after opening a completed file.');
 }finally{h.close();}
});

test('actual workspace resumes a queued catalog job through the shared polling and cancellation path',async()=>{
 const h=await setup({jobs:[{id:'restored-job',name:'Synthetic queued file.txt',status:'queued'}],jobResponses:{'restored-job':{status:'queued'}}});
 try{
  h.render();
  const panel=state(h.tree,'jobs');
  assert.equal(panel.props.jobs[0].status,'queued');
  const pending=panel.props.onOpenJob(panel.props.jobs[0]);await flush();await flush();h.render();
  assert.ok(h.calls.some(call=>call.url==='/api/workspace/jobs/restored-job'));
  assert.match(renderToStaticMarkup(h.tree),/Waiting to start/);
  find(h.tree,node=>node.type==='button'&&text(node).trim()==='Stop waiting','resume stop action').props.onClick();
  await flush();await flush();h.render();
  assert.ok(h.calls.some(call=>call.url==='/api/workspace/jobs/restored-job'&&call.init.method==='DELETE'));
  assert.match(renderToStaticMarkup(h.tree),/This job was cancelled/);
  await pending;
 }finally{h.close();}
});

test('actual workspace displays restored error and cancelled jobs and reports their current status explicitly',async()=>{
 for(const status of ['error','cancelled']){
  const jobId=`restored-${status}`;
  const h=await setup({jobs:[{id:jobId,name:`Synthetic ${status} file.txt`,status}],jobResponses:{[jobId]:{status,...(status==='error'?{error:'Synthetic extraction failed; choose the file again.'}:{})}}});
  try{
   h.render();
   const panel=state(h.tree,'jobs');
   await panel.props.onOpenJob(panel.props.jobs[0]);await flush();await flush();h.render();
   assert.ok(h.calls.some(call=>call.url===`/api/workspace/jobs/${jobId}`));
   assert.match(renderToStaticMarkup(h.tree),status==='error'?/Synthetic extraction failed; choose the file again\./:/Extraction was cancelled/);
  }finally{h.close();}
 }
});

test('actual workspace tolerates a local catalog response with no jobs field',async()=>{
 const h=await setup({scope:'local'});
 try{assert.doesNotMatch(renderToStaticMarkup(h.tree),/Files still being processed stay here when you return/);}finally{h.close();}
});

test('actual upload stop keeps the waiting wording when the app does not confirm cancellation',async()=>{
 const h=await setup({scope:'account',cancelConfirmed:false});
 try{
  const fileInput=find(h.tree,node=>node.type==='input'&&node.props.type==='file','upload input');
  fileInput.props.onChange({target:{files:[{name:'synthetic.txt',size:20}],value:'synthetic.txt'}});
  for(let i=0;i<10&&!h.waitForPoll;i++)await flush();
  assert.equal(typeof h.waitForPoll,'function');
  h.render();find(h.tree,node=>node.type==='button'&&text(node).trim()==='Stop waiting','stop-waiting action').props.onClick();
  await flush();await flush();h.waitForPoll();await new Promise(resolve=>setImmediate(resolve));h.render();
  assert.match(renderToStaticMarkup(h.tree),/did not confirm cancellation/);
  assert.doesNotMatch(renderToStaticMarkup(h.tree),/The extraction job was cancelled\./);
 }finally{h.close();}
});

test('workspace API preserves plain-text sign-in errors and extraction cancellation fails closed',async()=>{
 let request;
 await assert.rejects(sourceWorkflow.sourceWorkspaceApi('/catalog',undefined,async(url,init)=>{request={url,init};return new Response('Sign in again…',{status:401});}),error=>error.status===401&&/Sign in again/.test(error.message));
 assert.equal(request.url,'/api/workspace/catalog');
 assert.equal(request.init.credentials,'same-origin');
 assert.equal(await sourceWorkflow.cancelExtractionJob('',async()=>{throw new Error('must not fetch');}),false);
 assert.equal(await sourceWorkflow.cancelExtractionJob('queued-job-1',async(url,init)=>{request={url,init};return Response.json({cancelled:false});}),false);
 assert.equal(request.url,'/api/workspace/jobs/queued-job-1');
 assert.equal(request.init.method,'DELETE');
 assert.equal(await sourceWorkflow.cancelExtractionJob('queued-job-1',async()=>Response.json({cancelled:true})),true);
 assert.equal(await sourceWorkflow.cancelExtractionJob('queued-job-1',async()=>new Response('method unsupported',{status:405})),false);
});
