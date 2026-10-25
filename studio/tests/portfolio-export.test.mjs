import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPortfolioExport, portfolioHtml, portfolioJson, PORTFOLIO_VERSION } from '../src/portfolio-export/model.ts';
import { initialCase, records as stockRecords, transition as stockTransition, caseRecord } from '../src/practice/model.ts';
import { initialState, scenario, transition as simTransition, exportRun } from '../src/worksim/model.ts';

const time = '2026-10-22T08:00:00Z';
function practice(reflection = 'I checked every signed record and documented the stock decision.') {
  let s = initialCase('shop-run', null);
  s = stockTransition(s, { type: 'calculate', value: 23 }, time);
  for (const key of Object.keys(stockRecords)) s = stockTransition(s, { type: 'inspect', key }, time);
  s = stockTransition(s, { type: 'reconcile', difference: 2, cause: 'damage' }, time);
  s = stockTransition(s, { type: 'decide', value: 'record' }, time);
  s = stockTransition(s, { type: 'reflect', value: reflection }, time);
  return caseRecord(s);
}
const v1 = { uniqueTickets: 7, resolvedCurrent: 5, reopenedCurrent: 1, unknownCurrent: 1, duplicateRows: 2, missingResolutionCodes: 1, missingCustomerVerification: 1, missingTimestamps: 1 };
const v2 = { eligibleResolved: 2, excludedAfterCutoff: 1, excludedUnverified: 1, excludedMissingResolutionCode: 1, reopened: 1, unknownTimestamp: 1, duplicateRows: 2 };
const clean1 = [['ROW-101','exclude','superseded-duplicate'],['ROW-102','retain','latest-for-ticket'],['ROW-103','retain','latest-for-ticket'],['ROW-104','retain','latest-for-ticket'],['ROW-105','exclude','superseded-duplicate'],['ROW-106','retain','latest-for-ticket'],['ROW-107','retain','latest-for-ticket'],['ROW-108','quarantine','missing-timestamp'],['ROW-109','retain','latest-for-ticket']].map(([sourceRowId,disposition,reason])=>({sourceRowId,disposition,reason}));
const clean2 = [['ROW-101','exclude','superseded-duplicate'],['ROW-102','retain','eligible-latest'],['ROW-103','exclude','missing-resolution-code'],['ROW-104','exclude','unverified'],['ROW-105','exclude','superseded-duplicate'],['ROW-106','exclude','reopened-latest'],['ROW-107','exclude','after-cutoff'],['ROW-108','quarantine','missing-timestamp'],['ROW-109','retain','eligible-latest']].map(([sourceRowId,disposition,reason])=>({sourceRowId,disposition,reason}));
function worksim(assistance = 'unknown') {
  let s = initialState('sim-run');
  for (const row of scenario.records) s = simTransition(s, { type: 'inspect-row', sourceRowId: row.sourceRowId }, time);
  if (assistance !== 'unknown') s = simTransition(s, { type: 'set-assistance', exposure: assistance }, time);
  s = simTransition(s, { type: 'submit-cleaning', revision: 'shift-close-v1', decisions: clean1 }, time);
  s = simTransition(s, { type: 'submit-report', revision: 'shift-close-v1', values: v1 }, time);
  s = simTransition(s, { type: 'submit-cleaning', revision: 'morning-cutoff-v2', decisions: clean2 }, time);
  s = simTransition(s, { type: 'submit-report', revision: 'morning-cutoff-v2', values: v2 }, time);
  s = simTransition(s, { type: 'reflect', value: 'I checked duplicate rows, preserved unknown values, and explained how the revised cutoff changed the result.' }, time);
  return s;
}

test('JSON export combines replay-validated local and synthetic artifacts and roundtrips within bounds', () => {
  const output = buildPortfolioExport({ practiceCases: [practice()], worksimRuns: [worksim()] });
  assert.ok(output);
  assert.equal(output.formatVersion, PORTFOLIO_VERSION);
  assert.deepEqual(output.items.map(x => x.evidenceType), ['local-practice', 'synthetic-exercise']);
  assert.equal(output.items[1].artifact.assistanceExposure, 'unknown');
  const json = portfolioJson(output);
  assert.deepEqual(JSON.parse(json), output);
  assert.ok(Buffer.byteLength(json) < 250_000);
  assert.match(json, /self-reported and unverified/);
  assert.match(json, /Synthetic exercise records are invented/);
  assert.throws(() => portfolioJson(structuredClone(output)), /unchanged replay-validated/);
  assert.throws(() => portfolioHtml(structuredClone(output)), /unchanged replay-validated/);
});

test('invalid source records are reported by original index and unknown help is not changed to none', () => {
  const output = buildPortfolioExport({ practiceCases: [{ ...practice(), version: 'bad' }, practice()], worksimRuns: [worksim('hint'), worksim('none')] });
  assert.deepEqual(output.rejected, { practiceCases: [0], worksimRuns: [] });
  const practiceItem = output.items.find(x => x.evidenceType === 'local-practice');
  assert.match(practiceItem.artifact.limitations.join(' '), /help exposure is unknown/);
  const syntheticItems = output.items.filter(x => x.evidenceType === 'synthetic-exercise');
  assert.equal(syntheticItems[0].artifact.assistanceExposure, 'hint');
  assert.equal(syntheticItems[1].artifact.assistanceExposure, 'none');
});

test('HTML escapes hostile text, contains no scripts or remote resources, and keeps print-readable sections', () => {
  const hostile = practice('<img src=x onerror=alert(1)> & "quoted" <script>bad()</script> '.padEnd(80, 'x'));
  const output = buildPortfolioExport({ practiceCases: [hostile], worksimRuns: [] });
  const html = portfolioHtml(output);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script\b|<img\b|https?:\/\//i);
  assert.match(html, /@media print/);
  assert.match(html, /aria-labelledby/);
  assert.match(html, /Contributor reflection/);
  assert.match(html, /<table>/);
  assert.match(html, /Source and run details/);
  assert.match(html, /Linked lesson/);
  assert.match(html, /#f5f0e5/);
});

test('malformed envelopes, oversized item counts and aggregate input are rejected', () => {
  assert.equal(buildPortfolioExport(null), null);
  assert.equal(buildPortfolioExport({ practiceCases: [], worksimRuns: [] , extra: 'ignored' }), null);
  assert.equal(buildPortfolioExport({ practiceCases: Array(21).fill(practice()), worksimRuns: [] }), null);
  assert.equal(buildPortfolioExport({ practiceCases: [practice()], worksimRuns: [], unexpected: 'x' }), null);
  assert.equal(buildPortfolioExport({ practiceCases: [], worksimRuns: [], oversized: 'x'.repeat(251_000) }), null);
});
