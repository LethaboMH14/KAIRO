// PUMP LAB instruments: what the learner can read, with bounded deterministic noise,
// and the derived "against expected" comparisons they can make from those readings.
// Nothing here reads the hidden fault: analysis uses only measured values and the
// published datasheet (healthy pump curve, valve table, clean-strainer allowance).

import {
  CIRCUIT, KPA_PER_M, LIMITS, NPSH_ATM_HEAD_M, PUMP, npshRequired, pumpCurveHead, valveK,
  type OperatingPoint,
} from './physics.ts';

export const SECTIONS = ['suction', 'pump', 'valve'] as const;
export type Section = (typeof SECTIONS)[number];

export const INSTRUMENT = Object.freeze({
  /** Noise is uniform within +/- these amounts, then the display rounds. */
  flowRelNoise: 0.015,
  pressureNoiseKpa: 2.0,
  powerNoiseKw: 0.03,
  flowStep: 0.1,
  pressureStep: 1,
  powerStep: 0.01,
  levelStep: 0.01,
  /** Below this measured flow the sections cannot be told apart from noise. */
  minInformativeFlowLps: 4,
});

export type Measured = {
  flowLps: number;
  suctionKpa: number;
  dischargeKpa: number;
  postValveKpa: number;
  shaftKw: number;
  speedRpm: number;
  valveHandlePct: number;
  sourceLevelM: number;
  destLevelM: number;
  /** Audible crackling at the pump: only present while the pump is cavitating. */
  crackling: boolean;
};

