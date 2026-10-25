import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server, AccountBoundary, storage;

test('load actual AccountBoundary and storage modules through Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    ({ default: AccountBoundary } = await server.ssrLoadModule('/src/account/AccountBoundary.tsx'));
    storage = await server.ssrLoadModule('/src/account/storage.ts');
  } catch (error) { await server.close(); throw error; }
});

const response = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function rig({ initial = {}, fetch: fetchImpl } = {}) {
  const before = { fetch: globalThis.fetch, window: globalThis.window, localStorage: globalThis.localStorage, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  const values = new Map(Object.entries(initial));
  const store = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
  };
  const listeners = new Map();
  const timers = new Map();
  const calls = [];
  let nextTimer = 1;
  const win = {
    confirm() { return false; }, location: { reload() {} },
    addEventListener(type, callback) { const set = listeners.get(type) || new Set(); set.add(callback); listeners.set(type, set); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    dispatchEvent(event) { for (const listener of listeners.get(event.type) || []) listener(event); return true; },
  };
  globalThis.localStorage = store;
  globalThis.window = win;
  globalThis.setTimeout = (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, delay }); return id; };
  globalThis.clearTimeout = id => timers.delete(id);
  globalThis.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return fetchImpl ? fetchImpl(String(url), init, calls) : response(404); };
  storage.configureLearnerStorage(null);

  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const slots = [], cleanups = [];
  let hookIndex = 0, effectsMounted = false, tree;
  const dispatcher = {
    useState(initialValue) {
      const index = hookIndex++;
      if (!(index in slots)) slots[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useEffect(effect) {
      hookIndex++;
      if (!effectsMounted) cleanups.push(effect());
    },
  };
  const update = () => {
    hookIndex = 0;
    internals.H = dispatcher;
    try { tree = AccountBoundary({ children: React.createElement('div', { id: 'my-work' }, 'My work') }); }
    finally { internals.H = null; }
    effectsMounted = true;
    return tree;
  };
  const runTimers = async (delay = 1500) => {
    const due = [...timers.entries()].filter(([, timer]) => timer.delay === delay);
    for (const [id, timer] of due) { timers.delete(id); timer.fn(); }
    await flush();
  };
  let unmounted = false;
  const unmount = () => {
    if (unmounted) return;
    unmounted = true;
    for (const cleanup of cleanups) cleanup?.();
    cleanups.length = 0;
  };
  const close = () => {
    unmount();
    storage.configureLearnerStorage(null);
    globalThis.fetch = before.fetch;
    globalThis.window = before.window;
    globalThis.localStorage = before.localStorage;
    globalThis.setTimeout = before.setTimeout;
    globalThis.clearTimeout = before.clearTimeout;
  };
  update();
  return { update, runTimers, unmount, close, values, store, calls, timers, window: win, get tree() { return tree; } };
}

test('SSR shows an opening status before effects finish', () => {
  const markup = renderToStaticMarkup(React.createElement(AccountBoundary, { children: React.createElement('p', null, 'My work') }));
  assert.match(markup, /Opening your learning space/);
  assert.match(markup, /role="status"/);
});

test('local preview keeps the legacy unscoped record and does not request remote progress', async () => {
  const h = rig({ initial: { 'kairo-note': 'legacy local note' }, fetch: async url => url.endsWith('/api/account/status') ? response(200, { enabled: false, status: 'guest', scopeLabel: 'local preview' }) : response(500) });
  try {
    await flush(); h.update();
    storage.configureLearnerStorage(null);
    assert.equal(storage.learnerStorage.getItem('kairo-note'), 'legacy local note');
    assert.equal(h.calls.filter(call => call.url.includes('/progress/')).length, 0);
    assert.match(renderToStaticMarkup(h.tree), /My work/);
  } finally { h.close(); }
});

test('hosted signed-out guest never reads legacy unscoped work', async () => {
  const h = rig({ initial: { 'kairo-note': 'old learner text' }, fetch: async url => url.endsWith('/api/account/status') ? response(200, { enabled: true, status: 'signed-out', scopeLabel: 'guest workspace' }) : response(500) });
  try {
    await flush(); h.update();
    assert.equal(storage.learnerStorage.getItem('kairo-note'), null);
    assert.deepEqual(storage.learningSnapshot(), {});
    assert.equal(h.calls.filter(call => call.url.includes('/progress/')).length, 0);
    assert.equal(h.values.get('kairo-note'), 'old learner text');
  } finally { h.close(); }
});

test('signed-in empty scope hydrates only its remote snapshot and preserves legacy data', async () => {
  const keyA = 'a'.repeat(64), keyB = 'b'.repeat(64);
  const h = rig({ initial: { 'kairo-note': 'legacy note' }, fetch: async url => url.endsWith('/api/account/status') ? response(200, { enabled: true, status: 'signed-in', storageKey: keyA, scopeLabel: 'account progress' }) : response(200, { version: 'v-A1', value: { snapshot: { note: 'remote A' } } }) });
  try {
    await flush(); h.update();
    assert.deepEqual(storage.learningSnapshot(), { note: 'remote A' });
    assert.equal(storage.syncMarker(), 'v-A1');
    assert.equal(h.values.get('kairo-note'), 'legacy note');
    storage.configureLearnerStorage(keyB);
    assert.deepEqual(storage.learningSnapshot(), {});
  } finally { h.close(); }
});

test('failed remote progress read leaves signed-in work in that account scope, not guest scope', async () => {
  const keyA = 'a'.repeat(64);
  const h = rig({ fetch: async url => url.endsWith('/api/account/status') ? response(200, { enabled: true, status: 'signed-in', storageKey: keyA, scopeLabel: 'account progress' }) : response(503) });
  try {
    storage.configureLearnerStorage(keyA); storage.learnerStorage.setItem('note', 'account-only pending work');
    await flush(); h.update();
    assert.deepEqual(storage.learningSnapshot(), { note: 'account-only pending work' });
    storage.configureLearnerStorage('guest');
    assert.deepEqual(storage.learningSnapshot(), {});
    assert.match(renderToStaticMarkup(h.tree), /could not be checked/);
    assert.equal(h.calls.filter(call => call.init.method === 'PUT').length, 0);
  } finally { h.close(); }
});

test('same saved marker and unchanged remote version allow this device edits to save conditionally', async () => {
  const keyA = 'a'.repeat(64), putCalls = [];
  const h = rig({ fetch: async (url, init) => {
    if (url.endsWith('/api/account/status')) return response(200, { enabled: true, status: 'signed-in', storageKey: keyA, scopeLabel: 'account progress' });
    if (init.method === 'PUT') { putCalls.push({ body: JSON.parse(init.body), signal: init.signal }); return response(200, { version: 'v-A2' }); }
    return response(200, { version: 'v-A1', value: { snapshot: { note: 'account value' } } });
  } });
  try {
    storage.configureLearnerStorage(keyA);
    storage.learnerStorage.setItem('note', 'own pending edit');
    storage.markSynced('v-A1');
    await flush(); h.update();
    await h.runTimers();
    assert.equal(putCalls.length, 1);
    assert.equal(putCalls[0].body.version, 'v-A1');
    assert.equal(putCalls[0].body.create, undefined);
    assert.deepEqual(putCalls[0].body.value.snapshot, { note: 'own pending edit' });
    assert.equal(storage.syncMarker(), 'v-A2');
  } finally { h.close(); }
});

test('changed remote version reports conflict and preserves the local copy', async () => {
  const keyA = 'a'.repeat(64), puts = [];
  const h = rig({ fetch: async (url, init) => {
    if (url.endsWith('/api/account/status')) return response(200, { enabled: true, status: 'signed-in', storageKey: keyA, scopeLabel: 'account progress' });
    if (init.method === 'PUT') { puts.push(init); return response(200, { version: 'unexpected' }); }
    return response(200, { version: 'v-A2', value: { snapshot: { note: 'new cloud copy' } } });
  } });
  try {
    storage.configureLearnerStorage(keyA); storage.learnerStorage.setItem('note', 'keep local copy'); storage.markSynced('v-A1');
    await flush(); h.update();
    assert.deepEqual(storage.learningSnapshot(), { note: 'keep local copy' });
    assert.match(renderToStaticMarkup(h.tree), /different progress from your account/);
    const useCloud = find(h.tree, node => node.type === 'button' && node.props.children === 'Use account copy');
    assert.ok(useCloud);
    useCloud.props.onClick(); h.update();
    assert.deepEqual(storage.learningSnapshot(), { note: 'keep local copy' });
    assert.deepEqual(puts, []);
  } finally { h.close(); }
});

function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}

