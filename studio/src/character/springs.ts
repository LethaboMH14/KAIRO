// Spring chains for the hanging locs. Each bone tip is a damped particle pulled toward a rest target (its animated,
// head-relative position blended toward hanging straight down by `hang`), kept at bone length from the previous tip
// and pushed out of collision spheres; bones are then aimed at the simulated tips. Callers skip the update entirely
// in reduced motion.
import { Vector3, type Bone } from 'three';
import { aimBoneWorld } from './ik.ts';

export type Collider = { centre: Vector3; radius: number };

type Link = { bone: Bone; length: number; localTip: Vector3; restTip: Vector3; tip: Vector3; prev: Vector3; aimFrom: Vector3 };

const STEP = 1 / 60;
const _origin = new Vector3();
const _vel = new Vector3();
const _offset = new Vector3();
const _hang = new Vector3();

export class SpringChain {
  private readonly links: Link[];
  private readonly stiffness: number;
  private readonly damping: number;
  private readonly hang: number;
  private initialised = false;
  private accumulator = 0;

  constructor(bones: Bone[], stiffness: number, damping: number, hang = 0) {
    this.stiffness = stiffness;
    this.damping = damping;
    this.hang = hang;
    this.links = bones.map((bone, i) => {
      const next = bones[i + 1];
      // Tip in the bone's local space: the next bone's origin, or the last bone continued by its own offset length.
      const localTip = next ? next.position.clone() : bone.position.clone().normalize().multiplyScalar(Math.max(0.06, bone.position.length()));
      return { bone, length: localTip.length(), localTip, restTip: new Vector3(), tip: new Vector3(), prev: new Vector3(), aimFrom: new Vector3() };
    });
  }

  reset() {
    this.initialised = false;
    this.accumulator = 0;
  }

  /** Call after the animated pose is applied and world matrices are current (hair bones untouched this frame). */
  update(dt: number, colliders: readonly Collider[], gravity: Vector3) {
    for (const link of this.links) link.restTip.copy(link.localTip).applyMatrix4(link.bone.matrixWorld);
    const root = this.links[0].bone.getWorldPosition(_origin).clone();
    if (!this.initialised) {
      for (const link of this.links) { link.tip.copy(link.restTip); link.prev.copy(link.restTip); }
      this.initialised = true;
    }
    this.accumulator = Math.min(this.accumulator + dt, 0.1);
    while (this.accumulator >= STEP) {
      this.accumulator -= STEP;
      for (let i = 0; i < this.links.length; i++) {
        const link = this.links[i];
        const origin = i === 0 ? root : this.links[i - 1].tip;
        _vel.copy(link.tip).sub(link.prev).multiplyScalar(this.damping);
        link.prev.copy(link.tip);
        link.tip.add(_vel).addScaledVector(gravity, STEP * STEP);
        // Rest target: head-relative pose, partly straightened toward hanging down (hair does not turn rigidly with
        // the head, so it no longer sweeps through the shoulders on large head turns).
        _hang.copy(gravity).normalize().multiplyScalar(link.length).add(origin);
        _hang.lerp(link.restTip, 1 - this.hang);
        link.tip.lerp(_hang, this.stiffness);
        for (const c of colliders) {
          _offset.copy(link.tip).sub(c.centre);
          const d = _offset.length();
          if (d < c.radius && d > 1e-6) link.tip.copy(c.centre).addScaledVector(_offset, c.radius / d);
        }
        _offset.copy(link.tip).sub(origin);
        if (_offset.lengthSq() > 1e-10) link.tip.copy(origin).addScaledVector(_offset.normalize(), link.length);
      }
    }
    for (const link of this.links) {
      link.aimFrom.copy(link.localTip).applyMatrix4(link.bone.matrixWorld);
      aimBoneWorld(link.bone, link.aimFrom, link.tip, 1);
    }
  }
}
