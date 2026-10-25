// PUMP LAB: educational pump-and-system model. Pure functions, no I/O, no randomness.
//
// STATUS: illustrative. The coefficients below were chosen so the behaviour is
// teachable and the numbers are tidy; they are NOT measured from, or validated
// against, any real pump. Read docs/pump-lab/MODEL.md before relying on a value.
//
// Units: flow L/s, head m of water, pressure kPa (gauge) unless a name says
// otherwise, power kW, speed rpm, level m, volume L (1 m of level = 3000 L).

export const MODEL_VERSION = 'kairo-pump-lab-model/1' as const;
export const MODEL_STATUS = 'illustrative teaching model, not validated against a real pump' as const;

export const CONST = Object.freeze({
  g: 9.80665, // m/s2, standard gravity (exact by definition)
  rho: 1000, // kg/m3, water, rounded for the lab (about 998 at 20 C)
  pAtmKpa: 101.325, // kPa absolute, standard atmosphere (exact by definition)
  pVapKpa: 2.339, // kPa absolute, water vapour pressure near 20 C (rounded table value)
});

/** kPa of pressure per metre of water head. */
export const KPA_PER_M = (CONST.rho * CONST.g) / 1000;

export const PUMP = Object.freeze({
  ratedRpm: 1450, // 4-pole induction motor on 50 Hz mains, about 3 percent slip
  syncRpm: 1500,
  minRpm: 600,
  /** Shut-off head at rated speed, m. */
  h0: 22,
  /** Pump curve droop, m per (L/s)^2: H = n^2*h0 - c*Q^2 (exact under the affinity laws). */
  c: 0.06,
  /** Shaft power, kW: P = n^3*(p0 + p1*(Q/n)). */
  p0: 1.1,
  p1: 0.1064,
  /** Required NPSH, m: n^2*(a + b*(Q/n)^2). */
  npshA: 2.0,
  npshB: 0.012,
  /** Head lost per metre of NPSH shortfall once the pump cavitates, floor 0.5. */
  breakdownPerM: 0.12,
  breakdownFloor: 0.5,
});

export const CIRCUIT = Object.freeze({
  kPipe: 0.02, // m per (L/s)^2, delivery pipe, fittings
  kIn: 0.002, // m per (L/s)^2, clean strainer and suction pipe
  kValve0: 0.01, // m per (L/s)^2 at fully open; K = kValve0 / x^2
  tankAreaM2: 3,
  tankWallM: 3, // water depth the tank can hold
  destBaseM: 3, // dest tank floor above source tank floor; delivery enters at the floor
  minSuctionLevelM: 0.15, // below this the pump loses suction (vortexing / dry run)
  initialSourceM: 2.5,
  initialDestM: 0.5,
});

export const LITRES_PER_M = CIRCUIT.tankAreaM2 * 1000;
export const TANK_CAPACITY_L = CIRCUIT.tankWallM * LITRES_PER_M;
export const TOTAL_WATER_L = (CIRCUIT.initialSourceM + CIRCUIT.initialDestM) * LITRES_PER_M;

export const LIMITS = Object.freeze({
  targetFlowLps: 12,
  maxDischargeKpa: 200,
  minNpshMarginM: 0.5,
  motorRatedKw: 2.2,
});

export const DOMAIN = Object.freeze({
  speedRpm: { min: PUMP.minRpm, max: PUMP.ratedRpm },
  valvePct: { min: 0, max: 100 },
  runSeconds: { min: 1, max: 600 },
  predictLps: { min: 0, max: 30 },
});

export type FaultParams = {
  /** Largest valve opening, percent, that the gate can actually reach. 100 = no fault. */
  valveStuckMaxPct: number;
  /** Suction loss coefficient, m per (L/s)^2. */
  suctionK: number;
  /** Fraction of shut-off head the impeller still delivers. 1 = new. */
  impellerHeadFactor: number;
};
export const HEALTHY: Readonly<FaultParams> = Object.freeze({ valveStuckMaxPct: 100, suctionK: CIRCUIT.kIn, impellerHeadFactor: 1 });

export type Tanks = { sourceL: number; destL: number };
export const INITIAL_TANKS: Readonly<Tanks> = Object.freeze({ sourceL: CIRCUIT.initialSourceM * LITRES_PER_M, destL: CIRCUIT.initialDestM * LITRES_PER_M });

