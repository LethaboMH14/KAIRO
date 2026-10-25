// Asset checks for the Engineering Studio motor (ENG-001).
// Parses the shipped GLB itself, so the part-ID mapping is checked against the
// binary the browser loads, not just the generated manifest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { PART_IDS, PARTS } from '../../../studio/src/engineering/motorContent.ts';

const root = new URL('../../../', import.meta.url);
const glbBytes = readFileSync(new URL('studio/public/models/engineering/induction-motor.glb', root));
const geometry = JSON.parse(readFileSync(new URL('studio/src/engineering/motorGeometry.json', root), 'utf8'));

function readGlbJson(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'glTF magic');
  assert.equal(bytes.readUInt32LE(4), 2, 'glTF version 2');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'declared length');
  const chunkLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a, 'first chunk is JSON');
  return JSON.parse(bytes.subarray(20, 20 + chunkLength).toString('utf8'));
}

const gltf = readGlbJson(glbBytes);
const nodes = gltf.nodes.filter(node => node.extras?.kairo_part);

test('manifest hash matches the shipped GLB', () => {
  assert.equal(createHash('sha256').update(glbBytes).digest('hex'), geometry.glbSha256);
});

test('every lesson part has meshes in the GLB, and nothing else is selectable', () => {
  const partsInGlb = new Set(nodes.map(node => node.extras.kairo_part));
  assert.deepEqual([...partsInGlb].sort(), [...PART_IDS].sort());
  assert.equal(PARTS.length, PART_IDS.length);
  assert.deepEqual(PARTS.map(part => part.item), PARTS.map((_, i) => i + 1));
});

test('GLB node names and extras match the manifest exactly', () => {
  const fromGlb = nodes.map(node => ({ name: node.name, ...node.extras }));
  const fromManifest = geometry.meshes.map(m => m.name).sort();
  assert.deepEqual(fromGlb.map(n => n.name).sort(), fromManifest);
  for (const entry of geometry.meshes) {
    const node = fromGlb.find(n => n.name === entry.name);
    assert.equal(node.kairo_part, entry.part, entry.name);
    assert.equal(node.kairo_node, entry.node, entry.name);
    assert.equal(node.kairo_variant, entry.variant, entry.name);
    assert.equal(node.kairo_spin ?? '', entry.spin, entry.name);
  }
});

test('nodes keep their authored assembly transform (identity) and share the shaft axis pivot', () => {
  for (const node of nodes) {
    assert.equal(node.translation, undefined, `${node.name} translation`);
    assert.equal(node.rotation, undefined, `${node.name} rotation`);
    assert.equal(node.scale, undefined, `${node.name} scale`);
  }
});

test('every cut variant has a full counterpart in the same part and node', () => {
  const byName = new Map(geometry.meshes.map(m => [m.name, m]));
  const cuts = geometry.meshes.filter(m => m.variant === 'cut');
  assert.ok(cuts.length >= 8);
  for (const cut of cuts) {
    const full = byName.get(cut.name.replace(/_cut$/, ''));
    assert.ok(full, cut.name);
    assert.equal(full.part, cut.part);
    assert.equal(full.node, cut.node);
    assert.equal(full.variant, 'full');
  }
});

test('only the rotating assembly is marked to spin; the stator and housing never spin', () => {
  const spinning = new Set(geometry.meshes.filter(m => m.spin).map(m => m.part));
  for (const part of ['housing', 'terminal-box', 'stator-core', 'stator-windings', 'end-shield-de', 'end-shield-nde', 'fan-cover']) {
    assert.equal(spinning.has(part), false, part);
  }
  for (const part of ['rotor-core', 'rotor-cage', 'shaft', 'fan']) assert.equal(spinning.has(part), true, part);
  // Bearings: inner ring and balls move, the outer ring does not.
  for (const side of ['de', 'nde']) {
    assert.equal(geometry.meshes.find(m => m.name === `bearing-${side}_outer`).spin, '');
    assert.equal(geometry.meshes.find(m => m.name === `bearing-${side}_inner`).spin, 'rotor');
    assert.equal(geometry.meshes.find(m => m.name === `bearing-${side}_balls`).spin, 'bearing-cage');
  }
});

test('rotor, cage and shaft share one operating assembly node', () => {
  for (const part of ['rotor-core', 'rotor-cage', 'shaft']) {
    for (const mesh of geometry.meshes.filter(m => m.part === part)) assert.equal(mesh.node, 'rotor-assembly', mesh.name);
  }
});

test('all bounding boxes are finite and every full mesh has a 2D section', () => {
  for (const mesh of geometry.meshes) {
    for (const value of [...mesh.bbox.min, ...mesh.bbox.max]) assert.ok(Number.isFinite(value), mesh.name);
    if (mesh.variant === 'full') {
      const loops = [...mesh.side, ...mesh.end];
      for (const loop of loops) {
        assert.ok(loop.length >= 6 && loop.length % 2 === 0, mesh.name);
        assert.ok(loop.every(Number.isFinite), mesh.name);
      }
    }
  }
  const drawnParts = new Set(geometry.meshes.filter(m => m.variant === 'full' && m.side.length).map(m => m.part));
  for (const id of PART_IDS) assert.ok(drawnParts.has(id), `${id} appears in the side section`);
});

test('runtime assets exist and stay within the stated budget', () => {
  assert.ok(existsSync(new URL('studio/public/models/engineering/poly_haven_studio_1k.hdr', root)));
  assert.ok(glbBytes.length < 6 * 1024 * 1024, `GLB ${glbBytes.length} bytes`);
  assert.ok(geometry.totals.triangles < 200000, `${geometry.totals.triangles} triangles`);
});
