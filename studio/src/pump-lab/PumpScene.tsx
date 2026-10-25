import { useEffect, useMemo, useRef, type ComponentRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { type OperatingPoint } from './physics.ts';
import {
  BENCH, CAMERA_PRESETS, DEST_TANK, DISCHARGE_PIPE, FLOW_PATH, PARTICLE_COUNT, PUMP_CENTRE, SCENE_UNITS_PER_M, SOURCE_TANK, SUCTION_PIPE,
  TARGETS, TARGET_BY_ID, TANK_WALL_Y, particleU, pathPoint, stateCues, zoneAt, type TargetId, type Vec3,
} from './layout.ts';
import { latestReading } from './readout.ts';
import type { PartId } from './cases.ts';
import type { PumpLabState } from './session.ts';

// Procedural scene. No downloaded meshes or textures: every shape below is a
// primitive placed from layout.ts. Cues (particles, bubbles, rings) are driven by
// stateCues(), so each one has a defined meaning that the legend and the reading
// view repeat in words. Palette: Chalk / Moss / Sage / Copper / Graphite.

const C = { chalk: '#F5F0E6', moss: '#3E5144', sage: '#A7AF91', copper: '#AE7555', graphite: '#252B28', water: '#6fa8a6', pipe: '#7d8f84', glass: '#cfe0dc', suction: '#2f7f7c', discharge: '#c9783f', warn: '#b3402c' };

export type BenchCondition = Partial<Record<PartId, boolean>>; // true = worn / blocked / stuck, shown only once opened

type Props = {
  state: PumpLabState;
  op: OperatingPoint;
  live: boolean;
  selected: TargetId | null;
  highlight: TargetId | null;
  reducedMotion: boolean;
  preset: string;
  explode: number;
  bench: BenchCondition;
  openedParts: ReadonlySet<PartId>;
  onSelect: (id: TargetId) => void;
};

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;
const U = SCENE_UNITS_PER_M;
const v3 = (a: Vec3) => new THREE.Vector3(a[0], a[1], a[2]);

function Pipe({ a, b, r = 0.07, color = C.pipe }: { a: Vec3; b: Vec3; r?: number; color?: string }) {
  const { pos, quat, len } = useMemo(() => {
    const va = v3(a), vb = v3(b);
    const dir = vb.clone().sub(va);
    const length = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: va.clone().add(vb).multiplyScalar(0.5), quat: q, len: length };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 18]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
    </mesh>
  );
}

function Joint({ at, r = 0.085 }: { at: Vec3; r?: number }) {
  return <mesh position={at}><sphereGeometry args={[r, 14, 12]} /><meshStandardMaterial color={C.pipe} roughness={0.55} metalness={0.2} /></mesh>;
}

function Tank({ centre, size, levelM, floorY, label }: { centre: Vec3; size: Vec3; levelM: number; floorY: number; label: string }) {
  const h = Math.max(0.001, levelM * U);
  return (
    <group aria-label={label}>
      <mesh position={[centre[0], floorY + size[1] / 2, centre[2]]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[centre[0], floorY + h / 2, centre[2]]}>
        <boxGeometry args={[size[0] - 0.04, h, size[2] - 0.04]} />
        <meshStandardMaterial color={C.water} transparent opacity={0.72} />
      </mesh>
      <mesh position={[centre[0], floorY - 0.03, centre[2]]}>
        <boxGeometry args={[size[0] + 0.12, 0.06, size[2] + 0.12]} />
        <meshStandardMaterial color={C.moss} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Gauge({ at, kpa, over }: { at: Vec3; kpa: number | null; over: boolean }) {
  const frac = kpa === null ? 0 : Math.min(1, Math.max(0, (kpa + 100) / 400));
  const angle = (0.5 - frac) * (Math.PI * 1.5);
  return (
    <group position={at}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.05, 24]} /><meshStandardMaterial color={C.chalk} roughness={0.6} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}><torusGeometry args={[0.13, 0.014, 8, 24]} /><meshStandardMaterial color={C.graphite} /></mesh>
      <group position={[0, 0, 0.035]} rotation={[0, 0, angle]}>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.012, 0.1, 0.01]} /><meshStandardMaterial color={C.graphite} /></mesh>
      </group>
      {over && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.19, 0.02, 8, 28]} /><meshStandardMaterial color={C.warn} emissive={C.warn} emissiveIntensity={0.6} /></mesh>}
    </group>
  );
}

