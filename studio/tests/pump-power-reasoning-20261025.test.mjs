import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as M from '../src/studio-scenarios/pump-power-reasoning-20261025/model.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/pump-power-reasoning-20261025');
const goodNote = 'At constant head, hydraulic power follows the flow rate.';
const predict = (choice, direction, estimateKw) => ({ type: 'predict', choice, direction, estimateKw });
const explain = (note = goodNote) => ({ type: 'explain', note });
const step = (state, action) => M.transition(state, action);
const guided = () => step(M.initialState(), predict(12, 'increase', 1.413));
const guidedDone = () => step(guided(), explain());
const complete = () => step(step(guidedDone(), predict(5, 'decrease', 0.59)), explain('At constant flow, halving the head halves the hydraulic power.'));

test('source supports hydraulic power equation, not illustrative performance', () => {
  assert.match(M.SOURCE.url, /^https:\/\/www\.wrc\.org\.za\//);
  assert.match(M.SOURCE.locator, /page 24/);
  assert.match(M.MODEL, /illustration/);
  assert.equal(M.RHO_KG_M3, 1000);
  assert.equal(M.GRAVITY_M_S2, 9.81);
});

test('dimensional conversion gives correct kW from L/s, head and density', () => {
  assert.ok(Math.abs(M.hydraulicKw(8, 12) - 0.94176) < 1e-12);
  assert.ok(Math.abs(M.hydraulicKw(12, 12) - 1.41264) < 1e-12);
  assert.ok(Math.abs(M.hydraulicKw(12, 5) - 0.5886) < 1e-12);
  assert.equal(M.hydraulicKw(0, 10), 0);
});

test('linear invariants hold independently across bounded hypothetical domain', () => {
  for (const q of [1, 3, 8, 12, 20]) {
    for (const h of [2, 5, 10, 20]) {
      assert.ok(Math.abs(M.hydraulicKw(q * 1.5, h) - 1.5 * M.hydraulicKw(q, h)) < 1e-12);
      assert.ok(Math.abs(M.hydraulicKw(q, h * 2) - 2 * M.hydraulicKw(q, h)) < 1e-12);
    }
  }
});

test('rejects invalid numeric types, NaN, infinities, negative and excessive values', () => {
  for (const bad of [NaN, Infinity, -Infinity, '8', null, undefined, {}, -1, 31]) {
    assert.throws(() => M.hydraulicKw(bad, 12), M.PowerReasoningError);
  }
  for (const bad of [NaN, Infinity, -1, 51, '12']) {
    assert.throws(() => M.hydraulicKw(8, bad), M.PowerReasoningError);
  }
});

test('before prediction, there is no attempt and no revealed result', () => {
  assert.deepEqual(M.replay(M.initialState().events), { phase: 'predict', round: 0, attempts: [] });
});

test('first prediction commits a selected flow, recalculates answer and requires explanation', () => {
  const p = M.replay(guided().events);
  assert.equal(p.phase, 'explain');
  assert.equal(p.round, 0);
  assert.equal(p.attempts.length, 1);
  assert.equal(p.attempts[0].after.flowLps, 12);
  assert.equal(p.attempts[0].after.headM, 12);
  assert.equal(p.attempts[0].actualDirection, 'increase');
  assert.equal(p.attempts[0].directionMatches, true);
  assert.equal(p.attempts[0].note, null);
});

test('cannot start second round without an explanation; notes are bounded', () => {
  assert.throws(() => step(guided(), predict(5, 'decrease', .6)), M.PowerReasoningError);
  for (const note of ['', 'too short', 'x'.repeat(241), 'text\nline break!']) {
    assert.throws(() => step(guided(), explain(note)), M.PowerReasoningError);
  }
  assert.equal(M.replay(guidedDone().events).phase, 'predict');
  assert.equal(M.replay(guidedDone().events).round, 1);
});

test('second attempt changes head at fixed flow and records distinct independent evidence', () => {
  const p = M.replay(complete().events);
  assert.equal(p.phase, 'done');
  assert.equal(p.attempts.length, 2);
  assert.equal(p.attempts[0].independent, false);
  assert.equal(p.attempts[1].independent, true);
  assert.equal(p.attempts[1].caseId, 'independent-head');
  assert.equal(p.attempts[1].after.flowLps, 12);
  assert.equal(p.attempts[1].after.headM, 5);
  assert.equal(p.attempts[1].actualDirection, 'decrease');
  assert.equal(p.attempts[1].note, 'At constant flow, halving the head halves the hydraulic power.');
  assert.throws(() => step(complete(), explain()), M.PowerReasoningError);
});

test('unchanged choice is valid and incorrect prediction remains explicitly incorrect', () => {
  const p = M.replay(step(M.initialState(), predict(8, 'increase', 4)).events);
  assert.equal(p.attempts[0].actualDirection, 'unchanged');
  assert.equal(p.attempts[0].directionMatches, false);
  assert.ok(p.attempts[0].errorKw > 3);
});

test('rejects wrong scenario values, strings, missing or extra fields', () => {
  for (const action of [
    predict(5, 'decrease', 1), predict('12', 'increase', 1),
    predict(12, 'higher', 1), predict(12, 'increase', NaN),
    predict(12, 'increase', -1), predict(12, 'increase', 11),
    { ...predict(12, 'increase', 1), actualKw: 1.4 },
    { type: 'predict', choice: 12, direction: 'increase' },
  ]) assert.throws(() => step(M.initialState(), action), M.PowerReasoningError);
  assert.throws(() => step(guidedDone(), predict(12, 'increase', 1)), M.PowerReasoningError);
});

test('roundtrip replays learner inputs and recalculates results, not saved result claims', () => {
  const saved = JSON.parse(JSON.stringify(M.serialize(complete())));
  assert.deepEqual(M.replay(M.restore(saved).events), M.replay(complete().events));
  assert.equal(saved.actions.length, 4);
  assert.ok(!JSON.stringify(saved).includes('afterKw'));
  assert.ok(!JSON.stringify(saved).includes('directionMatches'));
  assert.ok(!JSON.stringify(saved).includes('learnerId'));
});

test('restoration fails closed on model mismatch, fabricated outputs and invalid action order', () => {
  const good = M.serialize(complete());
  for (const bad of [
    { ...good, contract: 'wrong' }, { ...good, model: 'wrong' },
    { ...good, resultKw: 999 }, { ...good, actions: 'invalid' },
    { ...good, actions: [explain()] },
    { ...good, actions: [...good.actions, explain()] },
    { ...good, actions: [{ ...good.actions[0], afterKw: 900 }] },
    { ...good, actions: [good.actions[0], good.actions[0]] },
  ]) assert.throws(() => M.restore(bad), M.PowerReasoningError);
});

test('restored partial progress keeps next action phase and independent attempt boundary', () => {
  const first = M.restore(JSON.parse(JSON.stringify(M.serialize(guidedDone()))));
  assert.equal(M.replay(first.events).round, 1);
  const next = step(first, predict(20, 'increase', 2.3544));
  assert.equal(M.replay(next.events).phase, 'explain');
  assert.equal(M.replay(next.events).attempts[1].actualDirection, 'increase');
});

test('standalone UI exposes native keyboard controls, focus recovery and reading/2D alternatives', () => {
  const ui = readFileSync(join(dir, 'PumpPowerReasoning.tsx'), 'utf8');
  const html = readFileSync(join(dir, 'preview.html'), 'utf8');
  const preview = readFileSync(join(dir, 'preview.tsx'), 'utf8');
  assert.match(ui, /<select /);
  assert.match(ui, /<fieldset>/);
  assert.match(ui, /type="radio"/);
  assert.match(ui, /type="number"/);
  assert.match(ui, /<textarea /);
  assert.match(ui, /aria-pressed=/);
  assert.match(ui, /Reading view/);
  assert.match(ui, /<meter /);
  assert.match(ui, /aria-live="polite"/);
  assert.match(ui, /explanationRef\.current\?\.focus\(\)/);
  assert.match(ui, /not instructions for operating/);
  assert.match(ui, /not auto-graded/);
  assert.match(html, /<html lang="en">/);
  assert.match(preview, /createRoot\(root\)\.render\(<PumpPowerReasoning \/>\)/);
});

test('the scenario is isolated from shared routes, styles, and cloud', () => {
  const model = readFileSync(join(dir, 'model.ts'), 'utf8');
  const ui = readFileSync(join(dir, 'PumpPowerReasoning.tsx'), 'utf8');
  assert.doesNotMatch(model + ui, /fetch\(|firebase|localStorage|https:\/\/.*api\//i);
  assert.match(ui, /model\.ts/);
});
