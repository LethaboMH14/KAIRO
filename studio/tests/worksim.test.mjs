import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptedOutcomes, assess, exportRun, initialState, scenario, transition,
  WORKSIM_STATUS,
} from '../src/worksim/model.ts';

const expectedV1 = { uniqueTickets: 7, resolvedCurrent: 5, reopenedCurrent: 1, unknownCurrent: 1, duplicateRows: 2, missingResolutionCodes: 1, missingCustomerVerification: 1, missingTimestamps: 1 };
const expectedV2 = { eligibleResolved: 2, excludedAfterCutoff: 1, excludedUnverified: 1, excludedMissingResolutionCode: 1, reopened: 1, unknownTimestamp: 1, duplicateRows: 2 };
const rows = scenario.records;
const v1Decisions = [
  ['ROW-101', 'exclude', 'superseded-duplicate'], ['ROW-102', 'retain', 'latest-for-ticket'],
  ['ROW-103', 'retain', 'latest-for-ticket'], ['ROW-104', 'retain', 'latest-for-ticket'],
  ['ROW-105', 'exclude', 'superseded-duplicate'], ['ROW-106', 'retain', 'latest-for-ticket'],
  ['ROW-107', 'retain', 'latest-for-ticket'], ['ROW-108', 'quarantine', 'missing-timestamp'],
  ['ROW-109', 'retain', 'latest-for-ticket'],
].map(([sourceRowId, disposition, reason]) => ({ sourceRowId, disposition, reason }));
const v2Decisions = [
  ['ROW-101', 'exclude', 'superseded-duplicate'], ['ROW-102', 'retain', 'eligible-latest'],
  ['ROW-103', 'exclude', 'missing-resolution-code'], ['ROW-104', 'exclude', 'unverified'],
  ['ROW-105', 'exclude', 'superseded-duplicate'], ['ROW-106', 'exclude', 'reopened-latest'],
  ['ROW-107', 'exclude', 'after-cutoff'], ['ROW-108', 'quarantine', 'missing-timestamp'],
  ['ROW-109', 'retain', 'eligible-latest'],
].map(([sourceRowId, disposition, reason]) => ({ sourceRowId, disposition, reason }));
let clock = Date.parse('2026-10-22T08:00:00Z');
function at() { clock += 1000; return new Date(clock).toISOString(); }
function act(state, action, time = at()) { return transition(state, action, time); }
function inspected() {
  clock = Date.parse('2026-10-22T08:00:00Z');
  let state = initialState('run-work-1');
  for (const row of rows) state = act(state, { type: 'inspect-row', sourceRowId: row.sourceRowId });
  return state;
}
function complete({ retries = false, assistance = 'unknown' } = {}) {
  let state = inspected();
  if (assistance !== 'unknown') state = act(state, { type: 'set-assistance', exposure: assistance });
  if (retries) state = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions.map((d, i) => i === 0 ? { ...d, reason: 'latest-for-ticket' } : d) });
  state = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  if (retries) state = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: { ...expectedV1, resolvedCurrent: 4 } });
  state = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: expectedV1 });
  state = act(state, { type: 'submit-cleaning', revision: 'morning-cutoff-v2', decisions: v2Decisions });
  if (retries) state = act(state, { type: 'submit-report', revision: 'morning-cutoff-v2', values: { ...expectedV2, eligibleResolved: 3 } });
  state = act(state, { type: 'submit-report', revision: 'morning-cutoff-v2', values: expectedV2 });
  return act(state, { type: 'reflect', value: 'I selected the latest row first, then applied the changed cutoff and checked every missing value.' });
}

test('canonical fixture computes transparent outcomes including duplicate and missing-value counts', () => {
  assert.equal(rows.length, 9);
  assert.equal(new Set(rows.map(row => row.ticketId)).size, 7);
  assert.deepEqual(acceptedOutcomes(), { first: expectedV1, changed: expectedV2 });
  assert.match(scenario.provenance, /invented/);
  assert.equal(scenario.requirements.changed.role, 'Simulated manager');
  assert.match(scenario.requirements.changed.message, /Do not treat this as an as-of-11:00 snapshot/);
  assert.match(scenario.requirements.changed.message, /not.*SLA-compliance/);
});

test('inspection and stage order are required; every row is exposed by the canonical scenario', () => {
  let state = initialState('run-order');
  const skipped = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  assert.equal(skipped.phase, 'inspect');
  assert.equal(skipped.events.length, 0);
  for (const row of rows.slice(0, -1)) state = act(state, { type: 'inspect-row', sourceRowId: row.sourceRowId });
  assert.equal(state.phase, 'inspect');
  state = act(state, { type: 'inspect-row', sourceRowId: rows.at(-1).sourceRowId });
  assert.equal(state.phase, 'clean-v1');
  assert.equal(state.inspectedRowIds.length, 9);
});

