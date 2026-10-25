import type { HelpExposure, PracticeObservation } from '../adaptive/policy';

const MAX_ID_LENGTH = 120;
const MAX_ATTEMPTS = 100;
const MAX_QUESTIONS = 100;
const LIMITATIONS = [
  'The caller asserts that this attempt batch belongs to the supplied immutable lesson ID; per-attempt source revisions are not stored in the current profile record.',
  'Browser-local attempts and descriptors can be edited by the device owner; mapped observations are not independently verified learner identity or competence.',
  'Help exposure is unknown when the attempt record did not explicitly record it; unknown help cannot count as independent evidence.',
  'Task descriptors and expected answers require real review outside this adapter; the adapter checks supplied metadata but cannot establish that a reviewer actually approved it.',
];

export type ReviewedLessonDescriptor = {
  lessonId: string;
  sourceRevision: string;
  questionCount: number;
  reviewStatus: 'reviewed';
};

export type ReviewedTaskDescriptor = {
  questionIndex: number;
  conceptId: string;
  taskId: string;
  sourceRevision: string;
  taskRevision: string;
  rubricRevision: string;
  contextKey: string;
  optionCount: number;
  expectedChoice: number;
  reviewStatus: 'reviewed';
  reviewerId: string;
  reviewedAt: string;
};

/** Shape currently stored by workspace progress, with optional future provenance fields. */
export type RecordedStudyAttempt = {
  eventId?: string;
  question: number;
  choice?: number;
  correct?: boolean;
  at: string;
  helpExposure?: HelpExposure;
};

export type AdaptiveBridgeInput = {
  /** Caller assertion that these attempts were loaded for this exact lesson snapshot. */
  attemptsLessonId: string;
  lesson: ReviewedLessonDescriptor;
  taskDescriptors: ReviewedTaskDescriptor[];
  attempts: RecordedStudyAttempt[];
};

export type AdaptedPracticeObservation = PracticeObservation & {
  gradeProvenance: 'reviewed-answer-key';
  revisionProvenance: 'caller-asserted-lesson-binding';
};

export type UnassessedAttempt = {
  attemptIndex: number;
  eventId: string;
  questionIndex: number;
  at: string;
  recordedGrade: boolean;
  gradeProvenance: 'device-recorded-unverified';
  helpExposure: HelpExposure;
  reason: string;
};

export type AdapterRejection = {
  attemptIndex: number;
  eventId?: string;
  code: string;
  reason: string;
};

export type AdaptiveBridgeResult = {
  observations: AdaptedPracticeObservation[];
  unassessed: UnassessedAttempt[];
  rejections: AdapterRejection[];
  unassessedCount: number;
  recommendationReady: boolean;
  bindingBasis: 'caller-asserted-lesson-id';
  limitations: string[];
};

type Candidate = { attemptIndex: number; canonical: string; observation: AdaptedPracticeObservation };
type GeneratedRecord = { attemptIndex: number; eventId: string; canonical: string; explicitEventId: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_ID_LENGTH;
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 40) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , , , zoneHourText, zoneMinuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText), second = Number(secondText);
  const offsetHour = zoneHourText === undefined ? 0 : Number(zoneHourText);
  const offsetMinute = zoneMinuteText === undefined ? 0 : Number(zoneMinuteText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1] ||
      hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) return false;
  return Number.isFinite(Date.parse(value));
}

function isHelpExposure(value: unknown): value is HelpExposure {
  return typeof value === 'string' && (value === 'none' || value === 'hint' || value === 'worked-example' || value === 'unknown');
}

function isLessonDescriptor(value: unknown): value is ReviewedLessonDescriptor {
  return isRecord(value) && validId(value.lessonId) && validId(value.sourceRevision) &&
    Number.isInteger(value.questionCount) && Number(value.questionCount) > 0 && Number(value.questionCount) <= MAX_QUESTIONS &&
    value.reviewStatus === 'reviewed';
}

