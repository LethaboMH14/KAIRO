/**
 * Deterministic, transparent practice sequencing. This module does not estimate
 * ability or mastery; its delay values are configurable product heuristics.
 */
export const ADAPTIVE_POLICY_VERSION = 'kairo-practice-policy-v1' as const;

export type HelpExposure = 'none' | 'hint' | 'worked-example' | 'unknown';
export type AssessmentKind = 'practice' | 'recall' | 'transfer';
export type PracticeAction =
  | 'insufficient-data'
  | 'review-source-worked-example'
  | 'faded-hints-changed-context-independent-task'
  | 'delayed-independent-recall'
  | 'changed-context-transfer';

export type PracticeObservation = {
  eventId: string;
  conceptId: string;
  taskId: string;
  sourceRevision: string;
  taskRevision: string;
  rubricRevision: string;
  occurredAt: string;
  correct: boolean;
  helpExposure: HelpExposure;
  contextKey: string;
  assessmentKind: AssessmentKind;
};

export type LearnerChoice = {
  action: Exclude<PracticeAction, 'insufficient-data'>;
  selectedAt: string;
};

export type RecommendationRequest = {
  conceptId: string;
  revisions: { source: string; task: string; rubric: string };
  now: string;
  /** Minimum gap before a practice success can count as a delayed recall.
   * This is a configurable product heuristic, not a validated interval. */
  minimumRecallDelayMs?: number;
  learnerChoice?: LearnerChoice;
};

export type AttemptView = Pick<PracticeObservation, 'eventId' | 'taskId' | 'occurredAt' | 'correct' | 'helpExposure' | 'contextKey' | 'assessmentKind'>;

export type Recommendation = {
  policyVersion: typeof ADAPTIVE_POLICY_VERSION;
  action: PracticeAction;
  reason: string;
  evidenceIds: string[];
  attempts: AttemptView[];
  firstAttempt: AttemptView | null;
  rejectedEventIds: string[];
  rejectedCount: number;
  ignoredOtherConceptCount: number;
  excludedRevisionCount: number;
  learnerChoice: LearnerChoice | null;
  learnerChoiceRejected: boolean;
  limitations: string[];
};

const DEFAULT_RECALL_DELAY_MS = 24 * 60 * 60 * 1000;
const MAX_DELAY_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 500;
const MAX_ID_LENGTH = 120;
const LIMITATIONS = [
  'This deterministic recommendation is a product heuristic, not an estimate of ability, a diagnosis, or evidence of mastery.',
  'The default recall delay is configurable and is not a scientifically validated schedule for this learner or topic.',
  'A recommendation does not establish that a learner completed an activity or learned from it.',
];

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_ID_LENGTH;
}

function timestamp(value: unknown): number | null {
  if (typeof value !== 'string' || value.length > 40) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, , zone, , zoneHours, zoneMinutes] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(mi), second = Number(s);
  const offsetHour = zoneHours === undefined ? 0 : Number(zoneHours);
  const offsetMinute = zoneMinutes === undefined ? 0 : Number(zoneMinutes);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1] ||
      hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isHelpExposure(value: unknown): value is HelpExposure {
  return typeof value === 'string' && (value === 'none' || value === 'hint' || value === 'worked-example' || value === 'unknown');
}

function isAssessmentKind(value: unknown): value is AssessmentKind {
  return typeof value === 'string' && (value === 'practice' || value === 'recall' || value === 'transfer');
}

function isObservation(value: unknown): value is PracticeObservation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return validId(v.eventId) && validId(v.conceptId) && validId(v.taskId) &&
    validId(v.sourceRevision) && validId(v.taskRevision) && validId(v.rubricRevision) &&
    timestamp(v.occurredAt) !== null && typeof v.correct === 'boolean' &&
    isHelpExposure(v.helpExposure) && validId(v.contextKey) && isAssessmentKind(v.assessmentKind);
}

function matchesRevisions(value: PracticeObservation, request: RecommendationRequest): boolean {
  return value.sourceRevision === request.revisions.source &&
    value.taskRevision === request.revisions.task &&
    value.rubricRevision === request.revisions.rubric;
}

function attemptView(value: PracticeObservation): AttemptView {
  return {
    eventId: value.eventId, taskId: value.taskId, occurredAt: value.occurredAt,
    correct: value.correct, helpExposure: value.helpExposure,
    contextKey: value.contextKey, assessmentKind: value.assessmentKind,
  };
}

function validChoice(choice: unknown, nowMs: number): choice is LearnerChoice {
  if (!choice || typeof choice !== 'object' || Array.isArray(choice)) return false;
  const c = choice as Record<string, unknown>;
  const selectedAt = timestamp(c.selectedAt);
  return typeof c.action === 'string' && ['review-source-worked-example', 'faded-hints-changed-context-independent-task', 'delayed-independent-recall', 'changed-context-transfer'].includes(c.action) &&
    selectedAt !== null && selectedAt <= nowMs;
}

/**
 * Recommend one next action from observations for exactly one concept and one
 * source/task/rubric revision tuple. Malformed, future, duplicate-ID, or
 * out-of-order observations are reported and cannot contribute to promotion.
 */
