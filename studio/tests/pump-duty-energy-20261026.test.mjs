import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE, SCENARIOS, VERSION, EVIDENCE_LEVEL, calculate, newRecord,
  appendAttempt, replayRecord, validateRecord, importRecord, exportRecord } from '../src/studio-scenarios/pump-duty-energy-20261026/model.mjs';
const action = (index, power, hours, lowerEnergy = 'A', differenceKwh = 0.5) => ({
  scenarioId: SCENARIOS[index].id, bPowerKw: power, bHours: hours,
  prediction: { lowerEnergy, differenceKwh },
  explanation: 'Power is a rate, while energy accumulates over the full elapsed time.',
});
const first = () => appendAttempt(newRecord(), action(0, 1.2, 3.5, 'A', 0.6));
const both = () => appendAttempt(first(), action(1, 1.5, 2, 'B', 0.15));

test('source and evidence status are explicit and never claim external pump validation', () => {
  assert.equal(SOURCE.modelVersion, 'kairo-pump-lab-model/1');
  assert.match(SOURCE.status, /not externally expert-reviewed/i);
  assert.match(SOURCE.revision, /^[0-9a-f]{40}\+/);
  assert.equal(EVIDENCE_LEVEL, 'local-unverified');
  assert.equal(SCENARIOS.length, 2);
});
test('kW multiplied by hours produces kWh for every offered choice', () => {
  for (const [i, s] of SCENARIOS.entries()) {
    for (const p of s.bPowerKw) for (const h of s.bHours) {
      const r = calculate(i, p, h);
      assert.ok(Math.abs(r.aKwh - s.a.powerKw * s.a.hours) < 1e-9);
      assert.ok(Math.abs(r.bKwh - p * h) < 1e-9);
      assert.ok(Math.abs(r.differenceKwh - Math.abs(r.aKwh - r.bKwh)) < 1e-9);
      assert.equal(r.lowerEnergy, r.aKwh < r.bKwh ? 'A' : r.aKwh > r.bKwh ? 'B' : 'equal');
      assert.match(r.caveat, /not measured electrical use/i);
    }
  }
});
test('lower instantaneous shaft power can use more shaft energy over longer time', () => {
  const r = calculate(0, 1.2, 3.5);
  assert.equal(r.aKwh, 3.6);
  assert.equal(r.bKwh, 4.2);
  assert.equal(r.lowerEnergy, 'A');
  assert.ok(r.bPowerKw < r.aPowerKw);
});
test('different offered durations reverse the correct choice without changing shaft power', () => {
  assert.equal(calculate(0, 1.2, 2.5).lowerEnergy, 'B');
  assert.equal(calculate(0, 1.2, 3.5).lowerEnergy, 'A');
});
test('two independently submitted actions replay from pinned source and preserve errors', () => {
  const r = both();
  assert.equal(r.version, VERSION);
  assert.equal(r.attempts.length, 2);
  const replay = replayRecord(r);
  assert.equal(replay[0].correctDirection, true);
  assert.equal(replay[0].withinHalfKwh, true);
  assert.equal(replay[1].correctDirection, true);
  assert.equal(replay[1].withinHalfKwh, true);
  assert.equal('result' in r.attempts[0], false);
  assert.throws(() => appendAttempt(r, action(0, 1.2, 3.5)), /completed/);
});
test('incorrect learner prediction is retained rather than silently replaced', () => {
  const r = appendAttempt(newRecord(), action(0, 1.2, 3.5, 'B', 9));
  assert.equal(replayRecord(r)[0].correctDirection, false);
  assert.equal(replayRecord(r)[0].withinHalfKwh, false);
  assert.equal(r.attempts[0].prediction.lowerEnergy, 'B');
});
test('unsupported rounds, schedule values, coercion and nonfinite predictions are rejected', () => {
  for (const bad of [NaN, Infinity, '1.2', 0, 1.3, null]) assert.throws(() => calculate(0, bad, 3.5));
  for (const bad of [NaN, Infinity, '3.5', 0, 4, null]) assert.throws(() => calculate(0, 1.2, bad));
  assert.throws(() => calculate(2, 1.2, 3.5));
  for (const bad of [NaN, Infinity, -1, 11, '0.5', null]) assert.throws(() => appendAttempt(newRecord(), action(0, 1.2, 3.5, 'A', bad)));
  assert.throws(() => appendAttempt(newRecord(), action(0, 1.2, 3.5, 'not-choice')));
});
test('out-of-order and duplicate attempts cannot be imported or appended', () => {
  assert.throws(() => appendAttempt(newRecord(), action(1, 1.5, 2)));
  assert.throws(() => appendAttempt(first(), action(0, 1.2, 3.5)));
  assert.throws(() => validateRecord({ ...both(), attempts: [both().attempts[0], both().attempts[0]] }));
});
test('strict action-only schema rejects scores, owners, computed values and forged verification', () => {
  const r = first();
  for (const key of ['ownerId', 'score', 'result', 'verified']) {
    assert.throws(() => validateRecord({ ...r, [key]: true }));
    assert.throws(() => validateRecord({ ...r, attempts: [{ ...r.attempts[0], [key]: true }] }));
  }
  assert.throws(() => validateRecord({ ...r, sourceRevision: 'different' }));
  assert.throws(() => validateRecord({ ...r, evidenceLevel: 'verified' }));
  assert.throws(() => validateRecord({ ...r, version: 'v2' }));
  assert.throws(() => appendAttempt(newRecord(), { ...action(0, 1.2, 3.5), prediction: { lowerEnergy: 'A', differenceKwh: 0.5, correct: true } }));
});
test('explanation requires readable bounded text', () => {
  assert.throws(() => appendAttempt(newRecord(), { ...action(0, 1.2, 3.5), explanation: 'short' }));
  assert.throws(() => appendAttempt(newRecord(), { ...action(0, 1.2, 3.5), explanation: 'x'.repeat(801) }));
  assert.throws(() => appendAttempt(newRecord(), { ...action(0, 1.2, 3.5), explanation: 'Readable prediction\u0000 with forbidden control' }));
});
test('JSON round trip stores only actions; replay derives fresh results', () => {
  const original = both();
  const json = exportRecord(original);
  assert.deepEqual(importRecord(json), original);
  assert.deepEqual(replayRecord(importRecord(json)), replayRecord(original));
  assert.doesNotMatch(json, /correctDirection|withinHalfKwh|aKwh|bKwh/);
});
test('malformed, oversized and injected JSON is rejected', () => {
  for (const value of ['', '{', '[]', '{}', 'x'.repeat(12001), JSON.stringify({ ...first(), result: 999 }),
    JSON.stringify({ ...first(), attempts: [{ ...first().attempts[0], prediction: { lowerEnergy: 'A', differenceKwh: 0, score: 1 } }] })]) {
    assert.throws(() => importRecord(value));
  }
});
test('standalone preview has keyboard/reading labels, visible limitations and safe DOM output', () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const html = readFileSync(resolve(dir, '../src/studio-scenarios/pump-duty-energy-20261026/preview.html'), 'utf8');
  for (const id of ['bPowerKw', 'bHours', 'lowerEnergy', 'differenceKwh', 'explanation', 'importFile']) {
    assert.match(html, new RegExp(`for="${id}"`));
  }
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /not electrical energy or billing/i);
  assert.match(html, /local, unverified/i);
  assert.match(html, /<table/);
  const js = readFileSync(resolve(dir, '../src/studio-scenarios/pump-duty-energy-20261026/app.mjs'), 'utf8');
  assert.match(js, /textContent/);
  assert.doesNotMatch(js, /innerHTML|eval\(/);
});
