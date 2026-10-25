import test from 'node:test';
import assert from 'node:assert/strict';
import { portfolioDownloadMessage, preparePortfolioDownloads } from '../src/evidence-workspace/portfolio-download.ts';
import { initialCase, records, transition as stockTransition, caseRecord } from '../src/practice/model.ts';
import { initialState, scenario, transition as simTransition } from '../src/worksim/model.ts';

const at = '2026-10-22T08:00:00Z';
function savedCase() {
  let s = initialCase('saved-shop', 'lesson-a');
  s = stockTransition(s, { type: 'calculate', value: 23 }, at);
  for (const key of Object.keys(records)) s = stockTransition(s, { type: 'inspect', key }, at);
  s = stockTransition(s, { type: 'reconcile', difference: 2, cause: 'damage' }, at);
  s = stockTransition(s, { type: 'decide', value: 'record' }, at);
  s = stockTransition(s, { type: 'reflect', value: 'I compared the shelf with the signed damage entry and recorded the difference.' }, at);
  return caseRecord(s);
}
const report1 = { uniqueTickets: 7, resolvedCurrent: 5, reopenedCurrent: 1, unknownCurrent: 1, duplicateRows: 2, missingResolutionCodes: 1, missingCustomerVerification: 1, missingTimestamps: 1 };
const report2 = { eligibleResolved: 2, excludedAfterCutoff: 1, excludedUnverified: 1, excludedMissingResolutionCode: 1, reopened: 1, unknownTimestamp: 1, duplicateRows: 2 };
const decisions1 = [['ROW-101','exclude','superseded-duplicate'],['ROW-102','retain','latest-for-ticket'],['ROW-103','retain','latest-for-ticket'],['ROW-104','retain','latest-for-ticket'],['ROW-105','exclude','superseded-duplicate'],['ROW-106','retain','latest-for-ticket'],['ROW-107','retain','latest-for-ticket'],['ROW-108','quarantine','missing-timestamp'],['ROW-109','retain','latest-for-ticket']].map(([sourceRowId,disposition,reason])=>({sourceRowId,disposition,reason}));
const decisions2 = [['ROW-101','exclude','superseded-duplicate'],['ROW-102','retain','eligible-latest'],['ROW-103','exclude','missing-resolution-code'],['ROW-104','exclude','unverified'],['ROW-105','exclude','superseded-duplicate'],['ROW-106','exclude','reopened-latest'],['ROW-107','exclude','after-cutoff'],['ROW-108','quarantine','missing-timestamp'],['ROW-109','retain','eligible-latest']].map(([sourceRowId,disposition,reason])=>({sourceRowId,disposition,reason}));
function activeRun() {
  let s = initialState('live-sim');
  for (const row of scenario.records) s = simTransition(s, { type: 'inspect-row', sourceRowId: row.sourceRowId }, at);
  s = simTransition(s, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: decisions1 }, at);
  s = simTransition(s, { type: 'submit-report', revision: 'shift-close-v1', values: report1 }, at);
  s = simTransition(s, { type: 'submit-cleaning', revision: 'morning-cutoff-v2', decisions: decisions2 }, at);
  s = simTransition(s, { type: 'submit-report', revision: 'morning-cutoff-v2', values: report2 }, at);
  return simTransition(s, { type: 'reflect', value: 'I retained unknown values and checked the cutoff change against the latest records.' }, at);
}

test('download helper builds HTML and JSON from saved raw cases and current raw simulation state', () => {
  const result = preparePortfolioDownloads({ version: 1, cases: [savedCase()] }, activeRun());
  const json = JSON.parse(result.json);
  assert.equal(json.items.length, 2);
  assert.equal(json.items[0].artifact.lessonId, 'lesson-a');
  assert.equal(json.items[1].artifact.assistanceExposure, 'unknown');
  assert.match(result.html, /Linked lesson<\/dt><dd>lesson-a/);
  assert.equal((result.html.match(/Assistance exposure: unknown/g) || []).length, json.items[1].artifact.attempts.length + 1);
  assert.equal(result.rejectedCount, 0);
});

test('incomplete current state is explicitly rejected and preserved as a source index without saving', () => {
  const result = preparePortfolioDownloads({ version: 1, cases: [] }, initialState('unfinished'));
  assert.equal(result.rejectedCount, 1);
  assert.deepEqual(JSON.parse(result.json).rejected.worksimRuns, [0]);
  assert.match(result.html, /Simulation runs: 0/);
  assert.throws(() => preparePortfolioDownloads({ version: 2, cases: [] }), /could not be read as version 1/);
});

test('download feedback reports a request and omissions without claiming browser completion', () => {
  const message = portfolioDownloadMessage(2);
  assert.match(message, /Download requested\. Check your browser downloads/);
  assert.match(message, /2 incomplete or invalid records? were not included/);
  assert.doesNotMatch(message, /Portfolio downloaded|download complete/i);
  assert.throws(() => portfolioDownloadMessage(-1), /nonnegative integer/);
});
