import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createAiService } from '../server/ai-runtime/service.mjs';
import { createGroqTranscriber, MAX_AUDIO_BYTES } from '../server/listening-core/transcription.mjs';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
let vite;
let ListeningQuestion;

before(async () => {
  const hookId = '\0listening-audit-hooks';
  vite = await createServer({
    root: studioRoot,
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{
      name: 'listening-audit-hook-adapter',
      enforce: 'pre',
      resolveId(id) { if (id === 'listening-audit-hooks') return hookId; },
      load(id) {
        if (id === hookId) return `export const useState=(v)=>globalThis.__listeningAuditHooks.state(v);export const useRef=(v)=>globalThis.__listeningAuditHooks.ref(v);export const useEffect=(f,d)=>globalThis.__listeningAuditHooks.effect(f,d);export const useId=()=>globalThis.__listeningAuditHooks.id();`;
      },
      transform(code, id) {
        const path = id.replaceAll('\\', '/');
        if (path.endsWith('/src/ai-personalisation/ListeningQuestion.tsx') || path.endsWith('/src/language-capability-ui/LanguageCapabilityNotice.tsx')) return code.replace("from 'react'", "from 'listening-audit-hooks'");
      },
    }, reactPlugin()],
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  });
  ({ default: ListeningQuestion } = await vite.ssrLoadModule('/src/ai-personalisation/ListeningQuestion.tsx'));
});

after(async () => { await vite?.close(); });

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

const flush = async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); };

function makeHarness({ transcribe = () => deferred().promise, enabled = true } = {}) {
  const original = { fetch: globalThis.fetch, hooks: globalThis.__listeningAuditHooks };
  const requests = [];
  const typed = [];
  const hook = { slots: [], effects: [], nextEffects: [], cursor: 0, idCounter: 0 };
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url) === '/api/workspace/ai/status') return { json: async () => ({ providers: [{ id: 'groq', configured: enabled }] }) };
    if (String(url) === '/api/workspace/listening') {
      const answer = transcribe(url, init);
      return answer;
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  };
  globalThis.__listeningAuditHooks = {
    state(initial) {
      const index = hook.cursor++;
      if (!(index in hook.slots)) hook.slots[index] = typeof initial === 'function' ? initial() : initial;
      return [hook.slots[index], value => { hook.slots[index] = typeof value === 'function' ? value(hook.slots[index]) : value; }];
    },
    ref(initial) {
      const index = hook.cursor++;
      if (!(index in hook.slots)) hook.slots[index] = { current: initial };
      return hook.slots[index];
    },
    effect(effect, deps) {
      const index = hook.cursor++;
      const prior = hook.effects[index];
      if (!prior || !deps || deps.some((value, i) => !Object.is(value, prior.deps?.[i]))) hook.nextEffects.push(() => {
        prior?.cleanup?.();
        hook.effects[index] = { deps, cleanup: effect() };
      });
    },
    id() { return `:listening-audit-${hook.idCounter++}:`; },
  };
  function expand(node) {
    if (Array.isArray(node)) return node.map(expand);
    if (!React.isValidElement(node)) return node;
    if (typeof node.type === 'function') return expand(node.type(node.props));
    const children = node.props.children;
    return React.cloneElement(node, node.props, ...(Array.isArray(children) ? children.map(expand) : children === undefined ? [] : [expand(children)]));
  }
  function render() {
    hook.cursor = 0;
    const tree = ListeningQuestion({ onQuestion: text => requests.push({ submittedQuestion: text }), onUseTyped: () => typed.push('focus') });
    const expanded = expand(tree);
    while (hook.nextEffects.length) hook.nextEffects.shift()();
    return expanded;
  }
  function unmount() {
    for (const effect of hook.effects) effect?.cleanup?.();
    hook.effects.length = 0;
  }
  function close() {
    unmount();
    globalThis.fetch = original.fetch;
    if (original.hooks === undefined) delete globalThis.__listeningAuditHooks;
    else globalThis.__listeningAuditHooks = original.hooks;
  }
  return { render, unmount, close, requests, typed };
}

