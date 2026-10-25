// PUMP LAB session: a typed, deterministic state machine.
//
// State is a pure function of (sessionId, seed, caseId, action log). transition()
// never mutates its input and throws PumpLabError with a stable code on invalid
// input, leaving the caller's state untouched. The wall-clock time `at` is supplied
// by the caller and recorded; nothing in the model reads the clock or Math.random.

import { CASES, CAUSES, PARTS, REPAIRS, SIGNATURES, isCaseId, isCauseId, isPartId, isRepairId, type CaseId, type CauseId, type PartId, type RepairId } from './cases.ts';
import {
  INSTRUMENT, SECTIONS, analyse, checkSection, compareMeasured, flagWords, limitChecks, measure,
  type Flag, type LimitCheck, type Measured, type ReadingDelta, type Section, type SectionCheck,
} from './instruments.ts';
import {
  DOMAIN, HEALTHY, INITIAL_TANKS, MODEL_VERSION, PUMP, PumpLabError, TOTAL_WATER_L,
  assertInRange, evaluateConstraints, operatingPoint, runTransfer,
  type FaultParams, type NoFlowReason, type OperatingPoint, type Tanks,
} from './physics.ts';

export const SESSION_SCHEMA = 'kairo-pump-lab-session/1' as const;
export const RUBRIC_VERSION = 'pump-lab-rubric-1' as const;
export const LOCAL_STATUS = 'local self-directed simulation, unverified' as const;

export const MAX = Object.freeze({ actions: 400, readings: 60, predictions: 60, explanations: 20, evidencePerExplanation: 8, noteChars: 400, idChars: 100 });

export type Settings = { speedRpm: number; valvePct: number };

export type Action =
  | { type: 'set-settings'; speedRpm: number; valvePct: number }
  | { type: 'predict'; flowLps: number }
  | { type: 'run-transfer'; seconds: number }
  | { type: 'take-reading' }
  | { type: 'inspect-section'; readingId: string; section: Section }
  | { type: 'inspect-part'; part: PartId }
  | { type: 'compare'; a: string; b: string }
  | { type: 'show-hint'; level: 1 | 2 | 3 }
  | { type: 'submit-explanation'; cause: CauseId; evidenceIds: string[]; note: string }
  | { type: 'apply-repair'; repair: RepairId }
  | { type: 'complete-case' };

export type Prediction = { id: string; epoch: number; flowLps: number; speedRpm: number; valvePct: number; atClockS: number; readingId: string | null; errorLps: number | null };
export type Reading = {
  id: string;
  seq: number;
  epoch: number;
  clockS: number;
  measured: Measured;
  limits: LimitCheck[];
  predictionId: string | null;
  /** Hidden: whether the underlying model met every limit. Used only to finish a case. */
  meetsAll: boolean;
};
export type Inspection = { id: string; readingId: string; section: Section; check: SectionCheck; clockS: number };
export type Comparison = { id: string; a: string; b: string; deltas: ReadingDelta[]; lines: string[] };
export type Teardown = { part: PartId; epoch: number; text: string; clockS: number; explanationAttemptsBefore: number };
export type HintUse = { level: 1 | 2 | 3; atClockS: number; explanationAttemptsBefore: number };
export type ExplainOutcome = 'supported' | 'right-cause-weak-evidence' | 'wrong-cause';
export type Explanation = {
  id: string;
  cause: CauseId;
  evidenceIds: string[];
  note: string;
  outcome: ExplainOutcome;
  feedback: string[];
  hintLevelAtSubmit: number;
  epoch: number;
};
export type RepairUse = { repair: RepairId; effective: boolean; atClockS: number };
export type RunRecord = { seconds: number; movedL: number; fromClockS: number; stoppedBy: string | null };
export type LogEntry = { seq: number; at: string; kind: 'learner' | 'simulated'; text: string };

