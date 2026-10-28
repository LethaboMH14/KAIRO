import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {finalErrorHandler} from '../server/error-handler.mjs';

// Mounts routes on a throwaway app with the shared final handler, listening on an ephemeral port.
async function withApp(mount, run) {
  const app = express();
  mount(app);
  app.use(finalErrorHandler);
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

async function expectError(base, path, init, status, error) {
  const response = await fetch(`${base}${path}`, init);
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), {error});
}

const throwing = value => app => app.get('/throw', () => { throw value; });

test('a thrown status 404 is reported as Not found with the fixed body', async () => {
  await withApp(throwing({status: 404, message: '/srv/private/path'}), base =>
    expectError(base, '/throw', {}, 404, 'Not found.'));
});

test('a numeric statusCode in the 4xx range uses the generic 4xx message', async () => {
  await withApp(throwing({statusCode: 409}), base =>
    expectError(base, '/throw', {}, 409, 'Request could not be completed.'));
});

test('a thrown status 422 uses the generic 4xx message', async () => {
  await withApp(throwing({status: 422}), base =>
    expectError(base, '/throw', {}, 422, 'Request could not be completed.'));
});

test('a thrown status 503 is reported as a generic 5xx', async () => {
  await withApp(throwing({status: 503}), base =>
    expectError(base, '/throw', {}, 503, 'Something went wrong.'));
});

test('a string status is not trusted and becomes 500', async () => {
  await withApp(throwing({status: '404'}), base =>
    expectError(base, '/throw', {}, 500, 'Something went wrong.'));
});

test('an out-of-range status is not trusted and becomes 500', async () => {
  await withApp(throwing({status: 700}), base =>
    expectError(base, '/throw', {}, 500, 'Something went wrong.'));
});

test('a plain Error becomes 500 without leaking its message or stack', async () => {
  await withApp(throwing(new Error('secret failure at /srv/private/db.sqlite')), base =>
    expectError(base, '/throw', {}, 500, 'Something went wrong.'));
});

test('a response already sent is left intact when next(err) is called', async () => {
  await withApp(app => app.get('/sent', (_req, res, next) => {
    res.status(200).send('ok');
    next(new Error('late failure'));
  }), async base => {
    const response = await fetch(`${base}/sent`);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'ok');
  });
});

test('malformed JSON is reported as 400 Request could not be read.', async () => {
  await withApp(app => app.post('/json', express.json({limit: '10b'}), (_req, res) => res.json({ok: true})), base =>
    expectError(base, '/json', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: '{"a":',
    }, 400, 'Request could not be read.'));
});

test('an oversized JSON body is reported as 413 Request too large.', async () => {
  await withApp(app => app.post('/json', express.json({limit: '10b'}), (_req, res) => res.json({ok: true})), base =>
    expectError(base, '/json', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({text: 'this body is well over ten bytes'}),
    }, 413, 'Request too large.'));
});
