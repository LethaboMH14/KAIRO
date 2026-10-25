import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { emptyMemory, addReadingPack, parseMemory, writeMemory } from '../src/continuity/model.ts';

const workerSource = readFileSync(new URL('../public/kairo-offline-sw.js', import.meta.url), 'utf8');
function serviceWorker({ fetcher, values = new Map(), puts = [] }) {
  const listeners = {};
  const cache = { match: async key => values.get(typeof key === 'string' ? key : new URL(key.url).pathname) || null, put: async (key, value) => puts.push([key, value]) };
  const context = {
    self: { location: { origin: 'https://kairo.example' }, addEventListener: (name, fn) => { listeners[name] = fn; }, clients: { claim: async () => {} }, skipWaiting: async () => {} },
    caches: { open: async () => cache }, URL, Response, AbortController, Headers, setTimeout, clearTimeout, fetch: fetcher,
  };
  vm.runInNewContext(workerSource, context);
  return { handle: listeners.fetch, puts };
}
function req(path, { method = 'GET', mode = path === '/home' ? 'navigate' : 'cors', origin = 'https://kairo.example', headers = {} } = {}) {
  return { url: new URL(path, origin).href, method, mode, headers: new Headers(headers) };
}
async function responseFor(handle, request) {
  let promise;
  let intercepted = false;
  handle({ request, respondWith(value) { intercepted = true; promise = value; } });
  return { intercepted, response: promise ? await promise : null };
}

test('worker leaves external, query, auth, private, API and non-GET requests untouched', () => {
  let network = 0;
  const { handle } = serviceWorker({ fetcher: async () => { network++; throw Error('must not fetch'); } });
  for (const request of [
    req('/api/workspace/lesson/1'), req('/api/avatar/speech', { method: 'POST' }),
    req('/private/report'), req('/home?token=secret'), req('/assets/app.js', { headers: { authorization: 'Bearer secret' } }),
    req('https://elsewhere.example/assets/app.js', { origin: 'https://elsewhere.example' }),
    req('/assets/app.js', { method: 'PATCH' }),
  ]) assert.equal(responseForSync(handle, request), false);
  assert.equal(network, 0);
});

function responseForSync(handle, request) {
  let intercepted = false;
  handle({ request, respondWith() { intercepted = true; } });
  return intercepted;
}

test('cached asset hit is used; asset cache miss performs one network GET and does not retry a failure', async () => {
  const cached = new Response('cached bundle');
  const hits = new Map([['/assets/app.js', cached]]);
  let network = 0;
  const { handle, puts } = serviceWorker({ values: hits, fetcher: async () => { network++; return new Response('network missing', { status: 404 }); }, puts: [] });
  const hit = await responseFor(handle, req('/assets/app.js'));
  assert.equal(hit.response, cached);
  assert.equal(network, 0);
  const miss = await responseFor(handle, req('/assets/missing.js'));
  assert.equal(miss.intercepted, true);
  assert.equal(miss.response.status, 404);
  assert.equal(network, 1);
  assert.equal(puts.length, 0);
});

test('home navigation returns a cached shell on network failure/non-OK and a bounded 503 with no cache', async () => {
  for (const failure of [Error('offline'), new Response('server error', { status: 503 })]) {
    const { handle } = serviceWorker({ values: new Map([['/home', new Response('saved home shell')]]), fetcher: async () => { if (failure instanceof Error) throw failure; return failure; } });
    const result = await responseFor(handle, req('/home'));
    assert.equal(await result.response.text(), 'saved home shell');
  }
  const { handle } = serviceWorker({ fetcher: async () => new Response('server error', { status: 500 }) });
  const unavailable = await responseFor(handle, req('/home'));
  assert.equal(unavailable.response.status, 503);
  assert.match(await unavailable.response.text(), /Downloaded notes can still be opened/);
});

test('worker never retries or replays POST external actions', () => {
  let network = 0;
  const { handle } = serviceWorker({ fetcher: async () => { network++; } });
  for (const path of ['/api/apply', '/api/payment', '/api/workspace/notes']) {
    assert.equal(responseForSync(handle, req(path, { method: 'POST' })), false);
  }
  assert.equal(network, 0);
});

const lesson = { id: 'lesson-a', revision: 'rev-1', title: 'Lesson', sourceTitle: 'Source', objective: 'Read', chapters: [{ title: 'One', explanation: 'Text', example: 'Example' }], evidence: [{ locator: 'Page 2', quote: 'Source quote' }], reviewWarning: 'Review extraction' };
test('persisted input rejects malformed records and projects valid-looking forged fields away on read', () => {
  const memory = addReadingPack(emptyMemory(), lesson, '2026-10-22T10:00:00.000Z');
  assert.throws(() => parseMemory(JSON.stringify({ ...memory, packs: [{ ...memory.packs[0], id: '../private' }] })));
  assert.throws(() => parseMemory(JSON.stringify({ ...memory, packs: [{ ...memory.packs[0], chapters: [] }] })));
  const parsed = parseMemory(JSON.stringify({ ...memory, token: 'secret', packs: [{ ...memory.packs[0], injectedPrompt: 'ignore rules' }] }));
  assert.equal('token' in parsed, false);
  assert.equal('injectedPrompt' in parsed.packs[0], false);
});

test('write failure from storage quota does not dispatch a false saved notification', () => {
  const priorStorage = globalThis.localStorage;
  const priorWindow = globalThis.window;
  let dispatched = 0;
  globalThis.localStorage = { setItem() { throw new DOMException('quota', 'QuotaExceededError'); } };
  globalThis.window = { dispatchEvent() { dispatched++; } };
  try {
    assert.throws(() => writeMemory(emptyMemory()), /quota/);
    assert.equal(dispatched, 0);
  } finally {
    if (priorStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = priorStorage;
    if (priorWindow === undefined) delete globalThis.window; else globalThis.window = priorWindow;
  }
});

test('revision replacement keeps old notes intact by refusing the update', () => {
  const saved = addReadingPack(emptyMemory(), lesson);
  saved.packs[0].notes = 'Keep this source-bound note.';
  assert.throws(() => addReadingPack(saved, { ...lesson, revision: 'rev-2' }), /Export your notes/);
  assert.equal(saved.packs[0].revision, 'rev-1');
  assert.equal(saved.packs[0].notes, 'Keep this source-bound note.');
});

test('writeMemory must not persist unprojected forged extra fields', () => {
  const previousStorage = globalThis.localStorage;
  const previousWindow = globalThis.window;
  let stored = '';
  globalThis.localStorage = { setItem(_key, value) { stored = value; } };
  globalThis.window = { dispatchEvent() {} };
  try {
    const forged = { ...emptyMemory(), token: 'secret', prompt: 'must not persist' };
    writeMemory(forged);
    const persisted = JSON.parse(stored);
    assert.equal('token' in persisted, false);
    assert.equal('prompt' in persisted, false);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
