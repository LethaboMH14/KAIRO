import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, Line, OrbitControls, RoundedBox, useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const locations: [number, number, number][] = [[-3.2, 1.1, 0], [0, 1.1, 0], [3.2, 1.1, 0]];
const colors = ['#468bba', '#bd8763', '#6fa995'];

function Blackboard() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#29444c'; context.fillRect(0, 0, 1024, 512);
    context.textAlign = 'center';
    context.fillStyle = '#b5cfc9'; context.font = '26px Arial';
    context.fillText('KAIRO  /  COMPUTER SCIENCE', 512, 142);
    context.fillStyle = '#eef6e9'; context.font = 'bold 78px Arial';
    context.fillText('Follow the request.', 512, 266);
    context.fillStyle = '#c2d8ce'; context.font = '30px Arial';
    context.fillText('Interface  →  API  →  Database  →  Response', 512, 351);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, 2.25, -4.015]}><planeGeometry args={[7.05, 2.02]} /><meshBasicMaterial map={texture} /></mesh>;
}

function Label({ text, active, position }: { text: string; active: boolean; position: [number, number, number] }) {
  return <Html position={position} center distanceFactor={12} zIndexRange={[19, 0]} style={{ pointerEvents: 'none' }}>
    <div className={`scene-label ${active ? 'active' : ''}`}>{text}</div>
  </Html>;
}

function BrowserModel() {
  return <group position={[0, .75, 0]} rotation={[0, .1, 0]}>
    <RoundedBox args={[1.75, 1.15, .12]} radius={.06}><meshStandardMaterial color="#263c4e" metalness={.35} roughness={.45} /></RoundedBox>
    <mesh position={[0, 0, .072]}><planeGeometry args={[1.57, .96]} /><meshStandardMaterial color="#c5e5ed" emissive="#6199ad" emissiveIntensity={.15} /></mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[-.38 + i * .38, -.04, .08]}><planeGeometry args={[.29, .39]} /><meshBasicMaterial color={i === 1 ? '#70afa2' : '#e6f1ee'} /></mesh>)}
    <mesh position={[0, .34, .08]}><planeGeometry args={[1.35, .1]} /><meshBasicMaterial color="#fffdf7" /></mesh>
    <mesh position={[0, -.75, .15]} rotation={[-Math.PI / 2, 0, 0]}><boxGeometry args={[1.85, 1.05, .09]} /><meshStandardMaterial color="#52616a" metalness={.5} roughness={.4} /></mesh>
  </group>;
}

function ServerModel({ active }: { active: boolean }) {
  return <group position={[0, .77, 0]}>
    <RoundedBox args={[1.35, 1.65, .75]} radius={.08}><meshStandardMaterial color="#334350" metalness={.45} roughness={.4} /></RoundedBox>
    {[0, 1, 2, 3].map(i => <group key={i} position={[0, .55 - i * .36, .395]}>
      <RoundedBox args={[1.13, .25, .045]} radius={.025}><meshStandardMaterial color="#647078" metalness={.55} roughness={.5} /></RoundedBox>
      <mesh position={[-.43, 0, .035]}><sphereGeometry args={[.035, 10, 10]} /><meshStandardMaterial color={active ? '#a9ebba' : '#82a6a1'} emissive="#69d899" emissiveIntensity={active ? 2 : .1} /></mesh>
      {[0, 1, 2, 3, 4].map(k => <mesh key={k} position={[-.1 + k * .12, 0, .03]}><boxGeometry args={[.055, .09, .02]} /><meshStandardMaterial color="#253640" /></mesh>)}
    </group>)}
  </group>;
}

function DatabaseModel({ active }: { active: boolean }) {
  return <group position={[0, .35, 0]}>
    {[0, 1, 2].map(i => <group key={i} position={[0, i * .42, 0]}>
      <mesh castShadow><cylinderGeometry args={[.72, .72, .36, 48]} /><meshStandardMaterial color="#8db9ad" metalness={.35} roughness={.38} /></mesh>
      <mesh position={[0, .19, 0]}><cylinderGeometry args={[.72, .72, .035, 48]} /><meshStandardMaterial color="#c4d8cf" metalness={.45} roughness={.32} /></mesh>
      <mesh position={[0, -.19, 0]}><torusGeometry args={[.7, .016, 6, 48]} /><meshStandardMaterial color="#36685c" /></mesh>
    </group>)}
    <mesh position={[0, .85, .725]}><sphereGeometry args={[.055, 12, 12]} /><meshStandardMaterial color="#d7f4ca" emissive="#bde7a3" emissiveIntensity={active ? 2 : .2} /></mesh>
  </group>;
}

function Teacher({ speaking, reduced }: { speaking: boolean; reduced: boolean }) {
  const gltf = useGLTF('/models/RobotExpressive.glb');
  const object = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const root = useRef<THREE.Group>(null);
  const { actions } = useAnimations(gltf.animations, root);
  useEffect(() => {
    if (reduced) { Object.values(actions).forEach(action => action?.stop()); return; }
    const action = actions[speaking ? 'Wave' : 'Idle'] || actions['Idle'];
    action?.reset().fadeIn(.4).play();
    return () => { action?.fadeOut(.3); };
  }, [actions, speaking, reduced]);
  return <group ref={root} position={[-4.9, .02, 2.4]} rotation={[0, .6, 0]} scale={.47}><primitive object={object} /></group>;
}

