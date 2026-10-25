import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server;
let AccessDialog;
let openAccess;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    optimizeDeps: { noDiscovery: true, entries: [] },
    plugins: [{
      name: 'learning-access-teacher-harness',
      enforce: 'pre',
      transform(code, id) {
        if (!id.replaceAll('\\', '/').endsWith('/src/learning-flow/AccessDialog.tsx')) return;
        return code.replace("import {useTeacher} from '../teacher/TeacherProvider';", 'const useTeacher=()=>globalThis.__accessTeacher;');
      },
    }, reactPlugin()],
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  });
  ({ default: AccessDialog, openAccess } = await server.ssrLoadModule('/src/learning-flow/AccessDialog.tsx'));
});

after(async () => {
  await server?.close();
});

const response = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

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

function containsLazy(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type && typeof node.type === 'object' && node.type.$$typeof === Symbol.for('react.lazy')) return true;
  const children = node.props?.children;
  return (Array.isArray(children) ? children : [children]).some(containsLazy);
}

function textOf(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textOf).join('');
  if (value && typeof value === 'object') return textOf(value.props?.children);
  return '';
}

function rig({ fetch: fetchImpl = async () => response(404), settings = {}, voices = [{ voiceURI: 'en-za-1', name: 'English voice', lang: 'en-ZA' }], search = '' } = {}) {
  const original = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    teacher: globalThis.__accessTeacher,
  };
  const listeners = new Map();
  const calls = [];
  const modal = { shown: 0, closed: 0, showModal() { this.shown++; }, close() { this.closed++; } };
  let activeFocus = 0;
  const previous = { focus() { activeFocus++; } };
  const win = {
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) ?? new Set();
      callbacks.add(callback);
      listeners.set(type, callbacks);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    dispatchEvent(event) {
      for (const callback of listeners.get(event.type) ?? []) callback(event);
      return true;
    },
  };
  globalThis.window = win;
  globalThis.document = { activeElement: previous };
  globalThis.location = { search };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    return fetchImpl(String(url), init, calls);
  };

  const stopCalls = [];
  const updates = [];
  globalThis.__accessTeacher = {
    stop() { stopCalls.push('stop'); },
    settings: { language: 'zu-ZA', voiceMode: 'browser', rate: 0.94, cloudConsent: false, ...settings },
    voices,
    update(value) { updates.push(value); },
  };

  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const slots = [];
  const effects = [];
  const pendingEffects = [];
  let hookIndex = 0;
  let tree = null;
  const dispatcher = {
    useState(initialValue) {
      const index = hookIndex++;
      if (!(index in slots)) slots[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initialValue) {
      const index = hookIndex++;
      if (!(index in slots)) slots[index] = { current: initialValue };
      return slots[index];
    },
    useEffect(effect, dependencies) {
      const index = hookIndex++;
      const prior = effects[index];
      const changed = !prior || !dependencies || dependencies.some((value, i) => !Object.is(value, prior.dependencies?.[i]));
      if (changed) pendingEffects.push(() => {
        prior?.cleanup?.();
        const cleanup = effect();
        effects[index] = { dependencies, cleanup };
      });
    },
  };

  const update = () => {
    hookIndex = 0;
    internals.H = dispatcher;
    try { tree = AccessDialog(); }
    finally { internals.H = null; }
    // useRef order in this component: dialog node, then the current teacher stop callback.
    slots[3].current = modal;
    while (pendingEffects.length) pendingEffects.shift()();
    return tree;
  };
  const unmount = () => {
    for (const effect of effects) effect?.cleanup?.();
    effects.length = 0;
  };
  const close = () => {
    unmount();
    globalThis.fetch = original.fetch;
    globalThis.window = original.window;
    globalThis.document = original.document;
    globalThis.location = original.location;
    if (original.teacher === undefined) delete globalThis.__accessTeacher;
    else globalThis.__accessTeacher = original.teacher;
  };
  update();
  return { update, close, window: win, calls, modal, stopCalls, updates, slots, get tree() { return tree; }, get activeFocus() { return activeFocus; } };
}

const button = (tree, label) => find(tree, node => node.type === 'button' && textOf(node.props.children).trim() === label);
const markup = tree => renderToStaticMarkup(tree);