export type PumpLabState = {
  schema: typeof SESSION_SCHEMA;
  model: typeof MODEL_VERSION;
  sessionId: string;
  seed: number;
  caseId: CaseId;
  settings: Settings;
  tanks: Tanks;
  fault: FaultParams;
  clockS: number;
  epoch: number;
  predictions: Prediction[];
  readings: Reading[];
  inspections: Inspection[];
  comparisons: Comparison[];
  teardowns: Teardown[];
  hints: HintUse[];
  explanations: Explanation[];
  repairs: RepairUse[];
  runs: RunRecord[];
  completed: { atClockS: number; readingId: string } | null;
  actions: { action: Action; at: string }[];
  log: LogEntry[];
};

const validId = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= MAX.idChars;
export function isIsoTime(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > 40) return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(v);
  if (!m) return false;
  const [, ys, mos, ds, hs, mis, ss] = m;
  const y = Number(ys), mo = Number(mos), d = Number(ds);
  if (mo < 1 || mo > 12 || Number(hs) > 23 || Number(mis) > 59 || Number(ss) > 59) return false;
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d >= 1 && d <= days[mo - 1] && Number.isFinite(Date.parse(v));
}

export function initialState(sessionId: string, seed: number, caseId: CaseId): PumpLabState {
  if (!validId(sessionId)) throw new PumpLabError('bad-session-id', 'Session ID must contain 1–100 nonblank characters.');
  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new PumpLabError('bad-seed', 'Seed must be a whole number from 0 to 4294967295.');
  if (!isCaseId(caseId)) throw new PumpLabError('unknown-case', 'Unknown case.');
  const spec = CASES[caseId];
  return {
    schema: SESSION_SCHEMA,
    model: MODEL_VERSION,
    sessionId,
    seed,
    caseId,
    settings: { ...spec.start },
    tanks: { ...INITIAL_TANKS },
    fault: { ...spec.fault },
    clockS: 0,
    epoch: 0,
    predictions: [],
    readings: [],
    inspections: [],
    comparisons: [],
    teardowns: [],
    hints: [],
    explanations: [],
    repairs: [],
    runs: [],
    completed: null,
    actions: [],
    log: [],
  };
}

/** Back to the exact starting state of the same session, seed and case. */
export function resetRun(state: PumpLabState): PumpLabState {
  return initialState(state.sessionId, state.seed, state.caseId);
}

export function currentOperatingPoint(state: PumpLabState): OperatingPoint {
  return operatingPoint({ ...state.settings, tanks: state.tanks, fault: state.fault });
}

const fmt = (v: number, d = 1): string => v.toFixed(d);
export const statementId = (inspection: Pick<Inspection, 'id'>): string => inspection.id;

export function statementText(inspection: Inspection): string {
  const c = inspection.check;
  const verdict = c.flag === 'unclear' ? 'cannot be judged because the flow is below 4 L/s' : flagWords[c.flag];
  return `${inspection.readingId} · ${c.label}: ${c.quantity} is ${fmt(c.measuredM)} m; the datasheet gives ${fmt(c.expectedM)} m (±${fmt(c.toleranceM)} m). It ${verdict}.`;
}

function hasPredictionInEpoch(state: PumpLabState): boolean {
  return state.predictions.some(p => p.epoch === state.epoch);
}

function nextId(prefix: string, list: readonly unknown[]): string { return `${prefix}${list.length + 1}`; }

function maxSpeedOutcome(state: PumpLabState): { flow: number; text: string } {
  const op = operatingPoint({ speedRpm: DOMAIN.speedRpm.max, valvePct: 100, tanks: state.tanks, fault: state.fault });
  const c = evaluateConstraints(op);
  const broken: string[] = [];
  if (!c.target) broken.push('the flow is still under target');
  if (!c.discharge) broken.push('the discharge pressure is over the pipe limit');
  if (!c.power) broken.push('the motor power is over its rating');
  if (!c.npsh) broken.push('the pump is cavitating');
  const tail = broken.length ? ` and ${broken.join(' and ')}` : ' and every limit is met';
  return { flow: op.flowLps, text: `At ${PUMP.ratedRpm} rpm with the valve fully open this circuit would give ${fmt(op.flowLps)} L/s${tail}.` };
}

