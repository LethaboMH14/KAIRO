// The /classroom teaching room: Rain (unchanged CHARACTER-002 v1 contract), a written board with measured anchors
// (classroom-board/1), the notebook shelf the lesson counts, authored camera framings and quality tiers.
// One audio clock: Rain's mouth reads the shared TeacherProvider signal passed in as `audio`; nothing here plays sound.
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import TeacherCharacter from '../../character/TeacherCharacter.tsx';
import type { AudioSource, CharacterCue, CueEvent, ReadyReport, Vec3 } from '../../character/types.ts';
import { BOARD, SHELF, lineAnchor, lineLength, resultAnchor, shelfTarget, targetsFor, type Rect } from './board.ts';
import { BOARD_FONT, drawBoard } from './drawBoard.ts';
import { framingFor, type Framing, type StageDirection } from './direction.ts';
import { FrameBudget, TIERS, fitFov, type Tier, type TierSettings } from './quality.ts';
import { attachShirtBadge } from './shirtBadge.ts';
import { advanceWriting, startWriting, type WritingPhase, type WritingState } from './writing.ts';

export type StageProps = {
  step: number;
  direction: StageDirection;
  audio: AudioSource;
  reducedMotion: boolean;
  tier: Tier;
  onReady: (report: ReadyReport) => void;
  onError: () => void;
  /** Called when measured frames stay slow, so the page can choose a lighter tier. */
  onSlow: () => void;
};

const PALETTE = { chalk: '#F5F0E6', moss: '#3E5144', sage: '#A7AF91', copper: '#AE7555', wall: '#EFE9DC', floor: '#D8C7AA' };

/** Authored framings (world metres). Narrow screens widen the field of view to keep the same horizontal span. */
export const FRAMINGS: Record<Framing, { position: Vec3; target: Vec3; fov: number }> = {
  room: { position: [0.22, 1.44, 2.62], target: [0.1, 1.18, 0.0], fov: 34 },
  board: { position: [-0.06, 1.42, 1.95], target: [0.52, 1.28, 0.05], fov: 33 },
  teacher: { position: [0.12, 1.44, 1.45], target: [0.04, 1.34, 0.0], fov: 30 },
};

class Boundary extends Component<{ onError?: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Loading() {
  const { progress } = useProgress();
  return <p className="kx-loading" role="status">Opening the classroom… {Math.round(progress)}%</p>;
}

function CameraRig({ framing, reduced }: { framing: Framing; reduced: boolean }) {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const size = useThree(s => s.size);
  const look = useRef<{ target: THREE.Vector3; goal: THREE.Vector3; position: THREE.Vector3; ready: boolean }>(
    { target: new THREE.Vector3(), goal: new THREE.Vector3(), position: new THREE.Vector3(), ready: false });
  useFrame((_, delta) => {
    const f = FRAMINGS[framing];
    const l = look.current;
    l.position.fromArray(f.position);
    l.goal.fromArray(f.target);
    const fov = fitFov(f.fov, size.width / Math.max(1, size.height));
    const k = reduced || !l.ready ? 1 : 1 - Math.exp(-3.2 * Math.min(delta, 0.05));
    camera.position.lerp(l.position, k);
    l.target.lerp(l.goal, k);
    if (!l.ready) l.target.copy(l.goal);
    camera.fov += (fov - camera.fov) * k;
    camera.updateProjectionMatrix();
    camera.lookAt(l.target);
    l.ready = true;
  });
  return null;
}

function Ribbons() {
  // The identity's broad path pattern as a quiet wall graphic, cropped by the wall edge, away from Rain's outline.
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 540;
    const g = canvas.getContext('2d')!;
    g.lineCap = 'butt';
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(167,175,145,0.32)';
    g.lineWidth = 86;
    g.beginPath();
    g.moveTo(-20, 150);
    g.lineTo(250, 150);
    g.arcTo(330, 150, 330, 240, 90);
    g.lineTo(330, 560);
    g.stroke();
    g.strokeStyle = 'rgba(167,175,145,0.2)';
    g.lineWidth = 60;
    g.beginPath();
    g.moveTo(540, 330);
    g.lineTo(470, 330);
    g.arcTo(420, 330, 420, 390, 60);
    g.lineTo(420, 560);
    g.stroke();
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[2.15, 1.62, -1.643]}>
      <planeGeometry args={[1.8, 1.9]} />
      <meshStandardMaterial map={texture} transparent roughness={0.95} />
    </mesh>
  );
}

