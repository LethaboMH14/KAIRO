// Verification for the KAIRO teaching character runtime (CHARACTER-002).
// Run from the project root:  node --test docs/character/checks/
// Node strips the TypeScript types, so these tests exercise the studio's own modules and the deployed GLB.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from '../../../studio/node_modules/three/build/three.module.js';
import { angleFromRest, solveTwoBone, twistAbout, easeInOut, damp } from '../../../studio/src/character/ik.ts';
import { CueLedger } from '../../../studio/src/character/cues.ts';
import { BlinkClock, amplitudeWeights, visemeIndex, visemeWeights } from '../../../studio/src/character/face.ts';
import { BONES, CLIPS, EXPRESSIONS, HAIR_CHAINS, VISEMES, armBones, fingerCorrectives } from '../../../studio/src/character/rig.ts';
import { SpringChain } from '../../../studio/src/character/springs.ts';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function glbJson(path) {
  const data = readFileSync(new URL(path, import.meta.url));
  const length = data.readUInt32LE(12);
  return JSON.parse(data.subarray(20, 20 + length).toString('utf8'));
}

test('two-bone IK keeps segment lengths and reaches a reachable goal', () => {
  const root = V(0, 1.25, 0), goal = V(0.25, 1.0, 0.2), pole = V(0.1, 0.2, -0.5);
  const elbow = new THREE.Vector3(), wrist = new THREE.Vector3();
  const r = solveTwoBone(root, 0.205, 0.21, goal, pole, elbow, wrist);
  assert.equal(r.reachable, true);
  assert.ok(Math.abs(elbow.distanceTo(root) - 0.205) < 1e-6);
  assert.ok(Math.abs(elbow.distanceTo(wrist) - 0.21) < 1e-6);
  assert.ok(wrist.distanceTo(goal) < 1e-6);
});

test('two-bone IK straightens toward an unreachable goal without overshooting', () => {
  const root = V(0, 0, 0), goal = V(2, 0, 0), pole = V(0, -1, 0);
  const elbow = new THREE.Vector3(), wrist = new THREE.Vector3();
  const r = solveTwoBone(root, 0.3, 0.3, goal, pole, elbow, wrist);
  assert.equal(r.reachable, false);
  assert.ok(wrist.length() <= 0.6 + 1e-6);
  assert.ok(wrist.clone().normalize().distanceTo(V(1, 0, 0)) < 1e-3, 'points along the ray to the goal');
});

test('the elbow bends toward the pole side', () => {
  const root = V(0, 0, 0), goal = V(0.4, 0, 0);
  const elbow = new THREE.Vector3(), wrist = new THREE.Vector3();
  solveTwoBone(root, 0.3, 0.3, goal, V(0.2, -1, 0), elbow, wrist);
  assert.ok(elbow.y < 0);
  solveTwoBone(root, 0.3, 0.3, goal, V(0.2, 1, 0), elbow, wrist);
  assert.ok(elbow.y > 0);
});

test('twist extraction returns only the rotation about the axis', () => {
  const axis = V(1, 0, 0);
  const twist = new THREE.Quaternion().setFromAxisAngle(axis, 0.6);
  const swing = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), 0.4);
  const combined = swing.clone().multiply(twist);
  const out = twistAbout(combined, axis, new THREE.Quaternion());
  assert.ok(Math.abs(angleFromRest(new THREE.Quaternion(), out) - 0.6) < 0.08);
});

test('angleFromRest and easing helpers behave', () => {
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), 1.0);
  assert.ok(Math.abs(angleFromRest(new THREE.Quaternion(), q) - 1.0) < 1e-6);
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.ok(Math.abs(damp(0, 1, 5, 10) - 1) < 1e-6);
});

test('cue ledger: one accepted and one terminal event per id; new cues interrupt unfinished ones', () => {
  const log = [];
  const ledger = new CueLedger(e => log.push(`${e.id}:${e.state}`));
  assert.equal(ledger.begin({ id: 'a', type: 'listen' }), true);
  ledger.acting('a');
  ledger.acting('a');
  assert.equal(ledger.begin({ id: 'a', type: 'listen' }), false, 'repeated active id is ignored');
  ledger.begin({ id: 'b', type: 'point', targetId: 'x' });
  assert.equal(ledger.finish('a', 'completed'), false, 'an interrupted cue cannot complete later');
  ledger.finish('b', 'completed');
  ledger.finish('b', 'completed');
  ledger.begin({ id: 'c', type: 'move', anchorId: 'y' });
  ledger.finish('c', 'unsupported', 'locomotion-not-delivered');
  assert.equal(ledger.begin({ id: 'b', type: 'idle' }), false, 'a finished id is never restarted');
  // The unfinished cue ends before the new one is accepted.
  assert.deepEqual(log, ['a:accepted', 'a:acting', 'a:interrupted', 'b:accepted', 'b:completed', 'c:accepted', 'c:unsupported']);
});

