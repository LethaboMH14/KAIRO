import test from 'node:test';
import assert from 'node:assert/strict';
import { loadingProfile, preparePortfolioExport, readProgressSnapshot } from '../src/profile/recovery.ts';

const profile = { version: 1, lessons: [], cases: [] };

test('progress starts in a distinct loading state, not an empty-history success', () => {
  assert.deepEqual(loadingProfile, { status: 'loading' });
});

test('unreadable profile is a failure state with no synthetic profile to render or save', () => {
  const storage = { raw: '{bad saved data' };
  const before = storage.raw;
  const state = readProgressSnapshot(() => JSON.parse(storage.raw));
  assert.deepEqual(state, { status: 'unreadable' });
  assert.equal(storage.raw, before);
  assert.equal('profile' in state, false);
});

test('portfolio export rereads current state and never calls the serializer after a read failure', () => {
  let serialized = false;
  const unavailable = preparePortfolioExport(() => { throw new Error('storage denied'); }, () => { serialized = true; return 'empty portfolio'; });
  assert.deepEqual(unavailable, { status: 'unreadable' });
  assert.equal(serialized, false);

  const current = { version: 1, lessons: [{ lessonId: 'fresh', attempts: [] }], cases: [] };
  const prepared = preparePortfolioExport(() => current, value => JSON.stringify(value));
  assert.equal(prepared.status, 'ready');
  assert.equal(prepared.profile, current);
  assert.deepEqual(JSON.parse(prepared.markdown), current);

  const serializerFailure = preparePortfolioExport(() => current, () => { throw new Error('serialization failed'); });
  assert.equal(serializerFailure.status, 'failed');
  assert.equal(serializerFailure.profile, current);
});
