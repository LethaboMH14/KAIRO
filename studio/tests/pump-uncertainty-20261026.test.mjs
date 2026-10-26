import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SCENARIOS, VERSION, SOURCE_REVISION, EVIDENCE_STATUS, LABELS,
  evaluateChoice, newRecord, appendAttempt, replayRecord, importRecord, exportRecord } from '../src/studio-scenarios/pump-uncertainty-20261026/model.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const scenarioPath = join(here, '../src/studio-scenarios/pump-uncertainty-20261026');
const choice = (scenario, overrides = {}) => ({ scenarioId: scenario.id, reading: scenario.readings[0],
  error: scenario.errors[0], prediction: 'contained', explanation: 'Both interval bounds are within the expected range.', ...overrides });
const first = SCENARIOS[0];
const second = SCENARIOS[1];
const clone = (value) => JSON.parse(JSON.stringify(value));

test('source and evidence status are explicitly unverified, with two independent scenarios', () => {
  assert.match(VERSION, /^kairo-pump-uncertainty\/1$/);
  assert.match(SOURCE_REVISION, /MODEL\.md:kairo-pump-lab-model\/1/);
  assert.equal(EVIDENCE_STATUS, 'local-unverified');
  assert.deepEqual(SCENARIOS.map((x) => x.id), ['pressure', 'flow']);
  assert.equal(new Set(SCENARIOS.map((x) => x.unit)).size, 2);
});

test('independent interval oracle agrees on every prepared combination', () => {
  let cases = 0;
  for (const s of SCENARIOS) for (const reading of s.readings) for (const error of s.errors) {
    const actual = evaluateChoice(s.id, reading, error);
    const expectedLow = s.expected - s.modelError;
    const expectedHigh = s.expected + s.modelError;
    const measuredLow = reading - error;
    const measuredHigh = reading + error;
    const oracle = measuredHigh < expectedLow - 1e-8 || measuredLow > expectedHigh + 1e-8
      ? 'separated' : measuredLow >= expectedLow - 1e-8 && measuredHigh <= expectedHigh + 1e-8
        ? 'contained' : 'overlap';
    assert.equal(actual.classification, oracle, `${s.id} reading=${reading} error=${error}`);
    assert.equal(actual.expected.low, expectedLow);
    assert.equal(actual.expected.high, expectedHigh);
    assert.ok(Math.abs(actual.measured.low - measuredLow) < 1e-8);
    assert.ok(Math.abs(actual.measured.high - measuredHigh) < 1e-8);
    cases++;
  }
  assert.equal(cases, 32);
});

test('touching intervals are overlap, never separated', () => {
  assert.equal(evaluateChoice('pressure', 85, 2).classification, 'overlap');
  assert.equal(evaluateChoice('flow', 13.2, 0.6).classification, 'overlap');
});

test('contained reading is not called a verified healthy pump', () => {
  assert.equal(evaluateChoice('pressure', 80, 0.5).classification, 'contained');
  assert.equal(evaluateChoice('flow', 12, 0.2).classification, 'contained');
  assert.ok(!Object.values(LABELS).some((label) => /healthy|diagnos/i.test(label)));
});

test('wide sensor uncertainty does not falsely assert containment', () => {
  assert.equal(evaluateChoice('pressure', 80, 6).classification, 'overlap');
  assert.equal(evaluateChoice('flow', 12, 1.2).classification, 'overlap');
});

test('clearly disjoint intervals are separated', () => {
  assert.equal(evaluateChoice('pressure', 91, 2.5).classification, 'separated');
  assert.equal(evaluateChoice('flow', 14, 0.2).classification, 'separated');
});

test('rejects unknown scenario, invalid readings, nonnumeric or invalid errors', () => {
  for (const args of [['missing', 80, 2], ['pressure', '80', 2], ['pressure', 99, 2],
    ['pressure', NaN, 2], ['pressure', Infinity, 2], ['pressure', 80, -1],
    ['pressure', 80, '2'], ['flow', 80, 2], ['pressure', 80, NaN]]) {
    assert.throws(() => evaluateChoice(...args));
  }
});

test('two distinct attempts retain independent choices and explanations', () => {
  const r0 = newRecord();
  const r1 = appendAttempt(r0, choice(first));
  const r2 = appendAttempt(r1, choice(second, { reading: 14, error: 0.2,
    prediction: 'separated', explanation: 'This second reading is beyond the upper model bound.' }));
  assert.equal(r0.actions.length, 0);
  assert.equal(r1.actions.length, 1);
  assert.equal(r2.actions.length, 2);
  assert.equal(replayRecord(r2).length, 2);
  assert.equal(replayRecord(r2)[1].correct, true);
  assert.notEqual(r2.actions[0].explanation, r2.actions[1].explanation);
  assert.throws(() => appendAttempt(r2, choice(first)), /ALREADY_COMPLETE/);
});

