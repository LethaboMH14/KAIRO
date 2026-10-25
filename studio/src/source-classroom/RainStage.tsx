import {Suspense,type MutableRefObject} from 'react';
import {Canvas} from '@react-three/fiber';
import TeacherCharacter from '../character/TeacherCharacter';
import type {AudioInput,CharacterCue} from '../character/types';

/** No stock-example board or invented point anchors for arbitrary source lessons. */
export default function RainStage({audio,cue,reduced,onError}:{audio:MutableRefObject<AudioInput>;cue:CharacterCue;reduced:boolean;onError:()=>void}){
 return <div style={{height:360}} role="img" aria-label="KAIRO, your reading companion. Lesson text and controls follow below."><Canvas camera={{position:[0,1.3,3.1],fov:36}} dpr={[1,1.25]} onCreated={({camera})=>camera.lookAt(0,1,0)} fallback={<p>The 3D view is unavailable. Use the lesson text below.</p>} onError={onError}>
  <color attach="background" args={['#e3e7da']}/><ambientLight intensity={1.4}/><directionalLight position={[2,3,4]} intensity={2}/>
  <Suspense fallback={null}><TeacherCharacter audio={audio} cue={cue} targets={[]} expression={cue.type==='listen'?'encouraging':'neutral'} reducedMotion={reduced} onReady={()=>{}} onCueState={()=>{}}/></Suspense>
 </Canvas></div>;
}
