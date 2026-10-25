import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createLearnerRepository } from '../server/learner-repository/index.mjs';

class Snapshot {
  constructor(id, value) { this.id = id; this.value = value; this.exists = value !== undefined; }
  data() { return this.value; }
}
class FakeFirestore {
  rows = new Map();
  collection(name) { return new CollectionRef(this, name); }
  async runTransaction(work) {
    const writes = [];
    const tx = { get: async (ref) => new Snapshot(ref.id, this.rows.get(ref.path)),
      set: (ref, value) => writes.push(() => this.rows.set(ref.path, structuredClone(value))),
      delete: (ref) => writes.push(() => this.rows.delete(ref.path)) };
    const result = await work(tx); writes.forEach((write) => write()); return result;
  }
}
class CollectionRef {
  constructor(db, path) { this.db = db; this.path = path; }
  doc(id) { return new DocumentRef(this.db, `${this.path}/${id}`, id); }
  limit(count) { return new QueryRef(this.db, this.path, count); }
}
class DocumentRef {
  constructor(db, path, id) { this.db = db; this.path = path; this.id = id; }
  collection(name) { return new CollectionRef(this.db, `${this.path}/${name}`); }
  async get() { return new Snapshot(this.id, this.db.rows.get(this.path)); }
}
class QueryRef {
  constructor(db, path, count) { this.db = db; this.path = path; this.count = count; }
  async get() {
    const prefix = `${this.path}/`;
    const docs = [...this.db.rows.entries()].filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .slice(0, this.count).map(([path, value]) => new Snapshot(path.slice(prefix.length), value));
    return { docs };
  }
}
class FakeBucket {
  objects = new Map();
  file(path) {
    const bucket = this;
    return {
      async save(body, options) {
        if (options.preconditionOpts.ifGenerationMatch === 0 && bucket.objects.has(path)) { const error = new Error('precondition'); error.code = 412; throw error; }
        bucket.objects.set(path, { body: Buffer.from(body), metadata: structuredClone(options.metadata) });
      },
      async getMetadata() { const object = bucket.objects.get(path); if (!object) { const error = new Error('missing'); error.code = 404; throw error; } return [object.metadata]; },
      async download() { const object = bucket.objects.get(path); if (!object) { const error = new Error('missing'); error.code = 404; throw error; } return [Buffer.from(object.body)]; },
      async delete() { if (!bucket.objects.delete(path)) { const error = new Error('missing'); error.code = 404; throw error; } },
    };
  }
}
function setup() { const firestore = new FakeFirestore(); const bucket = new FakeBucket(); return { firestore, bucket, repo: createLearnerRepository({ firestore, bucket }) }; }

test('versioned records are owner scoped and compare-and-swap protected', async () => {
  const { firestore, repo } = setup();
  const created = await repo.put('alice-private-uid', 'lessons', 'lesson_1', { title: 'Forces' }, { create: true });
  assert.deepEqual(await repo.get('alice-private-uid', 'lessons', 'lesson_1'), created);
  assert.equal(await repo.get('another-private-uid', 'lessons', 'lesson_1'), null);
  await assert.rejects(repo.put('alice-private-uid', 'lessons', 'lesson_1', {}, { create: true }), { status: 409 });
  await assert.rejects(repo.put('alice-private-uid', 'lessons', 'lesson_1', {}, { version: 'stale' }), { status: 409 });
  const changed = await repo.put('alice-private-uid', 'lessons', 'lesson_1', { title: 'Updated' }, { version: created.version });
  assert.notEqual(changed.version, created.version);
  assert.deepEqual(await repo.list('alice-private-uid', 'lessons'), [changed]);
  await assert.rejects(repo.remove('alice-private-uid', 'lessons', 'lesson_1', { version: created.version }), { status: 409 });
  assert.deepEqual(await repo.remove('alice-private-uid', 'lessons', 'lesson_1', { version: changed.version }), { removed: true });
  assert.equal(firestore.rows.size, 0);
});

test('validation bounds records and rejects forged stored identity envelopes', async () => {
  const { firestore, repo } = setup();
  await assert.rejects(repo.get('u1', '../lessons', 'id'), { status: 400 });
  await assert.rejects(repo.get('u1', 'lessons', '../id'), { status: 400 });
  await assert.rejects(repo.list('u1', 'lessons', { limit: 501 }), { status: 400 });
  await assert.rejects(repo.put('u1', 'lessons', 'too_big', { text: 'x'.repeat(220 * 1024) }, { create: true }), { status: 400 });
  for (const invalid of [null, [], 'text', 7, true]) {
    await assert.rejects(repo.put('u1', 'lessons', 'invalid_value', invalid, { create: true }), { status: 400 });
  }
  for (const invalidUid of ['', '   ', 'bad\u0000uid', 'bad\nuid', `x${'a'.repeat(128)}`]) {
    await assert.rejects(repo.get(invalidUid, 'lessons', 'id'), { status: 400 });
  }
  const spacedUidRecord = await repo.put(' uid ', 'lessons', 'literal_uid', { kept: true }, { create: true });
  assert.deepEqual(await repo.get(' uid ', 'lessons', 'literal_uid'), spacedUidRecord);
  assert.equal(await repo.get('uid', 'lessons', 'literal_uid'), null);
  const owner = createHash('sha256').update('u1').digest('hex');
  firestore.rows.set(`owners/${owner}/lessons/forged`, { ownerKey: 'other', kind: 'lessons', id: 'forged', value: {}, version: 'v1' });
  await assert.rejects(repo.get('u1', 'lessons', 'forged'), /identity validation/);
});

test('original blobs are owner scoped, create only and integrity checked', async () => {
  const { bucket, repo } = setup();
  const bytes = Buffer.from('synthetic learner source');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert.deepEqual(await repo.putBlob('alice-private-uid', 'source-1', bytes, { contentType: 'text/plain' }), { id: 'source-1', sha256, bytes: bytes.length, contentType: 'text/plain' });
  assert.deepEqual(await repo.getBlob('alice-private-uid', 'source-1'), bytes);
  assert.equal(await repo.getBlob('another-private-uid', 'source-1'), null);
  assert.deepEqual(await repo.removeBlob('another-private-uid', 'source-1'), { removed: false });
  await assert.rejects(repo.putBlob('alice-private-uid', 'source-1', bytes), { code: 412 });
  assert.deepEqual(await repo.removeBlob('alice-private-uid', 'source-1'), { removed: true });
  assert.equal(await repo.getBlob('alice-private-uid', 'source-1'), null);
  await assert.rejects(repo.putBlob('u1', 'empty', Buffer.alloc(0)), { status: 400 });
  await assert.rejects(repo.putBlob('u1', 'large', Buffer.alloc(8 * 1024 * 1024 + 1)), { status: 400 });
  const owner = createHash('sha256').update('u1').digest('hex');
  bucket.objects.set(`owners/${owner}/originals/tampered`, { body: Buffer.from('tampered'), metadata: { metadata: { ownerKey: owner, id: 'tampered', sha256, bytes: '1' } } });
  await assert.rejects(repo.getBlob('u1', 'tampered'), /integrity validation/);
});
