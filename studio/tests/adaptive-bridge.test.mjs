import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdaptiveObservations } from '../src/adaptive-bridge/adapter.ts';
import { recommendPractice } from '../src/adaptive/policy.ts';

const lesson = { lessonId: 'lesson-immutable-1', sourceRevision: 'source-rev-a', questionCount: 2, reviewStatus: 'reviewed' };
const taskDescriptors = [
  { questionIndex: 0, conceptId: 'stock-count', taskId: 'stock-question-a', sourceRevision: 'source-rev-a', taskRevision: 'task-rev-a', rubricRevision: 'rubric-a', contextKey: 'shop-context-a', optionCount: 4, expectedChoice: 2, reviewStatus: 'reviewed', reviewerId: 'educator-1', reviewedAt: '2026-10-20T09:00:00Z' },
  { questionIndex: 1, conceptId: 'stock-count', taskId: 'stock-question-b', sourceRevision: 'source-rev-a', taskRevision: 'task-rev-a', rubricRevision: 'rubric-a', contextKey: 'shop-context-a', optionCount: 3, expectedChoice: 0, reviewStatus: 'reviewed', reviewerId: 'educator-1', reviewedAt: '2026-10-20T09:00:00Z' },
];
const at = '2026-10-22T09:00:00Z';
function input(attempts, overrides = {}) {
  return { attemptsLessonId: lesson.lessonId, lesson, taskDescriptors, attempts, ...overrides };
}

test('maps stored choice against explicit reviewed answer and leaves absent help unknown', () => {
  const result = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, at }]));
  assert.equal(result.recommendationReady, true);
  assert.equal(result.observations.length, 1);
  assert.deepEqual(result.rejections, []);
  assert.equal(result.observations[0].correct, true);
  assert.equal(result.observations[0].helpExposure, 'unknown');
  assert.equal(result.observations[0].assessmentKind, 'practice');
  assert.equal(result.observations[0].gradeProvenance, 'reviewed-answer-key');
  assert.equal(result.observations[0].revisionProvenance, 'caller-asserted-lesson-binding');
  const recommendation = recommendPractice(result.observations, {
    conceptId: 'stock-count', revisions: { source: 'source-rev-a', task: 'task-rev-a', rubric: 'rubric-a' }, now: '2026-10-23T09:00:00Z',
  });
  assert.equal(recommendation.action, 'faded-hints-changed-context-independent-task');
});

test('derives an incorrect answer and rejects a conflicting stored grade', () => {
  const wrong = buildAdaptiveObservations(input([{ question: 0, choice: 1, correct: false, at }]));
  assert.equal(wrong.observations[0].correct, false);
  const conflict = buildAdaptiveObservations(input([{ question: 0, choice: 1, correct: true, at }]));
  assert.equal(conflict.recommendationReady, false);
  assert.deepEqual(conflict.observations, []);
  assert.equal(conflict.rejections[0].code, 'stored-grade-conflict');
});

test('a missing choice keeps the device grade explicitly unassessed and emits no policy observation', () => {
  const result = buildAdaptiveObservations(input([{ question: 0, correct: true, helpExposure: 'none', at }]));
  assert.equal(result.recommendationReady, false);
  assert.deepEqual(result.observations, []);
  assert.equal(result.unassessed.length, 1);
  assert.equal(result.unassessed[0].recordedGrade, true);
  assert.equal(result.unassessed[0].gradeProvenance, 'device-recorded-unverified');
  assert.match(result.unassessed[0].reason, /not emitted as adaptive evidence/);
});

test('unknown help is retained and no recall or transfer is synthesized from practice attempts', () => {
  const result = buildAdaptiveObservations(input([
    { question: 0, choice: 2, correct: true, at },
    { question: 0, choice: 1, correct: false, at: '2026-10-22T09:01:00Z' },
  ]));
  assert.deepEqual(result.observations.map(row => row.assessmentKind), ['practice', 'practice']);
  assert.deepEqual(result.observations.map(row => row.helpExposure), ['unknown', 'unknown']);
});

