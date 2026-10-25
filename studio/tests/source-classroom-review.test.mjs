import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {loadReviewedLesson} from '../src/source-classroom/session.ts';

const id='a'.repeat(24),sourceId='b'.repeat(24);
const quote='<script>privateExample()</script> reviewed passage';
function fixture(){return {id,sourceId,title:'Synthetic lesson',revision:'r1',mode:'vertex',chapters:[{title:'First chapter',explanation:'Draft explanation',example:'Compare the claim',citationIds:['S1-0']},{title:'Second chapter',explanation:'Second explanation',example:'Second prompt',citationIds:['S2-0']}],evidence:[{id:'S1-0',sourceId,title:'First page',quote,locator:'Page 1',start:0,end:quote.length,edited:true},{id:'S2-0',sourceId,title:'Second page',quote:'Second source passage',locator:'Page 2',start:0,end:21,edited:false}]};}

test('reading pane escapes source text, shows only the current citation and keeps learner controls',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{
  const {default:View}=await server.ssrLoadModule('/src/source-classroom-ui/LessonReading.tsx');
  const html=renderToStaticMarkup(React.createElement(View,{lesson:fixture(),step:0,onStep(){},onRead(){},onStuck(){}}));
  assert.match(html,/&lt;script&gt;privateExample/);assert.doesNotMatch(html,/<script>|Second source passage/);
  assert.match(html,/Page 1/);assert.match(html,/reviewed revision.*r1/);assert.match(html,/edited after extraction/);assert.match(html,/AI draft/);
  assert.match(html,/aria-current="step"/);assert.match(html,/disabled="">Previous chapter/);assert.match(html,/Read this explanation aloud/);assert.match(html,/Next chapter/);
 }finally{await server.close();}
});

test('late source result cannot open a lesson after cancellation even if loader ignores abort',async()=>{
 const controller=new AbortController();let resolveSource;
 const pending=loadReviewedLesson(id,async path=>path.startsWith('/lesson/')?fixture():new Promise(resolve=>{resolveSource=resolve;}),controller.signal);
 await Promise.resolve();assert.equal(typeof resolveSource,'function');controller.abort();resolveSource({});
 await assert.rejects(pending,{name:'AbortError'});
});

test('source read failure stays a failure rather than falling back to an unrelated authored lesson',async()=>{
 await assert.rejects(loadReviewedLesson(id,async path=>{if(path.startsWith('/lesson/'))return fixture();throw new Error('Source unavailable');},new AbortController().signal),/Source unavailable/);
});
