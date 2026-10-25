/**
 * Versioned, minimized practice-attempt event contract. This module validates
 * structure only; it does not infer mastery, predict ability, or persist data.
 */
export const LEARNER_PATTERN_EVENT_SCHEMA_VERSION = 1 as const;

export type PatternHelpExposure = 'none' | 'hint' | 'worked-example' | 'unknown';
export type PatternAssessmentKind = 'practice' | 'recall' | 'transfer';

export type LearnerPatternEvent = {
  schemaVersion: typeof LEARNER_PATTERN_EVENT_SCHEMA_VERSION;
  eventId: string;
  lessonId: string;
  sourceRevision: string;
  conceptId: string;
  taskId: string;
  taskRevision: string;
  rubricRevision: string;
  occurredAt: string;
  correct: boolean;
  helpExposure: PatternHelpExposure;
  contextKey: string;
  assessmentKind: PatternAssessmentKind;
};

export type EventValidation =
  | { ok: true; event: LearnerPatternEvent }
  | { ok: false; errors: string[] };

const FIELDS = [
  'schemaVersion', 'eventId', 'lessonId', 'sourceRevision', 'conceptId',
  'taskId', 'taskRevision', 'rubricRevision', 'occurredAt', 'correct',
  'helpExposure', 'contextKey', 'assessmentKind',
] as const;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;
const UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;
const HELP_VALUES = new Set<PatternHelpExposure>(['none', 'hint', 'worked-example', 'unknown']);
const ASSESSMENT_VALUES = new Set<PatternAssessmentKind>(['practice', 'recall', 'transfer']);

function validTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 32) return false;
  const match = UTC_TIMESTAMP.exec(value);
  if (!match) return false;
  const [, y, mo, d, h, mi, s] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(mi), second = Number(s);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1] ||
      hour > 23 || minute > 59 || second > 59) return false;
  return Number.isFinite(Date.parse(value));
}

function validOpaqueId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() === value && OPAQUE_ID.test(value);
}

/** Reject unknown fields so raw answers, names, and profile data cannot be
 * smuggled through the event shape. Successful output is a new allowlisted
 * object; caller input is never mutated or returned by reference. */
export function validateLearnerPatternEvent(value: unknown): EventValidation {
  const errors: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['event must be an object'] };
  }
  const input = value as Record<string, unknown>;
  const allowed = new Set<string>(FIELDS);
  for (const key of Object.keys(input)) if (!allowed.has(key)) errors.push(`unexpected field: ${key}`);
  for (const field of FIELDS) if (!Object.hasOwn(input, field)) errors.push(`missing field: ${field}`);
  if (input.schemaVersion !== LEARNER_PATTERN_EVENT_SCHEMA_VERSION) errors.push('schemaVersion must be 1');
  for (const field of ['eventId', 'lessonId', 'sourceRevision', 'conceptId', 'taskId', 'taskRevision', 'rubricRevision', 'contextKey']) {
    if (!validOpaqueId(input[field])) errors.push(`${field} must be a bounded opaque identifier`);
  }
  if (!validTimestamp(input.occurredAt)) errors.push('occurredAt must be a valid UTC ISO timestamp');
  if (typeof input.correct !== 'boolean') errors.push('correct must be boolean');
  if (typeof input.helpExposure !== 'string' || !HELP_VALUES.has(input.helpExposure as PatternHelpExposure)) errors.push('helpExposure is invalid');
  if (typeof input.assessmentKind !== 'string' || !ASSESSMENT_VALUES.has(input.assessmentKind as PatternAssessmentKind)) errors.push('assessmentKind is invalid');
  if (errors.length) return { ok: false, errors };

  const event = Object.fromEntries(FIELDS.map((field) => [field, input[field]])) as LearnerPatternEvent;
  return { ok: true, event };
}

export type EventBatchValidation =
  | { ok: true; events: LearnerPatternEvent[] }
  | { ok: false; errors: string[] };

const MAX_BATCH_EVENTS = 500;

/** Bounded batch validator with duplicate event-ID detection. */
export function validateLearnerPatternEvents(value: unknown): EventBatchValidation {
  if (!Array.isArray(value)) return { ok: false, errors: ['events must be an array'] };
  if (value.length > MAX_BATCH_EVENTS) return { ok: false, errors: [`events exceeds ${MAX_BATCH_EVENTS}`] };
  const events: LearnerPatternEvent[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const [index, raw] of value.entries()) {
    const result = validateLearnerPatternEvent(raw);
    if (!result.ok) {
      errors.push(`event ${index}: ${result.errors.join('; ')}`);
      continue;
    }
    if (seen.has(result.event.eventId)) errors.push(`event ${index}: duplicate eventId`);
    else {
      seen.add(result.event.eventId);
      events.push(result.event);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, events };
}
