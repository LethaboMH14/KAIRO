import {validatePrepared} from './core.mjs';

// Original offline teaching example. Revisions were generated with Node SHA256
// during authoring; the browser never needs Node crypto or any provider.
// SHA256(JSON.stringify(reviewedPages)), as also verified by focused tests.
const REVIEWED_SHA='6e74777fd6e80207407d510f189c86bffa3e895c0944a25b40c5a66e9ed3a4d3';
// SHA256(JSON.stringify({schemaVersion:2,sourceRefs:[{sourceId,revision}]}))
const BUNDLE_SHA='52a9b2652e20f4aebcadb9f9bfed583e6fc875fed7b1d01a4e3f8b7c6538c7d7';
// SHA256(JSON.stringify({version:1,content:'KAIRO-authored pump evidence 2026-10-25',
// revision:REVIEWED_SHA,answers:['head-transfer','curve-intersection']}))
const EXERCISE_SHA='e0f67f5bd6657dbaddc787625f83bdd119d74e8d9d2c0d9279780e7b55b6bc5d';
const sourceId='1'.repeat(24);
const title='Pump reasoning · KAIRO-authored prepared notes';
const statements=[
 {locator:'Teaching note · section 1',text:'The impeller transfers rotational energy to water. In this prepared centrifugal-pump example, that transfer increases the head the pump can supply.'},
 {locator:'Teaching note · section 2',text:'In the prepared pipe system, frictional head loss grows as flow increases. The system curve combines static head with the flow-dependent loss.'},
 {locator:'Teaching note · section 3',text:'The operating point is where the pump head curve meets the system head curve. At that intersection, the pump supplies the head the system needs at the same flow.'},
];
const reviewedPages=statements.map(s=>({locator:s.locator,text:s.text,method:'authored-teaching-text',edited:false}));
const revision=REVIEWED_SHA;
const evidence=statements.map((s,i)=>({id:sourceId+'-'+revision.slice(0,12)+'-S'+(i+1)+'-0',
 sourceId,sourceRevision:revision,title,locator:s.locator,quote:s.text,start:0,end:s.text.length,edited:false}));
const [e1,e2,e3]=evidence.map(e=>e.id);
const concepts=[
 {id:'impeller',label:'Impeller',summary:'Rotating component that transfers mechanical energy to the fluid.',evidenceIds:[e1]},
 {id:'rotation',label:'Rotational energy',summary:'The incoming energy described in the first teaching passage.',evidenceIds:[e1]},
 {id:'pump-head',label:'Pump head',summary:'Head the pump can supply in the prepared example.',evidenceIds:[e1,e3]},
 {id:'fluid-flow',label:'Fluid flow',summary:'The common flow at which pump and system must balance.',evidenceIds:[e3]},
 {id:'pipe-friction',label:'Pipe friction',summary:'The flow-dependent component of system head.',evidenceIds:[e2]},
 {id:'system-curve',label:'System curve',summary:'Static head plus flow-dependent losses.',evidenceIds:[e2,e3]},
 {id:'operating-point',label:'Operating point',summary:'Intersection of pump-head and system-head curves.',evidenceIds:[e3]},
 {id:'efficiency',label:'Efficiency claim?',summary:'Efficiency is not established by these selected passages. Do not infer a universal improvement.',evidenceIds:[]}
];
const relations=[
 {from:'impeller',to:'rotation',kind:'supported',evidenceIds:[e1]},
 {from:'rotation',to:'pump-head',kind:'supported',evidenceIds:[e1]},
 {from:'pipe-friction',to:'system-curve',kind:'supported',evidenceIds:[e2]},
 {from:'system-curve',to:'operating-point',kind:'supported',evidenceIds:[e3]},
 {from:'pump-head',to:'operating-point',kind:'supported',evidenceIds:[e3]},
 {from:'operating-point',to:'fluid-flow',kind:'supported',evidenceIds:[e3]},
 {from:'pump-head',to:'efficiency',kind:'unverified',evidenceIds:[]}
];
const challenges=[
 {id:'head-transfer',claim:'In this example, the impeller transfers rotational energy to water and increases the pump head.',answerEvidenceId:e1,why:'Section 1 explicitly names the impeller, rotational energy and pump head; neither of the other excerpts makes that full claim.'},
 {id:'curve-intersection',claim:'The prepared pump operates where the pump-head and system-head curves intersect.',answerEvidenceId:e3,why:'Section 3 explicitly defines the operating point as the intersection; Section 2 defines the system curve but does not establish that intersection.'}
];
export const preparedPages=Object.freeze(reviewedPages);
export const preparedPumpExercise=validatePrepared({schemaVersion:1,mode:'prepared',exerciseId:'pump-evidence-101',
 exerciseRevision:EXERCISE_SHA,bundleRevision:BUNDLE_SHA,
 sourceRefs:[{sourceId,revision}],evidence,concepts,relations,challenges});
