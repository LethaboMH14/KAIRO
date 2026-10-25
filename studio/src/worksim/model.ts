/**
 * A deterministic, fictional service-operations reconciliation exercise.
 * This model has no UI, clock, network, persistence, or AI side effects.
 */
export const WORKSIM_VERSION = 'service-queue-reconciliation-v1' as const;
export const WORKSIM_STATUS = 'local self-directed simulation, unverified' as const;

export type Revision = 'shift-close-v1' | 'morning-cutoff-v2';
export type Phase = 'inspect' | 'clean-v1' | 'report-v1' | 'clean-v2' | 'report-v2' | 'reflect' | 'complete';
export type AssistanceExposure = 'none' | 'hint' | 'worked-example' | 'unknown';
export type Disposition = 'retain' | 'exclude' | 'quarantine';
export type CleaningReason =
  | 'latest-for-ticket' | 'superseded-duplicate' | 'missing-timestamp'
  | 'eligible-latest' | 'reopened-latest' | 'after-cutoff'
  | 'unverified' | 'missing-resolution-code';

export type SourceRow = {
  sourceRowId: string;
  ticketId: string;
  status: 'resolved' | 'reopened';
  updatedAt: string | null;
  resolutionCode: string | null;
  customerVerified: boolean | null;
  source: string;
};

const rows: readonly SourceRow[] = Object.freeze(([ 
  { sourceRowId: 'ROW-101', ticketId: 'TKT-210', status: 'resolved', updatedAt: '2026-10-22T10:05:00+02:00', resolutionCode: 'FIX', customerVerified: true, source: 'fabricated queue export, line 101' },
  { sourceRowId: 'ROW-102', ticketId: 'TKT-210', status: 'resolved', updatedAt: '2026-10-22T10:10:00+02:00', resolutionCode: 'FIX', customerVerified: true, source: 'fabricated queue export, line 102' },
  { sourceRowId: 'ROW-103', ticketId: 'TKT-211', status: 'resolved', updatedAt: '2026-10-22T10:30:00+02:00', resolutionCode: null, customerVerified: true, source: 'fabricated queue export, line 103' },
  { sourceRowId: 'ROW-104', ticketId: 'TKT-212', status: 'resolved', updatedAt: '2026-10-22T10:45:00+02:00', resolutionCode: 'RESET', customerVerified: null, source: 'fabricated queue export, line 104' },
  { sourceRowId: 'ROW-105', ticketId: 'TKT-213', status: 'resolved', updatedAt: '2026-10-22T10:55:00+02:00', resolutionCode: 'FIX', customerVerified: true, source: 'fabricated queue export, line 105' },
  { sourceRowId: 'ROW-106', ticketId: 'TKT-213', status: 'reopened', updatedAt: '2026-10-22T11:20:00+02:00', resolutionCode: 'FIX', customerVerified: false, source: 'fabricated queue export, line 106' },
  { sourceRowId: 'ROW-107', ticketId: 'TKT-214', status: 'resolved', updatedAt: '2026-10-22T11:15:00+02:00', resolutionCode: 'FIX', customerVerified: true, source: 'fabricated queue export, line 107' },
  { sourceRowId: 'ROW-108', ticketId: 'TKT-215', status: 'resolved', updatedAt: null, resolutionCode: 'FIX', customerVerified: true, source: 'fabricated queue export, line 108' },
  { sourceRowId: 'ROW-109', ticketId: 'TKT-216', status: 'resolved', updatedAt: '2026-10-22T10:50:00+02:00', resolutionCode: 'FIX', customerVerified: true, source: 'fabricated queue export, line 109' },
] as SourceRow[]).map(row => Object.freeze(row)));

