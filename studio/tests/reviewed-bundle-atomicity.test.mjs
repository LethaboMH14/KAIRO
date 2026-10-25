import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { hash } from '../server/workspace/model.mjs';
import { createLearnerWorkspace } from '../server/learner-workspace/routes.mjs';

// Synthetic HTTP regression only: no real learner, external provider, or v2 lesson save.
const IDS = ['a'.repeat(24), 'b'.repeat(24), 'c'.repeat(24)];
const owners = ['synthetic-owner-A', 'synthetic-owner-B'];
const key = (uid, kind, id) => uid + '|' + kind + '|' + id;
function source(id, tag) {
  const reviewedPages = [{ locator: 'Page 1', method: 'pasted-text', edited: false,
    text: ('Synthetic ' + tag + ' notes describe motor voltage and pump current for a lesson. ').repeat(9) }];
  return { id, title: 'Reviewed ' + tag, reviewed: true, pages: reviewedPages,
    reviewedPages, revision: hash(reviewedPages) };
}
async function fixture(t) {
  const saved = new Map();
  const sources = [source(IDS[0], 'owner-A-one'), source(IDS[1], 'owner-A-two'),
    source(IDS[2], 'FOREIGN-OWNER-B-PRIVATE')];
  function store(uid, value) {
    saved.set(key(uid, 'sources', value.id), { value: structuredClone(value) });
    saved.set(key(uid, 'revisions', value.id + '_' + value.revision), { value: structuredClone(value) });
  }
  store(owners[0], sources[0]); store(owners[0], sources[1]); store(owners[1], sources[2]);
  let writes = 0, providerCalls = 0;
  let onRead = () => {};
  const repository = {
    async get(uid, kind, id) {
      const value = structuredClone(saved.get(key(uid, kind, id)) ?? null);
      onRead(uid, kind, id);
      return value;
    },
    async list() { return []; },
    async put() { writes++; throw new Error('Preview must not persist a lesson'); },
  };
  const app = express();
  app.use((req, _res, next) => {
    req.kairoIdentity = { uid: req.headers['x-synthetic-owner'] === 'B' ? owners[1] : owners[0] };
    next();
  });
  app.use(createLearnerWorkspace({
    repository, generate: async () => { providerCalls++; throw new Error('Provider must not run'); },
  }).router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  async function preview(refs, owner = 'A') {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/bundle-preview', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-synthetic-owner': owner },
      body: JSON.stringify({ schemaVersion: 2, mode: 'local', goal: 'motor voltage pump current',
        sourceRefs: refs.map(s => ({ sourceId: s.id, revision: s.revision })) }),
    });
    return { status: response.status, body: await response.json() };
  }
  return { sources, saved, store, preview, onRead(fn) { onRead = fn; },
    get writes() { return writes; }, get providerCalls() { return providerCalls; } };
}

test('mixed owned and foreign sources are rejected atomically in either order, without partial quotes', async t => {
  const f = await fixture(t);
  for (const refs of [[f.sources[0], f.sources[2]], [f.sources[2], f.sources[0]]]) {
    const result = await f.preview(refs);
    assert.equal(result.status, 409, JSON.stringify(result.body));
    const response = JSON.stringify(result.body);
    assert.doesNotMatch(response, /FOREIGN-OWNER-B-PRIVATE|owner-A-one|Synthetic/);
    assert.equal('evidence' in result.body, false, 'never return a partial bundle');
  }
  assert.equal(f.writes, 0);
  assert.equal(f.providerCalls, 0);
});

test('two owned reviewed sources produce revision-exact anchors but never save a lesson', async t => {
  const f = await fixture(t);
  const result = await f.preview([f.sources[1], f.sources[0]]);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.kind, 'reviewed-evidence-preview');
  assert.deepEqual(result.body.sourceRefs.map(x => x.sourceId), [IDS[1], IDS[0]]);
  assert.match(result.body.notice, /not a generated or saved lesson/);
  assert.ok(result.body.evidence.length > 0);
  for (const evidence of result.body.evidence) {
    const selected = f.sources.find(x => x.id === evidence.sourceId);
    assert.ok(selected && selected.id !== IDS[2]);
    assert.equal(evidence.sourceRevision, selected.revision);
    assert.equal(selected.reviewedPages[0].text.slice(evidence.start, evidence.end), evidence.quote);
  }
  assert.equal(f.writes, 0);
  assert.equal(f.providerCalls, 0);
});

test('review changes between initial validation and retrieval fail closed without partial evidence', async t => {
  const f = await fixture(t);
  let changed = false;
  f.onRead((uid, kind, id) => {
    if (!changed && uid === owners[0] && kind === 'sources' && id === IDS[1]) {
      changed = true;
      const next = source(IDS[1], 'UPDATED-PRIVATE-REVIEW');
      f.store(owners[0], next);
    }
  });
  const result = await f.preview([f.sources[0], f.sources[1]]);
  assert.equal(changed, true, 'the synthetic read/review race actually occurred');
  assert.notEqual(result.status, 200, JSON.stringify(result.body));
  assert.equal('evidence' in result.body, false);
  assert.doesNotMatch(JSON.stringify(result.body), /UPDATED-PRIVATE-REVIEW|owner-A-one|owner-A-two/);
  assert.equal(f.writes, 0);
  assert.equal(f.providerCalls, 0);
});
