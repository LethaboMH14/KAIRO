import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SOURCE, SCENARIOS, SPEED_RATIOS, VERSION, EVIDENCE_LEVEL, solveScenario,
  newRecord, validateRecord, appendAttempt, replayRecord, importRecord, exportRecord } from '../src/studio-scenarios/pump-static-head-trap-20261026/model.mjs';

const example = (id, ratio, outcome, flowLps = null) => ({
  scenarioId: id, ratio, prediction: { outcome, flowLps },
  explanation: 'The fixed lift stays unchanged when the fictional speed changes.',
});
const withFirst = () => appendAttempt(newRecord(), example('low-static', 0.8, 'flow', 29));
const withBoth = () => appendAttempt(withFirst(), example('high-static', 0.8, 'no-intersection'));

test('official concept provenance is explicit; coefficients are labelled fictional', () => {
  assert.match(SOURCE.url, /^https:\/\/datatool\.pumps\.org\/pump-fundamentals\/pump-curves$/);
  assert.match(SOURCE.revision, /fictional/i);
  assert.deepEqual(SCENARIOS.map((s) => s.id), ['low-static', 'high-static']);
  assert.deepEqual(SPEED_RATIOS, [0.8, 0.9]);
});

test('low static head has a positive intersection that satisfies both curves', () => {
  const row = solveScenario('low-static', 0.8);
  assert.equal(row.outcome, 'flow');
  assert.ok(row.flowLps > 0);
  const pump = 36 * 0.8 ** 2 - 0.012 * row.flowLps ** 2;
  const system = 6 + 0.010 * row.flowLps ** 2;
  assert.ok(Math.abs(pump - system) < 0.0001);
  assert.ok(Math.abs(row.intersectionHeadM - system) < 0.0001);
});

test('high static head at 80% has no positive intersection despite naive flow estimate', () => {
  const row = solveScenario('high-static', 0.8);
  assert.equal(row.outcome, 'no-intersection');
  assert.equal(row.flowLps, null);
  assert.equal(row.intersectionHeadM, null);
  assert.ok(row.naiveAffinityFlowLps > 0);
  assert.ok(row.scaledShutoffHeadM < row.staticHeadM);
  assert.match(row.caveat, /not a measured zero motor-power claim/i);
});

test('high static head at 90% has a positive but smaller-than-naive flow', () => {
  const row = solveScenario('high-static', 0.9);
  assert.equal(row.outcome, 'flow');
  assert.ok(row.flowLps > 0 && row.flowLps < row.naiveAffinityFlowLps);
});

test('monotonicity and nonnegative finite outputs for all offered scenarios/speeds', () => {
  for (const scenario of SCENARIOS) {
    const slow = solveScenario(scenario.id, 0.8);
    const fast = solveScenario(scenario.id, 0.9);
    assert.ok(fast.scaledShutoffHeadM > slow.scaledShutoffHeadM);
    assert.ok((fast.flowLps ?? 0) >= (slow.flowLps ?? 0));
    for (const row of [slow, fast]) for (const value of [row.baseFlowLps, row.naiveAffinityFlowLps, row.scaledShutoffHeadM]) {
      assert.ok(Number.isFinite(value) && value >= 0);
    }
  }
});

test('rejects unsupported scenarios and ratios including NaN and string coercion', () => {
  for (const id of ['other', '__proto__', null]) assert.throws(() => solveScenario(id, 0.8));
  for (const ratio of [0, 1, '0.8', NaN, Infinity, null]) assert.throws(() => solveScenario('low-static', ratio));
});

test('records are action-only and independently replayed, with two distinct rounds', () => {
  const record = withBoth();
  assert.equal(record.version, VERSION);
  assert.equal(record.evidenceLevel, EVIDENCE_LEVEL);
  assert.equal(record.attempts.length, 2);
  assert.equal('result' in record.attempts[0], false);
  const replay = replayRecord(record);
  assert.equal(replay.length, 2);
  assert.equal(replay[0].correctOutcome, true);
  assert.equal(replay[0].withinTwoLps, true);
  assert.equal(replay[1].correctOutcome, true);
  assert.equal(replay[1].withinTwoLps, false);
  assert.throws(() => appendAttempt(record, example('low-static', 0.8, 'flow', 10)), /completed/);
});

