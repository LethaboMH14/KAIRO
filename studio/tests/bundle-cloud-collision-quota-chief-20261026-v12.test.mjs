import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createBundleLessons} from '../server/bundle-lessons/service.mjs';
import {createModelGateway} from '../server/ai-runtime/gateway.mjs';
import {hash} from '../server/workspace/model.mjs';

// Synthetic HTTP test of the real service and gateway ledger, with only the
// external Google completion replaced. No live account/provider/Firestore.
async function harness() {
  const rows = new Map();
  const key = (uid, kind, id) => uid + ':' + kind + ':' + id;
  const repository = {
    async get(uid, kind, id) {
      return structuredClone(rows.get(key(uid, kind, id)) ?? null);
    },
    async list(uid, kind) {
      return [...rows.entries()].filter(([k]) => k.startsWith(uid + ':' + kind + ':'))
        .map(([, row]) => structuredClone(row));
    },
    async put(uid, kind, id, value, {create = false, version} = {}) {
      const k = key(uid, kind, id), old = rows.get(k);
      if (create ? Boolean(old) : !old || old.version !== version) {
        throw Object.assign(new Error('Synthetic CAS conflict'), {status: 409});
      }
      const next = {value: structuredClone(value), version: String(Number(old?.version ?? 0) + 1)};
      rows.set(k, next);
      return structuredClone(next);
    },
    async remove(uid, kind, id, {version} = {}) {
      const k = key(uid, kind, id), old = rows.get(k);
      if (!old || old.version !== version) throw Object.assign(new Error('CAS conflict'), {status: 409});
      rows.delete(k);
    },
  };
  const refs = ['a', 'b'].map((letter, i) => {
    const sourceId = letter.repeat(24);
    const reviewedPages = [{
      locator: 'Synthetic page ' + (i + 1), method: 'pasted-text', edited: false,
      text: ('Synthetic reviewed motor field and pump speed material ' + letter + '. ').repeat(12),
    }];
    const revision = hash(reviewedPages);
    const source = {id: sourceId, title: 'Synthetic source ' + letter,
      reviewed: true, pages: reviewedPages, reviewedPages, revision};
    rows.set(key('owner', 'sources', sourceId), {value: structuredClone(source), version: '1'});
    rows.set(key('owner', 'revisions', sourceId + '_' + revision), {value: structuredClone(source), version: '1'});
    return {sourceId, revision};
  });
  let modelCalls = 0;
  const gateway = createModelGateway({
    repository, env: {KAIRO_CLOUD_ENABLED: '1'},
    googleLesson: async ({evidence}) => {
      modelCalls++;
      const first = evidence[0], second = evidence.find(e => e.sourceId !== first.sourceId) ?? first;
      const quote = first.quote.slice(0, Math.min(120, first.quote.length));
      return {
        title: 'Synthetic citation lesson', objective: 'Compare two reviewed passages.',
        chapters: [first, second].map((e, i) => ({
          title: 'Reviewed excerpt ' + (i + 1), explanation: e.quote.slice(0, 260),
          example: 'Compare each passage with its reviewed source.', citationIds: [e.id],
        })),
        quiz: [{question: 'Which answer comes from the reviewed source?',
          options: [quote, 'Invented answer one', 'Invented answer two', 'Invented answer three'],
          correct: 0, explanation: 'The first answer is a source quote.',
          citationIds: [first.id], supportQuote: quote}],
      };
    },
    googleHelp: async () => {throw new Error('No studio provider call expected');},
  });
  const app = express();
  app.use('/api/workspace', (req, _res, next) => {
    if (req.get('x-synthetic-user') === 'owner') req.kairoIdentity = {uid: 'owner'};
    next();
  }, createBundleLessons({repository, gateway}).router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port + '/api/workspace';
  const request = async (path, body) => {
    const response = await fetch(origin + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {'x-synthetic-user': 'owner',
        ...(body === undefined ? {} : {'content-type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
    return {status: response.status, data: await response.json()};
  };
  const input = {sourceRefs: refs, mode: 'cloud', goal: 'Compare these two sources',
    provider: 'google', providerConsent: ['google'], consent: true,
    requestId: 'collision_cloud_v12_key'};
  const snapshot = () => {
    const day = 'bundle_daily_' + new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return {
      allowance: rows.get(key('owner', 'progress', day))?.value.count ?? 0,
      lessonIds: [...rows.entries()].filter(([k, row]) =>
        k.startsWith('owner:progress:bundle_') && row.value?.schemaVersion === 2)
        .map(([, row]) => row.value.id),
      modelCalls,
    };
  };
  return {input, refs, request, snapshot, close: async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }};
}

test('control: consented cloud lesson preserves both reviewed source revisions and resumes', async () => {
  const h = await harness();
  try {
    const result = await h.request('/bundle-lessons', h.input);
    assert.equal(result.status, 201, JSON.stringify(result.data));
    assert.deepEqual(result.data.record.sourceRefs, h.refs);
    assert.equal(new Set(result.data.record.evidence.map(e => e.sourceId)).size, 2);
    assert.ok(result.data.record.evidence.every(e =>
      h.refs.some(r => r.sourceId === e.sourceId && r.revision === e.sourceRevision)));
    assert.equal((await h.request('/bundle-lessons/' + result.data.record.id)).status, 200);
    assert.deepEqual(h.snapshot(), {allowance: 1, lessonIds: [result.data.record.id], modelCalls: 1});
  } finally {await h.close();}
});

test('P0 contract: requestId collisions with changed goal or source order reject without allowance debit', async () => {
  const h = await harness();
  try {
    const first = await h.request('/bundle-lessons', h.input);
    assert.equal(first.status, 201, JSON.stringify(first.data));
    const changedGoal = await h.request('/bundle-lessons',
      {...h.input, goal: 'A different learning objective'});
    const changedOrder = await h.request('/bundle-lessons',
      {...h.input, sourceRefs: [...h.refs].reverse()});
    assert.equal(changedGoal.status, 409, JSON.stringify(changedGoal.data));
    assert.equal(changedOrder.status, 409, JSON.stringify(changedOrder.data));
    assert.deepEqual(h.snapshot(), {
      allowance: 1, lessonIds: [first.data.record.id], modelCalls: 1,
    }, 'Rejected request-ID collisions must not spend a lesson allowance or persist another lesson.');
  } finally {await h.close();}
});
