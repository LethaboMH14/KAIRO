import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  SCHEMA, SOURCE, SCENARIOS, OFFSETS_KPA, DIAGNOSES,
  solve, evaluate, newSession, replaySession, submitAttempt, exportSession,
} from '../src/studio-scenarios/pump-sensor-bias-20261026/model.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'src', 'studio-scenarios', 'pump-sensor-bias-20261026');
const action = (i, changes = {}) => {
  const s = SCENARIOS[i];
  const solved = solve(s);
  return {
    roundId: s.id,
    selectedOffsetKpa: solved.expectedOffsetKpa,
    diagnosis: solved.expectedDiagnosis,
    predictedKpa: solved.expectedCorrectedKpa,
    explanation: 'The reference and zero-check distinguish bias from a real change.',
    ...changes,
  };
};

test('source, schema and rounds are versioned and explicitly fictional', () => {
  assert.equal(SCHEMA, 'kairo-pump-sensor-bias-v1');
  assert.ok(SOURCE.url.startsWith('https://www.nist.gov/'));
  assert.match(SOURCE.review, /not expert reviewed/);
  assert.equal(SCENARIOS.length, 2);
  assert.notEqual(SCENARIOS[0].id, SCENARIOS[1].id);
  assert.deepEqual(OFFSETS_KPA, [-8, -4, 0, 4, 8]);
  assert.deepEqual(DIAGNOSES, ['sensor-offset', 'process-change']);
});

test('round 1 independently checks additive bias and unchanged reference', () => {
  const s = SCENARIOS[0];
  assert.equal(s.indicatedKpa - s.zeroCheckKpa, s.referenceKpa);
  assert.equal(s.referenceKpa - s.baselineKpa, 0);
  assert.deepEqual([solve(s).expectedCorrectedKpa, solve(s).expectedDiagnosis], [120, 'sensor-offset']);
});

test('round 2 independently checks actual reference change with no bias', () => {
  const s = SCENARIOS[1];
  assert.equal(s.indicatedKpa - s.zeroCheckKpa, s.referenceKpa);
  assert.equal(s.referenceKpa - s.baselineKpa, 12);
  assert.deepEqual([solve(s).expectedCorrectedKpa, solve(s).expectedDiagnosis], [112, 'process-change']);
});

test('both prepared rounds can score three checks from independently derived arithmetic', () => {
  for (let i = 0; i < 2; i++) {
    const result = evaluate(SCENARIOS[i], action(i));
    assert.equal(result.correctCount, 3);
    assert.equal(result.referenceDifferenceKpa, 0);
    assert.equal(result.trace.length, 4);
  }
});

test('wrong correction changes the resulting reading and does not earn offset credit', () => {
  const result = evaluate(SCENARIOS[0], action(0, { selectedOffsetKpa: 0 }));
  assert.equal(result.learnerCorrectedKpa, 128);
  assert.equal(result.referenceDifferenceKpa, 8);
  assert.equal(result.checks.offset, false);
  assert.equal(result.correctCount, 2);
});

test('incorrect diagnosis and prediction are separately rejected without answer leakage', () => {
  const result = evaluate(SCENARIOS[1], action(1, { diagnosis: 'sensor-offset', predictedKpa: 100 }));
  assert.deepEqual(result.checks, { offset: true, diagnosis: false, prediction: false });
  assert.equal(result.correctCount, 1);
});

test('two rounds preserve independent attempts in order, and a third is denied', () => {
  const first = submitAttempt(newSession(), action(0));
  assert.equal(first.session.actions.length, 1);
  const second = submitAttempt(first.session, action(1));
  assert.equal(second.session.actions.length, 2);
  assert.equal(second.attempts.length, 2);
  assert.throws(() => submitAttempt(second.session, action(1)), /already been submitted/);
});

test('a learner cannot skip, swap or repeat rounds', () => {
  assert.throws(() => submitAttempt(newSession(), action(1)), /Round order/);
  const first = submitAttempt(newSession(), action(0));
  assert.throws(() => submitAttempt(first.session, action(0)), /Round order/);
  assert.throws(() => replaySession({ ...newSession(), actions: [action(1)] }), /Round order/);
});