export type Condition = { speedRpm: number; valvePct: number; tanks: Tanks; fault: FaultParams };

export type NoFlowReason = 'speed-below-minimum' | 'valve-closed' | 'source-low' | 'dest-full' | 'head-below-lift';

export type OperatingPoint = {
  flowLps: number;
  noFlowReason: NoFlowReason | null;
  speedRatio: number;
  valveActualPct: number;
  sourceLevelM: number;
  destLevelM: number;
  staticLiftM: number;
  /** Head the pump actually adds, after any cavitation breakdown. */
  pumpHeadM: number;
  /** Head the healthy pump would add at the same speed and flow (the datasheet curve). */
  pumpCurveHeadM: number;
  breakdownFactor: number;
  suctionHeadM: number;
  dischargeHeadM: number;
  postValveHeadM: number;
  suctionLossM: number;
  valveLossM: number;
  npshAvailableM: number;
  npshRequiredM: number;
  npshMarginM: number;
  cavitating: boolean;
  hydraulicKw: number;
  shaftKw: number;
  efficiency: number;
  suctionKpa: number;
  dischargeKpa: number;
  postValveKpa: number;
  shaftTorqueNm: number;
};

export function levels(tanks: Tanks): { sourceM: number; destM: number } {
  return { sourceM: tanks.sourceL / LITRES_PER_M, destM: tanks.destL / LITRES_PER_M };
}

export const speedRatio = (rpm: number): number => rpm / PUMP.ratedRpm;
export const valveK = (openingPct: number): number => {
  const x = openingPct / 100;
  return CIRCUIT.kValve0 / (x * x);
};
export const kpa = (headM: number): number => headM * KPA_PER_M;

/** Datasheet pump curve: head added by a healthy pump, m. Affinity laws give n^2*h0 - c*Q^2. */
export function pumpCurveHead(speedRpm: number, flowLps: number, impellerHeadFactor = 1): number {
  const n = speedRatio(speedRpm);
  return n * n * PUMP.h0 * impellerHeadFactor - PUMP.c * flowLps * flowLps;
}
export function npshRequired(speedRpm: number, flowLps: number): number {
  const n = speedRatio(speedRpm);
  if (n <= 0) return 0;
  const q = flowLps / n;
  return n * n * (PUMP.npshA + PUMP.npshB * q * q);
}
export function shaftPowerKw(speedRpm: number, flowLps: number): number {
  const n = speedRatio(speedRpm);
  if (n <= 0) return 0;
  return n * n * n * (PUMP.p0 + PUMP.p1 * (flowLps / n));
}
export const NPSH_ATM_HEAD_M = ((CONST.pAtmKpa - CONST.pVapKpa) * 1000) / (CONST.rho * CONST.g);

export class PumpLabError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PumpLabError';
    this.code = code;
  }
}

export function assertFiniteNumber(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new PumpLabError('not-finite', `${name} must be a finite number.`);
}
export function assertInRange(value: unknown, name: string, min: number, max: number): asserts value is number {
  assertFiniteNumber(value, name);
  if (value < min || value > max) throw new PumpLabError('out-of-range', `${name} must be between ${min} and ${max}.`);
}
export function validateFault(fault: FaultParams): void {
  assertInRange(fault.valveStuckMaxPct, 'valve limit', 0, 100);
  assertInRange(fault.suctionK, 'suction loss', 0, 1);
  assertInRange(fault.impellerHeadFactor, 'impeller factor', 0.1, 1);
}
export function validateTanks(tanks: Tanks): void {
  assertInRange(tanks.sourceL, 'source volume', 0, TANK_CAPACITY_L);
  assertInRange(tanks.destL, 'destination volume', 0, TANK_CAPACITY_L);
}
export function validateCondition(c: Condition): void {
  assertInRange(c.speedRpm, 'speed', 0, DOMAIN.speedRpm.max);
  assertInRange(c.valvePct, 'valve opening', DOMAIN.valvePct.min, DOMAIN.valvePct.max);
  validateTanks(c.tanks);
  validateFault(c.fault);
}

