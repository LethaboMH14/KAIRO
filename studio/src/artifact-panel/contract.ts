/** Strict, renderer-neutral validation for static text and table artifacts. */

export const ARTIFACT_PANEL_SCHEMA_VERSION = 1 as const;

export const ARTIFACT_PANEL_LIMITS = Object.freeze({
  envelopeBytes: 128 * 1024,
  titleBytes: 200,
  identifierBytes: 100,
  textBytes: 32 * 1024,
  labelBytes: 500,
  columns: 20,
  rows: 100,
  cells: 2000,
  cellBytes: 500,
});

export type ArtifactProvenanceV1 = {
  sourceId?: string;
  sourceRevision?: string;
  page?: number;
  label?: string;
};

export type TextArtifactPanelV1 = {
  schemaVersion: 1;
  artifactId: string;
  title: string;
  kind: 'text';
  provenance: ArtifactProvenanceV1;
  payload: { type: 'text'; text: string };
};

export type TableArtifactPanelV1 = {
  schemaVersion: 1;
  artifactId: string;
  title: string;
  kind: 'table';
  provenance: ArtifactProvenanceV1;
  payload: { type: 'table'; columns: string[]; rows: string[][] };
};

export type ArtifactPanelV1 = TextArtifactPanelV1 | TableArtifactPanelV1;

export type ArtifactPanelErrorCode =
  | 'invalid-object'
  | 'unknown-field'
  | 'missing-field'
  | 'invalid-schema-version'
  | 'invalid-identifier'
  | 'invalid-title'
  | 'invalid-kind-payload'
  | 'invalid-provenance'
  | 'invalid-text'
  | 'invalid-table'
  | 'limit-exceeded'
  | 'serialization-failed';

export type ArtifactPanelValidation =
  | { ok: true; artifact: ArtifactPanelV1; serializedBytes: number }
  | { ok: false; code: ArtifactPanelErrorCode };

class Reject extends Error {
  readonly code: ArtifactPanelErrorCode;

  constructor(code: ArtifactPanelErrorCode) {
    super(code);
    this.code = code;
  }
}

function reject(code: ArtifactPanelErrorCode): never {
  throw new Reject(code);
}

function utf8Bytes(value: string, maxBytes = Number.POSITIVE_INFINITY): number {
  // Count without allocating an encoded copy; stop once the configured bound is crossed.
  let bytes = 0;
  for (let i = 0; i < value.length; i += 1) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) reject('invalid-object');
      i += 1;
      bytes += 4;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      reject('invalid-object');
    } else if (unit <= 0x7f) {
      bytes += 1;
    } else if (unit <= 0x7ff) {
      bytes += 2;
    } else {
      bytes += 3;
    }
    if (bytes > maxBytes) reject('limit-exceeded');
  }
  return bytes;
}

type DataRecord = Record<string, unknown>;

function ownDataRecord(value: unknown, allowed: readonly string[], required: readonly string[]): DataRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) reject('invalid-object');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) reject('invalid-object');

  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== 'string')) reject('unknown-field');
  for (const key of keys as string[]) {
    if (!allowed.includes(key)) reject('unknown-field');
  }

  const record: DataRecord = Object.create(null) as DataRecord;
  for (const key of keys as string[]) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) reject('invalid-object');
    record[key] = descriptor.value;
  }
  for (const key of required) {
    if (!Object.hasOwn(record, key)) reject('missing-field');
  }
  return record;
}

function denseArray(value: unknown, maxLength: number, code: ArtifactPanelErrorCode): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) reject(code);
  const length = value.length;
  if (!Number.isSafeInteger(length) || length < 0 || length > maxLength) reject('limit-exceeded');
  const keys = Reflect.ownKeys(value);
  if (keys.length !== length + 1 || keys.some((key) => typeof key === 'symbol')) reject(code);
  const entries: unknown[] = [];
  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) reject(code);
    entries.push(descriptor.value);
  }
  return entries;
}

function boundedString(value: unknown, maxBytes: number, code: ArtifactPanelErrorCode): string {
  if (typeof value !== 'string') reject(code);
  utf8Bytes(value, maxBytes);
  return value;
}

function identifier(value: unknown): string {
  const result = boundedString(value, ARTIFACT_PANEL_LIMITS.identifierBytes, 'invalid-identifier');
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result)) reject('invalid-identifier');
  return result;
}