function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.05, 0.002, 0.3]} receiveShadow>
        <circleGeometry args={[1.15, 56]} />
        <meshStandardMaterial color={PALETTE.sage} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.7, -1.65]} receiveShadow>
        <planeGeometry args={[10, 3.4]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.47, -1.645]}>
        <planeGeometry args={[10, 0.94]} />
        <meshStandardMaterial color="#B3BA9F" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.95, -1.63]}>
        <boxGeometry args={[10, 0.035, 0.03]} />
        <meshStandardMaterial color="#8E9A7E" roughness={0.7} />
      </mesh>
      {/* Window light above the shelf. */}
      <mesh position={[-1.45, 1.86, -1.64]}>
        <planeGeometry args={[1.05, 1.15]} />
        <meshStandardMaterial color="#FFF7E6" emissive="#FFF1D6" emissiveIntensity={0.85} roughness={1} />
      </mesh>
      {[[-1.45, 2.445, 1.17, 0.04], [-1.45, 1.275, 1.17, 0.04], [-1.99, 1.86, 0.04, 1.2], [-0.91, 1.86, 0.04, 1.2], [-1.45, 1.86, 0.025, 1.15]].map(([x, y, w, h]) => (
        <mesh key={`${x}${y}${w}`} position={[x, y, -1.635]}>
          <boxGeometry args={[w, h, 0.03]} />
          <meshStandardMaterial color="#9C7A5C" roughness={0.6} />
        </mesh>
      ))}
      <Ribbons />
    </group>
  );
}

