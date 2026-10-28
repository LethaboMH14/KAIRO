import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
let server,validateExplainer,passageSeconds,readingReducer,CitedExplainer;
test('load pure reading model and real React component',async()=>{
 server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,server:{middlewareMode:true,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
 try{({validateExplainer,passageSeconds,readingReducer}=await server.ssrLoadModule('/src/cited-explainer-ui/model.ts'));({default:CitedExplainer}=await server.ssrLoadModule('/src/cited-explainer-ui/CitedExplainer.tsx'));}catch(e){await server.close();throw e;}
});
test.after(async()=>{await server?.close();});
const input={lessonId:'lesson-1',revision:'rev-2',title:'How a source claim works',passages:[{id:'p1',quote:'A cited statement.',sourceTitle:'Study text',locator:'Chapter 2, p. 4'},{id:'p2',quote:'Second exact passage.',sourceTitle:'Reference notes',locator:'Section 3'}]};
const render=(overrides={})=>renderToStaticMarkup(React.createElement(CitedExplainer,{...input,onRead(){},onStop(){},...overrides}));
test('validates complete bounded records and rejects malformed or duplicate citations',()=>{
 assert.equal(validateExplainer(input).ok,true);
 assert.match(validateExplainer({...input,passages:[]}).reason,/between 1 and 6/);
 assert.match(validateExplainer({...input,passages:[input.passages[0],input.passages[0]]}).reason,/unique/);
 assert.match(validateExplainer({...input,passages:[{...input.passages[0],quote:'x'.repeat(1201)}]}).reason,/incomplete|exceeds/);
 assert.match(validateExplainer({...input,passages:[{...input.passages[0],locator:''}]}).reason,/incomplete/);
 assert.match(validateExplainer({...input,passages:Array(7).fill(input.passages[0]).map((p,i)=>({...p,id:`p${i}`}))}).reason,/between 1 and 6/);
});
test('estimates passage time at 150 wpm with bounded 4-to-15 second duration',()=>{
 assert.equal(passageSeconds('one two'),4); assert.equal(passageSeconds(Array(150).fill('word').join(' ')),60 > 15 ? 15 : 15); assert.equal(passageSeconds(Array(40).fill('word').join(' ')),15);
});
test('reducer starts paused, advances explicitly and reset cancels lesson progress',()=>{
 let state={index:0,playing:false,textOnly:false}; assert.equal(readingReducer(state,{type:'play'}).playing,true);
 state=readingReducer(state,{type:'next',count:2}); assert.deepEqual(state,{index:1,playing:false,textOnly:false});
 state=readingReducer(state,{type:'reset'}); assert.deepEqual(state,{index:0,playing:false,textOnly:false});
 assert.equal(readingReducer(state,{type:'toggleTextOnly'}).textOnly,true);
});
test('SSR renders exact passage, source locator, controls and all-text alternative without auto narration',()=>{
 const html=render(); assert.match(html,/How a source claim works/); assert.match(html,/A cited statement\./); assert.match(html,/Study text/); assert.match(html,/Chapter 2, p\. 4/); assert.match(html,/Read all cited passages/); assert.match(html,/Read this passage with KAIRO/); assert.match(html,/does not create a video or simulation/); assert.doesNotMatch(html,/\bis-playing\b/);
});
test('SSR escapes hostile passage and source text; invalid content fails closed',()=>{
 const html=render({passages:[{id:'safe',quote:'<img src=x onerror=alert(1)>',sourceTitle:'<script>bad</script>',locator:'<b>loc</b>'}]}); assert.doesNotMatch(html,/<img|<script>|<b>loc/); assert.match(html,/&lt;img/);
 const invalid=render({passages:[]}); assert.match(invalid,/Provide between 1 and 6 cited passages/); assert.doesNotMatch(invalid,/Play/);
});
test('OS reduced-motion preference initializes the still presentation',()=>{
 const prior=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
 try{assert.match(render(),/cited-explainer--still/);}finally{globalThis.matchMedia=prior;}
});