function flowResidual(q: number, n: number, valveActualPct: number, staticLift: number, hSource: number, fault: FaultParams): number {
  const sumK = fault.suctionK + CIRCUIT.kPipe + valveK(valveActualPct);
  const margin = NPSH_ATM_HEAD_M + hSource - fault.suctionK * q * q - npshRequired(n * PUMP.ratedRpm, q);
  const phi = breakdown(margin);
  const pumpHead = (n * n * PUMP.h0 * fault.impellerHeadFactor - PUMP.c * q * q) * phi;
  return pumpHead - staticLift - sumK * q * q;
}
function breakdown(marginM: number): number {
  return marginM >= 0 ? 1 : Math.max(PUMP.breakdownFloor, 1 - PUMP.breakdownPerM * -marginM);
}

/**
 * Steady operating point at one instant: the flow where the pump curve (after
 * any cavitation breakdown) meets the system curve. The residual is strictly
 * decreasing in Q, so a fixed-iteration bisection finds a unique root and is
 * deterministic.
 */
export function operatingPoint(condition: Condition): OperatingPoint {
  validateCondition(condition);
  const { speedRpm, valvePct, tanks, fault } = condition;
  const { sourceM, destM } = levels(tanks);
  const n = speedRatio(speedRpm);
  const valveActualPct = Math.min(valvePct, fault.valveStuckMaxPct);
  const staticLift = CIRCUIT.destBaseM + destM - sourceM;

  let flow = 0;
  let reason: NoFlowReason | null = null;
  if (speedRpm < DOMAIN.speedRpm.min) reason = 'speed-below-minimum';
  else if (valveActualPct <= 0) reason = 'valve-closed';
  else if (sourceM < CIRCUIT.minSuctionLevelM) reason = 'source-low';
  else if (destM >= CIRCUIT.tankWallM) reason = 'dest-full';
  else if (flowResidual(0, n, valveActualPct, staticLift, sourceM, fault) <= 0) reason = 'head-below-lift';
  else {
    let lo = 0;
    let hi = Math.sqrt((n * n * PUMP.h0 * fault.impellerHeadFactor) / PUMP.c);
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (flowResidual(mid, n, valveActualPct, staticLift, sourceM, fault) > 0) lo = mid;
      else hi = mid;
    }
    flow = (lo + hi) / 2;
  }

  const q2 = flow * flow;
  const suctionLoss = fault.suctionK * q2;
  const suctionHead = sourceM - suctionLoss;
  const npshA = NPSH_ATM_HEAD_M + suctionHead;
  const npshR = npshRequired(speedRpm, flow);
  const margin = npshA - npshR;
  const phi = breakdown(margin);
  const curveHead = pumpCurveHead(speedRpm, flow, 1);
  const pumpHead = (n * n * PUMP.h0 * fault.impellerHeadFactor - PUMP.c * q2) * phi;
  const dischargeHead = suctionHead + pumpHead;
  const valveLoss = valveActualPct > 0 ? valveK(valveActualPct) * q2 : 0;
  const hydraulicKw = (CONST.g * flow * pumpHead) / 1000; // rho*g*(Q/1000)*H W -> kW with rho=1000
  const shaftKw = shaftPowerKw(speedRpm, flow);
  const omega = (speedRpm * 2 * Math.PI) / 60;
  return {
    flowLps: flow,
    noFlowReason: reason,
    speedRatio: n,
    valveActualPct,
    sourceLevelM: sourceM,
    destLevelM: destM,
    staticLiftM: staticLift,
    pumpHeadM: pumpHead,
    pumpCurveHeadM: curveHead,
    breakdownFactor: phi,
    suctionHeadM: suctionHead,
    dischargeHeadM: dischargeHead,
    postValveHeadM: dischargeHead - valveLoss,
    suctionLossM: suctionLoss,
    valveLossM: valveLoss,
    npshAvailableM: npshA,
    npshRequiredM: npshR,
    npshMarginM: margin,
    cavitating: flow > 0 && margin < 0,
    hydraulicKw,
    shaftKw,
    efficiency: shaftKw > 0 ? hydraulicKw / shaftKw : 0,
    suctionKpa: kpa(suctionHead),
    dischargeKpa: kpa(dischargeHead),
    postValveKpa: kpa(dischargeHead - valveLoss),
    shaftTorqueNm: omega > 0 ? (shaftKw * 1000) / omega : 0,
  };
}