function buildFeedback(state: PumpLabState, cause: CauseId, evidenceIds: string[], outcome: ExplainOutcome): string[] {
  const sig = SIGNATURES[cause];
  const chosen = state.inspections.filter(i => evidenceIds.includes(i.id));
  const lines: string[] = [];
  if (outcome === 'supported') {
    lines.push(`Your evidence supports "${CAUSES[cause].label}".`);
    if (cause === 'no-fault') lines.push('Every section you tested matches its datasheet figure, so the limits you hit come from the settings, not a defect.');
    else {
      const pos = chosen.find(i => i.check.section === sig.positive);
      if (pos) lines.push(`Deciding comparison: ${statementText(pos)}`);
      const excluded = chosen.filter(i => i.check.flag === 'as-expected' && i.check.section !== sig.positive);
      if (excluded.length) lines.push(`Ruled out by your own readings: ${excluded.map(i => `${i.check.label} (${i.readingId})`).join(', ')} matched the datasheet.`);
      else lines.push('You could strengthen this by also citing a section that matched its datasheet figure, to show the problem is not there.');
      if (cause === 'strainer-blocked') lines.push('A starved inlet can also make the pump look weak, because it loses head when it cavitates. Telling the two apart needs the suction loss, not the pump head alone.');
    }
    return lines;
  }
  if (outcome === 'right-cause-weak-evidence') {
    lines.push(`"${CAUSES[cause].label}" is a reasonable conclusion, but your selected evidence does not yet show it.`);
    if (cause === 'no-fault') lines.push('Select at least two comparisons that matched the datasheet, taken at 4 L/s or more.');
    else lines.push(`The deciding comparison is on the ${CHECK_LABEL[sig.positive as Section].toLowerCase()}. Take a reading at 4 L/s or more, compare that section against the datasheet, and select it as evidence.`);
    return lines;
  }
  lines.push(`Your readings do not support "${CAUSES[cause].label}".`);
  if (cause === 'speed-too-low') lines.push(`${maxSpeedOutcome(state).text} Turning the speed up alone is not the answer.`);
  else if (cause === 'tank-empty') {
    const op = currentOperatingPoint(state);
    lines.push(`The source tank is at ${fmt(op.sourceLevelM, 2)} m. The pump only loses suction below ${CASES_SUCTION_CUTOFF} m, so this tank is not the problem.`);
  } else if (sig.positive) {
    const seen = state.inspections.filter(i => i.check.section === sig.positive && i.check.flag !== 'unclear');
    if (!seen.length) lines.push(`If this were the cause, the ${CHECK_LABEL[sig.positive].toLowerCase()} would stand out against its datasheet figure. You have not compared that section yet.`);
    else {
      const last = seen[seen.length - 1];
      lines.push(`If this were the cause, the ${CHECK_LABEL[sig.positive].toLowerCase()} would stand out. Your ${last.readingId} comparison says it ${flagWords[last.check.flag]}.`);
    }
  } else lines.push('Look for a section whose pressure loss or gain is far from its datasheet figure.');
  return lines;
}
const CHECK_LABEL: Record<Section, string> = { suction: 'Suction line and strainer', pump: 'Pump', valve: 'Discharge valve' };
const CASES_SUCTION_CUTOFF = '0.15';

function judge(state: PumpLabState, cause: CauseId, evidenceIds: string[]): ExplainOutcome {
  const spec = CASES[state.caseId];
  if (cause !== spec.trueCause) return 'wrong-cause';
  const chosen = state.inspections.filter(i => evidenceIds.includes(i.id));
  if (cause === 'no-fault') {
    const normal = chosen.filter(i => i.check.flag === 'as-expected').length;
    return normal >= 2 ? 'supported' : 'right-cause-weak-evidence';
  }
  const sig = SIGNATURES[cause];
  const flag: Flag | undefined = sig.positive ? sig.flags[sig.positive] : undefined;
  const ok = chosen.some(i => i.check.section === sig.positive && i.check.flag === flag && state.readings.find(r => r.id === i.readingId)?.epoch === 0);
  return ok ? 'supported' : 'right-cause-weak-evidence';
}