test('changed requirement requires new revision-specific cleaning and cannot reuse the v1 answer', () => {
  let state = inspected();
  state = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  state = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: expectedV1 });
  assert.equal(state.phase, 'clean-v2');
  const oldCleaning = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  const oldReport = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: expectedV1 });
  assert.equal(oldCleaning.phase, 'clean-v2');
  assert.equal(oldReport.phase, 'clean-v2');
  state = act(state, { type: 'submit-cleaning', revision: 'morning-cutoff-v2', decisions: v2Decisions });
  assert.equal(state.phase, 'report-v2');
  state = act(state, { type: 'submit-report', revision: 'morning-cutoff-v2', values: expectedV2 });
  assert.equal(state.phase, 'reflect');
});

test('malformed cleaning, omitted fields, nonfinite values, and invalid time/order are rejected', () => {
  let state = inspected();
  const missingRow = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions.slice(1) });
  const boxedEnum = v1Decisions.map((decision, index) => index === 0 ? { ...decision, disposition: new String('exclude') } : decision);
  const malformedEnum = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: boxedEnum });
  assert.equal(missingRow.phase, 'clean-v1');
  assert.equal(missingRow.events.length, state.events.length);
  assert.equal(malformedEnum.phase, 'clean-v1');
  assert.equal(malformedEnum.events.length, state.events.length);
  state = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  const missingField = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: { uniqueTickets: 7 } });
  const nonfinite = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: { ...expectedV1, resolvedCurrent: Number.NaN } });
  assert.equal(missingField.phase, 'report-v1');
  assert.equal(nonfinite.phase, 'report-v1');
  assert.equal(nonfinite.events.length, state.events.length);
  assert.equal(transition(state, { type: 'set-assistance', exposure: 'none' }, '2026-13-50T00:00:00Z'), state);
  assert.equal(transition(state, { type: 'set-assistance', exposure: 'none' }, '2026-02-30T00:00:00Z'), state);
  const earlier = transition(state, { type: 'set-assistance', exposure: 'none' }, '2026-10-21T23:59:59Z');
  assert.equal(earlier.events.length, state.events.length);
  assert.match(earlier.feedback, /cannot move earlier/);
});

test('failed attempts and explicit assistance survive in the truthful unverified export', () => {
  const state = complete({ retries: true, assistance: 'hint' });
  const result = exportRun(state);
  assert.ok(result);
  assert.equal(result.status, WORKSIM_STATUS);
  assert.equal(result.assistanceExposure, 'hint');
  assert.equal(result.rubric[0].attempts, 2);
  assert.equal(result.rubric[0].firstTry, false);
  assert.equal(result.rubric[1].attempts, 2);
  assert.equal(result.rubric[3].latestMet, true);
  assert.ok(result.attempts.some(event => event.correct === false));
  assert.match(result.limitations.join(' '), /employment competence/);
  assert.match(result.limitations.join(' '), /synthetic/);
});

test('unknown assistance remains unknown; incomplete and altered histories cannot export', () => {
  assert.equal(assess(complete()).assistanceExposure, 'unknown');
  assert.equal(exportRun(inspected()), null);
  const state = complete();
  assert.ok(exportRun(state));
  const altered = { ...state, events: state.events.map((event, index) => index === 0 ? { ...event, value: '{"type":"inspect-row","sourceRowId":"ROW-999"}' } : event) };
  assert.equal(exportRun(altered), null);
});

test('assistance history is retained across later setting changes', () => {
  let state = inspected();
  state = act(state, { type: 'set-assistance', exposure: 'hint' });
  state = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  state = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: expectedV1 });
  state = act(state, { type: 'set-assistance', exposure: 'none' });
  state = act(state, { type: 'submit-cleaning', revision: 'morning-cutoff-v2', decisions: v2Decisions });
  state = act(state, { type: 'submit-report', revision: 'morning-cutoff-v2', values: expectedV2 });
  state = act(state, { type: 'reflect', value: 'I applied the new filter after selecting the latest row and retained my earlier assistance record.' });
  const helped = exportRun(state);
  assert.ok(helped);
  assert.equal(helped.assistanceExposure, 'hint');
  assert.deepEqual(helped.reportedAssistance, ['hint']);
  assert.equal(helped.unknownAssistanceAttempts, 0);

  state = inspected();
  state = act(state, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: v1Decisions });
  state = act(state, { type: 'submit-report', revision: 'shift-close-v1', values: expectedV1 });
  state = act(state, { type: 'set-assistance', exposure: 'none' });
  state = act(state, { type: 'submit-cleaning', revision: 'morning-cutoff-v2', decisions: v2Decisions });
  state = act(state, { type: 'submit-report', revision: 'morning-cutoff-v2', values: expectedV2 });
  state = act(state, { type: 'reflect', value: 'I recorded that earlier assistance was unknown before changing the setting for the revised report.' });
  const partiallyKnown = exportRun(state);
  assert.ok(partiallyKnown);
  assert.equal(partiallyKnown.assistanceExposure, 'unknown');
  assert.equal(partiallyKnown.unknownAssistanceAttempts, 2);
});
