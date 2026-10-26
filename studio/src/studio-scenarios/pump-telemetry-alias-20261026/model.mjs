/**
 * KAIRO Engineering Studio: fictional pump telemetry aliasing.
 * No live sensor connection, fault diagnosis or operational instructions.
 */
export const VERSION = 'kairo-pump-telemetry-alias/1';
export const SOURCE_REVISION = 'sampling-public-concepts-20261026/1';
export const EVIDENCE_STATUS = 'local-unverified';
export const SOURCE_REVIEW_STATUS = 'public-concepts-checked; independent-domain-review-pending';
export const SOURCES = Object.freeze([
  Object.freeze({
    title: 'MIT OpenCourseWare — Lecture 16: Sampling',
    url: 'https://ocw.mit.edu/courses/res-6-007-signals-and-systems-spring-2011/resources/lecture-16-sampling/',
    concept: 'Undersampling a sinusoid can make a higher frequency appear as a lower frequency.'
  }),
  Object.freeze({
    title: 'NI — Nyquist theorem and aliasing',
    url: 'https://www.ni.com/docs/en-US/bundle/ni-dmm/page/nyquist-theorem_1.html',
    concept: 'An ideal band-limited signal needs a sampling frequency greater than twice its highest frequency.'
  })
]);
export const SCENARIOS = Object.freeze([
  Object.freeze({id:'ripple-six', title:'First fictional sensor trace', frequencyHz:6,
    prompt:'A made-up pump pressure sensor has a 6 Hz sinusoidal ripple. Choose a sampling rate and predict the frequency that the samples could appear to show.'}),
  Object.freeze({id:'ripple-nine', title:'Second fictional sensor trace', frequencyHz:9,
    prompt:'A second made-up pump sensor has a 9 Hz sinusoidal ripple. Reconsider whether the sampling rate changes what the data appears to show.'})
]);
export const SAMPLE_RATES_HZ = Object.freeze([8,10,16,24]);
export const APPARENT_FREQUENCIES_HZ = Object.freeze([1,2,4,6,7,9]);
export const NYQUIST_PREDICTIONS = Object.freeze({
  meets: 'Yes — this rate is strictly above twice the known ripple frequency',
  fails: 'No — this rate is not strictly above twice the known ripple frequency'
});
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const plain = x => x!==null && typeof x==='object' && !Array.isArray(x);
const exact = (x,keys) => plain(x) && Object.keys(x).length===keys.length && keys.every(k=>own(x,k));
const check = (condition,code) => { if(!condition) throw new Error(code); };
const round = (x,d=4) => Math.round(x*10**d)/10**d;
const scenarioFor = id => SCENARIOS.find(s=>s.id===id);
export function solveScenario(scenarioId,sampleRateHz) {
  const scenario=scenarioFor(scenarioId);
  check(Boolean(scenario),'UNKNOWN_SCENARIO');
  check(typeof sampleRateHz==='number' && SAMPLE_RATES_HZ.includes(sampleRateHz),'INVALID_SAMPLE_RATE');
  const f=scenario.frequencyHz, fs=sampleRateHz;
  const nearestMultiple=Math.round(f/fs);
  const apparentFrequencyHz=Math.abs(f-nearestMultiple*fs);
  const meetsNyquist=fs>2*f;
  // One second of samples plus the end-point, all fictional and deterministic.
  const samples=Object.freeze(Array.from({length:fs+1},(_,i)=>Object.freeze({
    index:i,timeSec:round(i/fs,6),
    value:round(Math.sin(2*Math.PI*f*i/fs+Math.PI/6),4)
  })));
  return Object.freeze({
    scenarioId,frequencyHz:f,sampleRateHz:fs,nyquistThresholdHz:2*f,
    apparentFrequencyHz,meetsNyquist,
    samples,
    trace:Object.freeze([
      'Invented ripple: sin(2π × '+f+' × t + π/6); amplitude is a unitless teaching value.',
      'Sample '+fs+' times per second: t = n / '+fs+' seconds for integer n.',
      'Nearest multiple of sample rate: '+nearestMultiple+' × '+fs+' = '+nearestMultiple*fs+' Hz.',
      'Apparent frequency = |'+f+' - '+nearestMultiple*fs+'| = '+apparentFrequencyHz+' Hz.',
      'Ideal Nyquist condition: '+fs+' > 2 × '+f+' = '+2*f+' Hz → '+(meetsNyquist?'met':'not met')+'.',
      'This ideal single-sine exercise assumes no noise or extra frequencies. Samples alone do not establish a real sensor signal or equipment condition.'
    ])
  });
}
export function newRecord() {
  return {version:VERSION,sourceRevision:SOURCE_REVISION,evidenceStatus:EVIDENCE_STATUS,actions:[]};
}
function validateAction(action,index) {
  check(exact(action,['scenarioId','sampleRateHz','apparentPredictionHz','nyquistPrediction','explanation']),'INVALID_ACTION_SCHEMA');
  check(index<SCENARIOS.length && action.scenarioId===SCENARIOS[index].id,'WRONG_ROUND');
  const result=solveScenario(action.scenarioId,action.sampleRateHz);
  check(typeof action.apparentPredictionHz==='number' &&
    APPARENT_FREQUENCIES_HZ.includes(action.apparentPredictionHz),'INVALID_FREQUENCY_PREDICTION');
  check(typeof action.nyquistPrediction==='string' &&
    own(NYQUIST_PREDICTIONS,action.nyquistPrediction),'INVALID_NYQUIST_PREDICTION');
  check(typeof action.explanation==='string' &&
    action.explanation.length>=20 && action.explanation.length<=500 &&
    action.explanation===action.explanation.trim() &&
    !/[\u0000-\u001f\u007f-\u009f]/u.test(action.explanation),'INVALID_EXPLANATION');
  return Object.freeze({...result,
    apparentPredictionHz:action.apparentPredictionHz,
    nyquistPrediction:action.nyquistPrediction,
    explanation:action.explanation,
    apparentCorrect:action.apparentPredictionHz===result.apparentFrequencyHz,
    nyquistCorrect:(action.nyquistPrediction==='meets')===result.meetsNyquist
  });
}
export function replayRecord(record) {
  check(exact(record,['version','sourceRevision','evidenceStatus','actions']),'INVALID_RECORD_SCHEMA');
  check(record.version===VERSION && record.sourceRevision===SOURCE_REVISION,'STALE_SOURCE_OR_VERSION');
  check(record.evidenceStatus===EVIDENCE_STATUS,'INVALID_EVIDENCE_STATUS');
  check(Array.isArray(record.actions) && record.actions.length<=SCENARIOS.length,'INVALID_ACTION_COUNT');
  return Object.freeze(record.actions.map((action,index)=>validateAction(action,index)));
}
export function appendAttempt(record,choice) {
  replayRecord(record);
  check(record.actions.length<SCENARIOS.length,'ALREADY_COMPLETE');
  check(exact(choice,['scenarioId','sampleRateHz','apparentPredictionHz','nyquistPrediction','explanation']),'INVALID_ACTION_SCHEMA');
  const action={
    scenarioId:choice.scenarioId,sampleRateHz:choice.sampleRateHz,
    apparentPredictionHz:choice.apparentPredictionHz,
    nyquistPrediction:choice.nyquistPrediction,explanation:choice.explanation
  };
  validateAction(action,record.actions.length);
  const next={...newRecord(),actions:[...record.actions,action]};
  replayRecord(next);
  return next;
}
export function importRecord(json) {
  check(typeof json==='string' && json.length<=12000,'INVALID_JSON_SIZE');
  let parsed;
  try {parsed=JSON.parse(json);} catch {throw new Error('INVALID_JSON');}
  replayRecord(parsed);
  return {...newRecord(),actions:parsed.actions.map(a=>({
    scenarioId:a.scenarioId,sampleRateHz:a.sampleRateHz,
    apparentPredictionHz:a.apparentPredictionHz,
    nyquistPrediction:a.nyquistPrediction,explanation:a.explanation
  }))};
}
export function exportRecord(record) {
  replayRecord(record);
  return JSON.stringify(importRecord(JSON.stringify(record)),null,2);
}
