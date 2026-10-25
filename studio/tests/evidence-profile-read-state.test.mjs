import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, parseProfileStrict } from '../src/profile/model.ts';
import { loadingSavedPractice, readSavedPractice } from '../src/evidence-workspace/profile-read-state.ts';

test('loading and a successfully read empty profile are distinct states', () => {
  assert.deepEqual(loadingSavedPractice, { status: 'loading' });
  assert.deepEqual(readSavedPractice(() => emptyProfile()), { status: 'ready', artifacts: [] });
});

test('strict read failure stays unreadable, and retry only rereads without writing or resetting storage', () => {
  const storage = { raw: '{damaged', reads: 0, writes: 0 };
  const read = () => { storage.reads++; return parseProfileStrict(storage.raw); };
  const failed = readSavedPractice(read);
  assert.deepEqual(failed, { status: 'unreadable' });
  assert.equal(storage.raw, '{damaged');
  assert.equal(storage.writes, 0);

  storage.raw = JSON.stringify(emptyProfile());
  const retried = readSavedPractice(read);
  assert.deepEqual(retried, { status: 'ready', artifacts: [] });
  assert.equal(storage.reads, 2);
  assert.equal(storage.writes, 0);
});

test('profile read success with a summarization failure is not labeled as an empty history', () => {
  const brokenProjection = new Proxy({}, { get() { throw new Error('unexpected projection failure'); } });
  assert.deepEqual(readSavedPractice(() => brokenProjection), { status: 'unavailable' });
});
