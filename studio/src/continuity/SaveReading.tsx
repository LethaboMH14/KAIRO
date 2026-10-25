import {useState} from 'react';
import type {Lesson} from '../workspace/types';
import {addReadingPack,readMemory,writeMemory} from './model';
import './continuity.css';
export default function SaveReading({lesson}:{lesson:Lesson}){const [message,setMessage]=useState('');return <div className="kh-save-reading"><button onClick={()=>{try{writeMemory(addReadingPack(readMemory(),lesson));setMessage('Reading copy saved on this device. Open KAIRO home to read it or add notes.');}catch(e){setMessage(e instanceof Error?e.message:'Could not save. Download your notes instead.');}}}>Save reading copy</button><a href="/home#saved-reading"> Open saved reading</a><p role="status">{message}</p></div>;}