test('first prediction is committed before reveal; wrong prediction is retained', () => {
  const record = appendAttempt(newRecord(), example('low-static', 0.8, 'no-intersection'));
  const [result] = replayRecord(record);
  assert.equal(result.correctOutcome, false);
  assert.equal(record.attempts[0].prediction.outcome, 'no-intersection');
  assert.equal(result.result.outcome, 'flow');
});

test('rejects forged result, score, owner, source revision or verified evidence', () => {
  const record = withFirst();
  for (const field of ['result', 'score', 'ownerId', 'modelOutput']) {
    assert.throws(() => validateRecord({ ...record, [field]: 1 }));
    assert.throws(() => validateRecord({ ...record, attempts: [{ ...record.attempts[0], [field]: 1 }] }));
  }
  assert.throws(() => validateRecord({ ...record, sourceRevision: 'changed' }));
  assert.throws(() => validateRecord({ ...record, evidenceLevel: 'verified' }));
  assert.throws(() => validateRecord({ ...record, version: 'v2' }));
});

test('rejects out-of-order/duplicate round and forged prediction keys', () => {
  assert.throws(() => appendAttempt(newRecord(), example('high-static', 0.8, 'no-intersection')));
  assert.throws(() => appendAttempt(withFirst(), example('low-static', 0.8, 'flow', 20)));
  assert.throws(() => appendAttempt(newRecord(), { ...example('low-static', 0.8, 'flow', 20), prediction: { outcome: 'flow', flowLps: 20, correct: true } }));
});

test('rejects malformed numerical and explanation input', () => {
  for (const value of [NaN, Infinity, -1, 61, '12', null]) assert.throws(() => appendAttempt(newRecord(), example('low-static', 0.8, 'flow', value)));
  assert.throws(() => appendAttempt(newRecord(), example('low-static', 0.8, 'no-intersection', 1)));
  assert.throws(() => appendAttempt(newRecord(), { ...example('low-static', 0.8, 'flow', 20), explanation: 'short' }));
  assert.throws(() => appendAttempt(newRecord(), { ...example('low-static', 0.8, 'flow', 20), explanation: 'x'.repeat(801) }));
  assert.throws(() => appendAttempt(newRecord(), { ...example('low-static', 0.8, 'flow', 20), explanation: 'safe explanation with\u0000 invalid control' }));
});

test('JSON import/export preserves actions but recomputes outcomes', () => {
  const before = withBoth();
  const serialized = exportRecord(before);
  const after = importRecord(serialized);
  assert.deepEqual(after, before);
  assert.deepEqual(replayRecord(after), replayRecord(before));
  assert.doesNotMatch(serialized, /correctOutcome|withinTwoLps|scaledShutoffHeadM/);
});

test('invalid, oversized, injected or stale imports fail closed', () => {
  for (const text of ['', '{', '[]', '{}', 'x'.repeat(12_001), JSON.stringify({ ...withBoth(), outcome: 'flow' }),
    JSON.stringify({ ...withBoth(), attempts: [withBoth().attempts[0], withBoth().attempts[0]] })]) {
    assert.throws(() => importRecord(text));
  }
});

test('preview has explicit accessible labels, native controls, reading fallback and limitations', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(resolve(here, '../src/studio-scenarios/pump-static-head-trap-20261026/preview.html'), 'utf8');
  for (const id of ['speedRatio', 'outcome', 'flowGuess', 'explanation', 'importFile']) assert.match(html, new RegExp(`for="${idy"`));
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /not a real pump operating or safety guide/i);
  assert.match(html, /local, unverified practice/i);
  assert.match(html, /max-width: 35rem/);
  const app = readFileSync(resolve(here, '../src/studio-scenarios/pump-static-head-trap-20261026/app.mjs'), 'utf8');
  assert.match(app, /textContent/);
  assert.doesNotMatch(app, /innerHTML|eval\(/);
});
