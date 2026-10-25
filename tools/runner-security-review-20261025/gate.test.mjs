import test from 'node:test';
import assert from 'node:assert/strict';
import {collectRecentAttempts,collectOpenPRs,readLiveSnapshot,evaluate,inspectSensitivePatch} from './gate.mjs';
const now=Date.parse('2026-10-25T20:00:00Z'),head='a'.repeat(40);
const issue={number:13,state:'open',labels:[{name:'agent-approved'}]};
const run=(id,event,time='2026-10-25T19:00:00Z')=>({id,event,created_at:time});
const pr=n=>({number:n,state:'open',head:{ref:'review-'+n}});
const opt={now,runId:1000,attempt:1,enabled:true,budgetApproved:true,execute:true};
const snap={issue,prs:[],runs:[],head};
const url=path=>new URL('https://example.test'+path);
test('mixed PR-run flood cannot hide prior manual attempt',async()=>{
 const flood=Array.from({length:100},(_,i)=>run(i+2000,'pull_request'));
 assert.equal(flood.some(x=>x.event==='workflow_dispatch'),false);
 const seen=[];
 const fetcher=async path=>{seen.push(path);const event=url(path).searchParams.get('event');
  return {total_count:event==='workflow_dispatch'?1:0,workflow_runs:event==='workflow_dispatch'?[run(2,event)]:[]};};
 const attempts=await collectRecentAttempts(fetcher,now);
 assert.equal(attempts.length,1);
 assert.equal(evaluate({...snap,runs:attempts},opt).why,'daily_cap');
 assert.equal(seen.every(x=>x.includes('event=')),true);
});
test('101 manual runs paginate and count hidden attempt',async()=>{
 const calls=[];
 const fetcher=async path=>{calls.push(path);const u=url(path),event=u.searchParams.get('event'),page=Number(u.searchParams.get('page'));
  if(event==='schedule')return {total_count:0,workflow_runs:[]};
  return {total_count:101,workflow_runs:page===1?Array.from({length:100},(_,i)=>run(i+1,event)):[run(101,event)]};};
 assert.equal((await collectRecentAttempts(fetcher,now)).length,101);
 assert.equal(calls.some(x=>x.includes('page=2')),true);
});
test('invalid, truncated, future, unsorted or duplicate history blocks',async()=>{
 const bad=[undefined,{total_count:'0',workflow_runs:[]},{total_count:1,workflow_runs:[]},
  {total_count:0,workflow_runs:[run(1,'workflow_dispatch')]},
  {total_count:200,workflow_runs:[run(1,'workflow_dispatch')]},
  {total_count:1,workflow_runs:[run(1,'schedule')]},
  {total_count:1,workflow_runs:[run(1,'workflow_dispatch','bad')]},
  {total_count:1,workflow_runs:[run(1,'workflow_dispatch','2099-01-01T00:00:00Z')]},
  {total_count:101,workflow_runs:Array.from({length:101},(_,i)=>run(i+1,'workflow_dispatch'))}];
 for(const payload of bad)await assert.rejects(collectRecentAttempts(async()=>payload,now));
 const unsorted={total_count:2,workflow_runs:[run(1,'workflow_dispatch','2026-10-25T18:00:00Z'),run(2,'workflow_dispatch')]};
 await assert.rejects(collectRecentAttempts(async()=>unsorted,now),/unsorted/);
 const hundred={total_count:1000,workflow_runs:Array.from({length:100},(_,i)=>run(i+1,'workflow_dispatch'))};
 await assert.rejects(collectRecentAttempts(async path=>url(path).searchParams.get('event')==='schedule'?{total_count:0,workflow_runs:[]}:hundred,now,1),/pagination/);
});
test('101 open PRs reveal generated-branch collision',async()=>{
 const fetcher=async path=>Number(url(path).searchParams.get('page'))===1?
  Array.from({length:100},(_,i)=>pr(i+1)):[{...pr(101),head:{ref:'agent/kairo-13-99'}}];
 const prs=await collectOpenPRs(fetcher);
 assert.equal(prs.length,101);
 assert.equal(evaluate({...snap,prs},opt).why,'pending_agent_pr');
});
test('publish rechecks revocation, owner budget and immutable SHA/branch',()=>{
 const selected={...opt,publish:true,selectedSha:head,selectedBranch:'agent/kairo-13-1000'};
 assert.equal(evaluate(snap,selected).ok,true);
 assert.equal(evaluate({...snap,issue:{...issue,labels:[]}},selected).why,'issue_approval_revoked');
 assert.equal(evaluate({...snap,issue:{...issue,labels:['agent-approved','do-not-run']}},selected).ok,false);
 assert.equal(evaluate(snap,{...selected,budgetApproved:false}).ok,false);
 assert.equal(evaluate(snap,{...selected,enabled:false}).ok,false);
 assert.equal(evaluate({...snap,head:'b'.repeat(40)},selected).why,'stale_or_mismatched_selection');
 assert.equal(evaluate(snap,{...selected,selectedBranch:'agent/kairo-13-999'}).why,'stale_or_mismatched_selection');
 assert.equal(evaluate(snap,{...selected,attempt:2}).why,'invalid_or_replayed_run');
});
test('snapshot rejects missing issue or invalid main',async()=>{
 const make=(badIssue,badSha)=>async path=>{
  if(path.startsWith('/issues/'))return badIssue;
  if(path.startsWith('/pulls?'))return [];
  if(path.startsWith('/actions/workflows/'))return {total_count:0,workflow_runs:[]};
  if(path.startsWith('/git/ref/'))return {object:{sha:badSha}};
  throw Error('unexpected');
 };
 await assert.rejects(readLiveSnapshot(make(null,head),now),/issue/);
 await assert.rejects(readLiveSnapshot(make(issue,'bad'),now),/SHA/);
 assert.equal((await readLiveSnapshot(make(issue,head),now)).head,head);
});
test('heuristic rejects obvious credentials and personal email',()=>{
 assert.equal(inspectSensitivePatch('diff --git a/x b/x\n+export const ok=true;'),true);
 for(const value of ['-----BEGIN PRIVATE KEY-----','ghp_'+'a'.repeat(30),'sk-'+'a'.repeat(30),
  'password="longsecret123"','Authorization: Bearer abc','student@example.com'])
  assert.throws(()=>inspectSensitivePatch('diff --git a/x b/x\n+'+value),/credential|identifier/);
});
