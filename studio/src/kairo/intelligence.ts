import type {Attempt} from '../workspace/learning';
type Observation={x:number[];y:number};
const sigmoid=(z:number)=>1/(1+Math.exp(-Math.max(-30,Math.min(30,z))));
function features(history:readonly Attempt[],question:number){let streak=0;for(let i=history.length-1;i>=0&&history[i].correct;i--)streak++;return [1,(history.filter(a=>a.correct).length+1)/(history.length+2),Math.min(streak,5)/5,Math.min(history.filter(a=>a.question===question&&!a.correct).length,5)/5];}
const predict=(w:number[],x:number[])=>sigmoid(w.reduce((n,v,i)=>n+v*x[i],0));
/** A small experimental local logistic model. Features never include the current/future label. */
export function evaluateNextAttempt(attempts:readonly Attempt[],question=0){
 const clean=attempts.filter(a=>Number.isSafeInteger(a.question)&&a.question>=0&&typeof a.correct==='boolean');
 const insufficient={status:'insufficient' as const,samples:clean.length,probability:null,modelBrier:null,baselineBrier:null,validationSamples:0};
 if(clean.length<50)return insufficient;
 const observations:Observation[]=clean.map((a,i)=>({x:features(clean.slice(0,i),a.question),y:Number(a.correct)}));
 const cut=Math.floor(observations.length*.8),train=observations.slice(0,cut),test=observations.slice(cut);
 if(test.length<10||!train.some(o=>o.y===0)||!train.some(o=>o.y===1))return insufficient;
 const w=[0,0,0,0];for(let epoch=0;epoch<250;epoch++){const gradient=[0,0,0,0];for(const o of train){const error=predict(w,o.x)-o.y;for(let j=0;j<w.length;j++)gradient[j]+=error*o.x[j];}for(let j=0;j<w.length;j++)w[j]-=.3*(gradient[j]/train.length+(j?.02*w[j]:0));}
 const baseline=(train.reduce((n,o)=>n+o.y,0)+1)/(train.length+2);
 const modelBrier=test.reduce((n,o)=>n+(predict(w,o.x)-o.y)**2,0)/test.length;
 const baselineBrier=test.reduce((n,o)=>n+(baseline-o.y)**2,0)/test.length;
 const accepted=modelBrier+.01<baselineBrier;
 return {status:accepted?'experimental':'baseline-preferred',samples:clean.length,probability:accepted?predict(w,features(clean,question)):null,modelBrier,baselineBrier,validationSamples:test.length};
}
export function supportFor(attempts:readonly Attempt[]){if(!attempts.length)return {title:'Start with one question',reason:'Your next step comes from this lesson, not an inferred ability label.'};const last=attempts.at(-1)!;if(!last.correct)return {title:'Try one smaller step',reason:'Your latest answer needs another look. Read the cited passage, explain it in your own words and retry.'};return {title:'Explain why it works',reason:'Your latest answer matches the source. Add your reasoning, then try applying the idea in a supported case.'};}
