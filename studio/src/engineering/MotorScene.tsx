import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Html, Lightformer, Line, OrbitControls, PerformanceMonitor, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { demoAngles, easeInOutCubic, explodeDuration, windingCurrents, type Phase, type Supply } from './fieldMath';
import { createMotorMaterials, createOutlineMaterial, tintPhases, SELECTION_COLOUR } from './materials';
import { PART_BY_ID, type PartId } from './motorContent';
import {
  ASSEMBLED_TOLERANCE, BENCH_TOP, CAMERA_PRESETS, ENVIRONMENT_URL, MAT_THICKNESS, MODEL_URL, MOTOR_ORIGIN, NODE_IDS,
  modelBounds, nodeOffset, partBounds, type Bounds, type CameraCommand, type DemoClock, type NodeId, type Spin,
} from './motorModel';

export type MotorSceneProps = {
  selected: PartId | null;
  hovered: PartId | null;
  cutaway: boolean;
  explode: number;
  reduced: boolean;
  operating: boolean;
  playing: boolean;
  /** Supply experiment for the operating demonstration. */
  supply: Supply;
  /** Changes when the paused demonstration is stepped or restarted, so the frame is redrawn. */
  tick: number;
  clock: RefObject<DemoClock>;
  camera: CameraCommand;
  onSelect: (part: PartId) => void;
  onHover: (part: PartId | null) => void;
  onReady: () => void;
  /** The model could not be loaded; the studio switches to the drawing view. */
  onError: () => void;
};

type ExplodeState = { value: number; from: number; to: number; start: number; duration: number };
type Entry = { name: string; part: PartId; node: NodeId; variant: 'full' | 'cut'; spin: Spin; phase?: Phase; meshes: { geometry: THREE.BufferGeometry; material: string }[] };

const ORIGIN = new THREE.Vector3(...MOTOR_ORIGIN);