function walk(node, predicate, result = []) {
  if (!node || typeof node !== 'object') return result;
  if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node);
    walk(node.props.children, predicate, result);
  } else if (Array.isArray(node)) node.forEach(child => walk(child, predicate, result));
  return result;
}
const text = node => !node ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'string' || typeof node === 'number' ? String(node) : React.isValidElement(node) ? text(node.props.children) : '';
const button = (tree, label) => walk(tree, node => node.type === 'button' && text(node.props.children).trim() === label)[0];
const input = (tree, type) => walk(tree, node => node.type === 'input' && node.props.type === type)[0];
const textarea = tree => walk(tree, node => node.type === 'textarea')[0];

async function enable(h) { h.render(); await flush(); return h.render(); }
function chooseFile(tree, file) { walk(tree, node => node.type === 'input' && node.props.type === 'file')[0].props.onChange({ target: { files: [file] } }); }
function consent(tree, checked) { input(tree, 'checkbox').props.onChange({ target: { checked } }); }
function start(h, file = new Blob([new Uint8Array([1])], { type: 'audio/wav' })) {
  let tree = h.render(); chooseFile(tree, file); tree = h.render(); consent(tree, true); tree = h.render(); button(tree, 'Transcribe').props.onClick(); return h.render();
}

test('actual listening UI labels requested language unverified and does not open a microphone', async () => {
  const h = makeHarness();
  try {
    const tree = await enable(h);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /No microphone is opened/);
    assert.match(html, /Requested language/);
    assert.match(html, /isiZulu · unverified/);
    assert.match(html, /Use a recorded voice question/);
  } finally { h.close(); }
});

test('revoking consent aborts the in-flight UI request and ignores its late response', async () => {
  const request = deferred();
  const h = makeHarness({ transcribe: () => request.promise });
  try {
    let tree = await enable(h);
    tree = start(h);
    const sent = h.requests.find(item => item.url === '/api/workspace/listening');
    assert.ok(sent);
    assert.equal(sent.init.headers['X-Kairo-Consent'], 'groq');
    consent(tree, false);
    tree = h.render();
    assert.equal(sent.init.signal.aborted, true);
    request.resolve({ ok: true, json: async () => ({ text: 'late synthetic response', sourceLabel: 'uploaded-file', locale: 'unknown', localeStatus: 'unknown' }) });
    await flush();
    tree = h.render();
    assert.match(renderToStaticMarkup(tree), /Transcription cancelled and transcript cleared/);
    assert.equal(h.requests.some(item => item.submittedQuestion), false);
  } finally { h.close(); }
});

test('replacing a selected recording clears consent and requires a fresh choice', async () => {
  const h = makeHarness();
  try {
    let tree = await enable(h);
    chooseFile(tree, new Blob([new Uint8Array([1])], { type: 'audio/wav' }));
    tree = h.render();
    consent(tree, true);
    tree = h.render();
    chooseFile(tree, new Blob([new Uint8Array([2])], { type: 'audio/wav' }));
    tree = h.render();
    assert.equal(input(tree, 'checkbox').props.checked, false);
    assert.equal(button(tree, 'Transcribe').props.disabled, true);
    consent(tree, true);
    tree = h.render();
    assert.equal(button(tree, 'Transcribe').props.disabled, false);
  } finally { h.close(); }
});

test('empty file is blocked locally with a clear message and no route request', async () => {
  const h = makeHarness();
  try {
    let tree = await enable(h);
    chooseFile(tree, new Blob([], { type: 'audio/wav' }));
    tree = h.render();
    consent(tree, true);
    tree = h.render();
    assert.equal(button(tree, 'Transcribe').props.disabled, true);
    assert.match(renderToStaticMarkup(tree), /recording is empty/i);
    // Call the handler directly as an adversarial check of the start guard,
    // even though a browser would suppress clicks on a disabled button.
    button(tree, 'Transcribe').props.onClick();
    assert.equal(h.requests.some(item => item.url === '/api/workspace/listening'), false);
  } finally { h.close(); }
});

