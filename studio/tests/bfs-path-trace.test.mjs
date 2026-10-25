import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import {
  SCENARIOS, PREPARED_SOURCE, MODEL_VERSION, assertGraph, assertScenarioId,
  assertPrediction, runBfs, traceScenario, newSession, commitAttempt,
} from '../src/studio-scenarios/bfs-path-trace/model.ts';

const at = '2026-10-25T09:04:00.000Z';
const explain = 'I followed the outgoing arrows and counted the shortest number of edges.';
const pred = hops => ({ hops, reasoning: explain });
const path = name => join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/bfs-path-trace', name);

// Independent simple-path enumeration oracle, not BFS: bounded fixture graphs only.
function bruteFewestEdges(graph, start, target) {
  let best = Infinity;
  function visit(node, seen, hops) {
    if (hops >= best) return;
    if (node === target) { best = hops; return; }
    for (const next of graph[node]) if (!seen.has(next)) {
      visit(next, new Set([...seen, next]), hops + 1);
    }
  }
  visit(start, new Set([start]), 0);
  return Number.isFinite(best) ? best : null;
}
test('all prepared scenarios are deterministic and agree with independent shortest simple-path enumeration', () => {
  for (const [id, s] of Object.entries(SCENARIOS)) {
    const a = traceScenario(id);
    assert.deepEqual(a, traceScenario(id));
    assert.equal(a.hops, bruteFewestEdges(s.graph, s.start, s.target), id);
    assert.equal(a.reached, a.hops !== null);
    assert.equal(a.path.length, a.hops === null ? 0 : a.hops + 1);
    assert.ok(a.steps.length <= Object.keys(s.graph).length);
    assert.equal(new Set(a.visited).size, a.visited.length, 'no node expanded twice');
    if (a.reached) {
      assert.equal(a.path[0], s.start);
      assert.equal(a.path.at(-1), s.target);
      for (let i = 1; i < a.path.length; i++) assert.ok(s.graph[a.path[i - 1]].includes(a.path[i]));
    }
    for (const step of a.steps) {
      assert.equal(step.queueBefore[0], step.expanded);
      assert.deepEqual(step.queueAfter, [...step.queueBefore.slice(1), ...step.discovered]);
      assert.ok(step.discovered.every(n => !step.queueBefore.includes(n)));
    }
  }
});
test('cycle, self-loop, tie, disconnected and zero-hop graph invariants', () => {
  assert.equal(traceScenario('cycle').hops, 4);
  assert.deepEqual(traceScenario('cycle').visited, ['S', 'A', 'B', 'C', 'D']);
  assert.deepEqual(traceScenario('disconnected').path, []);
  assert.equal(traceScenario('disconnected').hops, null);
  assert.deepEqual(traceScenario('same').path, ['A']);
  assert.equal(traceScenario('same').hops, 0);
  assert.deepEqual(traceScenario('tie').path, ['A', 'B', 'D'], 'alphabetical tie break');
  assert.equal(traceScenario('branching').hops, 3);
});
test('custom bounded directed graph uses arrow direction; self-loop never repeats', () => {
  const r = runBfs({ A: ['A', 'B'], B: [], C: ['A'] }, 'A', 'C');
  assert.equal(r.hops, null);
  assert.deepEqual(r.visited, ['A', 'B']);
  assert.deepEqual(runBfs({ A: ['B'], B: [] }, 'A', 'B').path, ['A', 'B']);
});
test('invalid graphs and scenario IDs are rejected before trace', () => {
  const bad = [
    [null, 'A', 'A'], [{}, 'A', 'A'], [{ A: ['B'] }, 'A', 'A'],
    [{ A: ['A', 'A'] }, 'A', 'A'], [{ A: ['B'], B: [] }, 'X', 'B'],
    [{ A: 'B' }, 'A', 'A'], [{ a: [] }, 'a', 'a'],
    [Object.fromEntries(Array.from({ length: 11 }, (_, i) => [String(i), []])), '0', '0'],
  ];
  for (const [graph, start, target] of bad) assert.throws(() => assertGraph(graph, start, target));
  for (const id of [null, 'unknown', '', 0, {}, '__proto__']) {
    assert.throws(() => assertScenarioId(id));
    assert.throws(() => traceScenario(id));
  }
});
test('two independent local attempts record accurate result, immutable snapshots and source revision', () => {
  const initial = newSession('local-session-123');
  const first = commitAttempt(initial, 'branching', pred(3), at);
  assert.equal(initial.attempts.length, 0);
  assert.equal(first.attempts[0].correct, true);
  assert.equal(first.attempts[0].id, 'local-session-123-round-1');
  assert.equal(first.attempts[0].sourceKind, PREPARED_SOURCE.kind);
  assert.equal(first.attempts[0].sourceRevision, PREPARED_SOURCE.revision);
  assert.equal(first.attempts[0].modelVersion, MODEL_VERSION);
  assert.equal(first.attempts[0].evidenceStatus, 'local-unverified');
  const prediction = { hops: 'unreachable', reasoning: '  No outgoing route reaches the target.  ' };
  const second = commitAttempt(first, 'disconnected', prediction, '2026-10-25T09:05:00.000Z');
  prediction.reasoning = 'changed';
  assert.equal(second.attempts[1].prediction.reasoning, 'No outgoing route reaches the target.');
  assert.equal(second.attempts[1].correct, true);
  assert.equal(first.attempts.length, 1);
  assert.throws(() => commitAttempt(second, 'same', pred(0), at), /Two attempts/);
  assert.throws(() => commitAttempt(first, 'branching', pred(3), at), /different graph/);
});
test('incorrect prediction is recorded without changing model result', () => {
  const s = commitAttempt(newSession('local-session-456'), 'cycle', pred(3), at);
  assert.equal(s.attempts[0].correct, false);
  assert.equal(s.attempts[0].trace.hops, 4);
});
test('invalid predictions, timestamps, source-forgery fields and IDs fail closed', () => {
  assert.throws(() => newSession('bad id'));
  for (const p of [{ hops: -1, reasoning: explain }, { hops: 1.5, reasoning: explain },
    { hops: 10, reasoning: explain }, { hops: '2', reasoning: explain },
    { hops: 2, reasoning: 'short' }, { hops: 2, reasoning: 'x'.repeat(401) },
    { hops: 2, reasoning: explain + '\u0001' }, { ...pred(3), privateSourceId: 'forged' }]) {
    assert.throws(() => assertPrediction(p));
    assert.throws(() => commitAttempt(newSession('local-session-789'), 'branching', p, at));
  }
  for (const date of ['2026-10-25', 'not a date', '2026-10-25T09:04:00Z']) {
    assert.throws(() => commitAttempt(newSession('local-session-789'), 'branching', pred(3), date), /ISO/);
  }
});