test('closed dialog performs no voice request and renders no camera subtree', () => {
  const h = rig();
  try {
    assert.equal(h.tree, null);
    assert.deepEqual(h.calls, []);
    assert.equal(containsLazy(h.tree), false);
  } finally { h.close(); }
});

test('the open event stops narration, opens the temporary dialog and loads voice availability', () => {
  const h = rig({ fetch: async url => url === '/api/avatar/voices' ? response(200, { enabled: false }) : response(404) });
  try {
    openAccess();
    h.update();
    assert.deepEqual(h.stopCalls, ['stop']);
    assert.equal(h.modal.shown, 1);
    assert.match(markup(h.tree), /<dialog/);
    assert.deepEqual(h.calls.map(call => call.url), ['/api/avatar/voices']);
    assert.match(markup(h.tree), /Voice, language and camera/);
  } finally { h.close(); }
});

test('Escape and Close each restore the closed state and remove the camera subtree', () => {
  for (const closeBy of ['escape', 'button']) {
    const h = rig();
    try {
      openAccess();
      h.update();
      const dialog = find(h.tree, node => node.type === 'dialog');
      assert.ok(dialog);
      const cameraButton = button(h.tree, 'Show local camera controls');
      assert.ok(cameraButton);
      cameraButton.props.onClick();
      h.update();
      assert.ok(containsLazy(h.tree), 'camera preview subtree appears only after explicit controls action');

      const currentDialog = find(h.tree, node => node.type === 'dialog');
      if (closeBy === 'escape') currentDialog.props.onCancel({ preventDefault() {} });
      else button(h.tree, 'Close').props.onClick();
      h.update();
      assert.equal(h.tree, null);
      assert.equal(containsLazy(h.tree), false);
      assert.ok(h.modal.closed >= 1);
      assert.ok(h.activeFocus >= 1);
    } finally { h.close(); }
  }
});

test('voice labels reflect installed language support and distinguish language choice from translation', () => {
  const h = rig({ voices: [{ voiceURI: 'en-za-1', name: 'English voice', lang: 'en-ZA' }] });
  try {
    openAccess();
    h.update();
    const html = markup(h.tree);
    assert.match(html, /isiZulu · no device voice found/);
    assert.match(html, /English · voice available/);
    assert.match(html, /No matching voice/);
    assert.match(html, /Choosing a voice language does not translate English lesson text/);
    assert.match(html, /not signed-language translation/);
  } finally { h.close(); }
});

test('passage translation retains only a valid lesson ID from the current source lesson', () => {
  const id = 'a'.repeat(24);
  const h = rig({ search: `?lesson=${id}` });
  try {
    openAccess();
    h.update();
    const link = find(h.tree, node => node.type === 'a' && textOf(node.props.children).includes('Open cited passage translation'));
    assert.equal(link.props.href, `/classroom?lesson=${id}&help=1`);
  } finally { h.close(); }

  const unsafe = rig({ search: '?lesson=javascript%3Aalert(1)' });
  try {
    openAccess();
    unsafe.update();
    const link = find(unsafe.tree, node => node.type === 'a' && textOf(node.props.children).includes('Open material for passage help'));
    assert.equal(link.props.href, '/sources');
  } finally { unsafe.close(); }
});

test('a late voice response after closing cannot update the next dialog status', async () => {
  const late = deferred();
  const next = deferred();
  const h = rig({
    settings: { voiceMode: 'google' },
    fetch: async (_url, _init, calls) => calls.length === 1 ? late.promise : next.promise,
  });
  try {
    openAccess();
    h.update();
    const firstSignal = h.calls[0].init.signal;
    assert.equal(firstSignal.aborted, false);
    button(h.tree, 'Close').props.onClick();
    h.update();
    assert.equal(firstSignal.aborted, true);
    late.resolve(response(200, { enabled: true }));
    await flush();
    openAccess();
    h.update();
    assert.match(markup(h.tree), /Google voice is unavailable in this session/);
    assert.doesNotMatch(markup(h.tree), /Google voice is configured/);
  } finally { h.close(); }
});
