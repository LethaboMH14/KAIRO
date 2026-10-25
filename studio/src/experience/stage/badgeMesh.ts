// Geometry for Rain's chest badge: the outlined master symbol triangulated and laid onto the measured chest patch
// (rainBadge.json), so the badge is opaque mesh in the shirt's own skinning space, with no texture or alpha test.
// Pure (no DOM): parses the master path data itself and uses three's earcut triangulation.
import { ShapeUtils, Vector2 } from 'three';

export type Patch = { positionsRaw: number[]; skinIndex: number[]; skinWeight: number[]; sizeMetres: number[]; grid?: number };
export type BadgeData = { positions: Float32Array; skinIndex: Uint16Array; skinWeight: Float32Array; index: number[] };

/** Absolute M/L/A/Z path data (as the master files use) -> closed rings in path units; arcs sampled every `stepDeg`. */
export function pathRings(d: string, stepDeg = 8): [number, number][][] {
  const tokens = d.match(/[MLAZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const rings: [number, number][][] = [];
  let ring: [number, number][] = [];
  let x = 0, y = 0, i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const t = tokens[i++];
    if (t === 'M') { if (ring.length) rings.push(ring); x = num(); y = num(); ring = [[x, y]]; }
    else if (t === 'L') { x = num(); y = num(); ring.push([x, y]); }
    else if (t === 'A') {
      const r = num(); num(); num(); const large = num(), sweep = num(); const x1 = num(), y1 = num();
      ring.push(...arcPoints(x, y, x1, y1, r, large, sweep, stepDeg));
      x = x1; y = y1;
    } else if (t === 'Z') { if (ring.length) rings.push(ring); ring = []; }
    else throw new Error(`unsupported path token ${t}`);
  }
  if (ring.length) rings.push(ring);
  return rings.map(r => (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r));
}

function arcPoints(x0: number, y0: number, x1: number, y1: number, r: number, large: number, sweep: number, stepDeg: number): [number, number][] {
  const dx = (x0 - x1) / 2, dy = (y0 - y1) / 2;
  const d2 = dx * dx + dy * dy;
  const rr = Math.max(r, Math.sqrt(d2));
  let coef = d2 > 0 ? Math.sqrt(Math.max(rr * rr - d2, 0) / d2) : 0;
  if (large === sweep) coef = -coef;
  const cx = coef * dy + (x0 + x1) / 2, cy = -coef * dx + (y0 + y1) / 2;
  const a0 = Math.atan2(y0 - cy, x0 - cx);
  let da = Math.atan2(y1 - cy, x1 - cx) - a0;
  if (sweep && da < 0) da += 2 * Math.PI;
  else if (!sweep && da > 0) da -= 2 * Math.PI;
  const n = Math.max(2, Math.ceil(Math.abs(da) / (stepDeg * Math.PI / 180)));
  const out: [number, number][] = [];
  for (let k = 1; k <= n; k++) out.push([cx + rr * Math.cos(a0 + (da * k) / n), cy + rr * Math.sin(a0 + (da * k) / n)]);
  return out;
}

/**
 * Lays rings (path units, y down) onto the patch, centred, keeping the mark's true proportions on the badge's
 * physical size (patch.sizeMetres) with `margin` of that size left free on each side. Positions and skin weights are
 * bilinear blends of the four surrounding grid vertices (grid j runs down the badge, i to the viewer's right).
 */
export function badgeData(rings: [number, number][][], ink: readonly [number, number, number, number], patch: Patch, margin = 0.07): BadgeData {
  const grid = patch.grid ?? Math.round(Math.sqrt(patch.positionsRaw.length / 3)) - 1;
  const [x0, y0, x1, y1] = ink;
  const [pw, ph] = patch.sizeMetres;
  const k = Math.min((pw * (1 - 2 * margin)) / (x1 - x0), (ph * (1 - 2 * margin)) / (y1 - y0)); // metres per path unit
  const xc = (x0 + x1) / 2, yc = (y0 + y1) / 2;
  const toUV = (x: number, y: number) => new Vector2(0.5 + ((x - xc) * k) / pw, 0.5 + ((y - yc) * k) / ph);
  const positions: number[] = [], skinIndex: number[] = [], skinWeight: number[] = [], index: number[] = [];
  const vertex = (u: number, v: number) => {
    const gx = Math.min(grid - 1e-9, Math.max(0, u * grid)), gy = Math.min(grid - 1e-9, Math.max(0, v * grid));
    const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const corners = [[i, j, (1 - fx) * (1 - fy)], [i + 1, j, fx * (1 - fy)], [i, j + 1, (1 - fx) * fy], [i + 1, j + 1, fx * fy]] as const;
    const p = [0, 0, 0];
    const joints = new Map<number, number>();
    for (const [ci, cj, w] of corners) {
      const k = cj * (grid + 1) + ci;
      for (let c = 0; c < 3; c++) p[c] += patch.positionsRaw[k * 3 + c] * w;
      for (let s = 0; s < 4; s++) {
        const jw = patch.skinWeight[k * 4 + s];
        if (jw > 0) joints.set(patch.skinIndex[k * 4 + s], (joints.get(patch.skinIndex[k * 4 + s]) ?? 0) + jw * w);
      }
    }
    const top = [...joints.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 4);
    const total = top.reduce((sum, e) => sum + e[1], 0) || 1;
    while (top.length < 4) top.push([0, 0]);
    positions.push(...p);
    skinIndex.push(...top.map(e => e[0]));
    skinWeight.push(...top.map(e => e[1] / total));
  };
  for (const ring of rings) {
    const contour = ring.map(([x, y]) => toUV(x, y));
    // Triangulate first: three may drop a repeated end point from the contour, and the indices refer to what remains.
    const triangles = ShapeUtils.triangulateShape(contour, []);
    const base = positions.length / 3;
    for (const c of contour) vertex(c.x, c.y);
    for (const tri of triangles) index.push(base + tri[0], base + tri[1], base + tri[2]);
  }
  return { positions: new Float32Array(positions), skinIndex: new Uint16Array(skinIndex), skinWeight: new Float32Array(skinWeight), index };
}