function RequestPath({ stage, playing, reduced }: { stage: number; playing: boolean; reduced: boolean }) {
  const packet = useRef<THREE.Mesh>(null);
  const targets: [number, number, number][] = [[-3.2, 1.1, 1.3], [0, 1.1, 1.3], [3.2, 1.1, 1.3], [-3.2, 1.1, 1.3]];
  const destination = useMemo(() => new THREE.Vector3(...targets[stage]), [stage]);
  useFrame((_, delta) => { if (packet.current) packet.current.position.lerp(destination, reduced ? 1 : 1 - Math.exp(-delta * 4)); });
  return <group>
    <Line points={[[-3.2, 1.1, 1.3], [0, 1.1, 1.3], [3.2, 1.1, 1.3]]} color="#7fa9b7" lineWidth={2} />
    <mesh ref={packet} position={targets[0]} visible={playing || stage > 0}>
      <sphereGeometry args={[.115, 20, 20]} /><meshStandardMaterial color="#f7ba6a" emissive="#e89c40" emissiveIntensity={.8} />
    </mesh>
  </group>;
}

function CameraReset({ nonce }: { nonce: number }) {
  const { camera } = useThree();
  useEffect(() => { camera.position.set(9.5, 7, 11.5); camera.lookAt(0, 1, 0); }, [nonce, camera]);
  return null;
}

function Room({ stage, onStage, playing, reduced, reset }: { stage: number; onStage: (n: number) => void; playing: boolean; reduced: boolean; reset: number }) {
  return <>
    <color attach="background" args={['#dce3e1']} />
    <fog attach="fog" args={['#dce3e1', 20, 38]} />
    <ambientLight intensity={1.25} />
    <hemisphereLight args={['#e8f4ff', '#8c7664', 1.5]} />
    <directionalLight position={[1, 9, 5]} intensity={3} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-.0002} />
    <directionalLight position={[-8, 4, -1]} color="#d4e9fa" intensity={1.2} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial color="#dde1dc" roughness={.85} /></mesh>
    <RoundedBox position={[0, -.22, 0]} args={[13, .4, 9]} radius={.12} receiveShadow><meshStandardMaterial color="#b6997e" roughness={.7} /></RoundedBox>
    <mesh position={[0, -.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12.7, 8.7]} /><meshStandardMaterial color="#e8e9e3" roughness={.7} /></mesh>
    <mesh position={[0, 2, -4.25]} receiveShadow><boxGeometry args={[13, 4.1, .17]} /><meshStandardMaterial color="#ecece5" /></mesh>
    <mesh position={[-6.4, 1.2, 0]}><boxGeometry args={[.16, 2.4, 8.5]} /><meshStandardMaterial color="#c9d4d2" /></mesh>
    <RoundedBox args={[7.2, 2.1, .13]} radius={.04} position={[0, 2.25, -4.1]}><meshStandardMaterial color="#29444c" roughness={.8} /></RoundedBox>
    <Blackboard />
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[-6 + i * .48, 3.9, -.5]}><boxGeometry args={[.09, .12, 7.5]} /><meshStandardMaterial color="#b79879" /></mesh>)}
    <mesh position={[5.95, 2.4, -1]}><boxGeometry args={[.12, 2.8, 4.5]} /><meshStandardMaterial color="#eaf5f5" emissive="#c8e6ec" emissiveIntensity={.35} /></mesh>
    {[-2.7, -.5].map(z => <mesh key={z} position={[5.83, 2.4, z]}><boxGeometry args={[.15, 2.8, .06]} /><meshStandardMaterial color="#8d9d9d" /></mesh>)}
    {locations.map((position, i) => <group position={position} key={i} onClick={e => { e.stopPropagation(); onStage(i); }}>
      <RoundedBox position={[0, -.57, 0]} args={[2.35, 1.1, 1.9]} radius={.05} castShadow receiveShadow><meshStandardMaterial color={stage === i || (i === 0 && stage === 3) ? '#d4dfda' : '#ecece7'} roughness={.7} /></RoundedBox>
      <mesh position={[0, -.005, 0]}><boxGeometry args={[2.38, .045, 1.93]} /><meshStandardMaterial color={colors[i]} roughness={.6} /></mesh>
      {i === 0 ? <BrowserModel /> : i === 1 ? <ServerModel active={stage === 1} /> : <DatabaseModel active={stage === 2} />}
      <Label text={['Your browser', 'Application API', 'SQLite database'][i]} active={stage === i} position={[0, .05, 1.05]} />
    </group>)}
    <RequestPath stage={stage} playing={playing} reduced={reduced} />
    <Suspense fallback={null}><Teacher speaking={playing} reduced={reduced} /></Suspense>
    <ContactShadows opacity={.35} scale={16} blur={2.5} far={6} resolution={256} color="#586665" frames={1} />
    <CameraReset nonce={reset} />
    <OrbitControls makeDefault target={[0, 1, 0]} minDistance={6} maxDistance={19} maxPolarAngle={Math.PI / 2.05} enablePan={false} />
  </>;
}

export default function Scene(props: { stage: number; onStage: (n: number) => void; playing: boolean; reduced: boolean; reset: number }) {
  return <Canvas shadows frameloop={props.reduced ? 'demand' : 'always'} dpr={[1, 1.5]} camera={{ position: [9.5, 7, 11.5], fov: 42 }} gl={{ antialias: true }}>
    <Room {...props} />
  </Canvas>;
}
