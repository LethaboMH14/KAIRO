import geometryData from './motorGeometry.json';
import { stageProgress, type Phase, type Slot } from './fieldMath';
import type { PartId } from './motorContent';

export const MODEL_URL = '/models/engineering/induction-motor.glb';
export const ENVIRONMENT_URL = '/models/engineering/poly_haven_studio_1k.hdr';

export const NODE_IDS = [
  'housing', 'terminal-box', 'terminal-box-lid', 'stator-core', 'stator-windings', 'rotor-assembly',
  'bearing-de', 'bearing-nde', 'end-shield-de', 'end-shield-nde', 'fan', 'fan-cover',
] as const;
export type NodeId = (typeof NODE_IDS)[number];
export type Spin = '' | 'rotor' | 'bearing-cage';
export type Vec3 = [number, number, number];
export type Bounds = { min: Vec3; max: Vec3 };

export type MeshInfo = {
  name: string;
  part: PartId;
  node: NodeId;
  variant: 'full' | 'cut';
  spin: Spin;
  phase?: Phase;
  materials: string[];
  triangles: number;
  bbox: Bounds;
  side?: number[][];
  end?: number[][];
};

export type MotorGeometry = {
  glbSha256: string;
  machine: { poles: number; statorSlots: number; rotorBars: number; skewDeg: number; slotCentreRadiusMm: number; boreRadiusMm: number; rotorRadiusMm: number; shaftHeightMm: number };
  slots: Slot[];
  meshes: MeshInfo[];
  totals: { meshes: number; triangles: number };
};

export const GEOMETRY = geometryData as unknown as MotorGeometry;

/**
 * Explode travel for each transform node, in metres of the motor's own frame
 * (+X drive end, +Y up). Each node moves inside its own window of the 0-1
 * slider, so parts leave roughly in disassembly order: covers and fan first,
 * then end shields and bearings, then the rotor is drawn out to the drive end.
 * Offsets are recomputed from the assembled pose every frame, never accumulated.
 */
export const EXPLODE: Record<NodeId, { offset: Vec3; stage: readonly [number, number] }> = {
  'fan-cover': { offset: [-0.30, 0, 0], stage: [0, 0.4] },
  fan: { offset: [-0.20, 0, 0], stage: [0.1, 0.5] },
  'end-shield-nde': { offset: [-0.13, 0, 0], stage: [0.2, 0.6] },
  'bearing-nde': { offset: [-0.06, 0, 0], stage: [0.25, 0.65] },
  'terminal-box-lid': { offset: [0, 0.10, 0], stage: [0, 0.35] },
  'terminal-box': { offset: [0, 0.05, 0], stage: [0.05, 0.4] },
  'end-shield-de': { offset: [0.33, 0, 0], stage: [0.15, 0.55] },
  'bearing-de': { offset: [0.27, 0, 0], stage: [0.2, 0.6] },
  'rotor-assembly': { offset: [0.24, 0, 0], stage: [0.45, 1] },
  housing: { offset: [0, 0, 0], stage: [0, 1] },
  'stator-core': { offset: [0, 0, 0], stage: [0, 1] },
  'stator-windings': { offset: [0, 0, 0], stage: [0, 1] },
};

export function nodeOffset(node: NodeId, explode: number): Vec3 {
  const { offset, stage } = EXPLODE[node];
  const k = stageProgress(explode, stage);
  return [offset[0] * k, offset[1] * k, offset[2] * k];
}

const FULL_MESHES = GEOMETRY.meshes.filter(mesh => mesh.variant === 'full');

function unionBounds(meshes: readonly MeshInfo[], explode: number): Bounds {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const mesh of meshes) {
    const offset = nodeOffset(mesh.node, explode);
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], mesh.bbox.min[axis] + offset[axis]);
      max[axis] = Math.max(max[axis], mesh.bbox.max[axis] + offset[axis]);
    }
  }
  return { min, max };
}

/** Current bounds of one part in the motor frame, following its explode offset. */
export function partBounds(part: PartId, explode: number): Bounds {
  return unionBounds(FULL_MESHES.filter(mesh => mesh.part === part), explode);
}

export function modelBounds(explode: number): Bounds {
  return unionBounds(FULL_MESHES, explode);
}

/** Height of the bench top in the scene, and where the motor's shaft axis sits above it. */
export const BENCH_TOP = 0;
export const MAT_THICKNESS = 0.006;
export const MOTOR_ORIGIN: Vec3 = [0, BENCH_TOP + MAT_THICKNESS + GEOMETRY.machine.shaftHeightMm / 1000, 0];

export const CAMERA_PRESETS = {
  'three-quarter': { label: 'Three-quarter', direction: [0.62, 0.38, 0.69] as Vec3 },
  side: { label: 'Side', direction: [0, 0.12, 1] as Vec3 },
  'drive-end': { label: 'Drive end', direction: [1, 0.2, 0.16] as Vec3 },
  'fan-end': { label: 'Fan end', direction: [-1, 0.24, 0.2] as Vec3 },
  top: { label: 'Top', direction: [0.02, 1, 0.22] as Vec3 },
} as const;
export type PresetId = keyof typeof CAMERA_PRESETS;

/** Explode progress at or above this counts as taken apart: operation must pause. */
export const ASSEMBLED_TOLERANCE = 0.001;

/** Playback time of the operating demonstration, shared by the 3D and 2D views. */
export type DemoClock = { seconds: number; playing: boolean };

export type CameraCommand =
  | { kind: 'preset'; preset: PresetId; nonce: number }
  | { kind: 'focus'; part: PartId; nonce: number };