function parseProvenance(value: unknown): ArtifactProvenanceV1 {
  const record = ownDataRecord(value, ['sourceId', 'sourceRevision', 'page', 'label'], []);
  const result: ArtifactProvenanceV1 = {};
  if (Object.hasOwn(record, 'sourceId')) result.sourceId = identifier(record.sourceId);
  if (Object.hasOwn(record, 'sourceRevision')) result.sourceRevision = identifier(record.sourceRevision);
  if (Object.hasOwn(record, 'page')) {
    if (!Number.isSafeInteger(record.page) || (record.page as number) < 1) reject('invalid-provenance');
    result.page = record.page as number;
  }
  if (Object.hasOwn(record, 'label')) {
    result.label = boundedString(record.label, ARTIFACT_PANEL_LIMITS.labelBytes, 'invalid-provenance');
  }
  return result;
}

function parseTextPayload(value: unknown): TextArtifactPanelV1['payload'] {
  const tagged = ownDataRecord(value, ['type', 'text', 'columns', 'rows'], ['type']);
  if (tagged.type !== 'text') reject('invalid-kind-payload');
  const record = ownDataRecord(value, ['type', 'text'], ['type', 'text']);
  return { type: 'text', text: boundedString(record.text, ARTIFACT_PANEL_LIMITS.textBytes, 'invalid-text') };
}

function parseTablePayload(value: unknown): TableArtifactPanelV1['payload'] {
  const tagged = ownDataRecord(value, ['type', 'columns', 'rows', 'text'], ['type']);
  if (tagged.type !== 'table') reject('invalid-kind-payload');
  const record = ownDataRecord(value, ['type', 'columns', 'rows'], ['type', 'columns', 'rows']);

  const columns = denseArray(record.columns, ARTIFACT_PANEL_LIMITS.columns, 'invalid-table')
    .map((cell) => boundedString(cell, ARTIFACT_PANEL_LIMITS.cellBytes, 'invalid-table'));
  if (columns.length === 0) reject('invalid-table');
  const rows = denseArray(record.rows, ARTIFACT_PANEL_LIMITS.rows, 'invalid-table').map((rawRow) => {
    const row = denseArray(rawRow, ARTIFACT_PANEL_LIMITS.columns, 'invalid-table')
      .map((cell) => boundedString(cell, ARTIFACT_PANEL_LIMITS.cellBytes, 'invalid-table'));
    if (row.length !== columns.length) reject('invalid-table');
    return row;
  });
  if (columns.length * rows.length > ARTIFACT_PANEL_LIMITS.cells) reject('limit-exceeded');
  return { type: 'table', columns, rows };
}

/**
 * Validate and project an untrusted value into the deliberately small v1 contract.
 * Provenance fields are caller-claimed labels/references and do not establish authority.
 */
export function validateArtifactPanelV1(input: unknown): ArtifactPanelValidation {
  try {
    const record = ownDataRecord(
      input,
      ['schemaVersion', 'artifactId', 'title', 'kind', 'provenance', 'payload'],
      ['schemaVersion', 'artifactId', 'title', 'kind', 'payload'],
    );
    if (record.schemaVersion !== ARTIFACT_PANEL_SCHEMA_VERSION) reject('invalid-schema-version');

    const artifactId = identifier(record.artifactId);
    const title = boundedString(record.title, ARTIFACT_PANEL_LIMITS.titleBytes, 'invalid-title');
    const provenance = Object.hasOwn(record, 'provenance') ? parseProvenance(record.provenance) : {};
    let artifact: ArtifactPanelV1;
    if (record.kind === 'text') {
      artifact = { schemaVersion: 1, artifactId, title, kind: 'text', provenance, payload: parseTextPayload(record.payload) };
    } else if (record.kind === 'table') {
      artifact = { schemaVersion: 1, artifactId, title, kind: 'table', provenance, payload: parseTablePayload(record.payload) };
    } else {
      reject('invalid-kind-payload');
    }

    // Stringify only the freshly projected, fully validated value; never the caller object.
    let serialized: string;
    try {
      serialized = JSON.stringify(artifact);
    } catch {
      reject('serialization-failed');
    }
    const serializedBytes = utf8Bytes(serialized, ARTIFACT_PANEL_LIMITS.envelopeBytes);
    return { ok: true, artifact, serializedBytes };
  } catch (error) {
    return { ok: false, code: error instanceof Reject ? error.code : 'invalid-object' };
  }
}
