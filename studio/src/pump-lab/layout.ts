// PUMP LAB layout: the single source of truth for where things are, what they are
// called, and which model state each visual cue means. The 3D scene, the 2D diagram,
// the parts list and the teacher-anchor interface all read from here, so a part has
// one ID and one position everywhere. Pure data and functions; no three.js import.
//
// Schematic scale: 0.6 scene units per metre of tank depth and elevation, so tank
// levels and the lift between the tanks are drawn proportionally to each other.
// The pump, motor and fittings are NOT to scale.

import { CIRCUIT, LIMITS, type OperatingPoint } from './physics.ts';

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export const SCENE_UNITS_PER_M = 0.6;
export const DIAGRAM_VIEWBOX = { w: 1000, h: 560 } as const;

export const TARGET_IDS = [
  'source-tank', 'strainer', 'suction-pipe', 'pump-casing', 'impeller', 'shaft-seal', 'coupling', 'motor',
  'discharge-pipe', 'valve', 'dest-tank', 'gauge-suction', 'gauge-discharge', 'gauge-post-valve', 'flow-meter', 'power-meter',
] as const;
export type TargetId = (typeof TARGET_IDS)[number];
export type TargetKind = 'tank' | 'pipe' | 'pump' | 'drive' | 'valve' | 'instrument';

export type SceneTarget = {
  /** Stable ID, namespaced for the shared scene-target registry. */
  id: TargetId;
  qualifiedId: string;
  label: string;
  kind: TargetKind;
  /** One plain sentence on what the part does. */
  role: string;
  /** Anchor in the 3D lab frame: x right, y up, z towards the camera, scene units. */
  world: Vec3;
  /** Anchor in the 2D diagram viewBox (1000 x 560). */
  diagram: Vec2;
  /** Opens a section comparison or a bench inspection when it is the subject of a task. */
  bench: 'impeller' | 'shaft' | 'seal' | 'strainer' | 'valve-gate' | null;
};

const u = SCENE_UNITS_PER_M;
export const TANK_WALL_Y = CIRCUIT.tankWallM * u; // 1.8
export const SOURCE_TANK = { centre: [-3.6, 0, 0.1] as Vec3, size: [1.5, TANK_WALL_Y, 1.5] as Vec3 };
export const DEST_TANK = { centre: [3.6, CIRCUIT.destBaseM * u, 0.1] as Vec3, size: [1.5, TANK_WALL_Y, 1.5] as Vec3 };
export const PUMP_CENTRE: Vec3 = [-0.1, 0.45, 0.1];
export const SHAFT_AXIS_Y = 0.45;

/** The one flow path, tank to tank. Points are on pipe centrelines. */
export const FLOW_PATH: Vec3[] = [
  [-3.3, 0.45, 0.1], // inside the source tank, at the outlet
  [-2.85, 0.45, 0.1], // tank outlet port
  [-0.45, 0.45, 0.1], // pump inlet flange
  [-0.1, 0.45, 0.1], // impeller eye
  [-0.1, 0.87, 0.1], // discharge flange
  [-0.1, 1.55, 0.1], // top of riser
  [2.15, 1.55, 0.1], // across to the destination tank
  [2.15, 2.0, 0.1], // up to the tank inlet height
  [2.85, 2.0, 0.1], // dest tank inlet port
  [3.3, 2.0, 0.1], // inside the destination tank
];

/** Index in FLOW_PATH where the water passes the impeller: before is the suction side, after is the discharge side. */
export const PUMP_PATH_INDEX = 3;

export const SUCTION_PIPE: [Vec3, Vec3] = [[-2.85, 0.45, 0.1], [-0.45, 0.45, 0.1]];
export const DISCHARGE_PIPE: Vec3[] = FLOW_PATH.slice(4, 9);

