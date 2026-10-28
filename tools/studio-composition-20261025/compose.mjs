/**
 * Read-only GitHub Actions integration rehearsal, not a merge or deployment.
 * All GitHub writes are intentionally absent. The runner uses a throwaway
 * local Git branch and refuses PR head drift or surprising changed paths.
 */
import {execFileSync} from 'node:child_process';
import {appendFile,writeFile} from 'node:fs/promises';
import {CANDIDATES,REPOSITORY,SHA,validateComposedDiff,validateManifest,validatePR} from './manifest.mjs';

export async function githubJSON(path,{token=process.env.GITHUB_TOKEN,fetcher=fetch}={}){
 if(typeof token!=='string'||!token)throw new Error('Missing read-only GitHub token');
 const response=await fetcher('https://api.github.com/repos/'+REPOSITORY+path,{
  headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28','User-Agent':'kairo-studio-composition-ci'},
  signal:AbortSignal.timeout(20000),
 });
 if(!response.ok)throw new Error('GitHub metadata unavailable (HTTP '+response.status+') for '+path);
 return response.json();
}
export async function verifyCandidates({get=githubJSON,candidates=CANDIDATES}={}){
 validateManifest(candidates);
 const report=[];
 for(const candidate of candidates){
  const [pr,files]=await Promise.all([
   get('/pulls/'+candidate.number),
   get('/pulls/'+candidate.number+'/files?per_page=100'),
  ]);
  validatePR(candidate,pr,files);
  report.push({number:candidate.number,headSha:candidate.sha,files:candidate.files.length,
    draft:pr.draft===true,verification:'exact-head-and-file-scope'});
 }
 return report;
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:2*1024*1024}).trim();
export async function composeCandidates({get=githubJSON,candidates=CANDIDATES,runId=process.env.GITHUB_RUN_ID||'local'}={}){
 const verified=await verifyCandidates({get,candidates});
 if(!/^\d{1,20}$/.test(String(runId)))throw new Error('Invalid run ID');
 git('config','user.name','kairo-studio-composition[bot]');
 git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
 git('switch','-c','ci/studio-composition-'+runId);
 git('fetch','--no-tags','origin','main');
 git('merge','--no-ff','--no-edit','origin/main');
 const mainSha=git('rev-parse','origin/main');
 if(!SHA.test(mainSha))throw new Error('Main SHA is invalid');
 const steps=[];
 for(const candidate of candidates){
  // Fetch same-repository PR ref; require the exact SHA verified above.
  git('fetch','--no-tags','origin','refs/pull/'+candidate.number+'/head');
  const fetched=git('rev-parse','FETCH_HEAD');
  if(fetched!==candidate.sha)throw new Error('Candidate moved during fetch: #'+candidate.number);
  const before=git('rev-parse','HEAD');
  git('merge','--no-ff','--no-edit',candidate.sha);
  const changed=git('diff','--name-only','--diff-filter=ACMR',before,'HEAD').split('\n').filter(Boolean);
  validateComposedDiff(candidate,changed);
  steps.push({number:candidate.number,sha:candidate.sha,files:changed.length});
 }
 const report={schema:'kairo-studio-composition/1',status:'synthetic-composition-not-merged',
   mainSha,compositeSha:git('rev-parse','HEAD'),verified,mergedLocally:steps,
   noRemoteWrites:true,independentReview:false,authenticatedEvidence:false,
   realDeviceTesting:false,releaseApproved:false};
 await writeFile('studio-composition-result.json',JSON.stringify(report,null,2)+'\n');
 const summary=['## KAIRO temporary studio PR composition',
  '**Not merged, not deployed, not an independent review.**',
  'Main SHA: `'+mainSha+'`',
  'Temporary composite SHA: `'+report.compositeSha+'`',
  ...steps.map(s=>'- Draft PR #'+s.number+' pinned `'+s.sha.slice(0,12)+'` ('+s.files+' files)'),
  'Tests/build execute in subsequent CI steps; passing composition alone does not verify learner identity, competency, device accessibility or production behaviour.',
 ].join('\n')+'\n';
 if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
 console.log(JSON.stringify(report,null,2));
 return report;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 try{
  const command=process.argv[2];
  if(command==='verify')console.log(JSON.stringify(await verifyCandidates(),null,2));
  else if(command==='compose')await composeCandidates();
  else throw new Error('Usage: node compose.mjs verify|compose');
 }catch(error){console.error('STUDIO COMPOSITION BLOCKED:',error.message);process.exitCode=1;}
}
