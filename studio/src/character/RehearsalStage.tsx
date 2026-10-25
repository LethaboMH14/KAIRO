// 3D stage for the isolated character rehearsal: a daylit teaching corner, a board whose content changes only through
// the harness's allowed action, real targets, camera presets and a measured frame-time probe.
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import TeacherCharacter from './TeacherCharacter.tsx';
import { BOARD, BOARD_SPOTS, BOARD_STEPS, DESK, EASEL, TARGETS } from './lesson.ts';
import type { AudioSource, CharacterCue, CueEvent, Expression, InstrumentSample, ReadyReport } from './types.ts';

export type CameraPreset = 'wide' | 'front' | 'threeQuarter' | 'face' | 'side' | 'back' | 'board';
/** Side and back sit on clear lines of sight: the board blocks views from her left and the easel her true right
 *  profile, so the side view is 30 degrees behind her right profile and the back view 30 degrees off straight behind. */
export const CAMERA_PRESETS: Record<CameraPreset, { label: string; position: [number, number, number]; target: [number, number, number]; fov: number }> = {
  wide: { label: 'Classroom', position: [0.55, 1.55, 3.45], target: [0.18, 1.08, -0.12], fov: 36 },
  front: { label: 'Front', position: [0, 1.0, 3.05], target: [0, 0.9, 0], fov: 33 },
  threeQuarter: { label: 'Three-quarter', position: [1.75, 1.35, 2.25], target: [0.12, 1.02, 0], fov: 33 },
  face: { label: 'Face', position: [0.08, 1.5, 0.62], target: [0, 1.46, 0], fov: 30 },
  side: { label: 'Side', position: [-2.34, 1.1, -1.35], target: [0, 0.88, 0], fov: 36 },
  back: { label: 'Back', position: [-0.95, 1.15, -1.57], target: [0, 0.95, 0], fov: 49 },
  board: { label: 'Over the shoulder', position: [-0.55, 1.62, 1.35], target: [0.42, 1.25, -0.16], fov: 38 },
};

export type PerfSample = { fps: number; frameMs: number; p95Ms: number; calls: number; triangles: number; textures: number; geometries: number };

type StageProps = {
  cue: CharacterCue; audio: AudioSource; expression: Expression; reducedMotion: boolean; boardStep: number;
  camera: CameraPreset; showTargets: boolean; onReady: (r: ReadyReport) => void; onCueState: (e: CueEvent) => void;
  onModelError: (message: string) => void; onPerf: (p: PerfSample) => void; instrument?: (s: InstrumentSample) => void; modelUrl?: string;
};

class ModelBoundary extends Component<{ onError: (m: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { this.props.onError(error instanceof Error ? error.message : String(error)); }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Drawn over the stage in the page itself: a drei Html fallback inside the canvas mounts a second React root,
 *  whose teardown when the model resolves threw a removeChild NotFoundError. */
function Loading() {
  const { progress } = useProgress();
  return <div className="kc-loading" role="status">Loading the teacher… {Math.round(progress)}%</div>;
}

function CameraRig({ preset, reduced }: { preset: CameraPreset; reduced: boolean }) {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree(s => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const goal = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 33, moving: true });
  useEffect(() => {
    const p = CAMERA_PRESETS[preset];
    goal.current.position.fromArray(p.position);
    goal.current.target.fromArray(p.target);
    goal.current.fov = p.fov;
    goal.current.moving = true;
  }, [preset]);
  useFrame((_, delta) => {
    const g = goal.current;
    if (!g.moving) return;
    const k = reduced ? 1 : 1 - Math.exp(-6 * Math.min(delta, 0.05));
    camera.position.lerp(g.position, k);
    camera.fov += (g.fov - camera.fov) * k;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.lerp(g.target, k);
      controls.update();
    } else camera.lookAt(g.target);
    if (camera.position.distanceTo(g.position) < 0.002) g.moving = false;
  });
  return null;
}

