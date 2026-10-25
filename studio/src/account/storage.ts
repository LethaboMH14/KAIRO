let prefix='';
export function configureLearnerStorage(scope:string|null){if(scope!==null&&!/^[a-f0-9]{64}$|^guest$/.test(scope))throw Error('Invalid learning storage scope.');prefix=scope===null?'':`kairo-private-${scope}:`;}
const native=()=>globalThis.localStorage;
const notify=()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('kairo-learning-storage'));};
export const learnerStorage={
 getItem(key:string){return native().getItem(prefix+key);},
 setItem(key:string,value:string){native().setItem(prefix+key,value);notify();},
 removeItem(key:string){native().removeItem(prefix+key);notify();},
};
export function syncMarker():string|null{return prefix?native().getItem(prefix+'__kairo_sync'):null;}
export function markSynced(version:string){if(prefix)native().setItem(prefix+'__kairo_sync',version);}
export function learningSnapshot():Record<string,string>{const store=native(),value:Record<string,string>={};if(!prefix)return value;for(let i=0;i<store.length;i++){const key=store.key(i);if(key?.startsWith(prefix)){const plain=key.slice(prefix.length);if(plain.length<=160&&plain!=='__kairo_sync')value[plain]=store.getItem(key)||'';}}if(Object.keys(value).length>100||new TextEncoder().encode(JSON.stringify(value)).length>180000)throw Error('Your device work is too large for one cloud save. Download a copy.');return value;}
export function restoreLearningSnapshot(value:unknown){if(!prefix||!value||typeof value!=='object'||Array.isArray(value))throw Error('Saved progress is invalid.');const entries=Object.entries(value);if(entries.length>100||new TextEncoder().encode(JSON.stringify(value)).length>180000||entries.some(([k,v])=>!k||k.length>160||typeof v!=='string'))throw Error('Saved progress exceeds supported limits.');const store=native(),old:string[]=[];for(let i=0;i<store.length;i++){const key=store.key(i);if(key?.startsWith(prefix))old.push(key);}for(const [key,v] of entries)store.setItem(prefix+key,v as string);for(const key of old)if(!Object.hasOwn(value,key.slice(prefix.length)))store.removeItem(key);}