export const scenario = Object.freeze({
  version: WORKSIM_VERSION,
  title: 'Asterline Support Services: reconcile the service queue',
  organization: 'Asterline Support Services (fictional)',
  brief: 'You are preparing a shift-close queue summary from a fabricated service-ticket export. Inspect the source rows, resolve duplicate ticket IDs and missing values using the stated rules, then report the result. After your first report, the simulated manager sends a changed requirement; prepare a fresh report under that rule.',
  provenance: 'Every organization, identifier, timestamp, status, record, and message in this exercise is invented for KAIRO. The fixture is not bank, employer, or customer data and does not imply employer endorsement.',
  dictionary: Object.freeze({
    sourceRowId: 'Synthetic source-line ID; each input line has a distinct ID.',
    ticketId: 'Synthetic service ticket key. Repeated keys are candidate duplicates.',
    status: 'Status recorded on that source row. The latest timestamped row determines current status.',
    updatedAt: 'Local Johannesburg (+02:00) timestamp of the row update. Missing timestamps cannot establish row order and must be quarantined.',
    resolutionCode: 'Recorded resolution category. Blank means missing; do not infer a code.',
    customerVerified: 'true/false when a customer verification value was recorded; null means unknown, not false.',
    source: 'Fabricated source provenance label for this row.',
  }),
  records: rows,
  requirements: Object.freeze({
    first: Object.freeze({
      revision: 'shift-close-v1' as const,
      title: 'Shift-close current-state report',
      text: 'For each ticket, keep the row with the latest valid update timestamp. Exclude older duplicate rows. If a ticket has no timestamped row, quarantine it as unknown. Count unique tickets (including unknown tickets), current resolved tickets, current reopened tickets, unknown current states, duplicate source rows removed, and missing resolution codes, customer-verification values, and timestamps among the one current row per ticket.',
      outcomeFields: ['uniqueTickets', 'resolvedCurrent', 'reopenedCurrent', 'unknownCurrent', 'duplicateRows', 'missingResolutionCodes', 'missingCustomerVerification', 'missingTimestamps'] as const,
    }),
    changed: Object.freeze({
      revision: 'morning-cutoff-v2' as const,
      title: 'Changed requirement: morning eligibility report',
      role: 'Simulated manager',
      message: 'Requirement changed: use each ticket’s latest valid row first. For the morning report, count a ticket only when that current row is resolved, customer-verified, has a nonblank resolution code, and its last-update time is strictly before 11:00 Johannesburg time. Report one mutually exclusive outcome per ticket: eligible, after cutoff, unverified or unknown verification, missing resolution code, reopened, or unknown timestamp. Do not treat this as an as-of-11:00 snapshot or an SLA-compliance result.',
      cutoff: '2026-10-22T11:00:00+02:00',
      order: 'Select latest row per ticket first; apply eligibility filters second.',
      disqualifierPrecedence: ['unknown timestamp', 'reopened', 'after cutoff', 'unverified or unknown verification', 'missing resolution code', 'eligible'] as const,
      outcomeFields: ['eligibleResolved', 'excludedAfterCutoff', 'excludedUnverified', 'excludedMissingResolutionCode', 'reopened', 'unknownTimestamp', 'duplicateRows'] as const,
    }),
  }),
  rubric: Object.freeze([
    'Inspect all nine source rows before cleaning.',
    'Assign every source row a disposition and reason; retain the latest timestamped row per ticket, exclude superseded duplicates, and quarantine missing timestamps.',
    'Report every required field for revision v1 and v2; values must be bounded nonnegative integers computed from the fixture.',
    'Apply v2 after latest-row selection with the published mutually exclusive precedence. Submit fresh cleaning decisions and a fresh v2 report.',
    'Keep failed attempts and the reflection. Assistance remains unknown unless the learner explicitly records an exposure value.',
  ]),
  roleMessages: Object.freeze([
    Object.freeze({ role: 'Simulated manager', text: 'Please prepare the shift-close current-state summary using the published cleaning rules.' }),
    Object.freeze({ role: 'Simulated manager', text: 'Requirement changed: use the latest valid row first, then apply the morning eligibility filters stated above.' }),
  ]),
});