function logEntry(state: PumpLabState, at: string, kind: LogEntry['kind'], text: string): void {
  state.log.push({ seq: state.log.length + 1, at, kind, text });
}

const SECTION_NAME: Record<Section, string> = { suction: 'suction line', pump: 'pump', valve: 'discharge valve' };

function comparisonLines(a: Reading, b: Reading, deltas: ReadingDelta[]): string[] {
  const pick = (k: string) => deltas.find(d => d.channel === k)!;
  const f = pick('flowLps');
  const p = pick('dischargeKpa');
  const w = pick('shaftKw');
  const lines = [
    `${a.id} → ${b.id}: flow ${fmt(f.before as number)} → ${fmt(f.after as number)} L/s (${(f.change as number) >= 0 ? '+' : ''}${fmt(f.change as number)}).`,
    `Discharge pressure ${fmt(p.before as number, 0)} → ${fmt(p.after as number, 0)} kPa; motor power ${fmt(w.before as number, 2)} → ${fmt(w.after as number, 2)} kW.`,
  ];
  const sa = analyse(a.measured), sb = analyse(b.measured);
  for (let i = 0; i < SECTIONS.length; i++) {
    if (sa[i].flag !== sb[i].flag) lines.push(`The ${SECTION_NAME[SECTIONS[i]]} went from "${flagWords[sa[i].flag]}" to "${flagWords[sb[i].flag]}".`);
  }
  if (a.measured.crackling !== b.measured.crackling) lines.push(b.measured.crackling ? 'Crackling at the pump started.' : 'Crackling at the pump stopped.');
  return lines;
}

function mustBeOpen(state: PumpLabState): void {
  if (state.completed) throw new PumpLabError('case-complete', 'This case is finished. Reset it to try again.');
}

