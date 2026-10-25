// Small, allocation-free rig math for the teaching character: two-bone IK, world-space aiming and twist extraction.
import { Quaternion, Vector3, type Object3D } from 'three';

export type TwoBoneResult = { reachable: boolean; distance: number };

const _dir = new Vector3();
const _bend = new Vector3();

/**
 * Places the middle joint of a two-bone chain rooted at `root` so the end reaches toward `goal`, bending toward `pole`.
 * Segment lengths are preserved; an unreachable goal yields a straight chain pointing at it.
 */
export function solveTwoBone(root: Vector3, upperLength: number, lowerLength: number, goal: Vector3, pole: Vector3,
  outMiddle: Vector3, outEnd: Vector3): TwoBoneResult {
  _dir.copy(goal).sub(root);
  const distance = _dir.length();
  if (distance > 1e-6) _dir.divideScalar(distance); else _dir.set(0, -1, 0);
  const maxReach = (upperLength + lowerLength) * 0.9995;
  const minReach = Math.abs(upperLength - lowerLength) + 1e-4;
  const d = Math.min(Math.max(distance, minReach), maxReach);
  const along = (upperLength * upperLength - lowerLength * lowerLength + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(0, upperLength * upperLength - along * along));
  _bend.copy(pole).sub(root);
  _bend.addScaledVector(_dir, -_bend.dot(_dir));
  if (_bend.lengthSq() < 1e-10) {
    _bend.set(0, -1, 0).addScaledVector(_dir, _dir.y);
    if (_bend.lengthSq() < 1e-10) _bend.set(0, 0, 1);
  }
  _bend.normalize();
  outMiddle.copy(root).addScaledVector(_dir, along).addScaledVector(_bend, height);
  outEnd.copy(root).addScaledVector(_dir, d);
  return { reachable: distance <= maxReach && distance >= minReach, distance };
}

const _origin = new Vector3();
const _from = new Vector3();
const _to = new Vector3();
const _delta = new Quaternion();
const _world = new Quaternion();
const _parent = new Quaternion();
const _identity = new Quaternion();

/**
 * Rotates `bone` by the smallest world-space arc that turns the ray origin->`fromPoint` toward origin->`toPoint`,
 * scaled by `weight`. Keeps the bone's world position; children follow. Parent world matrices must be current.
 */
export function aimBoneWorld(bone: Object3D, fromPoint: Vector3, toPoint: Vector3, weight = 1) {
  if (weight <= 0 || !bone.parent) return;
  bone.getWorldPosition(_origin);
  _from.copy(fromPoint).sub(_origin);
  _to.copy(toPoint).sub(_origin);
  if (_from.lengthSq() < 1e-12 || _to.lengthSq() < 1e-12) return;
  _delta.setFromUnitVectors(_from.normalize(), _to.normalize());
  if (weight < 1) _delta.slerp(_identity, 1 - weight);
  rotateBoneWorld(bone, _delta);
}

/** Applies a world-space rotation to a bone about its own origin and refreshes its subtree. */
export function rotateBoneWorld(bone: Object3D, worldDelta: Quaternion) {
  if (!bone.parent) return;
  bone.getWorldQuaternion(_world);
  _world.premultiply(worldDelta);
  bone.parent.getWorldQuaternion(_parent).invert();
  bone.quaternion.copy(_parent.multiply(_world));
  bone.updateMatrixWorld(true);
}

/** Twist part of `q` about unit `axis` (swing-twist decomposition). */
export function twistAbout(q: Quaternion, axis: Vector3, out: Quaternion) {
  const d = q.x * axis.x + q.y * axis.y + q.z * axis.z;
  out.set(axis.x * d, axis.y * d, axis.z * d, q.w);
  const len = out.length();
  if (len < 1e-9) out.identity(); else out.set(out.x / len, out.y / len, out.z / len, out.w / len);
  return out;
}

/** Total rotation angle (radians) of `current` relative to `rest`. */
export function angleFromRest(rest: Quaternion, current: Quaternion) {
  const dot = Math.abs(rest.x * current.x + rest.y * current.y + rest.z * current.z + rest.w * current.w);
  return 2 * Math.acos(Math.min(1, dot));
}

export function easeInOut(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Frame-rate independent exponential approach. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return target + (current - target) * Math.exp(-lambda * dt);
}