function PerfProbe({ onPerf }: { onPerf: (p: PerfSample) => void }) {
  const gl = useThree(s => s.gl);
  const samples = useRef<number[]>([]);
  const last = useRef(0);
  useFrame((state, delta) => {
    samples.current.push(delta * 1000);
    if (state.clock.elapsedTime - last.current < 1) return;
    last.current = state.clock.elapsedTime;
    const list = samples.current.splice(0).sort((a, b) => a - b);
    if (!list.length) return;
    const mean = list.reduce((a, b) => a + b, 0) / list.length;
    const sample: PerfSample = {
      fps: Math.round(1000 / mean * 10) / 10, frameMs: Math.round(mean * 10) / 10,
      p95Ms: Math.round(list[Math.min(list.length - 1, Math.floor(list.length * 0.95))] * 10) / 10,
      calls: gl.info.render.calls, triangles: gl.info.render.triangles, textures: gl.info.memory.textures, geometries: gl.info.memory.geometries,
    };
    (window as unknown as { __kairoCharacterPerf?: PerfSample }).__kairoCharacterPerf = sample;
    onPerf(sample);
  });
  return null;
}

function boardTexture(step: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 714;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#2f5a4f';
  g.fillRect(0, 0, 1024, 714);
  const grad = g.createRadialGradient(512, 300, 80, 512, 357, 640);
  grad.addColorStop(0, 'rgba(255,255,255,0.07)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 714);
  g.fillStyle = '#cfe3d9';
  g.font = '600 30px Manrope, Arial, sans-serif';
  g.fillText('KAIRO  ·  STOCK CONTROL', 64, 82);
  const s = BOARD_STEPS[step];
  g.fillStyle = '#f2f7f1';
  g.font = '700 46px Manrope, Arial, sans-serif';
  g.fillText(s.title, 64, 168);
  // Highlighted formula: its centre is the "formula" target.
  const fx = 1024 * (0.5 + BOARD_SPOTS.formula[0] / BOARD.width), fy = 714 * (0.5 - BOARD_SPOTS.formula[1] / BOARD.height);
  g.strokeStyle = '#f3d27a';
  g.lineWidth = 6;
  g.strokeRect(fx - 250, fy - 70, 500, 140);
  g.fillStyle = '#ffffff';
  g.font = '700 84px Manrope, Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText(s.formula, fx, fy + 32);
  // Answer box: the "answer" target.
  const ax = 1024 * (0.5 + BOARD_SPOTS.answer[0] / BOARD.width), ay = 714 * (0.5 - BOARD_SPOTS.answer[1] / BOARD.height);
  g.strokeStyle = '#a9cbbd';
  g.lineWidth = 4;
  g.strokeRect(ax - 120, ay - 52, 240, 104);
  g.fillStyle = '#e7f1ea';
  g.font = '600 50px Manrope, Arial, sans-serif';
  g.fillText(step === 2 ? '23' : '?', ax, ay + 18);
  g.textAlign = 'left';
  g.fillStyle = '#b8d3c8';
  g.font = '400 27px DM Sans, Arial, sans-serif';
  g.textAlign = 'right';
  g.fillText(`Step ${step + 1} of ${BOARD_STEPS.length}`, 960, 650);
  g.textAlign = 'left';
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Board({ step }: { step: number }) {
  const texture = useMemo(() => boardTexture(step), [step]);
  useEffect(() => () => texture.dispose(), [texture]);
  const [cx, cy, cz] = BOARD.centre;
  return (
    <group position={[cx, cy, cz]} rotation={[0, BOARD.yaw, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOARD.width + 0.06, BOARD.height + 0.06, 0.035]} />
        <meshStandardMaterial color="#c9b79a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.0185]}>
        <planeGeometry args={[BOARD.width, BOARD.height]} />
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>
      {[-0.32, 0.32].map(x => (
        <mesh key={x} position={[x, -0.66, -0.02]} castShadow>
          <cylinderGeometry args={[0.016, 0.02, 0.72, 12]} />
          <meshStandardMaterial color="#8f7a5c" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#d9c7a8" roughness={0.78} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.002, 0.25]} receiveShadow>
        <circleGeometry args={[1.25, 48]} />
        <meshStandardMaterial color="#a9bfa9" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.6, -1.65]} receiveShadow>
        <planeGeometry args={[9, 3.2]} />
        <meshStandardMaterial color="#efe6d6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, -1.64]}>
        <planeGeometry args={[9, 0.9]} />
        <meshStandardMaterial color="#b9c9b9" roughness={0.85} />
      </mesh>
      <mesh position={[1.45, 1.75, -1.63]}>
        <planeGeometry args={[1.3, 1.25]} />
        <meshStandardMaterial color="#fff7e6" emissive="#fff1d6" emissiveIntensity={0.85} roughness={1} />
      </mesh>
      <mesh position={[-1.15, 1.78, -1.635]}>
        <planeGeometry args={[0.62, 0.82]} />
        <meshStandardMaterial color="#d9845f" roughness={0.8} />
      </mesh>
      <mesh position={[-1.15, 1.78, -1.63]}>
        <circleGeometry args={[0.16, 32]} />
        <meshStandardMaterial color="#f4e2b8" roughness={0.8} />
      </mesh>
      <group position={EASEL.centre} rotation={[0, EASEL.yaw, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.66, 0.025]} />
          <meshStandardMaterial color="#f4ead7" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0.0135]}>
          <circleGeometry args={[0.13, 40]} />
          <meshStandardMaterial color="#d9845f" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.21, 0.0135]}>
          <planeGeometry args={[0.34, 0.05]} />
          <meshStandardMaterial color="#2f5a4f" roughness={0.8} />
        </mesh>
        {[-0.18, 0.18].map(x => (
          <mesh key={x} position={[x, -0.86, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.014, 1.15, 8]} />
            <meshStandardMaterial color="#8f7a5c" roughness={0.5} />
          </mesh>
        ))}
      </group>
      <group position={DESK.centre}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.04, 0.45]} />
          <meshStandardMaterial color="#b88b5d" roughness={0.55} />
        </mesh>
        {[[-0.31, -0.19], [0.31, -0.19], [-0.31, 0.19], [0.31, 0.19]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.18, z]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
            <meshStandardMaterial color="#7d6448" />
          </mesh>
        ))}
        <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0.15]} castShadow>
          <boxGeometry args={[0.26, 0.19, 0.012]} />
          <meshStandardMaterial color="#20313a" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.4175, 0]} rotation={[-Math.PI / 2, 0, 0.15]}>
          <planeGeometry args={[0.235, 0.165]} />
          <meshStandardMaterial color="#cfe6dc" emissive="#9fc7b6" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function TargetMarkers() {
  return <group>{TARGETS.map(t => (
    <mesh key={t.id} position={t.position}>
      <sphereGeometry args={[0.012, 16, 12]} />
      <meshBasicMaterial color="#ff7a45" toneMapped={false} />
    </mesh>
  ))}</group>;
}

