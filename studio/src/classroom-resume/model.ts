export type ResumeLesson = { id: string; sourceId: string; revision: string; chapters: readonly unknown[] };
export type ResumeState = { step: number; reading: boolean };
export type ResumeResult = {
  state: ResumeState;
  status: 'empty' | 'restored' | 'stale' | 'invalid' | 'unavailable';
  canWrite: boolean;
  message: string;
};
export type ResumeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type Envelope = {
  schemaVersion: 1;
  lessonId: string;
  sourceId: string;
  revision: string;
  step: number;
  reading: boolean;
};

const ID = /^[a-f0-9]{24}$/;
const PREFIX = 'kairo-rain-resume-v1:';
const MAX_RECORD_LENGTH = 4096;
const FIELDS = ['schemaVersion', 'lessonId', 'sourceId', 'revision', 'step', 'reading'];
const DEFAULT_STATE = (): ResumeState => ({ step: 0, reading: true });

function validateLesson(lesson: ResumeLesson): void {
  if (!lesson || typeof lesson !== 'object' || !ID.test(lesson.id) || !ID.test(lesson.sourceId)) {
    throw new Error('A valid saved lesson and source are required to resume.');
  }
  if (typeof lesson.revision !== 'string' || lesson.revision.length === 0 || lesson.revision.length > 128) {
    throw new Error('The reviewed lesson revision must contain 1 to 128 characters.');
  }
  if (!Array.isArray(lesson.chapters) || lesson.chapters.length === 0) {
    throw new Error('The lesson must contain at least one chapter to resume.');
  }
}

export function resumeKey(lessonId: string): string {
  if (typeof lessonId !== 'string' || !ID.test(lessonId)) throw new Error('A valid saved lesson ID is required.');
  return PREFIX + lessonId;
}

function result(status: ResumeResult['status'], message = '', state = DEFAULT_STATE()): ResumeResult {
  return { state: { step: state.step, reading: state.reading }, status, canWrite: status === 'empty' || status === 'restored', message };
}

function invalid(): ResumeResult {
  return result('invalid', 'Your saved place could not be read, so it was left unchanged.');
}

export function decodeResume(raw: string | null, lesson: ResumeLesson): ResumeResult {
  validateLesson(lesson);
  if (raw === null) return result('empty');
  if (typeof raw !== 'string' || raw.length > MAX_RECORD_LENGTH) return invalid();

  let value: unknown;
  try { value = JSON.parse(raw); } catch { return invalid(); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== FIELDS.length || FIELDS.some(field => !Object.hasOwn(record, field))) return invalid();
  if (record.schemaVersion !== 1) return invalid();
  if (record.lessonId !== lesson.id) return invalid();
  if (typeof record.sourceId !== 'string' || !ID.test(record.sourceId) ||
      typeof record.revision !== 'string' || record.revision.length === 0 || record.revision.length > 128 ||
      typeof record.step !== 'number' || !Number.isInteger(record.step) || record.step < 0 || record.step >= lesson.chapters.length ||
      typeof record.reading !== 'boolean') return invalid();
  if (record.sourceId !== lesson.sourceId || record.revision !== lesson.revision) {
    return result('stale', 'The source has changed. Your old saved place was left unchanged.');
  }
  return result('restored', '', { step: record.step, reading: record.reading });
}

export function readResume(storage: ResumeStorage, lesson: ResumeLesson): ResumeResult {
  validateLesson(lesson);
  const key = resumeKey(lesson.id);
  try { return decodeResume(storage.getItem(key), lesson); }
  catch { return result('unavailable', 'This device could not open your saved place. It was left unchanged.'); }
}

function sameSnapshot(a: ResumeResult, b: ResumeResult): boolean {
  return a.status === b.status && a.state.step === b.state.step && a.state.reading === b.state.reading;
}

export function writeResume(
  storage: ResumeStorage,
  lesson: ResumeLesson,
  state: ResumeState,
  permission: ResumeResult,
): { saved: boolean; message: string } {
  validateLesson(lesson);
  const key = resumeKey(lesson.id);
  if (!state || typeof state !== 'object' || typeof state.step !== 'number' || !Number.isInteger(state.step) ||
      state.step < 0 || state.step >= lesson.chapters.length || typeof state.reading !== 'boolean') {
    return { saved: false, message: 'Your current place is not valid, so nothing was saved.' };
  }
  if (!permission || !permission.canWrite || !['empty', 'restored'].includes(permission.status)) {
    return { saved: false, message: permission?.message || 'Your earlier saved place is protected, so nothing was changed.' };
  }

  let current: ResumeResult;
  try { current = decodeResume(storage.getItem(key), lesson); }
  catch { return { saved: false, message: 'This device could not check your saved place. Nothing was changed.' }; }
  if (!current.canWrite || !sameSnapshot(current, permission)) {
    return { saved: false, message: 'Your saved place changed elsewhere. Nothing was changed; reopen the lesson to see it.' };
  }

  const envelope: Envelope = {
    schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId,
    revision: lesson.revision, step: state.step, reading: state.reading,
  };
  try {
    storage.setItem(key, JSON.stringify(envelope));
    return { saved: true, message: 'Your place was saved on this device.' };
  } catch {
    return { saved: false, message: 'This device could not save your place. Your earlier saved place was left unchanged.' };
  }
}