function isTaskDescriptor(value: unknown, lesson: ReviewedLessonDescriptor): value is ReviewedTaskDescriptor {
  return isRecord(value) && Number.isInteger(value.questionIndex) && Number(value.questionIndex) >= 0 && Number(value.questionIndex) < lesson.questionCount &&
    validId(value.conceptId) && validId(value.taskId) && value.sourceRevision === lesson.sourceRevision &&
    validId(value.taskRevision) && validId(value.rubricRevision) && validId(value.contextKey) &&
    Number.isInteger(value.optionCount) && Number(value.optionCount) >= 2 && Number(value.optionCount) <= 100 &&
    Number.isInteger(value.expectedChoice) && Number(value.expectedChoice) >= 0 && Number(value.expectedChoice) < Number(value.optionCount) &&
    value.reviewStatus === 'reviewed' && validId(value.reviewerId) && validTimestamp(value.reviewedAt);
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const char of value) {
    hash ^= BigInt(char.codePointAt(0)!);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}

function newResult(rejections: AdapterRejection[] = [], unassessed: UnassessedAttempt[] = []): AdaptiveBridgeResult {
  return {
    observations: [], unassessed, rejections,
    unassessedCount: unassessed.length + rejections.filter(item => item.attemptIndex >= 0).length,
    recommendationReady: false, bindingBasis: 'caller-asserted-lesson-id', limitations: [...LIMITATIONS],
  };
}

function reject(index: number, code: string, reason: string, eventId?: string): AdapterRejection {
  return { attemptIndex: index, code, reason, ...(validId(eventId) ? { eventId } : {}) };
}

/**
 * Map a batch of workspace quiz attempts to the adaptive policy's schema.
 * No recommendation is eligible unless every attempt has a valid reviewed
 * task descriptor and reviewed-answer grade. The batch/lesson association is
 * an explicit caller assertion because current profile events do not persist
 * per-attempt source revisions.
 */