export type RowDecision = { sourceRowId: string; disposition: Disposition; reason: CleaningReason };
export type ReportValues = Record<string, number>;
export type OutcomeField = typeof scenario.requirements.first.outcomeFields[number] | typeof scenario.requirements.changed.outcomeFields[number];
export type FirstOutcome = Record<typeof scenario.requirements.first.outcomeFields[number], number>;
export type ChangedOutcome = Record<typeof scenario.requirements.changed.outcomeFields[number], number>;
export type WorkSimAction =
  | { type: 'inspect-row'; sourceRowId: string }
  | { type: 'submit-cleaning'; revision: Revision; decisions: RowDecision[] }
  | { type: 'submit-report'; revision: Revision; values: ReportValues }
  | { type: 'set-assistance'; exposure: AssistanceExposure }
  | { type: 'reflect'; value: string };

export type WorkSimEvent = {
  kind: WorkSimAction['type'];
  value: string;
  correct?: boolean;
  at: string;
  assistanceExposure: AssistanceExposure;
};
export type WorkSimState = {
  runId: string;
  phase: Phase;
  inspectedRowIds: string[];
  events: WorkSimEvent[];
  assistanceExposure: AssistanceExposure;
  reflection: string;
  completedAt: string | null;
  feedback: string;
};

const MAX_EVENTS = 200;
const MAX_RUN_ID = 100;
const MAX_REFLECTION = 1000;
const rowById = new Map(rows.map(row => [row.sourceRowId, row]));
const firstFields = scenario.requirements.first.outcomeFields;
const changedFields = scenario.requirements.changed.outcomeFields;
function validIso(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 40) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, ys, mos, ds, hs, mis, ss] = match;
  const year = Number(ys), month = Number(mos), day = Number(ds), hour = Number(hs), minute = Number(mis), second = Number(ss);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (day < 1 || day > daysInMonth) return false;
  if (match[8] !== 'Z') {
    const offset = /[+-](\d{2}):(\d{2})$/.exec(match[8]);
    if (!offset || Number(offset[1]) > 23 || Number(offset[2]) > 59) return false;
  }
  return true;
}
const validId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_RUN_ID;

export function initialState(runId: string): WorkSimState {
  if (!validId(runId)) throw new Error('Run ID must contain 1–100 nonblank characters.');
  return { runId, phase: 'inspect', inspectedRowIds: [], events: [], assistanceExposure: 'unknown', reflection: '', completedAt: null, feedback: 'Inspect each source row before making cleaning decisions.' };
}

function latestRows(): Map<string, SourceRow | null> {
  const groups = new Map<string, SourceRow[]>();
  for (const row of rows) groups.set(row.ticketId, [...(groups.get(row.ticketId) ?? []), row]);
  const latest = new Map<string, SourceRow | null>();
  for (const [ticketId, candidates] of groups) {
    const dated = candidates.filter(row => row.updatedAt !== null).sort((a, b) => Date.parse(a.updatedAt!) - Date.parse(b.updatedAt!));
    latest.set(ticketId, dated.at(-1) ?? null);
  }
  return latest;
}

function canonicalDecisions(revision: Revision): RowDecision[] {
  const latest = latestRows();
  const byRow = new Map<string, RowDecision>();
  for (const row of rows) {
    const winner = latest.get(row.ticketId) ?? null;
    if (!winner) {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'quarantine', reason: 'missing-timestamp' });
    } else if (winner.sourceRowId !== row.sourceRowId) {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'exclude', reason: 'superseded-duplicate' });
    } else if (revision === 'shift-close-v1') {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'retain', reason: 'latest-for-ticket' });
    } else if (row.status === 'reopened') {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'exclude', reason: 'reopened-latest' });
    } else if (!row.updatedAt) {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'quarantine', reason: 'missing-timestamp' });
    } else if (Date.parse(row.updatedAt) >= Date.parse(scenario.requirements.changed.cutoff)) {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'exclude', reason: 'after-cutoff' });
    } else if (row.customerVerified !== true) {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'exclude', reason: 'unverified' });
    } else if (!row.resolutionCode?.trim()) {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'exclude', reason: 'missing-resolution-code' });
    } else {
      byRow.set(row.sourceRowId, { sourceRowId: row.sourceRowId, disposition: 'retain', reason: 'eligible-latest' });
    }
  }
  return rows.map(row => byRow.get(row.sourceRowId)!);
}