/** Apply one learner action. Pure: returns a new state or throws PumpLabError. */
export function transition(prev: PumpLabState, action: Action, at: string): PumpLabState {
  if (!isIsoTime(at)) throw new PumpLabError('bad-time', 'A valid ISO time is required.');
  if (!action || typeof action !== 'object' || typeof (action as { type?: unknown }).type !== 'string') throw new PumpLabError('bad-action', 'Unknown action.');
  mustBeOpen(prev);
  if (prev.actions.length >= MAX.actions) throw new PumpLabError('session-full', 'This session has reached its action limit. Export it, then reset.');
  const s: PumpLabState = structuredClone(prev);
  const spec = CASES[s.caseId];
  switch (action.type) {
    case 'set-settings': {
      assertInRange(action.speedRpm, 'speed', DOMAIN.speedRpm.min, DOMAIN.speedRpm.max);
      assertInRange(action.valvePct, 'valve opening', DOMAIN.valvePct.min, DOMAIN.valvePct.max);
      if (!Number.isInteger(action.speedRpm) || !Number.isInteger(action.valvePct)) throw new PumpLabError('not-integer', 'Speed and valve opening must be whole numbers.');
      s.settings = { speedRpm: action.speedRpm, valvePct: action.valvePct };
      logEntry(s, at, 'learner', `Set pump speed to ${action.speedRpm} rpm and valve handle to ${action.valvePct}%.`);
      break;
    }
    case 'predict': {
      assertInRange(action.flowLps, 'predicted flow', DOMAIN.predictLps.min, DOMAIN.predictLps.max);
      if (s.predictions.length >= MAX.predictions) throw new PumpLabError('limit', 'Prediction limit reached.');
      const flow = Math.round(action.flowLps * 10) / 10;
      s.predictions.push({ id: nextId('P', s.predictions), epoch: s.epoch, flowLps: flow, speedRpm: s.settings.speedRpm, valvePct: s.settings.valvePct, atClockS: s.clockS, readingId: null, errorLps: null });
      logEntry(s, at, 'learner', `Predicted ${fmt(flow)} L/s at ${s.settings.speedRpm} rpm and valve ${s.settings.valvePct}%.`);
      break;
    }
    case 'run-transfer': {
      const result = runTransfer({ ...s.settings, tanks: s.tanks, fault: s.fault }, action.seconds);
      s.runs.push({ seconds: action.seconds, movedL: result.movedL, fromClockS: s.clockS, stoppedBy: result.stoppedBy });
      s.tanks = result.tanks;
      s.clockS += action.seconds;
      logEntry(s, at, 'simulated', `Simulated ${action.seconds} s of transfer: ${fmt(result.movedL, 0)} L moved${result.stoppedBy ? ` (${stopText(result.stoppedBy)})` : ''}.`);
      break;
    }
    case 'take-reading': {
      if (!hasPredictionInEpoch(s)) throw new PumpLabError('prediction-required', 'Predict the flow before the first reading.');
      if (s.readings.length >= MAX.readings) throw new PumpLabError('limit', 'Reading limit reached.');
      const op = currentOperatingPoint(s);
      const seq = s.readings.length + 1;
      const measured = measure(op, s.settings.valvePct, s.settings.speedRpm, s.seed, seq);
      const pred = [...s.predictions].reverse().find(p => p.epoch === s.epoch && p.readingId === null && p.speedRpm === s.settings.speedRpm && p.valvePct === s.settings.valvePct) ?? null;
      const reading: Reading = {
        id: `R${seq}`, seq, epoch: s.epoch, clockS: s.clockS, measured, limits: limitChecks(measured),
        predictionId: pred ? pred.id : null, meetsAll: evaluateConstraints(op).all,
      };
      if (pred) { pred.readingId = reading.id; pred.errorLps = Math.round((measured.flowLps - pred.flowLps) * 10) / 10; }
      s.readings.push(reading);
      logEntry(s, at, 'simulated', `Reading ${reading.id}: flow ${fmt(measured.flowLps)} L/s, suction ${measured.suctionKpa} kPa, discharge ${measured.dischargeKpa} kPa, motor ${fmt(measured.shaftKw, 2)} kW${measured.crackling ? ', crackling at the pump' : ''}.${pred ? ` You predicted ${fmt(pred.flowLps)} L/s (off by ${fmt(Math.abs(pred.errorLps!))}).` : ''}`);
      break;
    }
    case 'inspect-section': {
      if (!validId(action.readingId)) throw new PumpLabError('bad-reading', 'Choose a reading.');
      const reading = s.readings.find(r => r.id === action.readingId);
      if (!reading) throw new PumpLabError('unknown-reading', 'That reading does not exist.');
      if (!(SECTIONS as readonly string[]).includes(action.section)) throw new PumpLabError('unknown-section', 'Unknown section.');
      if (s.inspections.some(i => i.readingId === reading.id && i.section === action.section)) throw new PumpLabError('already-inspected', 'You have already compared that section for this reading.');
      const check = checkSection(reading.measured, action.section);
      const insp: Inspection = { id: `${reading.id}.${action.section}`, readingId: reading.id, section: action.section, check, clockS: s.clockS };
      s.inspections.push(insp);
      logEntry(s, at, 'simulated', statementText(insp));
      break;
    }
    case 'inspect-part': {
      if (!isPartId(action.part)) throw new PumpLabError('unknown-part', 'Unknown part.');
      if (s.readings.length === 0 || s.inspections.length === 0) throw new PumpLabError('evidence-first', 'Take a reading and compare a section against the datasheet before opening anything up.');
      if (s.teardowns.some(t => t.part === action.part && t.epoch === s.epoch)) throw new PumpLabError('already-inspected', 'You have already opened that part in this condition.');
      const text = s.epoch > 0 && partFixedBy(action.part, spec.repair) ? cleanText(action.part) : spec.teardown[action.part];
      s.teardowns.push({ part: action.part, epoch: s.epoch, text, clockS: s.clockS, explanationAttemptsBefore: s.explanations.length });
      logEntry(s, at, 'simulated', `Opened the ${PARTS[action.part].label.toLowerCase()}: ${text}`);
      break;
    }
    case 'compare': {
      if (!validId(action.a) || !validId(action.b) || action.a === action.b) throw new PumpLabError('bad-comparison', 'Choose two different readings.');
      const a = s.readings.find(r => r.id === action.a);
      const b = s.readings.find(r => r.id === action.b);
      if (!a || !b) throw new PumpLabError('unknown-reading', 'One of those readings does not exist.');
      if (s.comparisons.some(c => (c.a === a.id && c.b === b.id) || (c.a === b.id && c.b === a.id))) throw new PumpLabError('already-compared', 'You have already compared those readings.');
      const deltas = compareMeasured(a.measured, b.measured);
      const lines = comparisonLines(a, b, deltas);
      s.comparisons.push({ id: nextId('C', s.comparisons), a: a.id, b: b.id, deltas, lines });
      logEntry(s, at, 'simulated', `Compared ${a.id} with ${b.id}. ${lines[0]}`);
      break;
    }
    case 'show-hint': {
      if (action.level !== 1 && action.level !== 2 && action.level !== 3) throw new PumpLabError('bad-hint', 'Hint level must be 1, 2 or 3.');
      if (action.level !== s.hints.length + 1) throw new PumpLabError('hint-order', 'Hints open one step at a time.');
      s.hints.push({ level: action.level, atClockS: s.clockS, explanationAttemptsBefore: s.explanations.length });
      logEntry(s, at, 'learner', `Opened hint ${action.level} of 3${action.level === 3 ? ' (worked comparison)' : ''}.`);
      break;
    }
    case 'submit-explanation': {
      if (!isCauseId(action.cause)) throw new PumpLabError('unknown-cause', 'Unknown cause.');
      if (!Array.isArray(action.evidenceIds) || action.evidenceIds.length > MAX.evidencePerExplanation) throw new PumpLabError('bad-evidence', `Select up to ${MAX.evidencePerExplanation} comparisons.`);
      if (new Set(action.evidenceIds).size !== action.evidenceIds.length) throw new PumpLabError('bad-evidence', 'Each comparison can only be selected once.');
      for (const id of action.evidenceIds) if (!s.inspections.some(i => i.id === id)) throw new PumpLabError('unknown-evidence', 'You can only cite comparisons you have made.');
      if (typeof action.note !== 'string' || action.note.length > MAX.noteChars) throw new PumpLabError('bad-note', `Keep the note to ${MAX.noteChars} characters.`);
      if (s.inspections.length === 0) throw new PumpLabError('no-evidence', 'Take a reading and compare a section against the datasheet first.');
      if (s.epoch > 0) throw new PumpLabError('after-repair', 'Explain before repairing; the repaired circuit no longer shows the fault.');
      if (s.explanations.length >= MAX.explanations) throw new PumpLabError('limit', 'Explanation attempt limit reached.');
      const evidenceIds = [...action.evidenceIds].sort();
      const outcome = judge(s, action.cause, evidenceIds);
      const feedback = buildFeedback(s, action.cause, evidenceIds, outcome);
      s.explanations.push({ id: nextId('E', s.explanations), cause: action.cause, evidenceIds, note: action.note.trim(), outcome, feedback, hintLevelAtSubmit: s.hints.length, epoch: s.epoch });
      logEntry(s, at, 'learner', `Explained: ${CAUSES[action.cause].label} (${outcomeWords[outcome]}).`);
      break;
    }
    case 'apply-repair': {
      if (!isRepairId(action.repair)) throw new PumpLabError('unknown-repair', 'Unknown repair.');
      if (!s.explanations.some(e => e.outcome === 'supported')) throw new PumpLabError('explain-first', 'Explain what the evidence shows before you repair anything.');
      if (s.repairs.some(r => r.effective)) throw new PumpLabError('already-repaired', 'The named fault in this case has already been repaired.');
      const effective = spec.repair === action.repair;
      s.repairs.push({ repair: action.repair, effective, atClockS: s.clockS });
      if (effective) {
        s.fault = { ...HEALTHY };
        s.epoch += 1;
        logEntry(s, at, 'learner', `${REPAIRS[action.repair].label}. ${REPAIRS[action.repair].effect} This is a change to the case state, not real maintenance. Predict the flow again before reading.`);
      } else {
        logEntry(s, at, 'learner', `${REPAIRS[action.repair].label}. Nothing changes in this case: the evidence did not point there.`);
      }
      break;
    }
    case 'complete-case': {
      const latest = [...s.readings].reverse().find(r => r.epoch === s.epoch);
      if (!latest) throw new PumpLabError('reading-required', 'Take a reading with your final settings first.');
      if (spec.repair && s.epoch === 0) throw new PumpLabError('repair-required', 'Repair the fault you found, then confirm the result with a new reading.');
      if (!s.explanations.some(e => e.outcome === 'supported')) throw new PumpLabError('explain-first', 'Explain what the evidence shows before finishing.');
      const compared = s.comparisons.some(c => (c.a === latest.id || c.b === latest.id) && [c.a, c.b].some(id => { const other = s.readings.find(r => r.id === id); return other && other.id !== latest.id && (spec.repair ? other.epoch === 0 : true); }));
      if (!compared) throw new PumpLabError('compare-first', spec.repair ? 'Compare a reading from before the repair with this one.' : 'Compare this reading with an earlier one.');
      if (!latest.meetsAll) {
        const open = latest.limits.filter(l => l.status !== 'met').map(l => l.label.toLowerCase());
        throw new PumpLabError('limits-not-met', `The limits are not all met yet${open.length ? `: ${open.join(', ')}` : ''}. Change the settings, predict, and take a new reading.`);
      }
      s.completed = { atClockS: s.clockS, readingId: latest.id };
      logEntry(s, at, 'learner', `Finished the case on ${latest.id}.`);
      break;
    }
    default:
      throw new PumpLabError('bad-action', 'Unknown action.');
  }
  s.actions.push({ action: structuredClone(action), at });
  return s;
}

