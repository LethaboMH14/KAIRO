import {useMemo,useRef,type MutableRefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {blendAmount,type AudioSignal,type Gesture,type Expression} from './motion';

type Props={gesture:Gesture;expression:Expression;signal:MutableRefObject<AudioSignal>;speaking:boolean;reduced:boolean;};
export default function TeacherAvatar({gesture,expression,signal,speaking,reduced}:Props){
 const {scene}=useGLTF('/models/teacher/teacher.glb');
 const rig=useMemo(()=>{
  const root=SkeletonUtils.clone(scene);root.updateMatrixWorld(true);
  const bones:Record<string,{bone:THREE.Bone;rest:THREE.Quaternion;world:THREE.Quaternion;direction:THREE.Vector3}>={};const faces:THREE.Mesh[]=[];
  root.traverse(obj=>{if(obj instanceof THREE.Bone){const world=obj.getWorldQuaternion(new THREE.Quaternion());bones[obj.name]={bone:obj,rest:obj.quaternion.clone(),world,direction:new THREE.Vector3(0,1,0).applyQuaternion(world)};}if(obj instanceof THREE.Mesh){obj.castShadow=true;obj.receiveShadow=true;if(obj.morphTargetDictionary)faces.push(obj);}});
  return {root,bones,faces};
 },[scene]);
 const time=useRef(0),mouth=useRef(0);const scratch=useMemo(()=>({q:new THREE.Quaternion(),parent:new THREE.Quaternion(),v:new THREE.Vector3(),offset:new THREE.Quaternion(),e:new THREE.Euler()}),[]);
 useFrame((_,delta)=>{
  time.current+=Math.min(delta,.1);const t=time.current,a=reduced?1:blendAmount(delta),g=speaking&&gesture==='idle'?'explain':gesture;
  function aim(name:string,x:number,y:number,z:number){const b=rig.bones[name];if(!b)return;scratch.v.set(x,y,z).normalize();scratch.q.setFromUnitVectors(b.direction,scratch.v).multiply(b.world);b.bone.parent!.getWorldQuaternion(scratch.parent);scratch.q.premultiply(scratch.parent.invert());b.bone.quaternion.slerp(scratch.q,a);b.bone.updateWorldMatrix(false,true);}
  const pulse=reduced?0:Math.sin(t*2.2)*.045;
  aim('LeftArm',g==='point'?.9:g==='explain'?.45:.12,g==='point'?.03:-.8,g==='explain'?.35:.04);
  aim('LeftForeArm',g==='point'?.9:g==='explain'?.2:-.04,g==='point'?.1:g==='explain'?-.2:-.95,g==='explain'?.65+pulse:.12);
  aim('RightArm',-.12,-.85,g==='explain'?.22:.03);aim('RightForeArm',g==='explain'?-.2:.02,g==='explain'?-.35:-.95,g==='explain'?.65-pulse:.15);
  for(const side of ['Left','Right'])for(const finger of ['Index','Middle','Ring','Pinky'])for(const joint of [1,2,3]){
   const b=rig.bones[`${side}Hand${finger}${joint}`];if(!b)continue;const curl=g==='point'&&side==='Left'&&finger!=='Index'?.7:.12;
   scratch.offset.setFromEuler(scratch.e.set(curl,0,0));scratch.q.copy(b.rest).multiply(scratch.offset);b.bone.quaternion.slerp(scratch.q,a);
  }
  const head=rig.bones.Head;if(head){scratch.offset.setFromEuler(scratch.e.set(g==='listen'?-.06:reduced?0:Math.sin(t*1.3)*.018,g==='point'?.25:0,expression==='curious'?.07:0));scratch.q.copy(head.rest).multiply(scratch.offset);head.bone.quaternion.slerp(scratch.q,a);}
  const blink=reduced?0:Math.pow(Math.max(0,Math.cos(t*1.65)),45);mouth.current=THREE.MathUtils.lerp(mouth.current,speaking?signal.current.energy:0,a);
  for(const mesh of rig.faces){const dict=mesh.morphTargetDictionary!,values=mesh.morphTargetInfluences!;for(const [name,target] of Object.entries({jawOpen:mouth.current,eyeBlinkLeft:blink,eyeBlinkRight:blink,mouthSmileLeft:expression==='warm'?.25:.04,mouthSmileRight:expression==='warm'?.25:.04,browInnerUp:expression==='curious'?.45:expression==='focused'?.12:0,browDownLeft:expression==='focused'?.15:0,browDownRight:expression==='focused'?.15:0})){if(dict[name]!==undefined)values[dict[name]]=THREE.MathUtils.lerp(values[dict[name]],target,a);}}
 });
 return <primitive object={rig.root} dispose={null}/>;
}
