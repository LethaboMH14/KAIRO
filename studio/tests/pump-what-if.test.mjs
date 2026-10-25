import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import {
  CHALLENGE_SCHEMA, CONCEPT_SOURCE, PROVENANCE, SCENARIOS,
  initialState, restore, scenarioResult, serialize, transition,
} from '../src/studio-scenarios/pump-what-if/challenge.ts';
import { HEALTHY, INITIAL_TANKS, MODEL_VERSION, operatingPoint } from '../src/pump-lab/physics.ts';

const explain = 'More valve opening lowers model resistance, shifting its operating point.';
const choose = (direction = 'increase', estimateLps = 10) => ({ type: 'predict', direction, estimateLps });
const step = (s, a) => transition(s, a);
const oneRound = () => step(step(initialState(), choose()), { type: 'explain', note: explain });

test('concept provenance is explicit and no learner source citation is fabricated', () => {
  const s = initialState();
  assert.equal(s.schema, CHALLENGE_SCHEMA);
  assert.equal(s.model, MODEL_VERSION);
  assert.equal(s.provenance, 'prepared-model-only');
  assert.equal(PROVENANCE, 'prepared-model-only');
  assert.match(CONCEPT_SOURCE.url, /^https:\/\/datatool\.pumps\.org\//);
  assert.match(CONCEPT_SOURCE.claim, /valve.*resistance/i);
  assert.deepEqual(s.actions, []);
});

test('scenario consequences agree with the unchanged actual KAIRO pump model', () => {
  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i], result = scenarioResult(i);
    for (const [valvePct, point] of [[scenario.beforeValvePct, result.before], [scenario.afterValvePct, result.after]]) {
      const existing = operatingPoint({
        speedRpm: scenario.speedRpm, valvePct,
        fault: { ...HEALTHY }, tanks: { ...INITIAL_TANKS },
      });
      assert.equal(point.flowLps, existing.flowLps);
      assert.equal(point.pumpHeadM, existing.pumpHeadM);
      assert.equal(point.valveLossM, existing.valveLossM);
    }
    assert.ok(Number.isFinite(result.delta));
    assert.equal(result.actualDirection, i === 0 ? 'increase' : 'decrease');
    assert.ok(Math.abs(result.delta) > .01, 'direction should be discernible');
  }
  assert.throws(() => scenarioResult(NaN), /Unknown challenge/);
  assert.throws(() => scenarioResult(42), /Unknown challenge/);
});

test('predict first, only then reveal a result; input does not mutate prior state', () => {
  const first = initialState();
  assert.equal(first.phase, 'predict');
  assert.equal(first.attempts.length, 0);
  assert.throws(() => step(first, { type: 'explain', note: explain }), /prediction before/);
  const committed = step(first, choose('decrease', 7.5));
  assert.equal(first.actions.length, 0);
  assert.equal(first.attempts.length, 0);
  assert.equal(committed.phase, 'explain');
  assert.equal(committed.attempts[0].directionMatches, false);
  assert.ok(committed.attempts[0].absoluteErrorLps >= 0);
  assert.equal(committed.attempts[0].note, null);
  assert.throws(() => step(committed, choose()), /Explain the observed/);
});

test('malformed directions, estimates and explanations fail closed', () => {
  const initial = initialState();
  for (const bad of [NaN, Infinity, -1, 30.01, '12', null]) {
    assert.throws(() => step(initial, choose('increase', bad)), /finite number/);
  }
  assert.throws(() => step(initial, choose('sideways')), /Choose one flow/);
  assert.throws(() => step(initial, { ...choose(), privateSourceText: 'forged' }), /not recognised/);
  const predicted = step(initial, choose());
  for (const note of ['', 'too short', 'x'.repeat(281), 'sufficient text\u0001']) {
    assert.throws(() => step(predicted, { type: 'explain', note }), /12–280/);
  }
  assert.equal(predicted.phase, 'explain', 'failure leaves prior state intact');
});

