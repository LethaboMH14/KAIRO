export type AccountStatus={enabled:boolean;status:string;storageKey?:string;scopeLabel:string;email?:string;hostedUrl?:string};
// One status request per document: the memo is tied to the current window object.
let memo:Promise<AccountStatus>|null=null,owner:unknown=null;
export function getAccountStatus():Promise<AccountStatus>{
 const doc=(globalThis as {window?:unknown}).window??null;
 if(memo&&owner===doc)return memo;
 owner=doc;
 const request:Promise<AccountStatus>=fetch('/api/account/status',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('status '+r.status);return r.json();}).catch(e=>{if(memo===request)memo=null;throw e;});
 memo=request;
 return request;
}
