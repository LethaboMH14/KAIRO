import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const idPattern = /^[a-f0-9]{24}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const MAX_SOURCE_BYTES = 220 * 1024;
const MAX_DRAFT_BYTES = 128 * 1024;

export class ConflictError extends Error {
  constructor(message = 'The saved version changed. Reload it and try again.') {
    super(message);
    this.name = 'ConflictError';
    this.status = 409;
    this.code = 'VERSION_CONFLICT';
  }
}

const clone = value => JSON.parse(JSON.stringify(value));
const encode = (value, maximum, label) => {
  let json;
  try { json = JSON.stringify(value); } catch { throw new TypeError(`${label} must be JSON data.`); }
  if (json === undefined) throw new TypeError(`${label} must be JSON data.`);
  if (Buffer.byteLength(json, 'utf8') > maximum) throw new TypeError(`${label} exceeds the ${maximum} byte limit.`);
  return json;
};
const validId = (id, label) => {
  if (typeof id !== 'string' || !idPattern.test(id)) throw new TypeError(`${label} must be a 24 character lowercase hexadecimal ID.`);
};
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const parse = row => row ? JSON.parse(row) : null;

function validateSource(source, { reviewed = false } = {}) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new TypeError('Source must be a JSON object.');
  validId(source.id, 'Source ID');
  if (source.reviewed === true || reviewed) {
    if (source.reviewed !== true || !Array.isArray(source.reviewedPages)) throw new TypeError('Reviewed source needs reviewed pages.');
    if (!hashPattern.test(source.revision || '') || digest(source.reviewedPages) !== source.revision) throw new TypeError('Reviewed source revision does not match its reviewed pages.');
  } else if (source.revision != null) {
    throw new TypeError('A source revision requires reviewed pages and reviewed=true.');
  }
  return encode(source, MAX_SOURCE_BYTES, 'Source');
}

function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = action();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve the operation error */ }
    throw error;
  }
}

