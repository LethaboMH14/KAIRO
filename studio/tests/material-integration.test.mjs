import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
let server,Workspace;
before(async()=>{
 server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[{name:'material-hook-test',enforce:'pre',resolveId(s){if(s==='material-hooks')return '\0material-hooks';},load(id){if(id==='\0material-hooks')return `export const useState=(v)=>globalThis.__materialHooks.state(v);export const useRef=(v)=>globalThis.__materialHooks.ref(v);export const useEffect=(f,d)=>globalThis.__materialHooks.effect(f,d);`;},transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/workspace/SourceWorkspace.tsx'))return code.replace("from 'react'","from 'material-hooks'");}},react()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{({default:Workspace}=await server.ssrLoadModule('/src/workspace/SourceWorkspace.tsx'));}catch(e){await server.close();throw e;}
});
after(async()=>{await server?.close();});
const page={text:'A synthetic reviewed explanation of the rotating motor field.',locator:'Synthetic page 1',method:'fixture'};
const source={id:'a'.repeat(24),title:'Synthetic motor source',pages:[page],reviewedPages:[page],reviewed:true,revision:'r1',limitNote:'Synthetic fixture'};
const flush=()=>new Promise(r=>setImmediate(r));
// The actual review workbench now receives mounted Original/Review React slots.
// Traverse those host-owned nodes without pretending to execute child hooks.
function walk(n,p){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(x=>walk(x,p));return [...(p(n)?[n]:[]),...walk(n.props?.children,p),...walk(n.props?.original,p),...walk(n.props?.reviewed,p)];}
function reviewLayout(tree){const layout=walk(tree,n=>typeof n.type==='function'&&typeof n.props?.onBuild==='function'&&typeof n.props?.canBuild==='boolean')[0];assert.ok(layout,'actual controlled review workbench');return layout;}
function text(n){if(n==null||typeof n==='boolean')return '';if(typeof n!=='object')return String(n);if(Array.isArray(n))return n.map(text).join('');return text(n.props?.children);}
function button(tree,label){const n=walk(tree,n=>n.type==='button'&&text(n).trim()===label)[0];assert.ok(n,`button ${label}`);return n;}
async function setup(reviewed=true){
 const old=new Map(['fetch','window','location','document','history','__materialHooks'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const slots=[],effects=[],calls=[];let cursor=0,tree,deferred=null;
 const set=(k,v)=>Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
 const current={...source,reviewed,...(!reviewed?{revision:undefined,reviewedPages:undefined}:{})};
 set('window',{confirm:()=>true,addEventListener(){},removeEventListener(){}});set('location',{search:'?source='+source.id});set('history',{replaceState(){}});set('document',{});
 set('fetch',async(url,opts)=>{calls.push({url,body:opts?.body?JSON.parse(opts.body):null});if(url.endsWith('/catalog'))return {ok:true,json:async()=>({catalog:[],lessons:[],cloudConfigured:true})};if(url.endsWith('/generate')&&deferred)return deferred;return {ok:true,json:async()=>current};});
 set('__materialHooks',{state(v){const i=cursor++;if(!(i in slots))slots[i]=typeof v==='function'?v():v;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},ref(v){const i=cursor++;if(!(i in slots))slots[i]={current:v};return slots[i];},effect(fn,deps){const i=cursor++,old=effects[i];if(!old||!deps||deps.some((v,j)=>!Object.is(v,old.deps?.[j])))effects[i]={fn,deps,pending:true,cleanup:old?.cleanup};}});
 const render=()=>{cursor=0;tree=Workspace();for(const e of effects)if(e?.pending){e.pending=false;e.cleanup?.();e.cleanup=e.fn();}return tree;};
 const close=()=>{for(const e of effects)e?.cleanup?.();for(const [k,d] of old){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}};
 render();await flush();render();return {render,close,calls,defer(p){deferred=p;},get tree(){return tree;}};
}
test('actual selected source opens in review and gates the planner on reviewed text',async()=>{
 const h=await setup();try{assert.match(h.tree.props.className,/sw-stage-review/);assert.equal(reviewLayout(h.tree).props.canBuild,true);reviewLayout(h.tree).props.onBuild();assert.match(h.render().props.className,/sw-stage-plan/);const panel=walk(h.tree,n=>typeof n.type==='function'&&n.props?.brief)[0];assert.equal(panel.props.cards[0].citation.revision,'r1');assert.equal(panel.props.cards[0].citation.quote,page.text);}finally{h.close();}
 const h2=await setup(false);try{assert.equal(reviewLayout(h2.tree).props.canBuild,false);}finally{h2.close();}
});
test('editing source invalidates citations and requires fresh acknowledgement',async()=>{
 const h=await setup();try{button(h.tree,'Edit extracted text').props.onClick();h.render();walk(h.tree,n=>n.props?.id==='source-editor')[0].props.onChange({target:{value:'Changed source text'}});h.render();assert.equal(reviewLayout(h.tree).props.canBuild,false);assert.equal(walk(h.tree,n=>n.type==='label'&&text(n).includes('I checked the text'))[0].props.children[0].props.checked,false);assert.equal(walk(h.tree,n=>typeof n.type==='function'&&n.props?.brief)[0].props.cards[0].citation,null);}finally{h.close();}
});
test('brief reaches consented request and Stop waiting suppresses late generation',async()=>{
 const h=await setup();try{reviewLayout(h.tree).props.onBuild();h.render();walk(h.tree,n=>typeof n.type==='function'&&n.props?.brief)[0].props.onChange({goal:'Explain the rotating field',depth:'short',approach:'practice'});h.render();walk(h.tree,n=>n.type==='input'&&n.props.type==='checkbox').at(-1).props.onChange({target:{checked:true}});h.render();let resolve;h.defer(new Promise(r=>resolve=r));const pending=button(h.tree,'Create my cited lesson').props.onClick();h.render();const sent=h.calls.find(c=>c.url.endsWith('/generate'));assert.equal(sent.body.consent,true);assert.equal(sent.body.revision,'r1');assert.match(sent.body.goal,/rotating field/);assert.match(sent.body.goal,/short|concise/i);button(h.tree,'Stop waiting').props.onClick();h.render();resolve({ok:true,json:async()=>({id:'b'.repeat(24),title:'Late lesson',chapters:[],quiz:[]})});await pending;await flush();h.render();assert.equal(walk(h.tree,n=>n.props?.className==='sw-created').length,0);assert.match(text(h.tree),/Stopped waiting/);}finally{h.close();}
});
