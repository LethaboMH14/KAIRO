import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
const titles=['What happens after a click?','The API receives your request.','SELECT lessons WHERE topic = ?','Rows → JSON → your screen.'];
const paths=['BROWSER   →   REQUEST','REQUEST   →   API   →   QUERY','QUERY   →   DATABASE   →   ROWS','ROWS   →   API   →   BROWSER'];
function Classroom({view}:{view:string}){
  const {scene}=useGLTF('/models/classroom/classroom.glb');
  const room=useMemo(()=>{const copy=scene.clone(true);copy.traverse(o=>{if(o instanceof THREE.Mesh){
    o.castShadow=false;o.receiveShadow=true;
    if(/blackboard|boardframe/.test(o.name.toLowerCase()))o.visible=false;
    // The source uses legacy Cycles nodes; explicitly author browser PBR materials.
    const multiple=Array.isArray(o.material);
    const originals:THREE.Material[]=Array.isArray(o.material)?o.material:[o.material];
    o.userData.cutaway=/wall|door|window|ceiling|ceilling|blind|pipe|radiat/.test((o.name+' '+originals.map(m=>m.name).join(' ')).toLowerCase());
    const replacements=originals.map((original:THREE.Material)=>{
    const name=(original.name+' '+o.name).toLowerCase();
    let color='#c8cbbd',metalness=0,roughness=.78;
    if(/wall|ceil|beam|pillar|column/.test(name))color='#e9e2cc';
    if(/floor|parquet|plank/.test(name))color='#b8a082';
    if(/desk|table|wood|chair.*seat|chair.*back/.test(name))color='#a77e52';
    if(/chair|chamferbox/.test(name)){color='#688479';metalness=.12;roughness=.56;}
    if(/pipe|metal|handle|radiator|heater/.test(name)){color='#a4aea1';metalness=.4;}
    if(/blackboard|blackboard_uppart/.test(name))color='#294840';
    if(/frame|door/.test(name))color='#8c795b';
    if(/paper|book/.test(name))color='#e8ddbb';
    if(/lamp|blind/.test(name))color='#d9d4bd';
    if(/glass|window/.test(name))color='#d9e9e5';
    if(/ceiling|ceilling/.test(name))color='#e9e2cc';
    if(/blackplastic|blackpaint/.test(name))color='#394840';
    if(/schooldesk_wood|teacherdesk_wood/.test(name))color='#b1936e';
    if(/metal/.test(name)){metalness=.45;roughness=.45;}
    return new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide});
    });
    o.material=multiple?replacements:replacements[0];
  }});return copy;},[scene]);
  useEffect(()=>()=>room.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach((m:THREE.Material)=>m.dispose());}),[room]);
  useEffect(()=>{room.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.cutaway)o.visible=view!=='overview';});},[room,view]);
  return <primitive object={room}/>;
}
type BoardContent={title:string;line:string;count:number};
function Board({step,board}:{step:number;board?:BoardContent}){
  const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=640;const c=canvas.getContext('2d')!;
    c.fillStyle='#213d3b';c.fillRect(0,0,1536,640);c.fillStyle='#9cbdb1';c.font='24px Arial';c.fillText(`KAIRO   /   ${board?'YOUR SOURCE-BASED LESSON':'THE JOURNEY BEHIND A CLICK'}   /   0${step+1}`,85,90);
    const wrap=(value:string,y:number,font:string,max:number)=>{c.font=font;const words=value.split(/\s+/);let line='',row=0;for(const word of words){if(c.measureText(line+' '+word).width>1350&&line){c.fillText(line,85,y+row*58);row++;line=word;if(row>=max)return;}else line+=(line?' ':'')+word;}c.fillText(line,85,y+row*58);};
    c.fillStyle='#f3f3dc';wrap(board?.title||titles[step],230,'bold 50px Arial',2);c.fillStyle='#c3e2c9';wrap(board?.line||paths[step],385,'32px Arial',2);
    c.fillStyle='#6b8e80';c.fillRect(85,530,1366,3);c.fillStyle='#f3f3dc';c.fillRect(85,530,1366*(step+1)/(board?.count||4),3);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[step,board?.title,board?.line,board?.count]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={[.897,1.8,-3.02]}><planeGeometry args={[3.7,1.54]}/><meshBasicMaterial map={texture}/></mesh>;
}
const presets:Record<string,{position:THREE.Vector3;target:THREE.Vector3}>={
  seat:{position:new THREE.Vector3(2.57,1.5,4.3),target:new THREE.Vector3(.897,1.6,-2.5)},
  front:{position:new THREE.Vector3(.7,1.65,.6),target:new THREE.Vector3(.897,1.8,-3.21)},
  overview:{position:new THREE.Vector3(9,9,12),target:new THREE.Vector3(-.5,0.8,0)},
};
function CameraRig({view,reduced}:{view:string;reduced:boolean}){
  const controls=useRef<React.ComponentRef<typeof OrbitControls>>(null);const {camera,invalidate}=useThree();const moving=useRef(true);
  useEffect(()=>{moving.current=true;if(reduced){camera.position.copy(presets[view].position);controls.current?.target.copy(presets[view].target);controls.current?.update();moving.current=false;}invalidate();},[view,reduced,camera,invalidate]);
  useFrame((_,delta)=>{if(!moving.current||!controls.current)return;const p=presets[view];camera.position.lerp(p.position,1-Math.exp(-delta*5));controls.current.target.lerp(p.target,1-Math.exp(-delta*5));controls.current.update();if(camera.position.distanceTo(p.position)<.015)moving.current=false;});
  return <OrbitControls ref={controls} makeDefault target={[-.3,1.6,-2.5]} enableDamping={!reduced} maxDistance={22} minDistance={1} maxPolarAngle={Math.PI*.52} onStart={()=>{moving.current=false;}}/>;
}
function World({step,view,reduced,board}:{step:number;view:string;reduced:boolean;board?:BoardContent}){
 return <><color attach="background" args={['#dce3df']}/><ambientLight intensity={.55}/><hemisphereLight args={['#f5f4df','#849a8f',.8]}/><directionalLight position={[-3,7,1]} intensity={2} color="#fff2d9"/><directionalLight position={[2,3,4]} intensity={.65}/><Suspense fallback={null}><Classroom view={view}/></Suspense><Board step={step} board={board}/><CameraRig view={view} reduced={reduced}/></>;
}
export default function LectureScene(props:{step:number;view:string;reduced:boolean;board?:BoardContent}){
  return <Canvas dpr={[1,1.5]} frameloop={props.reduced?'demand':'always'} camera={{position:[2.57,1.5,4.3],fov:60,near:.06,far:70}} gl={{antialias:true}}><World {...props}/></Canvas>;
}
