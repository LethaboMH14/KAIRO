import test from 'node:test';
import assert from 'node:assert/strict';
import {REPOSITORY,STACK,validateStack,validatePR,validateDiff} from './stack.mjs';
const candidate=STACK[0];
const pr=()=>({number:candidate.number,state:'open',merged_at:null,
 head:{sha:candidate.sha,repo:{full_name:REPOSITORY}},
 base:{ref:'main',repo:{full_name:REPOSITORY}}});
const files=()=>candidate.files.map(filename=>({filename,status:'added'}));
test('pinned two-PR manifest is unique and safe',()=>{
 assert.equal(validateStack(),true);
 assert.throws(()=>validateStack([candidate,candidate]),/identity|Expected|overlap/);
 assert.throws(()=>validateStack([{...candidate,sha:'unreviewed'},STACK[1]]),/identity/);
 assert.throws(()=>validateStack([{...candidate,files:[...candidate.files,'../secret']},STACK[1]]),/Unsafe/);
});
test('live PR metadata must match exact SHA, state, base and repository',()=>{
 assert.equal(validatePR(candidate,pr(),files()),true);
 for(const changed of [
  {head:{sha:'f'.repeat(40),repo:{full_name:REPOSITORY}}},
  {head:{sha:candidate.sha,repo:{full_name:'foreign/fork'}}},
  {base:{ref:'development',repo:{full_name:REPOSITORY}}},
  {state:'closed'},{merged_at:'2026-10-25T00:00:00Z'},
 ]){
  assert.throws(()=>validatePR(candidate,{...pr(),...changed},files()),/changed/);
 }
});
test('candidate changed-file allowlist rejects deletions, additions and modifications',()=>{
 assert.throws(()=>validatePR(candidate,pr(),files().slice(1)),/scope/);
 assert.throws(()=>validatePR(candidate,pr(),[...files(),{filename:'studio/src/StudioRouter.tsx',status:'added'}]),/scope/);
 assert.throws(()=>validatePR(candidate,pr(),files().map((f,i)=>i?f:{...f,status:'modified'})),/scope/);
 assert.equal(validateDiff(candidate,[...candidate.files].reverse()),true);
 assert.throws(()=>validateDiff(candidate,[...candidate.files,'studio/src/styles.css']),/unexpected/);
});
