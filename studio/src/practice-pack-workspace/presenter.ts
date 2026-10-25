import {currentStep, getPracticePack, type PracticeRun} from '../practice-packs/model.ts';

/** Deliberately narrow pre-answer view: the UI never receives answer disposition or rationale. */
export type LearnerStepView={
 packId:string;packTitle:string;stepId:string;stepTitle:string;prompt:string;hintAvailable:boolean;
 stepNumber:number;stepCount:number;revision:{id:string;summary:string}|null;
 choices:{id:string;label:string}[];
};

export function learnerStepView(run:PracticeRun):LearnerStepView|null{
 const pack=getPracticePack(run.packId),step=currentStep(run);
 if(!pack||!step)return null;
 return {
  packId:pack.id,packTitle:pack.title,stepId:step.id,stepTitle:step.title,prompt:step.prompt,
  hintAvailable:true,stepNumber:run.stepIndex+1,stepCount:pack.steps.length,
  revision:step.revision?{id:step.revision.id,summary:step.revision.summary}:null,
  choices:step.choices.map(({id,label})=>({id,label}))
 };
}

