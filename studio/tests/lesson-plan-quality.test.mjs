import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLessonPlan, toLessonPlanInput, validateLessonPlanInput } from '../src/lesson-plan-quality/model.ts';

// Synthetic fixture data only; names, source passages and answer choices are invented for tests.
const makeLesson = () => ({
  lessonId: 'lesson-synthetic-01', sourceId: 'source-synthetic-01', revision: 'rev-synthetic-4',
  title: 'Synthetic lesson fixture: rotating field',
  objective: 'Calculate the supplied synthetic speed and explain which passage supports the steps.',
  chapters: [
    { title: 'Synthetic fixture: speed relation', explanation: 'The synthetic source describes a relation between frequency, poles and speed.', example: 'For example, the supplied values are substituted into the stated relation before calculating the result.', citationIds: ['E1'] },
    { title: 'Synthetic fixture: source reading', explanation: 'The source says to check the stated units before comparing the result.', example: 'Explain this passage in your own words and connect it to your studies; check your explanation against the source.', citationIds: ['E2', 'E2'] },
  ],
  evidence: [
    { id: 'E1', quote: 'Synthetic source text: frequency and poles are used in the stated speed relation.', locator: 'Synthetic fixture page 1' },
    { id: 'E2', quote: 'Synthetic source text: check the stated units before comparing the result.', locator: 'Synthetic fixture page 2' },
  ],
  quiz: [
    { question: 'According to the source, which passage appears in the reviewed material?', options: ['Synthetic option A', 'Synthetic option B', 'Synthetic option C', 'Synthetic option D'], correct: 0, explanation: 'Synthetic fixture explanation only.', citationIds: ['E1'], supportQuote: 'frequency and poles are used in the stated speed relation' },
    { question: 'Calculate the supplied synthetic speed using the stated relation.', options: ['Synthetic 1', 'Synthetic 2', 'Synthetic 3', 'Synthetic 4'], correct: 2, explanation: 'Synthetic fixture explanation only.', citationIds: ['E1'], supportQuote: 'frequency and poles are used in the stated speed relation' },
    { question: 'Explain why you chose that step, and what would you verify next?', options: ['Synthetic response A', 'Synthetic response B', 'Synthetic response C', 'Synthetic response D'], correct: 0, explanation: 'Synthetic fixture explanation only.', citationIds: ['E2'], supportQuote: 'check the stated units before comparing the result' },
  ],
});
const reviewed = lesson => ({ sourceId: lesson.sourceId, revision: lesson.revision, reviewed: true });

test('builds source-linked sequence and labels quiz/example limits without inventing content', () => {
  const lesson = makeLesson(); const plan = buildLessonPlan(lesson, reviewed(lesson));
  assert.equal(plan.summary.sourceState, 'reviewed');
  assert.equal(plan.summary.questionCount, 3);
  assert.deepEqual(plan.steps.map(step => step.kind), ['read', 'worked-example', 'self-explain', 'read', 'self-explain', 'check', 'check', 'check', 'reflect']);
  assert.match(plan.steps.find(step => step.kind === 'worked-example').prompt, /supplied values/);
  assert.match(plan.steps.find(step => step.kind === 'check').title, /Source recognition/);
  assert.ok(plan.steps.some(step => step.title.includes('Calculation practice')));
  assert.ok(plan.steps.some(step => step.title.includes('Open reasoning wording')));
  assert.ok(plan.warnings.some(warning => /learner prompt, not a verified worked example/.test(warning)));
  assert.ok(plan.warnings.some(warning => /repeats a citation ID/.test(warning)));
  assert.ok(plan.steps.every(step => step.citationIds.every(id => ['E1', 'E2'].includes(id))));
  assert.match(plan.summary.notices.join(' '), /not proof of independent mastery/);
  assert.doesNotMatch(JSON.stringify(plan), /You have mastered|independently mastered|learning gain/i);
});

test('changed or unavailable source context blocks all start steps', () => {
  const lesson = makeLesson();
  const changed = buildLessonPlan(lesson, { ...reviewed(lesson), revision: 'rev-synthetic-old' });
  assert.equal(changed.summary.sourceState, 'changed'); assert.deepEqual(changed.steps, []); assert.equal(changed.summary.questionCount, 0);
  assert.equal(changed.summary.estimatedMinutes, null); assert.match(changed.summary.notices.join(' '), /source or revision changed/);
  assert.equal(buildLessonPlan(lesson, { ...reviewed(lesson), sourceId: 'other-source' }).summary.sourceState, 'changed');
  const unreviewed = buildLessonPlan(lesson, { ...reviewed(lesson), reviewed: false });
  assert.equal(unreviewed.summary.sourceState, 'unavailable'); assert.equal(unreviewed.summary.questionCount, 0);
  const missingContext = buildLessonPlan(lesson, null);
  assert.equal(missingContext.summary.sourceState, 'unavailable'); assert.equal(missingContext.summary.questionCount, 0);
});

test('citation IDs must resolve and supportQuote must exactly anchor cited evidence', () => {
  const lesson = makeLesson(); const badAnchor = structuredClone(lesson);
  badAnchor.quiz[0].supportQuote = 'not present in the synthetic evidence';
  assert.throws(() => validateLessonPlanInput(badAnchor), /not an exact anchor/);
  const unknown = structuredClone(lesson); unknown.chapters[0].citationIds = ['E404'];
  assert.throws(() => buildLessonPlan(unknown, reviewed(unknown)), /unknown evidence/);
  const malformed = structuredClone(lesson); malformed.revision = ' ';
  assert.throws(() => buildLessonPlan(malformed, reviewed(lesson)), /revision must be/);
});

