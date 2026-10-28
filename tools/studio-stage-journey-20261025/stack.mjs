/**
 * Fail-closed, read-only composition of pinned studio draft heads.
 * Only ephemeral local Git merges; never pushes, reviews, or deploys.
 */
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';

export const REPOSITORY='LethaboMH14/KAIRO';
export const SHA=/^[a-f0-9]{40}$/;
export const STACK=Object.freeze([
 Object.freeze({number:72,sha:'13c6b970e877e8726b19c51a751cfb6c7a2f6ecc',files:Object.freeze([
  '.github/workflows/studio-composition-20261025.yml',
  'coordination/handoffs/2026-10-25-issue49-studio-composition-gpt6-m.md',
  'tools/studio-composition-20261025/README.md',
  'tools/studio-composition-20261025/compose.mjs',
  'tools/studio-composition-20261025/manifest.mjs',
  'tools/studio-composition-20261025/manifest.test.mjs',
  'tools/studio-composition-20261025/review.mjs',
  'tools/studio-composition-20261025/review.test.mjs',
 ])}),
 Object.freeze({number:78,sha:'dae587a44e2cb07bda16fb6e5e8ba20e5c8ce76c',files:Object.freeze([
  'coordination/handoffs/2026-10-25-issue49-studio-draft-staging-gpt6-n.md',
  'studio/server/studio-draft-staging/README.md',
  'studio/server/studio-draft-staging/index.mjs',
  'studio/tests/studio-draft-staging.test.mjs',
 ])}),
]);
const fail=message=>{throw new Error(message);};
const safePath=p=>typeof p==='string'&&p.length>0&&p.length<=240&&!p.startsWith('/')&&
 !p.includes('\\')&&!p.includes('\0')&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
const equal=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
export function validateStack(stack=STACK){
 if(!Array.isArray(stack)||stack.length!==2)fail('Expected exactly two staged candidate PRs');
 const ids=new Set(),paths=new Set();
 for(const p of stack){
  if(!Number.isSafeInteger(p.number)||p.number<1||ids.has(p.number)||!SHA.test(p.sha))fail('Invalid PR identity or SHA');
  ids.add(p.number);
  if(!Array.isArray(p.files)||p.files.length<1||p.files.length>30)fail('Invalid candidate file count');
  for(const file of p.files){
   if(!safePath(file)||paths.has(file))fail('Unsafe or overlapping candidate path: '+file);
   paths.add(file);
  }
 }
 return true;
}
export function validatePR(candidate,pr,files){
 if(!pr||pr.number!==candidate.number||pr.state!=='open'||pr.merged_at||
    pr.head?.sha!==candidate.sha||pr.head?.repo?.full_name!==REPOSITORY||
    pr.base?.ref!=='main'||pr.base?.repo?.full_name!==REPOSITORY)
  fail('Candidate PR changed state, repository or pinned head: #'+candidate.number);
 if(!Array.isArray(files)||files.length!==candidate.files.length||
    files.some(f=>f.status!=='added'||!safePath(f.filename))||
    !equal(files.map(f=>f.filename).sort(),[...candidate.files].sort()))
  fail('Candidate PR changed exact added-file scope: #'+candidate.number);
 return true;
}
export function validateDiff(candidate,changed){
 if(!Array.isArray(changed)||!equal([...changed].sort(),[...candidate.files].sort()))
  fail('Temporary Git merge changed unexpected files: #'+candidate.number);
 return true;
}
export async function githubJSON(path,{token=process.env.GITHUB_TOKEN,fetcher=fetch}={}){
 if(typeof token!=='string'||!token)fail('Missing read-only GitHub token');
 const response=await fetcher('https://api.github.com/repos/'+REPOSITORY+path,{
  headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28','User-Agent':'kairo-stage-journey-qa'},
  signal:AbortSignal.timeout(20000),
 });
 if(!response.ok)fail('GitHub metadata unavailable (HTTP '+response.status+')');
 return response.json();
}
export async function verifyPinned({get=githubJSON,stack=STACK}={}){
 validateStack(stack);
 for(const candidate of stack){
  const [pr,files]=await Promise.all([get('/pulls/'+candidate.number),get('/pulls/'+candidate.number+'/files?per_page=100')]);
  validatePR(candidate,pr,files);
 }
 return true;
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:2*1024*1024}).trim();
async function mergePinned(candidate){
 git('fetch','--no-tags','origin','refs/pull/'+candidate.number+'/head');
 const fetched=git('rev-parse','FETCH_HEAD');
 if(fetched!==candidate.sha)fail('PR head drift during Git fetch: #'+candidate.number);
 const before=git('rev-parse','HEAD');
 git('merge','--no-ff','--no-edit',candidate.sha);
 const changed=git('diff','--name-only','--diff-filter=ACMRD',before,'HEAD').split('\n').filter(Boolean);
 validateDiff(candidate,changed);
}
export async function compose({runId=process.env.GITHUB_RUN_ID||'0'}={}){
 await verifyPinned();
 if(!/^\d{1,20}$/.test(String(runId)))fail('Invalid workflow run ID');
 git('config','user.name','kairo-stage-journey[bot]');
 git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 git('switch','-c','ci/stage-journey-'+runId);
 git('fetch','--no-tags','origin','main');
 git('merge','--no-ff','--no-edit','origin/main');
 await mergePinned(STACK[0]);
 // PR #72 provides its own separately pinned #55/#64/#68/#70 composition.
 // It verifies those four live PRs again and creates another ephemeral branch.
 const {composeCandidates}=await import('../studio-composition-20261025/compose.mjs');
 const inner=await composeCandidates({runId});
 await mergePinned(STACK[1]);
 const report={schema:'kairo-stage-journey-qa/1',status:'synthetic-composition-only',
  mainSha:inner.mainSha,compositeSha:git('rev-parse','HEAD'),
  candidateHeads:STACK.map(p=>({pr:p.number,sha:p.sha})),
  innerCandidates:inner.verified.map(p=>({pr:p.number,sha:p.headSha})),
  githubWrites:false,independentReview:false,realLearnerEvidence:false,
  realDeviceTesting:false,competencyVerified:false,productionDeployment:false};
 await writeFile('stage-journey-result.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 return report;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const cmd=process.argv[2];
  if(cmd==='verify')console.log(JSON.stringify({pinned:await verifyPinned(),heads:STACK.map(p=>p.sha)}));
  else if(cmd==='compose')await compose();
  else fail('Usage: node stack.mjs verify|compose');
 }catch(e){console.error('STAGE JOURNEY BLOCKED:',e.message);process.exitCode=1;}
}