test('cleanup aborts a late remote hydration without restoring into storage', async () => {
  const keyA = 'a'.repeat(64), progress = deferred();
  let progressSignal;
  const h = rig({ fetch: async (url, init) => {
    if (url.endsWith('/api/account/status')) return response(200, { enabled: true, status: 'signed-in', storageKey: keyA, scopeLabel: 'account progress' });
    progressSignal = init.signal;
    return progress.promise;
  } });
  await flush();
  assert.equal(h.calls.filter(call => call.url.includes('/progress/')).length, 1);
  h.unmount();
  progress.resolve(response(200, { version: 'v-late', value: { snapshot: { note: 'late cloud data' } } }));
  await flush();
  assert.equal(progressSignal.aborted, true);
  assert.deepEqual(storage.learningSnapshot(), {});
  h.close();
});

test('cleanup aborts a pending save and a late save response cannot set the account sync marker', async () => {
  const keyA = 'a'.repeat(64), save = deferred();
  let saveSignal;
  const h = rig({ fetch: async (url, init) => {
    if (url.endsWith('/api/account/status')) return response(200, { enabled: true, status: 'signed-in', storageKey: keyA, scopeLabel: 'account progress' });
    if (init.method === 'PUT') { saveSignal = init.signal; return save.promise; }
    return response(404);
  } });
  storage.configureLearnerStorage(keyA); storage.learnerStorage.setItem('note', 'local work');
  try {
    await flush();
    await h.runTimers();
    assert.equal(h.calls.filter(call => call.init.method === 'PUT').length, 1);
    h.unmount();
    save.resolve(response(200, { version: 'v-late-save' }));
    await flush();
    assert.equal(saveSignal.aborted, true);
    assert.equal(storage.syncMarker(), null);
  } finally { h.close(); }
});

test.after(async () => { await server?.close(); });