export default function RehearsalStage(props: StageProps) {
  const [loaded, setLoaded] = useState(false);
  const { onReady: reportReady } = props;
  const onReady = useCallback((report: ReadyReport) => { setLoaded(true); reportReady(report); }, [reportReady]);
  return (
    <>
      <Canvas
        className="kc-canvas"
        shadows
        dpr={[1, 1.75]}
        camera={{ position: CAMERA_PRESETS.wide.position, fov: CAMERA_PRESETS.wide.fov, near: 0.03, far: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <color attach="background" args={['#e9e3d6']} />
        <fog attach="fog" args={['#e9e3d6', 6, 14]} />
        <hemisphereLight args={['#f6f1e6', '#8d7d68', 0.55]} />
        <directionalLight position={[2.4, 4.2, 3.1]} intensity={2.3} color="#fff1df" castShadow
          shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.02}
          shadow-camera-left={-2.4} shadow-camera-right={2.4} shadow-camera-top={2.6} shadow-camera-bottom={-1.2} shadow-camera-near={1} shadow-camera-far={10} />
        <directionalLight position={[-2.2, 2.6, -1.8]} intensity={1.1} color="#dfe9ff" />
        <Suspense fallback={null}>
          <Environment files="/models/character/studio_small_09_1k.hdr" environmentIntensity={0.55} />
        </Suspense>
        <Room />
        <Board step={props.boardStep} />
        {props.showTargets && <TargetMarkers />}
        <ModelBoundary onError={props.onModelError}>
          <Suspense fallback={null}>
            <TeacherCharacter cue={props.cue} targets={TARGETS} audio={props.audio} expression={props.expression}
              reducedMotion={props.reducedMotion} onReady={onReady} onCueState={props.onCueState}
              instrument={props.instrument} url={props.modelUrl} />
          </Suspense>
        </ModelBoundary>
        <OrbitControls makeDefault enablePan={false} minDistance={0.45} maxDistance={6} maxPolarAngle={1.62} enableDamping />
        <CameraRig preset={props.camera} reduced={props.reducedMotion} />
        <PerfProbe onPerf={props.onPerf} />
      </Canvas>
      {!loaded && <Loading />}
    </>
  );
}
