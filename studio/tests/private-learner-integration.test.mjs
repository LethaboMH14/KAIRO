import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createLearnerWorkspace } from '../server/learner-workspace/routes.mjs';

function memoryRepository() {
  const records = new Map();
  const blobs = new Map();
  let revision = 0;
  const key = (uid, kind, id) => `${uid}\0${kind}\0${id}`;
  const clone = value => structuredClone(value);
  const conflict = () => Object.assign(new Error('stale version'), { status: 409 });
  return {
    async get(uid, kind, id) {
      const row = records.get(key(uid, kind, id));
      return row ? clone(row) : null;
    },
    async list(uid, kind, { limit = 100 } = {}) {
      const prefix = `${uid}\0${kind}\0`;
      return [...records.entries()].filter(([address]) => address.startsWith(prefix)).slice(0, limit).map(([, row]) => clone(row));
    },
    async put(uid, kind, id, value, { version, create = false } = {}) {
      const address = key(uid, kind, id), current = records.get(address);
      if (create ? current : !current || current.version !== version) throw conflict();
      const saved = { id, value: clone(value), version: `v${++revision}` };
      records.set(address, saved);
      return clone(saved);
    },
    async remove(uid, kind, id, { version } = {}) {
      const address = key(uid, kind, id), current = records.get(address);
      if (!current) return { removed: false };
      if (current.version !== version) throw conflict();
      records.delete(address);
      return { removed: true };
    },
    async putBlob(uid, id, bytes) {
      const address = `${uid}\0${id}`;
      if (blobs.has(address)) throw Object.assign(new Error('exists'), { status: 409 });
      blobs.set(address, Buffer.from(bytes));
      return { id, bytes: bytes.length };
    },
    async getBlob(uid, id) {
      const bytes = blobs.get(`${uid}\0${id}`);
      return bytes ? Buffer.from(bytes) : null;
    },
    async removeBlob(uid, id) {
      return { removed: blobs.delete(`${uid}\0${id}`) };
    },
  };
}