function seededRandom(seed: number) {
  let state = seed;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

function canvasTexture(width: number, height: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function woodTexture() {
  const random = seededRandom(7);
  return canvasTexture(1024, 512, c => {
    c.fillStyle = '#a27750';
    c.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 150; i++) {
      const y = random() * 512, amplitude = 2 + random() * 6, frequency = 0.003 + random() * 0.009, phase = random() * 6.28;
      c.strokeStyle = random() < 0.55 ? `rgba(88,57,34,${0.07 + random() * 0.16})` : `rgba(205,166,122,${0.06 + random() * 0.14})`;
      c.lineWidth = 0.6 + random() * 2.4;
      c.beginPath();
      for (let x = 0; x <= 1024; x += 16) {
        const yy = y + Math.sin(x * frequency + phase) * amplitude;
        if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.fillStyle = 'rgba(64,41,25,0.38)';
    for (const y of [127, 255, 383]) c.fillRect(0, y, 1024, 2);
  });
}

/** Pegboard with a 25 mm hole pitch at the board's 1.9 m width. */
function pegboardTexture() {
  return canvasTexture(2048, 928, c => {
    c.fillStyle = '#dadcd6';
    c.fillRect(0, 0, 2048, 928);
    c.fillStyle = '#c3c8c1';
    for (let x = 14; x < 2048; x += 27) for (let y = 14; y < 928; y += 27) {
      c.beginPath();
      c.arc(x, y, 3.4, 0, Math.PI * 2);
      c.fill();
    }
  });
}

function Workshop() {
  const wood = useMemo(woodTexture, []);
  const pegboard = useMemo(pegboardTexture, []);
  useEffect(() => () => { wood.dispose(); pegboard.dispose(); }, [wood, pegboard]);
  const floor = BENCH_TOP - 0.9;
  const legs: [number, number][] = [[-0.88, -0.36], [0.88, -0.36], [-0.88, 0.36], [0.88, 0.36]];
  return <group>
    <mesh rotation-x={-Math.PI / 2} position={[0, floor, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#cdd0c9" roughness={0.95} />
    </mesh>
    <mesh position={[0, floor + 3, -2.4]}>
      <planeGeometry args={[40, 6]} />
      <meshStandardMaterial color="#dfe2dc" roughness={1} />
    </mesh>
    <RoundedBox args={[1.9, 0.05, 0.86]} radius={0.008} position={[0, BENCH_TOP - 0.025, 0]} receiveShadow castShadow>
      <meshStandardMaterial map={wood} roughness={0.6} />
    </RoundedBox>
    {legs.map(([x, z]) => <mesh key={`${x}${z}`} position={[x, (floor + BENCH_TOP - 0.05) / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[0.05, BENCH_TOP - 0.05 - floor, 0.05]} />
      <meshStandardMaterial color="#2f444b" metalness={0.3} roughness={0.5} />
    </mesh>)}
    {[-0.36, 0.36].map(z => <mesh key={z} position={[0, BENCH_TOP - 0.08, z]} castShadow>
      <boxGeometry args={[1.76, 0.06, 0.03]} />
      <meshStandardMaterial color="#2f444b" metalness={0.3} roughness={0.5} />
    </mesh>)}
    <mesh position={[0, floor + 0.2, 0]} receiveShadow castShadow>
      <boxGeometry args={[1.76, 0.025, 0.74]} />
      <meshStandardMaterial map={wood} roughness={0.66} color="#cdbca8" />
    </mesh>
    <mesh position={[0, BENCH_TOP + 0.46, -0.455]} receiveShadow>
      <boxGeometry args={[1.9, 0.86, 0.02]} />
      <meshStandardMaterial map={pegboard} roughness={0.85} />
    </mesh>
    {[[0.62, 0.34, 0.17], [0.68, 0.33, 0.14], [0.735, 0.34, 0.11]].map(([x, y, length]) => <group key={x} position={[x, BENCH_TOP + y, -0.438]}>
      <RoundedBox args={[0.016, length, 0.004]} radius={0.002} castShadow><meshStandardMaterial color="#b9c0c4" metalness={1} roughness={0.32} /></RoundedBox>
      <mesh position={[0, length / 2, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.014, 0.004, 8, 24]} /><meshStandardMaterial color="#b9c0c4" metalness={1} roughness={0.32} /></mesh>
    </group>)}
    <group position={[0.82, BENCH_TOP + 0.36, -0.437]}>
      <mesh castShadow><cylinderGeometry args={[0.013, 0.013, 0.1, 20]} /><meshStandardMaterial color="#75baa6" roughness={0.5} /></mesh>
      <mesh position={[0, -0.1, 0]}><cylinderGeometry args={[0.0028, 0.0028, 0.1, 10]} /><meshStandardMaterial color="#c9ced1" metalness={1} roughness={0.3} /></mesh>
    </group>
    <RoundedBox args={[0.94, MAT_THICKNESS, 0.5]} radius={0.002} position={[0.02, BENCH_TOP + MAT_THICKNESS / 2, 0.02]} receiveShadow>
      <meshStandardMaterial color="#2b3234" roughness={0.88} />
    </RoundedBox>
  </group>;
}

class EnvironmentBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/** Generated studio light, used while the HDRI loads or if it cannot be loaded. */
function StudioLightformers() {
  return <Environment resolution={128} frames={1}>
    <Lightformer form="rect" intensity={2.2} position={[0, 4, 1]} rotation-x={Math.PI / 2} scale={[6, 3, 1]} />
    <Lightformer form="rect" intensity={1.2} position={[-4, 1.5, 2]} rotation-y={Math.PI / 2} scale={[3, 2, 1]} />
    <Lightformer form="rect" intensity={0.7} position={[4, 1, -2]} rotation-y={-Math.PI / 2} scale={[2, 3, 1]} color="#d8e8f5" />
  </Environment>;
}

function Lighting() {
  return <>
    <EnvironmentBoundary fallback={<StudioLightformers />}>
      <Suspense fallback={<StudioLightformers />}>
        <Environment files={ENVIRONMENT_URL} environmentIntensity={0.85} />
      </Suspense>
    </EnvironmentBoundary>
    <hemisphereLight args={['#f4f6f1', '#9b968b', 0.35]} />
    <directionalLight
      position={[1.5, 2.4, 1.7]} intensity={1.7} color="#fff3e2" castShadow
      shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.015}
      shadow-camera-left={-1.2} shadow-camera-right={1.2} shadow-camera-top={1.2} shadow-camera-bottom={-1.2}
      shadow-camera-near={0.5} shadow-camera-far={7}
    />
    <directionalLight position={[-2.2, 1.3, -1.6]} intensity={0.5} color="#d5e6f4" />
  </>;
}

function useMotorEntries(): Entry[] {
  const { scene } = useGLTF(MODEL_URL, false);
  return useMemo(() => {
    const entries: Entry[] = [];
    scene.traverse(object => {
      const data = object.userData as { kairo_part?: PartId; kairo_node?: NodeId; kairo_variant?: 'full' | 'cut'; kairo_spin?: Spin; kairo_phase?: Phase };
      if (!data.kairo_part || !data.kairo_node) return;
      const meshes: Entry['meshes'] = [];
      object.traverse(child => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) meshes.push({ geometry: mesh.geometry, material: (mesh.material as THREE.Material).name });
      });
      entries.push({ name: object.name, part: data.kairo_part, node: data.kairo_node, variant: data.kairo_variant ?? 'full', spin: data.kairo_spin ?? '', phase: data.kairo_phase, meshes });
    });
    return entries.sort((a, b) => (a.name < b.name ? -1 : 1));
  }, [scene]);
}

function useExplodeTween(target: number, reduced: boolean) {
  const state = useRef<ExplodeState>({ value: target, from: target, to: target, start: 0, duration: 0 });
  const invalidate = useThree(s => s.invalidate);
  const gl = useThree(s => s.gl);
  useEffect(() => {
    const s = state.current;
    s.from = s.value;
    s.to = target;
    s.start = performance.now();
    s.duration = explodeDuration(s.from, target, reduced);
    invalidate();
  }, [target, reduced, invalidate]);
  useFrame(() => {
    const s = state.current;
    if (s.value === s.to) return;
    const t = s.duration > 0 ? (performance.now() - s.start) / s.duration : 1;
    s.value = t >= 1 ? s.to : s.from + (s.to - s.from) * easeInOutCubic(t);
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, -2);
  return state;
}

function Motor({ entries, explode, props }: { entries: Entry[]; explode: RefObject<ExplodeState>; props: MotorSceneProps }) {
  const { selected, cutaway, operating, supply, clock, onSelect, onHover, onReady } = props;
  const materials = useMemo(createMotorMaterials, []);
  const outline = useMemo(createOutlineMaterial, []);
  useEffect(() => () => { materials.dispose(); outline.dispose(); }, [materials, outline]);
  const nodeGroups = useRef<Partial<Record<NodeId, THREE.Group | null>>>({});
  const spinGroups = useRef(new Map<string, { group: THREE.Group; spin: Spin }>());
  const invalidate = useThree(s => s.invalidate);
  const gl = useThree(s => s.gl);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => {
    gl.domElement.style.cursor = props.hovered ? 'pointer' : 'grab';
    return () => { gl.domElement.style.cursor = ''; };
  }, [gl, props.hovered]);
  useEffect(() => { if (!operating) tintPhases(materials, null); invalidate(); }, [operating, materials, invalidate]);

  const withCut = useMemo(() => new Set(entries.filter(e => e.variant === 'cut').map(e => e.name.replace(/_cut$/, ''))), [entries]);
  const visible = entries.filter(e => (cutaway ? e.variant === 'cut' || !withCut.has(e.name) : e.variant === 'full'));

  useFrame(() => {
    gl.getDrawingBufferSize(outline.uniforms.size.value);
    outline.uniforms.thickness.value = 2.2 * gl.getPixelRatio();
    const value = explode.current!.value;
    for (const node of NODE_IDS) nodeGroups.current[node]?.position.fromArray(nodeOffset(node, value));
    const angles = demoAngles(clock.current!.seconds, supply);
    spinGroups.current.forEach(({ group, spin }) => { group.rotation.x = spin === 'rotor' ? angles.rotor : angles.cage; });
    if (operating) tintPhases(materials, windingCurrents(angles.electrical, supply));
    if (clock.current!.playing) invalidate();
  });

  function select(event: ThreeEvent<MouseEvent>, part: PartId) {
    if (event.delta > 6) return;
    event.stopPropagation();
    onSelect(part);
  }

  return <group position={MOTOR_ORIGIN}>
    {NODE_IDS.map(node => <group key={node} ref={g => { nodeGroups.current[node] = g; }}>
      {visible.filter(e => e.node === node).map(e => {
        const highlighted = selected === e.part;
        const meshes = e.meshes.map((m, i) => <mesh
          key={i}
          geometry={m.geometry}
          material={materials.get(m.material, highlighted, e.phase)}
          castShadow receiveShadow
          onClick={event => select(event, e.part)}
          onPointerOver={event => { event.stopPropagation(); onHover(e.part); }}
          onPointerOut={() => onHover(null)}
        >
          {highlighted && <SelectionOutline geometry={m.geometry} material={outline} />}
        </mesh>);
        if (!e.spin) return <group key={e.name} name={e.name}>{meshes}</group>;
        return <group key={e.name} name={e.name} ref={g => {
          if (g) spinGroups.current.set(e.name, { group: g, spin: e.spin });
          else spinGroups.current.delete(e.name);
        }}>{meshes}</group>;
      })}
    </group>)}
  </group>;
}

/** Smooth-normal hull drawn behind the selected mesh; it never takes pointer events. */
function SelectionOutline({ geometry, material }: { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial }) {
  const hull = useMemo(() => toCreasedNormals(geometry.index ? geometry : geometry.clone(), Math.PI), [geometry]);
  useEffect(() => () => hull.dispose(), [hull]);
  return <mesh geometry={hull} material={material} raycast={() => null} />;
}

class ModelBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function boundsCentre(bounds: Bounds) {
  return new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ).add(ORIGIN);
}

function PartLabel({ part, explode, quiet }: { part: PartId; explode: RefObject<ExplodeState>; quiet?: boolean }) {
  const anchor = useRef<THREE.Group>(null);
  // Runs before drei's Html (priority 0) projects the label, so even a single
  // on-demand frame shows the label at the part's current position.
  useFrame(() => {
    const bounds = partBounds(part, explode.current!.value);
    const centre = boundsCentre(bounds);
    anchor.current?.position.set(centre.x, bounds.max[1] + ORIGIN.y + 0.055, centre.z);
    anchor.current?.updateMatrixWorld();
  }, -1);
  const info = PART_BY_ID[part];
  return <group ref={anchor}>
    {!quiet && <Line points={[[0, -0.004, 0], [0, -0.045, 0]]} color={SELECTION_COLOUR} lineWidth={1.5} />}
    <Html center zIndexRange={[12, 0]} style={{ pointerEvents: 'none' }}>
      <div className={quiet ? 'eng-scene-label is-quiet' : 'eng-scene-label'} aria-hidden="true">
        {!quiet && <span>{info.item}</span>}{info.name}
      </div>
    </Html>
  </group>;
}

/**
 * Conceptual field dial at the drive end, driven by the same calculation as the 2D view.
 * The poles turn with the field; a field that only pulses fades with its strength instead.
 */
function FieldDial({ explode, clock, supply }: { explode: RefObject<ExplodeState>; clock: RefObject<DemoClock>; supply: Supply }) {
  const root = useRef<THREE.Group>(null);
  const poles = useRef<THREE.Group>(null);
  const needle = useRef<THREE.Group>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const arcMaterials = useMemo(() => [SELECTION_COLOUR, '#d98a55'].map(color => new THREE.MeshBasicMaterial({ color, toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })), []);
  useEffect(() => () => arcMaterials.forEach(material => material.dispose()), [arcMaterials]);
  // Runs before drei's Html (priority 0) projects the pole labels, so a single
  // on-demand frame, such as one Step while paused, shows them at the new angle.
  useFrame(() => {
    if (!root.current || !poles.current || !needle.current) return;
    root.current.visible = explode.current!.value <= ASSEMBLED_TOLERANCE;
    const angles = demoAngles(clock.current!.seconds, supply);
    poles.current.rotation.x = angles.north;
    needle.current.rotation.x = DIAL_NEEDLE_START + angles.rotor;
    for (const material of arcMaterials) material.opacity = 0.92 * angles.fieldStrength;
    for (const label of labels.current) if (label) label.style.opacity = angles.fieldStrength.toFixed(2);
  }, -1);
  const arc = (k: number) => <mesh key={k} rotation-y={Math.PI / 2} material={arcMaterials[k % 2]}>
    <ringGeometry args={[0.046, 0.057, 24, 1, (k * Math.PI) / 2 - Math.PI / 10, Math.PI / 5]} />
  </mesh>;
  return <group ref={root} position={[ORIGIN.x + 0.2, ORIGIN.y, ORIGIN.z]} visible={false}>
    <mesh rotation-y={Math.PI / 2}>
      <ringGeometry args={[0.0605, 0.0615, 96]} />
      <meshBasicMaterial color="#263b43" toneMapped={false} side={THREE.DoubleSide} transparent opacity={0.55} />
    </mesh>
    <group ref={poles}>
      {[0, 1, 2, 3].map(arc)}
      {[0, 1, 2, 3].map(k => {
        const angle = (k * Math.PI) / 2;
        return <group key={k} position={[0.004, 0.068 * Math.sin(angle), -0.068 * Math.cos(angle)]}>
          <Html center zIndexRange={[11, 0]} style={{ pointerEvents: 'none' }}>
            <span ref={el => { labels.current[k] = el; }} className={k % 2 ? 'eng-pole is-south' : 'eng-pole'} aria-hidden="true">{k % 2 ? 'S' : 'N'}</span>
          </Html>
        </group>;
      })}
    </group>
    <group ref={needle}>
      <mesh position={[0.001, 0, -0.034]}>
        <boxGeometry args={[0.002, 0.0035, 0.026]} />
        <meshBasicMaterial color="#f2b37e" toneMapped={false} />
      </mesh>
    </group>
  </group>;
}

/** The rotor pointer starts just behind a north pole so the lag is easy to follow. */
const DIAL_NEEDLE_START = (55 - 18) * (Math.PI / 180);

function fitDistance(bounds: Bounds, target: THREE.Vector3, direction: THREE.Vector3, camera: THREE.PerspectiveCamera, margin: number) {
  const forward = direction.clone().negate();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
  right.normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / margin;
  const tanH = tanV * camera.aspect;
  let distance = 0;
  for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) {
    const offset = new THREE.Vector3(x, y, z).add(ORIGIN).sub(target);
    const along = offset.dot(direction);
    distance = Math.max(distance, along + Math.abs(offset.dot(right)) / tanH, along + Math.abs(offset.dot(up)) / tanV);
  }
  return distance;
}

type CameraTween = { from: THREE.Spherical; to: THREE.Spherical; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number };

function CameraRig({ command, explodeTarget, reduced }: { command: CameraCommand; explodeTarget: number; reduced: boolean }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree(s => s.invalidate);
  const size = useThree(s => s.size);
  const tween = useRef<CameraTween | null>(null);
  const placed = useRef(false);
  const userMoved = useRef(false);

  function apply(animate: boolean) {
    const ctrl = controls.current;
    if (!ctrl || size.height === 0) return;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    let target: THREE.Vector3;
    let direction: THREE.Vector3;
    let distance: number;
    if (command.kind === 'focus') {
      const bounds = partBounds(command.part, explodeTarget);
      target = boundsCentre(bounds);
      direction = camera.position.clone().sub(ctrl.target).normalize();
      distance = Math.max(0.3, fitDistance(bounds, target, direction, camera, 1.7));
    } else {
      const bounds = modelBounds(explodeTarget);
      target = boundsCentre(bounds);
      direction = new THREE.Vector3(...CAMERA_PRESETS[command.preset].direction).normalize();
      distance = THREE.MathUtils.clamp(fitDistance(bounds, target, direction, camera, 1.12), 0.4, 3.2);
    }
    const to = new THREE.Spherical().setFromVector3(direction.clone().multiplyScalar(distance));
    if (!animate) {
      camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(to));
      ctrl.target.copy(target);
      ctrl.update();
      tween.current = null;
    } else {
      tween.current = {
        from: new THREE.Spherical().setFromVector3(camera.position.clone().sub(ctrl.target)),
        to,
        fromTarget: ctrl.target.clone(),
        toTarget: target,
        start: performance.now(),
      };
    }
    invalidate();
  }

  // Only explicit commands move the camera; explode changes alone do not.
  useEffect(() => {
    if (size.width === 0) return;
    userMoved.current = false;
    apply(placed.current && !reduced);
    placed.current = true;
  }, [command.nonce, size.width === 0]);

  // Keep a preset framed when the viewport changes shape, until the learner takes the camera.
  useEffect(() => {
    if (placed.current && !userMoved.current && command.kind === 'preset') apply(false);
  }, [size.width, size.height]);

  useFrame(() => {
    const tw = tween.current;
    const ctrl = controls.current;
    if (!tw || !ctrl) return;
    const t = Math.min(1, (performance.now() - tw.start) / 650);
    const k = easeInOutCubic(t);
    let dTheta = tw.to.theta - tw.from.theta;
    dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
    const spherical = new THREE.Spherical(
      THREE.MathUtils.lerp(tw.from.radius, tw.to.radius, k),
      THREE.MathUtils.lerp(tw.from.phi, tw.to.phi, k),
      tw.from.theta + dTheta * k,
    );
    ctrl.target.lerpVectors(tw.fromTarget, tw.toTarget, k);
    camera.position.copy(ctrl.target).add(new THREE.Vector3().setFromSpherical(spherical));
    ctrl.update();
    if (t >= 1) tween.current = null;
    invalidate();
  });

  return <OrbitControls
    ref={controls}
    makeDefault
    enablePan={false}
    enableDamping={!reduced}
    dampingFactor={0.09}
    minDistance={0.25}
    maxDistance={3.4}
    maxPolarAngle={Math.PI * 0.56}
    onStart={() => { tween.current = null; userMoved.current = true; }}
  />;
}

