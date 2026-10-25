import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {loadReviewedLesson} from '../src/source-classroom/session.ts';
import {decodeResume} from '../src/classroom-resume/model.ts';

// Synthetic current workspace shape, never curriculum/learner outcome evidence.
const id='a'.repeat(24),sourceId='b'.repeat(24),quote='Synthetic passage says to compare the supplied units.';
const lesson={id,sourceId,revision:'synthetic-rev',sourceTitle:'Synthetic source',title:'Synthetic lesson',objective:'Explain the supplied statement',chapters:[{title:'Read',explanation:quote,example:'Explain in your own words',citationIds:['E1']},{title:'Compare',explanation:quote,example:'Explain in your own words',citationIds:['E1']}],evidence:[{id:'E1',sourceId,title:'Synthetic source',quote,locator:'Fixture page',start:0,end:quote.length,edited:false}],quiz:[{question:'According to the source, which statement is supplied?',options:['One','Two','Three','Four'],correct:0,explanation:'Synthetic explanation',citationIds:['E1'],supportQuote:quote}],mode:'local',model:null,createdAt:'2026-10-23T10:00:00.000Z',coverage:'Synthetic only',reviewWarning:'Check the source'};
const source={id:sourceId,reviewed:true,revision:lesson.revision,reviewedPages:[{text:quote,locator:'Fixture page',method:'synthetic'}]};
const context={sourceId,revision:lesson.revision,reviewed:true};
const progress={step:0,format:'example',notes:'',attempts:[]};
let server,Entry,Practice,prepareEntry,practiceRecord;
test('load actual integrated components and adapters',async()=>{
 server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[react()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{
  ({default:Entry}=await server.ssrLoadModule('/src/journey-integration/LessonEntry.tsx'));
  ({LessonPractice:Practice}=await server.ssrLoadModule('/src/kairo/JourneyPanels.tsx'));
  ({prepareEntry,practiceRecord}=await server.ssrLoadModule('/src/journey-integration/model.ts'));
 }catch(e){await server.close();throw e;}
});
function props(overrides={}){return {lesson,sourceContext:context,resume:null,savedLocally:false,onStop(){},onEnter(){},onReviewSource(){},...overrides};}
test('real reviewed-source loader supplies native Lesson identity to mounted readiness',async()=>{
 const checked=await loadReviewedLesson(id,async p=>p.startsWith('/lesson/')?lesson:source,new AbortController().signal);
 const html=renderToStaticMarkup(React.createElement(Entry,props({lesson:checked})));
 assert.match(html,/Begin reading/);assert.match(html,/1 checks/);assert.match(html,/Reading lesson/);
 assert.match(html,/Narration starts only when you ask/);assert.match(html,/session only/);
 assert.doesNotMatch(html,/host must state|Save availability is not checked here/);
 assert.match(html,/not a verified worked example/); // Warnings are visible, not invented examples.
 await assert.rejects(loadReviewedLesson(id,async p=>p.startsWith('/lesson/')?lesson:{...source,revision:'changed'},new AbortController().signal),/source has changed/i);
});
test('fresh entry cancels old narration before committing reading start',()=>{
 const order=[];const tree=Entry(props({onStop:()=>order.push('stop'),onEnter:i=>order.push(['reading',i])}));
 const panel=React.Children.toArray(tree.props.children)[0];panel.props.onBeginReading();
 assert.deepEqual(order,['stop',['reading',0]]);assert.equal(panel.props.onResume,undefined);
});
test('only validated matching cursor offers resume and cancellation precedes it',()=>{
 const resume=decodeResume(JSON.stringify({schemaVersion:1,lessonId:id,sourceId,revision:lesson.revision,step:1,reading:false}),lesson);
 const order=[];const tree=Entry(props({resume,onStop:()=>order.push('stop'),onEnter:i=>order.push(i)}));
 const panel=React.Children.toArray(tree.props.children)[0];panel.props.onResume();assert.deepEqual(order,['stop',1]);
 assert.equal(panel.props.summary.saving,'device');
 for(const raw of ['{broken',JSON.stringify({schemaVersion:1,lessonId:id,sourceId,revision:'old',step:1,reading:false})]){
  const value=decodeResume(raw,lesson);const p=prepareEntry(lesson,context,value);assert.equal(p.summary.savedStep,null);
 }
});
test('source mismatch blocks even direct start callbacks, counts and resume',()=>{
 let calls=0;const tree=Entry(props({sourceContext:{...context,revision:'old'},onStop:()=>calls++,onEnter:()=>calls++}));
 const panel=React.Children.toArray(tree.props.children)[0];panel.props.onBeginReading();assert.equal(calls,0);
 assert.equal(panel.props.summary.questionCount,0);assert.equal(panel.props.summary.savedStep,null);
 assert.match(renderToStaticMarkup(tree),/Review the current source/);
});
test('saving label follows actual host save evidence without implying cloud sync',()=>{
 assert.equal(prepareEntry(lesson,context,null).summary.saving,'session-only');
 assert.equal(prepareEntry(lesson,context,null,true).summary.saving,'device');
 const html=renderToStaticMarkup(React.createElement(Entry,props({savedLocally:true})));
 assert.match(html,/Progress can be saved on this device/);assert.doesNotMatch(html,/cloud sync|mastered/i);
});
test('native historical attempts remain assistance-unknown with exact revision and latest result',()=>{
 const attempt={question:0,choice:0,correct:true,at:'2026-10-23T10:01:00.000Z'};
 const working=Object.freeze({...progress,attempts:Object.freeze([Object.freeze(attempt)])});
 const before=JSON.stringify(working),record=practiceRecord(lesson,working,0);
 assert.equal(record.assistance,'unknown');assert.equal(record.outcome,'correct');assert.equal(record.sourceRevision,lesson.revision);
 assert.equal(JSON.stringify(working),before);assert.equal(practiceRecord(lesson,working,-1),null);assert.equal(practiceRecord(lesson,progress,0),null);
 const retry=practiceRecord(lesson,{...progress,attempts:[attempt,{...attempt,choice:1,correct:false,at:'2026-10-23T10:02:00.000Z'}]},0);
 assert.equal(retry.outcome,'needs-review');
});
test('actual LessonPractice now renders the evidence card without inventing help or levels',()=>{
 const working={...progress,attempts:[{question:0,choice:0,correct:true,at:'2026-10-23T10:01:00.000Z'}]};
 const html=renderToStaticMarkup(React.createElement(Practice,{lesson,progress:working,onChange(){},onEvidence(){}}));
 assert.match(html,/Practice record/);assert.match(html,/Help used is unknown/);assert.match(html,/Source revision: synthetic-rev/);
 assert.match(html,/Keep my work/);assert.doesNotMatch(html,/Correct answer · Help was used|Level up|certified skill/i);
});
test('close actual SSR server',async()=>{await server?.close();});
