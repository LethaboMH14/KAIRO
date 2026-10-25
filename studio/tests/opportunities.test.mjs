import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { isPublicHttpsUrl, listOpportunities } from '../server/opportunities/index.mjs';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const record = (overrides = {}) => ({
  id: 'example', title: 'Engineering bursary', type: 'bursary', provider: 'Example provider',
  officialUrl: 'https://provider.example.org/bursary', discoveryUrl: 'https://www.studentroom.co.za/category/bursaries/',
  checkedAt: '2026-10-20', closesAt: '2026-10-31T23:59:59+02:00', requirements: ['Northern Cape resident'],
  disciplines: ['Engineering'], status: 'open', verification: 'official', ...overrides,
});

test('deadline state follows injected time and missing deadlines remain unknown', () => {
  const records = [record(), record({ id: 'no-deadline', officialUrl: 'https://other.example.org/bursary', closesAt: null, status: 'open' })];
  const before = listOpportunities({ now: '2026-10-25T12:00:00+02:00', records }).records;
  assert.equal(before.find((item) => item.id === 'example').status, 'open');
  assert.equal(before.find((item) => item.id === 'no-deadline').status, 'unknown');
  const after = listOpportunities({ now: '2026-11-01T00:00:00+02:00', records }).records;
  assert.equal(after.find((item) => item.id === 'example').status, 'closed');
});

test('duplicate IDs and canonical official URLs collapse, preferring official and fresh metadata', () => {
  const older = record({ checkedAt: '2026-10-20', verification: 'discovery-only' });
  const newer = record({ checkedAt: '2026-10-21', title: 'Verified title' });
  const duplicateUrl = record({ id: 'different-id', officialUrl: 'https://provider.example.org/bursary/' });
  const result = listOpportunities({ now: '2026-10-25', records: [older, newer, duplicateUrl] }).records;
  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Verified title');
  assert.equal(result[0].verification, 'official');
  const sameIdDifferentUrl = listOpportunities({ now: '2026-10-25', records: [record(), record({ officialUrl: 'https://alternate.example.org/funding', checkedAt: '2026-10-21', title: 'Refreshed same ID' })] }).records;
  assert.equal(sameIdDifferentUrl.length, 1);
  assert.equal(sameIdDifferentUrl[0].title, 'Refreshed same ID');
  const queryIds = listOpportunities({ now: '2026-10-25', records: [
    record({ id: 'job-1', officialUrl: 'https://provider.example.org/jobs?id=1&utm_source=directory' }),
    record({ id: 'job-2', officialUrl: 'https://provider.example.org/jobs?id=2' }),
    record({ id: 'job-1-copy', officialUrl: 'https://provider.example.org/jobs?id=1' }),
  ] }).records;
  assert.equal(queryIds.length, 2, 'meaningful listing IDs survive while tracking parameters are stripped');
});

test('closed and discovery-only states are preserved, stale and future checks cannot appear open', () => {
  const result = listOpportunities({ now: '2026-10-25', records: [
    record({ id: 'explicitly-closed', officialUrl: 'https://provider.example.org/closed', status: 'closed', closesAt: '2026-11-30' }),
    record({ id: 'closed-without-date', officialUrl: 'https://provider.example.org/closed-old', status: 'closed', closesAt: null }),
    record({ id: 'stale-but-closed', officialUrl: 'https://provider.example.org/stale-closed', checkedAt: '2026-10-10', status: 'closed', closesAt: '2026-11-30' }),
    record({ id: 'discovery', officialUrl: 'https://provider.example.org/discovery', verification: 'discovery-only', closesAt: '2026-11-30' }),
    record({ id: 'stale', officialUrl: 'https://provider.example.org/stale', checkedAt: '2026-10-10' }),
    record({ id: 'future-check', officialUrl: 'https://provider.example.org/future', checkedAt: '2026-10-26' }),
  ] }).records;
  assert.equal(result.find((item) => item.id === 'explicitly-closed').status, 'closed');
  assert.equal(result.find((item) => item.id === 'closed-without-date').status, 'closed');
  assert.equal(result.find((item) => item.id === 'stale-but-closed').status, 'closed');
  assert.equal(result.find((item) => item.id === 'stale-but-closed').stale, true);
  assert.equal(result.find((item) => item.id === 'discovery').status, 'unknown');
  assert.equal(result.find((item) => item.id === 'stale').status, 'unknown');
  assert.equal(result.find((item) => item.id === 'stale').stale, true);
  assert.equal(result.some((item) => item.id === 'future-check'), false);
});