test('oversized recording is blocked by the actual UI before a request', async () => {
  const h = makeHarness();
  try {
    let tree = await enable(h);
    chooseFile(tree, new Blob([new Uint8Array(MAX_AUDIO_BYTES + 1)], { type: 'audio/wav' }));
    tree = h.render();
    consent(tree, true);
    tree = h.render();
    assert.equal(button(tree, 'Transcribe').props.disabled, true);
    assert.match(renderToStaticMarkup(tree), /smaller than 8 MB/);
    assert.equal(h.requests.some(item => item.url === '/api/workspace/listening'), false);
  } finally { h.close(); }
});

test('route unmount aborts pending transcription and a late response cannot submit text', async () => {
  const request = deferred();
  const h = makeHarness({ transcribe: () => request.promise });
  try {
    await enable(h);
    start(h);
    const sent = h.requests.find(item => item.url === '/api/workspace/listening');
    h.unmount();
    assert.equal(sent.init.signal.aborted, true);
    request.resolve({ ok: true, json: async () => ({ text: 'late synthetic response', sourceLabel: 'uploaded-file', locale: 'unknown', localeStatus: 'unknown' }) });
    await flush();
    assert.equal(h.requests.some(item => item.submittedQuestion), false);
  } finally { h.close(); }
});

test('wrong response language is rejected by the actual component state and cannot be submitted', async () => {
  const h = makeHarness({ transcribe: async () => ({ ok: true, json: async () => ({ text: 'synthetic result', sourceLabel: 'uploaded-file', locale: 'zu', localeStatus: 'requested-not-validated' }) }) });
  try {
    await enable(h);
    const tree = start(h);
    await flush();
    const result = h.render();
    assert.match(renderToStaticMarkup(result), /could not be reviewed/);
    assert.equal(button(result, 'Use confirmed words as my question').props.disabled, true);
    assert.equal(text(tree).includes('synthetic result'), false);
  } finally { h.close(); }
});

test('actual UI requires reconfirmation after editing and invokes the typed alternative', async () => {
  const h = makeHarness({ transcribe: async () => ({ ok: true, json: async () => ({ text: 'synthetic question', sourceLabel: 'uploaded-file', locale: 'unknown', localeStatus: 'unknown' }) }) });
  try {
    await enable(h);
    let tree = start(h);
    await flush();
    tree = h.render();
    walk(tree, node => node.type === 'button' && text(node.props.children).trim() === 'Confirm transcript')[0].props.onClick();
    tree = h.render();
    assert.equal(button(tree, 'Use confirmed words as my question').props.disabled, false);
    textarea(tree).props.onChange({ currentTarget: { value: 'edited synthetic question' } });
    tree = h.render();
    assert.equal(button(tree, 'Use confirmed words as my question').props.disabled, true);
    walk(tree, node => node.type === 'button' && text(node.props.children).trim() === 'Confirm transcript')[0].props.onClick();
    tree = h.render();
    button(tree, 'Use confirmed words as my question').props.onClick();
    assert.ok(h.requests.some(item => item.submittedQuestion === 'edited synthetic question'));
    const useTyped = walk(tree, node => node.type === 'button' && text(node.props.children).trim() === 'Use a typed question')[0];
    assert.ok(useTyped);
    useTyped.props.onClick();
    assert.deepEqual(h.typed, ['focus']);
  } finally { h.close(); }
});

