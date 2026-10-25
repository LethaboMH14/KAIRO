import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendPractice, ADAPTIVE_POLICY_VERSION } from '../src/adaptive/policy.ts';

const current = { conceptId: 'stock-variance', revisions: { source: 'src-2', task: 'task-3', rubric: 'rubric-1' }, now: '2026-10-22T12:00:00Z' };
function observation(eventId, patch = {}) {
  return {
    eventId, conceptId: 'stock-variance', taskId: `task-${eventId}`,
    sourceRevision: 'src-2', taskRevision: 'task-3', rubricRevision: 'rubric-1',
    occurredAt: '2026-10-20T12:00:00Z', correct: true, helpExposure: 'none',
    contextKey: `context-${eventId}`, assessmentKind: 'practice', ...patch,
  };
}

test('empty or unrelated evidence returns insufficient data without treating clicks as ability', () => {
  const result = recommendPractice([observation('other', { conceptId: 'other-topic' })], current);
  assert.equal(result.action, 'insufficient-data');
  assert.equal(result.ignoredOtherConceptCount, 1);
  assert.deepEqual(result.evidenceIds, []);
  assert.equal(result.policyVersion, ADAPTIVE_POLICY_VERSION);
  assert.match(result.limitations.join(' '), /not an estimate of ability/);
});

test('incorrect first attempt remains visible after a helped retry and support is faded', () => {
  const first = observation('wrong-first', { correct: false, taskId: 'worked-task', contextKey: 'same' });
  const helped = observation('helped-retry', { taskId: 'worked-task', contextKey: 'same', occurredAt: '2026-10-20T12:05:00Z', helpExposure: 'hint' });
  const result = recommendPractice([first, helped], current);
  assert.equal(result.action, 'faded-hints-changed-context-independent-task');
  assert.equal(result.firstAttempt?.eventId, 'wrong-first');
  assert.equal(result.firstAttempt?.correct, false);
  assert.deepEqual(result.evidenceIds, ['wrong-first', 'helped-retry']);
  assert.equal(result.attempts.length, 2);
});

test('a retry that is still incorrect recommends source or worked-example review', () => {
  const rows = [observation('wrong', { correct: false }), observation('wrong-again', { correct: false, occurredAt: '2026-10-20T12:05:00Z' })];
  const result = recommendPractice(rows, current);
  assert.equal(result.action, 'review-source-worked-example');
  assert.equal(result.firstAttempt?.correct, false);
});

test('independent success points to later recall; delayed independent recall points to changed-context transfer', () => {
  const practice = observation('independent', { taskId: 'practice-1', contextKey: 'shop-a' });
  const next = recommendPractice([practice], current);
  assert.equal(next.action, 'delayed-independent-recall');
  const recall = observation('recall', { taskId: 'recall-1', contextKey: 'shop-a', assessmentKind: 'recall', occurredAt: '2026-10-21T12:00:00Z' });
  const transferred = recommendPractice([practice, recall], current);
  assert.equal(transferred.action, 'changed-context-transfer');
  assert.match(transferred.reason, /later independent recall/);
});

test('same task cannot count as delayed recall and thus cannot unlock transfer', () => {
  const practice = observation('first', { taskId: 'same-task', contextKey: 'shop-a' });
  const repeat = observation('repeat', { taskId: 'same-task', contextKey: 'shop-b', assessmentKind: 'recall', occurredAt: '2026-10-21T12:00:00Z' });
  const result = recommendPractice([practice, repeat], current);
  assert.equal(result.action, 'delayed-independent-recall');
  assert.match(result.reason, /distinct-task checks/);
});

test('helped success and unknown help exposure never count as independent', () => {
  for (const helpExposure of ['hint', 'worked-example', 'unknown']) {
    const result = recommendPractice([observation(`help-${helpExposure}`, { helpExposure })], current);
    assert.equal(result.action, 'faded-hints-changed-context-independent-task');
  }
});

test('malformed, missing, future, reversed, duplicate, and invalid-delay input fails conservatively with counts', () => {
  const malformed = observation('bad-date', { occurredAt: 'yesterday' });
  const missing = { ...observation('missing'), taskRevision: '' };
  const future = observation('future', { occurredAt: '2026-10-23T00:00:00Z' });
  const early = observation('later-first', { occurredAt: '2026-10-20T12:00:00Z' });
  const reversed = observation('earlier-second', { occurredAt: '2026-10-20T11:00:00Z' });
  const result = recommendPractice([malformed, missing, future, early, reversed], current);
  assert.equal(result.action, 'insufficient-data');
  assert.equal(result.rejectedCount, 4);
  assert.deepEqual(result.rejectedEventIds, ['bad-date', 'missing', 'future', 'earlier-second']);
  assert.deepEqual(result.evidenceIds, ['later-first']);
  assert.equal(recommendPractice([observation('valid')], { ...current, minimumRecallDelayMs: -1 }).action, 'insufficient-data');
});

