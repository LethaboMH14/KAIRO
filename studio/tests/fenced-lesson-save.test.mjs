import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {hash} from '../server/workspace/model.mjs';
import {createFencedLocalLessonWriter} from '../server/learner-repository/fenced-lesson-save.mjs';

const UID='synthetic-owner-a',SID='a'.repeat(24),LID='b'.repeat(24);
const pages=[{locator:'Pasted text, section 1',method:'pasted-text',text:'Synthetic electrical source reference '.repeat(12),edited:false}];
const REV=hash(pages);
const source=()=>({id:SID,title:'Synthetic electricity notes',reviewed:true,reviewedPages:structuredClone(pages),revision:REV});
const lesson=()=>({id:LID,sourceId:SID,sourceTitle:'Synthetic electricity notes',revision:REV,
  mode:'local-extractive',title:'Read electricity',chapters:[],quiz:[]});
const owner=uid=>createHash('sha256').update(uid).digest('hex');

class Snapshot{
  constructor(id,data){this.id=id;this.exists=data!==undefined;this.row=data;}
  data(){return structuredClone(this.row);}
}
class FakeFirestore{
  rows=new Map(); versions=new Map(); beforeCommit=null;
  collection(name){return new Ref(this,name,name);}
  seed(uid,kind,id,value){
    const path='owners/'+owner(uid)+'/'+kind+'/'+id;
    this.rows.set(path,{ownerKey:owner(uid),kind,id,value:structuredClone(value),version:'fixture'});
    this.versions.set(path,(this.versions.get(path)||0)+1);
  }
  async runTransaction(work){
    for(let retry=0;retry<3;retry++){
      const reads=new Map(),writes=[];
      const tx={
        get:async ref=>{
          reads.set(ref.path,this.versions.get(ref.path)||0);
          return new Snapshot(ref.id,this.rows.get(ref.path));
        },
        create:(ref,value)=>writes.push({ref,value:structuredClone(value)}),
      };
      const result=await work(tx);
      if(this.beforeCommit){const fn=this.beforeCommit;this.beforeCommit=null;fn(this);}
      if([...reads].some(([path,version])=>(this.versions.get(path)||0)!==version))continue;
      for(const {ref} of writes)if(this.rows.has(ref.path))
        throw Object.assign(new Error('Already exists'),{status:409});
      for(const {ref,value} of writes){
        this.rows.set(ref.path,value);
        this.versions.set(ref.path,(this.versions.get(ref.path)||0)+1);
      }
      return result;
    }
    throw Object.assign(new Error('Transaction conflict'),{status:409});
  }
}
class Ref{
  constructor(db,path,id){this.db=db;this.path=path;this.id=id;}
  doc(id){return new Ref(this.db,this.path+'/'+id,id);}
  collection(name){return new Ref(this.db,this.path+'/'+name,name);}
}
function fixture(){
  const db=new FakeFirestore();
  db.seed(UID,'sources',SID,source());
  db.seed(UID,'revisions',SID+'_'+REV,source());
  return {db,write:createFencedLocalLessonWriter({firestore:db}),
    saved:()=>db.rows.get('owners/'+owner(UID)+'/lessons/'+LID)};
}

test('atomic source/revision fence saves one private, create-only local lesson',async()=>{
  const f=fixture(),saved=await f.write.save(UID,lesson());
  assert.equal(saved.value.sourceId,SID);
  assert.equal(f.saved().value.revision,REV);
  assert.equal(f.db.rows.has('owners/'+owner('another-owner')+'/lessons/'+LID),false);
  await assert.rejects(()=>f.write.save(UID,lesson()),{status:409});
  assert.equal(f.db.rows.size,3);
});
for(const mutation of ['rereview','revoke','delete-archive']){
  test('transaction rejects '+mutation+' between source read and commit',async()=>{
    const f=fixture();
    f.db.beforeCommit=db=>{
      if(mutation==='delete-archive'){
        const path='owners/'+owner(UID)+'/revisions/'+SID+'_'+REV;
        db.rows.delete(path);
        db.versions.set(path,(db.versions.get(path)||0)+1);
      }else{
        const s=source();
        if(mutation==='revoke')s.reviewed=false;
        else{s.reviewedPages[0].text+=' New review';s.revision=hash(s.reviewedPages);}
        db.seed(UID,'sources',SID,s);
      }
    };
    await assert.rejects(()=>f.write.save(UID,lesson()),{status:409});
    assert.equal(f.saved(),undefined,'no stale lesson write allowed');
  });
}
test('tampered archive owner identity fails closed even with matching review hash',async()=>{
  const f=fixture(),path='owners/'+owner(UID)+'/revisions/'+SID+'_'+REV;
  f.db.rows.get(path).ownerKey=owner('other');
  await assert.rejects(()=>f.write.save(UID,lesson()),{status:409});
  assert.equal(f.saved(),undefined);
});
test('archived pages changed without revision update cannot authorize commit',async()=>{
  const f=fixture(),path='owners/'+owner(UID)+'/revisions/'+SID+'_'+REV;
  f.db.rows.get(path).value.reviewedPages[0].text='Changed without revision update';
  await assert.rejects(()=>f.write.save(UID,lesson()),{status:409});
});
test('foreign owner cannot reuse another owner source or archive',async()=>{
  const f=fixture();
  await assert.rejects(()=>f.write.save('synthetic-foreign-owner',lesson()),{status:409});
  assert.equal(f.saved(),undefined);
});
test('cloud and multi-source versions cannot use local-only transaction',async()=>{
  const f=fixture();
  for(const mode of ['cloud','vertex','cloud-v2','local-extractive-v2'])
    await assert.rejects(()=>f.write.save(UID,{...lesson(),mode}),{status:400});
  assert.equal(f.saved(),undefined);
});
test('bad UID, bad identifier and oversized lesson are rejected',async()=>{
  const f=fixture();
  for(const [uid,l] of [['',lesson()],[UID,{...lesson(),id:'bad'}],
    [UID,{...lesson(),revision:'0'.repeat(64)}],
    [UID,{...lesson(),title:'x'.repeat(220*1024)}]])
    await assert.rejects(()=>f.write.save(uid,l),err=>err.status===400||err.status===409);
  assert.equal(f.saved(),undefined);
});
test('pre-aborted request cannot enter Firestore transaction',async()=>{
  const f=fixture(),ctrl=new AbortController();ctrl.abort();
  await assert.rejects(()=>f.write.save(UID,lesson(),{signal:ctrl.signal}),{name:'AbortError'});
  assert.equal(f.saved(),undefined);
});
test('source title drift fails transactional check with unchanged source revision',async()=>{
  const f=fixture();f.db.seed(UID,'sources',SID,{...source(),title:'Updated title'});
  await assert.rejects(()=>f.write.save(UID,lesson()),{status:409});
});
