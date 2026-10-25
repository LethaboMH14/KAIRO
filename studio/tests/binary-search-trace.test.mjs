import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import {
  ARRAYS, MODEL_VERSION, PREPARED_SOURCE, assertSorted, assertScenario,
  lowerBound, traceScenario, newSession, commitAttempt,
} from '../src/studio-scenarios/binary-search-trace/model.ts';

const at = '2026-10-25T07:00:00.000Z';
const scenario = (arrayId, target) => ({ arrayId, target });
const predict = index => ({ index, reasoning: 'I think all earlier values are smaller than the target.' });
const path = name => join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/binary-search-trace', name);

test('all nine prepared array/target combinations have deterministic, bounded lower-bound traces', () => {
  let n = 0;
  for (const [arrayId, data] of Object.entries(ARRAYS)) for (const target of data.targets) {
    const input = scenario(arrayId, target);
    const result = traceScenario(input);
    assert.deepEqual(result, traceScenario(input));
    assert.ok(result.index >= 0 && result.index <= data.values.length);
    assert.ok(result.steps.length <= data.values.length + 1);
    assert.ok(result.leftPartition.every(v => v < target));
    assert.ok(result.rightPartition.every(v => v >= target));
    assert.equal(result.found, data.values.includes(target));
    for (const s of result.steps) {
      assert.ok(s.low <= s.mid && s.mid < s.high);
      assert.ok(s.nextHigh - s.nextLow < s.high - s.low, 'interval must strictly shrink');
    }
    n++;
  }
  assert.equal(n, 9);
});

test('first match for duplicates, not arbitrary match', () => {
  const r = lowerBound([1, 2, 2, 2, 5, 9], 2);
  assert.equal(r.index, 1);
  assert.equal(r.found, true);
  assert.deepEqual(r.leftPartition, [1]);
  assert.deepEqual(r.rightPartition, [2, 2, 2, 5, 9]);
});

test('empty, below minimum, above maximum, absent middle and singleton edge cases', () => {
  assert.deepEqual([lowerBound([], 4).index, lowerBound([2, 4], 0).index,
    lowerBound([2, 4], 10).index, lowerBound([1, 3, 5, 7, 9], 6).index,
    lowerBound([7], 7).index, lowerBound([7], 8).index], [0, 0, 2, 3, 0, 1]);
  assert.deepEqual(lowerBound([], 4).steps, []);
  assert.equal(lowerBound([1, 3, 5], 2).found, false);
});

test('reject unsorted, unsafe numeric, unbounded, foreign or malformed scenarios', () => {
  for (const values of [[2, 1], [1, 3, 2], [1, NaN], [1, Infinity], [1, 2.5],
    Array(17).fill(1), [101], [-101], 'not-array', null]) assert.throws(() => assertSorted(values));
  for (const target of [NaN, Infinity, 1.5, 101, -101]) assert.throws(() => lowerBound([1, 2], target));
  for (const input of [null, [], {}, { arrayId: 'repeats' }, { arrayId: 'repeats', target: 4 },
    { arrayId: 'unknown', target: 2 }, { arrayId: 'repeats', target: '2' },
    { arrayId: 'repeats', target: 2, privateSourceId: 'forged' }]) {
    assert.throws(() => assertScenario(input));
    assert.throws(() => traceScenario(input));
  }
});

test('independent local attempts preserve prepared source/model and do not claim saved evidence', () => {
  const start = newSession('test-session-42');
  const first = commitAttempt(start, scenario('repeats', 2), predict(1), at);
  assert.equal(start.attempts.length, 0);
  assert.equal(first.attempts[0].correct, true);
  assert.equal(first.attempts[0].id, 'test-session-42-round-1');
  assert.equal(first.attempts[0].modelVersion, MODEL_VERSION);
  assert.equal(first.attempts[0].referenceKind, PREPARED_SOURCE.kind);
  assert.equal(first.attempts[0].referenceRevision, PREPARED_SOURCE.revision);
  assert.equal(first.attempts[0].evidenceStatus, 'local-unverified');
  const second = commitAttempt(first, scenario('gaps', 6), predict(2), '2026-10-25T07:01:00.000Z');
  assert.equal(second.attempts[1].correct, false);
  assert.equal(second.attempts[1].trace.index, 3);
  assert.equal(second.attempts.length, 2);
  assert.throws(() => commitAttempt(second, scenario('empty', 4), predict(0), at), /Two attempts/);
  assert.throws(() => commitAttempt(first, scenario('repeats', 2), predict(1), at), /Change/);
});

