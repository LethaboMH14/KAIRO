import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SOURCE, CIRCUITS, validateCircuit, evaluateCircuit, truthOracle, newSession, submitPrediction,
} from '../src/studio-scenarios/nand-logic-trace/model.mjs';

test('every NAND netlist matches an independent Boolean oracle across all eight bit inputs', () => {
  for (const circuit of CIRCUITS) {
    assert.equal(validateCircuit(circuit), true);
    for (const a of [0, 1]) for (const b of [0, 1]) for (const sel of [0, 1]) {
      const input = { a, b, sel };
      const first = evaluateCircuit(circuit.id, input);
      const second = evaluateCircuit(circuit.id, input);
      assert.equal(first.output, truthOracle(circuit.id, input), circuit.id + ' ' + JSON.stringify(input));
      assert.deepEqual(first, second, 'same input must replay exactly');
      assert.equal(first.trace.length, circuit.nodes.length);
      const signals = { ...input };
      for (const step of first.trace) {
        assert.equal(step.left, signals[step.leftSignal]);
        assert.equal(step.right, signals[step.rightSignal]);
        assert.equal(step.output, step.left === 1 && step.right === 1 ? 0 : 1);
        signals[step.gate] = step.output;
      }
      assert.equal(first.output, signals[circuit.output]);
    }
  }
});
test('known NAND, NOT, XOR and MUX truth cases are explicit', () => {
  assert.deepEqual(evaluateCircuit('not', { a: 1, b: 0, sel: 0 }).trace.map(x => x.output), [0]);
  assert.equal(evaluateCircuit('xor', { a: 1, b: 1, sel: 0 }).output, 0);
  assert.equal(evaluateCircuit('xor', { a: 1, b: 0, sel: 0 }).output, 1);
  assert.equal(evaluateCircuit('mux', { a: 0, b: 1, sel: 0 }).output, 0);
  assert.equal(evaluateCircuit('mux', { a: 0, b: 1, sel: 1 }).output, 1);
});
test('refuses forward edges, cycles, duplicates, unknown output, arbitrary gates and large circuits', () => {
  const bad = [
    null, { nodes: [], output: 'g1' },
    { nodes: [{ id: 'g1', a: 'g2', b: 'a' }, { id: 'g2', a: 'a', b: 'b' }], output: 'g2' },
    { nodes: [{ id: 'g1', a: 'a', b: 'b' }, { id: 'g1', a: 'a', b: 'b' }], output: 'g1' },
    { nodes: [{ id: 'g1', a: 'g1', b: 'a' }], output: 'g1' },
    { nodes: [{ id: 'g1', a: 'a', b: 'b' }], output: 'a' },
    { nodes: [{ id: 'g1', a: 'a', b: 'b' }], output: 'g2' },
    { nodes: [{ id: 'g1', a: 'a', b: 'b', type: 'OR' }], output: 'g2' },
    { nodes: Array.from({ length: 13 }, (_, i) => ({ id: 'g' + (i + 1), a: 'a', b: 'b' })), output: 'g13' },
  ];
  for (const circuit of bad) assert.throws(() => validateCircuit(circuit));
});
test('rejects invalid input types, unknown circuit and prediction', () => {
  for (const inputs of [null, {}, { a: 1, b: 0 }, { a: true, b: 0, sel: 1 },
    { a: 2, b: 0, sel: 1 }, { a: '1', b: 0, sel: 1 }]) {
    assert.throws(() => evaluateCircuit('and', inputs));
  }
  assert.throws(() => evaluateCircuit('arbitrary', { a: 0, b: 0, sel: 0 }));
  assert.throws(() => submitPrediction(newSession(), {
    circuitId: 'and', inputs: { a: 0, b: 0, sel: 0 }, prediction: 2,
  }));
});
test('prediction is locked to a deterministic output and marked local-unverified', () => {
  const start = newSession();
  const inputs = { a: 1, b: 0, sel: 1 };
  const r = submitPrediction(start, { circuitId: 'xor', inputs, prediction: 0 });
  assert.equal(start.attempts.length, 0, 'input session must not be mutated');
  assert.equal(r.session.attempts.length, 1);
  assert.equal(r.attempt.correct, false);
  assert.equal(r.attempt.observed, 1);
  assert.equal(r.attempt.verification, 'local-unverified');
  assert.equal(r.attempt.sourceRevision, SOURCE.conceptRevision);
  assert.equal(r.attempt.modelRevision, SOURCE.modelRevision);
  assert.ok(Object.isFrozen(r.attempt));
  assert.ok(Object.isFrozen(r.session.attempts));
});
test('replayed scenario+inputs cannot count as a second distinct attempt', () => {
  const first = submitPrediction(newSession(), {
    circuitId: 'and', inputs: { a: 1, b: 1, sel: 0 }, prediction: 1,
  });
  assert.throws(() => submitPrediction(first.session, {
    circuitId: 'and', inputs: { a: 1, b: 1, sel: 0 }, prediction: 0,
  }), /distinct/);
  const second = submitPrediction(first.session, {
    circuitId: 'and', inputs: { a: 1, b: 0, sel: 0 }, prediction: 0,
  });
  assert.deepEqual(second.session.attempts.map(x => x.id), ['local-1', 'local-2']);
  assert.throws(() => submitPrediction(second.session, {
    circuitId: 'not', inputs: { a: 0, b: 0, sel: 0 }, prediction: 1,
  }), /complete/);
});
test('prepared source is public and does not imply reviewed learner uploads or saved progress', () => {
  assert.match(SOURCE.url, /^https:\/\/www\.nand2tetris\.org\/project01$/);
  assert.equal(CIRCUITS.length, 5);
  assert.ok(CIRCUITS.every(c => c.nodes.every(n => !('type' in n))));
});
test('standalone UI SSR exposes accessible prediction, trace controls, source and honest evidence label', async () => {
  const entry = join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/nand-logic-trace/NandLogicLab.tsx');
  const outputDir = mkdtempSync(join(dirname(fileURLToPath(import.meta.url)), '../node_modules/.kairo-nand-ssr-'));
  try {
    const outfile = join(outputDir, 'lab.mjs');
    await build({ entryPoints: [entry], outfile, bundle: true, platform: 'node',
      format: 'esm', external: ['react', 'react/jsx-runtime'], logLevel: 'silent' });
    const { default: Lab } = await import(pathToFileURL(outfile).href);
    const html = renderToStaticMarkup((await import('react')).createElement(Lab));
    for (const phrase of ['NAND circuit challenge', 'Step 1', 'Step 2',
      'Lock prediction and compare', 'local', 'not', 'Nand2Tetris', 'name=', 'type="radio"']) {
      assert.match(html, new RegExp(phrase, 'i'), phrase);
    }
    assert.match(html, /<fieldset/);
    assert.match(html, /<label/);
    assert.match(html, /<select/);
  } finally { rmSync(outputDir, { recursive: true, force: true }); }
});
