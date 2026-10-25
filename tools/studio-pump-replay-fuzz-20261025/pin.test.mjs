import test from 'node:test';
import assert from 'node:assert/strict';
import {REPOSITORY,NUMBER,HEAD,FILES,validateCandidate,validateDiff} from './pin.mjs';
const pr=()=>({number:NUMBER,state:'open',merged_at:null,
 head:{sha:HEAD,repo:{full_name:REPOSITORY}},
 base:{ref:'main',repo:{full_name:REPOSITORY}}});
const files=()=>FILES.map(filename=>({filename,status:'added'}));
test('candidate must match exact reviewed SHA, repository and main base',()=>{
 assert.equal(validateCandidate(pr(),files()),true);
 for(const change of [
  {state:'closed'}, {merged_at:'2026-10-25T00:00:00Z'},
  {head:{sha:'f'.repeat(40),repo:{full_name:REPOSITORY}}},
  {head:{sha:HEAD,repo:{full_name:'external/fork'}}},
  {base:{ref:'dev',repo:{full_name:REPOSITORY}}},
 ]){
  assert.throws(()=>validateCandidate({...pr(),...change},files()),/drifted/);
 }
});
test('candidate and temporary merge may add only the seven pinned paths',()=>{
 assert.equal(validateDiff([...FILES].reverse()),true);
 assert.throws(()=>validateCandidate(pr(),files().slice(1)),/scope/);
 assert.throws(()=>validateCandidate(pr(),[...files(),{filename:'studio/src/StudioRouter.tsx',status:'added'}]),/scope/);
 assert.throws(()=>validateCandidate(pr(),files().map((f,i)=>i?f:{...f,status:'modified'})),/scope/);
 assert.throws(()=>validateDiff([...FILES,'studio/src/styles.css']),/unexpected/);
});
