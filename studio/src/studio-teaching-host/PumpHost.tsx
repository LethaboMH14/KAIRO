import {useCallback,useEffect,useRef,useState} from 'react';
import PumpLab from '../pump-lab/PumpLab';
import {restore} from '../pump-lab/session';
import type {TeacherContext,PumpLabEvidenceItem,PumpLabReport} from '../pump-lab/interface';
import StudioCompanion from '../learning-flow/StudioCompanion';
import {checkedId} from '../learning-flow/model';
import {useTeacher} from '../teacher/TeacherProvider';
import {learnerStorage} from '../account/storage.ts';
import StudioLessonPlan from './StudioLessonPlan';
const KEY='kairo-pump-lab-session-v1',EVIDENCE='kairo-pump-evidence-v1';
export default function PumpHost(){
 const teacher=useTeacher(),stop=useRef(teacher.stop);stop.current=teacher.stop;
 const [stored]=useState(()=>{try{const snapshot=learnerStorage.getItem(KEY);return {snapshot,writable:snapshot===null||!!restore(snapshot)};}catch{return {snapshot:null,writable:false};}}),snapshot=stored.snapshot,[context,setContext]=useState<TeacherContext|null>(null),[notice,setNotice]=useState('');
 const bundleId=checkedId(new URLSearchParams(location.search).get('bundle'));
 const lessonId=checkedId(new URLSearchParams(location.search).get('lesson')),back=bundleId?`/classroom?bundle=${bundleId}`:lessonId?`/classroom?lesson=${lessonId}&tab=evidence`:'/studios';
 useEffect(()=>()=>stop.current(),[]);
 const contextKey=useRef('');
 const onContext=useCallback((value:TeacherContext)=>{const key=JSON.stringify([value.caseId,value.selectedTarget,value.nextStep,value.readings,value.finished,value.speedRpm,value.valvePct]);if(key!==contextKey.current){contextKey.current=key;stop.current();setContext(value);}},[]);
 const onSnapshot=useCallback((value:string)=>{if(!stored.writable){setNotice('Earlier pump work could not be read and was kept unchanged. Download this run before leaving.');return;}try{learnerStorage.setItem(KEY,value);}catch{setNotice('This pump session could not save on this device. Export the report before leaving.');}},[stored.writable]);
 const onEvidence=useCallback((item:PumpLabEvidenceItem,report:PumpLabReport)=>{try{const old=JSON.parse(learnerStorage.getItem(EVIDENCE)||'[]');const items=Array.isArray(old)?old.slice(-5):[];learnerStorage.setItem(EVIDENCE,JSON.stringify([...items,{id:report.model.sessionId,title:report.case.title,originLessonId:lessonId||null,originBundleId:bundleId||null,item,report,completedAt:new Date().toISOString()}]));setNotice('Your simulation evidence was kept in your current learning space. It is not a verified qualification.');}catch{setNotice('Evidence could not save. Keep the downloaded report before leaving.');}},[]);
 return <><section className="ka-page ka-studio-coach"><p>Make a prediction, take a reading, then explain the evidence. This prepared pump model has its own sources; your uploaded material has not been converted into a simulation.</p>{notice&&<p role="status">{notice}</p>}</section><PumpLab onExit={()=>{teacher.stop();location.assign(back);}} exitLabel={lessonId||bundleId?'Back to my lesson':'Back to studios'} snapshot={snapshot} onSnapshot={onSnapshot} onEvidence={onEvidence} onContext={onContext} teachingPanel={<><StudioCompanion input={{studio:'pump',selectedLabel:context?.selectedLabel,nextStep:context?.nextStep,readings:context?.readings,finished:context?.finished,variables:context?{speedRpm:context.speedRpm,valvePct:context.valvePct}:undefined}}/><details className="lf-task-sources"><summary>Prepared teaching steps and sources</summary><StudioLessonPlan studio="pump" onRead={text=>teacher.say(text,'en-ZA')} onStep={()=>teacher.stop()}/></details></>}/></>;
}

