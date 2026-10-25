import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStudioLessonContext} from '../src/studio-context-host/model.ts';
import {revokeStudioRequest} from '../src/studio-context-host/request-control.ts';
const id='a'.repeat(24),sourceId='b'.repeat(24),quote='Synthetic reviewed motor passage.';
const lesson={id,sourceId,title:'Synthetic fixture',revision:'fixture-revision',chapters:[{title:'Explain',explanation:quote,example:'Try a prediction',citationIds:['e1']}],evidence:[{id:'e1',sourceId,title:'Synthetic source',locator:'Fixture page',quote,start:0,end:quote.length}]};
const source={id:sourceId,revision:lesson.revision,reviewed:true,reviewedPages:[{text:quote,locator:'Fixture page'}]};
const loader=(l=lesson,s=source)=>async path=>path.startsWith('/lesson/')?l:s;
test('studio context uses the existing reviewed loader and preserves source locator without full source text',async()=>{
 const result=await loadStudioLessonContext(id,loader(),new AbortController().signal);
 assert.equal(result.lessonId,id);assert.equal(result.revision,lesson.revision);
 assert.deepEqual(result.citations,[{id:'e1',title:'Synthetic source',locator:'Fixture page'}]);
 assert.equal(Object.hasOwn(result,'quote'),false);
});
test('missing, changed and cross-source citations fail before displaying current context',async()=>{
 await assert.rejects(loadStudioLessonContext(id,loader(lesson,{...source,reviewed:false}),new AbortController().signal),/source has changed/i);
 await assert.rejects(loadStudioLessonContext(id,loader({...lesson,evidence:[{...lesson.evidence[0],sourceId:'c'.repeat(24)}]}),new AbortController().signal),/citation could not be checked/i);
 await assert.rejects(loadStudioLessonContext(id,loader({...lesson,chapters:[{...lesson.chapters[0],citationIds:['unknown']}]}),new AbortController().signal),/missing its source citation/i);
});
test('cancelled or unauthenticated loads never return usable context',async()=>{
 const c=new AbortController();c.abort();await assert.rejects(loadStudioLessonContext(id,loader(),c.signal),{name:'AbortError'});
 await assert.rejects(loadStudioLessonContext(id,async()=>{throw Error('Account required');},new AbortController().signal),/Account required/);
 await assert.rejects(loadStudioLessonContext('not-an-id',loader(),new AbortController().signal),/Choose a saved lesson/);
});
test('consent revocation invalidates late results, aborts waiting and stops shared narration',()=>{
 const controller=new AbortController(),events=[];let version=2;const requestVersion=version;
 revokeStudioRequest({controller,invalidate:()=>{version++;events.push('invalidate');},clearAnswer:()=>events.push('clear'),stopNarration:()=>events.push('stop'),status:text=>events.push(text)});
 assert(controller.signal.aborted);assert.notEqual(requestVersion,version);assert.deepEqual(events.slice(0,3),['invalidate','clear','stop']);assert.match(events[3],/Already-sent provider work may still finish/);
});
