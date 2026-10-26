import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createBundleLessons} from '../server/bundle-lessons/service.mjs';
import {hash} from '../server/workspace/model.mjs';

// This is an HTTP contract test, not a Firebase-authentication or live-provider test.
// Synthetic identity is injected only inside this isolated Express fixture.
async function fixture() {
  const rows = new Map();
  const key = (owner, kind, id) => [owner, kind, id].join(':');
  const repository = {
    async get(owner, kind, id) {
      return structuredClone(rows.get(key(owner, kind, id)) ?? null);
    },
    async list(owner, kind) {
      return [...rows.entries()]
        .filter(([entry]) => entry.startsWith(owner + ':' + kind + ':'))
        .map(([, value]) => structuredClone(value));
    },
    async put(owner, kind, id, value, {create = false, version} = {}) {
      const path = key(owner, kind, id);
      const previous = rows.get(path);
      if (create ? Boolean(previous) : !previous || previous.version !== version) {
        throw Object.assign(new Error('Synthetic version conflict'), {status: 409});
      }
      const next = {
        value: structuredClone(value),
        version: String(Number(previous?.version ?? 0) + 1),
      };
      rows.set(path, next);
      return structuredClone(next);
    },
    async remove(owner, kind, id, {version} = {}) {
      const path = key(owner, kind, id);
      if (rows.get(path)?.version !== version) {
        throw Object.assign(new Error('Synthetic version conflict'), {status: 409});
      }
      rows.delete(path);
    },
  };
  const refs = ['a', 'b'].map((character, index) => {
    const sourceId = character.repeat(24);
    const reviewedPages = [{
      locator: 'Synthetic reviewed page ' + (index + 1),
      method: 'pasted-text',
      edited: false,
      text: ('The motor stator field follows the supply frequency. ' +
        'A pump shaft transmits mechanical power; energy also depends on time. ').repeat(12),
    }];
    const revision = hash(reviewedPages);
    const source = {
      id: sourceId,
      title: 'Synthetic engineering source ' + (index + 1),
      reviewed: true,
      reviewedPages,
      pages: reviewedPages,
      revision,
    };
    rows.set(key('owner', 'sources', sourceId), {value: structuredClone(source), version: '1'});
    rows.set(key('owner', 'revisions', sourceId + '_' + revision),
      {value: structuredClone(source), version: '1'});
    return {sourceId, revision};
  });
  const providerRequests = [];
  const gateway = {
    status: () => ({providers: [{id: 'google', configured: true}]}),
    async run(input) {
      providerRequests.push(input);
      const context = input.payload.context;
      assert.equal(input.payload.task, 'help');
      assert.equal(input.uid, 'owner');
      return {
        provider: 'google',
        model: 'synthetic-google-no-network',
        value: input.validate({
          text: 'Use the cited stator excerpt to check the field-speed explanation.',
          citationId: 'P1',
          anchorQuote: context.context.slice(0, 48),
        }),
      };
    },
  };
  const app = express();
  app.use('/api/workspace', (req, _res, next) => {
    const owner = req.get('x-synthetic-owner');
    if (owner === 'owner' || owner === 'other') req.kairoIdentity = {uid: owner};
    next();
  }, createBundleLessons({repository, gateway}).router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port + '/api/workspace';
  async function request(path, {owner = 'owner', method = 'GET', body} = {}) {
    const response = await fetch(origin + path, {
      method,
      headers: {
        'x-synthetic-owner': owner,
        ...(body === undefined ? {} : {'content-type': 'application/json'}),
      },
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });
    return {status: response.status, data: await response.json()};
  }
  function revoke(ref) {
    const path = key('owner', 'sources', ref.sourceId);
    const previous = rows.get(path);
    rows.set(path, {
      value: {...previous.value, reviewed: false},
      version: String(Number(previous.version) + 1),
    });
  }
  return {
    refs, request, revoke, providerRequests,
    async close() {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

function helpRequest(requestId) {
  return {
    studio: 'motor',
    question: 'How does the stator field turn?',
    selectedLabel: 'Stator',
    variables: {frequencyHz: 50, poles: 4, supply: 'normal'},
    consent: true,
    provider: 'google',
    providerConsent: ['google'],
    requestId,
  };
}

test('HTTP reviewed sources -> cited lesson -> studio help -> practice -> resume retains exact evidence identity', async () => {
  const h = await fixture();
  try {
    const created = await h.request('/bundle-lessons', {
      method: 'POST',
      body: {sourceRefs: h.refs, mode: 'local', goal: 'Explain motor stator field speed'},
    });
    assert.equal(created.status, 201);
    const record = created.data.record;
    assert.equal(record.schemaVersion, 2);
    assert.deepEqual(record.sourceRefs, h.refs);

    const helped = await h.request('/bundle-lessons/' + record.id + '/help', {
      method: 'POST', body: helpRequest('studio-help-owner-001'),
    });
    assert.equal(helped.status, 200);
    assert.equal(helped.data.provider, 'google');
    assert.equal(helped.data.model, 'synthetic-google-no-network');
    const provenance = helped.data.provenance;
    assert.equal(provenance.kind, 'bundle');
    assert.equal(provenance.id, record.id);
    assert.equal(provenance.revision, record.bundleRevision);
    const evidence = record.evidence.find(item => item.id === provenance.evidenceId);
    assert.ok(evidence, 'studio evidence ID must resolve in the saved cited lesson');
    assert.equal(provenance.sourceId, evidence.sourceId);
    assert.equal(provenance.sourceRevision, evidence.sourceRevision);
    assert.equal(provenance.locator, evidence.locator);
    assert.ok(evidence.quote.includes(helped.data.anchorQuote));
    assert.ok(h.refs.some(ref =>
      ref.sourceId === provenance.sourceId && ref.revision === provenance.sourceRevision));
    assert.equal(h.providerRequests.length, 1);

    const saved = await h.request('/bundle-lessons/' + record.id + '/work', {
      method: 'POST',
      body: {
        version: null, bundleRevision: record.bundleRevision, step: 0,
        notes: 'I checked the exact cited stator excerpt.',
        answers: [{question: 0, choice: 0}],
      },
    });
    assert.equal(saved.status, 200);
    const resumed = await h.request('/bundle-lessons/' + record.id);
    assert.equal(resumed.status, 200);
    assert.equal(resumed.data.work.notes, 'I checked the exact cited stator excerpt.');
    assert.equal(resumed.data.workVersion, saved.data.workVersion);
  } finally {
    await h.close();
  }
});

test('HTTP studio help refuses foreign owner, missing consent and revoked source before provider invocation', async () => {
  const h = await fixture();
  try {
    const created = await h.request('/bundle-lessons', {
      method: 'POST', body: {sourceRefs: h.refs, mode: 'local'},
    });
    assert.equal(created.status, 201);
    const id = created.data.record.id;
    assert.equal((await h.request('/bundle-lessons/' + id + '/help', {
      owner: 'other', method: 'POST', body: helpRequest('studio-help-foreign-001'),
    })).status, 404);
    assert.equal((await h.request('/bundle-lessons/' + id + '/help', {
      method: 'POST', body: {...helpRequest('studio-help-no-consent'), consent: false},
    })).status, 400);
    assert.equal(h.providerRequests.length, 0);

    h.revoke(h.refs[1]);
    assert.equal((await h.request('/bundle-lessons/' + id + '/help', {
      method: 'POST', body: helpRequest('studio-help-revoked-001'),
    })).status, 409);
    assert.equal((await h.request('/bundle-lessons/' + id)).status, 409);
    const listed = await h.request('/bundle-lessons');
    assert.equal(listed.status, 200);
    assert.equal(listed.data.lessons[0].available, false);
    assert.equal(h.providerRequests.length, 0,
      'no provider invocation may follow owner/review/consent rejection');
  } finally {
    await h.close();
  }
});
