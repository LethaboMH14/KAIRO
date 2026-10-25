// Calculations behind the Engineering Studio. Pure functions with no DOM or
// three.js imports, so docs/engineering/checks can test the exact code the
// studio runs (Node strips the types).

export const SUPPORTED_POLES = [2, 4, 6, 8, 10, 12] as const;
export const FREQUENCY_LIMITS = { min: 1, max: 400 } as const;

export type FieldSpeed =
  | { ok: true; frequencyHz: number; poles: number; rpm: number; revPerSecond: number }
  | { ok: false; field: 'frequency' | 'poles'; message: string };

/** Reads a typed number. Accepts a decimal comma; anything else malformed gives NaN. */
export function readNumber(text: string): number {
  const cleaned = text.trim().replace(',', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/** Synchronous speed of the rotating field, n_s = 120 f / p in r/min, where p is the total number of poles. */
export function synchronousSpeed(frequencyHz: number, poles: number): FieldSpeed {
  if (!Number.isFinite(frequencyHz)) {
    return { ok: false, field: 'frequency', message: 'Enter the supply frequency as a number of hertz.' };
  }
  if (frequencyHz < FREQUENCY_LIMITS.min || frequencyHz > FREQUENCY_LIMITS.max) {
    return { ok: false, field: 'frequency', message: `Use a frequency from ${FREQUENCY_LIMITS.min} to ${FREQUENCY_LIMITS.max} Hz.` };
  }
  if (!(SUPPORTED_POLES as readonly number[]).includes(poles)) {
    return { ok: false, field: 'poles', message: 'Choose an even number of poles from 2 to 12. Poles come in north and south pairs.' };
  }
  const rpm = (120 * frequencyHz) / poles;
  return { ok: true, frequencyHz, poles, rpm, revPerSecond: rpm / 60 };
}

export const PHASES = ['U', 'V', 'W'] as const;
export type Phase = (typeof PHASES)[number];

/** Idealised balanced three-phase currents with a peak of 1. */
export function phaseCurrents(electricalAngle: number): Record<Phase, number> {
  return {
    U: Math.cos(electricalAngle),
    V: Math.cos(electricalAngle - (2 * Math.PI) / 3),
    W: Math.cos(electricalAngle - (4 * Math.PI) / 3),
  };
}

const DEG = Math.PI / 180;

/** The model's winding is arranged for four poles. */
export const POLE_PAIRS = 2;

/**
 * Magnetic axes of the model's three phase windings, in mechanical radians.
 * Angles are measured as in the drive-end view: anticlockwise from 3 o'clock.
 * Each phase's go belt (slots 0-2 for U) and return belt (slots 9-11) sit a
 * pole pitch apart; the axis is midway. V and W follow at 60 degree steps
 * (120 electrical degrees). docs/engineering/checks verifies these against the
 * slot table exported with the 3D model.
 */
export const PHASE_AXES: Record<Phase, number> = { U: 55 * DEG, V: 115 * DEG, W: 175 * DEG };

export function wrapAngle(angle: number, period = 2 * Math.PI): number {
  return ((angle % period) + period) % period;
}

/**
 * How the three supply lines reach the U, V and W windings: normally, with two
 * lines exchanged at the terminals, or with one line open (single-phasing).
 */
export type Supply =
  | { kind: 'normal' }
  | { kind: 'swapped'; lines: readonly [Phase, Phase] }
  | { kind: 'open'; line: Phase };

export const NORMAL_SUPPLY: Supply = { kind: 'normal' };

/**
 * Currents in the U, V and W windings for a supply, with a peak of 1 in normal
 * running. Idealised like phaseCurrents: every winding has the same impedance,
 * so its current follows its voltage, and the winding is star-connected as in
 * this model. With one line open, the other two windings are in series across
 * their line-to-line voltage (√3 times a phase voltage) and twice the impedance:
 * one current of √3/2 the normal peak enters one winding and leaves by the other.
 * That holds with the rotor at rest, where the motor offers the same impedance
 * to the field's forward- and backward-turning parts.
 */
export function windingCurrents(electricalAngle: number, supply: Supply = NORMAL_SUPPLY): Record<Phase, number> {
  const lines = phaseCurrents(electricalAngle);
  if (supply.kind === 'normal') return lines;
  if (supply.kind === 'swapped') {
    const [a, b] = supply.lines;
    return { ...lines, [a]: lines[b], [b]: lines[a] };
  }
  const [a, b] = PHASES.filter(phase => phase !== supply.line);
  const series = (lines[a] - lines[b]) / 2;
  return { ...lines, [a]: series, [b]: -series, [supply.line]: 0 };
}

/** Peak current in each winding over one cycle, relative to a normal start. */
export function peakCurrents(supply: Supply, samples = 3600): Record<Phase, number> {
  const peaks: Record<Phase, number> = { U: 0, V: 0, W: 0 };
  for (let s = 0; s < samples; s++) {
    const currents = windingCurrents((2 * Math.PI * s) / samples, supply);
    for (const phase of PHASES) peaks[phase] = Math.max(peaks[phase], Math.abs(currents[phase]));
  }
  return peaks;
}

/** Fundamental stator magnetomotive force (arbitrary units) at mechanical angle phi. */
export function statorMmf(phi: number, electricalAngle: number, polePairs = POLE_PAIRS, supply: Supply = NORMAL_SUPPLY): number {
  const currents = windingCurrents(electricalAngle, supply);
  return PHASES.reduce((sum, phase) => sum + currents[phase] * Math.cos(polePairs * (phi - PHASE_AXES[phase])), 0);
}

/** Space vector of the fundamental field, Σ i·(cos, sin)(pole pairs × axis). */
function spaceVector(currents: Record<Phase, number>, polePairs: number): [number, number] {
  let x = 0;
  let y = 0;
  for (const phase of PHASES) {
    x += currents[phase] * Math.cos(polePairs * PHASE_AXES[phase]);
    y += currents[phase] * Math.sin(polePairs * PHASE_AXES[phase]);
  }
  return [x, y];
}

export type StatorField = { strength: number; north: number };

/**
 * The fundamental field of a set of winding currents. Strength is the MMF's peak
 * (3/2 in normal running); north is a north pole's mechanical angle, in
 * [0, 2π / pole pairs). A field passing through zero still gets a finite angle.
 */
export function statorField(currents: Record<Phase, number>, polePairs = POLE_PAIRS): StatorField {
  const [x, y] = spaceVector(currents, polePairs);
  return { strength: Math.hypot(x, y), north: wrapAngle(Math.atan2(y, x) / polePairs, (2 * Math.PI) / polePairs) };
}

export type TurningParts = { forward: number; backward: number };

const TURNING_SAMPLES = 360;
const turningCache = new WeakMap<Supply, TurningParts>();

/**
 * Any field these windings make is the sum of a part turning forwards
 * (anticlockwise from the drive end) and a part turning backwards. Their
 * strengths are the space vector's components at plus and minus the supply
 * frequency over one electrical cycle.
 */
export function turningParts(supply: Supply): TurningParts {
  const cached = turningCache.get(supply);
  if (cached) return cached;
  let forwardX = 0, forwardY = 0, backwardX = 0, backwardY = 0;
  for (let s = 0; s < TURNING_SAMPLES; s++) {
    const theta = (2 * Math.PI * s) / TURNING_SAMPLES;
    const [x, y] = spaceVector(windingCurrents(theta, supply), POLE_PAIRS);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    // Turned back by θ, the forward part stands still; turned on by θ, the backward part does.
    forwardX += x * cos + y * sin;
    forwardY += y * cos - x * sin;
    backwardX += x * cos - y * sin;
    backwardY += y * cos + x * sin;
  }
  const parts = { forward: Math.hypot(forwardX, forwardY) / TURNING_SAMPLES, backward: Math.hypot(backwardX, backwardY) / TURNING_SAMPLES };
  turningCache.set(supply, parts);
  return parts;
}

/** 1 when the field turns anticlockwise seen from the drive end, −1 clockwise, 0 when it only pulsates. */
export function fieldTurning(supply: Supply): 1 | -1 | 0 {
  const { forward, backward } = turningParts(supply);
  const difference = forward - backward;
  if (Math.abs(difference) <= 1e-9 * (forward + backward)) return 0;
  return difference > 0 ? 1 : -1;
}

/** Mechanical angle of a north pole of the idealised rotating field. */
export function northPoleAngle(electricalAngle: number, polePairs = POLE_PAIRS): number {
  return wrapAngle(PHASE_AXES.U + electricalAngle / polePairs);
}

export type Slot = { angleDeg: number; phase: Phase; sign: 1 | -1 };

/** Current in one stator slot; positive flows towards the drive end (out of the drive-end view). */
export function slotCurrent(slot: Slot, electricalAngle: number, supply: Supply = NORMAL_SUPPLY): number {
  return slot.sign * windingCurrents(electricalAngle, supply)[slot.phase];
}

/**
 * North-pole angle found from the slot currents alone: build the stepped MMF
 * (it rises across each positive conductor) and take the angle of its
 * pole-pair-order Fourier component.
 */
export function slotFieldNorthAngle(slots: readonly Slot[], electricalAngle: number, polePairs = POLE_PAIRS, samples = 720, supply: Supply = NORMAL_SUPPLY): number {
  const conductors = slots
    .map(slot => ({ angle: slot.angleDeg * DEG, current: slotCurrent(slot, electricalAngle, supply) }))
    .sort((a, b) => a.angle - b.angle);
  let cosine = 0;
  let sine = 0;
  for (let s = 0; s < samples; s++) {
    const phi = (2 * Math.PI * (s + 0.5)) / samples;
    let mmf = 0;
    for (const conductor of conductors) if (conductor.angle < phi) mmf += conductor.current;
    cosine += mmf * Math.cos(polePairs * phi);
    sine += mmf * Math.sin(polePairs * phi);
  }
  return wrapAngle(Math.atan2(sine, cosine) / polePairs, (2 * Math.PI) / polePairs);
}

/**
 * Playback settings for the operating demonstration. These are presentation
 * choices, not motor physics: the field is slowed to be watchable and the
 * slip is exaggerated so the lag is visible.
 */
export const DEMO = { electricalHzAtNormalSpeed: 0.5, slip: 0.2, bearingCageRatio: 0.4 } as const;

/** Peak MMF of the balanced field, the reference for field strength. */
export const NORMAL_FIELD_STRENGTH = 1.5;

export type DemoAngles = { electrical: number; north: number; rotor: number; cage: number; fieldStrength: number };

/**
 * Angles shown by the operating demonstration after `seconds` of playback time.
 * Every supply starts from rest: the rotor follows the way the field turns and
 * stays still when the field only pulsates, because two equal turning parts
 * give no starting torque. fieldStrength is relative to normal running.
 */
export function demoAngles(seconds: number, supply: Supply = NORMAL_SUPPLY): DemoAngles {
  const electrical = 2 * Math.PI * DEMO.electricalHzAtNormalSpeed * seconds;
  const { strength, north } = statorField(windingCurrents(electrical, supply));
  const fieldTurned = (fieldTurning(supply) * electrical) / POLE_PAIRS;
  const rotor = (1 - DEMO.slip) * fieldTurned;
  return { electrical, north, rotor, cage: DEMO.bearingCageRatio * rotor, fieldStrength: strength / NORMAL_FIELD_STRENGTH };
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep01(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/** Progress of one part's explode movement within its [start, end] window of the 0-1 slider. */
export function stageProgress(explode: number, stage: readonly [number, number]): number {
  return smoothstep01((explode - stage[0]) / (stage[1] - stage[0]));
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Duration of an explode or reassemble tween: 650 ms for the full travel, never under 150 ms. */
export function explodeDuration(from: number, to: number, reduced: boolean): number {
  if (reduced) return 0;
  return Math.max(150, 650 * Math.abs(to - from));
}
