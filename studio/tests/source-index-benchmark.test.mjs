import test from 'node:test';
import assert from 'node:assert/strict';
import {createSourceIndex} from '../server/source-index/index.mjs';
import {loadFixture,measure} from '../server/source-index/benchmark.mjs';

const fixturePath=new URL('./fixtures/source-index-v1.json',import.meta.url);
test('frozen synthetic multilingual lexical benchmark measures actual recall and exact citation anchors',async()=>{
 const fixture=await loadFixture(fixturePath),index=createSourceIndex(':memory:');
 try{
  const result=measure(index,fixture);
  assert.equal(result.queries,6);
  assert.equal(result.recallAt1,5/6);
  assert.equal(result.recallAt3,5/6);
  assert.equal(result.citationAnchorPrecision,1);
  assert.equal(result.ownerLeakageCount,0);
  assert.equal(result.cases.at(-1).hit1,false); // deliberate synonym failure
  assert.equal(index.stats({ownerId:'learner-a',expectedOwnerId:'learner-a'}).documents,4);
  console.log('SOURCE_INDEX_BASELINE',JSON.stringify(result));
 }finally{index.close();}
});
