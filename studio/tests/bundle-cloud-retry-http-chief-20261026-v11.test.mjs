import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createBundleLessons} from '../server/bundle-lessons/service.mjs';
import {createModelGateway} from '../server/ai-runtime/gateway.mjs';
import {hash} from '../server/workspace/model.mjs';

// Synthetic authenticated HTTP harness. The real gateway's durable request ledger
// is exercised, but its Google model call is replaced with deterministic source-
// cited content. No network provider, Firebase, or Firestore is involved.
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
      const k = key(uid, kind, id), previous = rows.get(k);
      if (create ? Boolean(previous) : !previous || previous.version !== version) {
        throw Object.assign(new Error('Synthetic CAS conflict'), {status: 409});
      }
      const next = {value: structuredClone(value), version: String(Number(previous?.version ?? 0) + 1)};
      rows.set(k, next);
      return structuredClone(next);
    },
    async remove(uid, kind, id, {version} = {}) {
      const k = key(uid, kind, id), previous = rows.get(k);
      if (!previous || previous.version !== version) {
        throw Object.assign(new Error('Synthetic CAS conflict'), {status: 409});
      }
      rows.delete(k);
    },
  };
  const sourceRefs = ['a', 'b'].map((letter, index) => {
    const sourceId = letter.repeat(24);
    const reviewedPages = [{
      locator: 'Synthetic page ' + (index + 1), edited: false, method: 'pasted-text',
      text: ('Reviewed fictional motor speed and pump comparison passage ' + letter + '. ').repeat(12),
    }];
    const revision = hash(reviewedPages);
    const value = {id: sourceId, title: 'Synthetic source ' + (index + 1),
      reviewed: true, pages: reviewedPages, reviewedPages, revision};
    rows.set(key('owner', 'sources', sourceId), {value: structuredClone(value), version: '1'});
    rows.set(key('owner', 'revisions', sourceId + '_' + revision), {value: structuredClone(value), version: '1'});
    return {sourceId, revision};
  });
  let modelCalls = 0;
  const gateway = createModelGateway({
    repository, env: {KAIRO_CLOUD_ENABLED: '1'},
    googleLesson: async ({evidence}) => {
      modelCalls++;
      const first = evidence[0], second = evidence.find(e => e.sourceId !== first.sourceId) ?? first;
      const supportQuote = first.quote.slice(0, Math.min(120, first.quote.length));
      return {
        title: 'Synthetic reviewed comparison', objective: 'Compare two source excerpts and practise checking citations.',
        chapters: [first, second].map((item, index) => ({
          title: 'Reviewed excerpt ' + (index + 1),
          explanation: item.quote.slice(0, 260),
          example: 'Compare the excerpt to the source before trusting an explanation.',
          citationIds: [item.id],
        })),
        quiz: [{question: 'Which statement is copied from a reviewed excerpt?',
          options: [supportQuote, 'A fabricated option one', 'A fabricated option two', 'A fabricated option three'],
          correct: 0, explanation: 'Only the first option is source-quoted.',
          citationIds: [first.id], supportQuote}],
      };
    },
    googleHelp: async () => {throw new Error('Unexpected studio call');},
  });
  const app = express();
  app.use('/api/workspace', (req, _res, next) => {
    if (req.get('x-synthetic-user') === 'owner') req.kairoIdentity = {uid: 'owner'};
    next();
  }, createBundleLessons({repository, gateway}).router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port + '/api/workspace';
  const request = async (path, {method = 'GET', body} = {}) => {
    const response = await fetch(origin + path, {
      method, headers: {'x-synthetic-user': 'owner', ...(body === undefined ? {} : {'content-type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
    return {status: response.status, data: await response.json()};
  };
  const cloudRequest = {sourceRefs, mode: 'cloud', goal: 'Compare these sources',
    provider: 'google', providerConsent: ['google'], consent: true, requestId: 'retry_cloud_v11_same_key'};
  const dailyKey = 'bundle_daily_' + new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const snapshot = () => ({
    allowance: rows.get(key('owner', 'progress', dailyKey))?.value.count ?? 0,
    lessonIds: [...rows.entries()].filter(([k, row]) =>
      k.startsWith('owner:progress:bundle_') && row.value?.schemaVersion === 2)
      .map(([, row]) => row.value.id),
    modelCalls,
  });
  return {request, cloudRequest, snapshot, close: async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }};
}

test('control: consented cited cloud lesson saves and resumes with one allowance reservation', async () => {
  const h = await harness();
  try {
    const first = await h.request('/bundle-lessons', {method: 'POST', body: h.cloudRequest});
    assert.equal(first.status, 201, JSON.stringify(first.data));
    assert.equal(first.data.record.mode, 'cloud-v2');
    assert.equal(first.data.record.provider, 'google');
    assert.equal(first.data.record.sourceRefs.length, 2);
    assert.equal((await h.request('/bundle-lessons/' + first.data.record.id)).status, 200);
    assert.deepEqual(h.snapshot(), {allowance: 1, lessonIds: [first.data.record.id], modelCalls: 1});
  } finally {await h.close();}
});

test('P0 contract: retrying the same completed cloud request must not duplicate saved lesson or allowance', async () => {
  const h = await harness();
  try {
    const first = await h.request('/bundle-lessons', {method: 'POST', body: h.cloudRequest});
    const second = await h.request('/bundle-lessons', {method: 'POST', body: h.cloudRequest});
    assert.equal(first.status, 201, JSON.stringify(first.data));
    assert.equal(second.status, 201, JSON.stringify(second.data));
    const actual = h.snapshot();
    assert.deepEqual({
      sameSavedLesson: first.data.record.id === second.data.record.id,
      sameVersion: first.data.version === second.data.version,
      allowance: actual.allowance, savedLessonCount: actual.lessonIds.length,
      modelCalls: actual.modelCalls,
    }, {sameSavedLesson: true, sameVersion: true, allowance: 1, savedLessonCount: 1, modelCalls: 1});
  } finally {await h.close();}
});
