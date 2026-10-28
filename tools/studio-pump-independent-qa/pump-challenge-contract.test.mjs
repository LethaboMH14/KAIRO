import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHALLENGE_SCHEMA, CONCEPT_SOURCE, PROVENANCE, SCENARIOS,
  initialState, restore, scenarioResult, serialize, transition,
} from '../../studio/src/studio-scenarios/pump-what-if/challenge.ts';
import {
  DOMAIN, HEALTHY, INITIAL_TANKS, MODEL_VERSION, MODEL_STATUS,
  CIRCUIT, operatingPoint,
} from '../../studio/src/pump-lab/physics.ts';

// Independent black-box acceptance of PR #55. These tests do not alter its files.
// Synthetic prepared scenarios are not calibrated real equipment or learner evidence.
const note = 'A change in valve opening shifts resistance and the model operating point.';
const predict = (direction, estimateLps) => ({ type: 'predict', direction, estimateLps });
const explain = () => ({ type: 'explain', note });
const round = (state, direction, estimateLps) =>
  transition(transition(state, predict(direction, estimateLps)), explain());
const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, 'Expected ' + actual + ' to be within ' + tolerance + ' of ' + expected);

test('scenario contract is a bounded, labelled two-round educational exercise', () => {
  assert.equal(CHALLENGE_SCHEMA, 'kairo-pump-what-if/1');
  assert.equal(PROVENANCE, 'prepared-model-only');
  assert.match(MODEL_STATUS, /illustrative|not validated/i);
  assert.equal(SCENARIOS.length, 2);
  assert.deepEqual(SCENARIOS.map(s => s.independent), [false, true]);
  assert.equal(new Set(SCENARIOS.map(s => s.id)).size, 2);
  assert.match(CONCEPT_SOURCE.url, /^https:\/\/datatool\.pumps\.org\//);
  assert.match(CONCEPT_SOURCE.checked, /^20\d{2}-\d{2}-\d{2}$/);
  assert.doesNotMatch(CONCEPT_SOURCE.claim, /calibrated|certified|field-tested/i);
  for (const scenario of SCENARIOS) {
    assert.ok(Number.isInteger(scenario.speedRpm));
    assert.ok(scenario.speedRpm >= DOMAIN.speedRpm.min && scenario.speedRpm <= DOMAIN.speedRpm.max);
    for (const valve of [scenario.beforeValvePct, scenario.afterValvePct]) {
      assert.ok(valve > 0 && valve <= DOMAIN.valvePct.max);
    }
    assert.notEqual(scenario.beforeValvePct, scenario.afterValvePct);
  }
});

test('both consequences independently match the mounted healthy pump physics', () => {
  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i], outcome = scenarioResult(i);
    const calc = valvePct => operatingPoint({
      speedRpm: s.speedRpm, valvePct,
      tanks: { ...INITIAL_TANKS }, fault: { ...HEALTHY },
    });
    const before = calc(s.beforeValvePct), after = calc(s.afterValvePct);
    close(outcome.before.flowLps, before.flowLps);
    close(outcome.after.flowLps, after.flowLps);
    close(outcome.delta, after.flowLps - before.flowLps);
    assert.equal(outcome.actualDirection, s.afterValvePct > s.beforeValvePct ? 'increase' : 'decrease');
    assert.ok(Math.abs(outcome.delta) > 0.01, 'Learner must observe a nontrivial change');
    for (const op of [outcome.before, outcome.after]) {
      assert.ok(op.flowLps >= 0 && Number.isFinite(op.flowLps));
      assert.equal(op.noFlowReason, null);
      const systemHead = op.staticLiftM +
        (HEALTHY.suctionK + CIRCUIT.kPipe + CIRCUIT.kValve0 / (op.valveActualPct / 100) ** 2) * op.flowLps ** 2;
      close(op.pumpHeadM, systemHead, 1e-6);
    }
  }
});

