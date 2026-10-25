// KAIRO chest badge for Rain, added at runtime without changing the character GLB. The chest patch
// (rainBadge.json, from design/brand-master-20261023/tools/rain_badge.mjs for kairo-teacher.glb build 6) carries
// bind-pose positions and skin weights taken from the shirt; the master symbol outline is triangulated onto it, so
// the badge is opaque, crisp at any distance and deforms with the fabric. Flat one-colour chalk (BRAND-DECISION).
import * as THREE from 'three';
import { SYMBOL } from '../brand/markArt.ts';
import { badgeData, pathRings } from './badgeMesh.ts';
import patch from './rainBadge.json';

export const BADGE_ASSET_SHA256 = patch.asset.sha256;

/** Adds the badge next to Rain's shirt and returns a disposer, or null when the rig does not match the patch. */
export function attachShirtBadge(scene: THREE.Object3D): (() => void) | null {
  let shirt: THREE.SkinnedMesh | null = null;
  scene.traverse(o => {
    if (!shirt && (o as THREE.SkinnedMesh).isSkinnedMesh && o.name === patch.meshName) shirt = o as THREE.SkinnedMesh;
  });
  const target = shirt as THREE.SkinnedMesh | null;
  if (!target?.parent) return null;
  const byName = new Map(target.skeleton.bones.map((b, i) => [b.name, i]));
  const remap = patch.jointNames.map(name => byName.get(name));
  if (remap.some(i => i === undefined)) return null;

  const data = badgeData(pathRings(SYMBOL.d), SYMBOL.ink, patch);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from(data.skinIndex, i => remap[i] as number), 4));
  geometry.setAttribute('skinWeight', new THREE.BufferAttribute(data.skinWeight, 4));
  geometry.setIndex(data.index);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: '#F5F0E6', roughness: 0.92, metalness: 0, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const badge = new THREE.SkinnedMesh(geometry, material);
  badge.name = 'KAIRO_ShirtBadge';
  badge.frustumCulled = false;
  badge.position.copy(target.position);
  badge.quaternion.copy(target.quaternion);
  badge.scale.copy(target.scale);
  target.parent.add(badge);
  badge.bind(target.skeleton, target.bindMatrix);
  return () => {
    badge.removeFromParent();
    geometry.dispose();
    material.dispose();
  };
}