export const TARGETS: readonly SceneTarget[] = [
  { id: 'source-tank', qualifiedId: 'pump-lab/source-tank', label: 'Source tank', kind: 'tank', role: 'Holds the water the pump draws from. Its level is on the sight glass.', world: [-3.6, 0.9, 0.1], diagram: [110, 330], bench: null },
  { id: 'strainer', qualifiedId: 'pump-lab/strainer', label: 'Suction strainer', kind: 'pipe', role: 'Catches debris before it reaches the pump.', world: [-2.1, 0.45, 0.1], diagram: [230, 380], bench: 'strainer' },
  { id: 'suction-pipe', qualifiedId: 'pump-lab/suction-pipe', label: 'Suction pipe', kind: 'pipe', role: 'Carries water from the tank to the pump inlet.', world: [-1.4, 0.45, 0.1], diagram: [330, 380], bench: null },
  { id: 'pump-casing', qualifiedId: 'pump-lab/pump-casing', label: 'Pump casing', kind: 'pump', role: 'The transparent casing around the impeller that collects and directs the water.', world: [-0.1, 0.45, 0.1], diagram: [450, 380], bench: null },
  { id: 'impeller', qualifiedId: 'pump-lab/impeller', label: 'Impeller', kind: 'pump', role: 'The spinning wheel that adds pressure to the water.', world: [-0.1, 0.45, 0.1], diagram: [450, 380], bench: 'impeller' },
  { id: 'shaft-seal', qualifiedId: 'pump-lab/shaft-seal', label: 'Shaft and seal', kind: 'pump', role: 'The shaft turns the impeller; the seal keeps water from leaking along it.', world: [0.2, 0.45, 0.1], diagram: [520, 380], bench: 'seal' },
  { id: 'coupling', qualifiedId: 'pump-lab/coupling', label: 'Coupling', kind: 'drive', role: 'Joins the motor shaft to the pump shaft.', world: [0.32, 0.45, 0.1], diagram: [545, 380], bench: null },
  { id: 'motor', qualifiedId: 'pump-lab/motor', label: 'Motor', kind: 'drive', role: 'Turns the pump. A 4-pole induction motor runs a little under 1,500 rpm on 50 Hz mains.', world: [0.95, 0.45, 0.1], diagram: [650, 380], bench: null },
  { id: 'discharge-pipe', qualifiedId: 'pump-lab/discharge-pipe', label: 'Discharge pipe', kind: 'pipe', role: 'Carries the pressurised water up and across to the destination tank.', world: [1.2, 1.55, 0.1], diagram: [640, 150], bench: null },
  { id: 'valve', qualifiedId: 'pump-lab/valve', label: 'Discharge valve', kind: 'valve', role: 'Narrows the pipe as the handle closes, which adds resistance.', world: [0.9, 1.55, 0.1], diagram: [560, 150], bench: 'valve-gate' },
  { id: 'dest-tank', qualifiedId: 'pump-lab/dest-tank', label: 'Destination tank', kind: 'tank', role: 'Receives the water. It is raised, so the pump must lift water up to it.', world: [3.6, 2.7, 0.1], diagram: [890, 210], bench: null },
  { id: 'gauge-suction', qualifiedId: 'pump-lab/gauge-suction', label: 'Suction gauge', kind: 'instrument', role: 'Pressure just before the pump. Below zero means the pump is pulling.', world: [-0.9, 0.85, 0.1], diagram: [390, 320], bench: null },
  { id: 'gauge-discharge', qualifiedId: 'pump-lab/gauge-discharge', label: 'Discharge gauge', kind: 'instrument', role: 'Pressure just after the pump, before the valve.', world: [0.15, 1.1, 0.1], diagram: [485, 235], bench: null },
  { id: 'gauge-post-valve', qualifiedId: 'pump-lab/gauge-post-valve', label: 'Gauge after valve', kind: 'instrument', role: 'Pressure just after the valve. The drop from the discharge gauge is the valve loss.', world: [1.4, 1.85, 0.1], diagram: [660, 105], bench: null },
  { id: 'flow-meter', qualifiedId: 'pump-lab/flow-meter', label: 'Flow meter', kind: 'instrument', role: 'Reads how much water passes each second.', world: [1.75, 1.55, 0.1], diagram: [735, 150], bench: null },
  { id: 'power-meter', qualifiedId: 'pump-lab/power-meter', label: 'Motor power meter', kind: 'instrument', role: 'Reads the power at the motor shaft.', world: [0.95, 0.95, 0.1], diagram: [650, 300], bench: null },
];

