// Generates the skinned chest-badge patch for Rain's shirt from the character GLB (no change to the GLB).
//
//   node design/brand-master-20261023/tools/rain_badge.mjs <teacher.glb> <tools/character/node dir> <out.json>
//
// The shirt's UVs are degenerate over most of the chest (many vertices share uv 0,1), so a texture badge is not
// possible without rebuilding the asset. Instead a small grid patch is laid on the upper-left chest at bind pose,
// projected onto the shirt surface, lifted 1.5 mm along the normal and given skin weights interpolated from the
// nearest shirt vertices. At runtime it is a SkinnedMesh bound to the shirt's own skeleton, so it deforms with the
// fabric (the area is ~57% clavicle_l, which moves when Rain points at the board).
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const [file, toolsDir, out] = process.argv.slice(2);
const req = createRequire(toolsDir + '/package.json');
const load = name => import(pathToFileURL(req.resolve(name)).href);
const { NodeIO } = await load('@gltf-transform/core');
const { ALL_EXTENSIONS } = await load('@gltf-transform/extensions');
const { MeshoptDecoder } = await load('meshoptimizer');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(file);
const root = doc.getRoot();
const shirt = root.listNodes().find(n => n.getName() === 'Teacher_Shirt');
const skin = shirt.getSkin(), joints = skin.listJoints(), ibm = skin.getInverseBindMatrices();
const prim = shirt.getMesh().listPrimitives()[0];
const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'), J = prim.getAttribute('JOINTS_0'), W = prim.getAttribute('WEIGHTS_0');

const mul = (m, v, w = 1) => [m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12]*w, m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13]*w, m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]*w];
const mm = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c*4+r] += a[k*4+r]*b[c*4+k]; return o; };
const skinM = joints.map((j, i) => mm(j.getWorldMatrix(), ibm.getElement(i, [])));
// At rest every joint's world * inverse-bind is the same dequantisation transform Q; check, then invert it.
const Q = skinM[0];
const qSpread = Math.max(...skinM.map(m => Math.max(...m.map((v, i) => Math.abs(v - Q[i])))));
if (qSpread > 1e-4) throw new Error(`rest skin matrices differ by ${qSpread}; raw-space inversion is not valid`);
function invertAffine(m) {
  const a = [[m[0], m[4], m[8]], [m[1], m[5], m[9]], [m[2], m[6], m[10]]];
  const det = a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1]) - a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0]) + a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
  const inv = [
    [(a[1][1]*a[2][2]-a[1][2]*a[2][1])/det, (a[0][2]*a[2][1]-a[0][1]*a[2][2])/det, (a[0][1]*a[1][2]-a[0][2]*a[1][1])/det],
    [(a[1][2]*a[2][0]-a[1][0]*a[2][2])/det, (a[0][0]*a[2][2]-a[0][2]*a[2][0])/det, (a[0][2]*a[1][0]-a[0][0]*a[1][2])/det],
    [(a[1][0]*a[2][1]-a[1][1]*a[2][0])/det, (a[0][1]*a[2][0]-a[0][0]*a[2][1])/det, (a[0][0]*a[1][1]-a[0][1]*a[1][0])/det]];
  const t = [m[12], m[13], m[14]];
  return v => { const d = [v[0]-t[0], v[1]-t[1], v[2]-t[2]]; return [0, 1, 2].map(r => inv[r][0]*d[0]+inv[r][1]*d[1]+inv[r][2]*d[2]); };
}
const toRaw = invertAffine(Q);

const n = P.getCount(), pos = [], nor = [], wts = [];
const p = [], q = [], jj = [], ww = [];
for (let i = 0; i < n; i++) {
  P.getElement(i, p); N.getElement(i, q); J.getElement(i, jj); W.getElement(i, ww);
  const o = [0, 0, 0], d = [0, 0, 0];
  for (let k = 0; k < 4; k++) { if (!ww[k]) continue; const v = mul(skinM[jj[k]], p), e = mul(skinM[jj[k]], q, 0); for (let c = 0; c < 3; c++) { o[c] += ww[k]*v[c]; d[c] += ww[k]*e[c]; } }
  const l = Math.hypot(...d) || 1;
  pos.push(o); nor.push(d.map(c => c / l)); wts.push([0, 1, 2, 3].map(k => [jj[k], ww[k]]).filter(x => x[1] > 0));
}
const idx = prim.getIndices(), tri = [];
for (let i = 0; i < idx.getCount(); i += 3) tri.push([idx.getScalar(i), idx.getScalar(i + 1), idx.getScalar(i + 2)]);
function castFront(x, y) {
  let best = null;
  for (const [a, b, c] of tri) {
    const A = pos[a], B = pos[b], C = pos[c];
    const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
    if (Math.abs(d) < 1e-12) continue;
    const l1 = ((B[1] - C[1]) * (x - C[0]) + (C[0] - B[0]) * (y - C[1])) / d, l2 = ((C[1] - A[1]) * (x - C[0]) + (A[0] - C[0]) * (y - C[1])) / d, l3 = 1 - l1 - l2;
    if (l1 < -1e-9 || l2 < -1e-9 || l3 < -1e-9) continue;
    const z = l1 * A[2] + l2 * B[2] + l3 * C[2];
    const nz = [l1, l2, l3].reduce((s, l, k) => s.map((v, c) => v + l * nor[[a, b, c][k]][c]), [0, 0, 0]);
    if (!best || z > best.z) best = { z, n: nz.map(v => v / (Math.hypot(...nz) || 1)) };
  }
  return best;
}

