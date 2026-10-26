import test from 'node:test';
import assert from 'node:assert/strict';
import {
  standaloneContext, resolveLinkedContext, contextStorageKeys,
  saveSnapshot, readSnapshot, appendEvidence, readEvidence, MAX_SNAPSHOT_BYTES,
} from '../src/studio-scenarios/pump-context-fence-20261026/ledger.mjs';

const A = 'a'.repeat(24), B = 'b'.repeat(24), R1 = '1'.repeat(64), R2 = '2'.repeat(64);
const verified = (revision = R1) => async ({ kind, id }) => ({ kind, id, revision, reviewedCurrent: true, ownerAccessible: true });
const link = async (kind, id, revision = R1) => (await resolveLinkedContext(kind, id, verified(revision))).context;
const replay = raw => { try { const s = JSON.parse(raw); return s.schema === 'kairo-pump-lab-session/1' && Array.isArray(s.actions) ? s : null; } catch { return null; } };
const snap = (id, model = 'pump-model-1') => JSON.stringify({ schema: 'kairo-pump-lab-session/1', sessionId: id, model, actions: [{ type: 'predict', flowLps: 3 }] });
const evidence = (id, model = 'pump-model-1') => ({
  report: { schema: 'kairo-pump-lab-report/1', status: 'local self-directed simulation, unverified', model: { sessionId: id, version: model } },
  item: { schema: 'kairo-evidence-item/pump-lab-draft-1', label: 'local self-directed simulation, unverified',
    provenance: { simulated: true, sessionId: id, modelVersion: model }, events: { competencyExternallyVerified: false } },
});
const clock = '2026-10-26T06:00:00.000Z';
function storage(map = new Map(), prefix = '') {
  return { getItem: k => map.get(prefix + k) ?? null, setItem: (k, v) => map.set(prefix + k, v), map };
}

test('A→B→A never restores or relabels another lesson, and same-lesson reload resumes', async () => {
  const s = storage(), a = await link('v2', A), b = await link('v2', B);
  assert.equal(saveSnapshot(s, a, snap('session-A'), replay).status, 'saved');
  assert.equal(readSnapshot(s, b, replay).status, 'empty');
  assert.equal(saveSnapshot(s, b, snap('session-B'), replay).status, 'saved');
  assert.equal(readSnapshot(s, a, replay).sessionId, 'session-A');
  assert.equal(readSnapshot(s, b, replay).sessionId, 'session-B');
  const { item, report } = evidence('session-A');
  assert.equal(appendEvidence(s, b, item, report, replay, clock).status, 'blocked');
  assert.equal(appendEvidence(s, a, item, report, replay, clock).status, 'saved');
  assert.equal(readEvidence(s, b).entries.length, 0);
  assert.equal(readEvidence(s, a).entries[0].status, 'local-unverified');
});

test('source re-review/revocation/owner mismatch/failed server read never inherits old linked state', async () => {
  const s = storage(), old = await link('v2', A, R1), changed = await link('v2', A, R2);
  saveSnapshot(s, old, snap('old-session'), replay);
  assert.equal(readSnapshot(s, changed, replay).status, 'empty');
  for (const record of [
    { id: A, revision: R1, reviewedCurrent: false, ownerAccessible: true },
    { id: A, revision: R1, reviewedCurrent: true, ownerAccessible: false },
    { id: B, revision: R1, reviewedCurrent: true, ownerAccessible: true },
    { id: A, revision: 'fake', reviewedCurrent: true, ownerAccessible: true },
  ]) {
    const r = await resolveLinkedContext('v2', A, async () => record);
    assert.equal(r.status, 'detached'); assert.equal(r.context, null);
  }
  assert.equal((await resolveLinkedContext('v2', A, async () => { throw Error('403'); })).status, 'detached');
  assert.equal(readSnapshot(s, old, replay).status, 'restored', 'old data preserved, never relabelled');
});

