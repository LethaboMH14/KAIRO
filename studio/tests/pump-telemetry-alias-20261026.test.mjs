import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  VERSION,SOURCE_REVISION,EVIDENCE_STATUS,SOURCE_REVIEW_STATUS,SOURCES,
  SCENARIOS,SAMPLE_RATES_HZ,APPARENT_FREQUENCIES_HZ,NYQUIST_PREDICTIONS,
  solveScenario,newRecord,appendAttempt,replayRecord,importRecord,exportRecord
} from '../src/studio-scenarios/pump-telemetry-alias-20261026/model.mjs';
const dir=join(dirname(fileURLToPath(import.meta.url)),'../src/studio-scenarios/pump-telemetry-alias-20261026');
const clone=x=>JSON.parse(JSON.stringify(x));
const attempt=(s,more={})=>({
  scenarioId:s.id,sampleRateHz:8,apparentPredictionHz:s.frequencyHz===6?2:1,
  nyquistPrediction:'fails',
  explanation:'The sample rate can fold a higher ripple frequency into a lower apparent one.',
  ...more
});
test('source, revision, limitations and synthetic two-round contract are explicit',()=>{
  assert.equal(VERSION,'kairo-pump-telemetry-alias/1');
  assert.match(SOURCE_REVISION,/20261026/);
  assert.equal(EVIDENCE_STATUS,'local-unverified');
  assert.match(SOURCE_REVIEW_STATUS,/pending/);
  assert.deepEqual(SCENARIOS.map(s=>s.frequencyHz),[6,9]);
  assert.equal(SOURCES.length,2);
  for(const s of SOURCES){assert.match(s.url,/^https:\/\//);assert.ok(s.concept.length>30);}
});
test('independent integer-frequency oracle for every scenario and sampling rate',()=>{
  const expected={6:{8:[2,false],10:[4,false],16:[6,true],24:[6,true]},
    9:{8:[1,false],10:[1,false],16:[7,false],24:[9,true]}};
  let checked=0;
  for(const scenario of SCENARIOS)for(const rate of SAMPLE_RATES_HZ){
    const result=solveScenario(scenario.id,rate);
    assert.deepEqual([result.apparentFrequencyHz,result.meetsNyquist],
      expected[scenario.frequencyHz][rate]);
    assert.equal(result.nyquistThresholdHz,scenario.frequencyHz*2);
    assert.equal(result.samples.length,rate+1);
    assert.equal(result.trace.length,6);
    checked++;
  }
  assert.equal(checked,8);
});
test('independent DFT spectral peak matches folded frequency, not just solver formula',()=>{
  for(const scenario of SCENARIOS)for(const rate of SAMPLE_RATES_HZ){
    const samples=solveScenario(scenario.id,rate).samples.slice(0,rate);
    const bins=[];
    for(let k=0;k<=Math.floor(rate/2);k++){
      let re=0,im=0;
      for(let n=0;n<rate;n++){
        const phase=2*Math.PI*k*n/rate;
        re+=samples[n].value*Math.cos(phase);
        im-=samples[n].value*Math.sin(phase);
      }
      bins.push(Math.hypot(re,im));
    }
    const peak=bins.indexOf(Math.max(...bins));
    const oracle=({6:{8:2,10:4,16:6,24:6},9:{8:1,10:1,16:7,24:9}})
      [scenario.frequencyHz][rate];
    assert.equal(peak,oracle);
    assert.ok(bins[peak]>rate*.45);
  }
});
test('sample times and amplitudes independently match the fictional sine signal',()=>{
  for(const s of SCENARIOS)for(const fs of SAMPLE_RATES_HZ){
    const samples=solveScenario(s.id,fs).samples;
    for(let n=0;n<=fs;n++){
      assert.equal(samples[n].index,n);
      assert.ok(Math.abs(samples[n].timeSec-n/fs)<0.000001);
      const expected=Math.sin(2*Math.PI*s.frequencyHz*n/fs+Math.PI/6);
      assert.ok(Math.abs(samples[n].value-expected)<=0.000051);
    }
  }
});
test('sampling above Nyquist is not falsely described as proof of real telemetry',()=>{
  const r=solveScenario('ripple-six',24);
  assert.equal(r.meetsNyquist,true);
  assert.match(r.trace.at(-1),/no noise or extra frequencies/);
  assert.match(r.trace.at(-1),/not establish a real sensor/);
});
test('unknown, coerced, nonfinite and unsupported sample rates fail closed',()=>{
  for(const args of [['wrong',8],['ripple-six','8'],['ripple-six',NaN],
    ['ripple-six',Infinity],['ripple-six',0],['ripple-six',12],
    ['ripple-six',null],['ripple-six',-8]]){
    assert.throws(()=>solveScenario(...args));
  }
});
test('two separate explanations and predictions survive replay without stored results',()=>{
  const empty=newRecord();
  const first=appendAttempt(empty,attempt(SCENARIOS[0]));
  const second=appendAttempt(first,attempt(SCENARIOS[1],{
    sampleRateHz:24,apparentPredictionHz:9,nyquistPrediction:'meets',
    explanation:'With a faster fictional sampler the ideal single sine meets the strict Nyquist condition.'
  }));
  assert.equal(empty.actions.length,0);
  assert.equal(first.actions.length,1);
  assert.equal(second.actions.length,2);
  assert.notEqual(second.actions[0].explanation,second.actions[1].explanation);
  assert.equal(replayRecord(second)[0].apparentCorrect,true);
  assert.equal(replayRecord(second)[1].nyquistCorrect,true);
  assert.ok(!JSON.stringify(second).includes('apparentCorrect'));
  assert.throws(()=>appendAttempt(second,attempt(SCENARIOS[0])),/ALREADY_COMPLETE/);
});
test('incorrect predictions are preserved as learning attempts, not fabricated success',()=>{
  const r=appendAttempt(newRecord(),attempt(SCENARIOS[0],{
    apparentPredictionHz:9,nyquistPrediction:'meets'
  }));
  const [result]=replayRecord(r);
  assert.equal(result.apparentCorrect,false);
  assert.equal(result.nyquistCorrect,false);
  assert.equal(r.actions[0].apparentPredictionHz,9);
});
test('out-of-order, repeated and extra fields are rejected',()=>{
  assert.throws(()=>appendAttempt(newRecord(),attempt(SCENARIOS[1])),/WRONG_ROUND/);
  const first=appendAttempt(newRecord(),attempt(SCENARIOS[0]));
  assert.throws(()=>appendAttempt(first,attempt(SCENARIOS[0])),/WRONG_ROUND/);
  assert.throws(()=>appendAttempt(newRecord(),{...attempt(SCENARIOS[0]),score:100}),/INVALID_ACTION_SCHEMA/);
});
test('prediction types, values and explanation boundaries are strict',()=>{
  for(const more of [
    {apparentPredictionHz:'2'},{apparentPredictionHz:3},{apparentPredictionHz:NaN},
    {nyquistPrediction:'maybe'},{nyquistPrediction:true},
    {explanation:'short'},{explanation:' '.repeat(20)},
    {explanation:'A valid explanation.\nAnother line.'},
    {explanation:'a'.repeat(501)}
  ]) assert.throws(()=>appendAttempt(newRecord(),attempt(SCENARIOS[0],more)));
  assert.ok(APPARENT_FREQUENCIES_HZ.includes(7));
  assert.ok(Object.hasOwn(NYQUIST_PREDICTIONS,'fails'));
});
test('forged results, owner identity and verified flags are never accepted',()=>{
  const original=appendAttempt(newRecord(),attempt(SCENARIOS[0]));
  for(const [key,value] of [['apparentCorrect',true],['meetsNyquist',true],
    ['score',100],['ownerUid','victim'],['verified',true],['samples',[]]]){
    const tampered=clone(original);
    tampered.actions[0][key]=value;
    assert.throws(()=>replayRecord(tampered),/INVALID_ACTION_SCHEMA/);
  }
  const forged=clone(original);forged.ownerUid='someone';
  assert.throws(()=>replayRecord(forged),/INVALID_RECORD_SCHEMA/);
});
test('stale revision, fake evidence promotion and excess rounds rejected',()=>{
  const original=appendAttempt(newRecord(),attempt(SCENARIOS[0]));
  for(const [key,value] of [['version','2'],['sourceRevision','latest'],
    ['evidenceStatus','authenticated']]){
    const tampered=clone(original);tampered[key]=value;
    assert.throws(()=>replayRecord(tampered));
  }
  const extra=clone(original);
  extra.actions.push(attempt(SCENARIOS[1]),attempt(SCENARIOS[1]));
  assert.throws(()=>replayRecord(extra),/INVALID_ACTION_COUNT/);
});
test('bounded local JSON round-trip recomputes the full result',()=>{
  const full=appendAttempt(appendAttempt(newRecord(),attempt(SCENARIOS[0])),
    attempt(SCENARIOS[1]));
  const json=exportRecord(full);
  assert.deepEqual(importRecord(json),full);
  assert.deepEqual(replayRecord(importRecord(json)),replayRecord(full));
  assert.doesNotMatch(json,/apparentCorrect|samples|ownerUid|meetsNyquist/);
});
test('invalid JSON, oversized, malformed and prototype-looking imports fail',()=>{
  for(const json of ['{','[]','{}',' '.repeat(12001),
    JSON.stringify({...newRecord(),score:100})]){
    assert.throws(()=>importRecord(json));
  }
  const bad=JSON.stringify(appendAttempt(newRecord(),attempt(SCENARIOS[0])))
    .replace('"scenarioId":','"__proto__":{"verified":true},"scenarioId":');
  assert.throws(()=>importRecord(bad),/INVALID_ACTION_SCHEMA/);
  assert.equal({}.verified,undefined);
});
test('standalone preview uses accessible reading alternative, focus and no network',()=>{
  const html=readFileSync(join(dir,'preview.html'),'utf8');
  const app=readFileSync(join(dir,'app.mjs'),'utf8');
  const review=readFileSync(join(dir,'SOURCE-REVIEW.md'),'utf8');
  assert.match(html,/<html lang="en">/);
  assert.match(html,/prefers-reduced-motion/);
  assert.match(app,/fieldset/);
  assert.match(app,/createElement\('table'\)/);
  assert.match(app,/aria-live/);
  assert.match(app,/\.focus\(\)/);
  assert.match(app,/textContent/);
  assert.match(review,/independent subject review pending/);
  assert.doesNotMatch(html+app,/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator\.mediaDevices|innerHTML/);
});
