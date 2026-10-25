import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyProfile, parseProfile, parseProfileStrict, projectProfileForWrite,
  PROFILE_KEY, readProfile, writeProfile,
} from '../src/profile/model.ts';

function lesson(overrides = {}) {
  return { lessonId: 'lesson-1', title: 'A lesson', topic: 'Other', format: 'example', questions: 2, attempts: [{ question: 0, correct: true, at: '2026-10-22T08:00:00Z' }], updatedAt: '2026-10-22T08:00:00Z', ...overrides };
}

function caseRecord(overrides = {}) {
  return { id: 'case-1', lessonId: null, title: 'A case', version: 'scenario-1', events: [{ kind: 'inspect', value: 'record', at: '2026-10-22T08:00:00Z' }], completedAt: null, reflection: '', ...overrides };
}

function withStorage(t, initial = null, { quota = false } = {}) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const state = { raw: initial, writes: 0 };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key) { assert.equal(key, PROFILE_KEY); return state.raw; },
    setItem(key, value) { assert.equal(key, PROFILE_KEY); state.writes++; if (quota) throw new Error('quota exceeded'); state.raw = value; },
  } });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'localStorage', original); else delete globalThis.localStorage; });
  return state;
}

test('strict read refuses one invalid row instead of silently losing it; legacy parser remains tolerant', () => {
  const value = { version: 1, lessons: [lesson(), lesson({ lessonId: 'bad', title: 'x'.repeat(201) })], cases: [] };
  const raw = JSON.stringify(value);
  assert.equal(parseProfile(raw).lessons.length, 1);
  assert.throws(() => parseProfileStrict(raw), /malformed|limits/);
});

test('strict read refuses nested attempts or events that legacy parsing would truncate', () => {
  const tooManyAttempts = lesson({ attempts: Array.from({ length: 101 }, (_, question) => ({ question: question % 2, correct: true, at: 'time' })) });
  assert.throws(() => parseProfileStrict(JSON.stringify({ version: 1, lessons: [tooManyAttempts], cases: [] })), /malformed|limits/);
  const tooManyEvents = caseRecord({ events: Array.from({ length: 201 }, () => ({ kind: 'inspect', value: '', at: 'time' })) });
  assert.throws(() => parseProfileStrict(JSON.stringify({ version: 1, lessons: [], cases: [tooManyEvents] })), /malformed|limits/);
});

test('strict read rejects duplicate stable IDs and empty IDs', () => {
  assert.throws(() => parseProfileStrict(JSON.stringify({ version: 1, lessons: [lesson(), lesson()], cases: [] })), /malformed|limits/);
  assert.throws(() => parseProfileStrict(JSON.stringify({ version: 1, lessons: [], cases: [caseRecord(), caseRecord()] })), /malformed|limits/);
  assert.throws(() => parseProfileStrict(JSON.stringify({ version: 1, lessons: [lesson({ lessonId: '  ' })], cases: [] })), /malformed|limits/);
});

test('strict projection rejects boxed or coercible format values', () => {
  for (const format of [new String('example'), { toString: () => 'example' }]) {
    assert.throws(() => projectProfileForWrite({ version: 1, lessons: [lesson({ format })], cases: [] }), /malformed|limits/);
  }
});

test('strict projection rejects sparse collections at every history level', t => {
  const original = JSON.stringify({ version: 1, lessons: [], cases: [] });
  const storage = withStorage(t, original);
  const sparseLessons = Array(1);
  const sparseCases = Array(1);
  const sparseAttempts = Array(1);
  const sparseEvents = Array(1);
  assert.throws(() => projectProfileForWrite({ version: 1, lessons: sparseLessons, cases: [] }), /malformed|limits/);
  assert.throws(() => projectProfileForWrite({ version: 1, lessons: [], cases: sparseCases }), /malformed|limits/);
  assert.throws(() => projectProfileForWrite({ version: 1, lessons: [lesson({ attempts: sparseAttempts })], cases: [] }), /malformed|limits/);
  assert.throws(() => projectProfileForWrite({ version: 1, lessons: [], cases: [caseRecord({ events: sparseEvents })] }), /malformed|limits/);
  assert.throws(() => writeProfile({ version: 1, lessons: [lesson({ attempts: sparseAttempts })], cases: [] }), /malformed|limits/);
  assert.equal(storage.writes, 0);
  assert.equal(storage.raw, original);
});

test('strict read rejects malformed, empty, unsupported, and oversized stored envelopes', () => {
  assert.deepEqual(parseProfileStrict(null), emptyProfile());
  assert.throws(() => parseProfileStrict(''), /malformed|limits/);
  assert.throws(() => parseProfileStrict('{not json'), /malformed|limits/);
  assert.throws(() => parseProfileStrict(JSON.stringify({ version: 2, lessons: [], cases: [] })), /malformed|limits/);
  assert.throws(() => parseProfileStrict(' '.repeat(1_000_001)), /malformed|limits/);
});

test('valid profile round-trips through storage and writes project only documented fields', t => {
  withStorage(t);
  const input = { version: 1, lessons: [{ ...lesson(), internalExtra: 'discard' }], cases: [{ ...caseRecord(), internalExtra: 'discard' }], internalExtra: true };
  const projected = projectProfileForWrite(input);
  assert.equal(projected.lessons[0].lessonId, 'lesson-1');
  assert.equal('internalExtra' in projected, false);
  assert.equal('internalExtra' in projected.lessons[0], false);
  assert.equal('internalExtra' in projected.cases[0], false);
  const roundTrip = parseProfileStrict(JSON.stringify(projected));
  assert.deepEqual(roundTrip, projected);
  writeProfile(input);
  assert.deepEqual(readProfile(), projected);
});

test('read and validation refusal leave original bytes untouched and issue no write', t => {
  const raw = JSON.stringify({ version: 1, lessons: [lesson(), lesson()], cases: [] });
  const storage = withStorage(t, raw);
  assert.throws(() => readProfile(), /malformed|limits/);
  assert.throws(() => writeProfile({ version: 1, lessons: [lesson(), lesson()], cases: [] }), /malformed|limits/);
  assert.equal(storage.writes, 0);
  assert.equal(storage.raw, raw);
});

test('storage quota failure preserves existing value', t => {
  const raw = JSON.stringify({ version: 1, lessons: [], cases: [] });
  const storage = withStorage(t, raw, { quota: true });
  assert.throws(() => writeProfile({ version: 1, lessons: [lesson()], cases: [] }), /quota exceeded/);
  assert.equal(storage.writes, 1);
  assert.equal(storage.raw, raw);
});