test('actual transcriber rejects empty and oversized audio before any injected request', async () => {
  let calls = 0;
  const transcribe = createGroqTranscriber({ fetchImpl: async () => { calls += 1; return new Response('{"text":"synthetic"}'); } });
  const base = { mimeType: 'audio/wav', apiKey: 'synthetic-test-token', signal: new AbortController().signal, locale: 'unknown', sourceLabel: 'uploaded-file' };
  await assert.rejects(transcribe({ ...base, audio: new Uint8Array() }), { code: 'empty-audio' });
  await assert.rejects(transcribe({ ...base, audio: new Uint8Array(MAX_AUDIO_BYTES + 1) }), { code: 'audio-too-large' });
  assert.equal(calls, 0);
});

test('unsupported locale is never presented as validated and invalid ISO code fails closed', async () => {
  const h = makeHarness();
  try {
    const tree = await enable(h);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /English · unverified/);
    assert.match(html, /Sesotho · unverified/);
    assert.doesNotMatch(html, /SASL.*available/i);
  } finally { h.close(); }
  let calls = 0;
  const transcribe = createGroqTranscriber({ fetchImpl: async () => { calls += 1; return new Response('{"text":"unexpected"}'); } });
  await assert.rejects(transcribe({ audio: new Uint8Array([1]), mimeType: 'audio/wav', apiKey: 'synthetic-test-token', signal: new AbortController().signal, locale: 'zz', sourceLabel: 'uploaded-file' }), { code: 'invalid-locale' });
  assert.equal(calls, 0);
});

test('actual AI listening route requires consent and aborts an in-flight injected transcriber on disconnect', async t => {
  const values = new Map();
  const repository = {
    async get(owner, space, key) { return values.get(`${owner}:${space}:${key}`) || null; },
    async put(owner, space, key, value, condition = {}) {
      const storageKey = `${owner}:${space}:${key}`;
      const old = values.get(storageKey);
      if (condition.create && old) throw Object.assign(new Error('exists'), { status: 409 });
      if (condition.version !== undefined && old?.version !== condition.version) throw Object.assign(new Error('changed'), { status: 409 });
      const saved = { value, version: (old?.version || 0) + 1 };
      values.set(storageKey, saved);
      return saved;
    },
  };
  const pending = deferred();
  let entered;
  const transcriberStarted = new Promise(resolve => { entered = resolve; });
  let serverSignal;
  let transcribeCalls = 0;
  const service = createAiService({
    repository,
    getSource: async () => null,
    getLesson: async () => null,
    env: { KAIRO_GROQ_API_KEY: 'synthetic-test-token', KAIRO_GROQ_FREE_PLAN_CONFIRMED: '1' },
    transcribe: input => { transcribeCalls += 1; serverSignal = input.signal; entered(); return pending.promise; },
  });
  const app = express();
  app.use((req, _res, next) => { req.kairoIdentity = { uid: 'synthetic-owner' }; next(); });
  app.use(service.router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/listening`;
  const body = Buffer.from('synthetic audio bytes');
  const denied = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body });
  assert.equal(denied.status, 400);
  assert.equal(transcribeCalls, 0);

  const client = new AbortController();
  const response = fetch(url, { method: 'POST', signal: client.signal, headers: { 'Content-Type': 'audio/wav', 'X-Kairo-Consent': 'groq', 'X-Kairo-Language': 'en', 'X-Kairo-Request': 'audit-request-0001' }, body })
    .then(value => ({ value }), error => ({ error }));
  await transcriberStarted;
  client.abort();
  for (let i = 0; i < 30 && !serverSignal.aborted; i += 1) await new Promise(resolve => setImmediate(resolve));
  assert.equal(serverSignal.aborted, true, 'route observes client disconnect as abort');
  pending.resolve({ text: 'synthetic late transcript', sourceLabel: 'uploaded-file', locale: 'en', localeStatus: 'requested-not-validated' });
  assert.equal((await response).error?.name, 'AbortError');
  assert.equal(transcribeCalls, 1);
});
