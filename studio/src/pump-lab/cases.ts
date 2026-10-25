// PUMP LAB authored cases. Each case fixes a hidden fault state, a starting setting,
// the evidence signature that separates it from the others, and the one named
// repair that changes it. Learner-facing text is plain language and carries no
// claim of real maintenance, certification or equipment validation.

import { HEALTHY, LIMITS, type FaultParams } from './physics.ts';
import type { Flag, Section } from './instruments.ts';

export const CASE_IDS = ['baseline-commissioning', 'valve-handle-open', 'noisy-suction', 'weak-delivery'] as const;
export type CaseId = (typeof CASE_IDS)[number];

export const CAUSE_IDS = ['no-fault', 'speed-too-low', 'valve-gate-stuck', 'strainer-blocked', 'impeller-worn', 'tank-empty'] as const;
export type CauseId = (typeof CAUSE_IDS)[number];

export const REPAIR_IDS = ['clear-strainer', 'free-valve-gate', 'replace-impeller'] as const;
export type RepairId = (typeof REPAIR_IDS)[number];

export const PART_IDS = ['strainer', 'impeller', 'valve-gate'] as const;
export type PartId = (typeof PART_IDS)[number];

export const CAUSES: Record<CauseId, { label: string; claim: string }> = {
  'no-fault': { label: 'Nothing is broken', claim: 'The circuit is healthy; the settings decide the result.' },
  'speed-too-low': { label: 'The pump speed is too low', claim: 'Running the pump faster would fix it.' },
  'valve-gate-stuck': { label: 'The valve gate is stuck part-closed', claim: 'The handle says open but the gate inside has not moved all the way.' },
  'strainer-blocked': { label: 'The suction strainer is blocked', claim: 'Debris is restricting the water before it reaches the pump.' },
  'impeller-worn': { label: 'The impeller is worn', claim: 'The pump no longer adds as much pressure as its datasheet curve.' },
  'tank-empty': { label: 'The source tank has run too low', claim: 'There is not enough water to feed the pump.' },
};

export const REPAIRS: Record<RepairId, { label: string; effect: string; fixes: CauseId }> = {
  'clear-strainer': { label: 'Clear the strainer', effect: 'Sets the suction restriction back to the clean value in this case.', fixes: 'strainer-blocked' },
  'free-valve-gate': { label: 'Free the valve gate', effect: 'Lets the gate follow the handle all the way in this case.', fixes: 'valve-gate-stuck' },
  'replace-impeller': { label: 'Fit a new impeller', effect: 'Restores the datasheet pump curve in this case.', fixes: 'impeller-worn' },
};

export const PARTS: Record<PartId, { label: string }> = {
  strainer: { label: 'Suction strainer' },
  impeller: { label: 'Impeller' },
  'valve-gate': { label: 'Valve gate' },
};

export type Signature = { positive: Section | null; flags: Partial<Record<Section, Flag>> };
/** What an informative reading shows for each cause. The pump flag for a blocked strainer depends on cavitation, so it is left open. */
export const SIGNATURES: Record<CauseId, Signature> = {
  'no-fault': { positive: null, flags: { suction: 'as-expected', pump: 'as-expected', valve: 'as-expected' } },
  'speed-too-low': { positive: null, flags: { suction: 'as-expected', pump: 'as-expected', valve: 'as-expected' } },
  'tank-empty': { positive: null, flags: { suction: 'as-expected', pump: 'as-expected', valve: 'as-expected' } },
  'valve-gate-stuck': { positive: 'valve', flags: { suction: 'as-expected', pump: 'as-expected', valve: 'higher' } },
  'strainer-blocked': { positive: 'suction', flags: { suction: 'higher', valve: 'as-expected' } },
  'impeller-worn': { positive: 'pump', flags: { suction: 'as-expected', pump: 'lower', valve: 'as-expected' } },
};

export type CaseSpec = {
  id: CaseId;
  title: string;
  /** The symptom as the plant operator reports it. Never names the cause. */
  report: string;
  trueCause: CauseId;
  fault: FaultParams;
  start: { speedRpm: number; valvePct: number };
  /** The one repair that changes the hidden state; null when nothing is broken. */
  repair: RepairId | null;
  teardown: Record<PartId, string>;
  hints: [string, string, string];
};

const CLEAN_TEARDOWN: Record<PartId, string> = {
  strainer: 'The strainer basket is clean. Water passes freely.',
  impeller: 'The impeller vanes are intact and match the drawing.',
  'valve-gate': 'The gate moves to match the handle.',
};

