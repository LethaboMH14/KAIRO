import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTraceEngine } from '../server/trace.mjs';
import { validateQuestion } from '../server/google.mjs';

test('trace executes real topic filtering and returns finite measured timings', () => {
  const engine = createTraceEngine();
  try {
    const result = engine.run('database');
    assert.equal(result.rows.length, 2);
    assert.ok(result.rows.every(row => row.topic === 'database'));
    assert.equal(result.trace.length, 4);
    assert.ok(result.trace.every(step => Number.isFinite(step.durationMs) && step.durationMs >= 0));
    assert.equal(engine.run('python').rows.length, 1);
    assert.equal(engine.run('unknown').rows.length, 0);
  } finally { engine.close(); }
});
test('query input cannot alter SQL and invalid input is rejected', () => {
  const engine = createTraceEngine();
  try {
    assert.equal(engine.run("' OR 1=1 --").rows.length, 0);
    assert.equal(engine.run('database').rows.length, 2);
    for (const invalid of [undefined, null, {}, '', 'a'.repeat(81)]) {
      assert.throws(() => engine.run(invalid), TypeError);
    }
  } finally { engine.close(); }
});
test('cloud questions are bounded before invoking a provider', () => {
  assert.equal(validateQuestion('  Why use parameters?  '), 'Why use parameters?');
  for (const invalid of [undefined, null, {}, '', '   ', 'a'.repeat(501)]) {
    assert.throws(() => validateQuestion(invalid), TypeError);
  }
});
