import {createHash} from 'node:crypto';
import {validatePrepared} from './core.mjs';

// Offline, original KAIRO-authored TEACHING example, not an uploaded learner source
// or an independently peer-reviewed engineering standard.
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceId='1'.repeat(24);
const title='Pump reasoning · KAIRO-authored prepared notes';
const statements=[
 {locator:'Teaching note · section 1',text:'The impeller transfers rotational energy to water. In this prepared centrifugal-pump example, that transfer increases the head the pump can supply.'},
 {locator:'Teaching note · section 2',text:'In the prepared pipe system, frictional head loss grows as flow increases. The system curve combines static head with the flow-dependent loss.'},
 {locator:'Teaching note · section 3',text:'The operating point is where the pump head curve meets the system head curve. At that intersection, the pump supplies the head the system needs at the same flow.'},
];
const reviewedPages=statements.map(s=>({locator:s.locator,text:s.text,method:'authored-teaching-text',edited:false}));
const revision=sha(reviewedPages);
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
 exerciseRevision:sha({reviewedPages,concepts,relations,challenges}),bundleRevision:sha({schemaVersion:2,sourceRefs:[{sourceId,revision}]}),
 sourceRefs:[{sourceId,revision}],evidence,concepts,relations,challenges});
