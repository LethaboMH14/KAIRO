import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import {
  DATASETS, MODEL_VERSION, PREPARED_SOURCE, assertScenario, assertPrediction,
  traceJoin, newSession, commitAttempt,
} from '../src/studio-scenarios/sql-join-trace/model.ts';

const at = '2026-10-25T08:00:00.000Z';
const scenario = (datasetId, join) => ({ datasetId, join });
const predict = (rowCount, unmatchedLeft) => ({
  rowCount, unmatchedLeft, reasoning: 'I counted each matching pair and unmatched left row.',
});
const base = join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/sql-join-trace');

test('all prepared datasets have correct INNER/LEFT cardinalities and unmatched counts', () => {
  const expected = {
    multiple: { inner: [4, 2], left: [6, 2] },
    missing: { inner: [0, 2], left: [2, 2] },
    nulls: { inner: [1, 1], left: [2, 1] },
  };
  for (const [datasetId, kinds] of Object.entries(expected)) for (const [join, [rows, unmatched]] of Object.entries(kinds)) {
    const result = traceJoin(scenario(datasetId, join));
    assert.deepEqual([result.rowCount, result.unmatchedLeft], [rows, unmatched]);
    assert.equal(result.rows.length, result.rowCount);
    assert.equal(result.steps.length, DATASETS[datasetId].left.length);
    assert.equal(result.steps.reduce((n, step) => n + step.emittedRows, 0), result.rowCount);
    assert.deepEqual(result, traceJoin(scenario(datasetId, join)), 'same input must replay identically');
  }
});

test('duplicate right keys multiply pairs without collapsing matching rows', () => {
  const r = traceJoin(scenario('multiple', 'inner'));
  assert.deepEqual(r.rows.map(row => [row.leftId, row.rightId]), [
    ['l1', 'r1'], ['l1', 'r2'], ['l4', 'r1'], ['l4', 'r2'],
  ]);
  assert.deepEqual(r.steps.map(step => step.matchingRightIds), [['r1', 'r2'], [], [], ['r1', 'r2']]);
});

test('NULL never matches NULL with equality ON; LEFT emits one null-extended row', () => {
  const inner = traceJoin(scenario('nulls', 'inner'));
  const left = traceJoin(scenario('nulls', 'left'));
  assert.deepEqual(inner.rows.map(row => [row.leftId, row.rightId]), [['l2', 'r2']]);
  assert.deepEqual(left.rows.map(row => [row.leftId, row.rightId]), [['l1', null], ['l2', 'r2']]);
  assert.equal(left.rows[0].rightLabel, null);
  assert.match(left.steps[0].reading, /NULL does not equal NULL/);
});

test('empty right table and zero-result INNER JOIN remain safe and explicit', () => {
  const inner = traceJoin(scenario('missing', 'inner'));
  const left = traceJoin(scenario('missing', 'left'));
  assert.deepEqual(inner.rows, []);
  assert.equal(left.rows.length, 2);
  assert.ok(left.rows.every(row => row.rightId === null && row.rightLabel === null));
  assert.deepEqual(left.steps.map(step => step.comparedRightIds), [[], []]);
});

