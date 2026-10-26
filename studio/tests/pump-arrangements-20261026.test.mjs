import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {VERSION,SOURCE_REVISION,SOURCE_REVIEW_STATUS,EVIDENCE_STATUS,SOURCES,MODEL,
  SCENARIOS,RESISTANCE_CHOICES,WINNERS,FLOW_BANDS,solveScenario,newRecord,appendAttempt,
  replayRecord,importRecord,exportRecord} from '../src/studio-scenarios/pump-arrangements-20261026/model.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const dir=join(here,'../src/studio-scenarios/pump-arrangements-20261026');
const clone=x=>JSON.parse(JSON.stringify(x));
const choice=(s,extra={})=>({scenarioId:s.id,resistance:0.08,prediction:'parallel',
  flowBand:'13-17',explanation:'The combined pump curve meets the selected system curve at a new flow.',...extra});

test('honest source and evidence status; two independent scenarios',()=>{
  assert.equal(VERSION,'kairo-pump-arrangements/1');
  assert.match(SOURCE_REVISION,/20261026/);
  assert.match(SOURCE_REVIEW_STATUS,/pending/);
  assert.equal(EVIDENCE_STATUS,'local-unverified');
  assert.deepEqual(SCENARIOS.map(s=>s.id),['low-lift','high-lift']);
  assert.equal(SOURCES.length,2);
  for(const s of SOURCES){assert.match(s.url,/^https:\/\//);assert.ok(s.concept.length>30);}
});

test('independent analytical oracle for all six intersections',()=>{
  let n=0;
  for(const scenario of SCENARIOS)for(const k of RESISTANCE_CHOICES){
    const r=solveScenario(scenario.id,k),S=scenario.staticHeadM;
    const oracle={single:Math.sqrt((24-S)/(0.1+k)),
      series:Math.sqrt((48-S)/(0.2+k)),parallel:Math.sqrt((24-S)/(0.025+k))};
    for(const [name,q] of Object.entries(oracle)){
      assert.ok(Math.abs(r[name].flowLps-q)<0.000051);
      const h=S+k*q*q;
      const hp=name==='series'?48-0.2*q*q:name==='parallel'?24-0.025*q*q:24-0.1*q*q;
      assert.ok(Math.abs(h-hp)<1e-10);
      assert.ok(Math.abs(r[name].headM-h)<0.000051);
    }
    assert.equal(r.winner,oracle.series>oracle.parallel?'series':'parallel');
    n++;
  }
  assert.equal(n,6);
});

test('series head addition and parallel flow addition at fixed point',()=>{
  assert.equal(MODEL.shutoffHeadM,24);assert.equal(MODEL.curveK,0.1);
  const q=6,h=24-0.1*q*q;
  assert.equal(48-0.2*q*q,2*h);
  assert.equal(24-0.025*(2*q)**2,h);
});

test('winner changes with resistance and static lift',()=>{
  assert.equal(solveScenario('low-lift',0.08).winner,'parallel');
  assert.equal(solveScenario('high-lift',0.08).winner,'series');
  assert.equal(solveScenario('low-lift',0.18).winner,'series');
  assert.equal(solveScenario('high-lift',0.02).winner,'parallel');
});

test('parallel system flow is not double the single-pump flow',()=>{
  for(const s of SCENARIOS)for(const k of RESISTANCE_CHOICES){
    const r=solveScenario(s.id,k);
    assert.ok(r.parallel.flowLps>r.single.flowLps);
    assert.ok(r.parallel.flowLps<2*r.single.flowLps);
    assert.ok(r.series.flowLps>r.single.flowLps);
    assert.ok(r.parallel.perPumpFlowLps<r.parallel.flowLps);
  }
});

test('all prepared results have finite numbers, trace and defined bands',()=>{
  for(const s of SCENARIOS)for(const k of RESISTANCE_CHOICES){
    const r=solveScenario(s.id,k);
    assert.ok(Object.hasOwn(FLOW_BANDS,r.winningFlowBand));
    assert.ok(Object.hasOwn(WINNERS,r.winner));
    assert.equal(r.trace.length,5);
    for(const name of ['single','series','parallel']){
      assert.ok(Number.isFinite(r[name].flowLps));
      assert.ok(Number.isFinite(r[name].headM));
    }
  }
});

test('invalid scenario, nonfinite, coerced and unsupported resistance fail closed',()=>{
  for(const args of [['missing',0.08],['low-lift','0.08'],['low-lift',NaN],
    ['low-lift',Infinity],['low-lift',-0.02],['low-lift',0.09],['low-lift',null]])
    assert.throws(()=>solveScenario(...args));
});

test('two distinct local attempts replay with independently derived results',()=>{
  const empty=newRecord(),first=appendAttempt(empty,choice(SCENARIOS[0]));
  const second=appendAttempt(first,choice(SCENARIOS[1],{prediction:'series',
    flowBand:'10-13',explanation:'The higher fixed lift makes the series intersection larger.'}));
  assert.equal(empty.actions.length,0);assert.equal(first.actions.length,1);
  assert.equal(second.actions.length,2);
  assert.equal(replayRecord(second)[0].winnerCorrect,true);
  assert.equal(replayRecord(second)[1].winnerCorrect,true);
  assert.notEqual(second.actions[0].explanation,second.actions[1].explanation);
  assert.throws(()=>appendAttempt(second,choice(SCENARIOS[0])),/ALREADY_COMPLETE/);
  assert.ok(!JSON.stringify(second).includes('winnerCorrect'));
});

test('wrong round, duplicate, unsupported prediction and bad reasoning rejected',()=>{
  assert.throws(()=>appendAttempt(newRecord(),choice(SCENARIOS[1])),/WRONG_ROUND/);
  assert.throws(()=>appendAttempt(newRecord(),choice(SCENARIOS[0],{prediction:'double'})),/INVALID_PREDICTION/);
  assert.throws(()=>appendAttempt(newRecord(),choice(SCENARIOS[0],{flowBand:'100-200'})),/INVALID_FLOW_BAND/);
  assert.throws(()=>appendAttempt(newRecord(),choice(SCENARIOS[0],{explanation:'short'})),/INVALID_EXPLANATION/);
  assert.throws(()=>appendAttempt(newRecord(),choice(SCENARIOS[0],{explanation:'  Leading whitespace is invalid.'})),/INVALID_EXPLANATION/);
  assert.throws(()=>appendAttempt(newRecord(),choice(SCENARIOS[0],{explanation:'A valid explanation.\nWith another line'})),/INVALID_EXPLANATION/);
  const first=appendAttempt(newRecord(),choice(SCENARIOS[0]));
  assert.throws(()=>appendAttempt(first,choice(SCENARIOS[0])),/WRONG_ROUND/);
});

test('forged derived outcomes, scores and owner identity fail closed',()=>{
  const original=appendAttempt(newRecord(),choice(SCENARIOS[0]));
  for(const [key,value] of [['winner','parallel'],['winnerCorrect',true],['verified',true],['ownerUid','somebody']]){
    const changed=clone(original);changed.actions[0][key]=value;
    assert.throws(()=>replayRecord(changed),/INVALID_ACTION_SCHEMA/);
  }
  const changed=clone(original);changed.score=100;
  assert.throws(()=>replayRecord(changed),/INVALID_RECORD_SCHEMA/);
});

test('stale model/source, fake evidence promotion and excess actions rejected',()=>{
  const original=appendAttempt(newRecord(),choice(SCENARIOS[0]));
  for(const [key,value] of [['sourceRevision','future'],['version','v2'],['evidenceStatus','verified']]){
    const changed=clone(original);changed[key]=value;assert.throws(()=>replayRecord(changed));
  }
  const extra=clone(original);extra.actions.push(choice(SCENARIOS[1]),choice(SCENARIOS[1]));
  assert.throws(()=>replayRecord(extra),/INVALID_ACTION_COUNT/);
});

test('local JSON round-trip is action-only and outcomes recomputed',()=>{
  const full=appendAttempt(appendAttempt(newRecord(),choice(SCENARIOS[0])),choice(SCENARIOS[1]));
  const json=exportRecord(full);
  assert.deepEqual(importRecord(json),full);
  assert.deepEqual(replayRecord(importRecord(json)),replayRecord(full));
  assert.ok(!json.includes('winningFlowBand'));assert.ok(!json.includes('winnerCorrect'));
  assert.ok(!json.includes('ownerUid'));
});

test('JSON import rejects malformed, oversized and prototype-looking payloads',()=>{
  for(const json of ['{','[]','{}',' '.repeat(8193),JSON.stringify({...newRecord(),score:1})])
    assert.throws(()=>importRecord(json));
  const polluted=JSON.stringify({...newRecord(),actions:[choice(SCENARIOS[0])]})
    .replace('"prediction":','"__proto__":{"verified":true},"prediction":');
  assert.throws(()=>importRecord(polluted),/INVALID_ACTION_SCHEMA/);
  assert.equal({}.verified,undefined);
});

test('preview exposes keyboard-native inputs, reading table, focus and no network',()=>{
  const html=readFileSync(join(dir,'preview.html'),'utf8');
  const app=readFileSync(join(dir,'app.mjs'),'utf8');
  const review=readFileSync(join(dir,'SOURCE-REVIEW.md'),'utf8');
  assert.match(html,/<html lang="en">/);assert.match(html,/prefers-reduced-motion/);
  assert.match(app,/el\('fieldset'\)/);assert.match(app,/radio.type='radio'/);
  assert.match(app,/el\('table'\)/);assert.match(app,/aria-live/);
  assert.match(app,/\.focus\(\)/);assert.match(app,/textContent/);
  assert.match(review,/independent engineering review pending/);
  assert.doesNotMatch(html+app,/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator\.mediaDevices|innerHTML/);
});