function SceneContents(props: MotorSceneProps) {
  const entries = useMotorEntries();
  const explode = useExplodeTween(props.explode, props.reduced);
  const invalidate = useThree(s => s.invalidate);
  const gl = useThree(s => s.gl);
  // Shadows are redrawn only when something that casts a visible one moves or appears:
  // the turning rotor sits inside the frame, so operation alone never needs a new map.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl, invalidate]);
  useEffect(() => { gl.shadowMap.needsUpdate = true; }, [props.cutaway, gl]);
  useEffect(() => { invalidate(); }, [props.playing, props.selected, props.cutaway, props.operating, props.supply, props.tick, invalidate]);
  return <>
    <Motor entries={entries} explode={explode} props={props} />
    {props.selected && <PartLabel part={props.selected} explode={explode} />}
    {props.hovered && props.hovered !== props.selected && <PartLabel part={props.hovered} explode={explode} quiet />}
    {props.operating && props.explode <= ASSEMBLED_TOLERANCE && <FieldDial explode={explode} clock={props.clock} supply={props.supply} />}
  </>;
}

export default function MotorScene(props: MotorSceneProps) {
  const [dpr, setDpr] = useState(1.5);
  return <Canvas
    shadows
    dpr={[1, dpr]}
    frameloop="demand"
    camera={{ fov: 30, near: 0.02, far: 40, position: [1.2, 0.9, 1.4] }}
    gl={{ antialias: true, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => { gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.05; }}
  >
    <PerformanceMonitor onDecline={() => setDpr(1)} />
    <color attach="background" args={['#dfe2dc']} />
    <fog attach="fog" args={['#dfe2dc', 4, 12]} />
    <Lighting />
    <Workshop />
    <ModelBoundary onError={props.onError}>
      <Suspense fallback={null}>
        <SceneContents {...props} />
      </Suspense>
    </ModelBoundary>
    <CameraRig command={props.camera} explodeTarget={props.explode} reduced={props.reduced} />
  </Canvas>;
}