test('timestamps reject calendar rollovers and invalid clock or offset components', () => {
  const invalidDates = [
    '2026-02-30T12:00:00Z', '2025-02-29T12:00:00Z', '2026-04-31T12:00:00Z',
    '2026-13-01T12:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T12:60:00Z',
    '2026-01-01T12:00:60Z', '2026-01-01T12:00:00+24:00', '2026-01-01T12:00:00+02:60',
  ];
  for (const [i, occurredAt] of invalidDates.entries()) {
    const result = recommendPractice([observation(`calendar-${i}`, { occurredAt })], current);
    assert.equal(result.action, 'insufficient-data', occurredAt);
    assert.equal(result.rejectedCount, 1, occurredAt);
  }
});

test('Gregorian leap day is accepted only in leap years', () => {
  const leapRequest = { ...current, now: '2024-03-01T00:00:00Z' };
  const valid = recommendPractice([observation('leap-day', { occurredAt: '2024-02-29T12:00:00Z' })], leapRequest);
  assert.equal(valid.action, 'delayed-independent-recall');
  assert.equal(valid.rejectedCount, 0);
  const invalid = recommendPractice([observation('non-leap-day', { occurredAt: '2023-02-29T12:00:00Z' })], { ...current, now: '2023-03-01T00:00:00Z' });
  assert.equal(invalid.action, 'insufficient-data');
  assert.equal(invalid.rejectedCount, 1);
});

test('request time and learner-choice time use strict calendar validation', () => {
  const badNow = recommendPractice([observation('valid-row')], { ...current, now: '2026-02-30T12:00:00Z' });
  assert.equal(badNow.action, 'insufficient-data');
  assert.match(badNow.reason, /invalid current time/);
  const badChoice = recommendPractice([observation('valid-row')], {
    ...current, learnerChoice: { action: 'changed-context-transfer', selectedAt: '2026-02-30T12:00:00Z' },
  });
  assert.equal(badChoice.action, 'delayed-independent-recall');
  assert.equal(badChoice.learnerChoice, null);
  assert.equal(badChoice.learnerChoiceRejected, true);
});

test('enum fields and learner actions reject coercible objects and boxed strings', () => {
  const coercible = { toString: () => 'none' };
  for (const [i, patch] of [
    { helpExposure: coercible }, { helpExposure: new String('none') },
    { assessmentKind: { toString: () => 'practice' } }, { assessmentKind: ['practice'] },
  ].entries()) {
    const result = recommendPractice([observation(`enum-${i}`, patch)], current);
    assert.equal(result.action, 'insufficient-data');
    assert.equal(result.rejectedCount, 1);
  }
  const badChoice = recommendPractice([observation('valid-row')], {
    ...current, learnerChoice: { action: { toString: () => 'changed-context-transfer' }, selectedAt: current.now },
  });
  assert.equal(badChoice.action, 'delayed-independent-recall');
  assert.equal(badChoice.learnerChoice, null);
  assert.equal(badChoice.learnerChoiceRejected, true);
});

test('revision mismatches remain excluded and cannot combine with current evidence', () => {
  const old = observation('old', { sourceRevision: 'src-1' });
  const result = recommendPractice([old], current);
  assert.equal(result.action, 'insufficient-data');
  assert.equal(result.excludedRevisionCount, 1);
  assert.deepEqual(result.evidenceIds, []);
});

test('learner choice is reported separately and never changes policy action or evidence', () => {
  const rows = [observation('helped', { helpExposure: 'hint' })];
  const baseline = recommendPractice(rows, current);
  const chosen = recommendPractice(rows, { ...current, learnerChoice: { action: 'review-source-worked-example', selectedAt: current.now } });
  assert.equal(chosen.action, baseline.action);
  assert.deepEqual(chosen.evidenceIds, baseline.evidenceIds);
  assert.deepEqual(chosen.learnerChoice, { action: 'review-source-worked-example', selectedAt: current.now });
  assert.equal(chosen.learnerChoiceRejected, false);
  const invalid = recommendPractice(rows, { ...current, learnerChoice: { action: 'changed-context-transfer', selectedAt: '2026-10-23T00:00:00Z' } });
  assert.equal(invalid.action, baseline.action);
  assert.equal(invalid.learnerChoice, null);
  assert.equal(invalid.learnerChoiceRejected, true);
});
