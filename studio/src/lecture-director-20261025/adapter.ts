import type packType from '../studio-teaching-host/packs/motor.json';
import {assertLesson,type DirectorLesson,type Cue,type SourceRef} from './model.ts';
export type PreparedMotorInput=typeof packType;
const APPROVED_ID='kairo-engineering-motor-field-speed-20261024';
const REVIEWED_FINGERPRINT='0ef2051e';
// A version pin to catch accidental content drift, not a cryptographic authentication method.
// Do not use this adapter for unreviewed uploads or imply source ownership verification.
export function packFingerprint(p:PreparedMotorInput):string{
 const raw=JSON.stringify({id:p.id,version:p.schemaVersion,
  steps:p.steps.map(x=>({id:x.id,title:x.title,explanation:x.explanation,sourceRefIds:x.sourceRefIds})),
  sources:p.sourceRefs.map(x=>({id:x.id,url:x.url,locator:x.locator,checkedAt:x.checkedAt})),practice:p.practice});
 let hash=2166136261;for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16).padStart(8,'0');
}
export function adaptPreparedMotor(p:PreparedMotorInput):DirectorLesson{
 if(p.id!==APPROVED_ID||p.schemaVersion!==1||packFingerprint(p)!==REVIEWED_FINGERPRINT)throw Error('The prepared source or explanation has changed; reviewer approval is required.');
 const sourceRefIds=['nptel-three-phase-field','nptel-induction-slip','nptel-speed-pole-pairs'];
 if(sourceRefIds.some(id=>!p.sourceRefs.some(s=>s.id===id)))throw Error('An approved source reference is missing.');
 const [part,formula,compare]=p.steps;
 const cues:Cue[]=[
  {id:'INTRO',version:1,sourceRefIds,boardAction:'Reveal stationary stator and moving field',transcript:part.explanation,narration:part.explanation,requiresLearnerAction:false},
  {id:'EXPLAIN',version:1,sourceRefIds,boardAction:'Reveal nₛ = 120f/p and its units',transcript:formula.explanation.split(' For four poles')[0],narration:formula.explanation.split(' For four poles')[0],requiresLearnerAction:false},
  {id:'DEMONSTRATE',version:1,sourceRefIds,boardAction:'Update stator field speed from frequency and pole count',transcript:compare.explanation,narration:compare.explanation,requiresLearnerAction:true},
  {id:'PAUSE_FOR_PREDICTION',version:1,sourceRefIds,boardAction:'Hide result and ask for 50 Hz, 4 poles',transcript:'Predict synchronous field speed for 50 Hz and four total poles. Give an answer before viewing the calculation.',narration:'Predict the field speed at 50 hertz and four poles.',requiresLearnerAction:true},
  {id:'REVEAL_FEEDBACK',version:1,sourceRefIds,boardAction:'Show the substitution and explain field speed versus rotor speed',transcript:formula.explanation,narration:formula.explanation,requiresLearnerAction:false},
  {id:'SECOND_ATTEMPT',version:1,sourceRefIds,boardAction:'Ask the second 60 Hz, 4-pole question before revealing the result',transcript:p.practice[0].question,narration:p.practice[0].question,requiresLearnerAction:true},
  {id:'COMPLETE',version:1,sourceRefIds,boardAction:'Reveal 120 × 60 ÷ 4 and comparison',transcript:p.practice[0].expectedReasoning,narration:p.practice[0].expectedReasoning,requiresLearnerAction:false}
 ];
 const lesson:DirectorLesson={id:p.id,title:p.title,objective:p.objective,sourceFingerprint:REVIEWED_FINGERPRINT,sourceRefs:p.sourceRefs as SourceRef[],cues,
  answerKey:{version:1,first:{frequencyHz:50,poles:4,correct:'1500'},second:{frequencyHz:60,poles:4,correct:'1800'}}};
 assertLesson(lesson);return lesson;
}
