// PUMP LAB reading equivalents: everything the scene shows, as text. The reading
// view, the screen-reader live region and the teacher context all use these, so no
// information exists only in the 3D picture or only in colour.

import { CASES } from './cases.ts';
import { assess, currentOperatingPoint, waterBalance, type PumpLabState } from './session.ts';
import { CIRCUIT, LIMITS, LITRES_PER_M, MODEL_STATUS, type OperatingPoint } from './physics.ts';
import { TARGET_BY_ID, stateCues, type TargetId } from './layout.ts';

const f = (v: number, d = 1): string => v.toFixed(d);

export function hasLivePrediction(state: PumpLabState): boolean {
  return state.predictions.some(p => p.epoch === state.epoch);
}

/** Latest reading the learner has taken, or null. Gauges show this, never the hidden live value. */
export function latestReading(state: PumpLabState) {
  return state.readings.length ? state.readings[state.readings.length - 1] : null;
}

export function targetReadout(state: PumpLabState, id: TargetId): string[] {
  const t = TARGET_BY_ID[id];
  const lines = [`${t.label}. ${t.role}`];
  const r = latestReading(state);
  const op = currentOperatingPoint(state);
  const none = 'No reading yet. Predict the flow, then take a reading.';
  switch (id) {
    case 'source-tank': lines.push(`Level ${f(op.sourceLevelM, 2)} m, ${f(state.tanks.sourceL, 0)} L.`); break;
    case 'dest-tank': lines.push(`Level ${f(op.destLevelM, 2)} m, ${f(state.tanks.destL, 0)} L. Its floor is ${CIRCUIT.destBaseM} m above the source tank floor.`); break;
    case 'gauge-suction': lines.push(r ? `Last reading ${r.id}: ${r.measured.suctionKpa} kPa.` : none); break;
    case 'gauge-discharge': lines.push(r ? `Last reading ${r.id}: ${r.measured.dischargeKpa} kPa (limit ${LIMITS.maxDischargeKpa}).` : none); break;
    case 'gauge-post-valve': lines.push(r ? `Last reading ${r.id}: ${r.measured.postValveKpa} kPa.` : none); break;
    case 'flow-meter': lines.push(r ? `Last reading ${r.id}: ${f(r.measured.flowLps)} L/s (target ${LIMITS.targetFlowLps}).` : none); break;
    case 'power-meter': lines.push(r ? `Last reading ${r.id}: ${f(r.measured.shaftKw, 2)} kW (rating ${LIMITS.motorRatedKw}).` : none); break;
    case 'valve': lines.push(`Handle at ${state.settings.valvePct} percent.`); break;
    case 'motor': case 'coupling': case 'shaft-seal': case 'impeller': lines.push(`Pump speed set to ${state.settings.speedRpm} rpm.`); break;
    default: break;
  }
  return lines;
}

export type Summary = { headline: string; lines: string[] };

/** One short block describing the whole circuit as it can honestly be described to the learner. */
export function stateSummary(state: PumpLabState, op: OperatingPoint = currentOperatingPoint(state)): Summary {
  const spec = CASES[state.caseId];
  const live = hasLivePrediction(state);
  const cues = stateCues(op, live).filter(c => c.active);
  const a = assess(state);
  const lines = [
    `Case: ${spec.title}. ${spec.report}`,
    `Settings: pump ${state.settings.speedRpm} rpm, valve handle ${state.settings.valvePct} percent.`,
    `Tanks: source ${f(op.sourceLevelM, 2)} m (${f(state.tanks.sourceL, 0)} L), destination ${f(op.destLevelM, 2)} m (${f(state.tanks.destL, 0)} L). One metre of level is ${LITRES_PER_M} L.`,
    live ? cues.map(c => c.text).join(' ') || 'Nothing is moving.' : 'The pump is idle. Predict the flow to start it.',
    `Time in this case: ${state.clockS} s. Next: ${a.next}`,
  ];
  const wb = waterBalance(state);
  return { headline: `${spec.title} — ${MODEL_STATUS}`, lines: [...lines, `Water check: ${f(wb.totalL, 0)} L in the two tanks together; started with ${f(wb.expectedL, 0)} L.`] };
}

export type TeacherContext = {
  speedRpm: number;
  valvePct: number;
  caseId: string;
  caseTitle: string;
  nextStep: string;
  selectedTarget: string | null;
  selectedLabel: string | null;
  assistance: string;
  readings: number;
  supportedExplanation: boolean;
  finished: boolean;
};

/** What a teacher or guide needs to stay in step with the learner: state only, no hidden fault. */
export function teacherContext(state: PumpLabState, selected: TargetId | null): TeacherContext {
  const a = assess(state);
  return {
    caseId: state.caseId,
    caseTitle: CASES[state.caseId].title,
    speedRpm: state.settings.speedRpm,
    valvePct: state.settings.valvePct,
    nextStep: a.next,
    selectedTarget: selected ? TARGET_BY_ID[selected].qualifiedId : null,
    selectedLabel: selected ? TARGET_BY_ID[selected].label : null,
    assistance: a.assistance,
    readings: state.readings.length,
    supportedExplanation: state.explanations.some(e => e.outcome === 'supported'),
    finished: state.completed !== null,
  };
}
