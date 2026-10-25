import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,rm,writeFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const patch=fileURLToPath(new URL('./patch.mjs',import.meta.url));
async function repoFixture(){
 const dir=await mkdtemp(join(tmpdir(),'kairo-agent-patch-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'});
 git('init','-q');git('config','user.email','test@invalid.local');git('config','user.name','Test');
 await writeFile(join(dir,'BASELINE'),'unchanged\n');git('add','BASELINE');git('commit','-qm','baseline');
 return {dir,git,dispose:()=>rm(dir,{recursive:true,force:true})};
}
const run=(dir,action,out)=>spawnSync(process.execPath,[patch,action],{cwd:dir,encoding:'utf8',
 env:{...process.env,KAIRO_ISSUE:'49',KAIRO_PATCH:out}});
test('real git patch stages only scoped new files; verifies its own staged diff',async()=>{
 const f=await repoFixture();
 try{
  const dest=join(f.dir,'studio/src/studio-scenarios/pump-what-if');
  await mkdir(dest,{recursive:true});await writeFile(join(dest,'model.ts'),'export const pump = 1;\n');
  const out=join(f.dir,'out.patch');
  const result=run(f.dir,'create',out);
  assert.equal(result.status,0,result.stderr);
  assert.match(await readFile(out,'utf8'),/pump-what-if\/model\.ts/);
  const verify=run(f.dir,'verify',out);assert.equal(verify.status,0,verify.stderr);
 }finally{await f.dispose();}
});
test('real git patch refuses unexpected shared root edits',async()=>{
 const f=await repoFixture();
 try{
  await writeFile(join(f.dir,'BASELINE'),'malicious shared edit\n');
  const r=run(f.dir,'create',join(f.dir,'out.patch'));
  assert.notEqual(r.status,0);assert.match(r.stderr,/Out-of-scope/);
 }finally{await f.dispose();}
});
test('real git patch refuses symlink in task directory',async()=>{
 const f=await repoFixture();
 try{
  const dest=join(f.dir,'studio/src/studio-scenarios/pump-what-if');
  await mkdir(dest,{recursive:true});await symlink(join(f.dir,'BASELINE'),join(dest,'link'));
  const r=run(f.dir,'create',join(f.dir,'out.patch'));
  assert.notEqual(r.status,0);assert.match(r.stderr,/symlink/);
 }finally{await f.dispose();}
});
