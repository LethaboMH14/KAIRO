import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
let server;
let Component;
async function loadComponent() {
  if (!Component) {
    server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    Component = (await server.ssrLoadModule('/src/material-review-layout/MaterialReviewLayout.tsx')).default;
  }
  return Component;
}
after(async () => { await server?.close(); });

function props(overrides = {}) {
  return {
    title: 'Review your material',
    original: React.createElement('pre', null, 'Original source'),
    reviewed: React.createElement('textarea', { 'aria-label': 'Editable extracted text', defaultValue: 'Reviewed source text' }),
    sourceRevision: 'fixture-revision', coverageLabel: 'One section reviewed', warnings: [],
    busy: false, dirty: true, canSave: true, canBuild: true,
    onSave() {}, onBuild() {}, onCancel() {}, ...overrides,
  };
}

test('mobile clearance is injected with the real component and leaves both editor panels mounted', async () => {
  const Component = await loadComponent();
  const html = renderToStaticMarkup(React.createElement(Component, props()));
  const css = await readFile(new URL('../src/material-review-layout/material-review-layout.css', import.meta.url), 'utf8');
  assert.match(html, /data-pane="original" data-active="true"/);
  assert.match(html, /data-pane="reviewed" data-active="false"/);
  assert.match(html, /aria-label="Editable extracted text"/);
  assert.match(css, /@media \(max-width: 48rem\) \{[\s\S]*?--mrl-mobile-nav-clearance: calc\(76px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(css, /padding-block-end: var\(--mrl-mobile-nav-clearance\)/);
  assert.match(css, /\.mrl-slot--reviewed \{ scroll-padding-block-end: var\(--mrl-mobile-nav-clearance\); \}/);
  assert.match(css, /\.mrl-slot--reviewed :is\(textarea, input, select, \[contenteditable="true"\]\) \{ scroll-margin-block-end: var\(--mrl-mobile-nav-clearance\); \}/);
});

test('mobile bottom clearance does not alter save/build gates or their original callback wiring', async () => {
  const Component = await loadComponent();
  let saved = 0;
  let built = 0;
  const html = renderToStaticMarkup(React.createElement(Component, props({
    dirty: false,
    onSave() { saved += 1; },
    onBuild() { built += 1; },
  })));
  assert.match(html, /type="button" disabled="" aria-describedby="[^"]+">Save review/);
  assert.match(html, /type="button" aria-describedby="[^"]+">Build lesson/);
  assert.equal(saved, 0);
  assert.equal(built, 0);
});
