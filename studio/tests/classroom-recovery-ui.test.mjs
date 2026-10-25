import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const id = '0123456789abcdef01234567';
const sourceId = 'abcdef0123456789abcdef01';
let server;
let Recovery;
test('load recovery component through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: Recovery } = await server.ssrLoadModule('/src/classroom-recovery-ui/ClassroomRecovery.tsx')); }
  catch (error) { await server.close(); throw error; }
});

function html(kind, props = {}) { return renderToStaticMarkup(React.createElement(Recovery, { kind, ...props })); }

test('all six states present clear guidance, correct announcement role and next steps', () => {
  const cases = [
    ['loading', 'Checking your lesson', 'status', '/sources'],
    ['lesson-unavailable', 'Your lesson could not open', 'alert', 'My material'],
    ['source-changed', 'This source has changed', 'alert', 'Review your material'],
    ['room-unavailable', 'The room could not load', 'status', 'Continue in reading view'],
    ['storage-unavailable', 'Your saved place is unavailable', 'alert', 'Continue in this session'],
    ['resume-conflict', 'Your saved place changed', 'alert', 'Check the saved place again'],
  ];
  for (const [kind, title, role, action] of cases) {
    const props = { onRetry() {}, onContinueReading() {} };
    const markup = html(kind, props);
    assert.match(markup, new RegExp(title));
    assert.match(markup, new RegExp(`role="${role}"`));
    assert.match(markup, new RegExp(action));
  }
  assert.match(html('loading'), /role="status"/);
  assert.doesNotMatch(html('loading'), /aria-live="assertive"/);
});

test('lesson unavailable only renders retry when supplied and never offers unrelated fallback', () => {
  const absent = html('lesson-unavailable');
  assert.doesNotMatch(absent, /<button/);
  assert.match(absent, /href="\/sources"/);
  assert.doesNotMatch(absent, /prepared stock|sample lesson/i);
  assert.match(html('lesson-unavailable', { onRetry() {} }), /Try opening the lesson again/);
});

test('contextual links accept only validated IDs and otherwise use safe material link', () => {
  assert.match(html('source-changed', { sourceId }), new RegExp(`/sources\\?source=${sourceId}`));
  assert.match(html('storage-unavailable', { lessonId: id }), new RegExp(`/learn\\?lesson=${id}`));
  const unsafe = html('source-changed', { sourceId: 'javascript:alert(1)' });
  assert.match(unsafe, /href="\/sources"/);
  assert.doesNotMatch(unsafe, /javascript:/);
  const badLesson = html('storage-unavailable', { lessonId: '../private' });
  assert.doesNotMatch(badLesson, /href="\/learn/);
});

test('untrusted detail is escaped, length bounded, and has no HTML interpretation', () => {
  const malicious = '<script onerror="run()">& private';
  const markup = html('storage-unavailable', { detail: malicious });
  assert.match(markup, /&lt;script onerror=&quot;run\(\)&quot;&gt;&amp; private/);
  assert.doesNotMatch(markup, /<script/);
  assert.match(html('room-unavailable', { detail: 'x'.repeat(501) }), new RegExp(`x{500}(?!x)`));
});

test('multiple notices do not create repeated hard-coded DOM ids', () => {
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(Recovery, { kind: 'loading' }), React.createElement(Recovery, { kind: 'source-changed' })));
  assert.equal((markup.match(/id="classroom-recovery-heading"/g) || []).length, 0);
  assert.equal((markup.match(/aria-labelledby="classroom-recovery-heading"/g) || []).length, 0);
});

test('returned native button element invokes supplied callbacks exactly once', () => {
  let retry = 0, reading = 0;
  for (const [kind, slot] of [['resume-conflict', 'retry'], ['resume-conflict', 'reading'], ['room-unavailable', 'reading']]) {
    const element = Recovery({ kind, onRetry: () => retry++, onContinueReading: () => reading++ });
    const nav = element.props.children.find(child => child?.type === 'nav');
    const button = nav.props.children.find(child => child.key === slot);
    assert.equal(button.type, 'button');
    button.props.onClick();
  }
  assert.equal(retry, 1);
  assert.equal(reading, 2);
});

test('SSR tests use static markup only and close Vite server', async () => {
  try {
    const markup = html('room-unavailable', { onContinueReading() {} });
    assert.match(markup, /Continue in reading view/);
    assert.match(markup, /min-height:44px/);
  } finally { await server.close(); server = undefined; }
});