export const TARGET_BY_ID: Readonly<Record<TargetId, SceneTarget>> = Object.freeze(Object.fromEntries(TARGETS.map(t => [t.id, t])) as Record<TargetId, SceneTarget>);
export function isTargetId(v: unknown): v is TargetId { return typeof v === 'string' && (TARGET_IDS as readonly string[]).includes(v); }

export type CameraPreset = { id: string; label: string; position: Vec3; target: Vec3 };
export const CAMERA_PRESETS: readonly CameraPreset[] = [
  { id: 'overview', label: 'Whole circuit', position: [0.8, 3.0, 9.8], target: [0, 1.7, 0.1] },
  { id: 'pump', label: 'Pump and motor', position: [0.6, 1.6, 3.2], target: [0.2, 0.5, 0.1] },
  { id: 'valve', label: 'Valve and gauges', position: [1.4, 2.4, 3.6], target: [1.0, 1.6, 0.1] },
  { id: 'bench', label: 'Inspection bench', position: [1.6, 1.3, 5.6], target: [1.4, 0.3, 2.4] },
];

/** The inspection bench: parts laid out along x so an explode slider can slide them apart. */
export const BENCH = {
  origin: [-0.4, 0, 2.5] as Vec3,
  parts: [
    { id: 'shaft', label: 'Shaft', offsetX: 0.0, explodeX: -0.55 },
    { id: 'impeller', label: 'Impeller', offsetX: 0.5, explodeX: 0.0 },
    { id: 'seal', label: 'Shaft seal', offsetX: 0.95, explodeX: 0.5 },
    { id: 'strainer', label: 'Strainer basket', offsetX: 1.6, explodeX: 1.2 },
    { id: 'valve-gate', label: 'Valve gate', offsetX: 2.15, explodeX: 1.8 },
  ] as const,
};
export type BenchPartId = (typeof BENCH.parts)[number]['id'];

// ---------------------------------------------------------------- flow path math

const segLen = (a: Vec3, b: Vec3): number => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
export const PATH_SEGMENTS: number[] = FLOW_PATH.slice(1).map((p, i) => segLen(FLOW_PATH[i], p));
export const PATH_LENGTH: number = PATH_SEGMENTS.reduce((a, b) => a + b, 0);
/** Fraction of the path at which the water passes the impeller. */
export const PUMP_PATH_U: number = PATH_SEGMENTS.slice(0, PUMP_PATH_INDEX).reduce((a, b) => a + b, 0) / PATH_LENGTH;