export const CASES: Record<CaseId, CaseSpec> = {
  'baseline-commissioning': {
    id: 'baseline-commissioning',
    title: 'Commission a healthy circuit',
    report: `Nothing has been reported broken. Your job is to find a pump speed and valve opening that moves ${LIMITS.targetFlowLps} L/s without breaking any limit. The pump has just been started at full speed with the valve open.`,
    trueCause: 'no-fault',
    fault: { ...HEALTHY },
    start: { speedRpm: 1450, valvePct: 100 },
    repair: null,
    teardown: CLEAN_TEARDOWN,
    hints: [
      'Look at which limit lights first when you take a reading at full speed. Then ask which setting you can change to move away from that limit while keeping the flow.',
      'The motor and the discharge line each have a limit. Lower the speed a little and take another reading; compare the flow and the motor power with the first one.',
      'Worked comparison: at full speed with the valve open the flow is above target, but the motor shaft power is above its 2.2 kW rating. Because power rises faster than flow as speed goes up, a modest speed reduction keeps the flow above target while the power drops under the rating.',
    ],
  },
  'valve-handle-open': {
    id: 'valve-handle-open',
    title: 'The handle says open, the flow says otherwise',
    report: `The operator turned the pump up to 85 percent speed and opened the discharge valve handle fully. Flow is well under the ${LIMITS.targetFlowLps} L/s target. The operator wants to turn the speed up more.`,
    trueCause: 'valve-gate-stuck',
    fault: { ...HEALTHY, valveStuckMaxPct: 15 },
    start: { speedRpm: 1230, valvePct: 100 },
    repair: 'free-valve-gate',
    teardown: {
      ...CLEAN_TEARDOWN,
      'valve-gate': 'The gate stem is seized. The gate only travels about 15 percent of the way up, whatever the handle says.',
    },
    hints: [
      'Take a reading, then use Compare against expected on each section. Look for the section whose pressure loss is far from what the datasheet predicts for this flow.',
      'The pump itself is adding the pressure its datasheet curve gives for this flow. The unexpected loss is somewhere else in the circuit.',
      'Worked comparison: for a valve handle at 100 percent the datasheet loss is about 0.01 m per (L/s) squared, so about 0.4 m at 6 L/s. If the gauges before and after the valve differ by many metres, the valve is restricting the line more than its handle shows.',
    ],
  },
  'noisy-suction': {
    id: 'noisy-suction',
    title: 'Crackling at the pump and low flow',
    report: `Operators hear crackling from the pump at high speed. Flow is below the ${LIMITS.targetFlowLps} L/s target and the suction gauge reads strongly negative. Turning the speed up makes the noise worse and the flow barely changes.`,
    trueCause: 'strainer-blocked',
    fault: { ...HEALTHY, suctionK: 0.14 },
    start: { speedRpm: 1230, valvePct: 100 },
    repair: 'clear-strainer',
    teardown: {
      ...CLEAN_TEARDOWN,
      strainer: 'The strainer basket is about three-quarters covered in debris. Water can only pass through a small area.',
    },
    hints: [
      'Take readings at two different speeds. A pump that is short of pressure at its inlet changes behaviour as the speed rises. Which gauge shows it first?',
      'Compare the pressure lost before the pump against the datasheet allowance for a clean strainer at the measured flow. Then compare the pressure the pump adds. Two sections may look wrong; only one is the source.',
      'Worked comparison: a clean strainer and suction pipe lose about 0.002 m per (L/s) squared, so about 0.2 m at 10 L/s. A loss of several metres means the restriction is upstream of the pump. The pump may also look weak, but that is because it is starved at the inlet, not because it is worn.',
    ],
  },
  'weak-delivery': {
    id: 'weak-delivery',
    title: 'The pump runs, but delivers weakly',
    report: `The pump runs smoothly and quietly at full speed, yet the flow is under the ${LIMITS.targetFlowLps} L/s target. The motor draws a lot of power for the flow it gives.`,
    trueCause: 'impeller-worn',
    fault: { ...HEALTHY, impellerHeadFactor: 0.62 },
    start: { speedRpm: 1450, valvePct: 100 },
    repair: 'replace-impeller',
    teardown: {
      ...CLEAN_TEARDOWN,
      impeller: 'The impeller vane tips are eroded back and the clearance ring is worn. It cannot hold the datasheet pressure.',
    },
    hints: [
      'The line to the tank and the inlet may both be fine. Take a reading and test each section against its datasheet figure.',
      'Compare the pressure the pump adds with the datasheet curve for the same speed and flow. The other two sections should be close to what the datasheet gives.',
      'Worked comparison: at 1,450 rpm and 10 L/s the datasheet curve gives about 16 m of head. If the gauges show the pump adding much less while the strainer and the valve lose what they should, the shortfall is inside the pump.',
    ],
  },
};

export function isCaseId(v: unknown): v is CaseId { return typeof v === 'string' && (CASE_IDS as readonly string[]).includes(v); }
export function isCauseId(v: unknown): v is CauseId { return typeof v === 'string' && (CAUSE_IDS as readonly string[]).includes(v); }
export function isRepairId(v: unknown): v is RepairId { return typeof v === 'string' && (REPAIR_IDS as readonly string[]).includes(v); }
export function isPartId(v: unknown): v is PartId { return typeof v === 'string' && (PART_IDS as readonly string[]).includes(v); }
