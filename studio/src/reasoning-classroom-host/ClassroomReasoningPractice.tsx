import {useEffect,useState} from 'react';
import ReasoningCapture from '../learner-reasoning-ui/ReasoningCapture';
import type {ConfirmedReasoning,EnglishTranscriber} from '../learner-reasoning-ui/reasoning';
import type {Lesson} from '../workspace/types';
import type {Progress} from '../workspace/learning';
import {questionKey,recordClassroomAnswer} from './model';
import {evaluateNextAttempt,supportFor} from '../kairo/intelligence';
import {practiceRecord} from '../journey-integration/model';
import PracticeMilestoneCard from '../practice-milestone-ui/PracticeMilestoneCard';
import {createGroqReasoningTranscriber} from '../reasoning-listening-bridge/groqReasoningTranscriber';
export default function ClassroomReasoningPractice({lesson,progress,onChange,onEvidence}:{lesson:Lesson;progress:Progress;onChange:(next:Progress)=>void;onEvidence:()=>void}){
 const [index,setIndex]=useState(0),[choice,setChoice]=useState<string|null>(null),[error,setError]=useState(''),[checked,setChecked]=useState(false);
 const [transcribe,setTranscribe]=useState<EnglishTranscriber|undefined>();
 useEffect(()=>{const controller=new AbortController();void fetch('/api/workspace/ai/status',{signal:controller.signal}).then(response=>response.ok?response.json():null).then(status=>{if(!controller.signal.aborted&&Array.isArray(status?.providers)&&status.providers.some((provider:{id:string;configured:boolean})=>provider.id==='groq'&&provider.configured===true))setTranscribe(()=>createGroqReasoningTranscriber({requestIdFactory:()=>crypto.randomUUID()}));}).catch(()=>{});return()=>controller.abort();},[]);
 const question=lesson.quiz[index];
 if(!question)return <section className="ka-flow-panel"><h2>Explain one idea in your own words</h2><p>This lesson has no practice questions. You can keep your explanation with your notes.</p><button type="button" onClick={onEvidence}>Keep my work</button></section>;
 function submit(explanation:ConfirmedReasoning|null){try{if(!choice)throw new Error('Choose an answer first.');onChange(recordClassroomAnswer(lesson,progress,index,choice,explanation,new Date().toISOString()));setChecked(true);setError('');return true;}catch(e){setError(e instanceof Error?e.message:'This answer could not be recorded. Your explanation remains above.');return false;}}
 const last=checked?progress.attempts.filter(attempt=>attempt.question===index).at(-1):undefined;
 const support=supportFor(progress.attempts),model=evaluateNextAttempt(progress.attempts,index),record=practiceRecord(lesson,progress,index);
 return <section className="ka-flow-panel" aria-label="Reasoning practice"><h2>Try it. Then explain why.</h2><p>Choose an answer before checking the explanation. Your own reasoning can help you see what to practise next.</p><nav className="kx-controls" aria-label="Practice questions">{lesson.quiz.map((_,i)=><button type="button" key={i} aria-current={i===index?'step':undefined} onClick={()=>{setIndex(i);setChoice(null);setChecked(false);setError('');}}>Question {i+1}</button>)}</nav>
  <ReasoningCapture key={questionKey(lesson,index)} questionId={questionKey(lesson,index)} contextKey={questionKey(lesson,index)} question={question.question} options={question.options.map((label,i)=>({id:`option-${i}`,label}))} selectedOptionId={choice} onSelectionChange={value=>{setChoice(value);setChecked(false);setError('');}} onConfirm={value=>submit(value)} onSkip={checked?undefined:()=>submit(null)} transcribe={transcribe} providerLabel="Groq for English transcription"/>
  <p className="ka-small">Choose Use my explanation to add it to My notes. Skipping records only your answer. {transcribe?'Dictation is optional. Check the transcript before confirming it.':'Dictation is unavailable in this session; you can type instead.'}</p>
  {error&&<p role="alert" className="sw-error">{error}</p>}
  {last&&<aside className="ka-feedback" role="status"><h3>{last.correct?'That answer is supported.':'Let’s check the source.'}</h3><p>{question.explanation}</p><blockquote>{question.supportQuote}</blockquote><details><summary>Check the source</summary><p>{question.citationIds.join(', ')}</p><small style={{overflowWrap:'anywhere'}}>Reviewed revision {lesson.revision}</small></details><p>Your explanation is a learning record, not a verified competence assessment.</p></aside>}
  <aside className="ka-feedback" aria-label="Your next learning step"><h3>{support.title}</h3><p>{support.reason}</p><details><summary>How this next step is chosen</summary><p>This uses explained rules from your recorded attempts. It does not infer a permanent ability or learning style.</p>{model.status==='experimental'?<p>Experimental next-attempt estimate: {Math.round(model.probability!*100)}%. Based on {model.samples} local attempts; not a mastery or qualification score.</p>:<p>{model.status==='insufficient'?'There is not enough suitable history to evaluate a model yet.':'The simple baseline is preferred over the experimental model.'}</p>}<p>A model estimate is shown only after at least 50 attempts and 10 later checks, and only if it improves on a simple baseline. Repeated attempts are dependent; this is not validated learner prediction.</p></details></aside>
  {record?<PracticeMilestoneCard attempt={record} progression={null} busy={false} onKeepWork={onEvidence}/>:<button type="button" className="kx-primary" onClick={onEvidence}>Keep my work</button>}
 </section>;
}