test('independent round is a new hidden case with its own prediction and explanation', () => {
  const guided = oneRound();
  assert.equal(guided.phase, 'predict');
  assert.equal(guided.attempts.length, 1);
  assert.equal(guided.attempts[0].independent, false);
  const independent = step(guided, choose('decrease', 5));
  assert.equal(independent.attempts[1].independent, true);
  assert.notEqual(independent.attempts[1].scenarioId, independent.attempts[0].scenarioId);
  assert.equal(independent.attempts[1].actualDirection, 'decrease');
  const done = step(independent, { type: 'explain', note: 'Closing the valve raises resistance in this simple model.' });
  assert.equal(done.phase, 'done');
  assert.equal(done.actions.length, 4);
  assert.equal(done.attempts.length, 2);
  assert.throws(() => step(done, choose()), /Restart to try again/);
});

test('save/resume replays a bounded deterministic action trace at exact model version', () => {
  const guided = oneRound();
  const halfway = restore(JSON.parse(JSON.stringify(serialize(guided))));
  assert.deepEqual(halfway, guided);
  const completed = step(step(halfway, choose('decrease', 5.5)),
    { type: 'explain', note: 'When the valve closes, the head-loss coefficient becomes larger.' });
  const copied = restore(JSON.parse(JSON.stringify(serialize(completed))));
  assert.deepEqual(copied, completed);
  assert.notEqual(copied.actions, completed.actions);
  assert.throws(() => serialize({ ...guided, phase: 'done' }), /does not match/);
  assert.throws(() => serialize({ ...guided, attempts: [{ ...guided.attempts[0], beforeLps: 9999 }] }), /does not match/);
});

test('tampered/foreign source metadata, stale model and invalid replay sequence rejected', () => {
  const valid = serialize(oneRound());
  for (const dirty of [
    { ...valid, model: 'old-model' }, { ...valid, schema: 'v2' }, { ...valid, provenance: 'uploaded-source' },
    { ...valid, sourceId: 'invented-private-source' }, { ...valid, actions: 'not-an-array' },
    { ...valid, actions: Array(5).fill(choose()) },
    { ...valid, actions: [{ type: 'explain', note: explain }] },
    { ...valid, actions: [{ ...choose(), modelResult: 100 }] },
    { ...valid, actions: [{ type: 'predict', direction: 'increase', estimateLps: '10' }] },
  ]) assert.throws(() => restore(dirty));
  assert.equal(restore(valid).model, MODEL_VERSION);
});

let react, render, PumpWhatIf;
before(async () => {
  // Render the exact component+CSS import through esbuild without browser/WebGL.
  // This is a DOM-structure check, not actual keyboard/screen-reader/device proof.
  const studio = join(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await build({
    stdin: { contents: `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PumpWhatIf from './src/studio-scenarios/pump-what-if/PumpWhatIf.tsx';
export { createElement, renderToStaticMarkup, PumpWhatIf };`, resolveDir: studio, loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
    loader: { '.css': 'empty' },
  });
  const dir = mkdtempSync(join(tmpdir(), 'kairo-pump-what-if-'));
  const out = join(dir, 'render.cjs');
  writeFileSync(out, result.outputFiles[0].text);
  const module = await import(pathToFileURL(out).href);
  const obj = module.default ?? module;
  react = obj.createElement; render = obj.renderToStaticMarkup; PumpWhatIf = obj.PumpWhatIf;
});

test('SSR initial UI is keyboard-native, readable, and conceals simulation answers', () => {
  const html = render(react(PumpWhatIf));
  assert.match(html, /What happens when the valve changes/);
  assert.match(html, /Skip to prediction task/);
  assert.match(html, /Illustrative teaching model/);
  assert.match(html, /prepared-model-only/);
  assert.match(html, /Predict the change in flow before seeing the result/);
  assert.match(html, /type="radio"/);
  assert.match(html, /type="number"/);
  assert.match(html, /Save and resume on this device/);
  assert.match(html, /Restore local progress JSON/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /What the teaching model calculated/);
  assert.doesNotMatch(html, /<canvas|<svg|WebGL/);
});

test('standalone preview is wired without changing a shared router or provider', async () => {
  const { readFile } = await import('node:fs/promises');
  const base = join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/pump-what-if');
  const page = await readFile(join(base, 'preview.html'), 'utf8');
  const entry = await readFile(join(base, 'preview.tsx'), 'utf8');
  assert.match(page, /\.\/preview\.tsx/);
  assert.match(entry, /createRoot\(root\)\.render\(<PumpWhatIf/);
  assert.doesNotMatch(entry, /fetch\(|getUserMedia|firebase|provider/);
});
