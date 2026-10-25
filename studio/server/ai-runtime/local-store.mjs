import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
/** Local loopback repository. Never used by the hosted multi-user application. */
export function createLocalAiStore(path){
 const db=new DatabaseSync(path);db.exec('CREATE TABLE IF NOT EXISTS ai_records (owner TEXT,kind TEXT,id TEXT,value TEXT,version TEXT,PRIMARY KEY(owner,kind,id))');
 return {async get(owner,kind,id){const r=db.prepare('SELECT value,version FROM ai_records WHERE owner=? AND kind=? AND id=?').get(owner,kind,id);return r?{value:JSON.parse(r.value),version:r.version}:null;},async put(owner,kind,id,value,{version,create=false}={}){
  const old=db.prepare('SELECT version FROM ai_records WHERE owner=? AND kind=? AND id=?').get(owner,kind,id);
  if(create?!!old:!old||old.version!==version){const e=new Error('Record changed');e.status=409;throw e;}
  const next=randomUUID();db.prepare('INSERT INTO ai_records VALUES (?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET value=excluded.value,version=excluded.version').run(owner,kind,id,JSON.stringify(value),next);return{value,version:next};
 },close(){db.close();}};
}
