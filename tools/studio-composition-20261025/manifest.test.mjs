import test from 'node:test';
import assert from 'node:assert/strict';
import {CANDIDATES,REPOSITORY,validateManifest,validatePR,validateComposedDiff} from './manifest.mjs';
import {verifyCandidates} from './compose.mjs';
const candidate=CANDIDATES[0];
const pr=c=>({number:c.number,state:'open',draft:true,merged_at:null,
  head:{sha:c.sha,repo:{full_name:REPOSITORY}},
  base:{ref:'main',repo:{full_name:REPOSITORY}}});
const files=c=>c.files.map(filename=>({filename,status:'added'}));
test('manifest is exact, disjoint and rejects overlapping paths or duplicate candidate numbers',()=>{
 assert.equal(validateManifest(),true);
 assert.throws(()=>validateManifest([candidate,candidate]),/Duplicate/);
 assert.throws(()=>validateManifest([{...candidate,files:[...candidate.files,'studio/src/../App.tsx']}]),/Unsafe/);
 assert.throws(()=>validateManifest([{...candidate,files:[candidate.files[0],candidate.files[0]]}]),/duplicate/i);
});
test('candidate identity, same-repo ownership, exact SHA and base branch are hard gates',()=>{
 assert.equal(validatePR(candidate,pr(candidate),files(candidate)),true);
 const bad=[
  {...pr(candidate),head:{...pr(candidate).head,sha:'f'.repeat(40)}},
  {...pr(candidate),head:{...pr(candidate).head,repo:{full_name:'other/fork'}}},
  {...pr(candidate),base:{...pr(candidate).base,ref:'unreviewed'}},
  {...pr(candidate),state:'closed'},
  {...pr(candidate),merged_at:'2026-10-25T00:00:00Z'},
 ];
 for(const b of bad)assert.throws(()=>validatePR(candidate,b,files(candidate)),/Candidate PR identity/);
});
test('file scope and status cannot drift, even when PR head metadata matches',()=>{
 assert.throws(()=>validatePR(candidate,pr(candidate),[...files(candidate),{filename:'.github/workflows/ci.yml',status:'added'}]),/scope/);
 assert.throws(()=>validatePR(candidate,pr(candidate),files(candidate).slice(1)),/scope/);
 assert.throws(()=>validatePR(candidate,pr(candidate),files(candidate).map((x,i)=>i===0?{...x,status:'modified'}:x)),/scope/);
 assert.throws(()=>validateComposedDiff(candidate,['studio/src/App.tsx']),/Unexpected/);
 assert.equal(validateComposedDiff(candidate,[...candidate.files].reverse()),true);
});
test('metadata verification checks all four pinned PRs and fails closed on a moved head',async()=>{
 const good=async path=>{
  const m=/^\/pulls\/(\d+)(\/files\?per_page=100)?$/.exec(path);
  assert.ok(m,path);const c=CANDIDATES.find(x=>x.number===Number(m[1]));
  return m[2]?files(c):pr(c);
 };
 const verified=await verifyCandidates({get:good});
 assert.deepEqual(verified.map(x=>x.number),[55,64,68,70]);
 await assert.rejects(verifyCandidates({get:async path=>{
  const value=await good(path);
  return path==='/pulls/68'?{...value,head:{...value.head,sha:'f'.repeat(40)}}:value;
 }}),/pinned head changed|identity/i);
});
