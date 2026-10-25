import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const textArtifact = (overrides = {}) => ({
  schemaVersion: 1,
  artifactId: 'note-1',
  title: 'Practice note',
  kind: 'text',
  provenance: { sourceId: 'source-7', sourceRevision: 'revision-2', page: 3, label: 'Learner supplied source' },
  payload: { type: 'text', text: 'A short note.' },
  ...overrides,
});

async function withView(run) {
  const server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: StaticArtifactView } = await server.ssrLoadModule('/src/static-artifact-view/StaticArtifactView.tsx');
    await run(StaticArtifactView);
  } finally {
    await server.close();
  }
}

test('markup-looking content stays escaped text and is not interpreted as elements or links', async () => {
  await withView((View) => {
    const input = textArtifact({
      title: '<script>title()</script>',
      provenance: { sourceId: 'source-7', label: '<img src=x onerror=alert(1)> https://example.invalid/paper' },
      payload: { type: 'text', text: '<img src=x onerror=alert(1)><script>run()</script>' },
    });
    const html = renderToStaticMarkup(React.createElement(View, { input }));
    assert.match(html, /&lt;script&gt;title\(\)&lt;\/script&gt;/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /https:\/\/example\.invalid\/paper/);
    assert.doesNotMatch(html, /<(?:script|img|a)\b|href=/i);
  });
});

test('table output has caption, column headers and visible unverified claimed provenance', async () => {
  await withView((View) => {
    const input = {
      ...textArtifact(),
      kind: 'table',
      payload: { type: 'table', columns: ['Item', 'Count'], rows: [['Rice', '4']] },
    };
    const html = renderToStaticMarkup(React.createElement(View, { input }));
    assert.match(html, /<table class="sav-table"><caption>Practice note<\/caption>/);
    assert.equal((html.match(/<th scope="col">/g) ?? []).length, 2);
    assert.match(html, /aria-label="Scrollable table: Practice note"/);
    assert.match(html, /Claimed source details/);
    assert.match(html, /Not verified/);
    assert.match(html, /source-7/);
    assert.match(html, /revision-2/);
    assert.match(html, />3</);
    assert.doesNotMatch(html, /<a\b|href=|src=/i);
  });
});

test('invalid input shows a fixed unavailable reason without partial attacker content', async () => {
  await withView((View) => {
    const invalid = textArtifact({
      title: 'PRIVATE-CANARY-TITLE',
      provenance: { label: 'PRIVATE-CANARY-PROVENANCE' },
      payload: { type: 'table', columns: ['PRIVATE-CANARY-CELL'], rows: [] },
    });
    const html = renderToStaticMarkup(React.createElement(View, { input: invalid }));
    assert.match(html, /Artifact unavailable/);
    assert.match(html, /The saved item type does not match its content/);
    assert.doesNotMatch(html, /PRIVATE-CANARY|PRIVATE-CANARY-CELL/);
  });
});

test('repeated panels have distinct accessible title targets', async () => {
  await withView((View) => {
    const html = renderToStaticMarkup(React.createElement('main', null,
      React.createElement(View, { input: textArtifact() }),
      React.createElement(View, { input: textArtifact({ artifactId: 'note-2', title: 'Second note' }) }),
    ));
    const ids = [...html.matchAll(/<h2 id="([^"]+)"/g)].map((match) => match[1]);
    const labelled = [...html.matchAll(/<section class="sav-panel" aria-labelledby="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, 2);
    assert.equal(new Set(ids).size, 2);
    assert.deepEqual(labelled, ids);
  });
});