export function buildAdaptiveObservations(input: unknown): AdaptiveBridgeResult {
  if (!isRecord(input)) return newResult([reject(-1, 'invalid-input', 'Expected a lesson binding, reviewed task descriptors, and recorded attempts.')]);
  const rawAttempts = input.attempts;
  if (!Array.isArray(rawAttempts)) return newResult([reject(-1, 'invalid-attempt-list', 'Recorded attempts must be an array.')]);
  if (rawAttempts.length === 0) return newResult([reject(-1, 'no-attempts', 'There are no recorded attempts to assess.')]);
  if (rawAttempts.length > MAX_ATTEMPTS) return newResult([reject(-1, 'attempt-limit', `At most ${MAX_ATTEMPTS} recorded attempts can be mapped at once.`)]);

  const rejections: AdapterRejection[] = [];
  const unassessed: UnassessedAttempt[] = [];
  const candidates: Candidate[] = [];
  const generatedRecords: GeneratedRecord[] = [];
  const lesson = input.lesson;
  const bindingValid = isLessonDescriptor(lesson) && validId(input.attemptsLessonId) && input.attemptsLessonId === lesson.lessonId;
  const tasksValue = input.taskDescriptors;
  const taskArrayValid = Array.isArray(tasksValue) && tasksValue.length > 0 && tasksValue.length <= MAX_QUESTIONS;
  const descriptorsValid = bindingValid && taskArrayValid && (tasksValue as unknown[]).every(task => isTaskDescriptor(task, lesson as ReviewedLessonDescriptor));
  const questionCounts = new Map<number, number>();
  if (descriptorsValid) {
    for (const task of tasksValue as ReviewedTaskDescriptor[]) questionCounts.set(task.questionIndex, (questionCounts.get(task.questionIndex) ?? 0) + 1);
  }
  const duplicateQuestions = new Set([...questionCounts].filter(([, count]) => count > 1).map(([question]) => question));
  const taskIdQuestions = new Map<string, number[]>();
  if (descriptorsValid) {
    for (const task of tasksValue as ReviewedTaskDescriptor[]) {
      taskIdQuestions.set(task.taskId, [...(taskIdQuestions.get(task.taskId) ?? []), task.questionIndex]);
    }
  }
  const duplicateTaskIds = new Set([...taskIdQuestions].filter(([, questions]) => new Set(questions).size > 1).map(([taskId]) => taskId));
  const taskByQuestion = new Map<number, ReviewedTaskDescriptor>();
  if (descriptorsValid && duplicateQuestions.size === 0 && duplicateTaskIds.size === 0) {
    for (const task of tasksValue as ReviewedTaskDescriptor[]) taskByQuestion.set(task.questionIndex, task);
  }

  if (!bindingValid) rejections.push(reject(-1, 'lesson-binding-invalid', 'The attempt batch must name the same lesson ID as a reviewed descriptor with an explicit source revision.'));
  if (!taskArrayValid) rejections.push(reject(-1, 'task-descriptors-invalid', 'Provide at least one reviewed task descriptor and no more than 100 descriptors.'));
  else if (bindingValid && !descriptorsValid) rejections.push(reject(-1, 'task-descriptors-invalid', 'Every task needs reviewed metadata, a reviewed expected answer, valid revisions, context, reviewer, and review timestamp.'));
  if (duplicateQuestions.size) rejections.push(reject(-1, 'duplicate-question-descriptor', 'Each quiz question must map to exactly one reviewed task descriptor.'));
  if (duplicateTaskIds.size) rejections.push(reject(-1, 'duplicate-task-id', 'A task ID can bind to only one question in this descriptor set; assign distinct IDs to distinct tasks.'));

  const globallyInvalid = !bindingValid || !taskArrayValid || !descriptorsValid || duplicateQuestions.size > 0 || duplicateTaskIds.size > 0;
  const attemptsBindingId = validId(input.attemptsLessonId) ? input.attemptsLessonId : undefined;
  if (globallyInvalid) {
    rawAttempts.forEach((row, index) => {
      const rowId = isRecord(row) ? row.eventId : undefined;
      rejections.push(reject(index, 'batch-not-assessable', 'The lesson or reviewed task descriptor set is invalid; no partial observations are emitted.', validId(rowId) ? rowId : undefined));
    });
    return newResult(rejections);
  }

  let previousAt: number | null = null;
  for (let index = 0; index < rawAttempts.length; index++) {
    const row = rawAttempts[index];
    if (!isRecord(row)) { rejections.push(reject(index, 'attempt-invalid', 'Attempt must be a plain record.')); continue; }
    const questionIndex = row.question;
    if (!Number.isInteger(questionIndex) || Number(questionIndex) < 0 || Number(questionIndex) >= (lesson as ReviewedLessonDescriptor).questionCount) {
      rejections.push(reject(index, 'question-index-invalid', 'Attempt question index is outside the reviewed lesson.')); continue;
    }
    const task = taskByQuestion.get(Number(questionIndex));
    if (!task) { rejections.push(reject(index, 'task-descriptor-missing', 'No reviewed task descriptor matches this attempt question.')); continue; }
    if (!validTimestamp(row.at)) { rejections.push(reject(index, 'timestamp-invalid', 'Attempt timestamp is missing or not a real ISO calendar timestamp.', validId(row.eventId) ? row.eventId : undefined)); continue; }
    const at = Date.parse(row.at);
    if (previousAt !== null && at < previousAt) { rejections.push(reject(index, 'timestamp-out-of-order', 'Attempt timestamps must remain in recorded chronological order.', validId(row.eventId) ? row.eventId : undefined)); continue; }
    previousAt = at;

    const hasChoice = Object.hasOwn(row, 'choice') && row.choice !== undefined;
    const choice = row.choice;
    if (hasChoice && (!Number.isInteger(choice) || Number(choice) < 0 || Number(choice) >= task.optionCount)) {
      rejections.push(reject(index, 'choice-invalid', 'Recorded choice is outside the reviewed task options.', validId(row.eventId) ? row.eventId : undefined)); continue;
    }
    if (Object.hasOwn(row, 'correct') && typeof row.correct !== 'boolean') {
      rejections.push(reject(index, 'stored-grade-invalid', 'Stored correctness must be a boolean when present.', validId(row.eventId) ? row.eventId : undefined)); continue;
    }
    if (Object.hasOwn(row, 'helpExposure') && !isHelpExposure(row.helpExposure)) {
      rejections.push(reject(index, 'help-exposure-invalid', 'Help exposure must be a declared string value when present.', validId(row.eventId) ? row.eventId : undefined)); continue;
    }
    const helpExposure: HelpExposure = row.helpExposure === undefined ? 'unknown' : row.helpExposure as HelpExposure;
    const eventIdValue = row.eventId;
    if (eventIdValue !== undefined && !validId(eventIdValue)) {
      rejections.push(reject(index, 'event-id-invalid', 'Recorded event ID must be a non-empty string of at most 120 characters.')); continue;
    }

    if (!hasChoice) {
      if (typeof row.correct !== 'boolean') {
        rejections.push(reject(index, 'grade-and-choice-missing', 'Attempt has neither a recorded choice nor a device-recorded boolean grade.')); continue;
      }
      const canonical = JSON.stringify([attemptsBindingId, questionIndex, row.at, null, row.correct, helpExposure]);
      const eventId = typeof eventIdValue === 'string' ? eventIdValue : `attempt:${fnv1a64(canonical)}`;
      generatedRecords.push({ attemptIndex: index, eventId, canonical, explicitEventId: typeof eventIdValue === 'string' });
      unassessed.push({
        attemptIndex: index, eventId, questionIndex: Number(questionIndex), at: row.at,
        recordedGrade: row.correct, gradeProvenance: 'device-recorded-unverified', helpExposure,
        reason: 'No recorded answer choice is available to compare with the reviewed answer key; this grade is not emitted as adaptive evidence.',
      });
      continue;
    }

    const derivedCorrect = Number(choice) === task.expectedChoice;
    if (typeof row.correct === 'boolean' && row.correct !== derivedCorrect) {
      rejections.push(reject(index, 'stored-grade-conflict', 'Stored correctness conflicts with the recorded choice and reviewed expected answer.', validId(eventIdValue) ? eventIdValue : undefined)); continue;
    }
    const canonical = JSON.stringify([
      attemptsBindingId, task.conceptId, task.taskId, task.sourceRevision, task.taskRevision, task.rubricRevision,
      task.contextKey, task.optionCount, task.expectedChoice, questionIndex, row.at, choice, derivedCorrect, helpExposure,
    ]);
    const eventId = typeof eventIdValue === 'string' ? eventIdValue : `attempt:${fnv1a64(canonical)}`;
    generatedRecords.push({ attemptIndex: index, eventId, canonical, explicitEventId: typeof eventIdValue === 'string' });
    candidates.push({
      attemptIndex: index, canonical,
      observation: {
        eventId, conceptId: task.conceptId, taskId: task.taskId,
        sourceRevision: task.sourceRevision, taskRevision: task.taskRevision, rubricRevision: task.rubricRevision,
        occurredAt: row.at, correct: derivedCorrect, helpExposure, contextKey: task.contextKey,
        assessmentKind: 'practice', gradeProvenance: 'reviewed-answer-key',
        revisionProvenance: 'caller-asserted-lesson-binding',
      },
    });
  }

  const generatedByCanonical = new Map<string, GeneratedRecord[]>();
  for (const row of generatedRecords.filter(item => !item.explicitEventId)) {
    generatedByCanonical.set(row.canonical, [...(generatedByCanonical.get(row.canonical) ?? []), row]);
  }
  for (const [canonical, matches] of generatedByCanonical) {
    if (matches.length > 1) {
      for (const row of matches) rejections.push(reject(row.attemptIndex, 'duplicate-generated-attempt', 'Identical attempts without recorded event IDs may be duplicate imports; quarantine every matching row instead of counting a retry.', row.eventId));
    }
  }

  const ids = new Map<string, GeneratedRecord[]>();
  for (const row of generatedRecords) ids.set(row.eventId, [...(ids.get(row.eventId) ?? []), row]);
  for (const [eventId, matches] of ids) {
    const exactNoIdDuplicate = matches.length > 1 && matches.every(row => !row.explicitEventId) && new Set(matches.map(row => row.canonical)).size === 1;
    if (matches.length > 1 && !exactNoIdDuplicate) {
      for (const row of matches) rejections.push(reject(row.attemptIndex, 'event-id-collision', 'Event IDs must be unique within a batch; colliding attempts are not emitted.', eventId));
    }
  }

  const collisionIds = new Set([...ids].filter(([, matches]) => matches.length > 1).map(([eventId]) => eventId));
  const ready = rejections.length === 0 && unassessed.length === 0 && candidates.length > 0;
  return {
    observations: ready ? candidates.filter(candidate => !collisionIds.has(candidate.observation.eventId)).map(candidate => candidate.observation) : [],
    unassessed, rejections,
    unassessedCount: unassessed.length + rejections.filter(item => item.attemptIndex >= 0).length,
    recommendationReady: ready, bindingBasis: 'caller-asserted-lesson-id', limitations: [...LIMITATIONS],
  };
}
