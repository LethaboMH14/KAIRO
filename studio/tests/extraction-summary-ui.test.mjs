import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const report = (overrides = {}) => ({ schemaVersion: 1, discoveredUnits: 4, attemptedUnits: 4, completedUnits: 4, reviewSections: 4, reviewCharacters: 900, omittedReviewCharacters: 0, skippedCount: 0, failureCount: 0, warnings: [], ...overrides });

async function withComponent(run) {
  const server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: ExtractionSummary } = await server.ssrLoadModule('/src/extraction-summary-ui/ExtractionSummary.tsx');
    await run(ExtractionSummary);
  } finally { await server.close(); }
}

test('renders distinct extraction and review counts without implying understanding', async () => withComponent((Component) => {
  const html = renderToStaticMarkup(React.createElement(Component, { report: report() }));
  assert.match(html, /Items found/);
  assert.match(html, /Text extracted/);
  assert.match(html, /Sections ready for your review/);
  assert.match(html, /Ready for review does not mean checked, understood or correct/);
  assert.doesNotMatch(html, /100%|fully understood|complete analysis/i);
}));

test('unknown discovered total stays unknown and partial or failed work is visible', async () => withComponent((Component) => {
  const html = renderToStaticMarkup(React.createElement(Component, { report: report({ discoveredUnits: null, attemptedUnits: 4, completedUnits: 2, skippedCount: 1, failureCount: 1 }) }));
  assert.match(html, /<dt>Items found<\/dt><dd>Unknown<\/dd>/);
  assert.match(html, /2<\/dd><\/div>/);
  assert.match(html, /1 reported skip/);
  assert.match(html, /1 extraction failure/);
}));

test('review omissions and warning strings are shown as escaped text', async () => withComponent((Component) => {
  const html = renderToStaticMarkup(React.createElement(Component, { report: report({ omittedReviewCharacters: 31, warnings: ['<img src=x onerror=alert(1)>'] }) }));
  assert.match(html, /31 extracted characters could not be included for review/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img\b/i);
}));

test('complete native extraction can still have no reviewed sections', async () => withComponent((Component) => {
  const html = renderToStaticMarkup(React.createElement(Component, { report: report({ completedUnits: 4, reviewSections: 0, reviewCharacters: 0 }) }));
  assert.match(html, /Text extracted/);
  assert.match(html, /Sections ready for your review<\/dt><dd>0<\/dd>/);
  assert.match(html, /still needs your review/);
}));