const outcomeWords: Record<ExplainOutcome, string> = { supported: 'supported by your evidence', 'right-cause-weak-evidence': 'right idea, evidence not shown yet', 'wrong-cause': 'not supported' };
function stopText(r: NonNullable<RunRecord['stoppedBy']> | NoFlowReason): string {
  const m: Record<string, string> = {
    'speed-below-minimum': 'pump speed below its working range',
    'valve-closed': 'the valve is closed',
    'source-low': 'the source tank is too low for the pump to hold suction',
    'dest-full': 'the destination tank is full',
    'head-below-lift': 'the pump cannot lift water to the destination at this speed',
    'clamp-source': 'the source tank reached its low-level cut-off',
    'clamp-dest': 'the destination tank filled',
  };
  return m[r] ?? r;
}
export { stopText };

function partFixedBy(part: PartId, repair: RepairId | null): boolean {
  return (part === 'strainer' && repair === 'clear-strainer') || (part === 'impeller' && repair === 'replace-impeller') || (part === 'valve-gate' && repair === 'free-valve-gate');
}
function cleanText(part: PartId): string {
  return CASES['baseline-commissioning'].teardown[part];
}

export type Assistance = 'none' | 'hint' | 'worked-example';
export type Assessment = {
  checks: { key: string; label: string; met: boolean }[];
  complete: boolean;
  assistance: Assistance;
  hintLevelsUsed: number;
  directInspectionBeforeSupported: boolean;
  attempts: number;
  firstTrySupported: boolean;
  stepsDone: Record<'predict' | 'measure' | 'isolate' | 'explain' | 'repair' | 'verify' | 'finish', boolean>;
  next: string;
};

