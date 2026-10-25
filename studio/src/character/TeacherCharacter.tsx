// KAIRO teaching character (CHARACTER-002). Renders inside the host's existing R3F <Canvas>; no renderer, provider,
// global state or network credentials. Contract: types.ts and coordination/handoffs/claude-character.md.
//
// Each frame: authored clips (mixer) -> torso turn + pointing hand -> two-bone arm IK to the real target -> forearm
// twist -> head/neck/eye gaze -> hair springs -> finger correctives -> face (expression, mouth, blink).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CueLedger } from './cues.ts';
import { BlinkClock, amplitudeWeights, visemeWeights } from './face.ts';
import { aimBoneWorld, angleFromRest, damp, easeInOut, rotateBoneWorld, solveTwoBone, twistAbout } from './ik.ts';
import { BONES, CAPABILITIES, CLIPS, EXPRESSIONS, HAIR_CHAINS, TEACHER_ASSET, armBones, fingerCorrectives, type Side } from './rig.ts';
import { SpringChain, type Collider } from './springs.ts';
import { readAudio, type CharacterProps, type InstrumentSample, type Target } from './types.ts';

type Posture = 'idle' | 'listen' | 'explain';
type MorphMesh = { dict: Record<string, number>; influences: number[] };
type Arm = {
  side: Side; upper: THREE.Bone; lower: THREE.Bone; hand: THREE.Bone; lowerTwist?: THREE.Bone; lowerTwistRest?: THREE.Quaternion;
  handRest: THREE.Quaternion; index: THREE.Bone[]; upperLength: number; lowerLength: number; handToTip: number; tipLength: number;
};
type Rig = {
  root: THREE.Group; bones: Map<string, THREE.Bone>; morphs: MorphMesh[]; mixer: THREE.AnimationMixer;
  actions: Partial<Record<Posture | 'acknowledge', THREE.AnimationAction>>;
  pointHand: Map<string, THREE.Quaternion>; arms: Partial<Record<Side, Arm>>; springs: SpringChain[];
  correctives: { mesh: MorphMesh; index: number; bone: THREE.Bone; rest: THREE.Quaternion; divisor: number }[];
  headRest: THREE.Quaternion; eyes: { bone: THREE.Bone; rest: THREE.Quaternion }[]; materials: THREE.Material[];
  /** Every bone's clip pose from the last mixer update (see the frame loop). */
  clipPose: { bone: THREE.Bone; quaternion: THREE.Quaternion }[];
};

const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const RIGHT = new THREE.Vector3(1, 0, 0);

function world(o: THREE.Object3D, out = new THREE.Vector3()) {
  return o.getWorldPosition(out);
}

/** A position rounded to 10 micrometres for the instrument sample. */
function rounded(v: THREE.Vector3) {
  return v.toArray().map(x => Math.round(x * 100000) / 100000) as [number, number, number];
}

function upgradeMaterial(mesh: THREE.Mesh, made: THREE.Material[]) {
  const src = mesh.material as THREE.MeshStandardMaterial;
  if (!src?.isMeshStandardMaterial) return;
  if (src.name.startsWith('KAIRO_Skin')) {
    // Soft, warm skin response: light sheen for a velvety rim instead of postprocessing.
    const skin = new THREE.MeshPhysicalMaterial({
      name: src.name, map: src.map, color: src.color.clone(), roughness: 0.56, metalness: 0,
      sheen: 0.35, sheenRoughness: 0.72, sheenColor: new THREE.Color(0.58, 0.33, 0.24), envMapIntensity: 0.85,
    });
    mesh.material = skin;
    made.push(skin);
  }
}

