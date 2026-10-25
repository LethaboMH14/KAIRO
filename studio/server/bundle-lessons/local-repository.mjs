import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {readFile,readdir,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createVersionStore} from '../lesson-versions/store.mjs';
const ID=/^[a-zA-Z0-9_-]{1,96}$/;
export async function createLocalBundleRepository(home){
 await mkdir(home,{recursive:true});const db=new DatabaseSync(join(home,'bundle-lessons.sqlite'));db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records(kind TEXT,id TEXT,value TEXT,version TEXT,PRIMARY KEY(kind,id));');
 const versions=createVersionStore(join(home,'versions.sqlite'));
 const key=(uid,kind,id)=>{if(uid!=='local'||!['sources','revisions','progress'].includes(kind)||!ID.test(id||''))throw new TypeError('This loopback store is local only.');};
 async function current(id){try{const file=JSON.parse(await readFile(join(home,'sources',id+'.json'),'utf8'));if(!versions.getSource(id))versions.seedSource(file);return versions.getSource(id);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 const repository={async get(uid,kind,id){key(uid,kind,id);if(kind==='sources'){const value=await current(id);return value?{value,version:value.revision||'unreviewed'}:null;}
  if(kind==='revisions'){const match=/^([a-f0-9]{24})_([a-f0-9]{64})$/.exec(id);if(!match||!await current(match[1]))return null;const value=versions.getSource(match[1],match[2]);return value?{value,version:match[2]}:null;}
  const row=db.prepare('SELECT value,version FROM records WHERE kind=? AND id=?').get(kind,id);return row?{value:JSON.parse(row.value),version:row.version}:null;},
 async list(uid,kind,{limit=100}={}){key(uid,kind,'list');if(!Number.isInteger(limit)||limit<1||limit>500)throw new TypeError('Invalid list bound.');if(kind==='sources'){let files;try{files=await readdir(join(home,'sources'));}catch(e){if(e.code==='ENOENT')return[];throw e;}const out=[];for(const name of files.filter(n=>/^[a-f0-9]{24}\.json$/.test(n)).sort().slice(0,limit)){const item=await repository.get(uid,kind,name.slice(0,-5));if(item)out.push(item);}return out;}return db.prepare('SELECT id,value,version FROM records WHERE kind=? LIMIT ?').all(kind,limit).map(x=>({...x,value:JSON.parse(x.value)}));},
 async put(uid,kind,id,value,{version,create=false}={}){key(uid,kind,id);if(kind!=='progress')throw new TypeError('Source writes are not permitted here.');const text=JSON.stringify(value);if(Buffer.byteLength(text)>220*1024)throw new TypeError('Lesson record exceeds its limit.');db.exec('BEGIN IMMEDIATE');try{const old=db.prepare('SELECT version FROM records WHERE kind=? AND id=?').get(kind,id);if(create?!!old:!old||old.version!==version)throw Object.assign(new Error('Record changed. Reload before saving.'),{status:409});const next=randomUUID();db.prepare('INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET value=excluded.value,version=excluded.version').run(kind,id,text,next);db.exec('COMMIT');return{value,version:next};}catch(e){db.exec('ROLLBACK');throw e;}},
 async remove(uid,kind,id,{version}={}){key(uid,kind,id);if(kind!=='progress')throw new TypeError('Source removal is not permitted here.');const result=db.prepare('DELETE FROM records WHERE kind=? AND id=? AND version=?').run(kind,id,version);if(!result.changes)throw Object.assign(new Error('Record changed.'),{status:409});return{removed:true};},
 close(){db.close();versions.close();}};return repository;
}
