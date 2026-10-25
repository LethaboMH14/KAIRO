const languages=new Set(['English','Afrikaans','isiZulu','isiXhosa','Sesotho','Setswana']);
const clean=(v,n=180)=>typeof v==='string'?v.trim().slice(0,n):'';
export function learnerPreferences(value={}){
 return {schemaVersion:1,goal:clean(value.goal,500),roleGoal:clean(value.roleGoal,180),language:languages.has(value.language)?value.language:'English',pace:['small-steps','standard','challenge'].includes(value.pace)?value.pace:'standard',prerequisites:Array.isArray(value.prerequisites)?value.prerequisites.slice(0,8).map(v=>clean(v,100)).filter(Boolean):[]};
}
/** Transparent pattern summary. Attempts are learner-authored, never verified ability. */
export function curateLesson({preferences={},history=[],source,goal=''}){
 const profile=learnerPreferences(preferences);
 const events=(Array.isArray(history)?history:[]).filter(e=>e&&e.sourceRevision===source.revision&&typeof e.correct==='boolean'&&['none','hint','worked-example','unknown'].includes(e.helpExposure)).slice(-40);
 const independent=events.filter(e=>e.helpExposure==='none'),errors=independent.filter(e=>!e.correct).length;
 const needsReview=events.filter(e=>!e.correct).length>=2;
 const approach=needsReview?'worked-example-then-independent-attempt':independent.length>=3&&errors===0?'changed-context-transfer':'explain-predict-practise';
 return {schemaVersion:1,language:profile.language,goal:clean(goal,1000)||profile.goal||'Explain one important idea and apply it.',roleGoal:profile.roleGoal,pace:profile.pace,prerequisites:profile.prerequisites,approach,reason:needsReview?'Your recent practice on this source includes repeated unsupported answers. Try a worked example before a new attempt. Assistance may be unknown; this is a study suggestion, not an ability score.':approach==='changed-context-transfer'?'Your recent independent attempts were correct. Try applying the idea in a different context.':'Start with an explanation, make a prediction, then try it yourself.',observations:events.length,independentAttempts:independent.length,sourceRevision:source.revision,limitations:['Learner-authored attempts; not verified mastery or a trained prediction.','Language output is an unverified draft.','Source coverage remains bounded to the reviewed material.']};
}
