import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { hash } from '../server/workspace/model.mjs';
import { createLearnerWorkspace } from '../server/learner-workspace/routes.mjs';
import {
  toggleReviewedSource, checkSelectedSources, prepareSelectionRequest,
} from '../src/source-selection/selection.mjs';

// This is a synthetic HTTP bridge test, not a real learner, provider call,
// saved v2 lesson, mounted picker, or production authentication test.
const IDs = ['a'.repeat(24), 'b'.repeat(24), 'c'.repeat(24)];
function makeSource(id, title, topic) {
  const reviewedPages = [{
    locator: 'Page 1', method: 'pasted-text', edited: false,
    text: (`Synthetic ${topic} notes describe motor current and voltage in a safe educational example. `).repeat(8),
  }];
  return {
    id, title, reviewed: true, pages: reviewedPages, reviewedPages,
    revision: hash(reviewedPages), reviewedAt: '2026-10-25T08:00:00Z',
  };
}
async function fixture(t) {
  const records = new Map();
  const owners = ['synthetic-owner-A', 'synthetic-owner-B'];
  const sources = [
    makeSource(IDs[0], 'A: Motor current', 'current'),
    makeSource(IDs[1], 'B: Motor voltage', 'voltage'),
    makeSource(IDs[2], 'Private B-only source', 'confidential-owner-B'),
  ];
  const key = (uid, kind, id) => `${uid}|${kind}|${id}`;
  function store(uid, source) {
    records.set(key(uid, 'sources', source.id), { value: structuredClone(source) });
    records.set(key(uid, 'revisions', source.id + '_' + source.revision),
      { value: structuredClone(source) });
  }
  store(owners[0], sources[0]);
  store(owners[0], sources[1]);
  store(owners[1], sources[2]);
  let writes = 0;
  const repository = {
    async list(uid, kind) {
      if (kind !== 'sources') return [];
      return [...records.entries()]
        .filter(([k]) => k.startsWith(uid + '|sources|'))
        .map(([, row]) => ({ id: row.value.id, value: structuredClone(row.value) }));
    },
    async get(uid, kind, id) {
      return structuredClone(records.get(key(uid, kind, id)) ?? null);
    },
    async put() {
      writes++;
      throw new Error('Read-only journey bridge must not write.');
    },
  };
  const app = express();
  app.use((req, _res, next) => {
    req.kairoIdentity = { uid: req.headers['x-synthetic-owner'] === 'B' ? owners[1] : owners[0] };
    next();
  });
  app.use(createLearnerWorkspace({ repository }).router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise(resolve => server.close(resolve));
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  async function catalog(owner = 'A') {
    const r = await fetch(base + '/catalog', { headers: { 'x-synthetic-owner': owner } });
    assert.equal(r.status, 200);
    return r.json();
  }
  async function preview(body, owner = 'A') {
    const r = await fetch(base + '/bundle-preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-synthetic-owner': owner },
      body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  }
  return { catalog, preview, sources, store, owners, get writes() { return writes; } };
}
function selectInOrder(catalog, ids) {
  let selected = [];
  for (const id of ids) {
    const item = catalog.reviewedSources.find(s => s.id === id);
    assert.ok(item, 'reviewed source must be offered to its owner');
    selected = toggleReviewedSource(selected, item);
  }
  return selected;
}

test('authenticated catalog -> ordered client selection -> private cited preview keeps both exact source revisions', async t => {
  const f = await fixture(t);
  const a = await f.catalog('A');
  const b = await f.catalog('B');
  assert.equal(a.reviewedSourcesVersion, 1);
  assert.deepEqual(a.reviewedSources.map(s => s.id), IDs.slice(0, 2));
  assert.deepEqual(b.reviewedSources.map(s => s.id), [IDs[2]]);
  assert.doesNotMatch(JSON.stringify(a), /confidential-owner-B|reviewedPages|Synthetic current notes/);

  const selected = selectInOrder(a, [IDs[1], IDs[0]]);
  const payload = prepareSelectionRequest({
    selected, currentSources: a.reviewedSources, multiSourceApi: true,
    mode: 'local', goal: 'motor current voltage',
  });
  assert.equal(payload.schemaVersion, 2);
  assert.deepEqual(payload.sourceRefs.map(s => s.sourceId), [IDs[1], IDs[0]]);
  assert.equal('provider' in payload, false);
  assert.equal('consent' in payload, false);
  const result = await f.preview(payload, 'A');
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.kind, 'reviewed-evidence-preview');
  assert.match(result.body.notice, /not a generated or saved lesson/i);
  assert.deepEqual(result.body.sourceRefs, payload.sourceRefs);
  assert.match(result.body.bundleRevision, /^[a-f0-9]{64}$/);
  assert.ok(result.body.evidence.length >= 2);
  for (const item of result.body.evidence) {
    const source = f.sources.find(s => s.id === item.sourceId);
    assert.ok(source && source.id !== IDs[2]);
    assert.equal(item.sourceRevision, source.revision);
    assert.equal(item.locator, 'Page 1');
    assert.equal(source.reviewedPages[0].text.slice(item.start, item.end), item.quote);
  }
  assert.equal(f.writes, 0);
});

test('stale reviewed source is rejected by both client revalidation and server owner/revision fencing', async t => {
  const f = await fixture(t);
  const a = await f.catalog('A');
  const selected = selectInOrder(a, [IDs[0], IDs[1]]);
  const request = prepareSelectionRequest({
    selected, currentSources: a.reviewedSources, multiSourceApi: true, mode: 'local',
  });
  const changed = makeSource(IDs[0], 'A: Motor current', 're-reviewed-current');
  assert.notEqual(changed.revision, f.sources[0].revision);
  f.store(f.owners[0], changed);
  const latest = await f.catalog('A');
  assert.equal(checkSelectedSources(selected, latest.reviewedSources).ok, false);
  const result = await f.preview(request);
  assert.equal(result.status, 409);
  assert.doesNotMatch(JSON.stringify(result.body), /re-reviewed-current/);
  assert.equal(f.writes, 0);
});

test('another owner source cannot be smuggled into a previously valid local selection', async t => {
  const f = await fixture(t);
  const b = await f.catalog('B');
  const selected = selectInOrder(b, [IDs[2]]);
  const request = prepareSelectionRequest({
    selected, currentSources: b.reviewedSources, multiSourceApi: true, mode: 'local',
  });
  const denied = await f.preview(request, 'A');
  assert.equal(denied.status, 409);
  assert.doesNotMatch(JSON.stringify(denied.body), /confidential-owner-B|Synthetic confidential/);
  assert.equal(f.writes, 0);
});
