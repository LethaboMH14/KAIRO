/**
 * Independent, seeded deterministic negative controls for the actual #55
 * two-round pump challenge. No synthetic outcomes are learning efficacy data.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 initialState,transition,serialize,restore,scenarioResult,SCENARIOS,
 CHALLENGE_SCHEMA,PROVENANCE,
} from '../../studio/src/studio-scenarios/pump-what-if/challenge.ts';
import {MODEL_VERSION} from '../../studio/src/pump-lab/physics.ts';

const SEED=0x49f02255;
const rng=(seed)=>{
 let state=seed>>>0;
 return ()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
};
const note=(i,round)=>'The model changes flow when the valve resistance changes: case '+i+' round '+round+'.';
function makeCase(i){
 const next=rng(SEED+i);
 let state=initialState();
 const snapshots=[serialize(state)];
 for(let round=0;round<2;round++){
  const direction=['increase','decrease','unchanged'][Math.floor(next()*3)];
  const estimateLps=Math.round(next()*3000)/100;
  state=transition(state,{type:'predict',direction,estimateLps});
  snapshots.push(serialize(state));
  state=transition(state,{type:'explain',note:note(i,round)});
  snapshots.push(serialize(state));
 }
 return {state,snapshots};
}
const mutate=(snapshot,index,patch)=>{
 const actions=structuredClone(snapshot.actions);
 actions[index]={...actions[index],...patch};
 return {...snapshot,actions};
};
test('seeded complete and partial traces round-trip without changing domain results',()=>{
 let replayed=0;
 for(let i=0;i<120;i++){
  const {state,snapshots}=makeCase(i);
  assert.equal(state.phase,'done');
  assert.equal(state.attempts.length,2);
  assert.equal(state.attempts[0].independent,false);
  assert.equal(state.attempts[1].independent,true);
  assert.notEqual(state.attempts[0].scenarioId,state.attempts[1].scenarioId);
  for(let j=0;j<2;j++){
   const expected=scenarioResult(j);
   assert.equal(state.attempts[j].beforeLps,expected.before.flowLps);
   assert.equal(state.attempts[j].afterLps,expected.after.flowLps);
   assert.equal(state.attempts[j].actualDirection,expected.actualDirection);
   assert.equal(state.attempts[j].scenarioId,SCENARIOS[j].id);
   assert.equal(state.attempts[j].directionMatches,
    state.attempts[j].direction===expected.actualDirection);
  }
  for(const snapshot of snapshots){
   const original=structuredClone(snapshot);
   const replayedState=restore(JSON.parse(JSON.stringify(snapshot)));
   assert.deepEqual(serialize(replayedState),snapshot);
   assert.deepEqual(snapshot,original);
   replayed++;
  }
 }
 assert.equal(replayed,600);
 console.log('PUMP_FUZZ_SEED='+SEED+' VALID_REPLAYS='+replayed);
});
test('seeded adversarial mutations never pass restore or become evidence',()=>{
 let rejected=0;
 for(let i=0;i<80;i++){
  const {state}=makeCase(i);
  const s=serialize(state);
  const cases=[
   {...s,schema:'kairo-pump-what-if/0'},
   {...s,model:'stale-model'},
   {...s,provenance:'uploaded-source'},
   {...s,sourceId:'forged'},
   {...s,actions:'not-an-array'},
   {...s,actions:[...s.actions,{type:'predict',direction:'increase',estimateLps:10}]},
   mutate(s,0,{direction:'sideways'}),
   mutate(s,0,{estimateLps:-1}),
   mutate(s,0,{estimateLps:31}),
   mutate(s,0,{estimateLps:'12'}),
   mutate(s,0,{estimateLps:null}),
   mutate(s,0,{estimateLps:Infinity}),
   mutate(s,0,{privateMaterial:'injected'}),
   mutate(s,1,{note:'short'}),
   mutate(s,1,{note:'x'.repeat(281)}),
   mutate(s,1,{note:'sufficient text\u0001'}),
   mutate(s,1,{type:'predict'}),
   mutate(s,2,{direction:'invalid'}),
   mutate(s,2,{estimateLps:NaN}),
   mutate(s,2,{extra:'untrusted'}),
   mutate(s,3,{note:''}),
   mutate(s,3,{note:'bad\u0000control'}),
   {...s,actions:[s.actions[1],s.actions[0],s.actions[2],s.actions[3]]},
   {...s,actions:[s.actions[0],s.actions[2],s.actions[1],s.actions[3]]},
  ];
  for(const dirty of cases){
   assert.throws(()=>restore(dirty),'mutation '+rejected+' must fail');
   rejected++;
  }
 }
 assert.equal(rejected,1920);
 console.log('PUMP_FUZZ_SEED='+SEED+' REJECTED_MUTATIONS='+rejected);
});
test('export rejects forged outcomes, phase and extra result metadata',()=>{
 const {state}=makeCase(3);
 assert.equal(state.schema,CHALLENGE_SCHEMA);
 assert.equal(state.model,MODEL_VERSION);
 assert.equal(state.provenance,PROVENANCE);
 const forged=[
  {...state,phase:'predict'},
  {...state,attempts:state.attempts.map((a,i)=>i===0?{...a,afterLps:999}:a)},
  {...state,attempts:state.attempts.map((a,i)=>i===1?{...a,directionMatches:true}:a)},
  {...state,attempts:state.attempts.map((a,i)=>i===0?{...a,sourceText:'injected'}:a)},
 ];
 for(const dirty of forged)assert.throws(()=>serialize(dirty));
 assert.equal(restore(serialize(state)).attempts[1].independent,true);
});
