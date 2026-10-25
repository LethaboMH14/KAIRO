/**
 * Atomic Firestore Admin local-v1 lesson save primitive. NOT mounted.
 * Server callers must supply authenticated UID, validated lesson content and
 * revalidate a current source before displaying any previously saved lesson.
 */
import {createHash,randomUUID} from 'node:crypto';
import {hash} from '../workspace/model.mjs';

const ID=/^[a-f0-9]{24}$/;
const SHA=/^[a-f0-9]{64}$/;
const MAX_BYTES=220*1024;
function invalid(){return Object.assign(new TypeError('Invalid fenced lesson save request.'),{status:400});}
function conflict(){return Object.assign(new Error('The reviewed source changed before the lesson could be saved.'),{status:409});}
function ownerKey(uid){
  if(typeof uid!=='string'||!uid.trim()||uid.length>128||/[\u0000-\u001f\u007f]/.test(uid))throw invalid();
  return createHash('sha256').update(uid,'utf8').digest('hex');
}
function owned(snapshot,owner,kind,id){
  if(!snapshot?.exists)throw conflict();
  const row=snapshot.data();
  if(!row||row.ownerKey!==owner||row.kind!==kind||row.id!==id||
     typeof row.version!=='string'||!row.version||
     !row.value||typeof row.value!=='object'||Array.isArray(row.value))throw conflict();
  return row.value;
}
function sourceValid(value,id,revision){
  return value.id===id&&value.reviewed===true&&value.revision===revision&&
    Array.isArray(value.reviewedPages)&&hash(value.reviewedPages)===revision;
}
/**
 * Uses same owners/sha256(uid)/kind/id layout as createLearnerRepository.
 * A source re-review during the transaction invalidates the transaction
 * read and Firestore retries before creating the lesson.
 */
export function createFencedLocalLessonWriter({firestore}={}){
  if(!firestore||typeof firestore.runTransaction!=='function'||
     typeof firestore.collection!=='function')throw new TypeError('Firestore Admin transaction adapter required.');
  async function save(uid,lesson,{signal}={}){
    const owner=ownerKey(uid);
    if(!lesson||typeof lesson!=='object'||Array.isArray(lesson)||
       !ID.test(lesson.id||'')||!ID.test(lesson.sourceId||'')||
       !SHA.test(lesson.revision||'')||lesson.mode!=='local-extractive'||
       typeof lesson.sourceTitle!=='string'||!lesson.sourceTitle.trim())throw invalid();
    let encoded;
    try{encoded=JSON.stringify(lesson);}catch{throw invalid();}
    if(typeof encoded!=='string'||Buffer.byteLength(encoded,'utf8')>MAX_BYTES)throw invalid();
    const value=JSON.parse(encoded);
    signal?.throwIfAborted();
    const root=firestore.collection('owners').doc(owner);
    const head=root.collection('sources').doc(value.sourceId);
    const archived=root.collection('revisions').doc(value.sourceId+'_'+value.revision);
    const target=root.collection('lessons').doc(value.id);
    return firestore.runTransaction(async tx=>{
      signal?.throwIfAborted();
      // All transactional reads occur before first write.
      const headSnapshot=await tx.get(head);
      const archiveSnapshot=await tx.get(archived);
      const current=owned(headSnapshot,owner,'sources',value.sourceId);
      const revision=owned(archiveSnapshot,owner,'revisions',value.sourceId+'_'+value.revision);
      if(!sourceValid(current,value.sourceId,value.revision)||
         !sourceValid(revision,value.sourceId,value.revision)||
         current.title!==value.sourceTitle||
         hash(current.reviewedPages)!==hash(revision.reviewedPages))throw conflict();
      signal?.throwIfAborted();
      const version=randomUUID();
      tx.create(target,{ownerKey:owner,kind:'lessons',id:value.id,value,version});
      return {id:value.id,value,version};
    });
  }
  return Object.freeze({save});
}