export type Constraints = {
  target: boolean;
  discharge: boolean;
  npsh: boolean;
  power: boolean;
  suctionLevel: boolean;
  all: boolean;
};
export function evaluateConstraints(op: OperatingPoint): Constraints {
  const target = op.flowLps >= LIMITS.targetFlowLps - 1e-9;
  const discharge = op.dischargeKpa <= LIMITS.maxDischargeKpa;
  const npsh = op.flowLps === 0 || op.npshMarginM >= LIMITS.minNpshMarginM;
  const power = op.shaftKw <= LIMITS.motorRatedKw;
  const suctionLevel = op.sourceLevelM >= CIRCUIT.minSuctionLevelM;
  return { target, discharge, npsh, power, suctionLevel, all: target && discharge && npsh && power && suctionLevel };
}

export type TracePoint = { tS: number; flowLps: number; sourceM: number; destM: number; shaftKw: number; dischargeKpa: number };
export type RunResult = {
  tanks: Tanks;
  movedL: number;
  trace: TracePoint[];
  stoppedBy: NoFlowReason | 'clamp-source' | 'clamp-dest' | null;
};

/**
 * Advance the transfer by whole seconds at fixed 1 s steps. Each step uses the
 * operating point at the start of the step. The litres taken from the source are
 * exactly the litres added to the destination, so total water is conserved.
 */
export function runTransfer(condition: Condition, seconds: number): RunResult {
  assertInRange(seconds, 'run time', DOMAIN.runSeconds.min, DOMAIN.runSeconds.max);
  if (!Number.isInteger(seconds)) throw new PumpLabError('not-integer', 'Run time must be a whole number of seconds.');
  validateCondition(condition);
  let { sourceL, destL } = condition.tanks;
  let moved = 0;
  let stoppedBy: RunResult['stoppedBy'] = null;
  const trace: TracePoint[] = [];
  const minSourceL = CIRCUIT.minSuctionLevelM * LITRES_PER_M;
  for (let t = 0; t < seconds; t++) {
    const op = operatingPoint({ ...condition, tanks: { sourceL, destL } });
    let flow = op.flowLps;
    if (op.noFlowReason) stoppedBy = op.noFlowReason;
    const availableSource = Math.max(0, sourceL - minSourceL);
    const freeDest = Math.max(0, TANK_CAPACITY_L - destL);
    let litres = flow; // L/s over 1 s
    if (litres > availableSource) { litres = availableSource; stoppedBy = 'clamp-source'; }
    if (litres > freeDest) { litres = freeDest; stoppedBy = 'clamp-dest'; }
    if (litres !== flow) flow = litres;
    sourceL -= litres;
    destL += litres;
    moved += litres;
    trace.push({
      tS: t + 1,
      flowLps: flow,
      sourceM: sourceL / LITRES_PER_M,
      destM: destL / LITRES_PER_M,
      shaftKw: shaftPowerKw(condition.speedRpm, flow),
      dischargeKpa: op.dischargeKpa,
    });
  }
  return { tanks: { sourceL, destL }, movedL: moved, trace, stoppedBy };
}

/** Coordinates of a curve for plotting: pump head versus flow at one speed. */
export function curvePoints(kind: 'pump' | 'system', condition: Condition, steps = 40): { q: number; h: number }[] {
  const { sourceM, destM } = levels(condition.tanks);
  const n = speedRatio(condition.speedRpm);
  const lift = CIRCUIT.destBaseM + destM - sourceM;
  const valveActual = Math.min(condition.valvePct, condition.fault.valveStuckMaxPct);
  const sumK = condition.fault.suctionK + CIRCUIT.kPipe + (valveActual > 0 ? valveK(valveActual) : Infinity);
  const qMax = Math.sqrt((n * n * PUMP.h0) / PUMP.c);
  const pts: { q: number; h: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const q = (qMax * i) / steps;
    if (kind === 'pump') pts.push({ q, h: n * n * PUMP.h0 * condition.fault.impellerHeadFactor - PUMP.c * q * q });
    else if (Number.isFinite(sumK)) pts.push({ q, h: lift + sumK * q * q });
  }
  return pts;
}