test('scenario validation refuses arbitrary SQL, forged source, prototype keys and unknown JOIN', () => {
  for (const input of [null, [], {}, { datasetId: 'multiple' },
    { datasetId: 'multiple', join: 'outer' },
    { datasetId: '__proto__', join: 'inner' },
    { datasetId: 'constructor', join: 'left' },
    { datasetId: 'multiple', join: 'inner', sourceId: 'forged' },
    { datasetId: 'multiple', join: 'inner', sql: 'DROP TABLE users' }]) {
    assert.throws(() => assertScenario(input));
    assert.throws(() => traceJoin(input));
  }
  assert.equal(PREPARED_SOURCE.kind, 'prepared-public-reference');
  assert.match(PREPARED_SOURCE.url, /^https:\/\/www\.postgresql\.org\/docs\//);
});

test('predictions reject fractional, negative, overlarge, unsafe and control text', () => {
  const good = predict(4, 2);
  assert.doesNotThrow(() => assertPrediction(good));
  for (const bad of [
    { ...good, rowCount: NaN }, { ...good, rowCount: Infinity }, { ...good, rowCount: 1.5 },
    { ...good, rowCount: -1 }, { ...good, rowCount: 21 },
    { ...good, unmatchedLeft: 11 }, { ...good, unmatchedLeft: -1 },
    { ...good, unmatchedLeft: '2' }, { ...good, reasoning: 'too short' },
    { ...good, reasoning: 'x'.repeat(401) }, { ...good, reasoning: 'A valid sentence\u0001' },
    { ...good, privateSourceText: 'forged' },
  ]) assert.throws(() => assertPrediction(bad));
});

test('two different scenarios preserve honest local-only attempt provenance and independent IDs', () => {
  const start = newSession('sql-session-42');
  const one = commitAttempt(start, scenario('multiple', 'inner'), predict(4, 2), at);
  assert.equal(start.attempts.length, 0);
  assert.equal(one.attempts[0].correct, true);
  assert.equal(one.attempts[0].id, 'sql-session-42-round-1');
  assert.equal(one.attempts[0].modelVersion, MODEL_VERSION);
  assert.equal(one.attempts[0].sourceKind, PREPARED_SOURCE.kind);
  assert.equal(one.attempts[0].sourceRevision, PREPARED_SOURCE.revision);
  assert.equal(one.attempts[0].evidenceStatus, 'local-unverified');
  const two = commitAttempt(one, scenario('nulls', 'left'), predict(1, 1), '2026-10-25T08:01:00.000Z');
  assert.equal(two.attempts.length, 2);
  assert.equal(two.attempts[1].correct, false);
  assert.equal(two.attempts[1].actual.rowCount, 2);
  assert.notEqual(two.attempts[0].id, two.attempts[1].id);
  assert.throws(() => commitAttempt(two, scenario('missing', 'inner'), predict(0, 2), at), /Two attempts/);
  assert.throws(() => commitAttempt(one, scenario('multiple', 'inner'), predict(4, 2), at), /different dataset/);
});

test('malformed sessions, timestamps and source override are rejected', () => {
  assert.throws(() => newSession('bad id'));
  const session = newSession('sql-session-43');
  for (const bad of ['yesterday', '2026-10-25T08:00:00Z', '2026-02-30T08:00:00.000Z']) {
    assert.throws(() => commitAttempt(session, scenario('multiple', 'inner'), predict(4, 2), bad), /ISO/);
  }
  assert.throws(() => commitAttempt(session, { ...scenario('multiple', 'inner'), sourceId: 'not-reviewed' }, predict(4, 2), at));
  assert.throws(() => commitAttempt({ id: 'wrong', attempts: [] }, scenario('multiple', 'inner'), predict(4, 2), at));
});

test('attempts snapshot prediction and scenario without retaining caller-owned references', () => {
  const input = scenario('multiple', 'inner');
  const guess = predict(4, 2);
  const s = commitAttempt(newSession('sql-session-44'), input, guess, at);
  input.datasetId = 'nulls'; guess.rowCount = 0;
  assert.equal(s.attempts[0].scenario.datasetId, 'multiple');
  assert.equal(s.attempts[0].prediction.rowCount, 4);
});

let createElement, renderToStaticMarkup, SqlJoinLab;
before(async () => {
  const studio = join(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await build({
    stdin: { contents: `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SqlJoinLab from './src/studio-scenarios/sql-join-trace/SqlJoinLab.tsx';
export { createElement, renderToStaticMarkup, SqlJoinLab };`, resolveDir: studio, loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
  });
  const dir = mkdtempSync(join(tmpdir(), 'kairo-sql-join-'));
  const out = join(dir, 'render.cjs');
  writeFileSync(out, result.outputFiles[0].text);
  const mod = await import(pathToFileURL(out).href);
  const exports = mod.default ?? mod;
  createElement = exports.createElement;
  renderToStaticMarkup = exports.renderToStaticMarkup;
  SqlJoinLab = exports.SqlJoinLab;
});

test('reading-first SSR has semantic labelled tables and prepared reference without leaking answer', () => {
  const html = renderToStaticMarkup(createElement(SqlJoinLab));
  assert.match(html, /Computer Science Studio: SQL JOIN detective/);
  assert.match(html, /<table>/);
  assert.match(html, /<caption>/);
  assert.match(html, /scope="col"/);
  assert.match(html, /<fieldset/);
  assert.match(html, /type="number"/);
  assert.match(html, /Commit prediction and reveal the join/);
  assert.match(html, /postgresql\.org/);
  assert.match(html, /not saved to your KAIRO account/);
  assert.doesNotMatch(html, /Model output:/, 'answer must not appear before a prediction');
  assert.doesNotMatch(html, /<canvas|<iframe/i, 'native reading alternative needs no 3D or embedded provider');
});

test('standalone preview stays in the claimed subtree, no app router or global style changes', () => {
  const html = readFileSync(join(base, 'preview.html'), 'utf8');
  const tsx = readFileSync(join(base, 'preview.tsx'), 'utf8');
  assert.match(html, /preview\.tsx/);
  assert.match(tsx, /SqlJoinLab/);
  assert.doesNotMatch(tsx, /StudioRouter|localStorage|fetch\(/);
});