test('v1, v2, standalone, and account storage prefixes remain independent', async () => {
  const map = new Map(), first = storage(map, 'kairo-private-' + 'a'.repeat(64) + ':'), second = storage(map, 'kairo-private-' + 'b'.repeat(64) + ':');
  const v1 = await link('v1', A), v2 = await link('v2', A), plain = standaloneContext();
  saveSnapshot(first, v1, snap('v1'), replay); saveSnapshot(first, plain, snap('plain'), replay);
  assert.equal(readSnapshot(first, v2, replay).status, 'empty');
  assert.equal(readSnapshot(first, plain, replay).sessionId, 'plain');
  assert.equal(readSnapshot(second, v1, replay).status, 'empty');
  assert.notEqual(contextStorageKeys(v1).snapshot, contextStorageKeys(v2).snapshot);
  assert.equal((await resolveLinkedContext('v2', 'malformed', verified())).status, 'detached');
});

test('invalid replay, mismatched model/session, and forged competency cannot be saved', async () => {
  const s = storage(), a = await link('v1', A);
  assert.equal(saveSnapshot(s, a, snap('session-A'), () => null).status, 'blocked');
  assert.equal(readSnapshot(s, a, replay).status, 'empty');
  saveSnapshot(s, a, snap('session-A'), replay);
  const e = evidence('session-A');
  assert.equal(appendEvidence(s, a, e.item, evidence('other').report, replay, clock).status, 'blocked');
  assert.equal(appendEvidence(s, a, e.item, evidence('session-A', 'other-model').report, replay, clock).status, 'blocked');
  assert.equal(appendEvidence(s, a, { ...e.item, events: { competencyExternallyVerified: true } }, e.report, replay, clock).status, 'blocked');
  assert.equal(readEvidence(s, a).status, 'empty');
});

test('malformed, oversized and context-swapped snapshots fail closed without overwriting', async () => {
  const s = storage(), a = await link('v2', A), b = await link('v2', B), ka = contextStorageKeys(a).snapshot, kb = contextStorageKeys(b).snapshot;
  assert.equal(saveSnapshot(s, a, 'x'.repeat(MAX_SNAPSHOT_BYTES + 1), replay).status, 'blocked');
  s.setItem(ka, '{invalid'); assert.equal(readSnapshot(s, a, replay).status, 'blocked');
  assert.equal(s.getItem(ka), '{invalid');
  saveSnapshot(s, b, snap('B'), replay); s.setItem(ka, s.getItem(kb));
  assert.equal(readSnapshot(s, a, replay).status, 'blocked');
  assert.equal(saveSnapshot(s, a, snap('A'), replay).status, 'saved');
  assert.equal(readSnapshot(s, a, () => null).status, 'blocked');
});

test('storage denied and corrupt existing evidence produce safe, non-destructive results', async () => {
  const a = await link('v2', A), s = storage(), { item, report } = evidence('A');
  const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readSnapshot(denied, a, replay).status, 'unavailable');
  assert.equal(saveSnapshot(denied, a, snap('A'), replay).status, 'unavailable');
  assert.equal(readEvidence(denied, a).status, 'unavailable');
  saveSnapshot(s, a, snap('A'), replay);
  s.setItem(contextStorageKeys(a).evidence, '{bad');
  assert.equal(appendEvidence(s, a, item, report, replay, clock).status, 'blocked');
  assert.equal(s.getItem(contextStorageKeys(a).evidence), '{bad');
});

test('five-entry cap retains only recent local-unverified records in the same context', async () => {
  const s = storage(), a = await link('v1', A);
  for (let i = 0; i < 7; i++) {
    const id = `s${i}`; saveSnapshot(s, a, snap(id), replay);
    const { item, report } = evidence(id);
    assert.equal(appendEvidence(s, a, item, report, replay, clock).status, 'saved');
  }
  const saved = readEvidence(s, a);
  assert.equal(saved.status, 'restored');
  assert.deepEqual(saved.entries.map(e => e.sessionId), ['s2', 's3', 's4', 's5', 's6']);
  assert.ok(saved.entries.every(e => e.status === 'local-unverified'));
});
