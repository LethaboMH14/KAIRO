// Description of the KAIRO teacher asset: bone names, clips, face shapes and the driven correctives.
// Names match design/character/blender/rain_export.py and teacher_clips.py; docs/character/rig-map.json lists them.
import type { Expression } from './types.ts';

export const TEACHER_ASSET = {
  id: 'kairo-teacher',
  url: '/models/character/kairo-teacher.glb',
  rigVersion: 'kairo-teacher-rig v1: 77 joints, 31 face shapes, 30 hand correctives, 5 clips',
};

export const BONES = {
  pelvis: 'pelvis',
  spine: ['spine_01', 'spine_02', 'spine_03'] as const,
  neck: 'neck_01',
  head: 'head',
  eyes: ['eye_l', 'eye_r'] as const,
};

export type Side = 'l' | 'r';
export function armBones(side: Side) {
  return {
    clavicle: `clavicle_${side}`,
    upper: `upperarm_${side}`,
    upperTwist: `upperarm_twist_01_${side}`,
    lower: `lowerarm_${side}`,
    lowerTwist: `lowerarm_twist_01_${side}`,
    hand: `hand_${side}`,
    index: [`index_01_${side}`, `index_02_${side}`, `index_03_${side}`] as const,
  };
}

export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;

/** Spring chains for the hanging locs (head-relative secondary motion). */
export const HAIR_CHAINS = [
  { bones: ['hair_back_01', 'hair_back_02', 'hair_back_03'], stiffness: 0.12, damping: 0.86, hang: 0.45 },
  { bones: ['hair_side_l_01', 'hair_side_l_02'], stiffness: 0.3, damping: 0.8, hang: 0 },
  { bones: ['hair_side_r_01', 'hair_side_r_02'], stiffness: 0.3, damping: 0.8, hang: 0 },
] as const;

export const CLIPS = { idle: 'Idle', listen: 'Listen', explain: 'Explain', acknowledge: 'Acknowledge', handPoint: 'HandPoint' } as const;

/** Expression presets (face shape weights); the same values drive design/character/blender/face_shapes.py renders. */
export const EXPRESSIONS: Record<Expression, Record<string, number>> = {
  neutral: {
    mouthSmileLeft: 0.32, mouthSmileRight: 0.32, cheekSquintLeft: 0.12, cheekSquintRight: 0.12,
    eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1, browInnerUpLeft: 0.06, browInnerUpRight: 0.06,
  },
  encouraging: {
    mouthSmileLeft: 0.85, mouthSmileRight: 0.85, mouthUpperUp: 0.45, mouthLowerDown: 0.25, jawOpen: 0.08,
    cheekSquintLeft: 0.35, cheekSquintRight: 0.35, browOuterUpLeft: 0.15, browOuterUpRight: 0.15,
  },
  curious: {
    browInnerUpLeft: 0.35, browInnerUpRight: 0.2, browOuterUpLeft: 0.45, mouthSmileLeft: 0.25, mouthSmileRight: 0.15,
    eyeWideLeft: 0.2, eyeWideRight: 0.15,
  },
  focused: { browDownLeft: 0.3, browDownRight: 0.3, eyeSquintLeft: 0.25, eyeSquintRight: 0.25, mouthPress: 0.3 },
};

/**
 * Rhubarb Lip Sync mouth shapes -> face shape weights. A: closed (M, B, P); B: slightly open, teeth together
 * (K, S, T, EE); C: open (EH, AE); D: wide open (AA); E: slightly rounded (AO, ER); F: puckered (UW, OW, W);
 * G: upper teeth on lower lip (F, V); H: tongue raised (L); X: rest.
 */
export const VISEMES: Record<string, Record<string, number>> = {
  X: {},
  A: { mouthPress: 0.6, mouthRollLower: 0.12 },
  B: { jawOpen: 0.1, mouthStretchLeft: 0.22, mouthStretchRight: 0.22, mouthUpperUp: 0.22, mouthLowerDown: 0.18 },
  C: { jawOpen: 0.3, mouthStretchLeft: 0.12, mouthStretchRight: 0.12, mouthLowerDown: 0.25, mouthUpperUp: 0.1 },
  D: { jawOpen: 0.52, mouthLowerDown: 0.3, mouthUpperUp: 0.1 },
  E: { jawOpen: 0.26, mouthPucker: 0.35, mouthFunnel: 0.22 },
  F: { jawOpen: 0.07, mouthPucker: 0.8, mouthFunnel: 0.3 },
  G: { jawOpen: 0.06, mouthRollLower: 0.45, mouthUpperUp: 0.28 },
  H: { jawOpen: 0.28, mouthLowerDown: 0.15 },
};

/** Every face shape a mouth layer may write; reset each frame so stale speech weights never linger. */
export const MOUTH_SHAPES = Array.from(new Set(Object.values(VISEMES).flatMap(v => Object.keys(v)).concat(['jawOpen'])));

/**
 * Rain's finger correctives were Blender drivers: weight = joint flexion (radians) / divisor. The exporter baked the
 * shapes as morph targets named cor_<key>; the runtime reproduces the drivers from the exported joint angles.
 * Rain's FK finger bone n maps to the exported <finger>_0n joint.
 */
export function fingerCorrectives(side: Side) {
  const S = side === 'l' ? 'L' : 'R';
  const out: { morph: string; bone: string; divisor: number }[] = [];
  for (const [finger, Name] of [['index', 'Index'], ['middle', 'Middle'], ['ring', 'Ring'], ['pinky', 'Pinky']] as const) {
    out.push({ morph: `cor_Finger_${Name}1.${S}`, bone: `${finger}_01_${side}`, divisor: 1.4 });
    out.push({ morph: `cor_Finger_${Name}2.${S}`, bone: `${finger}_02_${side}`, divisor: 1.5 });
    out.push({ morph: `cor_Finger_${Name}3.${S}`, bone: `${finger}_03_${side}`, divisor: 1.3 });
  }
  out.push({ morph: `cor_Finger_Thumb2.${S}`, bone: `thumb_02_${side}`, divisor: 1.0 });
  out.push({ morph: `cor_Finger_Thumb3.${S}`, bone: `thumb_03_${side}`, divisor: 1.3 });
  return out;
}

export const CAPABILITIES = [
  'cue:idle', 'cue:listen', 'cue:explain', 'cue:acknowledge', 'cue:point',
  'point:ray-ik', 'point:contact-ik', 'gaze:head-and-eyes', 'face:31-shapes',
  'expression:neutral', 'expression:encouraging', 'expression:curious', 'expression:focused',
  'mouth:visemes-when-supplied', 'mouth:amplitude-fallback', 'blink', 'hair:spring-chains',
  'hands:finger-correctives', 'reduced-motion', 'move:unsupported',
];
