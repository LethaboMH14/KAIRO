import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, REFERENCE, scenarioForRound, solve, recordAttempt, replaySession, exportSession, importSession } from '../src/studio-scenarios/dependency-order-20261026/model.mjs';

const explanation = 'The new edge changes which task is ready after the first step.';
const attempt = (round, choiceId = 'none', prediction = { completion: 'complete', nextTask: round === 1 ? 'Clean' : 'Build' }) =>
  recordAttempt({ round, choiceId, prediction, explanation });

for (const [round, first, second] of [[1, 'Collect', 'Clean'], [2, 'Design', 'Build']]) {
  const scenario = scenarioForRound(round);
  test(scenario.id + ': baseline has stable alphabetic tie-break and valid edge order', () => {
    const solved = solve(scenario.id, 'none');
    assert.equal(solved.completion, 'complete');
    assert.equal(solved.order[0], first);
    assert.equal(solved.nextTask, second);
    assert.equal(new Set(solved.order).size, scenario.nodes.length);
    for (const [from, to] of scenario.baseEdges) assert.ok(solved.order.indexOf(from) < solved.order.indexOf(to));
    assert.deepEqual(solved.trace[0].readyBefore, [first]);
  });
  test(scenario.id + ': learner-added prerequisite changes the second task', () => {
    const solved = solve(scenario.id, 'reorder');
    assert.equal(solved.completion, 'complete');
    assert.notEqual(solved.nextTask, second);
    assert.ok(solved.order.indexOf(scenario.choices[1].edge[0]) < solved.order.indexOf(scenario.choices[1].edge[1]));
  });
  test(scenario.id + ': closing a dependency cycle blocks completion', () => {
    const solved = solve(scenario.id, 'cycle');
    assert.equal(solved.completion, 'blocked');
    assert.equal(solved.nextTask, 'none');
    assert.deepEqual(solved.order, []);
    assert.deepEqual(solved.remaining, [...scenario.nodes].sort());
  });
}

test('unknown round/scenario/choice rejected', () => {
  assert.throws(() => scenarioForRound(0));
  assert.throws(() => scenarioForRound(3));
  assert.throws(() => solve('nonexistent', 'none'));
  assert.throws(() => solve('materials', 'nonsense'));
});

test('two independently recorded rounds replay without accepting precomputed outcomes', () => {
  const first = attempt(1);
  const second = attempt(2, 'cycle', { completion: 'blocked', nextTask: 'none' });
  const replay = importSession(exportSession([first, second]));
  assert.equal(replay.finished, true);
  assert.equal(replay.results.length, 2);
  assert.deepEqual(replay.results.map((x) => x.correct), [true, true]);
  assert.ok(!('correct' in first));
  assert.ok(!('trace' in second));
  assert.equal(first.source.revision, REFERENCE.revision);
});

test('a first-round-only session remains explicitly unfinished', () => {
  const replay = importSession(exportSession([attempt(1)]));
  assert.equal(replay.finished, false);
  assert.equal(replay.attempts.length, 1);
});

test('a wrong prediction is preserved, never silently corrected', () => {
  const replay = importSession(exportSession([attempt(1, 'cycle', { completion: 'complete', nextTask: 'Collect' })]));
  assert.equal(replay.results[0].correct, false);
  assert.equal(replay.results[0].completion, 'blocked');
});

test('replay rejects duplicated, reversed, or third-round attempts', () => {
  const one = attempt(1);
  const two = attempt(2);
  const base = JSON.parse(exportSession([one, two]));
  assert.throws(() => replaySession({ ...base, attempts: [one, one] }), /Out-of-order/);
  assert.throws(() => replaySession({ ...base, attempts: [two, one] }), /Out-of-order/);
  assert.throws(() => replaySession({ ...base, attempts: [one, two, one] }), /one or two/);
});

test('replay rejects altered source provenance and forged result or certification fields', () => {
  const base = JSON.parse(exportSession([attempt(1)]));
  assert.throws(() => replaySession({ ...base, referenceRevision: 'revoked' }), /Invalid local/);
  assert.throws(() => replaySession({ ...base, certified: true }), /Invalid local/);
  assert.throws(() => replaySession({ ...base, attempts: [{ ...base.attempts[0], score: 100 }] }), /Invalid attempt/);
  assert.throws(() => replaySession({ ...base, attempts: [{ ...base.attempts[0], source: { id: REFERENCE.id, revision: 'stale' } }] }), /Source reference/);
  assert.throws(() => replaySession({ ...base, attempts: [{ ...base.attempts[0], prediction: { completion: 'complete', nextTask: 'Clean', verified: true } }] }), /Invalid prediction/);
});

test('invalid predictions, explanation and file size fail closed', () => {
  assert.throws(() => recordAttempt({ round: 1, choiceId: 'none', prediction: { completion: 'maybe', nextTask: 'Clean' }, explanation }), /Invalid completion/);
  assert.throws(() => recordAttempt({ round: 1, choiceId: 'none', prediction: { completion: 'complete', nextTask: 'Alien' }, explanation }), /Invalid next-task/);
  assert.throws(() => recordAttempt({ round: 1, choiceId: 'none', prediction: { completion: 'complete', nextTask: 'Clean' }, explanation: 'short' }), /Explain/);
  assert.throws(() => importSession('{broken'), /not valid JSON/);
  assert.throws(() => importSession('x'.repeat(16_385)), /too large/);
});

test('all six fixed scenario combinations are deterministic under repeated execution', () => {
  for (const scenario of SCENARIOS) for (const choice of scenario.choices) {
    assert.deepEqual(solve(scenario.id, choice.id), solve(scenario.id, choice.id));
  }
});