function harness(repository, options = {}) {
  const app = express();
  app.use((req, _res, next) => {
    req.kairoIdentity = { uid: req.get('x-test-owner') || '' };
    next();
  });
  const workspace = createLearnerWorkspace({
    repository,
    enqueue: options.enqueue || (async () => {}),
    extract: options.extract || (async () => ({ pages: [{ text: 'Extracted synthetic source text that a learner can review before using it in a lesson.', locator: 'Section 1', method: 'synthetic-test' }] })),
    clock: options.clock || (() => Date.now()),
    generate: options.generate || (async () => { throw new Error('Unexpected generation provider call'); }),
  });
  app.use('/api/workspace', workspace.router);
  const server = app.listen(0, '127.0.0.1');
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.once('listening', () => resolve({
      workspace,
      close: () => new Promise(done => server.close(done)),
      request: async (uid, path, { method = 'GET', body, bytes, contentType = 'application/json' } = {}) => {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/workspace${path}`, {
          method,
          headers: { 'x-test-owner': uid, 'content-type': contentType },
          ...(bytes ? { body: bytes } : body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const data = response.status === 204 ? null : await response.json().catch(() => null);
        return { status: response.status, data };
      },
    }));
  });
}

const passage = 'A force changes the motion of an object when it is unbalanced. The direction of acceleration follows the net force. When the same net force acts on a larger mass, the resulting acceleration is smaller. Learners can compare examples by identifying the net force, measuring the mass, and explaining the change in motion using evidence from the reviewed passage.';

test('private workspace HTTP routes isolate learners, preserve review and lesson data across router recreation, and reject stale revisions and drafts', async () => {
  const repository = memoryRepository();
  let first = await harness(repository);
  try {
    const created = await first.request('learner-a', '/text', { method: 'POST', body: { title: 'Synthetic forces', text: passage } });
    assert.equal(created.status, 200);
    const sourceId = created.data.id;
    const reviewed = await first.request('learner-a', `/source/${sourceId}/review`, { method: 'POST', body: { acknowledged: true, expectedRevision: null, pages: [{ text: passage }] } });
    assert.equal(reviewed.status, 200);
    const revision = reviewed.data.revision;
    assert.match(revision, /^[a-f0-9]{64}$/);
    assert.equal((await first.request('learner-b', `/source/${sourceId}`)).status, 404);
    assert.equal((await first.request('learner-b', '/catalog')).data.catalog.length, 0);

    const selected = await first.request('learner-a', `/source/${sourceId}/selection?goal=net%20force`);
    assert.equal(selected.status, 200);
    assert.ok(selected.data.evidence.length > 0);
    assert.ok(selected.data.evidence.every(item => passage.includes(item.quote)));

    const generated = await first.request('learner-a', '/generate', { method: 'POST', body: { sourceId, revision, mode: 'local', goal: 'net force' } });
    assert.equal(generated.status, 200);
    const lesson = generated.data;
    assert.equal(lesson.sourceId, sourceId);
    assert.equal(lesson.revision, revision);
    assert.equal((await first.request('learner-a', `/lesson/${lesson.id}`)).status, 200);
    assert.equal((await first.request('learner-b', `/lesson/${lesson.id}`)).status, 404);

    const draft = await first.request('learner-a', `/lesson/${lesson.id}/draft`);
    assert.equal(draft.status, 200);
    const savedDraft = await first.request('learner-a', `/lesson/${lesson.id}/draft`, { method: 'POST', body: { expectedVersion: 0, document: draft.data.document } });
    assert.equal(savedDraft.status, 200);
    assert.equal(savedDraft.data.version, 1);
    assert.equal((await first.request('learner-a', `/lesson/${lesson.id}/draft`, { method: 'POST', body: { expectedVersion: 0, document: draft.data.document } })).status, 409);

    const revisedText = `${passage} An additional reviewed sentence makes this a later source revision.`;
    const changed = await first.request('learner-a', `/source/${sourceId}/review`, { method: 'POST', body: { acknowledged: true, expectedRevision: revision, pages: [{ text: revisedText }] } });
    assert.equal(changed.status, 200);
    assert.notEqual(changed.data.revision, revision);
    assert.equal((await first.request('learner-a', `/source/${sourceId}/review`, { method: 'POST', body: { acknowledged: true, expectedRevision: revision, pages: [{ text: passage }] } })).status, 409);
    assert.equal((await first.request('learner-a', '/generate', { method: 'POST', body: { sourceId, revision, mode: 'local', goal: 'net force' } })).status, 400);
  } finally { await first.close(); }

  first = await harness(repository);
  try {
    const catalog = await first.request('learner-a', '/catalog');
    assert.equal(catalog.data.catalog.length, 1);
    assert.equal(catalog.data.lessons.length, 1);
    const lesson = catalog.data.lessons[0];
    const restored = await first.request('learner-a', `/lesson/${lesson.id}/draft`);
    assert.equal(restored.status, 200);
    assert.equal(restored.data.version, 1);
    assert.equal((await first.request('learner-b', '/catalog')).data.catalog.length, 0);
  } finally { await first.close(); }
});

test('private upload moves queued to ready, and both pre-extraction and in-flight cancellation prevent source publication', async () => {
  const repository = memoryRepository();
  const queued = [];
  let extractionCalls = 0;
  let current = await harness(repository, { enqueue: async (_uid, jobId) => queued.push(jobId) });
  const upload = async (uid, name = 'module.txt') => current.request(uid, `/upload?name=${encodeURIComponent(name)}`, { method: 'POST', bytes: Buffer.from('synthetic uploaded text'), contentType: 'application/octet-stream' });
  try {
    const started = await upload('learner-a');
    assert.equal(started.status, 202);
    const jobId = started.data.jobId;
    assert.deepEqual(queued, [jobId]);
    assert.equal((await current.request('learner-a', `/jobs/${jobId}`)).data.status, 'queued');
    assert.equal((await current.request('learner-b', `/jobs/${jobId}`)).status, 404);
    await current.close();
    current = await harness(repository, {
      enqueue: async (_uid, queuedJobId) => queued.push(queuedJobId),
      extract: async () => {
        extractionCalls++;
        return { pages: [{ text: 'Extracted synthetic source text that a learner can review before using it in a lesson.', locator: 'Section 1', method: 'synthetic-test' }] };
      },
    });
    assert.equal((await current.request('learner-a', `/jobs/${jobId}`)).data.status, 'queued');
    assert.deepEqual(await current.workspace.processImport('learner-a', jobId), { done: true });
    const ready = await current.request('learner-a', `/jobs/${jobId}`);
    assert.equal(ready.status, 200);
    assert.equal(ready.data.status, 'ready');
    const importedSourceId = ready.data.source.id;
    assert.equal((await current.request('learner-a', `/source/${importedSourceId}`)).status, 200);
    assert.equal((await repository.getBlob('learner-a', jobId)), null);

    const beforeExtraction = await upload('learner-a');
    const cancelledId = beforeExtraction.data.jobId;
    assert.equal((await current.request('learner-a', `/jobs/${cancelledId}`, { method: 'DELETE' })).data.cancelled, true);
    await current.workspace.processImport('learner-a', cancelledId);
    assert.equal((await current.request('learner-a', `/jobs/${cancelledId}`)).data.status, 'cancelled');
    assert.equal(extractionCalls, 1);

    await current.close();
    let releaseExtraction;
    let enteredExtraction;
    const entered = new Promise(resolve => { enteredExtraction = resolve; });
    const waiting = new Promise(resolve => { releaseExtraction = resolve; });
    current = await harness(repository, { extract: async () => { enteredExtraction(); await waiting; return { pages: [{ text: 'This extracted content must not publish after cancellation because the worker lost its lease.', locator: 'Section 1', method: 'synthetic-test' }] }; } });
    const duringExtraction = await upload('learner-a');
    const inFlightId = duringExtraction.data.jobId;
    const running = current.workspace.processImport('learner-a', inFlightId);
    await entered;
    assert.equal((await current.request('learner-a', `/jobs/${inFlightId}`, { method: 'DELETE' })).status, 200);
    releaseExtraction();
    await running;
    const cancelled = await current.request('learner-a', `/jobs/${inFlightId}`);
    assert.equal(cancelled.data.status, 'cancelled');
    const internalJob = await repository.get('learner-a', 'jobs', inFlightId);
    assert.equal((await current.request('learner-a', `/source/${internalJob.value.sourceId}`)).status, 404);
    assert.equal((await current.request('learner-a', '/catalog')).data.catalog.some(item => item.id === internalJob.value.sourceId), false);
  } finally { await current.close(); }
});
