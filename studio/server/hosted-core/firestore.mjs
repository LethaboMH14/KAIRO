import {createHash} from 'node:crypto';

const kinds=new Set(['sources','lessons','jobs','progress']);
const idPattern=/^[a-zA-Z0-9_-]{1,96}$/;
export function ownerKey(uid){
  if(typeof uid!=='string'||uid.length<1||uid.length>128||/[\x00-\x1f\x7f]/.test(uid))throw new TypeError('Invalid owner identity.');
  return createHash('sha256').update(uid).digest('hex');
}
function conflict(){const e=new Error('This record changed. Reload before saving.');e.status=409;return e;}
export function createOwnerRepository({projectId,databaseId='(default)',getToken,fetchFn=fetch}){
  if(!/^[a-z][a-z0-9-]{4,62}$/.test(projectId||'')||!/^\(default\)$|^[a-z][a-z0-9-]{2,61}$/.test(databaseId)||typeof getToken!=='function')throw new TypeError('Invalid persistence configuration.');
  const base=`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  const path=(uid,kind,id)=>{
    if(!kinds.has(kind)||!idPattern.test(id||''))throw new TypeError('Invalid record address.');
    return `${base}/users/${ownerKey(uid)}/${kind}/${id}`;
  };
  function decode(doc,uid,kind,id){
    if(doc.name!==path(uid,kind,id).slice('https://firestore.googleapis.com/v1/'.length)||doc.fields?.owner?.stringValue!==ownerKey(uid)||doc.fields?.kind?.stringValue!==kind||doc.fields?.id?.stringValue!==id||typeof doc.updateTime!=='string')throw new Error('Stored record identity could not be verified.');
    const raw=doc.fields?.payload?.stringValue;
    if(typeof raw!=='string'||Buffer.byteLength(raw)>220*1024)throw new Error('Stored record is invalid.');
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Stored record is invalid.');
    return {id,value,version:doc.updateTime};
  }
  async function request(url,method,body,signal){
    signal?.throwIfAborted();const token=await getToken();signal?.throwIfAborted();
    const timer=AbortSignal.timeout(20000);
    let response;try{response=await fetchFn(url,{method,redirect:'error',signal:signal?AbortSignal.any([signal,timer]):timer,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','x-goog-user-project':projectId},...(body?{body:JSON.stringify(body)}:{})});}catch{throw new Error('Cloud records are unavailable.');}
    if(response.status===404)return null;
    if([409,412].includes(response.status))throw conflict();
    if(response.status===400){const details=await response.json().catch(()=>null);if(details?.error?.status==='FAILED_PRECONDITION')throw conflict();}
    if(!response.ok)throw new Error('Cloud records are unavailable.');
    if(method==='DELETE')return true;
    const reader=response.body?.getReader();if(!reader)throw new Error('Cloud record response is empty.');
    const chunks=[];let size=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>500*1024)throw new Error('Cloud record response is too large.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  function precondition(version,create){
    if(create)return 'currentDocument.exists=false';
    if(typeof version!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(version))throw new TypeError('The saved version is required.');
    return `currentDocument.updateTime=${encodeURIComponent(version)}`;
  }
  return Object.freeze({
    async get(uid,kind,id,signal){const doc=await request(path(uid,kind,id),'GET',null,signal);return doc?decode(doc,uid,kind,id):null;},
    async put(uid,kind,id,value,{version,create=false,signal}={}){
      const url=path(uid,kind,id);if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('A record object is required.');
      const raw=JSON.stringify(value);if(Buffer.byteLength(raw)>220*1024)throw new TypeError('Record exceeds the size limit.');
      const fields={owner:{stringValue:ownerKey(uid)},kind:{stringValue:kind},id:{stringValue:id},payload:{stringValue:raw}};
      const doc=await request(`${url}?${precondition(version,create)}`,'PATCH',{fields},signal);
      if(!doc)throw conflict();return decode(doc,uid,kind,id);
    },
    async remove(uid,kind,id,{version,signal}={}){const result=await request(`${path(uid,kind,id)}?${precondition(version,false)}`,'DELETE',null,signal);return {removed:result===true};}
  });
}