test('caller lesson binding and source revision must match explicit reviewed descriptors', () => {
  const wrongBinding = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, at }], { attemptsLessonId: 'other-lesson' }));
  assert.equal(wrongBinding.recommendationReady, false);
  assert.equal(wrongBinding.observations.length, 0);
  assert.ok(wrongBinding.rejections.some(item => item.code === 'lesson-binding-invalid'));
  const staleTask = { ...taskDescriptors[0], sourceRevision: 'source-old' };
  const stale = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, at }], { taskDescriptors: [staleTask] }));
  assert.equal(stale.observations.length, 0);
  assert.ok(stale.rejections.some(item => item.code === 'task-descriptors-invalid'));
});

test('unreviewed, missing and duplicated question descriptors keep the whole batch unassessed', () => {
  const unreviewed = [{ ...taskDescriptors[0], reviewStatus: 'draft' }];
  for (const descriptors of [unreviewed, [], [taskDescriptors[0], taskDescriptors[0]]]) {
    const result = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, at }], { taskDescriptors: descriptors }));
    assert.equal(result.recommendationReady, false);
    assert.deepEqual(result.observations, []);
  }
  const missing = buildAdaptiveObservations(input([{ question: 1, choice: 0, correct: true, at }], { taskDescriptors: [taskDescriptors[0]] }));
  assert.ok(missing.rejections.some(item => item.code === 'task-descriptor-missing'));
});

test('task IDs must be unique across question bindings', () => {
  const duplicatedTaskId = [taskDescriptors[0], { ...taskDescriptors[1], taskId: taskDescriptors[0].taskId }];
  const result = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, at }], { taskDescriptors: duplicatedTaskId }));
  assert.deepEqual(result.observations, []);
  assert.ok(result.rejections.some(item => item.code === 'duplicate-task-id'));
});

test('identical no-ID rows are quarantined instead of becoming separate retries', () => {
  const row = { question: 0, choice: 2, correct: true, at };
  const result = buildAdaptiveObservations(input([row, { ...row }]));
  assert.equal(result.recommendationReady, false);
  assert.deepEqual(result.observations, []);
  assert.deepEqual(result.rejections.filter(item => item.code === 'duplicate-generated-attempt').map(item => item.attemptIndex), [0, 1]);
});

test('event IDs are deterministic, and equal timestamps with different choices remain distinct events', () => {
  const rows = [{ question: 0, choice: 2, correct: true, at }, { question: 0, choice: 1, correct: false, at }];
  const first = buildAdaptiveObservations(input(rows));
  const second = buildAdaptiveObservations(input(rows));
  assert.equal(first.recommendationReady, true);
  assert.deepEqual(first.observations.map(row => row.eventId), second.observations.map(row => row.eventId));
  assert.notEqual(first.observations[0].eventId, first.observations[1].eventId);
});

test('duplicate explicit IDs and invalid or impossible timestamps fail closed', () => {
  const duplicatedIds = buildAdaptiveObservations(input([
    { eventId: 'same-id', question: 0, choice: 2, correct: true, at },
    { eventId: 'same-id', question: 0, choice: 1, correct: false, at: '2026-10-22T09:01:00Z' },
  ]));
  assert.deepEqual(duplicatedIds.observations, []);
  assert.equal(duplicatedIds.rejections.filter(item => item.code === 'event-id-collision').length, 2);
  const impossible = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, at: '2026-02-30T09:00:00Z' }]));
  assert.ok(impossible.rejections.some(item => item.code === 'timestamp-invalid'));
  assert.deepEqual(impossible.observations, []);
});

test('malformed choices, help flags, out-of-order attempts, and empty batches remain unassessed', () => {
  const invalidChoice = buildAdaptiveObservations(input([{ question: 0, choice: 5, correct: true, at }]));
  assert.ok(invalidChoice.rejections.some(item => item.code === 'choice-invalid'));
  const invalidHelp = buildAdaptiveObservations(input([{ question: 0, choice: 2, correct: true, helpExposure: { toString: () => 'none' }, at }]));
  assert.ok(invalidHelp.rejections.some(item => item.code === 'help-exposure-invalid'));
  const reversed = buildAdaptiveObservations(input([
    { question: 0, choice: 2, correct: true, at: '2026-10-22T09:02:00Z' },
    { question: 0, choice: 1, correct: false, at: '2026-10-22T09:01:00Z' },
  ]));
  assert.ok(reversed.rejections.some(item => item.code === 'timestamp-out-of-order'));
  assert.deepEqual(reversed.observations, []);
  assert.ok(buildAdaptiveObservations(input([])).rejections.some(item => item.code === 'no-attempts'));
});
