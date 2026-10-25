import test from 'node:test';
import assert from 'node:assert/strict';
import { readResume, resumeKey, writeResume } from '../src/classroom-resume/model.ts';
import { chooseResumeStart } from '../src/classroom-resume-policy/model.ts';

const lesson={id:'0123456789abcdef01234567',sourceId:'abcdef0123456789abcdef01',revision:'r7',chapters:['a','b','c']};
const key=resumeKey(lesson.id);
const result=(state={step:2,reading:false},status='restored',canWrite=true,message='')=>({state,status,canWrite,message});
class Storage { records=new Map(); getItem(k){return this.records.get(k)??null;} setItem(k,v){this.records.set(k,v);} }
const envelope=(overrides={})=>JSON.stringify({schemaVersion:1,lessonId:lesson.id,sourceId:lesson.sourceId,revision:lesson.revision,step:2,reading:false,...overrides});

test('explicit canonical chapter link wins; malformed and out-of-range links fall back to saved cursor',()=>{
  const saved=result(); assert.equal(chooseResumeStart('1',saved,3).step,1); assert.equal(chooseResumeStart('1',saved,3).origin,'link');
  for(const v of [null,'','-1','1.0',' 1','1 ','1e0','01','9007199254740992','3','Infinity']) assert.deepEqual(chooseResumeStart(v,saved,3),{step:2,reading:true,offer3D:true,message:'',origin:'saved'},String(v));
  assert.equal(chooseResumeStart('0',saved,3).step,0);
});
test('start policy preserves stale/corrupt explanations and never offers 3D from untrusted snapshots',()=>{
  const stale=result({step:2,reading:false},'stale',false,'The source changed. Your old saved place was left unchanged.');
  assert.deepEqual(chooseResumeStart(null,stale,3),{step:0,reading:true,offer3D:false,message:stale.message,origin:'start'});
  assert.equal(chooseResumeStart('1',stale,3).message,stale.message);
  for(const bad of [result({step:88,reading:false}),result({step:1.4,reading:false}),{state:null,status:'restored',canWrite:true,message:''},{state:{step:1,reading:false},status:'unknown',canWrite:true,message:''}]) assert.equal(chooseResumeStart(null,bad,3).offer3D,false);
  assert.throws(()=>chooseResumeStart(null,result(),0),/positive safe integer/);
  assert.throws(()=>chooseResumeStart(null,result(),Number.MAX_SAFE_INTEGER+1),/positive safe integer/);
});
test('source/revision change protects record; valid link can still select a chapter',()=>{
  const s=new Storage(),raw=envelope();s.setItem(key,raw);const stale=readResume(s,{...lesson,revision:'r8'});
  assert.equal(stale.status,'stale'); assert.equal(s.getItem(key),raw);assert.equal(chooseResumeStart(null,stale,3).step,0);assert.equal(chooseResumeStart('1',stale,3).step,1);assert.equal(s.getItem(key),raw);
});
test('corrupt, unsupported, out-of-range and unavailable records never overwrite original bytes',()=>{
  const raws=['{',envelope({schemaVersion:9}),envelope({step:9})];
  for(const raw of raws){const s=new Storage();s.setItem(key,raw);const permission=readResume(s,lesson);assert.equal(permission.canWrite,false);assert.equal(writeResume(s,lesson,{step:1,reading:true},permission).saved,false);assert.equal(s.getItem(key),raw);}
  const unavailable=readResume({getItem(){throw Error('denied');},setItem(){throw Error('should not write');}},lesson);assert.equal(unavailable.status,'unavailable');assert.equal(chooseResumeStart(null,unavailable,3).message,unavailable.message);
});
test('other-tab write and stale permission snapshots block overwrite; fresh consecutive saves work',()=>{
  const s=new Storage();let permission=readResume(s,lesson);assert.equal(writeResume(s,lesson,{step:0,reading:true},permission).saved,true);
  const old=permission;permission=readResume(s,lesson);assert.equal(writeResume(s,lesson,{step:1,reading:false},permission).saved,true);assert.equal(writeResume(s,lesson,{step:2,reading:true},old).saved,false);
  permission=readResume(s,lesson);s.setItem(key,envelope({step:2}));const before=s.getItem(key);assert.equal(writeResume(s,lesson,{step:0,reading:true},permission).saved,false);assert.equal(s.getItem(key),before);
});
test('policy is pure, keeps source identity outside persistence, and only offers—not mounts—3D',()=>{
  const input=Object.freeze({state:Object.freeze({step:1,reading:false}),status:'restored',canWrite:true,message:''});const before=JSON.stringify(input);
  assert.deepEqual(chooseResumeStart(null,input,3),{step:1,reading:true,offer3D:true,message:'',origin:'saved'});assert.equal(JSON.stringify(input),before);
  const s=new Storage(),permission=readResume(s,lesson);writeResume(s,lesson,{step:1,reading:false},permission);const record=JSON.parse(s.getItem(key));
  assert.deepEqual(Object.keys(record).sort(),['lessonId','reading','revision','schemaVersion','sourceId','step']);assert.equal(s.getItem('kairo-study-'+lesson.id),null);
});