/** Stateless noise: a pure function of (seed, reading number, channel). Range [-1, 1). */
export function noiseUnit(seed: number, seq: number, channel: number): number {
  let t = (seed ^ Math.imul(seq + 1, 0x9e3779b1) ^ Math.imul(channel + 1, 0x85ebca6b)) >>> 0;
  t = (t + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
}

const roundTo = (v: number, step: number): number => {
  const r = Math.round(v / step) * step;
  const digits = step >= 1 ? 0 : Math.round(-Math.log10(step));
  return Number((Object.is(r, -0) ? 0 : r).toFixed(digits));
};

export function measure(op: OperatingPoint, handlePct: number, speedRpm: number, seed: number, seq: number): Measured {
  const I = INSTRUMENT;
  const flow = op.flowLps > 0 ? op.flowLps * (1 + I.flowRelNoise * noiseUnit(seed, seq, 0)) : 0;
  const pressure = (kpaTrue: number, ch: number) => roundTo(kpaTrue + I.pressureNoiseKpa * noiseUnit(seed, seq, ch), I.pressureStep);
  return {
    flowLps: roundTo(Math.max(0, flow), I.flowStep),
    suctionKpa: pressure(op.suctionKpa, 1),
    dischargeKpa: pressure(op.dischargeKpa, 2),
    postValveKpa: pressure(op.postValveKpa, 3),
    shaftKw: roundTo(Math.max(0, op.shaftKw + I.powerNoiseKw * noiseUnit(seed, seq, 4)), I.powerStep),
    speedRpm,
    valveHandlePct: handlePct,
    sourceLevelM: roundTo(op.sourceLevelM, I.levelStep),
    destLevelM: roundTo(op.destLevelM, I.levelStep),
    crackling: op.cavitating,
  };
}

export type Flag = 'as-expected' | 'higher' | 'lower' | 'unclear';
export type SectionCheck = {
  section: Section;
  label: string;
  quantity: string;
  measuredM: number;
  expectedM: number;
  toleranceM: number;
  deviationM: number;
  flag: Flag;
  /** Why the flag is unclear, when it is. */
  reason?: 'flow-too-low';
};

const PRESSURE_ERR_M = (INSTRUMENT.pressureNoiseKpa + INSTRUMENT.pressureStep / 2) / KPA_PER_M;
const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Worst-case flow error, L/s, used only to widen tolerances honestly. */
const flowErr = (q: number): number => INSTRUMENT.flowRelNoise * q + INSTRUMENT.flowStep;

export function checkSection(m: Measured, section: Section): SectionCheck {
  const q = m.flowLps;
  const dq = flowErr(q);
  let measured: number;
  let expected: number;
  let tol: number;
  let label: string;
  let quantity: string;
  if (section === 'suction') {
    measured = m.sourceLevelM - m.suctionKpa / KPA_PER_M;
    expected = CIRCUIT.kIn * q * q;
    tol = PRESSURE_ERR_M + INSTRUMENT.levelStep / 2 + 2 * CIRCUIT.kIn * q * dq + 0.05;
    label = 'Suction line and strainer';
    quantity = 'pressure lost before the pump';
  } else if (section === 'pump') {
    measured = (m.dischargeKpa - m.suctionKpa) / KPA_PER_M;
    expected = pumpCurveHead(m.speedRpm, q, 1);
    tol = 2 * PRESSURE_ERR_M + 2 * PUMP.c * q * dq + 0.05;
    label = 'Pump';
    quantity = 'pressure the pump adds';
  } else {
    measured = (m.dischargeKpa - m.postValveKpa) / KPA_PER_M;
    expected = m.valveHandlePct > 0 ? valveK(m.valveHandlePct) * q * q : 0;
    tol = 2 * PRESSURE_ERR_M + (m.valveHandlePct > 0 ? 2 * valveK(m.valveHandlePct) * q * dq : 0) + 0.05;
    label = 'Discharge valve';
    quantity = 'pressure lost across the valve';
  }
  const deviation = measured - expected;
  const base = { section, label, quantity, measuredM: r2(measured), expectedM: r2(expected), toleranceM: r2(tol), deviationM: r2(deviation) };
  if (q < INSTRUMENT.minInformativeFlowLps) return { ...base, flag: 'unclear', reason: 'flow-too-low' };
  let flag: Flag = 'as-expected';
  if (deviation > tol) flag = 'higher';
  else if (deviation < -tol) flag = 'lower';
  return { ...base, flag };
}

export function analyse(m: Measured): SectionCheck[] {
  return SECTIONS.map(s => checkSection(m, s));
}

export type ReadingDelta = { channel: keyof Measured; label: string; before: number | boolean; after: number | boolean; change: number | null };
const CHANNELS: { key: keyof Measured; label: string; unit: string }[] = [
  { key: 'flowLps', label: 'Flow', unit: 'L/s' },
  { key: 'suctionKpa', label: 'Suction pressure', unit: 'kPa' },
  { key: 'dischargeKpa', label: 'Discharge pressure', unit: 'kPa' },
  { key: 'postValveKpa', label: 'Pressure after valve', unit: 'kPa' },
  { key: 'shaftKw', label: 'Motor shaft power', unit: 'kW' },
  { key: 'speedRpm', label: 'Pump speed', unit: 'rpm' },
  { key: 'valveHandlePct', label: 'Valve handle', unit: '%' },
  { key: 'crackling', label: 'Crackling at pump', unit: '' },
];
export const CHANNEL_INFO = CHANNELS;

export function compareMeasured(a: Measured, b: Measured): ReadingDelta[] {
  return CHANNELS.map(({ key, label }) => {
    const before = a[key];
    const after = b[key];
    return { channel: key, label, before, after, change: typeof before === 'number' && typeof after === 'number' ? r2(after - before) : null };
  });
}

export const flagWords: Record<Flag, string> = {
  'as-expected': 'is as expected',
  higher: 'is higher than expected',
  lower: 'is lower than expected',
  unclear: 'cannot be judged yet',
};

export type LimitKey = 'flow' | 'discharge' | 'power' | 'npsh';
export type LimitStatus = 'met' | 'not-met' | 'close';
export type LimitCheck = {
  key: LimitKey;
  label: string;
  value: number;
  limit: number;
  unit: string;
  /** "close" means the value is within instrument error of the limit, so the reading cannot settle it. */
  status: LimitStatus;
};

const NPSH_BAND_M = 0.4;

/** Suction head the learner can work out from the gauge: atmosphere minus vapour pressure, plus gauge pressure. */
export const npshAvailableEstimate = (m: Measured): number => NPSH_ATM_HEAD_M + m.suctionKpa / KPA_PER_M;

function judge(value: number, limit: number, band: number, higherIsBetter: boolean): LimitStatus {
  const margin = higherIsBetter ? value - limit : limit - value;
  if (Math.abs(margin) <= band) return 'close';
  return margin > 0 ? 'met' : 'not-met';
}

export function limitChecks(m: Measured): LimitCheck[] {
  const npshMargin = npshAvailableEstimate(m) - npshRequired(m.speedRpm, m.flowLps);
  return [
    { key: 'flow', label: 'Flow reaches the target', value: m.flowLps, limit: LIMITS.targetFlowLps, unit: 'L/s', status: judge(m.flowLps, LIMITS.targetFlowLps, flowErr(m.flowLps), true) },
    { key: 'discharge', label: 'Discharge pressure under the pipe limit', value: m.dischargeKpa, limit: LIMITS.maxDischargeKpa, unit: 'kPa', status: judge(m.dischargeKpa, LIMITS.maxDischargeKpa, INSTRUMENT.pressureNoiseKpa + INSTRUMENT.pressureStep / 2, false) },
    { key: 'power', label: 'Motor power under its rating', value: m.shaftKw, limit: LIMITS.motorRatedKw, unit: 'kW', status: judge(m.shaftKw, LIMITS.motorRatedKw, INSTRUMENT.powerNoiseKw + INSTRUMENT.powerStep / 2, false) },
    { key: 'npsh', label: 'Suction margin above what the pump needs', value: Math.round(npshMargin * 100) / 100, limit: LIMITS.minNpshMarginM, unit: 'm', status: m.flowLps === 0 ? 'met' : judge(npshMargin, LIMITS.minNpshMarginM, NPSH_BAND_M, true) },
  ];
}
