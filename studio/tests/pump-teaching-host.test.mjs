import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const ids = {
  hooks: '\0pump-host-test-hooks', pump: '\0pump-host-test-pumplab',
  companion: '\0pump-host-test-companion', teacher: '\0pump-host-test-teacher',
  lesson: '\0pump-host-test-lesson',
};
const testPlugin = {
  name: 'pump-host-test-boundary', enforce: 'pre',
  resolveId(source, importer) {
    if (source === 'pump-host-test-hooks' && importer?.replaceAll('\\', '/').endsWith('/src/studio-teaching-host/PumpHost.tsx')) return ids.hooks;
    if (!importer?.replaceAll('\\', '/').endsWith('/src/studio-teaching-host/PumpHost.tsx')) return null;
    return ({
      react: ids.hooks,
      '../pump-lab/PumpLab': ids.pump,
      '../learning-flow/StudioCompanion': ids.companion,
      '../teacher/TeacherProvider': ids.teacher,
      './StudioLessonPlan': ids.lesson,
    })[source] ?? null;
  },
  transform(code, id) {
    if (id.replaceAll('\\', '/').endsWith('/src/studio-teaching-host/PumpHost.tsx')) return code.replace("from 'react'", "from 'pump-host-test-hooks'");
    return null;
  },
  load(id) {
    if (id === ids.hooks) return `export const useState=(...a)=>globalThis.__pumpHostHooks.useState(...a); export const useRef=(...a)=>globalThis.__pumpHostHooks.useRef(...a); export const useCallback=(...a)=>globalThis.__pumpHostHooks.useCallback(...a); export const useEffect=(...a)=>globalThis.__pumpHostHooks.useEffect(...a);`;
    if (id === ids.pump) return `import {createElement} from 'react'; export default function PumpLab(props){globalThis.__pumpHostPumpProps=props;return createElement('div',{'data-testid':'stub-pump-lab'});}`;
    if (id === ids.companion) return `import {createElement} from 'react'; export default function StudioCompanion(props){globalThis.__pumpHostCompanionProps=props;return createElement('div',{'data-testid':'stub-companion'});}`;
    if (id === ids.teacher) return `export function useTeacher(){return globalThis.__pumpHostTeacher;}`;
    if (id === ids.lesson) return `import {createElement} from 'react'; export default function StudioLessonPlan(props){return createElement('div',{'data-testid':'stub-lesson-plan'});}`;
    return null;
  },
};

let server, PumpHost, pumpSession, pumpReport;
test('load the real PumpHost and pump snapshot/report modules through Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [testPlugin, reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    ({ default: PumpHost } = await server.ssrLoadModule('/src/studio-teaching-host/PumpHost.tsx'));
    pumpSession = await server.ssrLoadModule('/src/pump-lab/session.ts');
    pumpReport = await server.ssrLoadModule('/src/pump-lab/report.ts');
  } catch (error) { await server.close(); throw error; }
});
test.after(async () => { await server?.close(); restoreGlobals(); });

const originalGlobals = new Map();
function setGlobal(name, value) {
  if (!originalGlobals.has(name)) originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name) ?? null);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}
function restoreGlobals() {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
  }
  originalGlobals.clear();
}

function makeStorage(entries = []) {
  const values = new Map(entries);
  const writes = [];
  return {
    values, writes,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, String(value)]); values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    key(index) { return [...values.keys()][index] ?? null; },
    get length() { return values.size; },
  };
}

function mount(search = '', entries = []) {
  const storage = makeStorage(entries), stops = [], assigned = [];
  const teacher = { stop: () => stops.push('stop'), say() {}, pause() {}, speaking: false, paused: false, status: 'Ready' };
  const hooks = {
    slots: [], cursor: 0,
    begin() { this.cursor = 0; },
    reset() { this.slots = []; this.cursor = 0; },
    useState(initial) { const index = this.cursor++; if (!(index in this.slots)) this.slots[index] = typeof initial === 'function' ? initial() : initial; return [this.slots[index], value => { this.slots[index] = typeof value === 'function' ? value(this.slots[index]) : value; }]; },
    useRef(initial) { const index = this.cursor++; if (!(index in this.slots)) this.slots[index] = { current: initial }; return this.slots[index]; },
    useCallback(callback) { this.cursor++; return callback; },
    useEffect() { this.cursor++; },
  };
  setGlobal('__pumpHostHooks', hooks);
  setGlobal('__pumpHostTeacher', teacher);
  setGlobal('__pumpHostPumpProps', null);
  setGlobal('__pumpHostCompanionProps', null);
  setGlobal('localStorage', storage);
  setGlobal('window', { dispatchEvent() {} });
  setGlobal('location', { search, assign: value => assigned.push(value) });
  const render = () => {
    hooks.begin();
    const tree = PumpHost();
    const html = renderToStaticMarkup(tree);
    return { html, props: globalThis.__pumpHostPumpProps, companion: globalThis.__pumpHostCompanionProps };
  };
  return { storage, stops, assigned, render };
}

