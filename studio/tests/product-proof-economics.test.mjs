// Runs the same business-assumption invariants in KAIRO's standard Node 24 CI suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../docs/product-proof-20261025/business-model/model.test.mjs';
import {report} from '../../docs/product-proof-20261025/business-model/scenarios.mjs';
test('offer decision scenarios disclose assumptions and deteriorate under usage stress',()=>{
 const d=report();assert.equal(d.notForecast,true);
 for(const offer of ['personal','institution','workforce']){
  const cases=d.cases[offer];assert.equal(cases.length,3);
  assert.equal(cases[0].revenueZar,cases[2].revenueZar);
  assert.ok(cases[2].monthlyResultZar<cases[1].monthlyResultZar);
  assert.equal(cases[1].modelType,'ILLUSTRATIVE_NOT_A_FORECAST');
 }
 assert.equal(d.zeroCustomers.revenueZar,0);
});

test('motor competitor fixture is explicitly synthetic and has valid domain calculations',()=>{
 const fixture=JSON.parse(readFileSync(new URL('../../docs/product-proof-20261025/benchmarks/motor-frequency-v1.json',import.meta.url),'utf8'));
 assert.equal(fixture.type,'synthetic_kairo_authored_learning_task');
 assert.equal(fixture.humanRuns,0);assert.equal(fixture.competitorRuns,0);
 assert.equal(fixture.recommendation,'NOT_EVALUATED');
 for(const q of fixture.questions)assert.equal(120*q.context.frequencyHz/q.context.poles,q.expected.value);
 assert.match(fixture.source.text,/not a measured shaft speed/);
});