test('viseme lookup finds the active cue and cross-fades from the previous one', () => {
  const v = [{ at: 0, shape: 'X', weight: 1 }, { at: 0.2, shape: 'D', weight: 1 }, { at: 0.5, shape: 'A', weight: 1, end: 0.6 }];
  assert.equal(visemeIndex(v, -1), -1);
  assert.equal(visemeIndex(v, 0.25), 1);
  const mid = {};
  visemeWeights(v, 0.235, mid, 0.07);
  assert.ok(mid.jawOpen > 0 && mid.jawOpen < VISEMES.D.jawOpen, 'part-way into D');
  const full = {};
  visemeWeights(v, 0.4, full, 0.07);
  assert.ok(Math.abs(full.jawOpen - VISEMES.D.jawOpen) < 1e-9);
  const after = {};
  assert.equal(visemeWeights(v, 2, after), null, 'nothing after the last cue ends');
});

test('amplitude fallback stays bounded', () => {
  const out = {};
  amplitudeWeights(5, out);
  assert.ok(out.jawOpen <= 0.42 + 1e-9);
});

test('blink clock: blinks last about 0.2 s and come 1.8-6 s apart', () => {
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const clock = new BlinkClock(random);
  const dt = 1 / 120;
  const closures = [];
  let open = true, start = 0;
  for (let i = 0; i < 120 * 60; i++) {
    const w = clock.update(dt, false);
    if (open && w > 0.5) { open = false; start = i * dt; }
    if (!open && w < 0.5) { open = true; closures.push({ start, dur: i * dt - start }); }
  }
  assert.ok(closures.length >= 8 && closures.length <= 30, `${closures.length} blinks per minute`);
  for (const c of closures) assert.ok(c.dur > 0.05 && c.dur < 0.3, `closure ${c.dur}`);
});

test('spring chain settles on its rest pose without drifting', () => {
  const root = new THREE.Bone(); root.position.set(0, 1.5, 0);
  const a = new THREE.Bone(); a.position.set(0, 0, 0); root.add(a);
  const b = new THREE.Bone(); b.position.set(0, -0.1, 0); a.add(b);
  const c = new THREE.Bone(); c.position.set(0, -0.1, 0); b.add(c);
  root.updateMatrixWorld(true);
  const chain = new SpringChain([a, b, c], 0.12, 0.86, 0.45);
  const tip = () => c.getWorldPosition(new THREE.Vector3());
  const start = tip();
  for (let i = 0; i < 600; i++) {
    for (const bone of [a, b, c]) bone.quaternion.identity();
    root.updateMatrixWorld(true);
    chain.update(1 / 60, [], V(0, -2.2, 0));
  }
  assert.ok(tip().distanceTo(start) < 0.02, `tip drift ${tip().distanceTo(start)}`);
});

const glb = glbJson('../../../studio/public/models/character/kairo-teacher.glb');

test('deployed GLB contains every bone the runtime drives', () => {
  const names = new Set(glb.nodes.map(n => n.name));
  const wanted = [BONES.pelvis, ...BONES.spine, BONES.neck, BONES.head, ...BONES.eyes,
    ...['l', 'r'].flatMap(s => Object.values(armBones(s)).flat()), ...HAIR_CHAINS.flatMap(c => c.bones)];
  const missing = wanted.filter(n => !names.has(n));
  assert.deepEqual(missing, []);
  assert.ok(glb.skins.every(s => s.joints.length === 77), 'every skin binds the 77-joint skeleton');
});

test('deployed GLB contains every face shape, viseme shape and corrective the runtime writes', () => {
  const targets = new Set(glb.meshes.flatMap(m => m.extras?.targetNames ?? []));
  const face = [...new Set([...Object.values(EXPRESSIONS).flatMap(Object.keys), ...Object.values(VISEMES).flatMap(Object.keys), 'eyeBlinkLeft', 'eyeBlinkRight'])];
  assert.deepEqual(face.filter(n => !targets.has(n)), []);
  const cor = ['l', 'r'].flatMap(s => fingerCorrectives(s).map(c => c.morph));
  assert.deepEqual(cor.filter(n => !targets.has(n)), []);
});

test('deployed GLB contains the authored clips and no stray Blender actions', () => {
  const clips = glb.animations.map(a => a.name).sort();
  assert.deepEqual(clips, Object.values(CLIPS).sort());
});

test('every textured primitive in the deployed GLB has the UVs its material samples', () => {
  for (const mesh of glb.meshes) {
    for (const p of mesh.primitives) {
      const mat = glb.materials[p.material];
      const tex = mat?.pbrMetallicRoughness?.baseColorTexture;
      if (tex) assert.ok(`TEXCOORD_${tex.texCoord ?? 0}` in p.attributes, `${mesh.name} ${mat.name}`);
    }
  }
});

test('shipped viseme timings use only shapes the runtime maps, in time order', () => {
  for (const voice of ['en-GB-Chirp3-HD-Aoede', 'en-GB-Chirp3-HD-Puck', 'en-US-Chirp3-HD-Kore']) {
    const data = JSON.parse(readFileSync(new URL(`../../../studio/public/models/character/audio/${voice}.visemes.json`, import.meta.url), 'utf8'));
    assert.ok(data.visemes.length > 20);
    for (let i = 0; i < data.visemes.length; i++) {
      assert.ok(data.visemes[i].shape in VISEMES, data.visemes[i].shape);
      if (i) assert.ok(data.visemes[i].at >= data.visemes[i - 1].at);
    }
  }
});