const lessonId = '0123456789abcdef01234567';
const SNAPSHOT_KEY = 'kairo-pump-lab-session-v1';
const EVIDENCE_KEY = 'kairo-pump-evidence-v1';
const initialSnapshot = () => pumpSession.serialize(pumpSession.initialState('pump-host-tests', 47, 'baseline-commissioning'));
const baseContext = () => ({ caseId: 'baseline-commissioning', caseTitle: 'Commissioning', nextStep: 'Predict flow', selectedTarget: 'pump-lab/flow-meter', selectedLabel: 'Flow meter', assistance: 'none', readings: 0, supportedExplanation: false, finished: false });

test('return link and exit wording preserve the valid lesson ID, and the host supplies its panel to the actual PumpLab slot', () => {
  const app = mount(`?lesson=${lessonId}`), view = app.render(), props = view.props;
  assert.equal(props.exitLabel, 'Back to my lesson');
  props.onExit();
  assert.equal(app.assigned[0], `/classroom?lesson=${lessonId}&tab=evidence`);
  assert.ok(props.teachingPanel);
  const [companion, lessonPlan] = props.teachingPanel.props.children;
  assert.equal(companion.type.name, 'StudioCompanion');
  assert.equal(companion.props.input.studio, 'pump');
  assert.equal(lessonPlan.type, 'details');
  assert.match(view.html, /stub-pump-lab/);
});

test('invalid lesson context keeps the exit label consistent with its studios destination', () => {
  const app = mount('?lesson=not-a-lesson'), props = app.render().props;
  assert.equal(props.exitLabel, 'Back to studios');
  props.onExit();
  assert.equal(app.assigned[0], '/studios');
});

test('onContext stops narration only when case, target, task, reading count, or completion changes', () => {
  const app = mount(), { props } = app.render(), context = baseContext();
  props.onContext(context);
  assert.equal(app.stops.length, 1);
  props.onContext({ ...context });
  assert.equal(app.stops.length, 1, 'same meaningful context does not interrupt again');
  props.onContext({ ...context, caseTitle: 'Renamed display title', assistance: 'hint', supportedExplanation: true });
  assert.equal(app.stops.length, 1, 'display-only and evidence-summary changes do not interrupt');
  for (const patch of [
    { caseId: 'weak-delivery' },
    { selectedTarget: 'pump-lab/gauge-suction' },
    { nextStep: 'Compare the suction reading' },
    { readings: 1 },
    { finished: true },
  ]) {
    props.onContext({ ...context, ...patch });
  }
  assert.equal(app.stops.length, 6);
  const rerendered = app.render();
  const [companion] = rerendered.props.teachingPanel.props.children;
  assert.equal(companion.type.name, 'StudioCompanion');
  assert.equal(companion.props.input.selectedLabel, 'Flow meter');
});

test('valid saved pump snapshots are passed through and accepted snapshots can be saved', () => {
  const saved = initialSnapshot(), app = mount('', [[SNAPSHOT_KEY, saved]]), { props } = app.render();
  assert.equal(props.snapshot, saved);
  const next = pumpSession.serialize(pumpSession.initialState('pump-host-tests-next', 48, 'baseline-commissioning'));
  props.onSnapshot(next);
  assert.equal(app.storage.getItem(SNAPSHOT_KEY), next);
});

test('unreadable saved snapshots stay intact and are never overwritten by a new snapshot', () => {
  const corrupt = '{"schema":"wrong","actions":["keep me"]}', app = mount('', [[SNAPSHOT_KEY, corrupt]]), { props, html } = app.render();
  props.onSnapshot(initialSnapshot());
  assert.equal(app.storage.getItem(SNAPSHOT_KEY), corrupt);
  assert.equal(app.storage.writes.length, 0);
  assert.match(app.render().html, /Earlier pump work could not be read and was kept unchanged/);
  assert.match(html, /This prepared pump model has its own sources/);
});

test('evidence retains its lesson origin, is bounded, and carries no private credentials or verified-qualification claim', () => {
  const app = mount(`?lesson=${lessonId}`, [[EVIDENCE_KEY, JSON.stringify(Array.from({ length: 9 }, (_, index) => ({ id: `old-${index}` })) )]]);
  const { props } = app.render();
  const state = pumpSession.initialState('evidence-host-test', 91, 'baseline-commissioning');
  const item = pumpReport.toEvidenceItem(state), report = pumpReport.buildReport(state);
  props.onEvidence(item, report);
  const saved = JSON.parse(app.storage.getItem(EVIDENCE_KEY));
  assert.equal(saved.length, 6, 'only five prior records plus the new record are retained');
  const entry = saved.at(-1);
  assert.equal(entry.originLessonId, lessonId);
  assert.deepEqual(entry.item, item);
  assert.deepEqual(entry.report, report);
  assert.ok(JSON.stringify(entry).length < 100_000, 'stored entry remains within a conservative size bound');
  assert.doesNotMatch(JSON.stringify(entry), /password|access[_-]?token|@example\.(com|org)/i);
  assert.equal(entry.item.events.competencyExternallyVerified, false);
  assert.equal(entry.item.reviewStatus, 'not reviewed by a domain expert');
  assert.match(entry.report.disclosure, /not a certificate or a verified competency/i);
});