export function createVersionStore(databasePath) {
  if (typeof databasePath !== 'string' || !databasePath.trim()) throw new TypeError('A database path is required.');
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS source_versions (
      source_id TEXT NOT NULL,
      revision TEXT NOT NULL,
      document TEXT NOT NULL,
      PRIMARY KEY (source_id, revision)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS source_heads (
      source_id TEXT PRIMARY KEY,
      current_revision TEXT,
      unreviewed_document TEXT,
      FOREIGN KEY (source_id, current_revision) REFERENCES source_versions(source_id, revision)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS draft_versions (
      lesson_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      document TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (lesson_id, version)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS draft_heads (
      lesson_id TEXT PRIMARY KEY,
      current_version INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (lesson_id, current_version) REFERENCES draft_versions(lesson_id, version)
    ) WITHOUT ROWID;
  `);

  const sourceHead = db.prepare('SELECT current_revision, unreviewed_document FROM source_heads WHERE source_id = ?');
  const sourceVersion = db.prepare('SELECT document FROM source_versions WHERE source_id = ? AND revision = ?');
  const draftHead = db.prepare('SELECT current_version, updated_at FROM draft_heads WHERE lesson_id = ?');
  const draftVersion = db.prepare('SELECT document, updated_at FROM draft_versions WHERE lesson_id = ? AND version = ?');

  return {
    seedSource(source) {
      const json = validateSource(source);
      return transaction(db, () => {
        const existing = sourceHead.get(source.id);
        if (existing) return false;
        if (source.reviewed === true) {
          const reviewedJson = validateSource(source, { reviewed: true });
          db.prepare('INSERT INTO source_versions(source_id, revision, document) VALUES (?, ?, ?)').run(source.id, source.revision, reviewedJson);
          db.prepare('INSERT INTO source_heads(source_id, current_revision, unreviewed_document) VALUES (?, ?, NULL)').run(source.id, source.revision);
        } else {
          db.prepare('INSERT INTO source_heads(source_id, current_revision, unreviewed_document) VALUES (?, NULL, ?)').run(source.id, json);
        }
        return true;
      });
    },

    getSource(id, revision) {
      validId(id, 'Source ID');
      if (revision !== undefined && revision !== null) {
        if (!hashPattern.test(revision)) throw new TypeError('Source revision must be a 64 character lowercase hexadecimal hash.');
        return parse(sourceVersion.get(id, revision)?.document);
      }
      const head = sourceHead.get(id);
      return head ? parse(head.current_revision ? sourceVersion.get(id, head.current_revision)?.document : head.unreviewed_document) : null;
    },

    reviewSource(id, expectedRevision, nextSource) {
      validId(id, 'Source ID');
      if (expectedRevision !== null && (typeof expectedRevision !== 'string' || !hashPattern.test(expectedRevision))) throw new TypeError('Expected source revision must be null or a 64 character lowercase hexadecimal hash.');
      if (!nextSource || typeof nextSource !== 'object' || nextSource.id !== id) throw new TypeError('Reviewed source ID must match the selected source.');
      const json = validateSource(nextSource, { reviewed: true });
      const same = db.prepare('SELECT document FROM source_versions WHERE source_id = ? AND revision = ?');
      return transaction(db, () => {
        const head = sourceHead.get(id);
        if (!head) throw new TypeError('Source does not exist.');
        const currentRevision = head.current_revision ?? null;
        if (currentRevision !== expectedRevision) throw new ConflictError('This source changed while you were reviewing it. Reload the current version.');
        const prior = same.get(id, nextSource.revision);
        if (prior && prior.document !== json) throw new TypeError('A source revision cannot be reused for different content.');
        if (!prior) db.prepare('INSERT INTO source_versions(source_id, revision, document) VALUES (?, ?, ?)').run(id, nextSource.revision, json);
        db.prepare('UPDATE source_heads SET current_revision = ?, unreviewed_document = NULL WHERE source_id = ?').run(nextSource.revision, id);
        return clone(nextSource);
      });
    },

    getDraft(lessonId) {
      validId(lessonId, 'Lesson ID');
      const head = draftHead.get(lessonId);
      if (!head) return null;
      const row = draftVersion.get(lessonId, head.current_version);
      return { version: head.current_version, document: parse(row.document), updatedAt: row.updated_at };
    },

    saveDraft(lessonId, expectedVersion, document) {
      validId(lessonId, 'Lesson ID');
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) throw new TypeError('Expected draft version must be a nonnegative integer.');
      if (!document || typeof document !== 'object' || Array.isArray(document) || document.lessonId !== lessonId) throw new TypeError('Draft lesson ID must match the selected lesson.');
      if (document.schemaVersion !== 1) throw new TypeError('Draft schema version must be 1.');
      validId(document.sourceId, 'Draft source ID');
      if (!hashPattern.test(document.sourceRevision || '')) throw new TypeError('Draft source revision must be a 64 character lowercase hexadecimal hash.');
      const json = encode(document, MAX_DRAFT_BYTES, 'Draft');
      return transaction(db, () => {
        const head = draftHead.get(lessonId);
        const current = head?.current_version ?? 0;
        if (current !== expectedVersion) throw new ConflictError('This draft changed while you were editing it. Reload the latest version.');
        const version = current + 1;
        const updatedAt = new Date().toISOString();
        db.prepare('INSERT INTO draft_versions(lesson_id, version, document, updated_at) VALUES (?, ?, ?, ?)').run(lessonId, version, json, updatedAt);
        if (head) db.prepare('UPDATE draft_heads SET current_version = ?, updated_at = ? WHERE lesson_id = ?').run(version, updatedAt, lessonId);
        else db.prepare('INSERT INTO draft_heads(lesson_id, current_version, updated_at) VALUES (?, ?, ?)').run(lessonId, version, updatedAt);
        return { version, document: clone(document), updatedAt };
      });
    },

    listDraftVersions(lessonId) {
      validId(lessonId, 'Lesson ID');
      return db.prepare('SELECT version, updated_at AS updatedAt FROM draft_versions WHERE lesson_id = ? ORDER BY version DESC').all(lessonId);
    },

    getDraftVersion(lessonId, version) {
      validId(lessonId, 'Lesson ID');
      if (!Number.isSafeInteger(version) || version < 1) throw new TypeError('Draft version must be a positive integer.');
      const row = draftVersion.get(lessonId, version);
      return row ? { version, document: parse(row.document), updatedAt: row.updated_at } : null;
    },

    close() { db.close(); },
  };
}
