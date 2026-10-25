import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const items = Array.from({ length: 7 }, (_, index) => ({
  id: `item-${index + 1}`,
  title: `Synthetic fixture project ${index + 1}`,
  description: `Synthetic test description ${index + 1}. Not learner or employer data.`,
  sourceLabel: `Test source ${index + 1}`,
  completedAt: index === 0 ? '2026-10-20T12:00:00Z' : null,
  claimLabel: 'Practice record; self-reported and unverified',
}));
const storageLabel = 'Shared browser/app-host storage; others using this device or workspace may be able to see it.';
const base = { items, storageLabel, onExport() {} };
let server, EvidenceCuration;

test('load and SSR-render the actual EvidenceCuration component through installed Vite', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: EvidenceCuration } = await server.ssrLoadModule('/src/evidence-curation-ui/EvidenceCuration.tsx')); }
  catch (error) { await server.close(); throw error; }
});

const render = (props = {}) => renderToStaticMarkup(React.createElement(EvidenceCuration, { ...base, ...props }));

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

function mounted(props = {}) {
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const slots = [];
  let hookIndex = 0, tree;
  const dispatcher = {
    useState(initial) {
      const index = hookIndex++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
  };
  const update = (nextProps = {}) => {
    hookIndex = 0;
    internals.H = dispatcher;
    try { tree = EvidenceCuration({ ...base, ...props, ...nextProps }); }
    finally { internals.H = null; }
    return tree;
  };
  update();
  return { update, get tree() { return tree; }, unmount() { slots.length = 0; } };
}

function all(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (predicate(node)) found.push(node);
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) all(child, predicate, found);
  return found;
}

test('empty state is explicit and shared-device storage audience is shown', () => {
  const markup = render({ items: [] });
  assert.match(markup, /No work items are ready to choose yet/);
  assert.match(markup, /Where this is saved:/);
  assert.match(markup, /Shared browser\/app-host storage/);
  assert.match(markup, /nothing is published from here/);
});

test('learner selects up to six, sees exact claims in preview, and callback exports only selected ids', () => {
  const calls = [];
  const panel = mounted({ onExport: ids => calls.push(ids) });
  const checks = all(panel.tree, node => node.type === 'input' && node.props.type === 'checkbox');
  for (const checkbox of checks.slice(0, 6)) checkbox.props.onChange({ currentTarget: { checked: true } });
  panel.update();
  const refreshed = all(panel.tree, node => node.type === 'input' && node.props.type === 'checkbox');
  assert.equal(refreshed.length, 7);
  assert.ok(refreshed.slice(0, 6).every(node => node.props.checked));
  assert.equal(refreshed[6].props.disabled, true);
  const selectedMarkup = renderToStaticMarkup(panel.tree);
  assert.match(selectedMarkup, /Select up to six items from this list/);
  assert.match(selectedMarkup, /Practice record; self-reported and unverified/);
  assert.match(selectedMarkup, /Claim:/);
  const download = find(panel.tree, node => node.type === 'button' && node.props.children === 'Download selected work');
  download.props.onClick();
  assert.deepEqual(calls, [['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6']]);
  panel.unmount();
});

test('preview reordering and removal change the ids delivered to export callback', () => {
  const calls = [];
  const panel = mounted({ onExport: ids => calls.push(ids) });
  for (const checkbox of all(panel.tree, node => node.type === 'input' && node.props.type === 'checkbox').slice(0, 3)) checkbox.props.onChange({ currentTarget: { checked: true } });
  panel.update();
  find(panel.tree, node => node.type === 'button' && node.props['aria-label'] === 'Move Synthetic fixture project 3 earlier').props.onClick();
  panel.update();
  find(panel.tree, node => node.type === 'button' && node.props['aria-label'] === 'Move Synthetic fixture project 3 earlier').props.onClick();
  panel.update();
  find(panel.tree, node => node.type === 'button' && node.props['aria-label'] === 'Remove Synthetic fixture project 2').props.onClick();
  panel.update();
  find(panel.tree, node => node.type === 'button' && node.props.children === 'Download selected work').props.onClick();
  assert.deepEqual(calls, [['item-3', 'item-1']]);
  panel.unmount();
});

test('select all is offered only when the complete item set fits the six-item limit', () => {
  const smallPanel = mounted({ items: items.slice(0, 3) });
  assert.ok(find(smallPanel.tree, node => node.type === 'button' && node.props.children === 'Select all available items'));
  find(smallPanel.tree, node => node.type === 'button' && node.props.children === 'Select all available items').props.onClick();
  smallPanel.update();
  assert.equal(all(smallPanel.tree, node => node.type === 'input' && node.props.type === 'checkbox' && node.props.checked).length, 3);
  const largePanel = mounted();
  assert.equal(find(largePanel.tree, node => node.type === 'button' && /Select all/.test(String(node.props.children))), null);
  smallPanel.unmount();
  largePanel.unmount();
});

test('native controls have labels, exact metadata is escaped, and no employer publication action is implied', () => {
  const malicious = { ...items[0], title: '<script>alert(1)</script>', description: '<img src=x onerror=alert(1)>', sourceLabel: '<b>source</b>' };
  const markup = render({ items: [malicious] });
  assert.doesNotMatch(markup, /<script>|<img|<b>source/);
  assert.match(markup, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(markup, /type="checkbox"/);
  assert.match(markup, /Download selected work/);
  assert.doesNotMatch(markup, /Publish|Send to employer|Verified badge/);
  assert.match(markup, /not prove identity, workplace skill or a qualification/);
});

test('each selection checkbox is inside its native label and preview controls have action names', () => {
  const panel = mounted();
  const labelledCheckboxes = all(panel.tree, node => node.type === 'label')
    .flatMap(label => all(label, child => child.type === 'input' && child.props.type === 'checkbox'));
  assert.equal(labelledCheckboxes.length, 7);
  const itemCheckbox = labelledCheckboxes[0];
  itemCheckbox.props.onChange({ currentTarget: { checked: true } });
  panel.update();
  const names = all(panel.tree, node => node.type === 'button').map(button => button.props['aria-label']).filter(Boolean);
  assert.ok(names.includes('Move Synthetic fixture project 1 earlier'));
  assert.ok(names.includes('Move Synthetic fixture project 1 later'));
  assert.ok(names.includes('Remove Synthetic fixture project 1'));
  panel.unmount();
});

test('export has no implicit side effect: it is called only by the explicit enabled action', () => {
  let exports = 0;
  const panel = mounted({ items: [items[0]], onExport: () => exports++ });
  const download = find(panel.tree, node => node.type === 'button' && node.props.children === 'Download selected work');
  assert.equal(download.props.disabled, true);
  download.props.onClick();
  assert.equal(exports, 0);
  find(panel.tree, node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ currentTarget: { checked: true } });
  panel.update();
  find(panel.tree, node => node.type === 'button' && node.props.children === 'Download selected work').props.onClick();
  assert.equal(exports, 1);
  panel.unmount();
});

test.after(async () => { await server?.close(); });