test('invalid record collections fail closed', () => {
  const result = listOpportunities({ now: '2026-10-25', records: { unexpected: true } });
  assert.deepEqual(result.records, []);
  assert.match(result.limitations.join(' '), /supplied opportunity list was invalid/i);
});

test('public links accept HTTPS and reject unsafe or local destinations', () => {
  assert.equal(isPublicHttpsUrl('https://www.graduates24.com/bursaries'), true);
  for (const unsafe of ['http://provider.example.org', 'javascript:alert(1)', 'https://user:pass@provider.example.org', 'https://localhost/path', 'https://127.0.0.1/path', 'https://provider.example.org:444/path', 'https://[::1]/path']) {
    assert.equal(isPublicHttpsUrl(unsafe), false, unsafe);
  }
  const result = listOpportunities({ now: '2026-10-25', records: [record({ officialUrl: 'javascript:alert(1)' })] });
  assert.deepEqual(result.records, []);
});

test('programme filtering uses transparent source wording, not a score', () => {
  const records = [record(), record({ id: 'teaching', officialUrl: 'https://other.example.org/teaching', title: 'Teaching bursary', disciplines: ['Teaching', 'Education'] })];
  const options = { now: '2026-10-25', records };
  assert.deepEqual(listOpportunities({ ...options, programme: 'Mechanical Engineering' }).records.map((item) => item.id), ['example']);
  assert.deepEqual(listOpportunities({ ...options, programme: 'teaching' }).records.map((item) => item.id), ['teaching']);
  assert.deepEqual(listOpportunities({ ...options, programme: 'medicine' }).records, []);
});

async function withComponent(run) {
  const server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: Opportunities, isSafeExternalHref } = await server.ssrLoadModule('/src/opportunities/Opportunities.tsx');
    await run(Opportunities, isSafeExternalHref);
  } finally { await server.close(); }
}

test('plain results show status, checked date, source boundaries and safe links', async () => {
  await withComponent((Component) => {
    const data = listOpportunities({ now: '2026-10-25', records: [record()] });
    const html = renderToStaticMarkup(React.createElement(Component, { records: data.records, limitations: data.limitations }));
    assert.match(html, /Engineering bursary/);
    assert.match(html, /Deadline ahead/);
    assert.match(html, /Closing date/);
    assert.match(html, /Checked/);
    assert.match(html, /Open provider’s page/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.match(html, /not an eligibility or hiring score/i);
    assert.doesNotMatch(html, /<script\b/i);
  });
});

test('UI link validation rejects literal IPs and local hostnames', async () => {
  await withComponent((_Component, isSafe) => {
    for (const value of ['https://192.168.0.1/apply', 'https://[::1]/apply', 'https://localhost/apply', 'https://safe.example.org/apply']) {
      assert.equal(isSafe(value), value.includes('safe.example.org'), value);
    }
  });
});

test('production seed exposes official examples and both discovery services', () => {
  const { records } = listOpportunities({ now: '2026-10-25' });
  assert.ok(records.some((item) => item.discoveryUrl?.includes('studentroom.co.za')));
  assert.ok(records.some((item) => item.discoveryUrl?.includes('graduates24.com')));
  assert.ok(records.some((item) => item.verification === 'official' && item.closesAt));
  assert.ok(records.some((item) => item.verification === 'discovery-only' && item.status === 'unknown'));
});
