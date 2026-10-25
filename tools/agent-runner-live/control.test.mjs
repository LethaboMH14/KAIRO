import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {choose,preparePrompt} from './control.mjs';
const sha='a'.repeat(40);
function api({merged=false,pulls=[],runs=[],issues=[{number:49,state:'open',labels:[]},{number:50,state:'open',labels:[]}]}={}){
 return async path=>{
  if(path.startsWith('/issues?'))return issues;
  if(path.startsWith('/pulls?'))return pulls;
  if(path==='/git/ref/heads/main')return {object:{sha}};
  if(path.includes('/runs?'))return {workflow_runs:runs};
  if(path==='/pulls/53')return {merged_at:merged?'2026-10-25T06:00:00Z':null};
  throw new Error('Unrecognized GitHub API route '+path);
 };
}
test('selects studio first and exact main SHA without needing a local checkout',async()=>{
 const r=await choose({get:api(),now:Date.parse('2026-10-25T06:00:00Z'),runId:123});
 assert.deepEqual([r.selected,r.issue,r.role,r.baseSha,r.branch],[true,49,'studio',sha,'agent/issue-49-123']);
});
test('skips active studio PR and queues ML only after foundation merge',async()=>{
 const pulled=[{state:'open',head:{ref:'agent/issue-49-123'}}];
 const a=await choose({get:api({pulls:pulled,merged:false}),runId:124});
 assert.equal(a.selected,false);
 const b=await choose({get:api({pulls:pulled,merged:true}),runId:124});
 assert.equal(b.issue,50);
});
test('two model jobs in 24 hours stops inference; excludes current run from count',async()=>{
 const now=Date.parse('2026-10-25T06:00:00Z');
 const runs=[{id:10,event:'schedule',created_at:'2026-10-25T05:00:00Z',status:'completed'},{id:11,event:'workflow_dispatch',created_at:'2026-10-25T04:00:00Z',status:'completed'}];
 assert.equal((await choose({get:api({runs}),now,runId:99})).reason,'daily_job_cap');
 assert.equal((await choose({get:api({runs}),now,runId:11})).issue,49);
 assert.equal((await choose({get:api({runs}),now,runId:99,manual:49})).issue,49);
});
test('prompt generator keeps scope and disclaims Kaggle hosted training',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kairo-agent-test-'));
 try{
  const path=join(dir,'prompt.md');
  await preparePrompt({issue:50,baseSha:sha,output:path});
  const text=await readFile(path,'utf8');
  assert.match(text,/do not claim actual Kaggle hosted training/i);
  assert.match(text,/tools\/kairo-kaggle-lab\//);
  await assert.rejects(preparePrompt({issue:13,baseSha:sha,output:path}),/allowlisted/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
