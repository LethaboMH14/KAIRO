import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const REPOSITORY='LethaboMH14/KAIRO';
export const NUMBER=55;
export const HEAD='a46838a82e3a564223196e1f270c369207771e90';
export const FILES=Object.freeze([
 'coordination/handoffs/2026-10-25-issue49-pump-what-if-gpt6.md',
 'studio/src/studio-scenarios/pump-what-if/PumpWhatIf.tsx',
 'studio/src/studio-scenarios/pump-what-if/challenge.ts',
 'studio/src/studio-scenarios/pump-what-if/preview.html',
 'studio/src/studio-scenarios/pump-what-if/preview.tsx',
 'studio/src/studio-scenarios/pump-what-if/pump-what-if.css',
 'studio/tests/pump-what-if.test.mjs',
]);
const fail=message=>{throw Error(message);};
const sorted=a=>[...a].sort();
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export function validateCandidate(pr,files){
 if(!pr||pr.number!==NUMBER||pr.state!=='open'||pr.merged_at||
    pr.head?.sha!==HEAD||pr.head?.repo?.full_name!==REPOSITORY||
    pr.base?.ref!=='main'||pr.base?.repo?.full_name!==REPOSITORY)
  fail('Candidate PR #55 state, origin, base or pinned SHA drifted');
 if(!Array.isArray(files)||files.length!==FILES.length||
    files.some(f=>f.status!=='added'||typeof f.filename!=='string')||
    !equal(sorted(files.map(f=>f.filename)),sorted(FILES)))
  fail('Candidate PR #55 file scope drifted');
 return true;
}
export function validateDiff(paths){
 if(!Array.isArray(paths)||!equal(sorted(paths),sorted(FILES)))
  fail('Temporary composition modified unexpected paths');
 return true;
}
async function getJSON(path,{token=process.env.GITHUB_TOKEN,fetcher=fetch}={}){
 if(typeof token!=='string'||!token)fail('Read-only GitHub token unavailable');
 const response=await fetcher('https://api.github.com/repos/'+REPOSITORY+path,{
  headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28','User-Agent':'kairo-pump-replay-fuzz'},
  signal:AbortSignal.timeout(20000),
 });
 if(!response.ok)fail('GitHub metadata HTTP '+response.status);
 return response.json();
}
export async function verifyLive({get=getJSON}={}){
 const [pr,files]=await Promise.all([get('/pulls/55'),get('/pulls/55/files?per_page=100')]);
 return validateCandidate(pr,files);
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:1024*1024}).trim();
export async function compose({runId=process.env.GITHUB_RUN_ID||'0'}={}){
 await verifyLive();
 if(!/^[0-9]{1,20}$/.test(String(runId)))fail('Invalid CI run ID');
 git('config','user.name','kairo-pump-replay-fuzz[bot]');
 git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 git('switch','-c','ci/pump-replay-fuzz-'+runId);
 const before=git('rev-parse','HEAD');
 git('fetch','--no-tags','origin','refs/pull/55/head');
 if(git('rev-parse','FETCH_HEAD')!==HEAD)fail('Candidate changed during Git fetch');
 git('merge','--no-ff','--no-edit',HEAD);
 const changed=git('diff','--name-only','--diff-filter=ACMRD',before,'HEAD').split('\n').filter(Boolean);
 validateDiff(changed);
 const result={schema:'kairo-pump-replay-fuzz/1',status:'pinned-synthetic-test-only',
  candidate:NUMBER,candidateSha:HEAD,compositionSha:git('rev-parse','HEAD'),
  remoteWrites:false,realLearnerEvidence:false,realDeviceTesting:false,
  independentReview:false,productionDeployment:false};
 console.log(JSON.stringify(result));
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv[2]==='verify')console.log(JSON.stringify({verified:await verifyLive(),sha:HEAD}));
  else if(process.argv[2]==='compose')await compose();
  else fail('Usage: node pin.mjs verify|compose');
 }catch(e){console.error('PUMP REPLAY FUZZ BLOCKED:',e.message);process.exitCode=1;}
}