function Impeller({ speedRatio, run, reduced, vaneScale = 1 }: { speedRatio: number; run: boolean; reduced: boolean; vaneScale?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current && run && !reduced) g.current.rotation.x += dt * 7 * speedRatio; });
  const vanes = useMemo(() => Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3), []);
  return (
    <group ref={g}>
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, 0.04, 24]} /><meshStandardMaterial color={C.copper} metalness={0.6} roughness={0.4} /></mesh>
      {vanes.map(a => (
        <mesh key={a} position={[0.03, Math.cos(a) * 0.12 * vaneScale, Math.sin(a) * 0.12 * vaneScale]} rotation={[a, 0, 0]}>
          <boxGeometry args={[0.05, 0.2 * vaneScale, 0.025]} />
          <meshStandardMaterial color={C.copper} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Particles({ op, active, reduced }: { op: OperatingPoint; active: boolean; reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const clock = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cols = useMemo(() => ({ s: new THREE.Color(C.suction), d: new THREE.Color(C.discharge) }), []);
  const place = () => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = particleU(i, clock.current, op.flowLps);
      const [x, y, z] = pathPoint(u);
      const zone = zoneAt(u);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(zone === 'suction' ? 0.8 : 1.15);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, zone === 'suction' ? cols.s : cols.d);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  useFrame((_, dt) => { if (active && !reduced) { clock.current += dt; place(); } });
  useEffect(() => { place(); });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]} visible={active} frustumCulled={false}>
      <sphereGeometry args={[0.045, 8, 6]} />
      <meshStandardMaterial roughness={0.4} />
    </instancedMesh>
  );
}

function Bubbles({ active, reduced }: { active: boolean; reduced: boolean }) {
  const g = useRef<THREE.Group>(null);
  const items = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);
  useFrame(({ clock }) => {
    if (!g.current || !active || reduced) return;
    g.current.children.forEach((c, i) => { c.position.y = Math.sin(clock.elapsedTime * 3 + i) * 0.14; c.position.z = Math.cos(clock.elapsedTime * 2.3 + i * 1.7) * 0.14; });
  });
  return (
    <group ref={g} position={[PUMP_CENTRE[0], PUMP_CENTRE[1], PUMP_CENTRE[2]]} visible={active}>
      {items.map(i => <mesh key={i} position={[-0.05 + (i % 3) * 0.05, ((i * 37) % 10) / 80, ((i * 53) % 10) / 80]}><sphereGeometry args={[0.02 + (i % 3) * 0.008, 8, 6]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.8} /></mesh>)}
    </group>
  );
}

function Ring({ at, color = C.moss, r = 0.3 }: { at: Vec3; color?: string; r?: number }) {
  return <mesh position={at} rotation={[0, 0, 0]}><torusGeometry args={[r, 0.015, 8, 36]} /><meshBasicMaterial color={color} /></mesh>;
}

function Bench({ explode, condition, opened, reduced, speedRatio }: { explode: number; condition: BenchCondition; opened: ReadonlySet<PartId>; reduced: boolean; speedRatio: number }) {
  const o = BENCH.origin;
  const pos = (id: (typeof BENCH.parts)[number]['id']): Vec3 => {
    const p = BENCH.parts.find(b => b.id === id)!;
    return [o[0] + p.offsetX + (p.explodeX - p.offsetX) * explode * 0.6, o[1] + 0.1, o[2]];
  };
  const state = (id: PartId) => (opened.has(id) ? (condition[id] ? 'worn' : 'ok') : 'closed');
  return (
    <group>
      <mesh position={[o[0] + 1.1, 0.03, o[2]]}><boxGeometry args={[3.2, 0.06, 0.9]} /><meshStandardMaterial color={C.sage} roughness={0.8} /></mesh>
      <group position={pos('shaft')}><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.6, 14]} /><meshStandardMaterial color="#c9ced0" metalness={0.9} roughness={0.25} /></mesh></group>
      <group position={pos('impeller')}><Impeller speedRatio={speedRatio} run={false} reduced={reduced} vaneScale={state('impeller') === 'worn' ? 0.55 : 1} /></group>
      <group position={pos('seal')}><mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.07, 0.025, 10, 20]} /><meshStandardMaterial color={C.graphite} roughness={0.6} /></mesh></group>
      <group position={pos('strainer')}>
        <mesh><cylinderGeometry args={[0.12, 0.09, 0.22, 14, 1, true]} /><meshStandardMaterial color="#9aa49c" side={THREE.DoubleSide} wireframe /></mesh>
        {state('strainer') === 'worn' && [0, 1, 2, 3, 4, 5].map(i => <mesh key={i} position={[Math.cos(i) * 0.06, -0.05 + (i % 3) * 0.04, Math.sin(i) * 0.06]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#6b5a3e" /></mesh>)}
      </group>
      <group position={pos('valve-gate')}>
        <mesh position={[0, state('valve-gate') === 'worn' ? -0.06 : 0.0, 0]}><boxGeometry args={[0.2, 0.2, 0.025]} /><meshStandardMaterial color="#8d9892" metalness={0.7} roughness={0.4} /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.015, 0.015, 0.4, 8]} /><meshStandardMaterial color="#c9ced0" metalness={0.9} /></mesh>
      </group>
    </group>
  );
}

