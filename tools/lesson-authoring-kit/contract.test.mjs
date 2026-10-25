import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './fixtures.mjs';
import {validateLesson,parseLesson,digest,proposeChange,applyChange,undoChange,renderReadingReport} from './contract.mjs';
const clone=structuredClone;
test('six-type lesson round trips with exact source spans and no caller mutation',()=>{
 const {source,lesson}=fixture(),before=JSON.stringify(lesson),value=parseLesson(before,source);
 assert.deepEqual(value,lesson);value.blocks[0].text='Detached';assert.equal(JSON.stringify(lesson),before);
});
test('reviewed source hash, identity, revision and page locator must agree',()=>{
 const {source,lesson}=fixture();
 for(const change of [s=>s.reviewed=false,s=>s.id='c'.repeat(24),s=>s.revision='0'.repeat(64),s=>s.reviewedPages[0].text+=' changed']){
  const s=clone(source);change(s);assert.throws(()=>validateLesson(lesson,s));
 }
 const bad=clone(lesson);bad.blocks[1].citations[0].locator='Invented page';assert.throws(()=>validateLesson(bad,source),/locator/);
});
test('fabricated, moved or truncated citations and fake excerpt content fail',()=>{
 const {source,lesson}=fixture();
 for(const change of [b=>b.citations[0].quote='Made-up claim',b=>b.citations[0].start++,b=>b.citations[0].end--,b=>b.text+=' invented']){
  const bad=clone(lesson);change(bad.blocks[1]);assert.throws(()=>validateLesson(bad,source));
 }
});
test('unknown keys, HTML/CSS/action payloads, arbitrary block kinds and duplicate IDs fail',()=>{
 const {source,lesson}=fixture();
 for(const change of [l=>l.html='<script/>',l=>l.blocks[1].style={width:'500%'},l=>l.blocks[3].activity.actionCommand='EVAL',l=>l.blocks[1].type='html',l=>l.blocks[1].id=l.blocks[0].id,l=>l.id=[l.id]]){
  const bad=clone(lesson);change(bad);assert.throws(()=>validateLesson(bad,source));
 }
});
test('numeric units/capabilities are bounded and do not permit arbitrary studio execution',()=>{
 const {source,lesson}=fixture();
 for(const frequencyHz of [NaN,Infinity,0,401,'50']){const bad=clone(lesson);bad.blocks[3].activity.frequencyHz=frequencyHz;assert.throws(()=>validateLesson(bad,source));}
 for(const poles of [1,3,14,'4']){const bad=clone(lesson);bad.blocks[3].activity.poles=poles;assert.throws(()=>validateLesson(bad,source));}
 const bad=clone(lesson);bad.blocks[3].activity.kind='pump.setSpeed';assert.throws(()=>validateLesson(bad,source),/capability/);
});
test('questions reject ambiguous options and invalid answer index, do not certify semantic truth',()=>{
 const {source,lesson}=fixture();
 for(const change of [q=>q.correct=99,q=>q.options[1]=q.options[0],q=>q.citations=[]]){const bad=clone(lesson);change(bad.blocks[4]);assert.throws(()=>validateLesson(bad,source));}
 const unsupported=clone(lesson);unsupported.blocks[4].correct=0;
 assert.doesNotThrow(()=>validateLesson(unsupported,source)); // Deliberate limit: no domain answer-key review here.
});
test('schema rejects oversized input, unexpected prototypes and unsupported schema version',()=>{
 const {source,lesson}=fixture();assert.throws(()=>parseLesson(' '.repeat(131073),source),/128 KiB/);
 const bad=clone(lesson);bad.blocks[1].text='x'.repeat(2401);assert.throws(()=>validateLesson(bad,source));
 assert.throws(()=>validateLesson(Object.assign(Object.create({inherited:true}),lesson),source),/plain JSON/);
 assert.throws(()=>validateLesson({...lesson,schemaVersion:2},source));
});
test('proposed text, order and layout changes require exact approval and retain source identity',()=>{
 const {source,lesson}=fixture(),next=clone(lesson);next.version++;next.layout='reading';next.blocks.reverse();next.blocks.find(b=>b.id==='goal').text='Revised authored goal';
 const proposal=proposeChange(lesson,next,source);assert.throws(()=>applyChange(lesson,proposal,{},source),/Approve/);
 const {lesson:applied}=applyChange(lesson,proposal,{approvedDigest:proposal.afterDigest},source);assert.deepEqual(applied,next);assert.notEqual(lesson.blocks[0].text,'Revised authored goal');
});
test('tampered proposal, stale base and changed source cannot be approved into current work',()=>{
 const {source,lesson}=fixture(),next={...clone(lesson),version:2,title:'Next draft'},p=proposeChange(lesson,next,source);
 const tamper=clone(p);tamper.snapshot.title='Different draft';assert.throws(()=>applyChange(lesson,tamper,{approvedDigest:p.afterDigest},source),/Approve/);
 const current={...clone(lesson),title:'Concurrent edit'};assert.throws(()=>applyChange(current,p,{approvedDigest:p.afterDigest},source),/changed/);
 assert.throws(()=>proposeChange(lesson,{...next,id:'c'.repeat(24)},source),/identity/);
});
test('cancellation blocks commit; undo creates a new revision and rejects changed current state',()=>{
 const {source,lesson}=fixture(),next={...clone(lesson),version:2,title:'Next draft'},p=proposeChange(lesson,next,source),c=new AbortController();c.abort();
 assert.throws(()=>applyChange(lesson,p,{approvedDigest:p.afterDigest,signal:c.signal},source));
 const result=applyChange(lesson,p,{approvedDigest:p.afterDigest},source),restored=undoChange(result.lesson,result.undo,source);
 assert.equal(restored.version,3);assert.equal(restored.title,lesson.title);
 assert.throws(()=>undoChange({...result.lesson,title:'Later change'},result.undo,source),/changed/);
});
test('canonical approval digest ignores object key order but retains block order',()=>{
 const {lesson}=fixture();assert.equal(digest(lesson),digest(Object.fromEntries(Object.entries(lesson).reverse())));
 const next=clone(lesson);next.blocks.reverse();assert.notEqual(digest(lesson),digest(next));
});
test('static report escapes hostile text, exposes provenance and never mounts code or studio',()=>{
 const {source,lesson}=fixture();lesson.title='<img src=x onerror=alert(1)>';lesson.blocks[0].text='<script>bad()</script>';
 const html=renderReadingReport(lesson,source);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script|<img/);assert.match(html,/Planned activity only/);assert.match(html,/No studio is mounted/);
});