test('vague objective and missing/long content yield actionable warnings', () => {
  const lesson = makeLesson(); lesson.objective = 'Understand this topic';
  lesson.chapters[0].explanation = ''; lesson.chapters[1].explanation = Array(310).fill('synthetic').join(' ');
  lesson.chapters[0].example = '';
  const plan = buildLessonPlan(lesson, reviewed(lesson));
  assert.ok(plan.warnings.some(warning => /observable/.test(warning)));
  assert.ok(plan.warnings.some(warning => /needs an explanation/.test(warning)));
  assert.ok(plan.warnings.some(warning => /split it into shorter/.test(warning)));
  assert.ok(plan.warnings.some(warning => /no example or learner action/.test(warning)));
  assert.equal(plan.steps.filter(step => step.kind === 'read').length, 1);
});

test('invalid choices are warned and omitted; bad source anchors fail closed', () => {
  const lesson = makeLesson(); const badChoices = structuredClone(lesson);
  badChoices.quiz[0].correct = 9; badChoices.quiz[0].options = ['only one'];
  const plan = buildLessonPlan(badChoices, reviewed(badChoices));
  assert.ok(plan.warnings.some(warning => /invalid choices/.test(warning)));
  assert.equal(plan.steps.filter(step => step.kind === 'check').length, 2);
  assert.equal(plan.summary.questionCount, 2);
  const badEvidence = structuredClone(lesson); badEvidence.evidence[0].locator = '';
  assert.throws(() => buildLessonPlan(badEvidence, reviewed(lesson)), /locator must be/);
});

test('adapter maps the actual workspace Lesson id, accepts lessonId-only input and preserves the original', () => {
  const source = makeLesson();
  const native = { ...source, id: source.lessonId, sourceTitle: 'Synthetic only', mode: 'local-extractive', model: null, createdAt: 'synthetic', coverage: 'Synthetic only', reviewWarning: 'Synthetic only' };
  delete native.lessonId;
  const before = JSON.stringify(native);
  const adapted = toLessonPlanInput(native);
  assert.equal(adapted.lessonId, native.id);
  assert.equal(adapted.sourceId, native.sourceId);
  assert.equal(adapted.revision, native.revision);
  assert.equal(adapted.evidence[0].quote, native.evidence[0].quote);
  assert.equal(JSON.stringify(native), before);
  const legacySubset = toLessonPlanInput(source);
  assert.equal(legacySubset.lessonId, source.lessonId);
});

test('adapter rejects conflicting, missing, empty, null and non-text identities', () => {
  const source = makeLesson();
  assert.throws(() => toLessonPlanInput({ ...source, id: 'different-id' }), /do not match/);
  for (const bad of [{ ...source, id: '' }, { ...source, id: null }, { ...source, id: 42 }, { ...source, lessonId: null }, { ...source, lessonId: '' }]) {
    assert.throws(() => toLessonPlanInput(bad), /id must be|lessonId must be/);
  }
  const withoutIds = { ...source }; delete withoutIds.lessonId;
  assert.throws(() => toLessonPlanInput(withoutIds), /include id or lessonId/);
});

test('unsupported quiz rows do not inflate the runnable check count', () => {
  const lesson = makeLesson();
  lesson.quiz[0].supportQuote = '';
  const plan = buildLessonPlan(lesson, reviewed(lesson));
  assert.equal(plan.steps.filter(step => step.kind === 'check').length, 2);
  assert.equal(plan.summary.questionCount, 2);
  assert.ok(plan.warnings.some(warning => /no exact supporting source anchor/.test(warning)));
});

test('missing anchors stay visible, estimates exclude practice, and frozen input is not mutated', () => {
  const lesson = makeLesson(); lesson.title = ''; lesson.objective = ''; lesson.chapters[0].citationIds = [];
  const noAnchor = buildLessonPlan(lesson, reviewed(lesson));
  assert.equal(noAnchor.summary.sourceState, 'reviewed');
  assert.ok(noAnchor.warnings.some(warning => /plain lesson title/.test(warning)));
  assert.ok(noAnchor.warnings.some(warning => /observable learner action/.test(warning)));
  assert.ok(noAnchor.warnings.some(warning => /no source anchor/.test(warning)));
  assert.equal(noAnchor.steps.some(step => step.kind === 'read' && step.title.includes('speed relation')), false);

  const valid = makeLesson();
  const frozen = Object.freeze({ ...valid, chapters: Object.freeze(valid.chapters.map(ch => Object.freeze({ ...ch, citationIds: Object.freeze([...ch.citationIds]) }))), evidence: Object.freeze(valid.evidence.map(e => Object.freeze({ ...e }))), quiz: Object.freeze(valid.quiz.map(q => Object.freeze({ ...q, options: Object.freeze([...q.options]), citationIds: Object.freeze([...q.citationIds]) }))) });
  const before = JSON.stringify(frozen); const result = buildLessonPlan(frozen, Object.freeze(reviewed(valid)));
  assert.equal(JSON.stringify(frozen), before);
  assert.match(result.summary.estimateBasis, /200 words per minute/);
  assert.match(result.summary.estimateBasis, /excludes examples, questions, practice and setup time/);
  assert.ok(Number.isSafeInteger(result.summary.estimatedMinutes));
  assert.equal(result.summary.saving, 'unavailable'); assert.equal(result.summary.savedStep, null);
  assert.equal(result.summary.capability, 'source-reading');
});