export function recommendPractice(input: unknown, request: RecommendationRequest): Recommendation {
  const nowMs = timestamp(request?.now);
  const requestValid = validId(request?.conceptId) &&
    validId(request?.revisions?.source) && validId(request?.revisions?.task) && validId(request?.revisions?.rubric) &&
    nowMs !== null;
  const requestedDelay = request?.minimumRecallDelayMs;
  const delayValid = requestedDelay === undefined || Number.isSafeInteger(requestedDelay) && requestedDelay >= 0 && requestedDelay <= MAX_DELAY_MS;
  const safeNow = nowMs ?? 0;
  const learnerChoice = validChoice(request?.learnerChoice, safeNow) ? request.learnerChoice : null;
  const learnerChoiceRejected = request?.learnerChoice !== undefined && learnerChoice === null;
  const rejectedEventIds: string[] = [];
  const attempts: PracticeObservation[] = [];
  let ignoredOtherConceptCount = 0;
  let excludedRevisionCount = 0;
  let rejectedCount = requestValid && delayValid ? 0 : 1;

  const fail = (eventId?: string) => {
    rejectedCount++;
    if (eventId && validId(eventId)) rejectedEventIds.push(eventId);
  };

  if (!Array.isArray(input)) {
    fail();
  } else if (input.length > MAX_EVENTS) {
    rejectedCount += input.length - MAX_EVENTS;
    for (const row of input.slice(0, MAX_EVENTS)) {
      const eventId = row && typeof row === 'object' ? (row as Record<string, unknown>).eventId : undefined;
      fail(validId(eventId) ? eventId : undefined);
    }
  } else {
    const seen = new Set<string>();
    let previousAt: number | null = null;
    for (const row of input) {
      const maybe = row && typeof row === 'object' && !Array.isArray(row) ? row as Record<string, unknown> : null;
      const eventId = maybe?.eventId;
      if (!isObservation(row)) {
        const otherConcept = validId(maybe?.conceptId) && requestValid && maybe?.conceptId !== request.conceptId;
        if (otherConcept) { ignoredOtherConceptCount++; continue; }
        fail(validId(eventId) ? eventId : undefined);
        continue;
      }
      if (!requestValid) { fail(row.eventId); continue; }
      if (row.conceptId !== request.conceptId) { ignoredOtherConceptCount++; continue; }
      if (!matchesRevisions(row, request)) { excludedRevisionCount++; continue; }
      const at = timestamp(row.occurredAt)!;
      if (at > nowMs! || seen.has(row.eventId) || previousAt !== null && at < previousAt) {
        fail(row.eventId);
        continue;
      }
      seen.add(row.eventId);
      previousAt = at;
      attempts.push(row);
    }
  }

  const visibleAttempts = attempts.map(attemptView);
  const firstAttempt = visibleAttempts[0] ?? null;
  let action: PracticeAction = 'insufficient-data';
  let reason = 'There is not enough valid evidence for this concept and revision to suggest a next practice step.';
  const hasRelevantRejection = rejectedCount > 0;
  const minimumDelay = delayValid ? requestedDelay ?? DEFAULT_RECALL_DELAY_MS : DEFAULT_RECALL_DELAY_MS;
  const last = attempts.at(-1);

  if (!requestValid) {
    reason = 'The request is incomplete or has an invalid current time; no observation can be used.';
  } else if (!delayValid) {
    reason = 'The configured recall delay is invalid; no observation can be promoted.';
  } else if (hasRelevantRejection) {
    reason = `Some input was rejected (${rejectedCount} record${rejectedCount === 1 ? '' : 's'}); the policy will not promote the remaining partial history.`;
  } else if (!last) {
    reason = excludedRevisionCount > 0
      ? 'No observations match the current source, task, and rubric revisions; earlier versions were kept separate.'
      : 'No valid observations match this concept and revision yet.';
  } else if (!last.correct) {
    action = 'review-source-worked-example';
    reason = 'The most recent observed attempt was incorrect; review the cited source or a worked example before retrying.';
  } else if (last.helpExposure !== 'none') {
    action = 'faded-hints-changed-context-independent-task';
    reason = last.helpExposure === 'unknown'
      ? 'Help exposure is unknown, so this success cannot count as independent; try a changed-context task without hints.'
      : 'The most recent success used help; fade support and try a changed-context task independently.';
  } else if (last.assessmentKind === 'recall') {
    const priorIndependent = [...attempts.slice(0, -1)].reverse().find(row => row.correct && row.helpExposure === 'none' && row.assessmentKind !== 'transfer');
    const priorAt = priorIndependent ? timestamp(priorIndependent.occurredAt)! : null;
    const lastAt = timestamp(last.occurredAt)!;
    const distinctTask = priorIndependent && last.taskId !== priorIndependent.taskId;
    if (!priorIndependent || !distinctTask || priorAt === null || lastAt - priorAt < minimumDelay) {
      action = 'delayed-independent-recall';
      reason = 'This independent recall does not meet the configured delay and distinct-task checks; schedule a later recall as a product heuristic.';
    } else {
      action = 'changed-context-transfer';
      reason = 'A later independent recall succeeded on a different task; the next suggested step is independent transfer in a changed context.';
    }
  } else {
    action = 'delayed-independent-recall';
    reason = 'An independent success was observed; offer a later recall. The default delay is configurable and heuristic.';
  }

  return {
    policyVersion: ADAPTIVE_POLICY_VERSION, action, reason,
    evidenceIds: attempts.map(row => row.eventId), attempts: visibleAttempts, firstAttempt,
    rejectedEventIds, rejectedCount, ignoredOtherConceptCount, excludedRevisionCount,
    learnerChoice, learnerChoiceRejected,
    limitations: [...LIMITATIONS],
  };
}