// Badge frame: centre on the upper-left chest, above the bust and below the collar.
const CENTRE = [0.085, 1.245];
const SIZE = [0.034, 0.0286]; // metres; symbol viewBox aspect 259.31 x 217.97 including clear space
const LIFT = 0.0015;
// The shirt's stored vertex normals do not match its sculpted chest (they point downward where the surface faces
// up), so the badge frame and lift use the geometric normal from surface finite differences.
function surfaceNormal(x, y, h = 0.004) {
  const zx = (castFront(x + h, y).z - castFront(x - h, y).z) / (2 * h);
  const zy = (castFront(x, y + h).z - castFront(x, y - h).z) / (2 * h);
  const v = [-zx, -zy, 1], l = Math.hypot(...v);
  return v.map(c => c / l);
}
const c0 = castFront(...CENTRE);
const normal = surfaceNormal(...CENTRE);
const up0 = [0, 1, 0];
const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const sub = (a, b) => a.map((v, i) => v - b[i]);
const scale = (a, s) => a.map(v => v * s);
const norm = a => scale(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const U = norm(sub(up0, scale(normal, dot(up0, normal))));
const R = norm(cross(U, normal)); // viewer's right when facing her = world +X side
const centre3 = [CENTRE[0], CENTRE[1], c0.z];
const GRID = 8;
const positions = [], uvs = [], skinIndex = [], skinWeight = [], indices = [];
let worstLift = 0;
for (let j = 0; j <= GRID; j++) for (let i = 0; i <= GRID; i++) {
  const s = (i / GRID - 0.5) * SIZE[0], t = (0.5 - j / GRID) * SIZE[1];
  const g = [centre3[0] + R[0]*s + U[0]*t, centre3[1] + R[1]*s + U[1]*t, centre3[2] + R[2]*s + U[2]*t];
  const hit = castFront(g[0], g[1]);
  const surf = [g[0], g[1], hit.z];
  const gn = surfaceNormal(g[0], g[1]);
  const v = [surf[0] + gn[0]*LIFT, surf[1] + gn[1]*LIFT, surf[2] + gn[2]*LIFT];
  worstLift = Math.max(worstLift, Math.abs(dot(sub(v, surf), gn) - LIFT));
  // Skin weights: inverse-distance blend of the 6 nearest shirt vertices, top four joints renormalised.
  const nearest = pos.map((pv, k) => [Math.hypot(pv[0]-v[0], pv[1]-v[1], pv[2]-v[2]), k]).sort((a, b) => a[0] - b[0]).slice(0, 6);
  const acc = new Map();
  for (const [dist, k] of nearest) { const w = 1 / Math.max(dist, 1e-4); for (const [joint, jw] of wts[k]) acc.set(joint, (acc.get(joint) || 0) + w * jw); }
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = top.reduce((sum, x) => sum + x[1], 0);
  while (top.length < 4) top.push([0, 0]);
  positions.push(...toRaw(v));
  uvs.push(i / GRID, j / GRID);
  skinIndex.push(...top.map(x => x[0]));
  skinWeight.push(...top.map(x => +(x[1] / total).toFixed(5)));
}
for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
  const a = j * (GRID + 1) + i, b = a + 1, c = a + GRID + 1, d = c + 1;
  indices.push(a, c, b, b, c, d);
}
const result = {
  generator: 'design/brand-master-20261023/tools/rain_badge.mjs',
  asset: { file: 'studio/public/models/character/kairo-teacher.glb', sha256: createHash('sha256').update(readFileSync(file)).digest('hex') },
  meshName: 'Teacher_Shirt',
  jointNames: joints.map(j => j.getName()),
  centreBindPose: centre3.map(v => +v.toFixed(5)), normal: normal.map(v => +v.toFixed(5)), sizeMetres: SIZE, liftMetres: LIFT,
  checks: { restSkinMatrixSpread: qSpread, maxLiftError: +worstLift.toFixed(6), vertices: positions.length / 3, triangles: indices.length / 3 },
  positionsRaw: positions.map(v => +v.toFixed(6)), uvs, skinIndex, skinWeight, indices,
};
writeFileSync(out, JSON.stringify(result));
console.log(JSON.stringify({ ...result.checks, centre: result.centreBindPose, normal: result.normal, sha256: result.asset.sha256,
  firstWeights: skinIndex.slice(0, 4).map((k, i) => [joints[k].getName(), skinWeight[i]]) }));