test('no explanation or too-short explanation is accepted', () => {
  for (const explanation of ['', '   ', 'short']) {
    assert.throws(() => submitAttempt(newSession(), action(0, { explanation })), /explanation/);
  }
});

test('bad offset, diagnosis, and fractional or nonfinite prediction fail closed', () => {
  for (const selectedOffsetKpa of [3, '8', NaN, Infinity]) {
    assert.throws(() => submitAttempt(newSession(), action(0, { selectedOffsetKpa })), /Offset/);
  }
  assert.throws(() => submitAttempt(newSession(), action(0, { diagnosis: 'all-good' })), /Diagnosis/);
  for (const predictedKpa of [-1, 251, 120.5, NaN, Infinity, '120']) {
    assert.throws(() => submitAttempt(newSession(), action(0, { predictedKpa })), /Prediction/);
  }
});

test('canonical export imports with results recomputed and no stored grade', () => {
  const completed = submitAttempt(submitAttempt(newSession(), action(0)).session, action(1));
  const exported = exportSession(completed.session);
  const parsed = JSON.parse(exported);
  assert.deepEqual(Object.keys(parsed).sort(), ['actions', 'schema', 'sourceId', 'sourceRevision', 'verification']);
  assert.equal(parsed.verification, 'local-unverified');
  assert.equal('score' in parsed, false);
  assert.equal('checks' in parsed.actions[0], false);
  assert.deepEqual(replaySession(exported), completed);
});

test('forged outcome and grade fields are rejected rather than silently trusted', () => {
  assert.throws(() => replaySession({ ...newSession(), score: 999999 }), /unexpected fields/);
  assert.throws(() => replaySession({ ...newSession(), actions: [{ ...action(0), correct: true }] }), /unexpected fields/);
  assert.throws(() => replaySession({ ...newSession(), actions: [{ ...action(0), report: { score: 999999 } }] }), /unexpected fields/);
});

test('claimed verification and mismatched source/revision cannot be imported', () => {
  for (const patch of [
    { verification: 'server-verified' },
    { sourceId: 'another-lesson' },
    { sourceRevision: 'revoked' },
    { schema: 'old-schema' },
  ]) {
    assert.throws(() => replaySession({ ...newSession(), ...patch }), /stale or falsely verified/);
  }
});

test('malformed and oversized JSON are rejected', () => {
  assert.throws(() => replaySession('{'), /valid JSON/);
  assert.throws(() => replaySession(' '.repeat(12001)), /too large/);
  assert.throws(() => replaySession({ ...newSession(), actions: [action(0), action(1), action(1)] }), /Too many attempts/);
});

test('rejected mutation does not modify previously completed local attempt', () => {
  const first = submitAttempt(newSession(), action(0));
  const before = exportSession(first.session);
  assert.throws(() => submitAttempt(first.session, action(1, { score: 9 })), /unexpected fields/);
  assert.equal(exportSession(first.session), before);
});

test('source scenario objects cannot be silently substituted for model evaluation', () => {
  assert.throws(() => solve({ ...SCENARIOS[0], zeroCheckKpa: 0 }), /Unknown or altered/);
});

test('accessible standalone preview has labelled native controls, tables, status and reduced-motion fallback', () => {
  const html = readFileSync(join(root, 'preview.html'), 'utf8');
  for (const id of ['round-title', 'measurement-rows', 'offset', 'diagnosis', 'prediction', 'explanation', 'result-heading', 'result-rows', 'status', 'import-json']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /<form\s+id="entry-form"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /<table\s+aria-label="Accessible comparison values"/);
  assert.match(html, /<script type="module" src="\.\/app\.mjs"/);
});

test('client uses DOM text rather than injecting learner explanation into HTML', () => {
  const app = readFileSync(join(root, 'app.mjs'), 'utf8');
  assert.match(app, /textContent/);
  assert.doesNotMatch(app, /innerHTML|eval\s*\(/);
});
