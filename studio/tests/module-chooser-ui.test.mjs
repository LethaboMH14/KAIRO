import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const source = (title, locator = 'Original edition, section 2.1') => ({ url: `https://example.edu/${title.toLowerCase().replaceAll(' ', '-')}`, locator, checkedAt: '2026-10-22T10:00:00.000Z', evidenceStatus: 'original-reviewed' });
const programmes = [{ id: 'electrical', institutionId: 'wits', title: 'Electrical Engineering', qualification: 'BScEng', sourceUrl: 'https://example.edu/programme' }, { id: 'mechanical', institutionId: 'wits', title: 'Mechanical Engineering', qualification: 'BScEng', sourceUrl: 'https://example.edu/mech' }];
const modules = [
  { id: 'shared-circuits', institutionId: 'wits', catalogueYear: 2026, code: 'SYNTH-001', title: 'Synthetic fixture: Circuit fundamentals', studyYear: 1, programmeIds: ['electrical', 'mechanical'], conceptIds: ['circuits'], source: source('Circuits'), status: 'reviewed' },
  { id: 'advanced-circuits', institutionId: 'wits', catalogueYear: 2026, code: 'SYNTH-002', title: 'Synthetic fixture: Network analysis', studyYear: 2, programmeIds: ['electrical'], conceptIds: ['circuits'], source: source('Networks'), status: 'reviewed' },
  { id: 'draft-module', institutionId: 'wits', catalogueYear: 2026, code: 'SYNTH-DRAFT', title: 'Synthetic fixture: Needs review module', studyYear: 1, programmeIds: ['electrical'], conceptIds: [], source: { ...source('Draft'), evidenceStatus: 'discovery-only' }, status: 'needs-review' },
];
const privateContext = () => ({ mode: 'private', programmeId: null, studyYear: null, moduleIds: [], verification: 'self-declared' });
let server, Chooser;
test('load actual chooser through Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: Chooser } = await server.ssrLoadModule('/src/module-chooser-ui/ModuleChooser.tsx')); }
  catch (error) { await server.close(); throw error; }
});
const render = (context, props = {}) => renderToStaticMarkup(React.createElement(Chooser, { programmes, modules, context, onChange() {}, onStart() {}, ...props }));
const learnerText = markup => markup.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

test('programme and year filters show only relevant reviewed choices; shared module appears once', () => {
  const markup = render({ ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: 1 });
  assert.equal((markup.match(/Circuit fundamentals/g) || []).length, 1);
  assert.doesNotMatch(markup, /Network analysis|Needs review module/);
  assert.match(render({ ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: 2 }), /Network analysis/);
  assert.doesNotMatch(render({ ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: 2 }), /Circuit fundamentals/);
  assert.equal((render({ ...privateContext(), mode: 'institution', programmeId: 'mechanical', studyYear: 1 }).match(/Circuit fundamentals/g) || []).length, 1);
});

test('year options remain available across changes and switching keeps only compatible selections', () => {
  for (const currentYear of [1, 2]) {
    const element = Chooser({ programmes, modules, context: { ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: currentYear, moduleIds: ['shared-circuits', 'advanced-circuits'] }, onChange() {}, onStart() {} });
    const controls = element.props.children.filter(child => child?.type === 'div' && child.props.className === 'mc-controls');
    const yearSelect = controls[0].props.children[1].props.children[1];
    const rendered = render({ ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: currentYear, moduleIds: ['shared-circuits', 'advanced-circuits'] });
    assert.match(rendered, /<option value="1"/);
    assert.match(rendered, /<option value="2"/);
    let next;
    const changing = Chooser({ programmes, modules, context: { ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: currentYear, moduleIds: ['shared-circuits', 'advanced-circuits'] }, onChange(value) { next = value; }, onStart() {} });
    const yearControl = changing.props.children.filter(child => child?.type === 'div' && child.props.className === 'mc-controls')[0].props.children[1].props.children[1];
    yearControl.props.onChange({ target: { value: String(currentYear === 1 ? 2 : 1) } });
    assert.deepEqual(next.moduleIds, [currentYear === 1 ? 'advanced-circuits' : 'shared-circuits']);
  }
});

