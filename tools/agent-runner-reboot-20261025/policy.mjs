import {execFileSync} from 'node:child_process';
import {readFile,writeFile,appendFile,lstat} from 'node:fs/promises';
export const ISSUE=13, PREFIX='tools/kairo-agent-proof-20261025/';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:1<<20});
const names=s=>s.split('\0').filter(Boolean);
const sha=s=>/^[a-f0-9]{40}$/.test(s||'');
export const allowedPath=s=>typeof s==='string'&&s.startsWith(PREFIX)&&s.length>PREFIX.length&&
 /^[a-z0-9._/-]+$/.test(s)&&!s.split('/').some(p=>!p||p==='.'||p==='..')&&!s.endsWith('/');
export function pick({issue,prs=[],runs=[],head,now=Date.now(),runId,runAttempt=1,enabled=false,budgetApproved=false,execute=false}={}){
 if(!enabled||!budgetApproved)return {ok:false,why:'owner_or_budget_switch_off'};
 if(!execute)return {ok:false,why:'dry_run'};
 if(!sha(head))return {ok:false,why:'unverified_main'};
 if(runAttempt!==1)return {ok:false,why:'rerun_disallowed'};
 if(issue?.number!==ISSUE||issue?.state!=='open')return {ok:false,why:'issue_closed_or_missing'};
 const labels=(issue.labels||[]).map(x=>typeof x==='string'?x:x.name);
 if(!labels.includes('agent-approved')||labels.includes('agent-blocked')||labels.includes('do-not-run'))
  return {ok:false,why:'issue_not_approved'};
 if(prs.some(p=>p.state==='open'&&p.head?.ref?.startsWith('agent/kairo-13-')))
  return {ok:false,why:'pending_agent_pr'};
 const recent=runs.filter(r=>r.id!==runId&&['schedule','workflow_dispatch'].includes(r.event)&&
   Date.parse(r.created_at)>now-86400000);
 if(recent.length)return {ok:false,why:'daily_cap'};
 if(!Number.isSafeInteger(runId)||runId<1)return {ok:false,why:'invalid_run_id'};
 return {ok:true,head,branch:'agent/kairo-13-'+runId};
}
export function inspectPatch(patch){
 if(typeof patch!=='string'||!patch||Buffer.byteLength(patch)>81920||patch.includes('\0')||
    /^(GIT binary patch|Binary files)/m.test(patch))throw Error('empty/binary/oversized patch');
 const blocks=patch.split(/^diff --git /m).slice(1);
 if(!blocks.length||blocks.length>8)throw Error('bad file count');
 const paths=[];
 for(const b of blocks){
  const m=/^a\/([^ ]+) b\/([^ ]+)$/.exec(b.split('\n')[0]);
  if(!m||m[1]!==m[2]||!allowedPath(m[1]))throw Error('out-of-scope file');
  if(!b.includes('\nnew file mode 100644\n')||
     !b.includes('\n--- /dev/null\n')||!b.includes('\n+++ b/'+m[1]+'\n')||
     /\n(?:deleted file mode|old mode|new mode 120000|rename from|copy from)/.test(b))
    throw Error('only newly added regular text files accepted');
  if(paths.includes(m[1]))throw Error('duplicate path');
  paths.push(m[1]);
 }
 if((patch.match(/^\+(?!\+\+)/gm)||[]).length>500)throw Error('over 500 added lines');
 return paths;
}
export async function checkIndex(){
 const info=names(git('diff','--cached','--name-status','-z'));
 if(!info.length||info.length%2)throw Error('no staged additions');
 for(let i=0;i<info.length;i+=2)
  if(info[i]!=='A'||!allowedPath(info[i+1]))throw Error('staged unsafe path/status');
 const patch=git('diff','--cached','--binary');
 const paths=inspectPatch(patch);
 if(paths.length!==info.length/2)throw Error('patch path mismatch');
 git('diff','--cached','--check');
 for(const path of paths){
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>32768||
     (await readFile(path)).includes(0))throw Error('unsafe file type/size');
 }
 return patch;
}
export async function makePatch(file){
 const modified=names(git('ls-files','--modified','--deleted','-z'));
 if(modified.length)throw Error('tracked changes prohibited');
 const files=names(git('ls-files','--others','--exclude-standard','-z'))
   .filter(s=>s!=='.kairo-agent/task.md');
 if(!files.length||files.length>8||files.some(f=>!allowedPath(f)))throw Error('invalid untracked files');
 for(const f of files){
  const stat=await lstat(f);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>32768)throw Error('invalid file');
  git('add','--',f);
 }
 await writeFile(file,await checkIndex(),{mode:0o600});
}
async function get(path){
 const token=process.env.GITHUB_TOKEN;
 if(!token)throw Error('GitHub token required');
 const r=await fetch('https://api.github.com/repos/LethaboMH14/KAIRO'+path,{headers:{
   Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}});
 if(!r.ok)throw Error('GitHub API '+r.status);
 return r.json();
}
export async function select(){
 const [issue,prs,runs,ref]=await Promise.all([
  get('/issues/13'),get('/pulls?state=open&per_page=100'),
  get('/actions/workflows/kairo-agent-reboot-20261025.yml/runs?per_page=100'),
  get('/git/ref/heads/main')]);
 const result=pick({issue,prs,runs:runs.workflow_runs||[],head:ref.object?.sha,
   runId:Number(process.env.GITHUB_RUN_ID),runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),
   enabled:process.env.KAIRO_AGENT_ENABLED==='true',budgetApproved:process.env.KAIRO_BUDGET_APPROVED==='true',
   execute:process.env.GITHUB_EVENT_NAME==='schedule'||process.env.KAIRO_EXECUTE==='true'});
 const lines=result.ok?['selected=true','base_sha='+result.head,'branch='+result.branch]:
   ['selected=false','reason='+result.why];
 await appendFile(process.env.GITHUB_OUTPUT,lines.join('\n')+'\n');
 console.log(result.ok?'Bounded coding run selected':'BLOCKED: '+result.why);
}
if(process.argv[1]&&import.meta.url==='file://'+process.argv[1]){
 try{
  const cmd=process.argv[2];
  if(cmd==='select')await select();
  else if(cmd==='create')await makePatch(process.env.KAIRO_PATCH);
  else if(cmd==='inspect')console.log(inspectPatch(await readFile(process.env.KAIRO_PATCH,'utf8')));
  else if(cmd==='verify')console.log(inspectPatch(await checkIndex()));
  else throw Error('unknown command');
 }catch(e){console.error('KAIRO runner blocked: '+e.message);process.exitCode=1;}
}
