import assert from 'node:assert/strict';
import {buildLessonPlan} from '../../studio/src/lesson-plan-quality/model.ts';

// Synthetic review fixture only. Reproduces the host's supported-count concern.
const lesson={lessonId:'synthetic-review',sourceId:'synthetic-source',revision:'synthetic-rev',title:'Review fixture',objective:'Explain the supplied fixture',chapters:[{title:'Fixture',explanation:'Synthetic text.',example:'Explain this in your own words',citationIds:['E1']}],evidence:[{id:'E1',quote:'Synthetic text.',locator:'Synthetic page'}],quiz:[{question:'Which statement is supplied?',options:['one'],correct:9,explanation:'Fixture only',citationIds:['E1'],supportQuote:'Synthetic text.'}]};
const plan=buildLessonPlan(lesson,{sourceId:lesson.sourceId,revision:lesson.revision,reviewed:true});
const availableChecks=plan.steps.filter(s=>s.kind==='check').length;
assert.equal(availableChecks,0);
assert.equal(plan.summary.questionCount,1);
assert.ok(plan.warnings.some(w=>w.includes('invalid choices')));
console.log(JSON.stringify({fixture:'synthetic only',summaryQuestionCount:plan.summary.questionCount,runnableCheckCount:availableChecks,finding:'Root must reconcile declared quiz count with runnable checks before displaying readiness',warningPresent:true},null,2));
