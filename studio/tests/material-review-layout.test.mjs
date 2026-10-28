import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const componentPath = '/src/material-review-layout/MaterialReviewLayout.tsx';
let viteServer;
let loadedComponent;

async function withComponent(run) {
  if (!loadedComponent) {
    viteServer = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    loadedComponent = (await viteServer.ssrLoadModule(componentPath)).default;
  }
  await run(loadedComponent);
}

after(async () => { await viteServer?.close(); });

function props(overrides = {}) {
  return {
    title: 'Review a pump maintenance note',
    original: React.createElement('article', { 'data-testid': 'original-slot' }, 'Original page 2'),
    reviewed: React.createElement('textarea', { 'data-testid': 'review-editor', defaultValue: 'Reviewed editable text' }),
    sourceRevision: 'source-9 / revision-4',
    coverageLabel: 'Pages 1–2 extracted; page 3 was not included.',
    warnings: ['Check the pressure unit on page 2.'],
    busy: false,
    dirty: true,
    canSave: true,
    canBuild: true,
    onSave() {}, onBuild() {}, onCancel() {},
    ...overrides,
  };
}

test('keeps caller-owned original and reviewed slots mounted in a labelled split workbench', async () => withComponent((Component) => {
  const html = renderToStaticMarkup(React.createElement(Component, props()));
  assert.match(html, /data-testid="original-slot"/);
  assert.match(html, /data-testid="review-editor"/);
  assert.match(html, /data-pane="original" data-active="true"/);
  assert.match(html, /data-pane="reviewed" data-active="false"/);
  assert.match(html, /role="tablist" aria-label="Choose material view"/);
  assert.match(html, /Original page 2/);
  assert.match(html, /Reviewed editable text/);
}));

test('shows supplied revision, coverage and warnings as text with a useful missing-original fallback', async () => withComponent((Component) => {
  const html = renderToStaticMarkup(React.createElement(Component, props({ original: null, sourceRevision: null, warnings: ['<script>alert(1)</script>'] })));
  assert.match(html, /Source revision/);
  assert.match(html, /No source revision supplied\./);
  assert.match(html, /Pages 1–2 extracted; page 3 was not included\./);
  assert.match(html, /Original preview is not available here/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
}));

test('keeps long headings, coverage and warning text readable without truncation', async () => withComponent((Component) => {
  const longTitle = 'A'.repeat(180);
  const longCoverage = 'Coverage detail '.repeat(90);
  const longWarning = 'Warning detail '.repeat(60);
  const html = renderToStaticMarkup(React.createElement(Component, props({ title: longTitle, coverageLabel: longCoverage, warnings: [longWarning] })));
  assert.ok(html.includes(longTitle));
  assert.ok(html.includes(longCoverage));
  assert.ok(html.includes(longWarning));
}));

test('save and build gates reflect dirty, capability and busy state', async () => withComponent((Component) => {
  const blocked = renderToStaticMarkup(React.createElement(Component, props({ dirty: true, canSave: false, canBuild: true })));
  assert.match(blocked, /type="button" disabled="" aria-describedby="[^"]+">Save review/);
  assert.match(blocked, /type="button" disabled="" aria-describedby="[^"]+">Build lesson/);
  assert.match(blocked, /Save your review before building a lesson\./);

  const ready = renderToStaticMarkup(React.createElement(Component, props({ dirty: false, canSave: true, canBuild: true })));
  assert.match(ready, /type="button" disabled="" aria-describedby="[^"]+">Save review/);
  assert.match(ready, /type="button" aria-describedby="[^"]+">Build lesson/);

  const busy = renderToStaticMarkup(React.createElement(Component, props({ busy: true, dirty: true, canSave: true, canBuild: true })));
  assert.match(busy, /A review action is in progress\./);
  assert.match(busy, /type="button" disabled="" aria-describedby="[^"]+">Save review/);
  assert.match(busy, /type="button" disabled="" aria-describedby="[^"]+">Build lesson/);
}));

test('mobile layout hides one visual pane without removing either React slot and includes keyboard tab handling', async () => {
  const css = await readFile(new URL('../src/material-review-layout/material-review-layout.css', import.meta.url), 'utf8');
  const source = await readFile(new URL('../src/material-review-layout/MaterialReviewLayout.tsx', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 48rem\)/);
  assert.match(css, /\.mrl-pane:not\(\[data-active="true"\]\) \{ display: none; \}/);
  assert.match(source, /onKeyDown=\{\(event\) => moveTab\(event, 'original'\)\}/);
  assert.match(source, /onKeyDown=\{\(event\) => moveTab\(event, 'reviewed'\)\}/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /tabRefs\.current\[next === 'original' \? 0 : 1\]\?\.focus\(\)/);
});