export function assess(s: PumpLabState): Assessment {
  const spec = CASES[s.caseId];
  const supportedIdx = s.explanations.findIndex(e => e.outcome === 'supported');
  const hintLevelsUsed = s.hints.length;
  const assistance: Assistance = hintLevelsUsed >= 3 ? 'worked-example' : hintLevelsUsed > 0 ? 'hint' : 'none';
  const informative = s.readings.some(r => r.measured.flowLps >= INSTRUMENT.minInformativeFlowLps);
  const sectionsChecked = new Set(s.inspections.filter(i => i.check.flag !== 'unclear').map(i => i.check.section));
  const repaired = s.repairs.some(r => r.effective);
  const hasPost = s.readings.some(r => r.epoch === s.epoch && s.epoch > 0);
  const stepsDone = {
    predict: s.predictions.some(p => p.epoch === 0),
    measure: s.readings.some(r => r.epoch === 0),
    isolate: s.inspections.length > 0,
    explain: supportedIdx >= 0,
    repair: spec.repair ? repaired : supportedIdx >= 0,
    verify: spec.repair ? hasPost : s.readings.length > 1,
    finish: s.completed !== null,
  };
  const checks = [
    { key: 'predicted-first', label: 'Predicted the flow before the first reading', met: stepsDone.predict && s.readings.length > 0 },
    { key: 'informative-reading', label: 'Took a reading at 4 L/s or more', met: informative },
    { key: 'two-sections', label: 'Compared at least two sections against the datasheet', met: sectionsChecked.size >= 2 },
    { key: 'explained', label: 'Explained the cause with evidence from your own readings', met: supportedIdx >= 0 },
    ...(spec.repair ? [{ key: 'repaired', label: 'Applied the repair that matches the evidence', met: repaired }] : []),
    { key: 'compared', label: spec.repair ? 'Compared a reading before and after the repair' : 'Compared two readings', met: s.comparisons.length > 0 },
    { key: 'limits-met', label: 'Reached the target flow within every limit', met: s.completed !== null },
  ];
  let next: string;
  if (s.completed) next = 'Case finished. Export your observation report.';
  else if (!stepsDone.predict) next = 'Predict the flow for the current settings.';
  else if (!stepsDone.measure) next = 'Take a reading.';
  else if (!informative) next = 'Take a reading with at least 4 L/s of flow so sections can be compared.';
  else if (!stepsDone.isolate) next = 'Compare a section against the datasheet.';
  else if (!stepsDone.explain) next = 'Explain what the evidence shows.';
  else if (spec.repair && !repaired) next = 'Apply the repair that matches your evidence.';
  else if (!s.comparisons.length) next = 'Compare two readings.';
  else next = 'Set the speed and valve, predict, take a reading, and finish when every limit is met.';
  return {
    checks,
    complete: s.completed !== null,
    assistance,
    hintLevelsUsed,
    directInspectionBeforeSupported: s.teardowns.some(t => !s.explanations.slice(0, t.explanationAttemptsBefore).some(e => e.outcome === 'supported')),
    attempts: s.explanations.length,
    firstTrySupported: s.explanations.length > 0 && s.explanations[0].outcome === 'supported',
    stepsDone,
    next,
  };
}