test('programme change clears incompatible selected modules and emits self-declared context', () => {
  let next;
  const element = Chooser({ programmes, modules, context: { mode: 'institution', programmeId: 'electrical', studyYear: 1, moduleIds: ['shared-circuits', 'advanced-circuits'], verification: 'institution-verified' }, onChange(value) { next = value; }, onStart() {} });
  const controls = element.props.children.filter(child => child?.type === 'div' && child.props.className === 'mc-controls');
  const programmeSelect = controls[0].props.children[0].props.children[1];
  programmeSelect.props.onChange({ target: { value: 'mechanical' } });
  assert.deepEqual(next, { mode: 'institution', programmeId: 'mechanical', studyYear: null, moduleIds: ['shared-circuits'], verification: 'self-declared' });
});

test('module selection emits only eligible self-declared choices; invalid module selection is ignored', () => {
  let next;
  const context = { mode: 'institution', programmeId: 'electrical', studyYear: 1, moduleIds: ['draft-module', 'advanced-circuits', 'unknown-id'], verification: 'institution-verified' };
  const element = Chooser({ programmes, modules, context, onChange(value) { next = value; }, onStart() {} });
  const list = element.props.children.find(child => child?.type === 'div' && child.props['aria-label'] === 'Reviewed modules');
  const card = list.props.children[0];
  card.props.children[0].props.children[0].props.onChange({ target: { checked: true } });
  assert.equal(next.verification, 'self-declared');
  assert.deepEqual(next.moduleIds, ['shared-circuits']);
  next = undefined;
  const withoutSelection = Chooser({ programmes, modules, context: { ...context, studyYear: 9 }, onChange(value) { next = value; }, onStart() {} });
  assert.equal(withoutSelection.props.children.find(child => child?.props?.role === 'status').props.children, 'No reviewed modules match this programme and year yet. Try another year or start with your own material.');
  assert.equal(next, undefined);
});

test('private study works without programme and never requires a CV', () => {
  const markup = render(privateContext());
  assert.match(markup, /No programme selected/);
  assert.match(markup, /Start with my material/);
  assert.match(markup, /href="\/sources"/);
  assert.match(markup, /do not need a university or a CV/);
});

test('source context is shown honestly and learner text is escaped', () => {
  const injected = [{ ...programmes[0], title: '<img src=x onerror=run()>' }];
  const markup = render({ ...privateContext(), programmeId: 'electrical', mode: 'institution', studyYear: 1 }, { programmes: injected });
  assert.match(markup, /&lt;img src=x onerror=run\(\)&gt;/);
  assert.doesNotMatch(markup, /<img/);
  assert.match(markup, /Source checked 2026-10-22/);
  assert.match(markup, /Original edition, section 2\.1/);
  assert.match(markup, /self-declared/);
  const visible = learnerText(markup);
  assert.doesNotMatch(visible, /institution-verified|\b\d{1,3}%/i);
  assert.match(markup, /href="https:\/\/example\.edu\/circuits"/);
  assert.match(markup, /max-width:100%/);
  assert.doesNotMatch(visible, /max-width:100%/);
  assert.match(learnerText('<p>Readiness 80%</p>'), /Readiness 80%/);
});

test('module record prerequisites reject missing code/year, institution mismatch and unsafe source URL', () => {
  const invalidRecords = [
    { ...modules[0], code: null }, { ...modules[0], catalogueYear: null },
    { ...modules[0], institutionId: 'other' }, { ...modules[0], source: { ...modules[0].source, url: 'javascript:alert(1)' } },
    { ...modules[0], source: { ...modules[0].source, url: 'https://' } },
    { ...modules[0], source: { ...modules[0].source, url: 'https://user@example.edu/circuits' } },
  ];
  for (const bad of invalidRecords) {
    const markup = render({ ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: 1 }, { modules: [bad] });
    assert.doesNotMatch(markup, /Synthetic fixture: Circuit fundamentals/);
  }
});

test('accessible native labels, empty state, and module start callback work', () => {
  const empty = render({ ...privateContext(), programmeId: 'electrical', mode: 'institution' }, { modules: [] });
  assert.match(empty, /<label>Programme \(optional\)/);
  assert.match(empty, /<label>Year of study/);
  assert.match(empty, /role="status"/);
  let started = [];
  const element = Chooser({ programmes, modules, context: { ...privateContext(), mode: 'institution', programmeId: 'electrical', studyYear: 1, moduleIds: ['shared-circuits'] }, onChange() {}, onStart(id) { started.push(id); } });
  const list = element.props.children.find(child => child?.type === 'div' && child.props['aria-label'] === 'Reviewed modules');
  const startButton = list.props.children[0].props.children[2];
  startButton.props.onClick();
  assert.deepEqual(started, ['shared-circuits']);
});

test('close SSR server; tests are not browser/device validation', async () => { await server.close(); server = undefined; });
