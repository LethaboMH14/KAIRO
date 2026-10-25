import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {adaptPreparedMotor,packFingerprint} from '../src/lecture-director-20261025/adapter.ts';
import {ANSWERS,CUES,assertLesson,correctFor,fieldSpeed,focusAfter,initialState,reduceDirector,restore,serialize} from '../src/lecture-director-20261025/model.ts';

const root=new URL('../',import.meta.url);
const pack=JSON.parse(readFileSync(new URL('../src/studio-teaching-host/packs/motor.json',import.meta.url),'utf8'));
const lesson=adaptPreparedMotor(pack);
const step=(s,type,extra={})=>reduceDirector(s,{type,...extra},lesson);
const toPrediction=()=>{
 let s=initialState(lesson);
 for(let n=0;n<3;n++)s=step(s,'NEXT');
 return s;
};
const toFeedback=()=>{const s=toPrediction();return step(s,'SUBMIT',{answer:'1500',expectedEpoch:s.epoch});};

test('pins actual prepared motor pack, citations, seven unique versioned cues and calculated keys',()=>{
 assert.equal(packFingerprint(pack),'0ef2051e');assert.equal(lesson.cues.length,7);
 assert.deepEqual(lesson.cues.map(c=>c.id),CUES);
 assert.equal(new Set(lesson.cues.map(c=>c.id)).size,7);
 assert.ok(lesson.cues.every(c=>c.version===1&&c.transcript&&c.boardAction&&c.sourceRefIds.length));
 assert.ok(lesson.sourceRefs.every(x=>x.url.startsWith('https://')&&x.locator));
 assert.equal(fieldSpeed(50,4).rpm,1500);assert.equal(fieldSpeed(60,4).rpm,1800);
 assert.doesNotMatch(lesson.cues.find(x=>x.id==='EXPLAIN').transcript,/1,500|1500/);
 assert.equal(initialState(lesson).frequencyHz,30);
 assertLesson(lesson);
});
test('a modified source, locator, teaching explanation, missing citation or practice is fail-closed',()=>{
 for(const modify of [
  p=>{p.steps[1].explanation+=' changed';},
  p=>{p.sourceRefs[0].url='https://unreviewed.invalid';},
  p=>{p.sourceRefs[2].locator='changed';},
  p=>{p.practice[0].question='different';},
  p=>{p.sourceRefs.pop();},
 ]){const copy=structuredClone(pack);modify(copy);assert.throws(()=>adaptPreparedMotor(copy),/changed|approval|missing/i);}
});
test('intro -> reveal -> model -> explicit prediction and no timed auto-completion',()=>{
 const s=toPrediction();assert.equal(s.cue,'PAUSE_FOR_PREDICTION');assert.equal(step(s,'NEXT').cue,'PAUSE_FOR_PREDICTION');
 assert.equal(initialState(lesson).cue,'INTRO');
});
test('skip jumps to prediction only from teaching cues and never skips required answers',()=>{
 let s=initialState(lesson);
 s=step(s,'SKIP');assert.equal(s.cue,'PAUSE_FOR_PREDICTION');
 assert.equal(step(s,'SKIP'),s);
 assert.equal(step(s,'NEXT'),s);
 const first=step(s,'SUBMIT',{answer:'1500',expectedEpoch:s.epoch});
 const back=step(first,'BACK');
 assert.equal(step(back,'NEXT').cue,'REVEAL_FEEDBACK');
});
test('actual existing model validates bounded frequency/poles and updates deterministic board state',()=>{
 let s=step(step(initialState(lesson),'NEXT'),'NEXT');assert.equal(s.cue,'DEMONSTRATE');
 s=step(s,'DEMO',{frequencyHz:60,poles:4});assert.equal(s.frequencyHz,60);assert.equal(fieldSpeed(s.frequencyHz,s.poles).rpm,1800);
 assert.equal(step(s,'DEMO',{frequencyHz:500,poles:4}),s);
 assert.equal(step(s,'DEMO',{frequencyHz:50,poles:3}),s);
 assert.equal(fieldSpeed(Number.NaN,4).ok,false);
 assert.equal(fieldSpeed(50,14).ok,false);
});
test('first submission explicitly reveals feedback and cannot be duplicated by rapid/stale clicks',()=>{
 const start=toPrediction(),result=step(start,'SUBMIT',{answer:'1500',expectedEpoch:start.epoch});
 assert.equal(result.cue,'REVEAL_FEEDBACK');assert.equal(result.first,'1500');
 assert.equal(correctFor(result,'first',lesson),true);
 assert.equal(step(result,'SUBMIT',{answer:'1800',expectedEpoch:start.epoch}),result);
});
test('wrong prediction receives source-linked worked feedback without awarding mastery',()=>{
 const s=toPrediction(),r=step(s,'SUBMIT',{answer:'3000',expectedEpoch:s.epoch});
 assert.equal(correctFor(r,'first',lesson),false);assert.ok(lesson.cues.find(c=>c.id===r.cue).sourceRefIds.length>0);
 assert.match(serialize(r,lesson),/not-independent-mastery/);
});
test('second prepared application is genuinely separate, completes only after submission',()=>{
 let s=toFeedback();s=step(s,'NEXT');assert.equal(s.cue,'SECOND_ATTEMPT');
 assert.equal(step(s,'NEXT'),s);s=step(s,'SUBMIT',{answer:'1800',expectedEpoch:s.epoch});
 assert.equal(s.cue,'COMPLETE');assert.equal(s.second,'1800');assert.equal(correctFor(s,'second',lesson),true);
 assert.equal(step(s,'NEXT'),s);
 assert.equal(step(s,'SUBMIT',{answer:'1500',expectedEpoch:s.epoch}),s);
});
test('pausing prevents transitions, changing demonstration and submissions; resume is explicit',()=>{
 let s=toPrediction();const paused=step(s,'PAUSE');assert.equal(paused.paused,true);
 assert.equal(step(paused,'SUBMIT',{answer:'1500',expectedEpoch:paused.epoch}),paused);
 assert.equal(step(paused,'NEXT'),paused);
 const resumed=step(paused,'RESUME');assert.equal(resumed.paused,false);
 assert.equal(step(resumed,'SUBMIT',{answer:'1500',expectedEpoch:resumed.epoch}).cue,'REVEAL_FEEDBACK');
});
test('stop cancels control actions; explicit resume retains the cue; reset clears attempts',()=>{
 let s=toFeedback();const stopped=step(s,'STOP');
 assert.equal(stopped.stopped,true);assert.equal(step(stopped,'NEXT'),stopped);
 const resumed=step(stopped,'RESUME');assert.equal(resumed.cue,s.cue);
 const reset=step(resumed,'RESET');assert.equal(reset.cue,'INTRO');assert.equal(reset.first,null);
 assert.ok(reset.epoch>stopped.epoch);
});
test('back navigation retains previous answer but does not create another attempt',()=>{
 let s=toFeedback();s=step(s,'BACK');assert.equal(s.cue,'PAUSE_FOR_PREDICTION');
 assert.equal(step(s,'SUBMIT',{answer:'1800',expectedEpoch:s.epoch}),s);
 assert.equal(s.first,'1500');
});
test('changed source fingerprint or lesson identity prohibits cross-lesson state transitions',()=>{
 let s=initialState(lesson);assert.throws(()=>reduceDirector({...s,sourceFingerprint:'stale'},{type:'NEXT'},lesson),/Source revision/);
 assert.throws(()=>reduceDirector({...s,lessonId:'someone-else'},{type:'NEXT'},lesson),/Source revision/);
});
test('bounded snapshot restores exact cues and answers but resumes paused and never auto-advances',()=>{
 const finished=step(step(toFeedback(),'NEXT'),'SUBMIT',{answer:'1800',expectedEpoch:toFeedback().epoch+1});
 // Derive the serialized state from a clean explicit second attempt.
 let s=step(toFeedback(),'NEXT');s=step(s,'SUBMIT',{answer:'1800',expectedEpoch:s.epoch});
 const back=restore(serialize(s,lesson),lesson);
 assert.equal(back.cue,'COMPLETE');assert.equal(back.first,'1500');assert.equal(back.second,'1800');assert.equal(back.paused,true);
 assert.equal(step(back,'NEXT'),back);assert.equal(step(back,'RESUME').paused,false);
 assert.equal(finished.cue,'COMPLETE');
});
test('unknown, malformed, stale or oversized snapshots do not contaminate this chapter',()=>{
 const base=initialState(lesson);
 for(const value of ['broken','{}','x'.repeat(4097),JSON.stringify({...base,lessonId:'other'}),
  JSON.stringify({...base,sourceFingerprint:'changed'}),
  JSON.stringify({...base,cue:'COMPLETE'}),
  JSON.stringify({...base,cue:'NONSENSE'}),
  JSON.stringify({...base,frequencyHz:999}),
  JSON.stringify({...base,first:'invalid'})]){
  assert.deepEqual(restore(value,lesson),base);
 }
});
test('focus contract targets question and feedback headings in both attempts',()=>{
 const start=toPrediction(),feedback=step(start,'SUBMIT',{answer:'1500',expectedEpoch:start.epoch});
 assert.equal(focusAfter(initialState(lesson),initialState(lesson)),'none');
 assert.equal(focusAfter(step(step(initialState(lesson),'NEXT'),'NEXT'),start),'question');
 assert.equal(focusAfter(start,feedback),'feedback');
 const second=step(feedback,'NEXT');assert.equal(focusAfter(feedback,second),'question');
 assert.equal(focusAfter(second,step(second,'SUBMIT',{answer:'1800',expectedEpoch:second.epoch})),'feedback');
});
test('reading/no-audio/reduced-motion options and accessible controls exist without new narrator or recording',()=>{
 const ui=readFileSync(new URL('../src/lecture-director-20261025/LectureDirector.tsx',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/lecture-director-20261025/director.css',import.meta.url),'utf8');
 assert.match(ui,/Reading-first layout/);assert.match(ui,/Reduce motion/);
 assert.match(ui,/Optional KAIRO narration/);assert.match(ui,/useTeacher/);
 assert.match(ui,/questionHeading\.current\?\.focus\(\)/);
 assert.match(ui,/feedbackHeading\.current\?\.focus\(\)/);
 assert.match(ui,/type="radio"/);assert.match(ui,/type="range"/);
 assert.match(ui,/aria-live="polite"/);assert.match(ui,/role="status"/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(ui,/new SpeechSynthesisUtterance|MediaRecorder|getUserMedia|setInterval|setTimeout\(\s*\(\s*=>\s*dispatch/);
 assert.ok(ANSWERS.includes('unknown'));
});
