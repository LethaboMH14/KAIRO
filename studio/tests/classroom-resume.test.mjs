import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeResume, readResume, resumeKey, writeResume } from '../src/classroom-resume/model.ts';

const lesson = { id: '0123456789abcdef01234567', sourceId: 'abcdef0123456789abcdef01', revision: 'review-r7', chapters: ['one', 'two', 'three'] };
const key = resumeKey(lesson.id);
const valid = (overrides = {}) => JSON.stringify({ schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId, revision: lesson.revision, step: 1, reading: false, ...overrides });
class MemoryStorage {
  records = new Map();
  getItem(k) { return this.records.get(k) ?? null; }
  setItem(k, v) { this.records.set(k, v); }
}

test('key is namespaced and accepts only 24 lowercase hexadecimal lesson IDs', () => {
  assert.equal(key, `kairo-rain-resume-v1:${lesson.id}`);
  for (const id of ['../private', '0123456789ABCDEF01234567', '123', '0123456789abcdef0123456g']) assert.throws(() => resumeKey(id), /lesson ID/);
});

test('missing record yields a fresh readable default without writing', () => {
  const storage = new MemoryStorage();
  const first = readResume(storage, lesson), second = readResume(storage, lesson);
  assert.deepEqual(first, { state: { step: 0, reading: true }, status: 'empty', canWrite: true, message: '' });
  assert.notEqual(first.state, second.state);
  assert.equal(storage.records.size, 0);
});

test('decode restores exact cursor and reading preference as a fresh state', () => {
  const raw = valid();
  const first = decodeResume(raw, lesson), second = decodeResume(raw, lesson);
  assert.deepEqual(first, { state: { step: 1, reading: false }, status: 'restored', canWrite: true, message: '' });
  assert.notEqual(first.state, second.state);
  assert.equal(raw, valid());
});

test('changed source or revision is stale and leaves saved data intact', () => {
  for (const record of [valid({ sourceId: '111111111111111111111111' }), valid({ revision: 'review-r6' })]) {
    const decoded = decodeResume(record, lesson);
    assert.equal(decoded.status, 'stale');
    assert.equal(decoded.canWrite, false);
    assert.match(decoded.message, /source has changed.*left unchanged/);
    const storage = new MemoryStorage(); storage.setItem(key, record);
    assert.equal(writeResume(storage, lesson, { step: 2, reading: true }, decoded).saved, false);
    assert.equal(storage.getItem(key), record);
  }
});

test('malformed, unsupported, wrong-lesson, oversized and non-envelope records are protected', () => {
  const bad = [
    '{', 'null', '[]', valid({ schemaVersion: 2 }), valid({ lessonId: '111111111111111111111111' }),
    valid({ extra: true }), JSON.stringify({ schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId, revision: lesson.revision, step: 1 }),
    'x'.repeat(4097),
  ];
  for (const raw of bad) {
    const decoded = decodeResume(raw, lesson);
    assert.equal(decoded.status, 'invalid', raw.slice(0, 30));
    assert.equal(decoded.canWrite, false);
    assert.match(decoded.message, /could not be read.*left unchanged/);
  }
});

test('invalid cursor and reading values are rejected without repairing the record', () => {
  for (const step of [-1, 0.5, 3, Number.NaN, Number.POSITIVE_INFINITY]) {
    const raw = JSON.stringify({ schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId, revision: lesson.revision, step, reading: true });
    assert.equal(decodeResume(raw, lesson).status, 'invalid');
  }
  assert.equal(decodeResume(valid({ reading: 'true' }), lesson).status, 'invalid');
});

test('caller lesson context is validated before storage access', () => {
  let calls = 0;
  const storage = { getItem() { calls++; return null; }, setItem() { calls++; } };
  for (const bad of [
    { ...lesson, id: 'bad' }, { ...lesson, sourceId: 'BAD' }, { ...lesson, revision: '' },
    { ...lesson, revision: 'x'.repeat(129) }, { ...lesson, chapters: [] },
  ]) {
    assert.throws(() => readResume(storage, bad));
    assert.throws(() => decodeResume(null, bad));
  }
  assert.equal(calls, 0);
});