/** Compact, order-stable JSON of the whole session as (meta, actions). Replay rebuilds all derived state. */
export function serialize(s: PumpLabState): string {
  return JSON.stringify({ schema: SESSION_SCHEMA, sessionId: s.sessionId, seed: s.seed, caseId: s.caseId, actions: s.actions.map(a => ({ action: a.action, at: a.at })) });
}

const MAX_SERIALIZED_CHARS = 200_000;
/** Rebuild a session by replaying its actions. Returns null for anything malformed or inconsistent. */
export function restore(text: unknown): PumpLabState | null {
  if (typeof text !== 'string' || text.length > MAX_SERIALIZED_CHARS) return null;
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.schema !== SESSION_SCHEMA || !Array.isArray(r.actions) || r.actions.length > MAX.actions) return null;
  try {
    let state = initialState(r.sessionId as string, r.seed as number, r.caseId as CaseId);
    for (const entry of r.actions) {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as { action: Action; at: string };
      state = transition(state, e.action, e.at);
    }
    return state;
  } catch {
    return null;
  }
}

/** Water conservation check used by tests and the UI status line. */
export function waterBalance(s: PumpLabState): { totalL: number; expectedL: number; errorL: number } {
  const total = s.tanks.sourceL + s.tanks.destL;
  return { totalL: total, expectedL: TOTAL_WATER_L, errorL: total - TOTAL_WATER_L };
}