function canonicalReport(revision: 'shift-close-v1'): FirstOutcome;
function canonicalReport(revision: 'morning-cutoff-v2'): ChangedOutcome;
function canonicalReport(revision: Revision): FirstOutcome | ChangedOutcome;
function canonicalReport(revision: Revision): FirstOutcome | ChangedOutcome {
  const latest = [...latestRows().values()];
  const current = latest.filter((row): row is SourceRow => row !== null);
  // Every ticket ID is one unique ticket even when it has no timestamped row;
  // quarantine does not turn that ticket into an extra duplicate.
  const duplicateRows = rows.length - latest.length;
  if (revision === 'shift-close-v1') {
    const unknownCurrent = latest.filter(row => row === null).length;
    return {
      uniqueTickets: latest.length,
      resolvedCurrent: current.filter(row => row.status === 'resolved').length,
      reopenedCurrent: current.filter(row => row.status === 'reopened').length,
      unknownCurrent,
      duplicateRows,
      missingResolutionCodes: current.filter(row => !row.resolutionCode?.trim()).length,
      missingCustomerVerification: current.filter(row => row.customerVerified === null).length,
      missingTimestamps: latest.filter(row => row === null || row.updatedAt === null).length,
    };
  }
  const outcomes = { eligibleResolved: 0, excludedAfterCutoff: 0, excludedUnverified: 0, excludedMissingResolutionCode: 0, reopened: 0, unknownTimestamp: 0, duplicateRows };
  for (const row of latest) {
    if (!row || !row.updatedAt) outcomes.unknownTimestamp++;
    else if (row.status === 'reopened') outcomes.reopened++;
    else if (Date.parse(row.updatedAt) >= Date.parse(scenario.requirements.changed.cutoff)) outcomes.excludedAfterCutoff++;
    else if (row.customerVerified !== true) outcomes.excludedUnverified++;
    else if (!row.resolutionCode?.trim()) outcomes.excludedMissingResolutionCode++;
    else outcomes.eligibleResolved++;
  }
  return outcomes;
}

function validDecisions(value: unknown, revision: Revision): value is RowDecision[] {
  if (!Array.isArray(value) || value.length !== rows.length) return false;
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const d = item as Record<string, unknown>;
    if (typeof d.sourceRowId !== 'string' || !rowById.has(d.sourceRowId) || ids.has(d.sourceRowId) ||
      typeof d.disposition !== 'string' || !['retain', 'exclude', 'quarantine'].includes(d.disposition) ||
      typeof d.reason !== 'string' || !['latest-for-ticket', 'superseded-duplicate', 'missing-timestamp', 'eligible-latest', 'reopened-latest', 'after-cutoff', 'unverified', 'missing-resolution-code'].includes(d.reason)) return false;
    const reason = d.reason as CleaningReason;
    const allowed = revision === 'shift-close-v1'
      ? ['latest-for-ticket', 'superseded-duplicate', 'missing-timestamp']
      : ['eligible-latest', 'superseded-duplicate', 'missing-timestamp', 'reopened-latest', 'after-cutoff', 'unverified', 'missing-resolution-code'];
    if (!allowed.includes(reason)) return false;
    ids.add(d.sourceRowId);
  }
  return ids.size === rows.length;
}

