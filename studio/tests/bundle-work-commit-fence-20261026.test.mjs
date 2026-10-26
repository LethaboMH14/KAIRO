import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createBundleLessons} from '../server/bundle-lessons/service.mjs';
import {hash} from '../server/workspace/model.mjs';

// Synthetic owner and source records only; this is not Firebase authentication
// or a Firestore emulator. The mutation occurs at the work-commit boundary.
async function fixture() {
  const rows = new Map();
  const key = (owner, kind, id) => `${owner}:${kind}:${id}`;
  let revokeAfterWorkCommit = false;
  const repository = {
    async get(owner, kind, id) {
      return structuredClone(rows.get(key(owner, kind, id)) ?? null);
    },
    async list(owner, kind) {
      return [...rows.entries()]
        .filter(([k]) => k.startsWith(`${owner}:${kind}:`))
        .map(([, row]) => structuredClone(row));
    },
    async put(owner, kind, id, value, {create = false, version} = {}) {
      const k = key(owner, kind, id), old = rows.get(k);
      if (create ? Boolean(old) : !old || old.version !== version) {
        throw Object.assign(new Error('Synthetic CAS conflict'), {status: 409});
      }
      const saved = {value: structuredClone(value), version: String(Number(old?.version ?? 0) + 1)};
      rows.set(k, saved);
      if (revokeAfterWorkCommit && kind === 'progress' && id.startsWith('bundlework_')) {
        revokeAfterWorkCommit = false;
        const source = rows.get(key(owner, 'sources', 'b'.repeat(24)));
        source.value.reviewed = false;
      }
      return structuredClone(saved);
    },
    async remove(owner, kind, id, {version} = {}) {
      const k = key(owner, kind, id), old = rows.get(k);
      if (!old || old.version !== version) {
        throw Object.assign(new Error('Synthetic CAS conflict'), {status: 409});
      }
      rows.delete(k);
    },
  };
  const refs = ['a', 'b'].map((c, i) => {
    const sourceId = c.repeat(24);
    const reviewedPages = [{
      locator: `Synthetic page ${i + 1}`, method: 'pasted-text', edited: false,
      text: (`Reviewed synthetic motor field and pump lesson evidence ${c}. `).repeat(12),
    }];
    const revision = hash(reviewedPages);
    const source = {id: sourceId, title: `Synthetic source ${i + 1}`,
      reviewed: true, reviewedPages, pages: reviewedPages, revision};
    rows.set(key('owner', 'sources', sourceId), {value: structuredClone(source), version: '1'});
    rows.set(key('owner', 'revisions', sourceId + '_' + revision),
      {value: structuredClone(source), version: '1'});
    return {sourceId, revision};
  });
  const gateway = {
    status: () => ({providers: []}),
    run: async () => {throw new Error('Unexpected provider invocation');},
  };
  const app = express();
  app.use('/api/workspace', (req, _res, next) => {
    if (req.get('x-synthetic-owner') === 'owner') req.kairoIdentity = {uid: 'owner'};
    next();
  }, createBundleLessons({repository, gateway}).router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/workspace`;
  const post = async (path, body) => {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: {'x-synthetic-owner': 'owner', 'content-type': 'application/json'},
      body: JSON.stringify(body),
    });
    return {status: response.status, body: await response.json()};
  };
  const get = async path => {
    const response = await fetch(base + path, {headers: {'x-synthetic-owner': 'owner'}});
    return {status: response.status, body: await response.json()};
  };
  return {
    rows, refs, key, post, get,
    revokeAtNextWorkCommit: () => {revokeAfterWorkCommit = true;},
    close: async () => {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

test('control: a current reviewed lesson saves and resumes one practice attempt', async () => {
  const f = await fixture();
  try {
    const created = await f.post('/bundle-lessons', {sourceRefs: f.refs, mode: 'local'});
    assert.equal(created.status, 201);
    const {id, bundleRevision} = created.body.record;
    const saved = await f.post(`/bundle-lessons/${id}/work`, {
      bundleRevision, version: null, step: 0, notes: 'Synthetic explanation', answers: [],
    });
    assert.equal(saved.status, 200);
    const resumed = await f.get(`/bundle-lessons/${id}`);
    assert.equal(resumed.status, 200);
    assert.equal(resumed.body.work.notes, 'Synthetic explanation');
  } finally {
    await f.close();
  }
});

test('security regression: revocation at practice commit must not retain rejected attempt', async () => {
  const f = await fixture();
  try {
    const created = await f.post('/bundle-lessons', {sourceRefs: f.refs, mode: 'local'});
    assert.equal(created.status, 201);
    const {id, bundleRevision} = created.body.record;
    f.revokeAtNextWorkCommit();
    const attempted = await f.post(`/bundle-lessons/${id}/work`, {
      bundleRevision, version: null, step: 0,
      notes: 'Must never persist when source review is revoked at commit', answers: [],
    });
    assert.equal(attempted.status, 409);
    // Current implementation writes before its final source read. This assertion
    // intentionally fails until the backend uses a genuinely atomic source/work fence.
    assert.equal(f.rows.has(f.key('owner', 'progress', 'bundlework_' + id)), false,
      'A rejected source-stale practice attempt must not survive the failed request');
  } finally {
    await f.close();
  }
});