function buildRig(scene: THREE.Object3D, clips: THREE.AnimationClip[]): Rig {
  const root = SkeletonUtils.clone(scene) as THREE.Group;
  root.updateMatrixWorld(true);
  const bones = new Map<string, THREE.Bone>();
  const morphs: MorphMesh[] = [];
  const materials: THREE.Material[] = [];
  const morphByMesh = new Map<THREE.Mesh, MorphMesh>();
  root.traverse(o => {
    if ((o as THREE.Bone).isBone) bones.set(o.name, o as THREE.Bone);
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      upgradeMaterial(mesh, materials);
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const entry = { dict: mesh.morphTargetDictionary, influences: mesh.morphTargetInfluences };
        morphs.push(entry);
        morphByMesh.set(mesh, entry);
      }
    }
  });

  const mixer = new THREE.AnimationMixer(root);
  const actions: Rig['actions'] = {};
  for (const [key, name] of [['idle', CLIPS.idle], ['listen', CLIPS.listen], ['explain', CLIPS.explain], ['acknowledge', CLIPS.acknowledge]] as const) {
    const clip = THREE.AnimationClip.findByName(clips, name);
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    if (key === 'acknowledge') {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }
    actions[key] = action;
  }

  // Pointing hand: the authored HandPoint clip's finger rotations (constant), applied as an overlay.
  const pointHand = new Map<string, THREE.Quaternion>();
  const handClip = THREE.AnimationClip.findByName(clips, CLIPS.handPoint);
  for (const track of handClip?.tracks ?? []) {
    const [bone, prop] = track.name.split('.');
    if (prop === 'quaternion' && /^(thumb|index|middle|ring|pinky)_0[1-3]_[lr]$/.test(bone)) {
      pointHand.set(bone, new THREE.Quaternion().fromArray(track.values as unknown as number[], 0));
    }
  }

  const arms: Rig['arms'] = {};
  for (const side of ['l', 'r'] as const) {
    const n = armBones(side);
    const upper = bones.get(n.upper), lower = bones.get(n.lower), hand = bones.get(n.hand);
    const index = n.index.map(b => bones.get(b));
    const meta = bones.get(`index_metacarpal_${side}`);
    if (!upper || !lower || !hand || index.some(b => !b)) continue;
    const idx = index as THREE.Bone[];
    const chain = [hand, ...(meta ? [meta] : []), ...idx];
    let handToTip = 0;
    for (let i = 1; i < chain.length; i++) handToTip += world(chain[i - 1]).distanceTo(world(chain[i]));
    const tipLength = world(idx[1]).distanceTo(world(idx[2])) * 0.95;
    handToTip += tipLength;
    const lowerTwist = bones.get(n.lowerTwist);
    arms[side] = {
      side, upper, lower, hand, index: idx, lowerTwist, lowerTwistRest: lowerTwist?.quaternion.clone(), handRest: hand.quaternion.clone(),
      upperLength: world(upper).distanceTo(world(lower)), lowerLength: world(lower).distanceTo(world(hand)), handToTip, tipLength,
    };
  }

  const springs = HAIR_CHAINS.map(chain => {
    const list = chain.bones.map(b => bones.get(b)).filter((b): b is THREE.Bone => !!b);
    return list.length === chain.bones.length ? new SpringChain(list, chain.stiffness, chain.damping, chain.hang) : null;
  }).filter((s): s is SpringChain => !!s);

  const correctives: Rig['correctives'] = [];
  for (const side of ['l', 'r'] as const) {
    for (const c of fingerCorrectives(side)) {
      const bone = bones.get(c.bone);
      const mesh = morphs.find(m => m.dict[c.morph] !== undefined);
      if (bone && mesh) correctives.push({ mesh, index: mesh.dict[c.morph], bone, rest: bone.quaternion.clone(), divisor: c.divisor });
    }
  }

  const head = bones.get(BONES.head);
  const headRest = head ? head.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
  const eyes = BONES.eyes.map(n => bones.get(n)).filter((b): b is THREE.Bone => !!b)
    .map(bone => ({ bone, rest: bone.getWorldQuaternion(new THREE.Quaternion()) }));
  const clipPose = [...bones.values()].map(bone => ({ bone, quaternion: bone.quaternion.clone() }));
  return { root, bones, morphs, mixer, actions, pointHand, arms, springs, correctives, headRest, eyes, materials, clipPose };
}

type PointState = { id: string; side: Side; contact: boolean; started: number; held: number; done: boolean };
type ArmState = { weight: number; target: THREE.Vector3; normal: THREE.Vector3; seeded: boolean };