function Shelf() {
  const notebooks = useRef<THREE.InstancedMesh>(null);
  const covers = useMemo(() => [PALETTE.chalk, PALETTE.sage, PALETTE.copper, '#D9DDCF'].map(c => new THREE.Color(c)), []);
  useEffect(() => {
    const mesh = notebooks.current;
    if (!mesh) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    let i = 0;
    SHELF.stacks.forEach((count, stack) => {
      for (let k = 0; k < count; k++) {
        // Deterministic small offsets so the stacks look handled, not generated.
        const jitter = ((i * 37) % 11) / 11 - 0.5;
        p.set((stack - 1) * 0.2 + jitter * 0.01, SHELF.height + 0.012 + SHELF.notebook[1] * (k + 0.5), jitter * 0.012);
        q.setFromEuler(e.set(0, jitter * 0.08, 0));
        mesh.setMatrixAt(i, m.compose(p, q, s));
        mesh.setColorAt(i, covers[(i * 3 + stack) % covers.length]);
        i++;
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [covers]);
  const total = SHELF.stacks.reduce((a, b) => a + b, 0);
  return (
    <group position={SHELF.centre} rotation={[0, SHELF.yaw, 0]}>
      <mesh position={[0, SHELF.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[SHELF.width, SHELF.height, SHELF.depth]} />
        <meshStandardMaterial color={PALETTE.moss} roughness={0.72} />
      </mesh>
      <mesh position={[0, SHELF.height + 0.006, 0]} castShadow receiveShadow>
        <boxGeometry args={[SHELF.width + 0.03, 0.012, SHELF.depth + 0.02]} />
        <meshStandardMaterial color="#8C6A50" roughness={0.6} />
      </mesh>
      <instancedMesh ref={notebooks} args={[undefined, undefined, total]} castShadow receiveShadow>
        <boxGeometry args={SHELF.notebook} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
    </group>
  );
}

type WritingRef = { current: WritingState | null };

function Board({ step, highlight, writing, settings, fontReady, onRects }: {
  step: number; highlight: string | null; writing: WritingRef; settings: TierSettings; fontReady: boolean; onRects: (r: Record<string, Rect>) => void;
}) {
  const gl = useThree(s => s.gl);
  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = settings.boardTexture;
    c.height = Math.round(settings.boardTexture * BOARD.height / BOARD.width);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, [settings.boardTexture]);
  useEffect(() => { texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy()); }, [gl, texture]);
  useEffect(() => () => texture.dispose(), [texture]);
  const drawn = useRef('');
  const layout = useRef('');
  useFrame(() => {
    const w = writing.current;
    const active = w && w.step === step && w.phase !== 'done';
    const reveal = active ? (w.phase === 'reach' ? 0 : w.reveal) : 1;
    const shown = active ? null : highlight;
    const key = `${step}|${reveal.toFixed(3)}|${shown}|${fontReady}`;
    if (key === drawn.current) return;
    drawn.current = key;
    const rects = drawBoard(canvas.getContext('2d')!, { step, reveal, highlight: shown, fontReady });
    texture.needsUpdate = true;
    const layoutKey = `${step}|${fontReady}|${canvas.width}`;
    if (layoutKey !== layout.current) {
      layout.current = layoutKey;
      onRects(rects);
    }
  });
  const [cx, cy, cz] = BOARD.centre;
  return (
    <group position={[cx, cy, cz]} rotation={[0, BOARD.yaw, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOARD.width + 0.06, BOARD.height + 0.06, 0.035]} />
        <meshStandardMaterial color="#8C6A50" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.0185]}>
        <planeGeometry args={[BOARD.width, BOARD.height]} />
        <meshStandardMaterial map={texture} roughness={0.9} />
      </mesh>
      <mesh position={[0, -BOARD.height / 2 - 0.035, 0.035]} castShadow>
        <boxGeometry args={[BOARD.width * 0.9, 0.018, 0.05]} />
        <meshStandardMaterial color="#8C6A50" roughness={0.6} />
      </mesh>
      {[-0.4, 0.4].map(x => (
        <mesh key={x} position={[x, (-cy - BOARD.height / 2 + 0.04) / 2, -0.03]} castShadow>
          <cylinderGeometry args={[0.016, 0.02, cy - BOARD.height / 2 + 0.04, 12]} />
          <meshStandardMaterial color="#7D6448" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Scene(props: StageProps & { settings: TierSettings; onLoaded: () => void }) {
  const { settings, reducedMotion } = props;
  const clock = useThree(s => s.clock);
  const scene = useThree(s => s.scene);
  const writing = useRef<WritingState | null>(null);
  const [phase, setPhase] = useState<WritingPhase | 'none'>('none');
  const [seq, setSeq] = useState(0);
  const landed = useRef(false);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [fontReady, setFontReady] = useState(false);
  const [ready, setReady] = useState(false);
  const previousStep = useRef(props.step);
  const previousDirection = useRef(props.direction.id);
  const budget = useMemo(() => new FrameBudget(), []);
  const { onSlow, onReady: reportReady, onLoaded } = props;

  useEffect(() => {
    let alive = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    (fonts ? fonts.load(`750 64px ${BOARD_FONT}`) : Promise.resolve([])).catch(() => []).finally(() => { if (alive) setFontReady(true); });
    return () => { alive = false; };
  }, []);

  // A forward step is written on the board; going back redraws at once.
  useEffect(() => {
    if (props.step > previousStep.current) {
      const next = seq + 1;
      writing.current = startWriting(next, props.step, lineLength(props.step), clock.elapsedTime, reducedMotion);
      landed.current = false;
      setSeq(next);
      setPhase(writing.current.phase);
    } else if (props.step !== previousStep.current) {
      writing.current = null;
      setPhase('none');
    }
    previousStep.current = props.step;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.step]);

  // A learner action (a new interrupting direction) finishes the writing immediately.
  useEffect(() => {
    if (props.direction.id === previousDirection.current) return;
    previousDirection.current = props.direction.id;
    if (props.direction.interrupts && writing.current && writing.current.phase !== 'done') {
      writing.current = advanceWriting(writing.current, { type: 'interrupt' });
      setPhase('done');
    }
  }, [props.direction]);

  useFrame((_, delta) => {
    const w = writing.current;
    if (w && w.phase !== 'done') {
      const next = advanceWriting(w, landed.current && w.phase === 'reach' ? { type: 'landed', now: clock.elapsedTime } : { type: 'tick', now: clock.elapsedTime });
      writing.current = next;
      if (next.phase !== w.phase) setPhase(next.phase);
    }
    // Only a focused, visible page is judged: an occluded or minimised window can throttle frames to 100-200 ms
    // without being hidden, which would otherwise read as a slow device.
    if (!ready) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus()) budget.reset();
    else if (budget.push(delta)) onSlow();
  });

  const targets = useMemo(() => targetsFor(rects, [shelfTarget()]), [rects]);
  const ids = useMemo(() => new Set(targets.map(t => t.id)), [targets]);
  const d = props.direction;
  const writingNow = phase === 'reach' || phase === 'write' || phase === 'present';
  const cue: CharacterCue = useMemo(() => {
    if (phase === 'reach' || phase === 'write') return { id: `write-${seq}-line`, type: 'point', targetId: lineAnchor(props.step), contact: 'auto' };
    if (phase === 'present') return { id: `write-${seq}-result`, type: 'point', targetId: resultAnchor(props.step), contact: 'auto' };
    // After a writing sequence the direction's cue may already have been used and finished; the character ignores a
    // finished cue id, so the post-writing cue carries the sequence number to make it new.
    const after = phase === 'done' ? `-after-${seq}` : '';
    if (d.point && ids.has(d.point)) return { id: `${d.id}-point${after}`, type: 'point', targetId: d.point, contact: 'auto' };
    return { id: `${d.id}-${d.pose}${after}`, type: d.pose };
  }, [phase, seq, props.step, d, ids]);

  const onCueState = useCallback((event: CueEvent) => {
    if (event.id === `write-${seq}-line` && (event.state === 'completed' || event.state === 'unsupported')) landed.current = true;
  }, [seq]);
  const onReady = useCallback((report: ReadyReport) => { setReady(true); onLoaded(); reportReady(report); }, [onLoaded, reportReady]);

  useEffect(() => {
    if (!ready || !settings.badge) return;
    const dispose = attachShirtBadge(scene);
    return () => dispose?.();
  }, [ready, settings.badge, scene]);

  return (
    <>
      <color attach="background" args={['#ECE5D7']} />
      <fog attach="fog" args={['#ECE5D7', 6, 14]} />
      <hemisphereLight args={['#F6F1E6', '#8D7D68', settings.environment ? 0.5 : 0.85]} />
      <directionalLight position={[2.4, 4.2, 3.1]} intensity={2.2} color="#FFF1DF" castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMap || 512, settings.shadowMap || 512]} shadow-bias={-0.0002} shadow-normalBias={0.02}
        shadow-camera-left={-2.6} shadow-camera-right={2.6} shadow-camera-top={2.6} shadow-camera-bottom={-1.2} shadow-camera-near={1} shadow-camera-far={10} />
      <directionalLight position={[-2.2, 2.6, -1.8]} intensity={0.9} color="#DFE9FF" />
      {settings.environment && <Boundary><Suspense fallback={null}><Environment files="/models/character/studio_small_09_1k.hdr" environmentIntensity={0.5} /></Suspense></Boundary>}
      <Room />
      <Shelf />
      <Board step={props.step} highlight={d.highlight} writing={writing} settings={settings} fontReady={fontReady} onRects={setRects} />
      <Boundary onError={props.onError}>
        <Suspense fallback={null}>
          <TeacherCharacter cue={cue} targets={targets} audio={props.audio} expression={writingNow ? 'focused' : d.expression}
            reducedMotion={reducedMotion} onReady={onReady} onCueState={onCueState} />
        </Suspense>
      </Boundary>
      <CameraRig framing={framingFor(d, writingNow, reducedMotion)} reduced={reducedMotion} />
    </>
  );
}

export default function ClassroomStage(props: StageProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const settings = TIERS[props.tier];
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Stop rendering while the room is scrolled out of view or the tab is hidden (rAF already pauses there).
    const io = new IntersectionObserver(entries => setVisible(entries.some(e => e.isIntersecting)), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const onLoaded = useCallback(() => setLoaded(true), []);
  return (
    <div ref={wrap} className="kx-stage" data-tier={props.tier}>
      <Canvas key={props.tier} className="kx-canvas" frameloop={visible ? 'always' : 'never'} shadows={settings.shadows ? 'soft' : false}
        dpr={settings.dpr} camera={{ position: FRAMINGS.room.position, fov: FRAMINGS.room.fov, near: 0.03, far: 40 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.toneMapping = THREE.AgXToneMapping; gl.toneMappingExposure = 1.05; }}>
        <Scene {...props} settings={settings} onLoaded={onLoaded} />
      </Canvas>
      {!loaded && <Loading />}
    </div>
  );
}