function validReport(value: unknown, revision: Revision): value is ReportValues {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const fields = revision === 'shift-close-v1' ? firstFields : changedFields;
  return Object.keys(obj).length === fields.length && fields.every(field => Number.isSafeInteger(obj[field]) && Number.isFinite(obj[field]) && (obj[field] as number) >= 0 && (obj[field] as number) <= rows.length);
}

function matchesDecisions(value: RowDecision[], revision: Revision): boolean {
  const expected = new Map(canonicalDecisions(revision).map(item => [item.sourceRowId, item]));
  return value.every(item => {
    const want = expected.get(item.sourceRowId);
    return want?.disposition === item.disposition && want.reason === item.reason;
  });
}
function matchesReport(value: ReportValues, revision: Revision): boolean {
  const expected = canonicalReport(revision) as Record<string, number>;
  return Object.keys(expected).every(key => value[key] === expected[key]);
}

function actionValue(action: WorkSimAction): string | null {
  try {
    const value = JSON.stringify(action);
    return typeof value === 'string' && value.length <= 10000 ? value : null;
  } catch { return null; }
}
function lastEventTime(state: WorkSimState): number | null {
  const last = state.events.at(-1);
  return last ? Date.parse(last.at) : null;
}

export function transition(state: WorkSimState, action: WorkSimAction, at: string): WorkSimState {
  if (!state || typeof state !== 'object' || !action || typeof action !== 'object' || !validIso(at) || !Array.isArray(state.events) || state.events.length >= MAX_EVENTS) return state;
  const serializedAction = actionValue(action);
  if (!serializedAction) return { ...state, feedback: 'Action is malformed or exceeds the input size limit.' };
  const millis = Date.parse(at);
  const previous = lastEventTime(state);
  if (previous !== null && millis < previous) return { ...state, feedback: 'Action time cannot move earlier than the previous recorded event.' };
  const record = (correct?: boolean, exposure = state.assistanceExposure): WorkSimEvent => ({ kind: action.type, value: serializedAction, ...(correct === undefined ? {} : { correct }), at, assistanceExposure: exposure });
  const add = (next: Omit<WorkSimState, 'events'>, correct?: boolean, exposure = state.assistanceExposure): WorkSimState => ({ ...next, events: [...state.events, record(correct, exposure)] });

  if (state.phase === 'complete') return state;
  if (action.type === 'set-assistance') {
    if (!['none', 'hint', 'worked-example', 'unknown'].includes(action.exposure)) return state;
    return add({ ...state, assistanceExposure: action.exposure, feedback: `Assistance exposure recorded as ${action.exposure}.` }, undefined, action.exposure);
  }
  if (action.type === 'inspect-row' && state.phase === 'inspect') {
    if (!rowById.has(action.sourceRowId) || state.inspectedRowIds.includes(action.sourceRowId)) return state;
    const inspectedRowIds = [...state.inspectedRowIds, action.sourceRowId];
    const complete = inspectedRowIds.length === rows.length;
    return add({ ...state, inspectedRowIds, phase: complete ? 'clean-v1' : 'inspect', feedback: complete ? 'All source rows inspected. Submit one disposition and reason for each row under v1.' : `Inspected ${action.sourceRowId}; inspect every source row before cleaning.` });
  }
  if (action.type === 'submit-cleaning') {
    const isV1 = action.revision === 'shift-close-v1' && state.phase === 'clean-v1';
    const isV2 = action.revision === 'morning-cutoff-v2' && state.phase === 'clean-v2';
    if (!isV1 && !isV2) return state;
    if (!validDecisions(action.decisions, action.revision)) return { ...state, feedback: 'Submit exactly one valid disposition and reason for each of the nine source rows.' };
    const correct = matchesDecisions(action.decisions, action.revision);
    const nextPhase: Phase = correct ? (isV1 ? 'report-v1' : 'report-v2') : state.phase;
    return add({ ...state, phase: nextPhase, feedback: correct ? 'Cleaning decisions match the published rule. Submit the report fields for this revision.' : 'At least one row decision conflicts with the published rule. Review duplicates, timestamps, and the revision rule, then retry.' }, correct);
  }
  if (action.type === 'submit-report') {
    const isV1 = action.revision === 'shift-close-v1' && state.phase === 'report-v1';
    const isV2 = action.revision === 'morning-cutoff-v2' && state.phase === 'report-v2';
    if (!isV1 && !isV2) return state;
    if (!validReport(action.values, action.revision)) return { ...state, feedback: 'Provide every required report field as a nonnegative whole number within the fixture bounds.' };
    const correct = matchesReport(action.values, action.revision);
    const nextPhase: Phase = correct ? (isV1 ? 'clean-v2' : 'reflect') : state.phase;
    const feedback = correct
      ? isV1 ? 'V1 report accepted. The simulated manager has changed the requirement; make fresh v2 cleaning decisions and report values.' : 'V2 report accepted. Add a short reflection to complete this simulation.'
      : 'One or more report values do not match the cleaned fixture under this revision. Retry; your attempt remains recorded.';
    return add({ ...state, phase: nextPhase, feedback }, correct);
  }
  if (action.type === 'reflect' && state.phase === 'reflect') {
    if (typeof action.value !== 'string' || action.value.trim().length < 30 || action.value.length > MAX_REFLECTION) return { ...state, feedback: 'Add a reflection of 30–1,000 characters.' };
    return add({ ...state, phase: 'complete', reflection: action.value.trim(), completedAt: at, feedback: 'Simulation complete. Your decisions, retries, assistance setting, and reflection are included in the local record.' });
  }
  return state;
}

