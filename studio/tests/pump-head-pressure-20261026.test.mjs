import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VERSION, SOURCE_REVISION, EVIDENCE_STATUS, SOURCE_REVIEW_STATUS,
  GRAVITY, SOURCES, SCENARIOS, DIRECTIONS,
  solveScenario, newRecord, appendAttempt, replayRecord, importRecord, exportRecord
} from '../src/studio-scenarios/pump-head-pressure-20261026/model.mjs';

const dir=join(dirname(fileURLToPath(import.meta.url)),'../src/studio-scenarios/pump-head-pressure-20261026');
const clone=x=>JSON.parse(JSON.stringify(x));
const attempt=(index, changeValue, more={})=>({
  scenarioId:SCENARIOS[index].id,changeValue,
  predictedDirection:index===0?'higher':'lower',
  predictedKpa:index===0?39.2:39.2,
  explanation:'For a static column, pressure follows density times gravity times vertical depth.',
  ...more
});

test('version, source, status and two distinct rounds are explicit',()=>{
  assert.equal(VERSION,'kairo-head-pressure/1');
  assert.match(SOURCE_REVISION,/20261026/);
  assert.equal(EVIDENCE_STATUS,'local-unverified');
  assert.match(SOURCE_REVIEW_STATUS,/pending/);
  assert.equal(GRAVITY,9.80665);
  assert.deepEqual(SCENARIOS.map(s=>s.kind),['depth','density']);
  assert.equal(SOURCES.length,2);
  for(const source of SOURCES){
    assert.match(source.url,/^https:\/\//);
    assert.ok(source.concept.length>40);
  }
});
test('independent six-case gauge-pressure oracle, including no-change control',()=>{
  const expected={
    'change-depth':{2:[19.61,'lower'],4:[39.23,'higher'],6:[58.84,'higher']},
    'change-density':{800:[39.23,'lower'],1000:[49.03,'same'],1200:[58.84,'higher']}
  };
  let cases=0;
  for(const scenario of SCENARIOS)for(const change of scenario.choices){
    const result=solveScenario(scenario.id,change);
    assert.deepEqual([result.pressureKpa,result.direction],expected[scenario.id][change]);
    assert.equal(result.trace.length,5);
    assert.equal(result.scenarioId,scenario.id);
    assert.ok(Object.isFrozen(result));
    cases++;
  }
  assert.equal(cases,6);
});
test('independent dimensional check: Pa to kPa, depth and density scaling',()=>{
  const d2=solveScenario('change-depth',2);
  const d6=solveScenario('change-depth',6);
  assert.ok(Math.abs(d6.pressureKpa/d2.pressureKpa-3)<.002);
  const rho800=solveScenario('change-density',800);
  const rho1200=solveScenario('change-density',1200);
  assert.ok(Math.abs(rho1200.pressureKpa/rho800.pressureKpa-1.5)<.002);
  assert.equal(d2.basePressureKpa,29.42);
  assert.equal(rho800.basePressureKpa,49.03);
  assert.match(d2.trace[2],/÷ 1000/);
  assert.match(d2.trace.at(-1),/not a pump curve/);
});
test('no floating-point comparison mistake at unchanged density',()=>{
  const result=solveScenario('change-density',1000);
  assert.equal(result.pressureKpa,result.basePressureKpa);
  assert.equal(result.direction,'same');
});
test('unrecognised, coerced, nonfinite and unsupported choices fail closed',()=>{
  for(const [id,change] of [
    ['no-such-round',4],['change-depth','4'],['change-depth',NaN],
    ['change-depth',Infinity],['change-depth',0],['change-depth',5],
    ['change-depth',null],['change-density',-800],['change-density',801]
  ]) assert.throws(()=>solveScenario(id,change));
});
test('two independent explanations and predictions survive replay',()=>{
  const empty=newRecord();
  const first=appendAttempt(empty,attempt(0,4));
  const second=appendAttempt(first,attempt(1,800,{
    explanation:'The same vertical depth but lower fictional density gives a lower gauge pressure.'
  }));
  assert.equal(empty.actions.length,0);
  assert.equal(first.actions.length,1);
  assert.equal(second.actions.length,2);
  assert.notEqual(second.actions[0].explanation,second.actions[1].explanation);
  assert.equal(replayRecord(second)[0].directionCorrect,true);
  assert.equal(replayRecord(second)[1].pressureWithinOneKpa,true);
  assert.throws(()=>appendAttempt(second,attempt(0,2)),/ALREADY_COMPLETE/);
});
test('incorrect predictions remain recorded rather than being promoted',()=>{
  const record=appendAttempt(newRecord(),attempt(0,2,{
    predictedDirection:'higher',predictedKpa:120
  }));
  const [result]=replayRecord(record);
  assert.equal(result.direction,'lower');
  assert.equal(result.directionCorrect,false);
  assert.equal(result.pressureWithinOneKpa,false);
  assert.equal(record.actions[0].predictedKpa,120);
  assert.doesNotMatch(JSON.stringify(record),/directionCorrect|pressureWithinOneKpa|pressureKpa/);
});
test('numeric feedback uses explicit 1 kPa tolerance at rounded display',()=>{
  const exact=appendAttempt(newRecord(),attempt(0,4,{predictedKpa:39.2}));
  const far=appendAttempt(newRecord(),attempt(0,4,{predictedKpa:40.3}));
  assert.equal(replayRecord(exact)[0].pressureWithinOneKpa,true);
  assert.equal(replayRecord(far)[0].pressureWithinOneKpa,false);
});
test('round order, repeat and extra fields are rejected',()=>{
  assert.throws(()=>appendAttempt(newRecord(),attempt(1,800)),/WRONG_ROUND/);
  const first=appendAttempt(newRecord(),attempt(0,4));
  assert.throws(()=>appendAttempt(first,attempt(0,6)),/WRONG_ROUND/);
  assert.throws(()=>appendAttempt(newRecord(),{...attempt(0,4),score:100}),/INVALID_ACTION_SCHEMA/);
});
test('prediction direction and numeric domain require strict values and types',()=>{
  for(const more of [
    {predictedDirection:'maybe'},{predictedDirection:true},
    {predictedKpa:'39.2'},{predictedKpa:NaN},{predictedKpa:Infinity},
    {predictedKpa:-1},{predictedKpa:120.1},{predictedKpa:39.23},
    {predictedKpa:null}
  ]) assert.throws(()=>appendAttempt(newRecord(),attempt(0,4,more)));
  assert.ok(Object.hasOwn(DIRECTIONS,'same'));
});
test('explanations require meaningful length and reject control characters',()=>{
  for(const explanation of [
    '', 'short', ' '.repeat(25), 'A reasonable explanation.\u0000',
    'x'.repeat(501), ' Text with extra spaces. '
  ]) assert.throws(()=>appendAttempt(newRecord(),attempt(0,4,{explanation})));
  const good=appendAttempt(newRecord(),attempt(0,4,{
    explanation:'Pressure increases because the fictional column is deeper.\nDensity stays constant.'
  }));
  assert.equal(replayRecord(good).length,1);
});
test('forged result, authenticated flag and owner identity are rejected',()=>{
  const valid=appendAttempt(newRecord(),attempt(0,4));
  for(const [key,value] of [
    ['pressureKpa',39.23],['directionCorrect',true],['score',100],
    ['ownerUid','other'],['verified',true],['trace',[]]
  ]){
    const forged=clone(valid);forged.actions[0][key]=value;
    assert.throws(()=>replayRecord(forged),/INVALID_ACTION_SCHEMA/);
  }
  const root=clone(valid);root.ownerUid='someone';
  assert.throws(()=>replayRecord(root),/INVALID_RECORD_SCHEMA/);
});
test('revision, evidence status and action-count tampering fail closed',()=>{
  const valid=appendAttempt(newRecord(),attempt(0,4));
  for(const [key,value] of [
    ['version','kairo-head-pressure/2'],['sourceRevision','latest'],
    ['evidenceStatus','authenticated']
  ]){
    const forged=clone(valid);forged[key]=value;
    assert.throws(()=>replayRecord(forged),/INVALID_REVISION_OR_EVIDENCE/);
  }
  const tooMany=clone(valid);
  tooMany.actions.push(attempt(1,800),attempt(1,1000));
  assert.throws(()=>replayRecord(tooMany),/INVALID_ACTION_COUNT/);
});
test('local JSON export/import preserves only actions and recomputes outputs',()=>{
  const full=appendAttempt(appendAttempt(newRecord(),attempt(0,6)),
    attempt(1,1200,{predictedDirection:'higher',predictedKpa:58.8}));
  const json=exportRecord(full);
  assert.deepEqual(importRecord(json),full);
  assert.deepEqual(replayRecord(importRecord(json)),replayRecord(full));
  assert.doesNotMatch(json,/directionCorrect|pressureWithinOneKpa|pressureKpa|ownerUid/);
  assert.equal(replayRecord(importRecord(json)).length,2);
});
test('invalid JSON, oversized input and prototype-looking fields are rejected',()=>{
  for(const json of ['{','[]','{}',' '.repeat(12001),
    JSON.stringify({...newRecord(),score:100})]){
    assert.throws(()=>importRecord(json));
  }
  const forged=JSON.stringify(appendAttempt(newRecord(),attempt(0,4)))
    .replace('"scenarioId":','"__proto__":{"verified":true},"scenarioId":');
  assert.throws(()=>importRecord(forged),/INVALID_ACTION_SCHEMA/);
  assert.equal({}.verified,undefined);
});
test('standalone preview provides accessible reading, source limits and no network',()=>{
  const html=readFileSync(join(dir,'preview.html'),'utf8');
  const app=readFileSync(join(dir,'app.mjs'),'utf8');
  const review=readFileSync(join(dir,'SOURCE-REVIEW.md'),'utf8');
  assert.match(html,/<html lang="en">/);
  assert.match(html,/prefers-reduced-motion/);
  assert.match(app,/fieldset/);
  assert.match(app,/const table=el\('table'\)/);
  assert.match(app,/aria-live/);
  assert.match(app,/\.focus\(\)/);
  assert.match(app,/textContent/);
  assert.match(app,/document\.createElementNS/);
  assert.match(review,/independent engineering subject review pending/i);
  assert.match(review,/gauge/i);
  assert.doesNotMatch(html+app,/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator\.mediaDevices|innerHTML/);
});
