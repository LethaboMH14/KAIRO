import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTIFACT_PANEL_LIMITS, validateArtifactPanelV1 } from '../src/artifact-panel/contract.ts';

function textArtifact(patch = {}) {
  return {
    schemaVersion: 1,
    artifactId: 'artifact-1',
    title: 'Worked note',
    kind: 'text',
    provenance: { sourceId: 'source-a', sourceRevision: 'rev-2', page: 1, label: 'Claimed source' },
    payload: { type: 'text', text: 'A plain explanation.' },
    ...patch,
  };
}

function tableArtifact(patch = {}) {
  return {
    ...textArtifact(),
    kind: 'table',
    payload: { type: 'table', columns: ['Item', 'Count'], rows: [['Rice', '4'], ['Oil', '2']] },
    ...patch,
  };
}

test('projects valid text and table records into exact versioned shapes', () => {
  const text = validateArtifactPanelV1(textArtifact());
  assert.equal(text.ok, true);
  assert.deepEqual(text.artifact, textArtifact());
  assert.equal(text.serializedBytes, Buffer.byteLength(JSON.stringify(text.artifact)));

  const table = validateArtifactPanelV1(tableArtifact());
  assert.equal(table.ok, true);
  assert.deepEqual(table.artifact.payload.rows, [['Rice', '4'], ['Oil', '2']]);
});

test('provenance is optional and remains a caller claim, projected without extra fields', () => {
  const withoutProvenance = textArtifact();
  delete withoutProvenance.provenance;
  assert.deepEqual(validateArtifactPanelV1(withoutProvenance).artifact.provenance, {});

  const value = textArtifact({ provenance: { label: 'Unverified excerpt' } });
  const result = validateArtifactPanelV1(value);
  assert.equal(result.ok, true);
  assert.deepEqual(result.artifact.provenance, { label: 'Unverified excerpt' });
});

test('rejects unknown, missing, unsupported-version and mismatched kind/payload fields', () => {
  const cases = [
    [textArtifact({ extra: 'ignored?' }), 'unknown-field'],
    [(() => { const value = textArtifact(); delete value.title; return value; })(), 'missing-field'],
    [textArtifact({ schemaVersion: 2 }), 'invalid-schema-version'],
    [textArtifact({ payload: { type: 'table', columns: ['x'], rows: [] } }), 'invalid-kind-payload'],
    [tableArtifact({ kind: 'text' }), 'invalid-kind-payload'],
    [tableArtifact({ payload: { type: 'table', columns: ['x'], rows: [], unexpected: 1 } }), 'unknown-field'],
  ];
  for (const [input, code] of cases) assert.deepEqual(validateArtifactPanelV1(input), { ok: false, code });
});

test('rejects coercible values, accessors, exotic prototypes, symbols and sparse or decorated arrays', () => {
  const objectPayload = textArtifact({ payload: { type: 'text', text: { toString: () => 'x' } } });
  assert.equal(validateArtifactPanelV1(objectPayload).ok, false);

  let getterCalled = false;
  const accessor = textArtifact();
  Object.defineProperty(accessor, 'title', { enumerable: true, get() { getterCalled = true; return 'title'; } });
  assert.equal(validateArtifactPanelV1(accessor).ok, false);
  assert.equal(getterCalled, false);

  assert.equal(validateArtifactPanelV1(Object.assign(Object.create({ inherited: true }), textArtifact())).ok, false);
  const symbolic = textArtifact();
  symbolic[Symbol('hidden')] = 1;
  assert.equal(validateArtifactPanelV1(symbolic).ok, false);

  const sparse = new Array(1);
  const result = validateArtifactPanelV1(tableArtifact({ payload: { type: 'table', columns: ['x'], rows: [sparse] } }));
  assert.equal(result.ok, false);
  assert.equal(result.code, 'invalid-table');
  const decorated = ['x'];
  decorated.extra = 'value';
  assert.equal(validateArtifactPanelV1(tableArtifact({ payload: { type: 'table', columns: decorated, rows: [] } })).ok, false);
});

test('rejects malformed identifiers, pages and invalid Unicode', () => {
  assert.equal(validateArtifactPanelV1(textArtifact({ artifactId: '../secret' })).code, 'invalid-identifier');
  assert.equal(validateArtifactPanelV1(textArtifact({ provenance: { page: 0 } })).code, 'invalid-provenance');
  assert.equal(validateArtifactPanelV1(textArtifact({ title: '\ud800' })).ok, false);
});

test('enforces UTF-8 limits, table shape/count limits and total serialized bytes', () => {
  const tooLongTitle = 'é'.repeat(Math.floor(ARTIFACT_PANEL_LIMITS.titleBytes / 2) + 1);
  assert.equal(validateArtifactPanelV1(textArtifact({ title: tooLongTitle })).code, 'limit-exceeded');
  assert.equal(validateArtifactPanelV1(textArtifact({ payload: { type: 'text', text: 'x'.repeat(ARTIFACT_PANEL_LIMITS.textBytes + 1) } })).code, 'limit-exceeded');
  assert.equal(validateArtifactPanelV1(tableArtifact({ payload: { type: 'table', columns: ['a', 'b'], rows: [['one']] } })).code, 'invalid-table');
  const tooManyColumns = Array.from({ length: ARTIFACT_PANEL_LIMITS.columns + 1 }, () => 'c');
  assert.equal(validateArtifactPanelV1(tableArtifact({ payload: { type: 'table', columns: tooManyColumns, rows: [] } })).code, 'limit-exceeded');

  const manyColumns = Array.from({ length: ARTIFACT_PANEL_LIMITS.columns }, () => 'c');
  const hugeRows = Array.from({ length: ARTIFACT_PANEL_LIMITS.rows }, () => manyColumns.map(() => 'x'.repeat(ARTIFACT_PANEL_LIMITS.cellBytes)));
  const oversizedEnvelope = tableArtifact({ payload: { type: 'table', columns: manyColumns, rows: hugeRows } });
  const result = validateArtifactPanelV1(oversizedEnvelope);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'limit-exceeded');
});

test('fails closed on throwing proxy traps without echoing inputs or exceptions', () => {
  const hostile = new Proxy({}, { ownKeys() { throw new Error('private detail'); } });
  assert.deepEqual(validateArtifactPanelV1(hostile), { ok: false, code: 'invalid-object' });
});