export type RubricCheck = { key: string; attempts: number; firstTry: boolean; latestMet: boolean };
export type Assessment = { phase: Phase; checks: RubricCheck[]; complete: boolean; assistanceExposure: AssistanceExposure; reportedAssistance: ('hint' | 'worked-example')[]; unknownAssistanceAttempts: number };
function assistanceSummary(events: WorkSimEvent[]) {
  const scored = events.filter(event => event.kind === 'submit-cleaning' || event.kind === 'submit-report');
  const exposures = scored.map(event => event.assistanceExposure);
  const reportedAssistance = [...new Set(exposures.filter((value): value is 'hint' | 'worked-example' => value === 'hint' || value === 'worked-example'))];
  const assistanceExposure: AssistanceExposure = exposures.includes('unknown') ? 'unknown' : exposures.includes('worked-example') ? 'worked-example' : exposures.includes('hint') ? 'hint' : exposures.length ? 'none' : 'unknown';
  return { assistanceExposure, reportedAssistance, unknownAssistanceAttempts: exposures.filter(value => value === 'unknown').length };
}
export function assess(state: WorkSimState): Assessment {
  const checks = [
    ['clean-v1', 'submit-cleaning', 'shift-close-v1'], ['report-v1', 'submit-report', 'shift-close-v1'],
    ['clean-v2', 'submit-cleaning', 'morning-cutoff-v2'], ['report-v2', 'submit-report', 'morning-cutoff-v2'],
  ] as const;
  return {
    phase: state.phase,
    checks: checks.map(([key, kind, revision]) => {
      const attempts = state.events.filter(event => {
        if (event.kind !== kind) return false;
        try { return (JSON.parse(event.value) as { revision?: string }).revision === revision; } catch { return false; }
      });
      return { key, attempts: attempts.length, firstTry: attempts[0]?.correct === true, latestMet: attempts.at(-1)?.correct === true };
    }),
    complete: state.phase === 'complete',
    ...assistanceSummary(state.events),
  };
}

export type WorkSimExport = {
  artifactVersion: 'worksim-artifact-v1';
  status: typeof WORKSIM_STATUS;
  source: 'local self-directed simulation';
  scenarioVersion: typeof WORKSIM_VERSION;
  runId: string;
  title: string;
  completedAt: string;
  assistanceExposure: AssistanceExposure;
  reportedAssistance: ('hint' | 'worked-example')[];
  unknownAssistanceAttempts: number;
  rubric: RubricCheck[];
  attempts: WorkSimEvent[];
  reflection: string;
  limitations: string[];
};

