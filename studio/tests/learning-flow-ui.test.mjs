import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server;
let FlowRail;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    optimizeDeps: { noDiscovery: true, entries: [] },
    plugins: [react()],
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  });
  ({ default: FlowRail } = await server.ssrLoadModule('/src/learning-flow-ui/FlowRail.tsx'));
});

after(async () => {
  await server?.close();
});

function render(props = {}) {
  return renderToStaticMarkup(React.createElement(FlowRail, {
    current: 'lesson',
    moduleLabel: 'Engineering science',
    lessonTitle: 'Pump systems',
    items: [
      { stage: 'material', label: 'Material', href: '/sources' },
      { stage: 'lesson', label: 'Lesson', href: '/classroom?lesson=example' },
      { stage: 'studio', label: 'Explore', note: 'Choose an activity' },
      { stage: 'evidence', label: 'My work', href: '/evidence' },
      { stage: 'direction', label: 'Direction', href: '/direction' },
    ],
    ...props,
  }));
}

test('renders the supplied safe app links and learning context', () => {
  const html = render();
  assert.match(html, /href="\/sources"/);
  assert.match(html, /href="\/classroom\?lesson=example"/);
  assert.match(html, /href="\/evidence"/);
  assert.match(html, /Engineering science · Pump systems/);
  assert.match(html, /Choose an activity/);
  assert.match(html, /aria-label="Learning journey"/);
});

test('marks only the current stage as the current step', () => {
  const html = render();
  assert.match(html, /href="\/classroom\?lesson=example" aria-current="step"/);
  assert.equal((html.match(/aria-current="step"/g) ?? []).length, 1);
});

test('renders unsafe or unsupported destinations as noninteractive text', () => {
  const html = render({
    items: [
      { stage: 'material', label: 'External', href: 'https://example.com' },
      { stage: 'lesson', label: 'Protocol relative', href: '//example.com/path' },
      { stage: 'studio', label: 'Backslash', href: '/\u005c\u005cexample.com' },
      { stage: 'evidence', label: 'Control', href: '/evidence\u0001' },
      { stage: 'direction', label: 'No destination', note: 'Coming later' },
    ],
  });
  assert.doesNotMatch(html, /href="(?:https:|\/\/|\/\\|\/evidence)/);
  assert.match(html, /External/);
  assert.match(html, /Protocol relative/);
  assert.match(html, /Backslash/);
  assert.match(html, /Control/);
  assert.match(html, /Coming later/);
  assert.equal((html.match(/<a\b/g) ?? []).length, 0);
});

test('escapes labels, notes and context as text', () => {
  const html = render({
    moduleLabel: '<img src=x onerror=alert(1)>',
    lessonTitle: 'Lesson & <script>bad()</script>',
    items: [{ stage: 'lesson', label: '<svg onload=bad()>', href: '/safe', note: '<b>note</b>' }],
  });
  assert.match(html, /&lt;img/);
  assert.match(html, /Lesson &amp; &lt;script&gt;/);
  assert.match(html, /&lt;svg/);
  assert.match(html, /&lt;b&gt;note&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<script>|<svg|<img/);
});
