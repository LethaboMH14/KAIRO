import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createBundleLessons} from '../server/bundle-lessons/service.mjs';
import {hash} from '../server/workspace/model.mjs';

// Synthetic HTTP identity middleware is deliberately test-only. Production
// identity comes from Firebase sessionGuard in learner-entry.mjs.
async function harness() {
  const rows = new Map();
  const key = (uid, kind, id) => `${uid}:${kind}:${id}`;
  const repository = {
    async get(uid, kind, id) {
      return structuredClone(rows.get(key(uid, kind, id)) ?? null);
    },
    async list(uid, kind) {
      return [...rows.entries()]
        .filter(([k]) => k.startsWith(`${uid}:${kind}:`))
        .map(([, row]) => structuredClone(row));
    },
    async put(uid, kind, id, value, {create = false, version} = {}) {
      const k = key(uid, kind, id), old = rows.get(k);
      if (create ? Boolean(old) : !old || old.version !== version) {
        throw Object.assign(new Error('Synthetic version conflict'), {status: 409});
      }
      const next = {value: structuredClone(value), version: String(Number(old?.version ?? 0) + 1)};
      rows.set(k, next);
      return structuredClone(next);
    },
    async remove(uid, kind, id, {version} = {}) {
      const k = key(uid, kind, id), old = rows.get(k);
      if (!old || old.version !== version) {
        throw Object.assign(new Error('Synthetic version conflict'), {status: 409});
      }
      rows.delete(k);
      return {removed: true};
    },
  };
  const refs = ['a', 'b'].map((c, index) => {
    const sourceId = c.repeat(24);
    const reviewedPages = [{
      locator: `Synthetic page ${index + 1}`,
      edited: false,
      method: 'pasted-text',
      text: (`Reviewed motor frequency, field speed and pump evidence ${c}. `).repeat(12),
    }];
    const revision = hash(reviewedPages);
    const value = {id: sourceId, title: `Synthetic source ${index + 1}`,
      pages: reviewedPages, reviewed: true, reviewedPages, revision};
    rows.set(key('owner', 'sources', sourceId), {value: structuredClone(value), version: '1'});
    rows.set(key('owner', 'revisions', sourceId + '_' + revision), {value: structuredClone(value), version: '1'});
    return {sourceId, revision};
  });
  let providerCalls = 0;
  const gateway = {
    status: () => ({providers: []}),
    run: async () => {providerCalls++; throw new Error('Unexpected provider call');},
  };
  const app = express();
  app.use('/api/workspace', (req, _res, next) => {
    const uid = req.get('x-synthetic-user');
    if (uid === 'owner' || uid === 'other') req.kairoIdentity = {uid};
    next();
  }, createBundleLessons({repository, gateway}).router);
  app.get('/api/workspace/catalog', (_req, res) => res.json({legacy: true}));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}/api/workspace`;
  const request = async (path, {uid = 'owner', method = 'GET', body} = {}) => {
    const response = await fetch(origin + path, {
      method,
      headers: {'x-synthetic-user': uid, ...(body === undefined ? {} : {'content-type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
    return {status: response.status, headers: response.headers, data: await response.json()};
  };
  return {
    refs, rows, key, request,
    providerCalls: () => providerCalls,
    close: async () => {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

test('authenticated synthetic HTTP journey saves cited v2 lesson, edits wording, practices and resumes', async () => {
  const h = await harness();
  try {
    const created = await h.request('/bundle-lessons', {
      method: 'POST', body: {sourceRefs: h.refs, mode: 'local', goal: 'Explain field speed'},
    });
    assert.equal(created.status, 201);
    assert.equal(created.headers.get('cache-control'), 'no-store');
    const {record, version} = created.data;
    assert.equal(record.schemaVersion, 2);
    assert.deepEqual(record.sourceRefs, h.refs);
    assert.ok(record.evidence.length >= 2);
    assert.deepEqual(new Set(record.evidence.map(e => e.sourceId)), new Set(h.refs.map(r => r.sourceId)));
    assert.ok(record.evidence.every(e => h.refs.some(r => r.sourceId === e.sourceId && r.revision === e.sourceRevision)));

    const edit = await h.request(`/bundle-lessons/${record.id}/edit`, {
      method: 'POST', body: {version, content: {...record, title: 'My revised motor explanation'}},
    });
    assert.equal(edit.status, 200);
    assert.equal(edit.data.record.title, 'My revised motor explanation');
    assert.deepEqual(edit.data.record.evidence, record.evidence);

    const choice = 0;
    const work = await h.request(`/bundle-lessons/${record.id}/work`, {
      method: 'POST', body: {bundleRevision: record.bundleRevision, version: null,
        step: 0, notes: 'I compared both reviewed sources.',
        answers: [{question: 0, choice, correct: !(choice === record.quiz[0].correct)}]},
    });
    assert.equal(work.status, 200);
    assert.equal(work.data.work.answers[0].correct, choice === record.quiz[0].correct);
    const resumed = await h.request(`/bundle-lessons/${record.id}`);
    assert.equal(resumed.status, 200);
    assert.equal(resumed.data.record.title, 'My revised motor explanation');
    assert.equal(resumed.data.work.notes, 'I compared both reviewed sources.');
    assert.equal(resumed.data.workVersion, work.data.workVersion);
    assert.equal((await h.request('/bundle-lessons')).data.lessons[0].available, true);
    assert.equal(h.providerCalls(), 0);
  } finally {
    await h.close();
  }
});

test('HTTP resume denies foreign owner and fails closed on reviewed source revocation', async () => {
  const h = await harness();
  try {
    const created = await h.request('/bundle-lessons', {
      method: 'POST', body: {sourceRefs: h.refs, mode: 'local'},
    });
    assert.equal(created.status, 201);
    const {id, bundleRevision} = created.data.record;
    assert.equal((await h.request(`/bundle-lessons/${id}`, {uid: 'other'})).status, 404);
    assert.deepEqual((await h.request('/bundle-lessons', {uid: 'other'})).data.lessons, []);
    assert.equal((await h.request('/bundle-lessons', {
      uid: 'other', method: 'POST', body: {sourceRefs: h.refs, mode: 'local'},
    })).status, 409);
    const first = await h.request(`/bundle-lessons/${id}/work`, {
      method: 'POST', body: {bundleRevision, version: null, step: 0, notes: 'First', answers: []},
    });
    assert.equal(first.status, 200);
    const stale = await h.request(`/bundle-lessons/${id}/work`, {
      method: 'POST', body: {bundleRevision, version: null, step: 0, notes: 'Stale', answers: []},
    });
    assert.equal(stale.status, 409);
    assert.equal((await h.request(`/bundle-lessons/${id}`)).data.work.notes, 'First');

    const source = h.rows.get(h.key('owner', 'sources', h.refs[1].sourceId));
    source.value.reviewed = false;
    assert.equal((await h.request(`/bundle-lessons/${id}`)).status, 409);
    assert.equal((await h.request(`/bundle-lessons/${id}/work`, {
      method: 'POST', body: {bundleRevision, version: first.data.workVersion,
        step: 0, notes: 'Should not save', answers: []},
    })).status, 409);
    const listing = await h.request('/bundle-lessons');
    assert.equal(listing.status, 200);
    assert.equal(listing.data.lessons[0].available, false);
    assert.equal(h.providerCalls(), 0);
  } finally {
    await h.close();
  }
});

test('HTTP route rejects absent identity, unconsented cloud, duplicate sources and leaves legacy catalog alone', async () => {
  const h = await harness();
  try {
    assert.equal((await h.request('/bundle-lessons', {uid: 'anonymous'})).status, 401);
    assert.equal((await h.request('/bundle-lessons', {
      method: 'POST', body: {sourceRefs: h.refs, mode: 'cloud', provider: 'google', consent: false},
    })).status, 400);
    assert.equal((await h.request('/bundle-lessons', {
      method: 'POST', body: {sourceRefs: [h.refs[0], h.refs[0]], mode: 'local'},
    })).status, 400);
    assert.deepEqual((await h.request('/catalog')).data, {legacy: true});
    assert.equal(h.rows.has(h.key('owner', 'progress', 'bundle_daily_' +
      new Date().toISOString().slice(0, 10).replaceAll('-', ''))), false);
    assert.equal(h.providerCalls(), 0);
  } finally {
    await h.close();
  }
});
