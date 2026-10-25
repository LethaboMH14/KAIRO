import {Suspense,useEffect,useMemo} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import type {EvidenceKey} from './model';
function Sign({label,position,width=2,height=.45}:{label:string;position:[number,number,number];width?:number;height?:number}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d')!;ctx.fillStyle='#21464d';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#edf7ee';ctx.font='bold 49px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,384,82,700);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;},[label]);
 useEffect(()=>()=>texture.dispose(),[texture]);return <mesh position={position}><planeGeometry args={[width,height]}/><meshBasicMaterial map={texture}/></mesh>;
}
function Box({position,size,color,selected=false}:{position:[number,number,number];size:[number,number,number];color:string;selected?:boolean}){return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={selected?'#a8d7b5':color} roughness={.7}/></mesh>;}
function World({selected,onSelect,reduced}:{selected:EvidenceKey|null;onSelect:(key:EvidenceKey)=>void;reduced:boolean}){
 return <><color attach="background" args={['#e7efed']}/><ambientLight intensity={1.1}/><hemisphereLight args={['#fff8e4','#78988b',1.2]}/><directionalLight position={[2,8,5]} intensity={2.5} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7}/>
 <group position={[0,-.12,0]}><Box position={[0,0,0]} size={[7,.2,5.8]} color="#b69876"/><Box position={[0,1.6,-2.85]} size={[7,3.2,.16]} color="#e5e6d9"/><Box position={[-3.45,1.6,0]} size={[.16,3.2,5.8]} color="#d0ded3"/>
 <Box position={[-2.3,1.7,-2.72]} size={[1.5,1.6,.05]} color="#9fbdc2"/><Box position={[-2.3,1.7,-2.67]} size={[.04,1.6,.05]} color="#f1f0e0"/><Box position={[-2.3,1.7,-2.67]} size={[1.5,.04,.05]} color="#f1f0e0"/>
 <Sign label="NANDI’S CORNER SHOP" position={[.5,2.7,-2.74]} width={3.7} height={.6}/>
 <group onClick={e=>{e.stopPropagation();onSelect('shelf');}}><Box position={[.5,1.23,-2.18]} size={[3.1,2.3,.14]} color="#72968b" selected={selected==='shelf'}/>{[.35,1.03,1.71].map((y,row)=><group key={y}><Box position={[.5,y,-1.88]} size={[3.1,.08,.75]} color="#b6946d"/>{Array.from({length:7},(_,i)=><group key={i} position={[-.72+i*.4,y+.22,-1.87]}><Box position={[0,0,0]} size={[.29,.35,.3]} color={row===1?'#d1ad5e':'#6595b7'}/><Box position={[0,0,.156]} size={[.22,.022,.012]} color="#e3edf0"/></group>)}</group>)}<Sign label="NOTEBOOKS" position={[.5,2.27,-1.77]} width={1.9} height={.25}/></group>
 <Box position={[.9,.66,1.15]} size={[3.8,1.25,1.05]} color="#92afa1"/><Box position={[.9,1.33,1.15]} size={[4,.15,1.18]} color="#bd9e78"/>
 <group onClick={e=>{e.stopPropagation();onSelect('sales');}}><Box position={[1.9,1.63,1.15]} size={[.75,.5,.55]} color="#3c5860" selected={selected==='sales'}/><Sign label="SALES" position={[1.9,1.64,1.44]} width={.57} height={.2}/></group>
 <group onClick={e=>{e.stopPropagation();onSelect('damage');}}><Box position={[-.1,1.46,1.15]} size={[.75,.13,.55]} color="#bf805d" selected={selected==='damage'}/><Sign label="DAMAGE BOOK" position={[-.1,1.55,1.46]} width={.88} height={.19}/></group>
 <group onClick={e=>{e.stopPropagation();onSelect('delivery');}}><Box position={[-2.2,.48,.8]} size={[1.1,.85,1]} color="#c6a47a" selected={selected==='delivery'}/><Box position={[-2.2,.94,.8]} size={[1.15,.08,1.05]} color="#dec49b"/><Sign label="DELIVERY" position={[-2.2,.54,1.31]} width={.85} height={.24}/></group>
 <Box position={[2.8,.4,-1.8]} size={[.55,.7,.6]} color="#d5bd85"/><Box position={[2.8,1.1,-1.8]} size={[.5,.65,.55]} color="#c8ad74"/>
 </group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.25,0]} receiveShadow><planeGeometry args={[200,200]}/><shadowMaterial transparent opacity={.12}/></mesh>
 <OrbitControls makeDefault target={[0,1,0]} enableDamping={!reduced} minDistance={5} maxDistance={13} minPolarAngle={.35} maxPolarAngle={Math.PI*.48}/></>;
}
export default function ShopScene(props:{selected:EvidenceKey|null;onSelect:(key:EvidenceKey)=>void;reduced:boolean}){return <Canvas shadows frameloop="demand" dpr={[1,1.5]} camera={{position:[7,5.7,8],fov:42,near:.1,far:100}} gl={{antialias:true}}><Suspense fallback={null}><World {...props}/></Suspense></Canvas>;}
