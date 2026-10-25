import test from 'node:test';
import assert from 'node:assert/strict';
import {PREFIX,allowedPath,pick,inspectPatch} from './policy.mjs';
const head='a'.repeat(40);
const issue={number:13,state:'open',labels:[{name:'agent-approved'}]};
const base={issue,prs:[],runs:[],head,now:Date.parse('2026-10-25T18:00:00Z'),
 runId:1234,runAttempt:1,enabled:true,budgetApproved:true,execute:true};
const sample=p=>'diff --git a/'+p+' b/'+p+'\nnew file mode 100644\nindex 0000000..1234567\n--- /dev/null\n+++ b/'+p+'\n@@ -0,0 +1 @@\n+export const checked = true;\n';
test('owner switch, budget consent and dry run never invoke a model',()=>{
 assert.equal(pick({...base,enabled:false}).why,'owner_or_budget_switch_off');
 assert.equal(pick({...base,budgetApproved:false}).ok,false);
 assert.equal(pick({...base,execute:false}).why,'dry_run');
 assert.equal(pick(base).ok,true);
});
test('manual cannot bypass daily cap, failures/cancellations still count, reruns denied',()=>{
 for(const event of ['workflow_dispatch','schedule']){
  const prior={id:100,event,created_at:'2026-10-25T17:00:00Z',status:'cancelled'};
  assert.equal(pick({...base,runs:[prior]}).why,'daily_cap');
 }
 assert.equal(pick({...base,runAttempt:2}).why,'rerun_disallowed');
});
test('old runs, PR checks, and own run are excluded from prior coding dispatches',()=>{
 const runs=[{id:1,event:'schedule',created_at:'2026-10-20T10:00:00Z'},
  {id:1234,event:'workflow_dispatch',created_at:'2026-10-25T17:00:00Z'},
  {id:2,event:'pull_request',created_at:'2026-10-25T17:00:00Z'}];
 assert.equal(pick({...base,runs}).ok,true);
});
test('issue label and pending agent PR reject duplicate/unauthorized jobs',()=>{
 assert.equal(pick({...base,issue:{...issue,labels:[]}}).why,'issue_not_approved');
 assert.equal(pick({...base,issue:{...issue,state:'closed'}}).ok,false);
 assert.equal(pick({...base,prs:[{state:'open',head:{ref:'agent/kairo-13-99'}}]}).why,'pending_agent_pr');
 assert.equal(pick({...base,head:'not-a-sha'}).why,'unverified_main');
});
test('proof files only, reject traversal and symlinks/deletions/modified files',()=>{
 const good=PREFIX+'audit.mjs';
 assert.equal(allowedPath(good),true);
 assert.deepEqual(inspectPatch(sample(good)),[good]);
 for(const bad of [
  'studio/src/App.tsx',PREFIX+'../leak.mjs',PREFIX+'evil space',PREFIX+'',
  PREFIX+'folder/./file.mjs',PREFIX+'folder//file.mjs'
 ])assert.equal(allowedPath(bad),false,bad);
 for(const patch of [
  sample('studio/src/App.tsx'),
  sample(good).replace('new file mode 100644','new file mode 120000'),
  sample(good).replace('--- /dev/null','--- a/'+good),
  sample(good).replace('+++ b/'+good,'+++ b/studio/src/App.tsx'),
  '', 'GIT binary patch\n',sample(good).repeat(9)
 ])assert.throws(()=>inspectPatch(patch));
});
test('patch byte and line limits fail closed',()=>{
 const patch=sample(PREFIX+'audit.mjs');
 assert.throws(()=>inspectPatch(patch+'x'.repeat(82000)),/oversized/);
 assert.throws(()=>inspectPatch(patch+Array.from({length:501},()=>'+line\n').join('')),/500/);
});