function CameraRig({ preset, reduced, controls }: { preset: string; reduced: boolean; controls: RefObject<OrbitControlsImpl | null> }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const p = CAMERA_PRESETS.find(c => c.id === preset) ?? CAMERA_PRESETS[0];
    camera.position.set(...p.position);
    if (controls.current) { controls.current.target.set(...p.target); controls.current.update(); }
    else camera.lookAt(...p.target);
    invalidate();
  }, [preset, camera, controls, invalidate, reduced]);
  return null;
}

function Invalidate({ deps }: { deps: unknown[] }) {
  const invalidate = useThree(s => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { invalidate(); }, deps);
  return null;
}

export default function PumpScene({ state, op, live, selected, highlight, reducedMotion, preset, explode, bench, openedParts, onSelect }: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null);
  const cues = stateCues(op, live);
  const on = (id: string) => cues.find(c => c.id === id)!.active;
  const r = latestReading(state);
  const valveAngle = ((100 - state.settings.valvePct) / 100) * (Math.PI / 2);
  const tgt = (id: TargetId): Vec3 => TARGET_BY_ID[id].world;
  const marked = highlight ?? selected;
  return (
    <Canvas
      className="pl-canvas"
      frameloop={reducedMotion ? 'demand' : 'always'}
      dpr={[1, 1.75]}
      camera={{ position: CAMERA_PRESETS[0].position, fov: 42, near: 0.1, far: 60 }}
      role="img"
      aria-label="Three-dimensional pump room. The same parts are listed in the parts list and the diagram view."
    >
      <color attach="background" args={['#ece8dc']} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#b8bba6', 0.5]} />
      <directionalLight position={[4, 7, 5]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0.5]}><planeGeometry args={[18, 10]} /><meshStandardMaterial color="#e1dccb" roughness={1} /></mesh>

      <Tank centre={SOURCE_TANK.centre} size={SOURCE_TANK.size} levelM={op.sourceLevelM} floorY={0} label="Source tank" />
      <Tank centre={DEST_TANK.centre} size={DEST_TANK.size} levelM={op.destLevelM} floorY={DEST_TANK.centre[1]} label="Destination tank" />
      <mesh position={[3.6, DEST_TANK.centre[1] / 2 - 0.03, 0.1]}><boxGeometry args={[0.18, DEST_TANK.centre[1] - 0.06, 0.18]} /><meshStandardMaterial color={C.moss} /></mesh>
      <mesh position={[3.6 - 0.62, DEST_TANK.centre[1] / 2 - 0.03, 0.1]}><boxGeometry args={[0.1, DEST_TANK.centre[1] - 0.06, 0.1]} /><meshStandardMaterial color={C.moss} /></mesh>
      <mesh position={[3.6 + 0.62, DEST_TANK.centre[1] / 2 - 0.03, 0.1]}><boxGeometry args={[0.1, DEST_TANK.centre[1] - 0.06, 0.1]} /><meshStandardMaterial color={C.moss} /></mesh>

      {/* suction line */}
      <Pipe a={SUCTION_PIPE[0]} b={SUCTION_PIPE[1]} r={0.08} />
      <mesh position={tgt('strainer')} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.13, 0.13, 0.34, 18]} /><meshStandardMaterial color="#8a948d" metalness={0.5} roughness={0.5} /></mesh>

      {/* pump casing: transparent so the impeller can be seen */}
      <mesh position={PUMP_CENTRE} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.38, 0.38, 0.34, 28]} />
        <meshStandardMaterial color={C.glass} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <group position={PUMP_CENTRE}><Impeller speedRatio={op.speedRatio} run={on('impeller-spin')} reduced={reducedMotion} /></group>
      <Bubbles active={on('cavitation-bubbles')} reduced={reducedMotion} />

      {/* shaft, seal, coupling, motor */}
      <mesh position={[0.25, 0.45, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.5, 12]} /><meshStandardMaterial color="#c9ced0" metalness={0.9} roughness={0.25} /></mesh>
      <mesh position={[0.1, 0.45, 0.1]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.07, 0.02, 8, 18]} /><meshStandardMaterial color={C.graphite} /></mesh>
      <mesh position={[0.36, 0.45, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.1, 18]} /><meshStandardMaterial color={C.copper} metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[0.95, 0.45, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 1.0, 28]} /><meshStandardMaterial color={C.moss} roughness={0.6} metalness={0.2} /></mesh>
      {[0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25].map(x => <mesh key={x} position={[x, 0.45, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.315, 0.315, 0.025, 28]} /><meshStandardMaterial color="#33463a" /></mesh>)}
      <mesh position={[0.95, 0.82, 0.1]}><boxGeometry args={[0.28, 0.14, 0.24]} /><meshStandardMaterial color={C.graphite} roughness={0.6} /></mesh>
      <mesh position={[1.55, 0.45, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.26, 0.26, 0.22, 20]} /><meshStandardMaterial color={C.graphite} roughness={0.7} /></mesh>
      {[0.6, 1.3].map(x => <mesh key={x} position={[x, 0.07, 0.1]}><boxGeometry args={[0.14, 0.14, 0.7]} /><meshStandardMaterial color={C.graphite} /></mesh>)}

      {/* discharge line */}
      {DISCHARGE_PIPE.slice(1).map((p, i) => <Pipe key={i} a={DISCHARGE_PIPE[i]} b={p} r={0.07} />)}
      {DISCHARGE_PIPE.map((p, i) => <Joint key={i} at={p} />)}
      <Pipe a={FLOW_PATH[8]} b={FLOW_PATH[9]} r={0.07} />
      <group position={tgt('valve')}>
        <mesh rotation={[0, 0, Math.PI / 2]}><coneGeometry args={[0.14, 0.2, 16]} /><meshStandardMaterial color={C.copper} metalness={0.5} roughness={0.5} /></mesh>
        <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.2, 0, 0]}><coneGeometry args={[0.14, 0.2, 16]} /><meshStandardMaterial color={C.copper} metalness={0.5} roughness={0.5} /></mesh>
        <mesh position={[0.1, 0.17, 0]}><cylinderGeometry args={[0.02, 0.02, 0.22, 8]} /><meshStandardMaterial color="#c9ced0" metalness={0.9} /></mesh>
        <group position={[0.1, 0.3, 0]} rotation={[0, valveAngle, 0]}><mesh><boxGeometry args={[0.32, 0.04, 0.05]} /><meshStandardMaterial color={C.graphite} /></mesh></group>
      </group>
      <mesh position={tgt('flow-meter')} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.3, 16]} /><meshStandardMaterial color={C.graphite} roughness={0.5} /></mesh>

      {/* instruments: show the last reading, not a live value */}
      <Gauge at={tgt('gauge-suction')} kpa={r ? r.measured.suctionKpa : null} over={false} />
      <Gauge at={tgt('gauge-discharge')} kpa={r ? r.measured.dischargeKpa : null} over={on('discharge-over-limit')} />
      <Gauge at={tgt('gauge-post-valve')} kpa={r ? r.measured.postValveKpa : null} over={false} />
      <mesh position={tgt('power-meter')}><boxGeometry args={[0.3, 0.2, 0.06]} /><meshStandardMaterial color={C.chalk} roughness={0.6} /></mesh>
      {on('motor-over-rating') && <Ring at={[tgt('power-meter')[0], tgt('power-meter')[1], 0.06]} color={C.warn} r={0.22} />}
      {on('source-low') && <Ring at={[SOURCE_TANK.centre[0], TANK_WALL_Y + 0.2, 0.1]} color={C.warn} r={0.6} />}
      {/* Numbers and the words for each alert are in the DOM overlay and the reading view, not painted into the scene. */}

      <Particles op={op} active={on('flow-particles')} reduced={reducedMotion} />
      <Bench explode={explode} condition={bench} opened={openedParts} reduced={reducedMotion} speedRatio={op.speedRatio} />

      {/* selection hot spots: invisible, large enough to hit with a finger */}
      {TARGETS.map(t => (
        <mesh key={t.id} position={t.world} onClick={e => { e.stopPropagation(); onSelect(t.id); }}>
          <sphereGeometry args={[t.kind === 'tank' ? 0.7 : 0.22, 10, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {marked && <Ring at={tgt(marked)} color={highlight === marked ? C.copper : C.moss} r={TARGET_BY_ID[marked].kind === 'tank' ? 0.9 : 0.32} />}

      <Invalidate deps={[state, selected, highlight, explode, live]} />
      <OrbitControls ref={controls} enablePan={false} minDistance={1.8} maxDistance={14} maxPolarAngle={Math.PI * 0.49} target={CAMERA_PRESETS[0].target} makeDefault />
      <CameraRig preset={preset} reduced={reducedMotion} controls={controls} />
    </Canvas>
  );
}