/** Point at fraction u (0..1) of the flow path, by length. */
export function pathPoint(uFrac: number): Vec3 {
  const f = Math.min(1, Math.max(0, uFrac)) * PATH_LENGTH;
  let acc = 0;
  for (let i = 0; i < PATH_SEGMENTS.length; i++) {
    const len = PATH_SEGMENTS[i];
    if (f <= acc + len || i === PATH_SEGMENTS.length - 1) {
      const t = len === 0 ? 0 : (f - acc) / len;
      const a = FLOW_PATH[i], b = FLOW_PATH[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
    acc += len;
  }
  return FLOW_PATH[FLOW_PATH.length - 1];
}

export const PARTICLE_COUNT = 56;
/** Scene units of path travelled per second per L/s of flow. 12 L/s crosses the path in about 5 s. */
export const PARTICLE_SPEED_PER_LPS = PATH_LENGTH / 5 / 12;
export type Zone = 'suction' | 'discharge';
export const zoneAt = (uFrac: number): Zone => (uFrac < PUMP_PATH_U ? 'suction' : 'discharge');

/** Position fraction of particle i after t seconds of flowing at a steady flow. Deterministic. */
export function particleU(i: number, tSeconds: number, flowLps: number): number {
  const base = i / PARTICLE_COUNT;
  const travelled = (flowLps * PARTICLE_SPEED_PER_LPS * tSeconds) / PATH_LENGTH;
  return (base + travelled) % 1;
}

// ---------------------------------------------------------------- state cues

export type CueId = 'flow-particles' | 'cavitation-bubbles' | 'discharge-over-limit' | 'motor-over-rating' | 'source-low' | 'impeller-spin';
export type Cue = { id: CueId; active: boolean; target: TargetId; meaning: string; text: string };

/**
 * Every moving, glowing or flashing thing in the scene is one of these, switched by
 * model state. `live` is false until the learner has predicted, so nothing runs
 * ahead of the prediction.
 */
export function stateCues(op: OperatingPoint, live: boolean): Cue[] {
  return [
    { id: 'impeller-spin', active: live && op.speedRatio > 0, target: 'impeller', meaning: 'The impeller turns at the pump speed.', text: live ? 'The impeller is turning.' : 'The pump is idle until you predict the flow.' },
    { id: 'flow-particles', active: live && op.flowLps > 0, target: 'discharge-pipe', meaning: 'Dots move along the pipes at a speed proportional to flow. They are an indication, not a flow simulation.', text: live && op.flowLps > 0 ? 'Water is moving through the pipes.' : 'No water is moving.' },
    { id: 'cavitation-bubbles', active: live && op.cavitating, target: 'pump-casing', meaning: 'Pale bubbles appear at the impeller only while the suction margin is negative (the pump is cavitating).', text: live && op.cavitating ? 'Bubbles form at the impeller and the pump crackles.' : 'No bubbles at the impeller.' },
    { id: 'discharge-over-limit', active: live && op.dischargeKpa > LIMITS.maxDischargeKpa, target: 'gauge-discharge', meaning: `A ring and the words "Over limit" appear at the discharge gauge when pressure exceeds ${LIMITS.maxDischargeKpa} kPa.`, text: live && op.dischargeKpa > LIMITS.maxDischargeKpa ? 'The discharge pressure is over the pipe limit.' : 'Discharge pressure is within the pipe limit.' },
    { id: 'motor-over-rating', active: live && op.shaftKw > LIMITS.motorRatedKw, target: 'power-meter', meaning: `A ring and the words "Over rating" appear at the power meter when shaft power exceeds ${LIMITS.motorRatedKw} kW.`, text: live && op.shaftKw > LIMITS.motorRatedKw ? 'The motor is over its rating.' : 'Motor power is within its rating.' },
    { id: 'source-low', active: live && op.noFlowReason === 'source-low', target: 'source-tank', meaning: 'A marker appears on the source tank when it is too low for the pump to hold suction.', text: live && op.noFlowReason === 'source-low' ? 'The source tank is too low; the pump has lost suction.' : 'The source tank has enough water.' },
  ];
}

/** Resolve a target for the teacher or any other pointer. Falls back to a highlight, never to a wrong point. */
export type AnchorResolution =
  | { ok: true; id: TargetId; view: 'diagram' | '3d'; position: Vec2 | Vec3; label: string }
  | { ok: false; reason: 'unknown-target' | 'view-unavailable'; fallback: 'highlight-list-entry' };
export function resolveAnchor(id: string, view: 'diagram' | '3d', available3d = true): AnchorResolution {
  if (!isTargetId(id)) return { ok: false, reason: 'unknown-target', fallback: 'highlight-list-entry' };
  const t = TARGET_BY_ID[id];
  if (view === '3d') {
    if (!available3d) return { ok: false, reason: 'view-unavailable', fallback: 'highlight-list-entry' };
    return { ok: true, id, view, position: t.world, label: t.label };
  }
  return { ok: true, id, view, position: t.diagram, label: t.label };
}

/** Water surface height in scene units for a tank, from the true volume. */
export const levelToY = (levelM: number, tankFloorY: number): number => tankFloorY + levelM * u;