function parseAction(event: WorkSimEvent): WorkSimAction | null {
  try {
    const parsed: unknown = JSON.parse(event.value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || (parsed as Record<string, unknown>).type !== event.kind) return null;
    const action = parsed as WorkSimAction;
    return ['inspect-row', 'submit-cleaning', 'submit-report', 'set-assistance', 'reflect'].includes(action.type) ? action : null;
  } catch { return null; }
}

function replay(state: WorkSimState): WorkSimState | null {
  if (!state || typeof state !== 'object' || !validId(state.runId) || !Array.isArray(state.events) || state.events.length > MAX_EVENTS ||
    !Array.isArray(state.inspectedRowIds) || !['none', 'hint', 'worked-example', 'unknown'].includes(state.assistanceExposure) ||
    typeof state.reflection !== 'string' || state.reflection.length > MAX_REFLECTION || !validIso(state.completedAt) || state.phase !== 'complete') return null;
  let current = initialState(state.runId);
  for (const event of state.events) {
    if (!event || typeof event !== 'object' || !validIso(event.at) || typeof event.value !== 'string' || event.value.length > 10000 ||
      event.correct !== undefined && typeof event.correct !== 'boolean' || !['none', 'hint', 'worked-example', 'unknown'].includes(event.assistanceExposure)) return null;
    const action = parseAction(event);
    if (!action) return null;
    const next = transition(current, action, event.at);
    const emitted = next.events.at(-1);
    if (next.events.length !== current.events.length + 1 || !emitted || emitted.kind !== event.kind || emitted.value !== event.value || emitted.at !== event.at || emitted.correct !== event.correct || emitted.assistanceExposure !== event.assistanceExposure) return null;
    current = next;
  }
  return current.phase === state.phase && current.completedAt === state.completedAt && current.reflection === state.reflection &&
    current.assistanceExposure === state.assistanceExposure && current.inspectedRowIds.length === state.inspectedRowIds.length &&
    current.inspectedRowIds.every((id, i) => id === state.inspectedRowIds[i]) ? current : null;
}

export function exportRun(input: unknown): WorkSimExport | null {
  const state = replay(input as WorkSimState);
  if (!state) return null;
  const rubric = assess(state).checks;
  if (!rubric.every(check => check.latestMet)) return null;
  return {
    artifactVersion: 'worksim-artifact-v1', status: WORKSIM_STATUS,
    source: 'local self-directed simulation', scenarioVersion: WORKSIM_VERSION,
    runId: state.runId, title: scenario.title, completedAt: state.completedAt!,
    ...assistanceSummary(state.events), rubric, attempts: state.events.map(event => ({ ...event })),
    reflection: state.reflection,
    limitations: [
      'This is a local self-directed simulation, unverified; browser-local records and timestamps can be edited.',
      `Assistance is learner-reported per event, not independently observed. Overall scored-attempt exposure is ${assistanceSummary(state.events).assistanceExposure}; ${assistanceSummary(state.events).unknownAssistanceAttempts} scored attempt(s) have unknown exposure. Reported support is retained even if a later setting changes.`,
      'Rubric checks replay authored scenario rules; they do not establish independently verified employment competence, workplace performance, or accreditation.',
      'All organization, records, roles, and messages are synthetic and do not represent a real employer, bank, customer, or live AI teammate.',
    ],
  };
}

// Export computed fixture outcomes for transparent authoring and review. These
// values are derived from the canonical rows and rules, never accepted as input.
export function acceptedOutcomes(): { first: FirstOutcome; changed: ChangedOutcome } {
  return { first: canonicalReport('shift-close-v1'), changed: canonicalReport('morning-cutoff-v2') };
}
