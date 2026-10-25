import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, serialize, transition } from '../src/pump-lab/session.ts';
import { toEvidenceItem } from '../src/pump-lab/report.ts';
import { auditPumpDraft, REPLAY_AUDIT_VERSION } from '../server/studio-evidence-replay/audit.mjs';

const AT = '2026-10-25T08:00:00.000Z';
function fixture(sessionId = 'pump-replay-fixture') {
  let state = initialState(sessionId, 7, 'baseline-commissioning');
  state = transition(state, { type: 'predict', flowLps: 10 }, AT);
  state = transition(state, { type: 'take-reading' }, '2026-10-25T08:00:01.000Z');
  return { snapshot: serialize(state), evidence: toEvidenceItem(state), expectedSessionId: sessionId };
}
const run = patch => auditPumpDraft({ ...fixture(), ...patch });
const copy = x => JSON.parse(JSON.stringify(x));

test('a real pump session is replayed, not marked as authenticated evidence', () => {
  const result = run({});
  assert.equal(result.replayConsistent, true);
  assert.equal(result.status, 'replayed-local-draft-only');
  assert.equal(result.auditVersion, REPLAY_AUDIT_VERSION);
  assert.equal(result.caseId, 'baseline-commissioning');
  assert.equal(result.actionCount, 2);
  assert.match(result.actionLogSha256, /^[0-9a-f]{64}$/);
  assert.equal(result.illustrativeCaseCompleted, false);
  for (const flag of ['serverVerified', 'ownerVerified', 'sourceRevisionVerified',
    'competencyExternallyVerified', 'publishable']) assert.equal(result[flag], false);
});

test('forged readings, completion and external verification in draft evidence are rejected', () => {
  for (const mutate of [
    e => { e.attempt.readings = 900; },
    e => { e.events.practiceCompleted = true; },
    e => { e.events.competencyExternallyVerified = true; },
    e => { e.label = 'verified qualification'; },
    e => { e.answer = { cause: 'no-fault', evidenceIds: [], note: 'invented' }; },
  ]) {
    const e = copy(fixture().evidence);
    mutate(e);
    assert.deepEqual(auditPumpDraft({ ...fixture(), evidence: e }), {
      replayConsistent: false, status: 'rejected', code: 'evidence-mismatch',
      serverVerified: false, ownerVerified: false, sourceRevisionVerified: false,
      competencyExternallyVerified: false, publishable: false,
    });
  }
});

test('changed action log cannot be paired with the previous evidence', () => {
  const f = fixture();
  const changed = JSON.parse(f.snapshot);
  changed.actions[0].action.flowLps = 13;
  const result = auditPumpDraft({ ...f, snapshot: JSON.stringify(changed) });
  assert.equal(result.code, 'evidence-mismatch');
});

test('untrusted expected session cannot be substituted for a trusted binding', () => {
  assert.equal(run({ expectedSessionId: 'another-learner-session' }).code, 'session-mismatch');
  assert.equal(run({ expectedSessionId: '' }).code, 'missing-trusted-session');
  assert.equal(run({ expectedSessionId: null }).code, 'missing-trusted-session');
});

test('noncanonical or injected source/owner metadata is not silently accepted', () => {
  const f = fixture();
  const extra = JSON.parse(f.snapshot);
  extra.sourceRevisionVerified = true;
  assert.equal(run({ snapshot: JSON.stringify(extra) }).code, 'invalid-snapshot-shape');
  assert.equal(run({ snapshot: ' ' + f.snapshot }).code, 'invalid-replay');
  const action = JSON.parse(f.snapshot);
  action.actions[0].action.serverVerified = true;
  assert.equal(run({ snapshot: JSON.stringify(action) }).code, 'invalid-action-shape');
});

test('invalid actions, malformed JSON and impossible simulation are rejected', () => {
  assert.equal(run({ snapshot: '{' }).replayConsistent, false);
  const bad = JSON.parse(fixture().snapshot);
  bad.actions[0].action.flowLps = -1;
  assert.equal(run({ snapshot: JSON.stringify(bad) }).code, 'invalid-replay');
  bad.actions[0].action.type = 'not-a-real-action';
  assert.equal(run({ snapshot: JSON.stringify(bad) }).code, 'invalid-action-shape');
});

test('oversized, non-object and circular payloads fail closed without throwing', () => {
  assert.equal(run({ snapshot: 'x'.repeat(200_001) }).code, 'invalid-snapshot-size');
  assert.equal(run({ evidence: 'not an evidence object' }).code, 'invalid-evidence');
  assert.equal(run({ evidence: { long: 'x'.repeat(70_000) } }).code, 'invalid-evidence-size');
  const circular = {}; circular.self = circular;
  assert.equal(run({ evidence: circular }).code, 'invalid-input-data');
  assert.equal(auditPumpDraft(null).code, 'invalid-input');
});

test('a canonical empty action log is only a local draft, not completed work', () => {
  const state = initialState('empty-replay', 0, 'baseline-commissioning');
  const result = auditPumpDraft({ snapshot: serialize(state), evidence: toEvidenceItem(state), expectedSessionId: 'empty-replay' });
  assert.equal(result.replayConsistent, true);
  assert.equal(result.actionCount, 0);
  assert.equal(result.illustrativeCaseCompleted, false);
  assert.equal(result.publishable, false);
});

test('privacy: no raw session IDs, timestamps, actions or learner text in audit output', () => {
  const secret = 'PRIVATE-LEARNER-SESSION-DO-NOT-ECHO';
  const f = fixture(secret);
  const output = JSON.stringify(auditPumpDraft(f));
  assert.equal(output.includes(secret), false);
  assert.equal(output.includes(AT), false);
  assert.equal(output.includes('flowLps'), false);
  assert.equal(output.includes('sessionId'), false);
  const rejected = JSON.stringify(auditPumpDraft({ ...f, evidence: { injected: secret } }));
  assert.equal(rejected.includes(secret), false);
});