test('invalid predictions, timestamp, ID, control characters and forged provenance fail closed', () => {
  assert.throws(() => newSession('bad id'));
  const s = newSession('test-session-43');
  const v = scenario('repeats', 2);
  for (const p of [{ ...predict(1), index: -1 }, { ...predict(1), index: 1.2 },
    { ...predict(1), reasoning: 'short' }, { ...predict(1), reasoning: 'x'.repeat(401) },
    { ...predict(1), reasoning: 'a sufficient explanation\u0001' },
    { ...predict(1), privateAnswer: 1 }]) assert.throws(() => commitAttempt(s, v, p, at));
  for (const t of ['not-a-date', '2026-10-25', '2026-10-25T07:00:00Z']) {
    assert.throws(() => commitAttempt(s, v, predict(1), t), /ISO/);
  }
});

test('recorded attempt snapshots are not changed by later input mutation', () => {
  const input = scenario('gaps', 6);
  const p = { index: 3, reasoning: '  The first value above six is at index three.  ' };
  const s = commitAttempt(newSession('test-session-44'), input, p, at);
  input.target = 9; p.index = 0;
  assert.equal(s.attempts[0].scenario.target, 6);
  assert.equal(s.attempts[0].prediction.index, 3);
  assert.equal(s.attempts[0].prediction.reasoning, 'The first value above six is at index three.');
});

let createElement, renderToStaticMarkup, BinarySearchLab;
before(async () => {
  const studio = join(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await build({
    stdin: { contents: `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BinarySearchLab from './src/studio-scenarios/binary-search-trace/BinarySearchLab.tsx';
export { createElement, renderToStaticMarkup, BinarySearchLab };`, resolveDir: studio, loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
  });
  const dir = mkdtempSync(join(tmpdir(), 'kairo-binary-search-'));
  const out = join(dir, 'render.cjs');
  writeFileSync(out, result.outputFiles[0].text);
  const module = await import(pathToFileURL(out).href);
  const exports = module.default ?? module;
  createElement = exports.createElement;
  renderToStaticMarkup = exports.renderToStaticMarkup;
  BinarySearchLab = exports.BinarySearchLab;
});

test('SSR learner UI is native-keyboard/reading-first and conceals answer before prediction', () => {
  const html = renderToStaticMarkup(createElement(BinarySearchLab));
  assert.match(html, /Computer Science Studio: trace binary search/);
  assert.match(html, /<fieldset/);
  assert.match(html, /<legend/);
  assert.match(html, /<select/);
  assert.match(html, /type="number"/);
  assert.match(html, /<textarea/);
  assert.match(html, /role="status"/);
  assert.match(html, /prepared educational model/i);
  assert.match(html, /local, unverified/i);
  assert.doesNotMatch(html, /Model answer:/);
  assert.doesNotMatch(html, /<canvas|WebGL|<svg|navigator\.mediaDevices/);
});

test('standalone preview mounts actual activity without shared route, provider or cloud writes', () => {
  const html = readFileSync(path('preview.html'), 'utf8');
  const preview = readFileSync(path('preview.tsx'), 'utf8');
  assert.match(html, /lang="en"/);
  assert.match(html, /\.\/preview\.tsx/);
  assert.match(preview, /createRoot/);
  assert.match(preview, /BinarySearchLab/);
  assert.doesNotMatch(preview, /fetch\(|getUserMedia|firebase|provider/);
});