test('prediction error and direction grading are deterministic for boundary estimates', () => {
  const actual = scenarioResult(0);
  for (const direction of ['increase', 'decrease', 'unchanged']) {
    for (const estimate of [0, 0.001, 15, 29.999, 30]) {
      const input = initialState();
      const predicted = transition(input, predict(direction, estimate));
      assert.equal(input.attempts.length, 0);
      assert.equal(predicted.phase, 'explain');
      assert.equal(predicted.attempts.length, 1);
      const a = predicted.attempts[0];
      close(a.absoluteErrorLps, Math.abs(actual.after.flowLps - estimate));
      assert.equal(a.directionMatches, direction === actual.actualDirection);
      assert.equal(a.independent, false);
      assert.equal(a.note, null);
      assert.equal(predicted.actions.length, 1);
    }
  }
});

test('independent case is never credited without a second prediction and explanation', () => {
  const first = round(initialState(), 'increase', 10);
  assert.equal(first.phase, 'predict');
  assert.equal(first.attempts.length, 1);
  assert.equal(first.attempts[0].independent, false);
  assert.throws(() => transition(first, explain()));
  const second = transition(first, predict('decrease', 5));
  assert.equal(second.attempts[1].independent, true);
  assert.equal(second.attempts[1].scenarioId, SCENARIOS[1].id);
  assert.equal(second.attempts[1].note, null);
  assert.throws(() => transition(second, predict('decrease', 5)));
  const done = transition(second, explain());
  assert.equal(done.phase, 'done');
  assert.equal(done.attempts.length, 2);
  assert.equal(done.actions.length, 4);
  assert.equal(done.attempts[1].note, note);
  assert.throws(() => transition(done, predict('increase', 1)));
});

test('serialized progress is only a versioned action trace, not a fabricated source or grade', () => {
  const done = round(round(initialState(), 'increase', 12), 'decrease', 4);
  const snapshot = serialize(done);
  assert.deepEqual(Object.keys(snapshot).sort(), ['actions', 'model', 'provenance', 'schema']);
  assert.equal(snapshot.model, MODEL_VERSION);
  assert.equal(snapshot.provenance, 'prepared-model-only');
  assert.equal(snapshot.actions.length, 4);
  assert.equal('grade' in snapshot, false);
  assert.equal('sourceRevision' in snapshot, false);
  assert.equal('verified' in snapshot, false);
  assert.deepEqual(restore(JSON.parse(JSON.stringify(snapshot))), done);
});

test('corrupted, replayed or forged progress fails closed', () => {
  const first = round(initialState(), 'increase', 10);
  const good = serialize(first);
  const invalid = [
    { ...good, schema: 'kairo-pump-what-if/2' },
    { ...good, model: 'stale-physics' },
    { ...good, provenance: 'reviewed-upload' },
    { ...good, verified: true },
    { ...good, sourceId: 'forged' },
    { ...good, actions: [] , phase: 'done' },
    { ...good, actions: [explain()] },
    { ...good, actions: [predict('increase', 10), predict('increase', 10)] },
    { ...good, actions: [...good.actions, explain()] },
    { ...good, actions: [...good.actions, { type: 'predict', direction: 'increase', estimateLps: 10, ownerId: 'x' }] },
    { ...good, actions: [...good.actions, { type: 'predict', direction: 'increase', estimateLps: NaN }] },
    { ...good, actions: [...good.actions, { type: 'predict', direction: 'increase', estimateLps: Infinity }] },
    { ...good, actions: Array(5).fill(explain()) },
  ];
  for (const record of invalid) assert.throws(() => restore(record));
  assert.deepEqual(restore(good), first);
});

test('replay rejects changed model results, action edits and fake completion', () => {
  const state = round(initialState(), 'increase', 12);
  const original = JSON.stringify(state);
  assert.throws(() => serialize({ ...state, phase: 'done' }));
  assert.throws(() => serialize({ ...state, attempts: [{ ...state.attempts[0], afterLps: 999 }] }));
  assert.throws(() => serialize({ ...state, actions: [...state.actions, explain()] }));
  assert.equal(JSON.stringify(state), original, 'failed checks must not mutate learner state');
});
