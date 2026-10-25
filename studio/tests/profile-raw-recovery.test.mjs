import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_KEY } from '../src/profile/model.ts';
import {
  MAX_RAW_PROGRESS_CHARACTERS,
  MAX_RAW_PROGRESS_RECOVERY_BYTES,
  RAW_PROGRESS_RECOVERY_FILENAME,
  RAW_PROGRESS_RECOVERY_FORMAT,
  prepareRawProgressRecovery,
} from '../src/profile-recovery/raw-progress.ts';

test('recovery envelope preserves exact malformed whitespace, Unicode, and lone-surrogate text', () => {
  const raw = ` \n{not-json:"café ☕ ${String.fromCharCode(0xd800)}"}\t  `;
  const result = prepareRawProgressRecovery({ getItem: key => { assert.equal(key, PROFILE_KEY); return raw; } });
  assert.equal(result.status, 'ready');
  if (result.status !== 'ready') return;
  const envelope = JSON.parse(result.content);
  assert.equal(envelope.format, RAW_PROGRESS_RECOVERY_FORMAT);
  assert.equal(envelope.storageKey, PROFILE_KEY);
  assert.equal(envelope.rawValue, raw);
  assert.equal(result.characterCount, raw.length);
  assert.equal(result.filename, RAW_PROGRESS_RECOVERY_FILENAME);
});

test('reads only the fixed profile key once and never calls a storage write method', () => {
  const keys = [];
  let writes = 0;
  const result = prepareRawProgressRecovery({
    getItem(key) { keys.push(key); return 'stored bytes'; },
    setItem() { writes++; },
    removeItem() { writes++; },
  });
  assert.equal(result.status, 'ready');
  assert.deepEqual(keys, [PROFILE_KEY]);
  assert.equal(writes, 0);
});

test('missing, unavailable, and over-limit storage have distinct results without raw content', () => {
  assert.deepEqual(prepareRawProgressRecovery({ getItem: () => null }), { status: 'missing' });
  assert.deepEqual(prepareRawProgressRecovery({ getItem: () => { throw new Error('storage denied'); } }), { status: 'unavailable' });
  const oversized = prepareRawProgressRecovery({ getItem: () => 'x'.repeat(MAX_RAW_PROGRESS_CHARACTERS + 1) });
  assert.deepEqual(oversized, { status: 'too-large' });
  assert.ok(MAX_RAW_PROGRESS_RECOVERY_BYTES <= 6_100_000);
});

test('character boundary is accepted with a bounded serialized recovery envelope', () => {
  const raw = '\u0001'.repeat(MAX_RAW_PROGRESS_CHARACTERS);
  const result = prepareRawProgressRecovery({ getItem: () => raw });
  assert.equal(result.status, 'ready');
  if (result.status !== 'ready') return;
  assert.equal(result.characterCount, MAX_RAW_PROGRESS_CHARACTERS);
  assert.ok(result.byteCount <= MAX_RAW_PROGRESS_RECOVERY_BYTES);
  assert.equal(JSON.parse(result.content).rawValue, raw);
});