test('wrong order, duplicated scenario, invalid prediction and empty reasoning fail closed', () => {
  assert.throws(() => appendAttempt(newRecord(), choice(second)), /WRONG_ROUND/);
  assert.throws(() => appendAttempt(newRecord(), choice(first, { prediction: 'verified-healthy' })), /INVALID_PREDICTION/);
  assert.throws(() => appendAttempt(newRecord(), choice(first, { explanation: 'too short' })), /INVALID_EXPLANATION/);
  assert.throws(() => appendAttempt(newRecord(), choice(first, { explanation: '    Twelve chars   ' })), /INVALID_EXPLANATION/);
  assert.throws(() => appendAttempt(newRecord(), choice(first, { explanation: 'valid explanation\nmalicious line' })), /INVALID_EXPLANATION/);
  const r1 = appendAttempt(newRecord(), choice(first));
  assert.throws(() => appendAttempt(r1, choice(first)), /WRONG_ROUND/);
});

test('record rejects forged scores, owner IDs, derived outcomes and extra keys', () => {
  const record = appendAttempt(newRecord(), choice(first));
  for (const [key, value] of [['score', 1], ['ownerUid', 'someone'], ['classification', 'contained'], ['verified', true]]) {
    const forged = clone(record); forged.actions[0][key] = value;
    assert.throws(() => replayRecord(forged), /INVALID_ACTION_SCHEMA/);
  }
  const top = clone(record); top.authenticated = true;
  assert.throws(() => replayRecord(top), /INVALID_RECORD_SCHEMA/);
});

test('source revision, model version, evidence status and extra attempts fail closed', () => {
  const record = appendAttempt(newRecord(), choice(first));
  for (const [key, value] of [['sourceRevision', 'new-revision'], ['version', 'future-version'],
    ['evidenceStatus', 'verified']]) {
    const mutated = clone(record); mutated[key] = value;
    assert.throws(() => replayRecord(mutated));
  }
  const over = clone(record); over.actions.push(choice(second), choice(second));
  assert.throws(() => replayRecord(over), /INVALID_ACTION_COUNT/);
});

test('JSON export/import recomputes the mathematical outcome from actions', () => {
  const record = appendAttempt(appendAttempt(newRecord(), choice(first)), choice(second));
  const json = exportRecord(record);
  const restored = importRecord(json);
  assert.deepEqual(restored, record);
  assert.equal(replayRecord(restored)[0].classification, 'contained');
  assert.equal(replayRecord(restored)[1].classification, 'contained');
  assert.ok(!json.includes('classification'));
  assert.ok(!json.includes('correct'));
});

test('JSON import rejects non-JSON, oversized payload, arrays and arbitrary result fields', () => {
  for (const input of ['{', '[]', '{}', ' '.repeat(8193), JSON.stringify({ ...newRecord(), score: 1 })]) {
    assert.throws(() => importRecord(input));
  }
  assert.throws(() => importRecord(null), /INVALID_JSON_SIZE/);
});

test('JSON import rejects prototype-looking and non-schema data without running code', () => {
  const polluted = JSON.stringify({ ...newRecord(), actions: [{ ...choice(first), __proto__: { authenticated: true } }] });
  // JS object-literal __proto__ is not an own property; direct JSON injection must still be rejected.
  const json = polluted.replace('"prediction":', '"__proto__":{"authenticated":true},"prediction":');
  assert.throws(() => importRecord(json), /INVALID_ACTION_SCHEMA/);
  assert.equal({}.authenticated, undefined);
});

test('HTML preview has keyboard-native forms, reading equivalent and no network dependency', () => {
  const html = readFileSync(join(scenarioPath, 'preview.html'), 'utf8');
  const app = readFileSync(join(scenarioPath, 'app.mjs'), 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<main id="pump-uncertainty-app"><\/main>/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(app, /document\.createElement\('fieldset'\)|el\('fieldset'\)/);
  assert.match(app, /input\.type = 'radio'/);
  assert.match(app, /aria-live/);
  assert.match(app, /table/);
  assert.match(app, /\.focus\(\)/);
  assert.doesNotMatch(html + app, /fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|navigator\.mediaDevices/);
});

test('explanation is rendered as text, never as HTML', () => {
  const app = readFileSync(join(scenarioPath, 'app.mjs'), 'utf8');
  assert.match(app, /node\.textContent = text/);
  assert.doesNotMatch(app, /innerHTML|insertAdjacentHTML|eval\(/);
});
