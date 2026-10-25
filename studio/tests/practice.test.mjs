import test from 'node:test';
import assert from 'node:assert/strict';
import {initialCase,transition,caseRecord,rubric,supportsStockCase,records} from '../src/practice/model.ts';
import {emptyProfile,saveStudy,saveCase,lessonMetrics,recommend,parseProfile,portfolioMarkdown} from '../src/profile/model.ts';
const at='2026-10-21T17:00:00Z';
const study=(id,extra={})=>({lessonId:id,title:'Stock control',topic:'Business operations',format:'example',questions:2,attempts:[],updatedAt:at,...extra});
function inspected(){let s=transition(initialCase('fixture',null),{type:'calculate',value:23},at);for(const key of Object.keys(records))s=transition(s,{type:'inspect',key},at);return s;}
test('a case cannot skip calculation, inspect unknown records or conclude without all four records',()=>{
 const initial=initialCase('fixture',null);
 assert.equal(transition(initial,{type:'decide',value:'record'},at),initial);
 assert.equal(transition(initial,{type:'inspect',key:'constructor'},at),initial);
 const wrong=transition(initial,{type:'calculate',value:41},at);assert.equal(wrong.phase,'calculate');assert.equal(wrong.events[0].correct,false);assert.equal(initial.events.length,0);
 const calculated=transition(wrong,{type:'calculate',value:23},at);assert.equal(calculated.phase,'inspect');
 const blocked=transition(calculated,{type:'reconcile',difference:2,cause:'damage'},at);assert.equal(blocked.phase,'inspect');assert.match(blocked.feedback,/Inspect/);assert.equal(blocked.events.length,2);
});
test('correct arithmetic does not excuse an unsupported cause or accusation; retries are retained',()=>{
 let s=inspected();s=transition(s,{type:'reconcile',difference:2,cause:'theft'},at);assert.equal(s.phase,'inspect');
 s=transition(s,{type:'reconcile',difference:2,cause:'damage'},at);assert.equal(s.phase,'decide');
 s=transition(s,{type:'decide',value:'accuse'},at);assert.equal(s.phase,'decide');assert.match(s.feedback,/not supported/);
 s=transition(s,{type:'decide',value:'record'},at);assert.equal(s.phase,'reflect');
 s=transition(s,{type:'reflect',value:'done'},at);assert.equal(s.phase,'reflect');
 s=transition(s,{type:'reflect',value:'I checked the shelf and signed damage entry, then documented 21 saleable notebooks.'},at);assert.equal(s.phase,'complete');
 assert.equal(rubric(s)[1].firstTry,false);assert.equal(rubric(s)[1].attempts,2);assert.equal(rubric(s)[2].firstTry,false);
 assert.equal(caseRecord(s).completedAt,at);assert.equal(transition(s,{type:'calculate',value:99},at),s);
});
test('saved action replay restores the same case without trusting a stored completion flag',()=>{
 const actions=[{type:'calculate',value:23},...Object.keys(records).map(key=>({type:'inspect',key})),{type:'reconcile',difference:2,cause:'damage'},{type:'decide',value:'record'},{type:'reflect',value:'I investigated the damage record and used it to explain and reconcile the stock count.'}];
 const replay=()=>actions.reduce((s,a)=>transition(s,a,at),initialCase('fixture','lesson-a'));
 assert.deepEqual(replay(),replay());assert.equal(replay().events.length,8);assert.equal(replay().read.length,4);
});
test('case template only links to reviewed stock-control concepts',()=>{
 assert.equal(supportsStockCase({evidence:[{quote:'Closing stock depends on deliveries and sales. Check a physical count.'}]}),true);
 assert.equal(supportsStockCase({evidence:[{quote:'A parameterized SQL query separates data from instructions.'}]}),false);
});
test('profile separates first try from latest answer and recommendations react by subject',()=>{
 const attempts=[{question:0,correct:false,at},{question:0,correct:true,at},{question:1,correct:true,at}];
 const r=study('a',{attempts});assert.deepEqual(lessonMetrics(r),{firstTry:1,supported:2,attempted:2,needsPractice:[],retries:1});
 let p=saveStudy(emptyProfile(),r);assert.equal(recommend(p).kind,'recall');
 p=saveStudy(p,study('b',{topic:'Management',format:'passage',attempts:[{question:0,correct:false,at}]}));
 assert.equal(recommend(p).lessonId,'b');assert.equal(recommend(p,'Business operations').lessonId,'a');assert.equal(recommend(p,'Management').format,'passage');
 p=saveStudy(p,{...r,attempts:[...attempts,{question:0,correct:false,at}]});assert.equal(p.lessons.length,2);assert.equal(recommend(p,'Business operations').kind,'review');
});
test('profile roundtrip is bounded, omits malformed entries and exports an honest practice record',()=>{
 let p=emptyProfile();for(let i=0;i<60;i++)p=saveStudy(p,study(String(i)));assert.equal(p.lessons.length,50);
 const c={id:'case-a',lessonId:null,title:'Corner shop',version:'corner-shop-v1',events:[{kind:'Expected stock',value:'41',correct:false,at}],reflection:'I corrected my calculation.',completedAt:at};
 p=saveCase(p,c);p=saveCase(p,{...c,reflection:'I checked the signed damage record.'});assert.equal(p.cases.length,1);
 const parsed=parseProfile(JSON.stringify({...p,lessons:[...p.lessons,{lessonId:'bad'}]}));assert.equal(parsed.lessons.length,50);
 const output=portfolioMarkdown(parsed);assert.match(output,/no independent assessment or accreditation/);assert.match(output,/retry needed/);assert.match(output,/signed damage/);assert.throws(()=>parseProfile('{bad'));
});
