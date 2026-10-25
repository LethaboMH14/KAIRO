import {useEffect,useState} from 'react';
import Opportunities from '../opportunities/Opportunities';
export default function OpportunitiesPage(){const [value,setValue]=useState<{records:unknown;limitations:unknown}>({records:[],limitations:[]}),[message,setMessage]=useState('Checking opportunity records…');
 useEffect(()=>{const c=new AbortController();void fetch('/api/workspace/opportunities',{signal:c.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(v=>{if(!c.signal.aborted){setValue(v);setMessage('Curated source records. Check the original provider before applying.');}}).catch(()=>{if(!c.signal.aborted)setMessage('Records could not load. Your learning material remains available.');});return()=>c.abort();},[]);
 return <main className="ka-page"><a href="/direction">Back to my direction</a><h1>Funding and opportunities</h1><p role="status">{message}</p><Opportunities records={value.records} limitations={value.limitations}/><p><a href="/sources">Build the skills from your material</a></p></main>;
}