test('Unicode revisions round trip at the limit and over-limit input is invalid', () => {
  const unicodeLesson = { ...lesson, revision: 'é'.repeat(128) };
  const raw = JSON.stringify({ schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId, revision: unicodeLesson.revision, step: 0, reading: true });
  assert.equal(decodeResume(raw, unicodeLesson).status, 'restored');
  assert.throws(() => decodeResume(null, { ...unicodeLesson, revision: 'é'.repeat(129) }), /1 to 128/);
});

test('storage access failures are plain and never mutate prior saved data', () => {
  const readFailure = readResume({ getItem() { throw new Error('private implementation detail'); }, setItem() {} }, lesson);
  assert.equal(readFailure.status, 'unavailable');
  assert.match(readFailure.message, /device could not open/);
  assert.doesNotMatch(readFailure.message, /private implementation/);

  const existing = valid();
  const storage = { getItem() { return existing; }, setItem() { throw new Error('quota'); } };
  const outcome = writeResume(storage, lesson, { step: 2, reading: true }, decodeResume(existing, lesson));
  assert.equal(outcome.saved, false);
  assert.match(outcome.message, /could not save/);
  assert.equal(existing, valid());
});

test('refuses denied permission and corrupt existing record without overwriting', () => {
  const storage = new MemoryStorage();
  storage.setItem(key, '{broken');
  const before = storage.getItem(key);
  const blocked = decodeResume(before, lesson);
  assert.equal(writeResume(storage, lesson, { step: 1, reading: false }, blocked).saved, false);
  assert.equal(storage.getItem(key), before);
  assert.equal(writeResume(storage, lesson, { step: 1, reading: false }, { ...blocked, status: 'empty', canWrite: false }).saved, false);
  assert.equal(storage.getItem(key), before);
});

test('semantic re-read detects another tab cursor change before saving', () => {
  const storage = new MemoryStorage(); storage.setItem(key, valid());
  const permission = readResume(storage, lesson);
  storage.setItem(key, valid({ step: 2 }));
  const before = storage.getItem(key);
  const saved = writeResume(storage, lesson, { step: 0, reading: true }, permission);
  assert.equal(saved.saved, false);
  assert.match(saved.message, /changed elsewhere/);
  assert.equal(storage.getItem(key), before);
});

test('round trip saves only the exact envelope with no source or learner content', () => {
  const storage = new MemoryStorage();
  const permission = readResume(storage, lesson);
  const outcome = writeResume(storage, lesson, { step: 2, reading: false }, permission);
  assert.deepEqual(outcome, { saved: true, message: 'Your place was saved on this device.' });
  const raw = storage.getItem(key);
  const parsed = JSON.parse(raw);
  assert.deepEqual(Object.keys(parsed).sort(), ['lessonId', 'reading', 'revision', 'schemaVersion', 'sourceId', 'step']);
  assert.deepEqual(decodeResume(raw, lesson).state, { step: 2, reading: false });
  for (const sensitive of ['chapter text', 'question text', 'note text', 'transcript', 'citation quote', 'audio', 'consent', 'ability']) assert.equal(raw.includes(sensitive), false);
});

test('invalid new cursor and read failures return false without attempting a write', () => {
  const storage = new MemoryStorage();
  const permission = readResume(storage, lesson);
  for (const state of [{ step: -1, reading: true }, { step: 1.2, reading: true }, { step: 3, reading: true }, { step: 0, reading: 1 }]) {
    assert.equal(writeResume(storage, lesson, state, permission).saved, false);
  }
  const failing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('must not write'); } };
  assert.equal(writeResume(failing, lesson, { step: 0, reading: true }, permission).saved, false);
});