export default function TeacherCharacter(props: CharacterProps) {
  const url = props.url ?? TEACHER_ASSET.url;
  const gltf = useGLTF(url, false, true) as unknown as { scene: THREE.Object3D; animations: THREE.AnimationClip[] };
  const rig = useMemo(() => buildRig(gltf.scene, gltf.animations), [gltf]);
  const camera = useThree(s => s.camera);

  const latest = useRef(props);
  latest.current = props;
  const ledger = useMemo(() => new CueLedger(event => latest.current.onCueState(event)), []);
  const blink = useMemo(() => new BlinkClock(), []);
  const s = useRef({
    time: 0, posture: 'idle' as Posture, postureCue: null as null | { id: string; until: number },
    ack: null as null | { id: string }, point: null as PointState | null,
    arms: {
      l: { weight: 0, target: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1), seeded: false },
      r: { weight: 0, target: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1), seeded: false },
    } as Record<Side, ArmState>,
    gazeYaw: 0, gazePitch: 0, eyeYaw: 0, eyePitch: 0, saccadeYaw: 0, saccadePitch: 0, saccadeTimer: 0, torsoYaw: 0,
    weights: {} as Record<string, number>, target: {} as Record<string, number>,
    lastInstrument: 0, lastBlink: 0,
    pointReading: null as InstrumentSample['pointing'],
  });
  const [eyeYawQ, eyeGazeQ, eyeWorldQ, eyeParentQ] = useMemo(() => [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()], []);
  const scratch = useMemo(() => ({
    a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), e: new THREE.Vector3(),
    elbow: new THREE.Vector3(), wrist: new THREE.Vector3(), goal: new THREE.Vector3(), pole: new THREE.Vector3(), tip: new THREE.Vector3(),
    q: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion(), rootQ: new THREE.Quaternion(), rootInv: new THREE.Quaternion(),
    clipUpper: new THREE.Quaternion(), clipLower: new THREE.Quaternion(), clipHand: new THREE.Quaternion(), twist: new THREE.Quaternion(),
    gravity: new THREE.Vector3(), colliders: [] as Collider[], identity: new THREE.Quaternion(),
  }), []);

  // Start in the idle posture and report readiness once per rig.
  useEffect(() => {
    const action = rig.actions.idle;
    action?.reset().play();
    s.current.posture = 'idle';
    const ack = (event: { action: THREE.AnimationAction }) => {
      const st = s.current;
      if (st.ack && event.action === rig.actions.acknowledge) {
        ledger.finish(st.ack.id, 'completed');
        st.ack = null;
        fadeTo(st.posture);
      }
    };
    rig.mixer.addEventListener('finished', ack);
    const missing = [BONES.head, BONES.neck, ...BONES.spine].filter(n => !rig.bones.has(n));
    latest.current.onReady({
      assetId: url === TEACHER_ASSET.url ? TEACHER_ASSET.id : url,
      rigVersion: TEACHER_ASSET.rigVersion,
      capabilities: CAPABILITIES.filter(c => (c.startsWith('cue:point') || c.startsWith('point:') ? !!rig.arms.l && !!rig.arms.r : true)
        && (c !== 'hair:spring-chains' || rig.springs.length > 0) && (missing.length === 0 || !c.startsWith('gaze'))),
    });
    return () => {
      rig.mixer.removeEventListener('finished', ack);
      rig.mixer.stopAllAction();
      rig.materials.forEach(m => m.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig]);

  function fadeTo(next: Posture | 'acknowledge') {
    const duration = latest.current.reducedMotion ? 0.15 : 0.45;
    const incoming = rig.actions[next];
    if (!incoming) return;
    for (const [key, action] of Object.entries(rig.actions)) {
      if (action && key !== next && action.isRunning()) action.fadeOut(duration);
    }
    incoming.reset();
    incoming.setEffectiveWeight(1);
    incoming.fadeIn(duration).play();
  }

  // Cue handling: one accepted, one terminal event per id (see cues.ts).
  const cue = props.cue;
  useEffect(() => {
    const st = s.current;
    if (!ledger.begin(cue)) return;
    if (st.ack) st.ack = null;
    if (st.point && st.point.id !== cue.id) st.point = null;
    st.postureCue = null;
    switch (cue.type) {
      case 'idle':
      case 'listen':
      case 'explain':
        st.posture = cue.type;
        fadeTo(cue.type);
        ledger.acting(cue.id);
        st.postureCue = { id: cue.id, until: st.time + (latest.current.reducedMotion ? 0.15 : 0.45) };
        break;
      case 'acknowledge':
        if (!rig.actions.acknowledge) { ledger.finish(cue.id, 'unsupported', 'clip-missing'); break; }
        fadeTo('acknowledge');
        st.ack = { id: cue.id };
        ledger.acting(cue.id);
        break;
      case 'point': {
        const target = latest.current.targets.find(t => t.id === cue.targetId);
        if (!target) { ledger.finish(cue.id, 'unsupported', 'target-not-found'); break; }
        if (!rig.arms.l || !rig.arms.r) { ledger.finish(cue.id, 'unsupported', 'rig-missing-arm'); break; }
        const local = rig.root.worldToLocal(scratch.a.fromArray(target.position));
        const side: Side = local.x >= 0 ? 'l' : 'r';
        st.point = { id: cue.id, side, contact: cue.contact !== 'never', started: st.time, held: 0, done: false };
        if (rig.actions.acknowledge?.isRunning()) fadeTo(st.posture); // never point from a clip frozen on its last frame
        const armState = st.arms[side];
        if (armState.weight < 0.05) { armState.target.fromArray(target.position); armState.seeded = true; }
        ledger.acting(cue.id);
        break;
      }
      case 'move':
        ledger.finish(cue.id, 'unsupported', 'locomotion-not-delivered');
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue, rig]);

  /** Torso turn, pointing hand and two-bone IK for one arm, blended with the clip by `w`. Returns true when the
   *  fingertip is on target (contact distance) or the arm points along the ray (angle) within tolerance. */
  function pointArm(arm: Arm, targetPos: THREE.Vector3, normal: THREE.Vector3, w: number, contactAllowed: boolean, since: number, reduced: boolean) {
    const spine = rig.bones.get(BONES.spine[2]);
    const toTarget = scratch.b.copy(targetPos).sub(world(arm.upper, scratch.a)).applyQuaternion(scratch.rootInv);
    const yaw = THREE.MathUtils.clamp(Math.atan2(toTarget.x, toTarget.z) * 0.18, -0.18, 0.18) * w;
    if (spine) rotateBoneWorld(spine, scratch.q.setFromAxisAngle(scratch.c.copy(UP).applyQuaternion(scratch.rootQ), yaw));
    for (const [name, q] of rig.pointHand) {
      if (!name.endsWith('_' + arm.side)) continue;
      const bone = rig.bones.get(name);
      if (bone) bone.quaternion.slerp(q, w);
    }
    arm.hand.updateMatrixWorld(true);
    scratch.clipUpper.copy(arm.upper.quaternion);
    scratch.clipLower.copy(arm.lower.quaternion);
    scratch.clipHand.copy(arm.hand.quaternion);
    const shoulder = world(arm.upper, scratch.a);
    const toT = scratch.b.copy(targetPos).sub(shoulder);
    const dist = toT.length();
    toT.divideScalar(Math.max(dist, 1e-6));
    const reach = arm.upperLength + arm.lowerLength + arm.handToTip;
    const contact = contactAllowed && dist < reach * 0.93;
    const dirU = scratch.c;
    if (contact) {
      dirU.copy(toT).multiplyScalar(0.55).addScaledVector(normal, -0.45).normalize();
      const hover = THREE.MathUtils.lerp(0.07, 0.008, easeInOut((since - (reduced ? 0 : 0.55)) / (reduced ? 0.15 : 0.5)));
      scratch.goal.copy(targetPos).addScaledVector(normal, hover);
    } else {
      dirU.copy(toT);
      scratch.goal.copy(shoulder).addScaledVector(toT, reach * 0.86);
    }
    const wristGoal = scratch.d.copy(scratch.goal).addScaledVector(dirU, -arm.handToTip);
    const out = arm.side === 'l' ? 1 : -1;
    scratch.pole.set(0.45 * out, -0.9, -0.35).applyQuaternion(scratch.rootQ).add(shoulder);
    solveTwoBone(shoulder, arm.upperLength, arm.lowerLength, wristGoal, scratch.pole, scratch.elbow, scratch.wrist);
    aimBoneWorld(arm.upper, world(arm.lower, scratch.e), scratch.elbow);
    aimBoneWorld(arm.lower, world(arm.hand, scratch.e), scratch.wrist);
    const tip = indexTip(arm, scratch.tip, scratch.e);
    aimBoneWorld(arm.hand, tip, scratch.e.copy(world(arm.hand, scratch.e)).addScaledVector(dirU, arm.handToTip));
    arm.upper.quaternion.copy(scratch.q.copy(scratch.clipUpper).slerp(arm.upper.quaternion, w));
    arm.lower.quaternion.copy(scratch.q.copy(scratch.clipLower).slerp(arm.lower.quaternion, w));
    arm.hand.quaternion.copy(scratch.q.copy(scratch.clipHand).slerp(arm.hand.quaternion, w));
    arm.upper.updateMatrixWorld(true);
    const tipNow = indexTip(arm, scratch.tip, scratch.e);
    const tipToTarget = tipNow.distanceTo(targetPos);
    const rayAngle = scratch.e.copy(tipNow).sub(shoulder).normalize().angleTo(toT);
    s.current.pointReading = {
      side: arm.side, weight: w, mode: contact ? 'contact' : 'ray', tip: tipNow.toArray() as [number, number, number],
      target: targetPos.toArray() as [number, number, number], tipToTargetM: Math.round(tipToTarget * 10000) / 10000,
      rayAngleDeg: Math.round(THREE.MathUtils.radToDeg(rayAngle) * 100) / 100,
    };
    return contact ? tipToTarget < 0.035 : rayAngle < THREE.MathUtils.degToRad(5);
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = s.current;
    const p = latest.current;
    const reduced = p.reducedMotion;
    const audio = readAudio(p.audio);
    const speaking = audio.playing && !audio.paused;
    st.time += dt;

    for (const key of ['idle', 'listen', 'explain'] as const) {
      const a = rig.actions[key];
      if (a) a.timeScale = reduced ? 0 : 1;
    }
    // The mixer only writes a bone whose mixed value changed since its last update, so a constant or frozen
    // (reduced motion) track would keep last frame's gaze, IK and spring rotations and they would pile up. Restore
    // the clip pose first so every layer below starts from the clip.
    for (const b of rig.clipPose) b.bone.quaternion.copy(b.quaternion);
    rig.mixer.update(dt);
    for (const b of rig.clipPose) b.quaternion.copy(b.bone.quaternion);
    rig.root.updateMatrixWorld(true);
    rig.root.getWorldQuaternion(scratch.rootQ);
    scratch.rootInv.copy(scratch.rootQ).invert();

    // ---- posture completion
    if (st.postureCue && st.time >= st.postureCue.until) {
      ledger.finish(st.postureCue.id, 'completed');
      st.postureCue = null;
    }

    // ---- pointing: each arm has its own weight and smoothed target, so a new target or side blends from the
    // current pose instead of snapping.
    let target: Target | undefined;
    if (st.point && p.cue.type === 'point') {
      const wanted = p.cue.targetId;
      target = p.targets.find(t => t.id === wanted);
    }
    let lookTarget: THREE.Vector3 | null = null;
    st.pointReading = null;
    for (const side of ['l', 'r'] as const) {
      const arm = rig.arms[side];
      const as = st.arms[side];
      const active = !!(st.point && target && st.point.side === side);
      if (active && target) {
        const raw = scratch.goal.fromArray(target.position);
        if (!as.seeded) { as.target.copy(raw); as.seeded = true; }
        as.target.lerp(raw, 1 - Math.exp(-(reduced ? 40 : 7) * dt));
        if (target.normal) as.normal.fromArray(target.normal).normalize();
        else as.normal.copy(world(rig.bones.get(BONES.head)!, scratch.a)).sub(as.target).normalize();
      }
      const rate = reduced ? 1 / 0.15 : active ? 1 / 0.7 : 1 / 0.45;
      as.weight = active ? Math.min(1, as.weight + dt * rate) : Math.max(0, as.weight - dt * rate);
      if (as.weight <= 0.001) {
        if (!active) as.seeded = false;
        continue;
      }
      if (!arm) continue;
      const w = easeInOut(as.weight);
      if (active) lookTarget = as.target;
      const since = st.point && active ? st.time - st.point.started : 1;
      const onTarget = pointArm(arm, as.target, as.normal, w, active && !!st.point?.contact, since, reduced);
      if (active && st.point && !st.point.done && as.weight >= 1) {
        st.point.held = onTarget ? st.point.held + dt : 0;
        if (st.point.held > 0.12 || (reduced && onTarget)) {
          st.point.done = true;
          ledger.finish(st.point.id, 'completed');
        }
      }
    }

    // ---- forearm twist: half of the hand's twist about the forearm goes to the twist bone
    for (const side of ['l', 'r'] as const) {
      const a = rig.arms[side];
      if (!a?.lowerTwist || !a.lowerTwistRest) continue;
      const axis = scratch.a.copy(a.hand.position).normalize();
      const deltaQ = scratch.q.copy(a.hand.quaternion).multiply(scratch.q2.copy(a.handRest).invert());
      twistAbout(deltaQ, axis, scratch.twist);
      a.lowerTwist.quaternion.copy(scratch.q3.copy(scratch.identity).slerp(scratch.twist, 0.5).multiply(a.lowerTwistRest));
    }

    // ---- gaze: head and neck (additive on the clip), then eyes with small saccades
    const head = rig.bones.get(BONES.head);
    const neck = rig.bones.get(BONES.neck);
    if (head && neck) {
      const look = scratch.a;
      if (lookTarget) look.copy(lookTarget);
      else if (p.lookAt && p.lookAt !== 'camera') look.fromArray(p.lookAt);
      else camera.getWorldPosition(look);
      const headPos = world(head, scratch.b);
      const dir = scratch.c.copy(look).sub(headPos).applyQuaternion(scratch.rootInv).normalize();
      const yaw = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z), -0.7, 0.7); // ~40 deg: eyes cover the rest, collar stays clear
      const pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)), -0.45, 0.35);
      const lambda = reduced ? 30 : 4.5;
      st.gazeYaw = damp(st.gazeYaw, yaw, lambda, dt);
      st.gazePitch = damp(st.gazePitch, pitch, lambda, dt);
      const nod = speaking && !reduced ? -audio.energy * 0.05 : 0;
      for (const [bone, share] of [[neck, 0.3], [head, 0.7]] as const) {
        const upW = scratch.d.copy(UP).applyQuaternion(scratch.rootQ);
        scratch.q.setFromAxisAngle(upW, st.gazeYaw * share);
        const rightW = scratch.e.copy(RIGHT).applyQuaternion(scratch.rootQ).applyQuaternion(scratch.q);
        scratch.q2.setFromAxisAngle(rightW, -(st.gazePitch + nod) * share);
        rotateBoneWorld(bone, scratch.q2.multiply(scratch.q));
      }
      // Eyes: aim within the head's frame, leading the head.
      if (!reduced) {
        st.saccadeTimer -= dt;
        if (st.saccadeTimer <= 0) {
          st.saccadeTimer = 0.5 + Math.random() * 1.6;
          const calm = st.point ? 0.3 : 1;
          st.saccadeYaw = (Math.random() - 0.5) * 0.06 * calm;
          st.saccadePitch = (Math.random() - 0.5) * 0.035 * calm;
        }
      } else {
        st.saccadeYaw = st.saccadePitch = 0;
      }
      // Eyes: aim in the head's rest frame (character space), leading the head.
      head.getWorldQuaternion(scratch.q);
      scratch.q2.copy(scratch.q).multiply(scratch.q3.copy(rig.headRest).invert()); // world <- character rest frame
      const toRest = scratch.q3.copy(scratch.q2).invert();
      for (const eye of rig.eyes) {
        const d = scratch.c.copy(look).sub(world(eye.bone, scratch.b)).applyQuaternion(toRest).normalize();
        const ey = THREE.MathUtils.clamp(Math.atan2(d.x, d.z), -0.42, 0.42) + st.saccadeYaw;
        const ep = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)), -0.3, 0.28) + st.saccadePitch;
        st.eyeYaw = damp(st.eyeYaw, ey, reduced ? 40 : 16, dt);
        st.eyePitch = damp(st.eyePitch, ep, reduced ? 40 : 16, dt);
        const yawQ = eyeYawQ.setFromAxisAngle(UP, st.eyeYaw);
        const pitchAxis = scratch.e.copy(RIGHT).applyQuaternion(yawQ);
        const gaze = eyeGazeQ.setFromAxisAngle(pitchAxis, -st.eyePitch).multiply(yawQ);
        const eyeWorld = eyeWorldQ.copy(scratch.q2).multiply(gaze).multiply(eye.rest);
        eye.bone.parent!.getWorldQuaternion(eyeParentQ).invert();
        eye.bone.quaternion.copy(eyeParentQ.multiply(eyeWorld));
        eye.bone.updateMatrixWorld(true);
      }
    }

    // ---- hair springs (secondary motion); off in reduced motion
    if (!reduced && rig.springs.length && head) {
      const cols = scratch.colliders;
      cols.length = 0;
      const neckPos = neck ? world(neck, new THREE.Vector3()) : world(head, new THREE.Vector3());
      cols.push({ centre: neckPos.clone().addScaledVector(scratch.b.copy(FORWARD).applyQuaternion(scratch.rootQ), -0.02), radius: 0.065 });
      const upperBack = rig.bones.get(BONES.spine[2]);
      if (upperBack) cols.push({ centre: world(upperBack, new THREE.Vector3()).addScaledVector(scratch.b.copy(FORWARD).applyQuaternion(scratch.rootQ), -0.02), radius: 0.12 });
      cols.push({ centre: world(head, new THREE.Vector3()).addScaledVector(scratch.b.copy(UP).applyQuaternion(scratch.rootQ), 0.09), radius: 0.095 });
      // Shoulders and cheeks: the hanging locs and face-framing locs must stay outside both.
      for (const side of ['l', 'r'] as const) {
        const shoulder = rig.bones.get(`upperarm_${side}`);
        if (shoulder) cols.push({ centre: world(shoulder, new THREE.Vector3()).addScaledVector(scratch.b.copy(UP).applyQuaternion(scratch.rootQ), 0.03), radius: 0.075 });
      }
      head.getWorldQuaternion(scratch.q).multiply(scratch.q2.copy(rig.headRest).invert());
      for (const sx of [1, -1]) {
        const offset = scratch.b.set(0.058 * sx, 0.05, 0.09).applyQuaternion(scratch.q);
        cols.push({ centre: world(head, new THREE.Vector3()).add(offset), radius: 0.05 });
      }
      scratch.gravity.set(0, -2.2, 0);
      for (const spring of rig.springs) spring.update(dt, cols, scratch.gravity);
    } else {
      for (const spring of rig.springs) spring.reset();
    }

    // ---- finger correctives (Rain's drivers: flexion / divisor)
    for (const c of rig.correctives) {
      c.mesh.influences[c.index] = THREE.MathUtils.clamp(angleFromRest(c.rest, c.bone.quaternion) / c.divisor, 0, 1);
    }

    // ---- face: expression + cue overlays + mouth + blink, smoothed
    const tgt = st.target;
    for (const k in tgt) tgt[k] = 0;
    const preset = EXPRESSIONS[p.expression] ?? EXPRESSIONS.neutral;
    for (const k in preset) tgt[k] = preset[k];
    if (st.ack) {
      tgt.mouthSmileLeft = (tgt.mouthSmileLeft ?? 0) + 0.3;
      tgt.mouthSmileRight = (tgt.mouthSmileRight ?? 0) + 0.3;
      tgt.browOuterUpLeft = (tgt.browOuterUpLeft ?? 0) + 0.2;
      tgt.browOuterUpRight = (tgt.browOuterUpRight ?? 0) + 0.2;
    }
    if (st.posture === 'listen' && !speaking) {
      tgt.browInnerUpLeft = (tgt.browInnerUpLeft ?? 0) + 0.12;
      tgt.browInnerUpRight = (tgt.browInnerUpRight ?? 0) + 0.12;
    }
    if (speaking) {
      for (const k of ['mouthSmileLeft', 'mouthSmileRight', 'mouthUpperUp', 'mouthLowerDown', 'jawOpen']) if (tgt[k]) tgt[k] *= 0.55;
      if (audio.visemes && audio.visemes.length) visemeWeights(audio.visemes, audio.time, tgt);
      else amplitudeWeights(audio.energy, tgt);
      if (!reduced) {
        tgt.browOuterUpLeft = (tgt.browOuterUpLeft ?? 0) + audio.energy * 0.18;
        tgt.browOuterUpRight = (tgt.browOuterUpRight ?? 0) + audio.energy * 0.18;
      }
    }
    const weights = st.weights;
    for (const k in tgt) {
      const mouth = k.startsWith('mouth') || k === 'jawOpen';
      weights[k] = damp(weights[k] ?? 0, Math.min(1, tgt[k]), mouth ? 24 : 7, dt);
    }
    const b = blink.update(dt, speaking);
    st.lastBlink = Math.max(st.lastBlink, b);
    for (const m of rig.morphs) {
      for (const name in m.dict) {
        if (name.startsWith('cor_')) continue;
        let v = weights[name] ?? 0;
        if (name === 'eyeBlinkLeft' || name === 'eyeBlinkRight') v = Math.max(v, b);
        m.influences[m.dict[name]] = v;
      }
    }

    if (p.instrument && st.time - st.lastInstrument >= 0.25) {
      st.lastInstrument = st.time;
      const headPos = head ? world(head, scratch.a) : scratch.a.set(0, 0, 0);
      const hands: InstrumentSample['hands'] = {};
      for (const side of ['l', 'r'] as const) {
        const arm = rig.arms[side];
        if (arm) hands[side] = { wrist: rounded(world(arm.hand, scratch.b)), indexTip: rounded(indexTip(arm, scratch.tip, scratch.e)) };
      }
      p.instrument({
        time: Math.round(st.time * 1000) / 1000,
        pointing: st.pointReading,
        gaze: { yawDeg: Math.round(THREE.MathUtils.radToDeg(st.gazeYaw) * 10) / 10, pitchDeg: Math.round(THREE.MathUtils.radToDeg(st.gazePitch) * 10) / 10 },
        head: rounded(headPos),
        hands,
        mouth: { jawOpen: Math.round((weights.jawOpen ?? 0) * 1000) / 1000, open: Math.round(((weights.jawOpen ?? 0) + (weights.mouthLowerDown ?? 0) + (weights.mouthPucker ?? 0)) * 1000) / 1000 },
        blink: Math.round(st.lastBlink * 1000) / 1000,
        springs: !reduced && rig.springs.length > 0,
      });
      st.lastBlink = 0;
    }
  });

  return <primitive object={rig.root} dispose={null} />;
}

/** World position of the index fingertip (last joint continued by its own segment direction). */
function indexTip(arm: Arm, out: THREE.Vector3, tmp: THREE.Vector3) {
  const [, i2, i3] = arm.index;
  world(i3, out);
  world(i2, tmp);
  const dir = tmp.sub(out).multiplyScalar(-1).normalize();
  return out.addScaledVector(dir, arm.tipLength);
}

useGLTF.preload(TEACHER_ASSET.url, false, true);
