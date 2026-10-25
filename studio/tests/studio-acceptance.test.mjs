import test from 'node:test';
import assert from 'node:assert/strict';
import { auditAnchorRegistry, BUDGET, evaluateTrace, percentile, runCli, SCHEMA } from '../tools/studio-acceptance.mjs';
import { TARGETS, DIAGRAM_VIEWBOX, TARGET_IDS } from '../src/pump-lab/layout.ts';

const checks = () => Object.fromEntries(['reading','diagram','keyboard','reduceMotion','stopNarration','anchorParity'].map(k => [k, 'pass']));
function trace(patch = {}) {
  return { schema: SCHEMA, sampleSource: 'synthetic', studio: 'pump', view: '3d', deviceClass: 'synthetic-viewport',
    browser: 'not-a-browser', capturedAt: '2026-10-25T03:50:00Z', sampling: 'requestAnimationFrame',
    framesMs: Array.from({ length: BUDGET.minFrames }, () => 16.7), checks: checks(), ...patch };
}

test('missing measurements never produce a passing status', () => {
  assert.equal(evaluateTrace(null).status, 'UNMEASURED');
  assert.equal(evaluateTrace(trace()).status, 'SYNTHETIC_ONLY');
});

test('nearest rank percentile is correct and does not mutate input', () => {
  const values = [50, 10, 30, 20, 40];
  assert.equal(percentile(values, 0.5), 30);
  assert.equal(percentile(values, 0.95), 50);
  assert.deepEqual(values, [50, 10, 30, 20, 40]);
  assert.throws(() => percentile([0], 0.95), /positive/);
});

test('anonymous schema rejects bad, oversized, malicious and insufficient samples', () => {
  for (const patch of [
    { schema: 'unknown' }, { framesMs: [16] }, { framesMs: Array(12001).fill(16) },
    { framesMs: Array(120).fill(NaN) }, { framesMs: Array(120).fill(0) },
    { framesMs: Array(120).fill(Infinity) }, { framesMs: Array(120).fill(60001) },
    { view: 'reading' }, { sampleSource: 'uploaded-private-recording' },
    { checks: { ...checks(), microphone: 'pass' } }, { checks: { ...checks(), reading: true } },
    { privateLearnerId: 'do-not-include' }, { capturedAt: 'not-a-date' },
  ]) assert.throws(() => evaluateTrace(trace(patch)), TypeError);
});

test('missing or failing human checks cannot be silently treated as passed', () => {
  const missing = evaluateTrace(trace({ sampleSource: 'authorised-device', checks: { reading: 'pass' } }));
  assert.equal(missing.status, 'CHECKS_INCOMPLETE');
  assert.match(missing.reasons.join(' '), /anchorParity/);
  const fail = evaluateTrace(trace({ sampleSource: 'authorised-device', checks: { ...checks(), stopNarration: 'fail' } }));
  assert.equal(fail.status, 'FAIL');
});

test('frame-time regressions and stalls fail proposed budgets', () => {
  for (const framesMs of [Array(120).fill(60), [...Array(119).fill(16), 300]]) {
    assert.equal(evaluateTrace(trace({ sampleSource: 'authorised-device', framesMs })).status, 'FAIL');
  }
});

test('a passing report remains explicitly self-reported', () => {
  const report = evaluateTrace(trace({ sampleSource: 'authorised-device' }));
  assert.equal(report.status, 'PASS_SELF_REPORTED');
  assert.match(report.reasons.join(' '), /not independently verified/);
  assert.equal(report.metrics.count, 120);
  assert.equal(report.metrics.p95Ms, 16.7);
});

test('source targets require namespaced anchors and accessible coordinates', () => {
  const good = { id:'motor', qualifiedId:'pump-lab/motor', label:'Motor', role:'Drives the pump',
    world:[1,2,0], diagram:[20,30] };
  const view = { w:1000, h:560 };
  assert.equal(auditAnchorRegistry([good], view).ok, true);
  assert.equal(auditAnchorRegistry([good, good], view).ok, false);
  for (const patch of [{ qualifiedId:'arbitrary' }, { role:'' }, { world:[NaN,2,0] }, { diagram:[1001,2] }])
    assert.equal(auditAnchorRegistry([{ ...good, ...patch }], view).ok, false);
});

test('actual pump lab layout source exposes sixteen bounded exact target anchors', () => {
  assert.equal(TARGET_IDS.length, 16);
  assert.deepEqual(TARGETS.map(x => x.id), [...TARGET_IDS]);
  const audit = auditAnchorRegistry(TARGETS, DIAGRAM_VIEWBOX);
  assert.deepEqual(audit.problems, []);
  assert.equal(audit.ok, true);
});

test('no CLI trace is UNMEASURED and exits nonzero', async () => {
  const oldLog = console.log, out = [];
  console.log = x => out.push(x);
  try { assert.equal(await runCli(['--json']), 2); }
  finally { console.log = oldLog; }
  assert.match(out.join(' '), /UNMEASURED/);
});
