import {execFileSync} from 'node:child_process';
import {lstat,readFile,writeFile} from 'node:fs/promises';
import {TASKS,validatePaths} from './policy.mjs';
const git=(args,options={})=>execFileSync('git',args,{cwd:process.cwd(),maxBuffer:2*1024*1024,...options});
const parseZ=buf=>buf.toString('utf8').split('\0').filter(Boolean);
export function filterPatchPaths(paths,task){return validatePaths(task,paths);}
export function patchStats(patch){
 if(patch.length>128*1024)throw new Error('Patch exceeds 128 KiB limit');
 if(patch.includes('\0'))throw new Error('NUL/binary patch not accepted');
 if((patch.match(/^\+(?!\+\+)/gm)||[]).length>900)throw new Error('More than 900 added lines');
 return {size:Buffer.byteLength(patch),additions:(patch.match(/^\+(?!\+\+)/gm)||[]).length};
}
async function create(task,path){
 const all=parseZ(git(['ls-files','--modified','--deleted','--others','--exclude-standard','-z']));
 const changed=[...new Set(all)].filter(x=>x!=='.kairo-agent/task.md');
 if(changed.length===0){await writeFile(path,'');return false;}
 filterPatchPaths(changed,task);
 for(const file of changed){
  const s=await lstat(file).catch(()=>null);
  if(!s||!s.isFile()||s.size>65536)throw new Error('Deleted, symlink or oversized file: '+file);
  const b=await readFile(file);if(b.includes(0))throw new Error('Binary changed file not allowed: '+file);
  git(['add','--',file]);
 }
 const staged=parseZ(git(['diff','--cached','--name-only','-z']));
 filterPatchPaths(staged,task);
 git(['diff','--cached','--check']);
 const patch=git(['diff','--cached','--binary'],{encoding:'utf8'});
 patchStats(patch);
 await writeFile(path,patch,{mode:0o600});return !!patch.trim();
}
async function verify(task){
 const changed=parseZ(git(['diff','--cached','--name-only','-z']));
 filterPatchPaths(changed,task);
 git(['diff','--cached','--check']);
 const p=git(['diff','--cached','--binary'],{encoding:'utf8'});
 patchStats(p);
 return changed;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const task=TASKS[Number(process.env.KAIRO_ISSUE)];
  if(!task)throw new Error('Issue not on reviewed task allowlist');
  const action=process.argv[2];
  if(action==='create'){
   const yes=await create(task,process.env.KAIRO_PATCH||'/tmp/kairo-agent.patch');
   if(process.env.GITHUB_OUTPUT)await (await import('node:fs/promises')).appendFile(process.env.GITHUB_OUTPUT,'has_patch='+(yes?'true':'false')+'\n');
   console.log(yes?'Verified scoped patch prepared':'No scoped changes proposed');
  }else if(action==='verify')console.log('Verified patch files:',await verify(task));
  else throw new Error('Unknown patch action');
 }catch(err){console.error('PATCH REJECTED:',err.message);process.exitCode=1;}
}
