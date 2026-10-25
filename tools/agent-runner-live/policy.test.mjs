import test from 'node:test';
import assert from 'node:assert/strict';
import {TASKS,allowedPath,chosenTask,validatePaths,branchName} from './policy.mjs';
const issue=n=>({number:n,state:'open',labels:[]});
test('only reviewed allowlisted issue 49 can start before PR53',()=>{
 const x=chosenTask({issues:[issue(50),issue(49)],mergedPrs:{53:false}});
 assert.equal(x.issue,49);assert.equal(chosenTask({issues:[issue(50)],mergedPrs:{53:false}}),null);
 assert.equal(chosenTask({issues:[issue(10)]}),null);
});
test('ML lane waits for merged Kaggle foundation, then becomes eligible',()=>{
 const x=chosenTask({issues:[issue(50)],mergedPrs:{53:true}});
 assert.equal(x.issue,50);assert.equal(x.role,'kaggle-ml');
});
test('already-open PR, scoped active task or blocked issue cannot be relaunched',()=>{
 const p={state:'open',head:{ref:'agent/issue-49-100'},body:''};
 assert.equal(chosenTask({issues:[issue(49)],pulls:[p]}),null);
 assert.equal(chosenTask({issues:[issue(49)],pulls:[{state:'open',head:{ref:'manual'},body:'Closes #49'}]}),null);
 assert.equal(chosenTask({issues:[{...issue(49),labels:[{name:'agent-blocked'}]}]}),null);
});
test('explicit manual issue never spills over to another issue',()=>{
 assert.equal(chosenTask({issues:[issue(49)],requestIssue:50}),null);
 assert.equal(chosenTask({issues:[issue(49),issue(50)],requestIssue:50,mergedPrs:{53:true}}).issue,50);
});
test('only exact or descendant scoped paths are accepted',()=>{
 const t=TASKS[49];
 assert.equal(allowedPath(t,'studio/src/studio-scenarios/pump-what-if/challenge.ts'),true);
 assert.equal(allowedPath(t,'studio/tests/pump-what-if.test.mjs'),true);
 for(const p of ['studio/src/StudioRouter.tsx','.github/workflows/evil.yml','studio/src/studio-scenarios/pump-what-if-evil/z.ts','studio/tests/other.test.mjs','studio/src/studio-scenarios/pump-what-if/../App.tsx','/root/tmp','studio\\x','studio/src/studio-scenarios/pump-what-if/'])assert.equal(allowedPath(t,p),false,p);
 assert.throws(()=>validatePaths(t,['studio/src/StudioRouter.tsx']));
 assert.throws(()=>validatePaths(t,[]));assert.throws(()=>validatePaths(t,Array(21).fill('studio/tests/pump-what-if.test.mjs')));
});
test('safe branch naming validates issue and run',()=>{
 assert.equal(branchName(49,101),'agent/issue-49-101');
 assert.throws(()=>branchName(49,NaN));assert.throws(()=>branchName(-1,20));
});
