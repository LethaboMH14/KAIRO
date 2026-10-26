/**
 * Fictional two-pump head/flow curve exercise. Educational only, never equipment advice.
 */
export const VERSION = 'kairo-pump-arrangements/1';
export const SOURCE_REVISION = 'kairo-reviewed-public-concepts-20261026/1';
export const SOURCE_REVIEW_STATUS = 'public-sources-checked; independent-domain-review-pending';
export const EVIDENCE_STATUS = 'local-unverified';
export const SOURCES = Object.freeze([
  Object.freeze({ title: 'Grundfos — Pump curves', url: 'https://www.grundfos.com/au/learn/research-and-insights/pump-curves',
    concept: 'Series curves add head at the same flow; parallel curves add flow at the same head.' }),
  Object.freeze({ title: 'U.S. Department of Energy — Optimize Parallel Pumping Systems',
    url: 'https://www.energy.gov/sites/default/files/2014/05/f16/optimize_parallel_pumping.pdf',
    concept: 'The actual flow increase depends on the intersection with the system curve and need not double.' }),
]);
export const MODEL = Object.freeze({ shutoffHeadM: 24, curveK: 0.1 });
export const RESISTANCE_CHOICES = Object.freeze([0.02, 0.08, 0.18]);
export const SCENARIOS = Object.freeze([
  Object.freeze({ id: 'low-lift', title: 'Lower static lift', staticHeadM: 6,
    prompt: 'Choose fictional pipe resistance. Which arrangement reaches the larger system flow?' }),
  Object.freeze({ id: 'high-lift', title: 'Higher static lift', staticHeadM: 14,
    prompt: 'Repeat with higher fixed lift. Your earlier answer may change.' }),
]);
export const WINNERS = Object.freeze({ series: 'Two identical pumps in series', parallel: 'Two identical pumps in parallel' });
export const FLOW_BANDS = Object.freeze({ 'under-10': 'Under 10 L/s', '10-13': '10 to under 13 L/s',
  '13-17': '13 to under 17 L/s', '17-plus': '17 L/s or more' });
const own = (x,k) => Object.prototype.hasOwnProperty.call(x,k);
const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const exact = (x,keys) => obj(x) && Object.keys(x).length === keys.length && keys.every(k=>own(x,k));
const check = (ok,code) => { if(!ok) throw new Error(code); };
const round = x => Math.round((x+Number.EPSILON)*10000)/10000;
const band = x => x<10?'under-10':x<13?'10-13':x<17?'13-17':'17-plus';
export function solveScenario(scenarioId,resistance) {
  const scenario=SCENARIOS.find(s=>s.id===scenarioId);
  check(Boolean(scenario),'UNKNOWN_SCENARIO');
  check(typeof resistance==='number' && RESISTANCE_CHOICES.includes(resistance),'INVALID_RESISTANCE');
  const {shutoffHeadM:h0,curveK:a}=MODEL, s=scenario.staticHeadM, k=resistance;
  const qSingle=Math.sqrt((h0-s)/(a+k));
  const qSeries=Math.sqrt((2*h0-s)/(2*a+k));
  const qParallel=Math.sqrt((h0-s)/(a/4+k));
  function point(q,arrangement) {
    const system=s+k*q*q;
    const pump=arrangement==='series'?2*(h0-a*q*q):
      arrangement==='parallel'?h0-a*(q/2)**2:h0-a*q*q;
    check(Math.abs(system-pump)<1e-8,'INTERNAL_CURVE_MISMATCH');
    return Object.freeze({flowLps:round(q),headM:round(system),
      perPumpFlowLps:round(arrangement==='parallel'?q/2:q),
      perPumpHeadM:round(arrangement==='series'?system/2:system)});
  }
  return Object.freeze({scenarioId,staticHeadM:s,resistance,
    single:point(qSingle,'single'),series:point(qSeries,'series'),parallel:point(qParallel,'parallel'),
    winner:qSeries>qParallel?'series':'parallel',winningFlowBand:band(Math.max(qSeries,qParallel)),
    trace:Object.freeze([
      'Prepared single pump: H = '+h0+' - '+a+' Q²',
      'Prepared system: H = '+s+' + '+k+' Q²',
      'Series: H = '+2*h0+' - '+2*a+' Q²; Q² = ('+2*h0+' - '+s+') / ('+2*a+' + '+k+')',
      'Parallel: H = '+h0+' - '+a/4+' Q²; Q² = ('+h0+' - '+s+') / ('+a/4+' + '+k+')',
      'At the operating point, combined pump head equals system head.',
    ])});
}
export function newRecord() {return {version:VERSION,sourceRevision:SOURCE_REVISION,evidenceStatus:EVIDENCE_STATUS,actions:[]};}
function validateAction(action,index) {
  check(exact(action,['scenarioId','resistance','prediction','flowBand','explanation']),'INVALID_ACTION_SCHEMA');
  check(index<SCENARIOS.length && action.scenarioId===SCENARIOS[index].id,'WRONG_ROUND');
  const result=solveScenario(action.scenarioId,action.resistance);
  check(typeof action.prediction==='string' && own(WINNERS,action.prediction),'INVALID_PREDICTION');
  check(typeof action.flowBand==='string' && own(FLOW_BANDS,action.flowBand),'INVALID_FLOW_BAND');
  check(typeof action.explanation==='string' && action.explanation.length>=16 && action.explanation.length<=500 &&
    action.explanation===action.explanation.trim() && !/[\u0000-\u001f\u007f-\u009f]/u.test(action.explanation),'INVALID_EXPLANATION');
  return Object.freeze({...result,prediction:action.prediction,predictedFlowBand:action.flowBand,
    explanation:action.explanation,winnerCorrect:action.prediction===result.winner,
    flowBandCorrect:action.flowBand===result.winningFlowBand});
}
export function replayRecord(record) {
  check(exact(record,['version','sourceRevision','evidenceStatus','actions']),'INVALID_RECORD_SCHEMA');
  check(record.version===VERSION && record.sourceRevision===SOURCE_REVISION,'STALE_SOURCE_OR_VERSION');
  check(record.evidenceStatus===EVIDENCE_STATUS,'INVALID_EVIDENCE_STATUS');
  check(Array.isArray(record.actions) && record.actions.length<=SCENARIOS.length,'INVALID_ACTION_COUNT');
  return Object.freeze(record.actions.map((a,i)=>validateAction(a,i)));
}
export function appendAttempt(record,choice) {
  replayRecord(record);
  check(record.actions.length<SCENARIOS.length,'ALREADY_COMPLETE');
  check(exact(choice,['scenarioId','resistance','prediction','flowBand','explanation']),'INVALID_ACTION_SCHEMA');
  const action={scenarioId:choice.scenarioId,resistance:choice.resistance,prediction:choice.prediction,
    flowBand:choice.flowBand,explanation:choice.explanation};
  validateAction(action,record.actions.length);
  const next={...newRecord(),actions:[...record.actions,action]};
  replayRecord(next);return next;
}
export function importRecord(json) {
  check(typeof json==='string' && json.length<=8192,'INVALID_JSON_SIZE');
  let value;try{value=JSON.parse(json);}catch{throw new Error('INVALID_JSON');}
  replayRecord(value);
  return {...newRecord(),actions:value.actions.map(a=>({scenarioId:a.scenarioId,resistance:a.resistance,
    prediction:a.prediction,flowBand:a.flowBand,explanation:a.explanation}))};
}
export function exportRecord(record) {replayRecord(record);return JSON.stringify(importRecord(JSON.stringify(record)),null,2);}
