import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const context = {
  contextKey: 'lesson:unit-1:rev-3', surface: 'motor', lessonId: 'unit-1',
  sourceRefs: [{ sourceId: 'source-1', revision: '3' }], selectedTargetId: 'rotor',
  selectionLabel: 'Rotor', scopes: [
    { id: 'rotor', kind: 'selection', label: 'Selected rotor', available: true },
    { id: 'lesson', kind: 'lesson', label: 'Whole lesson', available: true },
    { id: 'topic', kind: 'topic', label: 'General topic', available: false, reason: 'Choose reviewed material first.' },
  ], defaultScopeId: 'rotor',
};
const actions = [
  { id: 'teach', label: 'Teach me', available: true },
  { id: 'explain', label: 'Explain this', available: true },
  { id: 'test', label: 'Test me', available: false, reason: 'A reviewed question set is not available.' },
  { id: 'plan', label: 'Plan next step', available: true },
];

test('the real studio companion mounts bounded actions against selected and reviewed context', async () => {
  const source = await readFile(new URL('../src/learning-flow/StudioCompanion.tsx', import.meta.url), 'utf8');
  assert.match(source, /import \{StudioActionArc\} from '\.\.\/studio-action-ui\/StudioActionArc'/);
  assert.match(source, /<StudioActionArc actions=\{actions\} open=\{studioActionsOpen\}/);
  assert.match(source, /id:'inside',[\s\S]*?available:!!input\.selectedLabel/);
  assert.match(source, /id:'source',[\s\S]*?available:!!lessonContext&&contextState==='current'/);
  assert.match(source, /else questionField\.current\?\.focus\(\)/);
});

test('actual studio action components render safe, labelled states and unique IDs through Vite SSR', async () => {
  const server = await createServer({
    root: studioRoot, configFile: false, plugins: [react()],
    optimizeDeps: { noDiscovery: true, entries: [] },
    server: { middlewareMode: true, ws: false }, appType: 'custom',
  });
  try {
    const { KairoActionMenu } = await server.ssrLoadModule('/src/studio-action-ui/KairoActionMenu.tsx');
    const { StudioActionArc } = await server.ssrLoadModule('/src/studio-action-ui/StudioActionArc.tsx');
    const { TeachingCard } = await server.ssrLoadModule('/src/studio-action-ui/TeachingCard.tsx');
    let requests = 0;
    const buttonWith = (markup, label) => [...markup.matchAll(/<button\b[\s\S]*?<\/button>/g)].map(match => match[0]).find(button => button.includes(label));

    const menu = renderToStaticMarkup(React.createElement(KairoActionMenu, {
      context, actions, open: true, busy: false, onOpenChange() {}, onRequest() { requests++; },
    }));
    assert.match(menu, /What would help\?/);
    assert.match(menu, /Suggested: Selected rotor\. Choose a scope to continue\./);
    assert.match(menu, /Choose what to use/);
    assert.match(buttonWith(menu, 'Test me'), /disabled=""/);
    assert.match(menu, /A reviewed question set is not available\./);
    assert.match(menu, /Choose a scope to continue/);
    assert.match(buttonWith(menu, 'Continue with KAIRO'), /disabled=""/);
    assert.equal(requests, 0, 'SSR never starts the action');

    const busyMenu = renderToStaticMarkup(React.createElement(KairoActionMenu, {
      context, actions, open: true, busy: true, onOpenChange() {}, onRequest() { requests++; },
    }));
    assert.match(busyMenu, /Preparing…/);
    assert.match(buttonWith(busyMenu, 'Teach me'), /disabled=""/);
    assert.equal(requests, 0);

    const twoMenus = renderToStaticMarkup(React.createElement(React.Fragment, null,
      React.createElement(KairoActionMenu, { context, actions, open: false, busy: false, onOpenChange() {}, onRequest() {} }),
      React.createElement(KairoActionMenu, { context: { ...context, contextKey: 'lesson:unit-2:rev-1' }, actions, open: false, busy: false, onOpenChange() {}, onRequest() {} }),
    ));
    const controls = [...twoMenus.matchAll(/id="(kairo-action-panel-[^"]+)"/g)].map(match => match[1]);
    assert.equal(controls.length, 2);
    assert.notEqual(controls[0], controls[1], 'instances have separate accessible panel IDs');

    const arcActions = [
      { id: 'explain', label: 'Explain', available: true }, { id: 'inside', label: 'Look inside', available: true },
      { id: 'try', label: 'Try', available: true }, { id: 'practise', label: 'Practise', available: true },
      { id: 'source', label: 'Source', available: false, reason: 'No reviewed excerpt is available.' },
      { id: 'source', label: 'Hidden overflow', available: true },
    ];
    const arc = renderToStaticMarkup(React.createElement(StudioActionArc, {
      actions: arcActions, open: true, label: 'Motor tools', onOpenChange() {}, onChoose() {},
    }));
    assert.match(arc, /aria-label="Motor tools actions"/);
    assert.match(arc, /Look inside/);
    assert.match(arc, /No reviewed excerpt is available\./);
    assert.doesNotMatch(arc, /Hidden overflow/);
    assert.match(arc, /Showing the first five actions/);
    assert.equal((arc.match(/class="saui-arc-item"/g) || []).length, 5);

    const arcSource = await readFile(new URL('../src/studio-action-ui/StudioActionArc.tsx', import.meta.url), 'utf8');
    assert.match(arcSource, /changeOpen\(false\);\s*onChoose\(choice\.id\);/, 'close the arc before the parent switches to its selected panel');

    const unsafe = '<script>window.injected = true</script>';
    const card = renderToStaticMarkup(React.createElement(TeachingCard, {
      content: { id: 'card-1', contextKey: context.contextKey, title: 'Rotor explanation', body: unsafe, sourceLabels: ['Workbook p. 5'], capability: 'source-linked' },
      narration: 'stopped', busy: false, onClose() {}, onRead() {}, onPause() {}, onStop() {}, onSource() {},
    }));
    assert.match(card, /&lt;script&gt;window\.injected = true&lt;\/script&gt;/);
    assert.doesNotMatch(card, /<script>/);
    assert.match(card, /Linked to lesson sources/);
    assert.match(card, /Workbook p\. 5/);
    assert.match(card, /Read aloud/);
    assert.match(buttonWith(card, 'Pause'), /disabled=""/);
    assert.match(buttonWith(card, 'Stop'), /disabled=""/);

    const unavailable = renderToStaticMarkup(React.createElement(TeachingCard, {
      content: { id: 'card-2', contextKey: context.contextKey, title: 'Unavailable', body: 'Should not appear', sourceLabels: [], capability: 'unavailable' },
      narration: 'stopped', busy: false, onClose() {}, onRead() {}, onPause() {}, onStop() {}, onSource() {},
    }));
    assert.match(unavailable, /No explanation is available for this context/);
    assert.doesNotMatch(unavailable, /Should not appear/);
    assert.match(buttonWith(unavailable, 'Read aloud'), /disabled=""/);
  } finally {
    await server.close();
  }
});
