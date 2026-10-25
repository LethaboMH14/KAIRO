import test from 'node:test';
import assert from 'node:assert/strict';
import {TASKS} from './policy.mjs';
import {filterPatchPaths,patchStats} from './patch.mjs';
test('no app router, workflow, package manifest, secrets or other worker scope',()=>{
 const ok=['studio/src/studio-scenarios/pump-what-if/contract.ts','studio/tests/pump-what-if.test.mjs'];
 assert.deepEqual(filterPatchPaths(ok,TASKS[49]),ok);
 for(const bad of ['studio/src/App.tsx','studio/src/StudioRouter.tsx','.github/workflows/ci.yml','studio/package-lock.json','tools/agent-runner-live/policy.mjs','studio/src/studio-scenarios/pump-what-if/../../App.tsx'])assert.throws(()=>filterPatchPaths([bad],TASKS[49]),/Out-of-scope/);
});
test('model cannot modify Kaggle baseline until reviewed issue selected',()=>{
 assert.throws(()=>filterPatchPaths(['tools/kairo-kaggle-lab/train.py'],TASKS[49]),/Out-of-scope/);
 assert.deepEqual(filterPatchPaths(['tools/kairo-kaggle-lab/train.py'],TASKS[50]),['tools/kairo-kaggle-lab/train.py']);
});
test('bounded text-only patches reject huge and NUL outputs',()=>{
 assert.throws(()=>patchStats('x'.repeat(131073)),/limit/);
 assert.throws(()=>patchStats('abc\0x'),/Binary|NUL/);
 assert.throws(()=>patchStats(Array(901).fill('+extra').join('\n')),/added lines/);
 assert.deepEqual(patchStats('+a\n'),{size:3,additions:1});
});