let createElement, renderToStaticMarkup, BfsPathLab;
before(async () => {
  const studio = join(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await build({
    stdin: { contents: `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BfsPathLab from './src/studio-scenarios/bfs-path-trace/BfsPathLab.tsx';
export { createElement, renderToStaticMarkup, BfsPathLab };`, resolveDir: studio, loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
  });
  const dir = mkdtempSync(join(tmpdir(), 'kairo-bfs-path-'));
  const out = join(dir, 'render.cjs');
  writeFileSync(out, result.outputFiles[0].text);
  const mod = await import(pathToFileURL(out).href);
  const exports = mod.default ?? mod;
  createElement = exports.createElement;
  renderToStaticMarkup = exports.renderToStaticMarkup;
  BfsPathLab = exports.BfsPathLab;
});
test('SSR exposes native keyboard/reading semantics but hides shortest-path answer until prediction', () => {
  const html = renderToStaticMarkup(createElement(BfsPathLab));
  assert.match(html, /Computer Science Studio: find a shortest path with BFS/);
  assert.match(html, /<fieldset/);
  assert.match(html, /<legend/);
  assert.match(html, /<select/);
  assert.match(html, /<textarea/);
  assert.match(html, /<button/);
  assert.match(html, /role="status"/);
  assert.match(html, /Prepared educational model/);
  assert.match(html, /not saved to your KAIRO account/);
  assert.match(html, /MIT OpenCourseWare/);
  assert.doesNotMatch(html, /Shortest route A → B → D → F/);
  assert.doesNotMatch(html, /<canvas|WebGL|navigator\.mediaDevices/);
});
test('standalone Vite preview mounts the real component without shared routing or cloud calls', () => {
  const html = readFileSync(path('preview.html'), 'utf8');
  const source = readFileSync(path('preview.tsx'), 'utf8');
  assert.match(html, /lang="en"/);
  assert.match(html, /\.\/preview\.tsx/);
  assert.match(source, /createRoot/);
  assert.match(source, /BfsPathLab/);
  assert.doesNotMatch(source, /fetch\(|getUserMedia|firebase|provider/);
});
