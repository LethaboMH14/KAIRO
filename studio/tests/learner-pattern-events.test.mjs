import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEARNER_PATTERN_EVENT_SCHEMA_VERSION,
  validateLearnerPatternEvent,
  validateLearnerPatternEvents,
} from '../src/learner-pattern-events/index.ts';

function event(patch = {}) {
  return {
    schemaVersion: 1,
    eventId: 'evt-001', lessonId: 'lesson-01', sourceRevision: 'src-r4',
    conceptId: 'motor-speed', taskId: 'task-01', taskRevision: 'task-r2',
    rubricRevision: 'rubric-r1', occurredAt: '2026-10-25T10:15:30Z',
    correct: true, helpExposure: 'none', contextKey: 'ctx-03',
    assessmentKind: 'practice', ...patch,
  };
}

test('accepts exact versioned minimized contract and returns an independent allowlisted copy', () => {
  const input = event();
  const result = validateLearnerPatternEvent(input);
  assert.equal(LEARNER_PATTERN_EVENT_SCHEMA_VERSION, 1);
  assert.equal(result.ok, true);
  assert.deepEqual(result.event, input);
  assert.notEqual(result.event, input);
  assert.deepEqual(Object.keys(result.event), Object.keys(input));
  assert.equal(Object.hasOwn(result.event, 'learnerId'), false);
  assert.equal(Object.hasOwn(result.event, 'answerText'), false);
});

test('unknown help exposure is explicit missingness; absent required fields fail closed', () => {
  assert.equal(validateLearnerPatternEvent(event({ helpExposure: 'unknown' })).ok, true);
  const missing = event();
  delete missing.helpExposure;
  const rejected = validateLearnerPatternEvent(missing);
  assert.equal(rejected.ok, false);
  assert.ok(rejected.errors.some((error) => error.includes('missing field: helpExposure')));
  assert.ok(rejected.errors.some((error) => error.includes('helpExposure is invalid')));
});

test('rejects extra learner/profile/free-text fields instead of silently retaining them', () => {
  for (const field of ['learnerId', 'email', 'rawAnswer', 'studentName', 'profile']) {
    const result = validateLearnerPatternEvent({ ...event(), [field]: 'synthetic test value' });
    assert.equal(result.ok, false, field);
    assert.ok(result.errors.some((error) => error.includes(`unexpected field: ${field}`)));
  }
});

test('rejects malformed identifiers, timestamps, booleans, enums, and unsupported schema versions', () => {
  const invalids = [
    event({ schemaVersion: 2 }), event({ conceptId: 'contains free text!' }),
    event({ contextKey: 'learner@example.test' }), event({ occurredAt: '2026-02-30T10:15:30Z' }),
    event({ correct: 'true' }), event({ helpExposure: 'answer' }), event({ assessmentKind: 'exam' }),
  ];
  for (const input of invalids) assert.equal(validateLearnerPatternEvent(input).ok, false);
});

test('batch validator rejects duplicate IDs and bounds work without mutating input', () => {
  const first = event();
  const second = event({ lessonId: 'lesson-02' });
  const input = [first, second];
  const before = structuredClone(input);
  const result = validateLearnerPatternEvents(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('duplicate eventId')));
  assert.deepEqual(input, before);
  assert.equal(validateLearnerPatternEvents(Array(501).fill(event())).ok, false);
});

test('full event batch accepts distinct event identities and returns clean rows', () => {
  const result = validateLearnerPatternEvents([event(), event({ eventId: 'evt-002', correct: false })]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.events.map((row) => row.eventId), ['evt-001', 'evt-002']);
});
