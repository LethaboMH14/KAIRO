import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CASES, MAX_REPLAY_BYTES, SOURCE_REVISION, VERSION,
  appendAttempt, newReplay, parseReplay, replay, solve, trace
} from '../src/studio-scenarios/pump-tank-balance-20261026/model.mjs';

const a = (caseId, flowLpm, overrides = {}) => ({
  kind: 'commit', caseId, flowLpm, predictedFinalL: 400,
  predictedOutcome: 'contained', explanation: 'I subtract the requested outlet from available water.', ...overrides
});

for (const scenario of CASES) {
  test(`${scenario.id}: every selectable flow conserves volume and respects capacity`, () => {
    for (const option of scenario.options) {
      const result = solve(scenario.id, option);
      assert.equal(result.initialL + result.inletL - result.requestedOutletL,
        result.finalL + result.spillL - result.unmetDemandL);
      assert.ok(result.finalL >= 0 && result.finalL <= scenario.capacityL);
      assert.ok(result.spillL === 0 || result.unmetDemandL === 0);
      assert.equal(trace(result).length, 7);
    }
  });
}

test('round 1 shows real unmet demand when requested outlet exceeds available volume', () => {
  const result = solve('inflow-change', 20);
  assert.deepEqual([result.finalL, result.unmetDemandL, result.spillL, result.outcome], [0, 40, 0, 'unmet-demand']);
});

test('round 2 shows real spill at low outlet demand', () => {
  const result = solve('demand-change', 20);
  assert.deepEqual([result.finalL, result.spillL, result.unmetDemandL, result.outcome], [1000, 150, 0, 'spill']);
});

test('round 2 can avoid spill when outlet demand increases', () => {
  const result = solve('demand-change', 80);
  assert.deepEqual([result.finalL, result.spillL, result.outcome], [790, 0, 'contained']);
});

test('unknown scenarios, unsupported flows, NaN and string flows are rejected', () => {
  for (const [id, flow] of [['missing', 20], ['inflow-change', 999], ['inflow-change', NaN], ['inflow-change', '20']]) {
    assert.throws(() => solve(id, flow), TypeError);
  }
});

test('two independent committed predictions replay with deterministic derived results', () => {
  const first = appendAttempt(newReplay(), a('inflow-change', 20, { predictedFinalL: 0, predictedOutcome: 'unmet-demand' }));
  const second = appendAttempt(first, a('demand-change', 20, { predictedFinalL: 990, predictedOutcome: 'spill' }));
  const attempts = replay(second);
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].differenceL, 0);
  assert.equal(attempts[1].differenceL, 10);
  assert.equal(attempts[1].outcomeMatches, true);
  assert.ok(attempts.every((x) => x.verification === 'local-unverified'));
  assert.deepEqual(parseReplay(JSON.stringify(second)), second);
  assert.equal(first.actions.length, 1, 'append is immutable');
});

test('later round cannot be submitted first or first round repeated', () => {
  assert.throws(() => appendAttempt(newReplay(), a('demand-change', 20)), /round/);
  const first = appendAttempt(newReplay(), a('inflow-change', 20));
  assert.throws(() => appendAttempt(first, a('inflow-change', 20)), /round/);
});

test('third attempt is rejected after both rounds', () => {
  const first = appendAttempt(newReplay(), a('inflow-change', 20));
  const second = appendAttempt(first, a('demand-change', 20));
  assert.throws(() => appendAttempt(second, a('inflow-change', 20)), /complete/);
});

test('forged grades, result fields, account identities and verification flags fail closed', () => {
  const original = appendAttempt(newReplay(), a('inflow-change', 20));
  for (const key of ['grade', 'result', 'ownerId', 'verification', 'correct']) {
    const forged = structuredClone(original);
    forged.actions[0][key] = key === 'result' ? { finalL: 9999 } : true;
    assert.throws(() => replay(forged), /fields/);
  }
});

test('forged top-level data and source revisions are rejected', () => {
  const original = appendAttempt(newReplay(), a('inflow-change', 20));
  assert.throws(() => replay({ ...original, authenticated: true }), /fields/);
  assert.throws(() => replay({ ...original, sourceRevision: 'different' }), /revision/);
  assert.throws(() => replay({ ...original, version: VERSION + '/2' }), /revision/);
  assert.equal(original.sourceRevision, SOURCE_REVISION);
});

test('invalid predictions, outcomes, explanations and unsupported flow options are rejected', () => {
  const cases = [
    { predictedFinalL: -1 }, { predictedFinalL: 1.5 }, { predictedFinalL: Infinity },
    { predictedFinalL: 99999 }, { predictedOutcome: 'guaranteed-safe' },
    { explanation: 'short' }, { explanation: 'x'.repeat(501) },
    { explanation: 'a\u0000'.repeat(10) }, { flowLpm: 27 }
  ];
  for (const overrides of cases) assert.throws(() => appendAttempt(newReplay(), a('inflow-change', 20, overrides)));
});

test('malformed JSON, oversized payloads and prototype-pollution-looking fields fail closed', () => {
  assert.throws(() => parseReplay('{'), /JSON/);
  assert.throws(() => parseReplay(' '.repeat(MAX_REPLAY_BYTES + 1)), /large/);
  assert.throws(() => parseReplay(JSON.stringify({ ...newReplay(), __proto__: null, actions: [{ ...a('inflow-change', 20), ['__proto__']: 'unsafe' }] })), /fields/);
});

test('non-object replay and duplicate action count are rejected', () => {
  for (const value of [null, [], {}, { ...newReplay(), actions: 'not-array' },
    { ...newReplay(), actions: [a('inflow-change', 20), a('demand-change', 20), a('demand-change', 20)] }]) {
    assert.throws(() => replay(value));
  }
});

test('model is deterministic and source/preview contract stays isolated', async () => {
  assert.deepEqual(solve('demand-change', 35), solve('demand-change', 35));
  const dir = new URL('../src/studio-scenarios/pump-tank-balance-20261026/', import.meta.url);
  const html = readFileSync(new URL('preview.html', dir), 'utf8');
  const app = readFileSync(new URL('app.mjs', dir), 'utf8');
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /name="viewport"/);
  assert.match(app, /tabindex="-1"/);
  assert.match(app, /role="status"/);
  assert.match(app, /Numeric reading alternative/);
  assert.match(app, /parseReplay\(await file\.text\(\)\)/);
  assert.match(app, /expectedRevision !== revision/);
  await import(new URL('app.mjs', dir));
});
