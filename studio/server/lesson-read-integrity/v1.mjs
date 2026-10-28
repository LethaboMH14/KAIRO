import { hash, validateLesson } from '../workspace/model.mjs';

const ID = /^[a-f0-9]{24}$/;
const REVISION = /^[a-f0-9]{64}$/;
const ANCHOR = /^S([1-9][0-9]{0,2})-(0|[1-9][0-9]{0,5})$/;

function stale() {
  const error = new Error('This lesson needs a current reviewed source. Your saved work was not changed.');
  error.status = 409;
  return error;
}

function missing() {
  const error = new Error('This lesson was not found in your account.');
  error.status = 404;
  return error;
}

function record(row) {
  return row && typeof row.version === 'string' && row.version.length > 0 &&
    row.value && typeof row.value === 'object' && !Array.isArray(row.value);
}

function validSource(source, id, revision) {
  try {
    return source && source.id === id && source.reviewed === true &&
      source.revision === revision && Array.isArray(source.reviewedPages) &&
      hash(source.reviewedPages) === revision;
  } catch {
    return false;
  }
}

function validAnchors(lesson, archived) {
  if (!Array.isArray(lesson.evidence) || lesson.evidence.length < 1 || lesson.evidence.length > 24 ||
      (lesson.sourceTitle !== undefined && lesson.sourceTitle !== archived.title)) return false;
  let total = 0;
  const seen = new Set();
  for (const item of lesson.evidence) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || seen.has(item.id) ||
        item.sourceId !== lesson.sourceId || (item.sourceRevision !== undefined && item.sourceRevision !== lesson.revision) ||
        item.title !== archived.title || typeof item.quote !== 'string' || !item.quote.trim() ||
        item.quote.length > 1400 || !Number.isSafeInteger(item.start) || !Number.isSafeInteger(item.end) ||
        item.end <= item.start || item.start < 0) return false;
    seen.add(item.id);
    const match = ANCHOR.exec(item.id);
    if (!match) return false;
    const page = archived.reviewedPages[Number(match[1]) - 1];
    if (!page || typeof page.text !== 'string' || item.start !== Number(match[2]) ||
        item.end > page.text.length || item.quote !== page.text.slice(item.start, item.end) ||
        item.locator !== page.locator ||
        (item.edited !== undefined && item.edited !== (page.edited === true))) return false;
    total += item.quote.length;
    if (total > 12000) return false;
  }
  try {
    validateLesson(lesson, lesson.evidence);
  } catch {
    return false;
  }
  return true;
}

/**
 * Owner-scoped, read-only v1 lesson integrity check for a future authenticated route mount.
 *
 * Rejects a revoked/re-reviewed source, missing archived SHA-256 revision, malformed
 * citation offsets and v2 records. The second reads detect changes during validation.
 * This is NOT an atomic Firestore snapshot: revocation after the final read is still
 * possible. Callers must not represent it as transactional read isolation.
 */
export async function loadCurrentV1Lesson({ repository, ownerId, lessonId } = {}) {
  if (!repository || typeof repository.get !== 'function' ||
      typeof ownerId !== 'string' || !ownerId.trim() || !ID.test(lessonId ?? '')) {
    throw new TypeError('An authenticated owner, repository and lesson ID are required.');
  }
  const saved = await repository.get(ownerId, 'lessons', lessonId);
  if (!saved) throw missing();
  if (!record(saved)) throw stale();
  const lesson = saved.value;
  if (lesson.id !== lessonId || (lesson.schemaVersion !== undefined && lesson.schemaVersion !== 1) ||
      Object.hasOwn(lesson, 'sourceRefs') || Object.hasOwn(lesson, 'bundleRevision') ||
      !ID.test(lesson.sourceId ?? '') || !REVISION.test(lesson.revision ?? '')) throw stale();

  const sourceRow = await repository.get(ownerId, 'sources', lesson.sourceId);
  if (!record(sourceRow) || !validSource(sourceRow.value, lesson.sourceId, lesson.revision)) throw stale();
  const revisionKey = lesson.sourceId + '_' + lesson.revision;
  const archiveRow = await repository.get(ownerId, 'revisions', revisionKey);
  if (!record(archiveRow) || !validSource(archiveRow.value, lesson.sourceId, lesson.revision) ||
      !validAnchors(lesson, archiveRow.value)) throw stale();

  const [sourceAgain, archiveAgain] = await Promise.all([
    repository.get(ownerId, 'sources', lesson.sourceId),
    repository.get(ownerId, 'revisions', revisionKey),
  ]);
  const lessonAgain = await repository.get(ownerId, 'lessons', lessonId);
  if (!record(sourceAgain) || !record(archiveAgain) || !record(lessonAgain) ||
      sourceAgain.version !== sourceRow.version || archiveAgain.version !== archiveRow.version ||
      lessonAgain.version !== saved.version ||
      !validSource(sourceAgain.value, lesson.sourceId, lesson.revision) ||
      !validSource(archiveAgain.value, lesson.sourceId, lesson.revision)) throw stale();

  return { lesson, source: sourceAgain.value, sourceRevision: lesson.revision };
}
